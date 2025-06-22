git checkout master
git pull
python3 manage.py collectstatic --no-input
DJANGO_SETTINGS_MODULE=song_lyric_handler.settings_prod song_lyric_handler/venv/bin/gunicorn \
  --bind 0.0.0.0:8000 \
  song_lyric_handler.wsgi:application