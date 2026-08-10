from rest_framework import serializers
from .models import DownloadHistory


class DownloadHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = DownloadHistory
        fields = [
            'id', 'url', 'video_id', 'title', 'thumbnail_url',
            'format_quality', 'channel', 'duration', 'downloaded_at', 'success'
        ]
        read_only_fields = ['id', 'downloaded_at']


class VideoInfoSerializer(serializers.Serializer):
    url = serializers.URLField()


class DownloadRequestSerializer(serializers.Serializer):
    url           = serializers.URLField()
    format_id     = serializers.CharField(max_length=500)   # full yt-dlp format selector string
    quality_label = serializers.CharField(max_length=50, required=False, default='')
    is_audio_only = serializers.BooleanField(required=False, default=False)
    output_ext    = serializers.CharField(max_length=10, required=False, default='mp4')
    needs_merge   = serializers.BooleanField(required=False, default=False)  # True for 1080p+ (separate video+audio streams)
    merge_ext     = serializers.CharField(max_length=10, required=False, default='mp4')  # container for FFmpeg merge (webm/mp4)
