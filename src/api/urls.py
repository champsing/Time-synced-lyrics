from django.urls import path
from . import views

urlpatterns = [
    path("", views.api_root, name="api_root"),
    path("status/", views.api_status, name="api_status"),
    path("songs/", views.get_songs_list, name="song_list"),
    path("songs/<int:song_id>/", views.get_song_by_id, name="get_song_by_id"),
    path("artists/", views.get_artists_batch, name="get_artist_batch"),
]
