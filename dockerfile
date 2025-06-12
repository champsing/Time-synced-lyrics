# Dockerfile
FROM python:3.13-slim-bullseye

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    gettext \
    netcat-openbsd \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 创建工作目录
WORKDIR /app

# 安装 Python 依赖
COPY ./src/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY ./src /app

# 复制入口脚本
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# 暴露端口
EXPOSE 8000

# 设置入口点
ENTRYPOINT ["/app/entrypoint.sh"]