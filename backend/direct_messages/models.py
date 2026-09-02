# backend/direct_messages/models.py

from django.db import models
from users.models import User
from listings.models import Listing


class Thread(models.Model):
    """A conversation thread between a student and a landlord about a listing."""
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='threads')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='student_threads')
    landlord = models.ForeignKey(User, on_delete=models.CASCADE, related_name='landlord_threads')
    last_message_preview = models.CharField(max_length=200, blank=True, null=True)
    student_unread_count = models.IntegerField(default=0)
    landlord_unread_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('listing', 'student', 'landlord')
        ordering = ['-updated_at']

    def __str__(self):
        return f'{self.student} ↔ {self.landlord} | {self.listing.title[:30]}'

    def get_unread_count_for(self, user):
        if user == self.student:
            return self.student_unread_count
        return self.landlord_unread_count


class Message(models.Model):
    """A single message in a thread."""
    thread = models.ForeignKey(Thread, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_msgs')
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'{self.sender.first_name}: {self.content[:40]}'
