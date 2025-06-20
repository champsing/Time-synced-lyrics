# -*- coding: utf-8 -*-
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework import status
from django.views.decorators.cache import cache_page, cache_control
from utils.get_system_info import get_system_uptime, get_version_number
from database.fing_song import find_song_by_id, export_song_list

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
@cache_page(60 * 30)  # 緩存30分鐘
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

        # 存入緩存（半天）
        cache.set(cache_key, song_list_data, 60 * 60 * 12)

        return Response(song_list_data)
    except Exception as e:
        # 記錄錯誤日誌（生產環境）
        return Response(
            {"error": "Internal server error", "detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@cache_page(60 * 60 * 2)  # 緩存2小時
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

        # 存入緩存（1小時）
        cache.set(cache_key, song_data, 60 * 60)

        return Response(song_data)

    except Exception as e:
        # 記錄錯誤日誌（生產環境）
        return Response(
            {"error": "Internal server error", "detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# @api_view(["GET"])
# @cache_page(60 * 10)  # 緩存10分鐘
# def get_mappings(request, song_id, version):
#     from django.core.cache import cache

#     # 從songs/<song_id>.json讀取歌曲列表
#     # 嘗試從緩存獲取
#     cache_key = f"mapping_{song_id}_{version}"
#     cached_data = cache.get(cache_key)

#     if cached_data:
#         return Response(cached_data)

#     # 緩存未命中，讀取文件
#     try:
#         song_data = find_song_by_id(song_id)
#         song_folder = song_data["folder"]
#         song_duration = 0

#         for v in song_data["versions"]:
#             if v["version"] == version:
#                 song_duration = parse_time_format_to_second(v["duration"])
#                 break
#             else:  # 如果沒有找到符合版本，使用預設版本
#                 for v in song_data["versions"]:
#                     if v.get("default"):
#                         song_duration = parse_time_format_to_second(v["duration"])
#                         break
#                 else:  # 如果沒有預設版本，使用第一個版本
#                     if song_data["versions"]:
#                         song_duration = parse_time_format_to_second(
#                             song_data["versions"][0]["duration"]
#                         )

#         # 如果沒有資料夾字段
#         if not song_folder:
#             return Response(
#                 {"error": "Song folder not found"},
#                 status=status.HTTP_404_NOT_FOUND,
#             )

#         if settings.DEBUG:
#             mapping = (
#                 Path(settings.SOURCE_DIR) / "mappings" / song_folder / f"{version}.json"
#             )
#         else:
#             mapping = Path(settings.STATIC_ROOT) / song_folder / f"{version}.json"

#         # 如果找不到mapping文件
#         if not mapping.exists():
#             return Response(
#                 {"error": "Song mapping file not found"},
#                 status=status.HTTP_404_NOT_FOUND,
#             )

#         with open(mapping, "r", encoding="utf-8") as mf:
#             requested_mapping = json.load(mf)

#         # 存入緩存（1小時）
#         cache.set(cache_key, requested_mapping, 60 * 60)

#         parsed_mapping = parse_lyrics(requested_mapping, song_data, song_duration)

#         return Response(parsed_mapping)

#     except Exception as e:
#         # 記錄錯誤日誌（生產環境）
#         return Response(
#             {"error": "Internal server error", "detail": str(e)},
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR,
#         )
