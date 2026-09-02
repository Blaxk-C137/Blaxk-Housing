# backend/reviews/views.py

from rest_framework import viewsets, permissions, serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'listing', 'student', 'student_name', 'rating', 'comment', 'created_at']
        read_only_fields = ['student', 'created_at']

    def get_student_name(self, obj):
        return obj.student_name

    def validate(self, attrs):
        request = self.context.get('request')
        user = request.user if request else None
        listing = attrs.get('listing')
        if user and listing:
            # Prevent duplicate review by same student on the same listing
            if Review.objects.filter(listing=listing, student=user).exists():
                raise serializers.ValidationError('You have already reviewed this listing.')
        return attrs


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all().order_by('-created_at')
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = Review.objects.all().order_by('-created_at')
        listing_id = self.request.query_params.get('listing')
        student_id = self.request.query_params.get('student')
        if listing_id:
            qs = qs.filter(listing_id=listing_id)
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs

    def perform_create(self, serializer):
        try:
            serializer.save(student=self.request.user)
        except Exception as e:
            from django.db import IntegrityError
            from rest_framework.exceptions import ValidationError as DRFValidationError
            if isinstance(e, IntegrityError):
                raise DRFValidationError('You have already reviewed this listing.')
            raise
