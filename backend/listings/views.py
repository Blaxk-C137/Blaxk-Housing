# backend/listings/views.py

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.core.cache import cache
from django.db.models import Sum, Avg, Count, Q, F

from .models import Listing, ListingView, ListingInquiry
from .serializers import ListingSerializer
from reviews.models import Review


class ListingViewSet(viewsets.ModelViewSet):
    serializer_class = ListingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        queryset = Listing.objects.select_related('landlord').order_by('-created_at')

        # If landlord is viewing their own listings via my_listings action
        if self.action == 'my_listings':
            return queryset.filter(landlord=user)

        # For list view (public browsing), only show active listings
        if self.action == 'list':
            queryset = queryset.filter(is_active=True, status='active')
            print(f"📋 PUBLIC LIST - Showing {queryset.count()} active listings")  # Debug

        # Filters
        landlord_id = self.request.query_params.get('landlord')
        if landlord_id:
            queryset = queryset.filter(landlord_id=landlord_id)

        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        location = self.request.query_params.get('location')
        if location:
            queryset = queryset.filter(location__icontains=location)

        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        return queryset

    def create(self, request, *args, **kwargs):
        """Only landlords can create listings"""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if not hasattr(request.user, 'role') or request.user.role != 'landlord':
            return Response(
                {'error': 'Only landlords can create listings'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            
            # Log the created listing for debugging
            listing = serializer.instance
            print(f"✅ LISTING CREATED: ID={listing.id}, is_active={listing.is_active}, status={listing.status}")
            
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        
        print("❌ VALIDATION ERRORS:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def perform_create(self, serializer):
        """Auto-assign landlord and ensure proper defaults"""
        serializer.save(
            landlord=self.request.user,
            is_active=True,        # ← Explicitly set
            status='active',       # ← Explicitly set
            published_at=timezone.now()  # ← Mark as published
        )

    def update(self, request, *args, **kwargs):
        """Only listing owner can update"""
        listing = self.get_object()
        if listing.landlord != request.user:
            return Response(
                {'error': 'You can only edit your own listings'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Only listing owner can delete"""
        listing = self.get_object()
        if listing.landlord != request.user:
            return Response(
                {'error': 'You can only delete your own listings'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'], permission_classes=[permissions.AllowAny])
    def track_view(self, request, pk=None):
        """Track a listing view with rate limiting"""
        try:
            listing = self.get_object()
        except Exception:
            return Response(
                {'error': 'Listing not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        viewer = request.user if request.user.is_authenticated else None
        ip_address = (
            request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip()
            or request.META.get('REMOTE_ADDR', '')
        )
        user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]
        raw_referrer = request.META.get('HTTP_REFERER', '')
        referrer = raw_referrer[:200] if raw_referrer else None

        cache_key = f'view_{listing.id}_{viewer.id if viewer else ip_address}'
        is_new_view = not cache.get(cache_key)

        if is_new_view:
            listing.views = F('views') + 1
            listing.last_viewed_at = timezone.now()

            unique_cache_key = f'unique_view_{listing.id}_{viewer.id if viewer else ip_address}'
            if not cache.get(unique_cache_key):
                listing.unique_views = F('unique_views') + 1
                cache.set(unique_cache_key, True, timeout=86400)

            listing.save(update_fields=['views', 'unique_views', 'last_viewed_at'])

            try:
                ListingView.objects.create(
                    listing=listing,
                    viewer=viewer,
                    ip_address=ip_address or None,
                    user_agent=user_agent,
                    referrer=referrer,
                )
            except Exception:
                pass

            cache.set(cache_key, True, timeout=60)

        listing.refresh_from_db()
        return Response({
            'id': listing.id,
            'views': listing.views,
            'unique_views': listing.unique_views,
            'last_viewed_at': listing.last_viewed_at,
            'tracked': is_new_view,
        })

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def track_action(self, request, pk=None):
        """Track user actions on a listing"""
        try:
            listing = self.get_object()
        except Exception:
            return Response(
                {'error': 'Listing not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        action_type = request.data.get('action')
        valid_actions = ['save', 'share', 'phone_click', 'message_click', 'inquiry']

        if action_type not in valid_actions:
            return Response(
                {'error': f'Invalid action. Must be one of: {valid_actions}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        update_fields = []

        if action_type == 'save':
            listing.saves = F('saves') + 1
            update_fields = ['saves']
        elif action_type == 'share':
            listing.shares = F('shares') + 1
            update_fields = ['shares']
        elif action_type == 'phone_click':
            listing.phone_clicks = F('phone_clicks') + 1
            update_fields = ['phone_clicks']
        elif action_type == 'message_click':
            listing.message_clicks = F('message_clicks') + 1
            update_fields = ['message_clicks']
        elif action_type == 'inquiry':
            listing.inquiries = F('inquiries') + 1
            listing.last_inquiry_at = timezone.now()
            update_fields = ['inquiries', 'last_inquiry_at']

            try:
                ListingInquiry.objects.create(
                    listing=listing,
                    student=request.user,
                    inquiry_type=request.data.get('inquiry_type', 'message'),
                    message=request.data.get('message', ''),
                )
            except Exception:
                pass

        if update_fields:
            listing.save(update_fields=update_fields)

        listing.refresh_from_db()
        return Response({'success': True, 'action': action_type})

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_listings(self, request):
        """Get all listings for the current landlord"""
        if not hasattr(request.user, 'role') or request.user.role != 'landlord':
            return Response(
                {'error': 'Only landlords can access this endpoint'},
                status=status.HTTP_403_FORBIDDEN
            )
        listings = Listing.objects.filter(
            landlord=request.user
        ).order_by('-created_at')
        serializer = self.get_serializer(listings, many=True)
        return Response(serializer.data)