from django.urls import path
from . import views

urlpatterns = [
    path('health', views.HealthView.as_view(), name='health'),
    path('ask', views.AskView.as_view(), name='ask'),
    path('daily-verse', views.DailyVerseView.as_view(), name='daily-verse'),
    path('stories', views.StoriesView.as_view(), name='stories'),
    path('verses', views.VersesView.as_view(), name='verses'),
    path('verses/<str:reference>', views.VerseDetailView.as_view(), name='verse-detail'),
]
