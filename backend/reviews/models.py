# backend/reviews/models.py

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from users.models import User
from listings.models import Listing


class Review(models.Model):
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='reviews')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_given')
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('listing', 'student')  # one review per listing per student

    def __str__(self):
        return f'{self.student.username} → {self.listing.title} ({self.rating}★)'

    @property
    def student_name(self):
        name = f'{self.student.first_name} {self.student.last_name}'.strip()
        return name if name else self.student.username
