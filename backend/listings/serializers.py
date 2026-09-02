# backend/listings/serializers.py

from rest_framework import serializers
from .models import Listing
from reviews.models import Review
from django.db.models import Avg, Count


class ListingSerializer(serializers.ModelSerializer):
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    landlord_name = serializers.SerializerMethodField()
    landlord_phone = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = [
            'id',
            'landlord',
            'title',
            'description',
            'price',
            'location',
            'water_status',
            'toilet_type',
            'lease_type',
            'image',
            'property_type',
            'power_status',
            'amenities',
            'distance',
            'status',
            'is_active',
            'is_featured',
            'featured_until',
            'views',
            'unique_views',
            'saves',
            'shares',
            'inquiries',
            'phone_clicks',
            'message_clicks',
            'last_viewed_at',
            'last_inquiry_at',
            'created_at',
            'updated_at',
            'published_at',
            'expires_at',
            'landlord_name',
            'landlord_phone',
            'avg_rating',
            'review_count',
        ]
        read_only_fields = [
            'id',
            'landlord',
            'is_active',      # ← Make read-only (set by backend only)
            'status',         # ← Make read-only (set by backend only)
            'views',
            'unique_views',
            'saves',
            'shares',
            'inquiries',
            'phone_clicks',
            'message_clicks',
            'created_at',
            'updated_at',
            'last_viewed_at',
            'last_inquiry_at',
            'published_at',
        ]

    def get_avg_rating(self, obj):
        result = Review.objects.filter(listing=obj).aggregate(avg=Avg('rating'))
        return round(result['avg'] or 0, 1)

    def get_review_count(self, obj):
        return Review.objects.filter(listing=obj).count()

    def get_landlord_name(self, obj):
        try:
            return obj.landlord.get_full_name() or obj.landlord.email
        except Exception:
            return None

    def get_landlord_phone(self, obj):
        try:
            return obj.landlord.phone
        except Exception:
            return None