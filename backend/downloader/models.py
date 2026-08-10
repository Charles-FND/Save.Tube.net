from django.db import models


class DownloadHistory(models.Model):
    """Records each download request for analytics and history."""
    url = models.URLField(max_length=2000)
    video_id = models.CharField(max_length=50, blank=True)
    title = models.CharField(max_length=500, blank=True)
    thumbnail_url = models.URLField(max_length=2000, blank=True)
    format_quality = models.CharField(max_length=50, blank=True)  # e.g. "4K", "1080p", "mp3"
    format_id = models.CharField(max_length=100, blank=True)
    channel = models.CharField(max_length=200, blank=True)
    duration = models.PositiveIntegerField(null=True, blank=True)  # seconds
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    downloaded_at = models.DateTimeField(auto_now_add=True)
    success = models.BooleanField(default=True)

    class Meta:
        ordering = ['-downloaded_at']
        verbose_name = 'Download History'
        verbose_name_plural = 'Download Histories'

    def __str__(self):
        return f"{self.title or self.url} [{self.format_quality}] @ {self.downloaded_at:%Y-%m-%d %H:%M}"
