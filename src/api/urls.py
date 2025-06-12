from django.urls import path
from . import views

urlpatterns = [
    path("status/", views.api_status, name="api_status"),
    path("song/list/", views.get_song_list, name="song_list"),
    path("song/<int:song_id>/", views.get_song_by_id, name="get_song_by_id"),
    path("lyrics/<int:song_id>/<str:version>", views.get_mappings, name="get_song_by_id"),
]
