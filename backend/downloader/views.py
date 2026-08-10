"""
Core API views for Save.Tube.net downloader.

Endpoints:
  GET  /api/info/?url=<youtube_url>       → video metadata + smart quality tiers
  GET  /api/stream/                       → real-time streaming download (no popup)
  POST /api/download/                     → legacy: yt-dlp download with audio merged
  GET  /api/files/<file_id>/              → serve file → browser Downloads folder
  GET  /api/history/                      → last 50 downloads
  GET  /api/health/                       → liveness probe
"""
import os
import json
import re
import sys
import uuid
import mimetypes
import threading
import shutil
import subprocess
import urllib.parse
from pathlib import Path
import tempfile

import yt_dlp
from django.conf import settings
from django.http import FileResponse, StreamingHttpResponse
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import DownloadHistory
from .serializers import DownloadHistorySerializer, DownloadRequestSerializer

# ── Constants ──────────────────────────────────────────────────────────────────

# Try to find ffmpeg in the current directory (for Render deployment)
local_ffmpeg = Path(__file__).resolve().parent.parent / 'ffmpeg'
if local_ffmpeg.exists() and os.access(local_ffmpeg, os.X_OK):
    FFMPEG_BIN = str(local_ffmpeg)
else:
    sys_ffmpeg = shutil.which('ffmpeg')
    if sys_ffmpeg:
        FFMPEG_BIN = sys_ffmpeg
    else:
        # Fallback to local Windows dev path
        FFMPEG_BIN = r'E:\Save.Tube.net\ffmpeg_extracted\ffmpeg-master-latest-win64-gpl\bin\ffmpeg.exe'
        os.environ['PATH'] = r'E:\Save.Tube.net\ffmpeg_extracted\ffmpeg-master-latest-win64-gpl\bin' + os.pathsep + os.environ.get('PATH', '')

YOUTUBE_REGEX = re.compile(
    r'(https?://)?(www\.)?(youtube\.com/watch\?v=|youtu\.be/|youtube\.com/shorts/)[\w\-]+'
)

# Quality tiers: (label, min_height, yt_dlp_format_string, needs_60fps, needs_merge, merge_ext)
#
# merge_ext strategy — eliminates re-encoding for faster downloads:
#
#   4K / 8K / 1440p → YouTube streams are VP9 video + Opus audio (both .webm)
#                      Merging to WEBM = stream copy only (no re-encode) → near-instant
#
#   1080p           → YouTube has h264 (.mp4) + aac (.m4a) streams available
#                      Merging to MP4  = stream copy only (no re-encode) → near-instant
#
#   needs_merge=False → 720p and below: pre-muxed single file, no FFmpeg needed at all
#
# ── Cookies handling for bot bypass ────────────────────────────────────────────
def _prepare_cookie_file():
    cookies_content = os.environ.get("YOUTUBE_COOKIES")
    if not cookies_content:
        return None
    cookies_content = cookies_content.strip()
    if not cookies_content:
        return None

    # Auto-convert JSON cookies to Netscape format if user pasted JSON
    if cookies_content.startswith("[") or cookies_content.startswith("{"):
        try:
            data = json.loads(cookies_content)
            if isinstance(data, dict):
                data = [data]
            lines = ["# Netscape HTTP Cookie File\n# http://curl.haxx.se/rfc/cookie_spec.html\n# This file was generated automatically\n\n"]
            for item in data:
                domain = item.get("domain", ".youtube.com")
                flag = "TRUE" if domain.startswith(".") else "FALSE"
                path = item.get("path", "/")
                secure = "TRUE" if item.get("secure", False) else "FALSE"
                expiration = str(int(item.get("expirationDate", item.get("expires", 2147483647))))
                name = item.get("name", "")
                value = item.get("value", "")
                lines.append(f"{domain}\t{flag}\t{path}\t{secure}\t{expiration}\t{name}\t{value}")
            cookies_content = "\n".join(lines)
        except Exception:
            pass

    cookies_content = cookies_content.replace('\\n', '\n')
    if not cookies_content.startswith("# Netscape"):
        cookies_content = "# Netscape HTTP Cookie File\n" + cookies_content

    fd, cookie_path = tempfile.mkstemp(suffix=".txt", text=True)
    with os.fdopen(fd, 'w', encoding='utf-8') as f:
        f.write(cookies_content)
    return cookie_path

