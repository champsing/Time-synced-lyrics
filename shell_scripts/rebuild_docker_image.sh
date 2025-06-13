docker compose -f docker-compose.prod.yml down
git pull origin backend
docker compose -f docker-compose.prod.yml up --build -d