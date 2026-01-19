# -*- coding: utf-8 -*-
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework import status
from django.views.decorators.cache import cache_control
from utils.get_system_info import get_system_uptime, get_version_number
from database.fing_song import find_song_by_id, export_song_list
from database.find_artist import find_artists_by_ids
from django.http import JsonResponse
from database.find_artist import find_artists_by_ids


@api_view(["GET"])
def api_root(request):
    return Response(
        {
            "songs": reverse("song-list", request=request),
            "mappings": reverse("mapping-list", request=request),
            "status": reverse("api-status", request=request),
        }
    )


@api_view(["GET"])
@cache_control(max_age=0, no_cache=True, no_store=True, must_revalidate=True)
def api_status(request):
    return Response(
        {
            "status": "operational",
            "version": get_version_number(),
            "uptime": get_system_uptime(),
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
def get_songs_list(request):
    from django.core.cache import cache

    # 從songs/<song_id>.json讀取歌曲列表
    # 嘗試從緩存獲取
    cache_key = f"song_list"
    cached_data = cache.get(cache_key)

    if cached_data:
        return Response(cached_data)

    # 緩存未命中，讀取文件
    try:
        song_list_data = export_song_list()

        # 存入緩存（10 mins）
        cache.set(cache_key, song_list_data, 60 * 10)

        return Response(song_list_data)
    except Exception as e:
        # 記錄錯誤日誌（生產環境）
        return Response(
            {"error": "Internal server error", "detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def get_song_by_id(request, song_id):
    from django.core.cache import cache

    # 從songs/<song_id>.json讀取歌曲列表
    # 嘗試從緩存獲取
    cache_key = f"song_{song_id}"
    cached_data = cache.get(cache_key)

    if cached_data:
        return Response(cached_data)

    # 緩存未命中，讀取文件
    try:
        song_data = find_song_by_id(song_id)

        # 存入緩存（10 mins）
        cache.set(cache_key, song_data, 60 * 10)

        return Response(song_data)

    except Exception as e:
        # 記錄錯誤日誌（生產環境）
        return Response(
            {"error": "Internal server error", "detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

@api_view(["GET"])
def get_artists_batch(request):
    # 支援 ?ids=1,2,3 或 ?id=1
    ids_raw = request.GET.get('ids') or request.GET.get('id', '')
    
    if not ids_raw:
        return JsonResponse({})

    try:
        # 將字串 "1,2,3" 轉換成整數列表 [1, 2, 3]
        ids_list = [int(x.strip()) for x in str(ids_raw).split(',') if x.strip()]
        
        # 呼叫你寫好的 find_artists_by_ids
        artists_data = find_artists_by_ids(ids_list)
        
        return JsonResponse(artists_data)
    except ValueError:
        return JsonResponse({"error": "ID 格式錯誤"}, status=400)