COOKIE_FILE = _prepare_cookie_file()
EXTRACTOR_CLIENTS = ['player_client=ios,web,mweb'] if COOKIE_FILE else ['player_client=ios,android']

QUALITY_TIERS = [
    # 8K — VP9/AV1 + Opus → webm merge (stream copy, no re-encode)
    ('8K',
     4320,
     'bestvideo[height<=4320][ext=webm]+bestaudio[ext=webm]/bestvideo[height<=4320]+bestaudio/best',
     False, True, 'webm'),

    # 4K 60fps — VP9 + Opus → webm merge
    ('4K 60fps',
     2160,
     'bestvideo[height<=2160][fps>50][ext=webm]+bestaudio[ext=webm]/bestvideo[height<=2160][fps>50]+bestaudio/bestvideo[height<=2160]+bestaudio/best',
     True, True, 'webm'),

    # 4K — VP9/AV1 + Opus → webm merge
    ('4K',
     2160,
     'bestvideo[height<=2160][ext=webm]+bestaudio[ext=webm]/bestvideo[height<=2160]+bestaudio/best',
     False, True, 'webm'),

    # 1440p — VP9 + Opus → webm merge
    ('1440p',
     1440,
     'bestvideo[height<=1440][ext=webm]+bestaudio[ext=webm]/bestvideo[height<=1440]+bestaudio/best',
     False, True, 'webm'),

    # 1080p 60fps — prefer h264+aac (mp4 stream copy); fallback webm
    ('1080p 60fps',
     1080,
     'bestvideo[height<=1080][fps>50][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=1080][fps>50][ext=webm]+bestaudio[ext=webm]/bestvideo[height<=1080][fps>50]+bestaudio/best',
     True, True, 'mp4'),

    # 1080p — prefer h264+aac → mp4 stream copy; fallback webm merge
    ('1080p',
     1080,
     'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=1080][ext=webm]+bestaudio[ext=webm]/bestvideo[height<=1080]+bestaudio/best',
     False, True, 'mp4'),

    # 720p and below — ONLY pre-muxed. No bestvideo+bestaudio. No FFmpeg.
    ('720p',  720,  'best[height<=720][ext=mp4]/best[height<=720][ext=webm]/best[height<=720]',   False, False, 'mp4'),
    ('480p',  480,  'best[height<=480][ext=mp4]/best[height<=480][ext=webm]/best[height<=480]',   False, False, 'mp4'),
    ('360p',  360,  'best[height<=360][ext=mp4]/best[height<=360][ext=webm]/best[height<=360]',   False, False, 'mp4'),
    ('240p',  240,  'best[height<=240][ext=mp4]/best[height<=240][ext=webm]/best[height<=240]',   False, False, 'mp4'),
    ('144p',  144,  'best[height<=144][ext=mp4]/best[height<=144][ext=webm]/best[height<=144]',   False, False, 'mp4'),
]

# Video-only tiers: (label, min_height, yt_dlp_format_string, needs_60fps, ext)
# Single video stream — NO audio, NO merge, NO FFmpeg — direct download, instant.
# YouTube 4K/8K video streams are VP9/AV1 in .webm container.
VIDEO_ONLY_TIERS = [
    ('8K',
     4320,
     'bestvideo[height<=4320][ext=webm]/bestvideo[height<=4320]',
     False, 'webm'),

    ('4K 60fps',
     2160,
     'bestvideo[height<=2160][fps>50][ext=webm]/bestvideo[height<=2160][fps>50]',
     True,  'webm'),

    ('4K',
     2160,
     'bestvideo[height<=2160][ext=webm]/bestvideo[height<=2160]',
     False, 'webm'),

    ('1440p',
     1440,
     'bestvideo[height<=1440][ext=webm]/bestvideo[height<=1440]',
     False, 'webm'),
]

