# backend/core/urls.py

from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from listings.views import ListingViewSet
from reviews.views import ReviewViewSet
from direct_messages.views import ThreadViewSet
from django.conf import settings
from django.conf.urls.static import static

from listings.analytics import (
    track_listing_view,
    track_listing_action,
    landlord_analytics,
    listing_analytics,
    my_listings,
    dashboard_summary,
)

router = routers.DefaultRouter()
router.register(r'listings', ListingViewSet, basename='listing')       # ← added basename
router.register(r'reviews', ReviewViewSet, basename='review')          # ← added basename
router.register(r'messages/threads', ThreadViewSet, basename='thread') # ← already had it

urlpatterns = [
    path('admin/', admin.site.urls),

    # Analytics endpoints (before router to take priority)
    path('api/listings/<int:listing_id>/track-view/', track_listing_view, name='track-listing-view'),
    path('api/listings/<int:listing_id>/track-action/', track_listing_action, name='track-listing-action'),
    path('api/listings/<int:listing_id>/analytics/', listing_analytics, name='listing-analytics'),
    path('api/listings/landlord-analytics/', landlord_analytics, name='landlord-analytics'),
    path('api/listings/my-listings/', my_listings, name='my-listings'),
    path('api/listings/dashboard-summary/', dashboard_summary, name='dashboard-summary'),

    # Router URLs
    path('api/', include(router.urls)),
    path('api/users/', include('users.urls')),
    path('api/auth/', include('core.jwt_urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)