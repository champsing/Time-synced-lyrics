# --- 階段一：編譯階段 ---
FROM rust:latest AS builder

# 安裝編譯必要的系統依賴 (如 libsqlite3)
RUN apt-get update && apt-get install -y \
    pkg-config \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 複製項目文件
COPY . .

# 編譯專案 (使用 --release 模式優化性能)
RUN cargo build --release --bin tsl_api
RUN cargo build --release --bin tsl_exporter

# --- 階段二：運行階段 ---
FROM debian:bookworm-slim

# 運行時仍需要 libsqlite3
RUN apt-get update && apt-get install -y \
    libsqlite3-0 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/target/release/tsl_api ./tsl_api
COPY --from=builder /app/target/release/tsl_exporter ./tsl_exporter

EXPOSE 8000

# 啟動伺服器
CMD ["./tsl_api"]