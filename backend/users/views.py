# backend/users/views.py

from rest_framework import permissions, status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'role', 'phone', 'bio', 'profile_image',
            'email_verified', 'subscription_plan', 'subscription_status',
            'max_listings', 'created_at',
        ]
        read_only_fields = ['id', 'email', 'created_at']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['email', 'password', 'first_name', 'last_name', 'role', 'phone']

    def validate_email(self, value):
        value = value.lower().strip()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value

    def validate_phone(self, value):
        if value:
            existing = User.objects.filter(phone=value).exists()
            if existing:
                raise serializers.ValidationError('This phone number is already in use.')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        email = validated_data['email']

        # Generate unique username safely to avoid UNIQUE constraint failures
        base_username = email.split('@')[0]
        username = base_username
        counter = 1

        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        user = User(**validated_data)
        user.username = username
        user.set_password(password)

        if validated_data.get('role') == 'landlord':
            user.max_listings = 3

        user.save()
        return user


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register(request):
    # Normalize common frontend key variations (camelCase -> snake_case)
    incoming = request.data if isinstance(request.data, dict) else dict(request.data)
    normalized = {
        'email': incoming.get('email') or incoming.get('Email'),
        'password': incoming.get('password') or incoming.get('pass') or incoming.get('Password'),
        'first_name': incoming.get('first_name') or incoming.get('firstName') or incoming.get('firstName'),
        'last_name': incoming.get('last_name') or incoming.get('lastName') or incoming.get('lastName'),
        'role': incoming.get('role') or incoming.get('Role'),
        'phone': incoming.get('phone') or incoming.get('Phone'),
    }
    # Remove None values so serializer can apply defaults/validators
    normalized = {k: v for k, v in normalized.items() if v is not None}
    serializer = RegisterSerializer(data=normalized)
    if serializer.is_valid():
        try:
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({
                'error': 'Registration failed',
                'detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    # Log failing payload and errors for easier debugging
    try:
        print('Registration failed. Data:', request.data)
        print('Serializer errors:', serializer.errors)
    except Exception:
        pass
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def me(request):
    if request.method == 'GET':
        return Response(UserSerializer(request.user).data)

    serializer = UserSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