AUDIO_TIERS = [
    ('MP3 320kbps', 'bestaudio/best', 'mp3', True),
    ('M4A Audio',   'bestaudio[ext=m4a]/bestaudio/best', 'm4a', False),
    ('WebM Audio',  'bestaudio[ext=webm]/bestaudio/best', 'webm', False),
]

# In-memory file registry: file_id → Path
_file_registry: dict[str, Path] = {}


# ── Helpers ────────────────────────────────────────────────────────────────────

def is_valid_youtube_url(url: str) -> bool:
    return bool(YOUTUBE_REGEX.match(url))


def get_client_ip(request):
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    return xff.split(',')[0].strip() if xff else request.META.get('REMOTE_ADDR')


def format_duration(seconds):
    if not seconds:
        return 'N/A'
    h, rem = divmod(int(seconds), 3600)
    m, s = divmod(rem, 60)
    return f'{h}:{m:02d}:{s:02d}' if h else f'{m}:{s:02d}'


def estimate_size(height, duration_sec, is_60fps=False):
    """Rough file size estimate — used as fallback when yt-dlp has no size data."""
    if not duration_sec:
        return 'Unknown'
    BITRATES = {4320: 80000, 2160: 20000, 1440: 8000, 1080: 5000,
                720: 2500, 480: 1000, 360: 500, 240: 300, 144: 150}
    kbps = BITRATES.get(height, 1000)
    if is_60fps:
        kbps = int(kbps * 1.6)
    mb = (kbps * duration_sec) / (8 * 1000)
    return f'~{mb:.0f} MB' if mb >= 1 else f'~{int(mb * 1000)} KB'


def _fmt_bytes(b: int | None) -> str | None:
    """Convert bytes to human-readable string. Returns None if no data."""
    if not b or b <= 0:
        return None
    if b >= 1_073_741_824:          # ≥ 1 GB
        return f'~{b / 1_073_741_824:.2f} GB'
    if b >= 1_048_576:              # ≥ 1 MB
        return f'~{int(b / 1_048_576)} MB'
    return f'~{int(b / 1024)} KB'


def get_tier_actual_size(
    formats: list,
    min_height: int,
    merge_ext: str,
    needs_merge: bool,
    needs_60fps: bool,
    is_video_only: bool = False,
) -> str | None:
    """
    Return the REAL file size by reading yt-dlp's filesize / filesize_approx fields.
    Returns None when yt-dlp has no size data (caller falls back to estimate_size).

    Strategy:
      merged (needs_merge=True) → best video stream + best audio stream sizes
      video-only               → best video stream size only
      pre-muxed (720p-)        → best combined stream size
    """
    def _pick_size(fmt):
        return fmt.get('filesize') or fmt.get('filesize_approx') or 0

    # Separate video-only streams (vcodec set, acodec absent)
    vid_streams = [
        f for f in formats
        if (f.get('vcodec') or 'none') != 'none'
        and (f.get('acodec') or 'none') == 'none'
        and (f.get('height') or 0) <= min_height
        and (f.get('height') or 0) > 0
        and (not needs_60fps or (f.get('fps') or 0) > 50)
    ]

    if needs_merge or is_video_only:
        # Prefer streams that match the target container extension
        pref = [f for f in vid_streams if f.get('ext') == merge_ext]
        cands = pref or vid_streams
        if not cands:
            return None

        # Best = highest height, then highest size
        best_v = max(cands, key=lambda f: ((f.get('height') or 0), _pick_size(f)))
        v_size = _pick_size(best_v)

        if is_video_only:
            return _fmt_bytes(v_size)

        # Audio streams (acodec set, vcodec absent)
        aud_streams = [
            f for f in formats
            if (f.get('acodec') or 'none') != 'none'
            and (f.get('vcodec') or 'none') == 'none'
        ]
        # Match audio ext: webm→opus(.webm), mp4→aac(.m4a)
        target_ext = merge_ext if merge_ext == 'webm' else 'm4a'
        pref_aud = [f for f in aud_streams if f.get('ext') == target_ext]
        aud_cands = pref_aud or aud_streams
        best_a = max(aud_cands, key=_pick_size, default=None)
        a_size = _pick_size(best_a) if best_a else 0

        total = v_size + a_size
        return _fmt_bytes(total)

    else:
        # Pre-muxed: stream contains both video+audio
        muxed = [
            f for f in formats
            if (f.get('vcodec') or 'none') != 'none'
            and (f.get('acodec') or 'none') != 'none'
            and (f.get('height') or 0) <= min_height
            and (f.get('height') or 0) > 0
        ]
        if not muxed:
            return None
        best = max(muxed, key=lambda f: ((f.get('height') or 0), _pick_size(f)))
        return _fmt_bytes(_pick_size(best))


