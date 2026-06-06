import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .models import Message
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_anonymous:
            await self.close()
        else:
            self.room_group_name = f"chat_{self.user.id}"
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.channel_layer.group_add('chat_presence', self.channel_name)
            await self.accept()
            await self.send_presence_update(online=True)

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            await self.channel_layer.group_discard('chat_presence', self.channel_name)
        await self.send_presence_update(online=False)

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')

        if action == 'read_message':
            message_id = data.get('message_id')
            if message_id:
                sender_id = await self.mark_as_read(message_id)
                if sender_id:
                    await self.channel_layer.group_send(
                        f"chat_{sender_id}",
                        {
                            'type': 'message_status',
                            'message_id': message_id,
                            'status': 'READ',
                        }
                    )
            return

        if action == 'typing':
            receiver_id = data.get('receiver_id')
            if receiver_id:
                await self.channel_layer.group_send(
                    f"chat_{receiver_id}",
                    {
                        'type': 'typing_indicator',
                        'sender_id': self.user.id,
                        'typing': True,
                    }
                )
            return

        message = data.get('message')
        receiver_id = data.get('receiver_id')
        if not message or not receiver_id:
            return

        saved_msg = await self.save_message(self.user.id, receiver_id, message)

        await self.channel_layer.group_send(
            f"chat_{receiver_id}",
            {
                'type': 'chat_message',
                'message': message,
                'sender_id': self.user.id,
                'receiver_id': receiver_id,
                'timestamp': str(saved_msg.timestamp),
                'message_id': saved_msg.id,
                'status': saved_msg.status,
            }
        )

        await self.mark_as_delivered(saved_msg.id)
        await self.channel_layer.group_send(
            f"chat_{self.user.id}",
            {
                'type': 'message_status',
                'message_id': saved_msg.id,
                'status': 'DELIVERED',
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    async def send_presence_update(self, online=True):
        await self.channel_layer.group_send(
            'chat_presence',
            {
                'type': 'presence_update',
                'user_id': self.user.id,
                'online': online,
                'last_seen': timezone.now().isoformat() if not online else None,
            }
        )

    async def presence_update(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def save_message(self, sender_id, receiver_id, content):
        sender = User.objects.get(id=sender_id)
        receiver = User.objects.get(id=receiver_id)
        return Message.objects.create(sender=sender, receiver=receiver, content=content)

    @database_sync_to_async
    def mark_as_delivered(self, message_id):
        try:
            msg = Message.objects.get(id=message_id)
            msg.status = 'DELIVERED'
            msg.delivered_at = timezone.now()
            msg.save(update_fields=['status', 'delivered_at'])
        except Message.DoesNotExist:
            pass

    async def message_status(self, event):
        await self.send(text_data=json.dumps(event))

    async def typing_indicator(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def mark_as_read(self, message_id):
        try:
            msg = Message.objects.get(id=message_id)
            msg.status = 'READ'
            msg.is_read = True
            msg.read_at = timezone.now()
            msg.save(update_fields=['status', 'is_read', 'read_at'])
            return msg.sender_id
        except Message.DoesNotExist:
            return None
