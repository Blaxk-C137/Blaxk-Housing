# backend/users/urls.py

from django.urls import path
from .views import register, me

urlpatterns = [
    path('register/', register, name='user-register'),
    path('me/', me, name='user-me'),
]
