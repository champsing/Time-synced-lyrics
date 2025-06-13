# 使用官方 Python 基礎鏡像
FROM python:3.11.13-slim-bookworm

# 設置環境變量
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV DEBIAN_FRONTEND noninteractive

# 安裝系統依賴
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 設置工作目錄
WORKDIR /app

# 複製 src 目錄
COPY ./src .

# 安裝 Python 依賴
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# 收集靜態文件
RUN python manage.py collectstatic --noinput

# 暴露端口
EXPOSE 8000

# 啟動命令
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "song_lyric_handler.wsgi"]