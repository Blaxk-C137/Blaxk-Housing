# backend/users/models.py

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class User(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('landlord', 'Landlord'),
    )
    SUBSCRIPTION_CHOICES = (
        ('free', 'Free'),
        ('basic', 'Basic'),
        ('pro', 'Pro'),
        ('enterprise', 'Enterprise'),
    )
    SUBSCRIPTION_STATUS_CHOICES = (
        ('active', 'Active'),
        ('trial', 'Trial'),
        ('paused', 'Paused'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
    )

    # Core fields - email is now the primary login field
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    phone = models.CharField(max_length=20, blank=True, null=True, unique=True)

    # Profile fields
    profile_image = models.ImageField(upload_to='profiles/', blank=True, null=True)
    bio = models.TextField(blank=True, null=True)

    # Verification status
    email_verified = models.BooleanField(default=False)
    phone_verified = models.BooleanField(default=False)
    identity_verified = models.BooleanField(default=False)

    # SaaS Subscription fields
    subscription_plan = models.CharField(max_length=20, choices=SUBSCRIPTION_CHOICES, default='free')
    subscription_status = models.CharField(max_length=20, choices=SUBSCRIPTION_STATUS_CHOICES, default='active')
    subscription_start_date = models.DateTimeField(null=True, blank=True)
    subscription_end_date = models.DateTimeField(null=True, blank=True)
    trial_ends_at = models.DateTimeField(null=True, blank=True)

    # Usage limits
    max_listings = models.IntegerField(default=3)
    max_featured_listings = models.IntegerField(default=0)

    # Performance metrics
    response_rate = models.FloatField(default=0)
    avg_response_time = models.IntegerField(default=0)

    # Timestamps
    last_active_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Use email as the login field
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']  # Keep username required for admin compatibility

    def update_last_active(self):
        self.last_active_at = timezone.now()
        self.save(update_fields=['last_active_at'])

    @property
    def is_subscription_active(self):
        if self.subscription_status != 'active':
            return False
        if self.subscription_end_date and self.subscription_end_date < timezone.now():
            return False
        return True

    @property
    def can_create_listing(self):
        if self.role != 'landlord':
            return False
        current_count = self.listings.filter(is_active=True).count()
        return current_count < self.max_listings

    def get_plan_limits(self):
        limits = {
            'free': {'max_listings': 3, 'max_featured': 0, 'analytics_days': 7, 'priority_support': False},
            'basic': {'max_listings': 10, 'max_featured': 1, 'analytics_days': 30, 'priority_support': False},
            'pro': {'max_listings': 50, 'max_featured': 5, 'analytics_days': 90, 'priority_support': True},
            'enterprise': {'max_listings': 999, 'max_featured': 999, 'analytics_days': 365, 'priority_support': True},
        }
        return limits.get(self.subscription_plan, limits['free'])

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.email