def _safe_filename(s: str, maxlen: int = 120) -> str:
    """
    Sanitise a string for use as a filename on Windows + Linux.
    Removes characters that are invalid in Windows filenames.
    """
    s = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '', s)   # strip Windows-illegal chars
    s = s.strip().strip('.')                          # no leading/trailing dots/spaces
    return s[:maxlen] or 'video'


def build_quality_tiers(info: dict) -> list:
    """
    Build quality options:
      • QUALITY_TIERS: video+audio merged (webm stream copy for 4K/8K, mp4 for 1080p)
      • VIDEO_ONLY_TIERS: video-only, no audio, no FFmpeg — direct single-stream download
      • AUDIO_TIERS: audio-only extractions
    """
    formats = info.get('formats', [])
    duration = info.get('duration', 0) or 0

    video_fmts = [f for f in formats if (f.get('vcodec') or 'none') != 'none']
    if not video_fmts:
        return []

    max_height = max((f.get('height') or 0) for f in video_fmts)
    max_fps    = max((f.get('fps') or 0)    for f in video_fmts)

    result = []

    # ── Video + Audio (merged) tiers ────────────────────────────────────
    for (label, min_height, fmt_str, needs_60fps, needs_merge, merge_ext) in QUALITY_TIERS:
        if max_height < min_height:
            continue
        if needs_60fps and max_fps < 50:
            continue
        # Try actual size first; fall back to bitrate estimate
        actual_size = get_tier_actual_size(formats, min_height, merge_ext, needs_merge, needs_60fps)
        result.append({
            'format_id':     fmt_str,
            'quality':       label,
            'ext':           merge_ext,
            'filesize':      actual_size or estimate_size(min_height, duration, needs_60fps),
            'is_audio_only': False,
            'is_video_only': False,
            'height':        min_height,
            'fps':           60 if needs_60fps else None,
            'needs_merge':   needs_merge,
            'merge_ext':     merge_ext,
        })

    # ── Video-only (no audio, no merge) tiers ───────────────────────────
    for (label, min_height, fmt_str, needs_60fps, ext) in VIDEO_ONLY_TIERS:
        if max_height < min_height:
            continue
        if needs_60fps and max_fps < 50:
            continue
        actual_size = get_tier_actual_size(formats, min_height, ext, False, needs_60fps, is_video_only=True)
        result.append({
            'format_id':     fmt_str,
            'quality':       label,
            'ext':           ext,
            'filesize':      actual_size or estimate_size(min_height, duration, needs_60fps),
            'is_audio_only': False,
            'is_video_only': True,
            'height':        min_height,
            'fps':           60 if needs_60fps else None,
            'needs_merge':   False,
            'merge_ext':     ext,
        })

    # ── Audio-only tiers ────────────────────────────────────────────────
    for (label, fmt_str, ext, _) in AUDIO_TIERS:
        # Use actual audio stream size if available
        aud_streams = [
            f for f in formats
            if (f.get('acodec') or 'none') != 'none'
            and (f.get('vcodec') or 'none') == 'none'
        ]
        pref = [f for f in aud_streams if f.get('ext') == ext or (ext == 'mp3' and f.get('ext') in ('webm', 'm4a'))]
        aud_cands = pref or aud_streams
        best_a = max(aud_cands, key=lambda f: f.get('filesize') or f.get('filesize_approx') or 0, default=None)
        a_size_str = _fmt_bytes(best_a.get('filesize') or best_a.get('filesize_approx') or 0) if best_a else None
        result.append({
            'format_id':     fmt_str,
            'quality':       label,
            'ext':           ext,
            'filesize':      a_size_str or (f'~{max(1, int(duration/60))} MB' if duration else 'Unknown'),
            'is_audio_only': True,
            'is_video_only': False,
            'height':        None,
            'fps':           None,
            'needs_merge':   False,
            'merge_ext':     ext,
        })

    return result


