# backend/listings/models.py

from django.db import models
from django.utils import timezone
from users.models import User


class Listing(models.Model):
    TOILET_TYPE_CHOICES = [
        ("ensuite", "Ensuite"),
        ("shared", "Shared"),
    ]
    LEASE_TYPE_CHOICES = [
        ("short-term", "Short-term"),
        ("long-term", "Long-term"),
    ]
    WATER_STATUS_CHOICES = [
        ("available", "Available"),
        ("limited", "Limited"),
        ("unavailable", "Unavailable"),
    ]
    STATUS_CHOICES = [
        ("active", "Active"),
        ("paused", "Paused"),
        ("rented", "Rented"),
        ("expired", "Expired"),
    ]

    # Core fields
    landlord = models.ForeignKey(User, on_delete=models.CASCADE, related_name="listings")
    title = models.CharField(max_length=255, default="Unnamed Listing")
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    location = models.CharField(max_length=255)

    # Property details
    water_status = models.CharField(max_length=20, choices=WATER_STATUS_CHOICES)
    toilet_type = models.CharField(max_length=20, choices=TOILET_TYPE_CHOICES)
    lease_type = models.CharField(max_length=20, choices=LEASE_TYPE_CHOICES)
    image = models.ImageField(upload_to='listings/', blank=True, null=True)
    property_type = models.CharField(max_length=100, blank=True, null=True)
    power_status = models.CharField(max_length=50, blank=True, null=True)
    amenities = models.JSONField(default=list, blank=True)
    distance = models.CharField(max_length=100, blank=True, null=True)

    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    featured_until = models.DateTimeField(null=True, blank=True)

    # Analytics fields
    views = models.PositiveIntegerField(default=0)
    unique_views = models.PositiveIntegerField(default=0)
    saves = models.PositiveIntegerField(default=0)
    shares = models.PositiveIntegerField(default=0)
    inquiries = models.PositiveIntegerField(default=0)
    phone_clicks = models.PositiveIntegerField(default=0)
    message_clicks = models.PositiveIntegerField(default=0)

    # Time tracking
    last_viewed_at = models.DateTimeField(null=True, blank=True)
    last_inquiry_at = models.DateTimeField(null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.location}"

    @property
    def conversion_rate(self):
        if self.views == 0:
            return 0
        return round((self.inquiries / self.views) * 100, 2)

    @property
    def engagement_score(self):
        score = 0
        if self.views > 0:
            score += min(self.views / 10, 30)
        if self.saves > 0:
            score += min(self.saves * 5, 25)
        if self.inquiries > 0:
            score += min(self.inquiries * 10, 30)
        if self.shares > 0:
            score += min(self.shares * 3, 15)
        return min(round(score), 100)


class ListingView(models.Model):
    """Track individual views for detailed analytics"""
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='view_records')
    viewer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    referrer = models.URLField(blank=True, null=True)
    viewed_at = models.DateTimeField(auto_now_add=True)
    duration_seconds = models.IntegerField(default=0)

    class Meta:
        ordering = ['-viewed_at']
        indexes = [
            models.Index(fields=['listing', 'viewed_at']),
            models.Index(fields=['viewer', 'viewed_at']),
        ]


class ListingInquiry(models.Model):
    """Track inquiries/leads for each listing"""
    INQUIRY_TYPE_CHOICES = [
        ('message', 'Message'),
        ('phone_call', 'Phone Call'),
        ('email', 'Email'),
        ('whatsapp', 'WhatsApp'),
        ('visit_request', 'Visit Request'),
    ]
    STATUS_CHOICES = [
        ('new', 'New'),
        ('read', 'Read'),
        ('responded', 'Responded'),
        ('converted', 'Converted'),
        ('closed', 'Closed'),
    ]

    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='inquiry_records')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='inquiries_made')
    inquiry_type = models.CharField(max_length=20, choices=INQUIRY_TYPE_CHOICES, default='message')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
