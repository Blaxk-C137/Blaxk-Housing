# backend/direct_messages/serializers.py

from rest_framework import serializers
from .models import Thread, Message
from users.models import User


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'thread', 'sender', 'sender_name', 'is_mine', 'content', 'is_read', 'created_at']
        read_only_fields = ['sender', 'created_at']

    def get_sender_name(self, obj):
        name = f'{obj.sender.first_name} {obj.sender.last_name}'.strip()
        return name or obj.sender.username

    def get_is_mine(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.sender == request.user
        return False


class ThreadSerializer(serializers.ModelSerializer):
    """Lightweight thread serializer for the thread list."""
    listing_title = serializers.CharField(source='listing.title', read_only=True)
    listing_price = serializers.DecimalField(source='listing.price', max_digits=10, decimal_places=2, read_only=True)
    listing_location = serializers.CharField(source='listing.location', read_only=True)
    other_party_name = serializers.SerializerMethodField()
    other_party_id = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Thread
        fields = [
            'id', 'listing', 'listing_title', 'listing_price', 'listing_location',
            'student', 'landlord', 'other_party_name', 'other_party_id',
            'last_message_preview', 'unread_count', 'created_at', 'updated_at',
        ]

    def get_other_party_name(self, obj):
        request = self.context.get('request')
        if not request:
            return ''
        user = request.user
        other = obj.landlord if user == obj.student else obj.student
        name = f'{other.first_name} {other.last_name}'.strip()
        return name or other.username

    def get_other_party_id(self, obj):
        request = self.context.get('request')
        if not request:
            return None
        user = request.user
        return obj.landlord.id if user == obj.student else obj.student.id

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request:
            return 0
        return obj.get_unread_count_for(request.user)


class ThreadDetailSerializer(ThreadSerializer):
    """Full thread serializer including all messages."""
    messages = MessageSerializer(many=True, read_only=True)

    class Meta(ThreadSerializer.Meta):
        fields = ThreadSerializer.Meta.fields + ['messages']
