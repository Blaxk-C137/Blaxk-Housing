# backend/listings/analytics.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.core.cache import cache
from django.db.models import Sum, Avg, Count, F
from django.db.models.functions import TruncDate
from datetime import timedelta

from .models import Listing
from .serializers import ListingSerializer
from reviews.models import Review


@api_view(['POST'])
@permission_classes([AllowAny])
def track_listing_view(request, listing_id):
    try:
        listing = Listing.objects.get(id=listing_id)
    except Listing.DoesNotExist:
        return Response({'error': 'Listing not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.user and request.user.is_authenticated:
        viewer_key = f'user:{request.user.id}'
    else:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            viewer_key = f'ip:{x_forwarded_for.split(",")[0].strip()}'
        else:
            viewer_key = f'ip:{request.META.get("REMOTE_ADDR", "unknown")}'

    cache_key = f'listing_view_{listing.id}_{viewer_key}'
    if not cache.get(cache_key):
        listing.views = F('views') + 1
        listing.last_viewed_at = timezone.now()
        listing.save(update_fields=['views', 'last_viewed_at'])
        cache.set(cache_key, True, timeout=60)
        tracked = True
    else:
        tracked = False

    listing.refresh_from_db()
    return Response({'id': listing.id, 'views': listing.views, 'last_viewed_at': listing.last_viewed_at, 'tracked': tracked})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def landlord_analytics(request):
    user = request.user
    if not hasattr(user, 'role') or user.role != 'landlord':
        return Response({'error': 'Only landlords can access analytics'}, status=status.HTTP_403_FORBIDDEN)

    try:
        days = int(request.query_params.get('days', 30))
        days = min(max(days, 1), 365)
    except (ValueError, TypeError):
        days = 30

    start_date = timezone.now() - timedelta(days=days)
    listings_qs = Listing.objects.filter(landlord=user)
    active_count = listings_qs.filter(is_active=True).count() if hasattr(Listing, 'is_active') else listings_qs.count()

    view_stats = listings_qs.aggregate(
        total_views=Sum('views'),
        total_unique_views=Sum('unique_views'),
        total_saves=Sum('saves'),
        total_shares=Sum('shares'),
        total_inquiries=Sum('inquiries'),
        total_phone_clicks=Sum('phone_clicks'),
        total_message_clicks=Sum('message_clicks'),
    )
    review_stats = Review.objects.filter(listing__landlord=user).aggregate(
        avg_rating=Avg('rating'), total_reviews=Count('id'),
    )
    top_listings = list(listings_qs.order_by('-views')[:5].values('id', 'title', 'views', 'price', 'location', 'created_at'))
    for l in top_listings:
        l['price'] = str(l['price']) if l['price'] else '0'

    total_views = view_stats['total_views'] or 0
    total_inquiries = view_stats['total_inquiries'] or 0
    conversion_rate = round((total_inquiries / total_views * 100), 2) if total_views > 0 else 0
    total_revenue = listings_qs.aggregate(total=Sum('price'))['total'] or 0
    subscription_plan = getattr(user, 'subscription_plan', 'free')
    max_listings = getattr(user, 'max_listings', 10)

    return Response({
        'overview': {
            'total_listings': listings_qs.count(),
            'active_listings': active_count,
            'total_views': total_views,
            'total_unique_views': view_stats['total_unique_views'] or 0,
            'total_saves': view_stats['total_saves'] or 0,
            'total_shares': view_stats['total_shares'] or 0,
            'total_inquiries': total_inquiries,
            'total_phone_clicks': view_stats['total_phone_clicks'] or 0,
            'total_message_clicks': view_stats['total_message_clicks'] or 0,
            'avg_rating': round(review_stats['avg_rating'] or 0, 1),
            'total_reviews': review_stats['total_reviews'] or 0,
            'conversion_rate': conversion_rate,
            'total_revenue': str(total_revenue),
        },
        'top_listings': top_listings,
        'subscription': {
            'plan': subscription_plan,
            'status': getattr(user, 'subscription_status', 'active'),
            'listings_used': listings_qs.count(),
            'listings_limit': max_listings,
        },
        'period': {'days': days, 'start_date': start_date.isoformat(), 'end_date': timezone.now().isoformat()},
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_listings(request):
    user = request.user
    if not hasattr(user, 'role') or user.role != 'landlord':
        return Response({'error': 'Only landlords can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)
    listings = Listing.objects.filter(landlord=user).order_by('-created_at')
    serializer = ListingSerializer(listings, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def track_listing_action(request, listing_id):
    try:
        listing = Listing.objects.get(id=listing_id)
    except Listing.DoesNotExist:
        return Response({'error': 'Listing not found'}, status=status.HTTP_404_NOT_FOUND)

    action_type = request.data.get('action')
    action_field_map = {'save': 'saves', 'share': 'shares', 'phone_click': 'phone_clicks', 'message_click': 'message_clicks'}
    if action_type not in action_field_map:
        return Response({'error': f'Invalid action. Must be one of: {list(action_field_map.keys())}'}, status=status.HTTP_400_BAD_REQUEST)

    field_name = action_field_map[action_type]
    if not hasattr(listing, field_name):
        return Response({'error': f'Action tracking for "{action_type}" is not supported'}, status=status.HTTP_400_BAD_REQUEST)

    setattr(listing, field_name, F(field_name) + 1)
    listing.save(update_fields=[field_name])
    listing.refresh_from_db()
    return Response({'success': True, 'action': action_type, 'count': getattr(listing, field_name)})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listing_analytics(request, listing_id):
    try:
        listing = Listing.objects.get(id=listing_id)
    except Listing.DoesNotExist:
        return Response({'error': 'Listing not found'}, status=status.HTTP_404_NOT_FOUND)

    if listing.landlord != request.user:
        return Response({'error': 'You can only view analytics for your own listings'}, status=status.HTTP_403_FORBIDDEN)

    review_stats = Review.objects.filter(listing=listing).aggregate(avg_rating=Avg('rating'), total_reviews=Count('id'))
    return Response({
        'listing': {'id': listing.id, 'title': listing.title, 'status': listing.status, 'created_at': listing.created_at},
        'stats': {
            'views': listing.views, 'unique_views': listing.unique_views,
            'saves': listing.saves, 'shares': listing.shares,
            'inquiries': listing.inquiries, 'phone_clicks': listing.phone_clicks,
            'message_clicks': listing.message_clicks,
            'conversion_rate': listing.conversion_rate, 'engagement_score': listing.engagement_score,
        },
        'reviews': {'avg_rating': round(review_stats['avg_rating'] or 0, 1), 'total_reviews': review_stats['total_reviews'] or 0},
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):
    user = request.user
    if user.role != 'landlord':
        return Response({'error': 'Only landlords can access dashboard summary'}, status=status.HTTP_403_FORBIDDEN)
    listings = Listing.objects.filter(landlord=user)
    return Response({
        'total_listings': listings.count(),
        'total_views': listings.aggregate(v=Sum('views'))['v'] or 0,
        'avg_rating': round(Review.objects.filter(listing__landlord=user).aggregate(a=Avg('rating'))['a'] or 0, 1),
    })
