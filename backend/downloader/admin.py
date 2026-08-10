from django.contrib import admin
from .models import DownloadHistory


@admin.register(DownloadHistory)
class DownloadHistoryAdmin(admin.ModelAdmin):
    list_display = ['title', 'channel', 'format_quality', 'success', 'downloaded_at', 'ip_address']
    list_filter = ['success', 'format_quality', 'downloaded_at']
    search_fields = ['title', 'channel', 'url', 'video_id']
    readonly_fields = ['downloaded_at', 'ip_address']
    ordering = ['-downloaded_at']
