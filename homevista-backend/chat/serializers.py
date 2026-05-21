from rest_framework import serializers
from .models import Message
from users.serializers import UserSerializer

class MessageSerializer(serializers.ModelSerializer):
    sender_details = UserSerializer(source='sender', read_only=True)
    receiver_details = UserSerializer(source='receiver', read_only=True)

    class Meta:
        model = Message
        fields = '__all__'
        read_only_fields = ('sender', 'timestamp')
