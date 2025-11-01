# 使用官方 Python 基礎鏡像
FROM python:3.11.13-slim-bookworm

# 安裝系統依賴
RUN apt-get update -y && \
    rm -rf /var/lib/apt/lists/*

# set env
ENV DJANGO_SETTINGS_MODULE=song_lyric_handler.settings_prod

# 設置工作目錄
WORKDIR /tsl

# 複製 src 目錄
COPY ./src .
COPY ./keys/django_secret .

# 安裝 Python 依賴
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# 收集靜態文件
RUN python manage.py collectstatic --noinput

# 暴露端口
EXPOSE 8000

# 啟動命令
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "song_lyric_handler.wsgi:application"]