from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.db import close_old_connections
from rest_framework_simplejwt.authentication import JWTAuthentication

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        close_old_connections()
        query_string = scope.get('query_string', b'').decode('utf-8')
        token = None
        params = parse_qs(query_string)
        if 'token' in params:
            token = params.get('token')[0]

        if token:
            try:
                validated_token = JWTAuthentication().get_validated_token(token)
                user = await database_sync_to_async(JWTAuthentication().get_user)(validated_token)
                scope['user'] = user
            except Exception:
                scope['user'] = AnonymousUser()
        else:
            scope['user'] = AnonymousUser()

        return await super().__call__(scope, receive, send)
