# backend/core/jwt_urls.py

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from users.views import UserSerializer
from django.contrib.auth import authenticate


class CustomTokenObtainSerializer(TokenObtainPairSerializer):
    # Accept either email or username for login
    email = serializers.EmailField(required=False)
    username = serializers.CharField(required=False)

    def validate(self, attrs):
        password = attrs.get("password")
        login_value = attrs.get("email") or attrs.get("username")

        if not login_value or not password:
            raise serializers.ValidationError("Email/username and password are required.")

        # Authenticate with either email or username
        user = authenticate(
            request=self.context.get("request"),
            username=login_value,
            password=password
        )

        if user is None:
            raise serializers.ValidationError("Invalid login credentials.")

        # Generate tokens
        refresh = self.get_token(user)

        # Return consistent response format your frontend expects
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        }
        return data


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainSerializer


class LogoutView(APIView):
    """Blacklist the session's refresh token so a signed-out user's
    tokens can no longer mint new access tokens."""
    permission_classes = [AllowAny]

    def post(self, request):
        refresh = request.data.get('refresh')
        if not refresh:
            return Response(
                {'detail': 'Refresh token required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            RefreshToken(refresh).blacklist()
        except Exception:
            # Already expired, invalid, or blacklisted — nothing to revoke.
            return Response({'detail': 'Already logged out.'})
        return Response({'detail': 'Successfully logged out.'})


urlpatterns = [
    path('login/', LoginView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='token_logout'),
]
