# backend/direct_messages/views.py

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, F
from django.shortcuts import get_object_or_404
from .models import Thread, Message
from .serializers import ThreadSerializer, ThreadDetailSerializer, MessageSerializer
from listings.models import Listing

class IsThreadParticipant(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.user == obj.student or request.user == obj.landlord

class ThreadViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ThreadSerializer

    def get_queryset(self):
        user = self.request.user
        # Ensure we get threads for both students and landlords
        return Thread.objects.filter(
            Q(student=user) | Q(landlord=user)
        ).select_related('listing', 'student', 'landlord').prefetch_related('messages')

    def get_serializer_class(self):
        if self.action == 'retrieve' or self.action == 'create_or_get_thread':
            return ThreadDetailSerializer
        return ThreadSerializer

    def retrieve(self, request, *args, **kwargs):
        thread = self.get_object()
        # Mark messages sent by the OTHER person as read
        thread.messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)

        # Reset unread count for the current user
        if request.user == thread.student:
            thread.student_unread_count = 0
        else:
            thread.landlord_unread_count = 0
        thread.save()

        return super().retrieve(request, *args, **kwargs)

    @action(detail=False, methods=['post'])
    def create_or_get_thread(self, request):
        listing_id = request.data.get('listing_id')
        listing = get_object_or_404(Listing, id=listing_id)

        # Students initiate, but if a thread exists, anyone can "get" it
        if request.user.role == 'student':
            student = request.user
            landlord = listing.landlord
        else:
            # Landlord is viewing their own listing - no meaningful thread to create
            return Response(
                {'error': 'Landlords cannot initiate threads on their own listings.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        thread, created = Thread.objects.get_or_create(
            listing=listing,
            student=student,
            landlord=landlord,
        )

        serializer = ThreadDetailSerializer(thread)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        thread = self.get_object()
        content = request.data.get('content', '').strip()
        if not content:
            return Response({'error': 'Empty message'}, status=400)

        message = Message.objects.create(
            thread=thread,
            sender=request.user,
            content=content
        )

        thread.last_message_preview = content[:100]
        if request.user == thread.student:
            thread.landlord_unread_count = F('landlord_unread_count') + 1
        else:
            thread.student_unread_count = F('student_unread_count') + 1

        thread.save()
        return Response(MessageSerializer(message).data, status=201)

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        thread = self.get_object()
        thread.messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)
        if request.user == thread.student:
            thread.student_unread_count = 0
        else:
            thread.landlord_unread_count = 0
        thread.save()
        serializer = ThreadSerializer(thread, context={'request': request})
        return Response(serializer.data)