# ── Views ──────────────────────────────────────────────────────────────────────

@api_view(['GET'])
def video_info(request):
    """
    GET /api/info/?url=<youtube_url>
    Returns video metadata + smart quality tiers (each with merged audio).
    """
    url = request.query_params.get('url', '').strip()

    if not url:
        return Response({'error': 'URL parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)
    if not is_valid_youtube_url(url):
        return Response({'error': 'Invalid or unsupported YouTube URL.'}, status=status.HTTP_400_BAD_REQUEST)

    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
        'extractor_args': {'youtube': EXTRACTOR_CLIENTS}
    }
    if COOKIE_FILE:
        ydl_opts['cookiefile'] = COOKIE_FILE

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except yt_dlp.utils.DownloadError as e:
        return Response(
            {'error': f'Could not fetch video: {str(e)}'},
            status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )
    except Exception:
        return Response({'error': 'Unexpected error fetching video info.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Best thumbnail
    thumbnails    = info.get('thumbnails', [])
    thumbnail_url = ''
    if thumbnails:
        best = max(thumbnails, key=lambda t: (t.get('width') or 0) * (t.get('height') or 0))
        thumbnail_url = best.get('url', '')

    return Response({
        'video_id':        info.get('id', ''),
        'title':           info.get('title', 'Unknown Title'),
        'channel':         info.get('uploader', 'Unknown Channel'),
        'channel_url':     info.get('uploader_url', ''),
        'duration':        info.get('duration', 0),
        'duration_string': format_duration(info.get('duration', 0)),
        'view_count':      info.get('view_count', 0),
        'like_count':      info.get('like_count', 0),
        'upload_date':     info.get('upload_date', ''),
        'description':     (info.get('description', '') or '')[:300],
        'thumbnail_url':   thumbnail_url,
        'webpage_url':     info.get('webpage_url', url),
        'formats':         build_quality_tiers(info),
    })


@api_view(['POST'])
def download_video(request):
    import traceback
    try:
        return _download_video_impl(request)
    except Exception as e:
        print("CRASH IN DOWNLOAD_VIDEO:")
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)

def _download_video_impl(request):
    """
    POST /api/download/
    Body: { url, format_id, quality_label, is_audio_only, output_ext }

    Runs yt-dlp with the given format selector (which always includes audio).
    Returns { file_id, filename, size_bytes } — frontend then hits /api/files/<file_id>/
    which triggers the browser's native download → saves to Downloads folder.
    """
    serializer = DownloadRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    url           = serializer.validated_data['url']
    format_str    = serializer.validated_data['format_id']   # full yt-dlp format selector
    quality_label = serializer.validated_data.get('quality_label', '')
    is_audio_only = serializer.validated_data.get('is_audio_only', False)
    output_ext    = serializer.validated_data.get('output_ext', 'mp4')
    # needs_merge: sent by frontend (True for 1080p+). Fallback: detect from format_str
    needs_merge   = serializer.validated_data.get('needs_merge', False)
    if not needs_merge and not is_audio_only:
        # Auto-detect: if format_str uses bestvideo+bestaudio it requires FFmpeg merge
        needs_merge = '+' in format_str and 'bestvideo' in format_str
    # merge_ext: which container FFmpeg should produce (webm=stream copy for 4K/8K, mp4 for 1080p)
    merge_ext     = serializer.validated_data.get('merge_ext', 'mp4')
    if not merge_ext:
        # Auto-detect: webm streams → webm container (avoids re-encode)
        merge_ext = 'webm' if '[ext=webm]' in format_str else 'mp4'

    if not is_valid_youtube_url(url):
        return Response({'error': 'Invalid YouTube URL.'}, status=status.HTTP_400_BAD_REQUEST)

    # Create a unique session directory
    temp_dir    = Path(settings.DOWNLOAD_TEMP_DIR)
    temp_dir.mkdir(exist_ok=True)
    session_dir = temp_dir / uuid.uuid4().hex
    session_dir.mkdir()

    outtmpl = str(session_dir / '%(title)s.%(ext)s')

    # ── Build yt-dlp options ──────────────────────────────────────────────────
    if is_audio_only and output_ext == 'mp3':
        # MP3: extract audio and convert via FFmpeg
        ydl_opts = {
            'quiet':           True,
            'no_warnings':     True,
            'format':          'bestaudio/best',
            'outtmpl':         outtmpl,
            'ffmpeg_location': FFMPEG_BIN,
            'postprocessors':  [{
                'key':              'FFmpegExtractAudio',
                'preferredcodec':   'mp3',
                'preferredquality': '320',
            }],
            'extractor_args': {'youtube': EXTRACTOR_CLIENTS}
        }
    elif needs_merge:
        # HD (1080p+): separate video+audio streams — merge via FFmpeg stream copy
        # merge_ext=webm for 4K/8K (VP9+Opus → no re-encode, instant)
        # merge_ext=mp4 for 1080p (h264+aac → no re-encode, instant)
        ydl_opts = {
            'quiet':               True,
            'no_warnings':         True,
            'format':              format_str,
            'outtmpl':             outtmpl,
            'merge_output_format': merge_ext,   # ← KEY: stream copy, no re-encode!
            'ffmpeg_location':     FFMPEG_BIN,
            # Extra args to force stream copy (no transcoding)
            'postprocessor_args': {
                'ffmpeg': ['-c', 'copy'],        # copy all streams, never re-encode
            },
            # Retry on network hiccup — important for large 4K/8K files
            'retries':             5,
            'fragment_retries':    5,
            'concurrent_fragment_downloads': 4,
            'extractor_args': {'youtube': EXTRACTOR_CLIENTS}
        }
    else:
        # Direct (720p and below): pre-muxed stream — no FFmpeg, instant download
        # format_str uses 'best[...]' only — guaranteed single file, no merge
        ydl_opts = {
            'quiet':                         True,
            'no_warnings':                   True,
            'format':                        format_str,
            'outtmpl':                       outtmpl,
            'concurrent_fragment_downloads': 4,
            'extractor_args': {'youtube': EXTRACTOR_CLIENTS}
            # NO ffmpeg_location — FFmpeg cannot be invoked
        }

    if COOKIE_FILE:
        ydl_opts['cookiefile'] = COOKIE_FILE

    # ── Fetch info for logging (non-blocking) ────────────────────────────────
    info = {}
    fetch_opts = {'quiet': True, 'skip_download': True, 'extractor_args': {'youtube': EXTRACTOR_CLIENTS}}
    if COOKIE_FILE:
        fetch_opts['cookiefile'] = COOKIE_FILE

    try:
        with yt_dlp.YoutubeDL(fetch_opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except Exception:
        pass

    history = DownloadHistory(
        url=url,
        video_id=info.get('id', ''),
        title=(info.get('title', '') or '')[:500],
        channel=(info.get('uploader', '') or '')[:200],
        format_quality=quality_label,
        format_id=format_str[:100],
        duration=info.get('duration'),
        ip_address=get_client_ip(request),
        success=False,
    )

    # ── Run yt-dlp ───────────────────────────────────────────────────────────
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
    except yt_dlp.utils.DownloadError as e:
        history.save()
        import shutil; shutil.rmtree(session_dir, ignore_errors=True)
        return Response({'error': f'Download failed: {str(e)}'}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
    except Exception as e:
        history.save()
        import shutil; shutil.rmtree(session_dir, ignore_errors=True)
        return Response({'error': f'Unexpected error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # ── Find the downloaded file ──────────────────────────────────────────────
    files = sorted(session_dir.glob('*'), key=lambda f: f.stat().st_size, reverse=True)
    if not files:
        history.save()
        return Response({'error': 'Downloaded file not found.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    filepath = files[0]
    file_id  = uuid.uuid4().hex
    _file_registry[file_id] = filepath

    history.success       = True
    history.thumbnail_url = (info.get('thumbnail', '') or '')[:2000]
    history.save()

    return Response({
        'status':     'ready',
        'file_id':    file_id,
        'filename':   filepath.name,
        'ext':        filepath.suffix.lstrip('.'),
        'size_bytes': filepath.stat().st_size,
    })


@api_view(['GET'])
def serve_file(request, file_id):
    """
    GET /api/files/<file_id>/
    Serves the downloaded file with Content-Disposition: attachment.
    Browser automatically saves to the user's Downloads folder.
    """
    filepath = _file_registry.get(file_id)

    if not filepath or not filepath.exists():
        return Response(
            {'error': 'File not found or already served.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    content_type, _ = mimetypes.guess_type(str(filepath))
    content_type = content_type or 'application/octet-stream'

    file_size = filepath.stat().st_size

    # Encode filename safely for Content-Disposition (handles unicode titles)
    encoded_name = urllib.parse.quote(filepath.name, safe='')
    ascii_name   = filepath.name.encode('ascii', 'replace').decode('ascii').replace('?', '_')
    content_disposition = (
        f'attachment; filename="{ascii_name}"; '
        f"filename*=UTF-8''{encoded_name}"
    )

    response = FileResponse(
        open(filepath, 'rb'),
        content_type=content_type,
    )

    # Critical headers for Chrome to handle large files (4K/8K) correctly
    response['Content-Disposition']  = content_disposition
    response['Content-Length']       = str(file_size)   # lets Chrome show progress & not abort
    response['Accept-Ranges']        = 'bytes'          # signals range-request support
    response['Cache-Control']        = 'no-cache'
    # CORS headers so browser anchor-click from any port works
    response['Access-Control-Allow-Origin']   = '*'
    response['Access-Control-Expose-Headers'] = 'Content-Disposition, Content-Length'

    # Clean up file after 90 seconds (extra time for large 4K/8K files)
    def _cleanup():
        import time
        time.sleep(90)
        try:
            filepath.unlink(missing_ok=True)
            filepath.parent.rmdir()
        except Exception:
            pass
        _file_registry.pop(file_id, None)

    threading.Thread(target=_cleanup, daemon=True).start()
    return response


@api_view(['GET'])
def download_history(request):
    """GET /api/history/ — last 50 successful downloads."""
    qs = DownloadHistory.objects.filter(success=True)[:50]
    return Response(DownloadHistorySerializer(qs, many=True).data)


@api_view(['GET'])
def health_check(request):
    """GET /api/health/"""
    return Response({'status': 'ok', 'service': 'Save.Tube.net API'})


# ── Streaming download ─────────────────────────────────────────────────────────

_CONTENT_TYPES = {
    'mp4':  'video/mp4',
    'webm': 'video/webm',
    'mkv':  'video/x-matroska',
    'mp3':  'audio/mpeg',
    'm4a':  'audio/mp4',
    'ogg':  'audio/ogg',
}

_SAFE_EXTS = {'mp4', 'webm', 'mkv', 'mp3', 'm4a', 'ogg'}


def _stream_chunks(process, chunk_size: int = 1 << 16):
    """
    Generator that yields raw bytes from the subprocess stdout.
    Kills the process cleanly when the client disconnects or download finishes.
    """
    try:
        while True:
            chunk = process.stdout.read(chunk_size)
            if not chunk:
                break
            yield chunk
    finally:
        try:
            process.stdout.close()
        except Exception:
            pass
        try:
            process.terminate()
            process.wait(timeout=5)
        except Exception:
            pass


def stream_video(request):
    """
    GET /api/stream/?url=&format_id=&merge_ext=&quality_label=&is_audio_only=

    Streams yt-dlp output DIRECTLY to the browser via StreamingHttpResponse.
    Browser's native download bar appears instantly — no intermediate popup needed.

    Flow:
      yt-dlp (subprocess, -o - stdout mode)
        → chunks
          → StreamingHttpResponse
            → browser download bar ✅
    """
    url           = request.GET.get('url', '').strip()
    format_str    = request.GET.get('format_id', 'best').strip()
    merge_ext     = request.GET.get('merge_ext', 'mp4').strip().lower()
    quality_label = request.GET.get('quality_label', 'video').strip()
    is_audio_only = request.GET.get('is_audio_only', 'false').lower() == 'true'
    video_title   = request.GET.get('video_title', '').strip()

    # ── Validate ──────────────────────────────────────────────────────────────
    if not is_valid_youtube_url(url):
        return StreamingHttpResponse(
            iter([b'Invalid YouTube URL']), status=400,
            content_type='text/plain',
        )

    if merge_ext not in _SAFE_EXTS:
        merge_ext = 'mp4'

    content_type = _CONTENT_TYPES.get(merge_ext, 'application/octet-stream')

    # ── Build filename: "<Video Title> [Quality].ext" ─────────────────────────
    # e.g.  "How to Cook Rice [4K].webm"  or  "Blinding Lights [MP3 320kbps].mp3"
    clean_title   = _safe_filename(video_title) if video_title else 'video'
    clean_quality = _safe_filename(quality_label) or quality_label
    filename      = f'{clean_title} [{clean_quality}].{merge_ext}'

    # ── Build yt-dlp command ──────────────────────────────────────────────────
    # -o - → write to stdout instead of disk
    base_cmd = [
        sys.executable, '-m', 'yt_dlp',
        '--no-playlist',
        '--no-warnings',
        '-f', format_str,
        '--ffmpeg-location', FFMPEG_BIN,
        '-o', '-',          # ← stdout output
        '--extractor-args', f'youtube:{EXTRACTOR_CLIENTS[0]}'
    ]
    if COOKIE_FILE:
        base_cmd.extend(['--cookies', COOKIE_FILE])

    if is_audio_only and merge_ext == 'mp3':
        # Audio extraction: convert to mp3 via ffmpeg
        cmd = base_cmd + [
            '-x',
            '--audio-format', 'mp3',
            '--audio-quality', '0',    # best quality
            url,
        ]
    else:
        # Video (with or without audio merge)
        cmd = base_cmd + [
            '--merge-output-format', merge_ext,
            url,
        ]

    # ── Spawn subprocess and stream ───────────────────────────────────────────
    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,   # hide yt-dlp progress from server logs
        )
    except Exception as exc:
        return StreamingHttpResponse(
            iter([f'Failed to start download: {exc}'.encode()]),
            status=500,
            content_type='text/plain',
        )

    # Encode filename for RFC 5987 (supports unicode video titles)
    encoded_name = urllib.parse.quote(filename, safe='')
    ascii_name   = filename.encode('ascii', 'replace').decode('ascii').replace('?', '_')
    content_disposition = (
        f'attachment; filename="{ascii_name}"; '
        f"filename*=UTF-8''{encoded_name}"
    )

    response = StreamingHttpResponse(
        _stream_chunks(process),
        content_type=content_type,
        status=200,
    )
    response['Content-Disposition']            = content_disposition
    response['Cache-Control']                  = 'no-cache'
    response['Access-Control-Allow-Origin']    = '*'
    response['Access-Control-Expose-Headers']  = 'Content-Disposition'
    return response

