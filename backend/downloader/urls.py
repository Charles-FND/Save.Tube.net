from django.urls import path
from . import views

urlpatterns = [
    path('info/',                views.video_info,       name='video-info'),
    path('stream/',              views.stream_video,     name='stream-video'),   # real-time streaming
    path('download/',            views.download_video,   name='download-video'), # legacy
    path('files/<str:file_id>/', views.serve_file,       name='serve-file'),
    path('history/',             views.download_history, name='download-history'),
    path('health/',              views.health_check,     name='health-check'),
]
