git checkout master
git pull
python3 manage.py collectstatic --no-input
song_lyric_handler/venv/bin/gunicorn \
  --bind 0.0.0.0:8000 \
  --log-level debug \
  --capture-output \
  song_lyric_handler.wsgi:application