# GMS CRM: AWS EC2 Deployment & Operations Guide

This document provides complete instructions for deploying the GMS CRM to AWS EC2 using Docker, managing backups, and monitoring system health.

## 1. Prerequisites (AWS EC2 Setup)
1. **Provision EC2 Instance:** Use an Ubuntu 22.04 LTS instance (t3.medium or larger recommended).
2. **Security Groups (Firewall):** Open the following inbound ports:
   - `22` (SSH)
   - `80` (HTTP - Frontend/Nginx)
   - `443` (HTTPS - SSL)
   - *Do not open 5000, 27017, or 6379 to the public internet.* Nginx will proxy port 80/443 to the backend on port 5000 internally.
3. **Install Docker & Docker Compose** on the instance.

## 2. Deployment Steps
1. SSH into your EC2 instance.
2. Clone or upload the repository to the instance.
3. Create the actual `.env` files based on the templates:
   ```bash
   cp backend/.env backend/.env.backup # if you need a backup
   cp frontend/.env frontend/.env.backup
   ```
4. Update the `.env` files:
   - **Backend:** Update `FRONTEND_URL` and `ALLOWED_ORIGINS` to `https://crm.globalmarketingsolutions.in`. Update `JWT_SECRET` and `MONGO_URI`.
   - **Frontend:** Update `VITE_API_URL` to `/api/v1` (It will be proxied by Nginx).
5. Build and run the containers:
   ```bash
   # Run with MongoDB Atlas (Default)
   docker-compose up --build -d
   
   # Run with Local Docker MongoDB
   docker-compose --profile local-db up --build -d
   ```

## 3. SSL Setup (Let's Encrypt / Certbot)
To secure the application with HTTPS:
1. Ensure your domain's DNS A-record points to your EC2 instance's IP.
2. We recommend installing `certbot` on the EC2 host and using Nginx on the host to proxy to the Docker container, *or* updating `frontend/nginx.conf` to handle SSL certificates mounted as volumes.
3. **Quick Guide for Host Nginx:**
   ```bash
   sudo apt install nginx certbot python3-certbot-nginx
   sudo certbot --nginx -d crm.globalmarketingsolutions.in
   ```
4. **Important Notice for Host Nginx Upload Limit:**
   If you run Nginx on the Ubuntu host proxying traffic to Docker, you **must** add `client_max_body_size 50m;` inside your `/etc/nginx/sites-available/default` (or your domain configuration file in `/etc/nginx/sites-enabled/`) within the `server { ... }` block and run `sudo systemctl reload nginx`. Without this, Nginx on the Ubuntu host (`nginx/1.28.3`) will block any order or design file submission larger than 1MB with `413 Request Entity Too Large`.

## 4. Persistent Volumes & Uploads
The `docker-compose.yml` mounts the following named volumes to ensure data survives container restarts and rebuilds:
- **`gms_uploads`**: Stores all client uploads (brochures, designs, profiles). Mounted at `/app/public/uploads` in the backend.
- **`gms_redis_data`**: Stores Redis cache.
- **`gms_mongo_data`**: Stores local MongoDB data (if using local DB).

## 5. Automated Backup System (MongoDB)
If using the local MongoDB container (`gms-mongo`), configure cron jobs on the EC2 host to dump the database automatically.

**Backup Script (`/opt/backup.sh`):**
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mongodb"
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
# Backup the database from the container
docker exec gms-mongo mongodump --archive > $BACKUP_DIR/gms_crm_$TIMESTAMP.archive
# Keep only last 7 days of daily backups
find $BACKUP_DIR -type f -name "*.archive" -mtime +7 -exec rm {} \;
```
**Cron Schedule (`crontab -e`):**
```bash
# Daily backup at 2 AM
0 2 * * * /bin/bash /opt/backup.sh
# Weekly backup (Sunday 3 AM)
0 3 * * 0 cp /var/backups/mongodb/$(ls -t /var/backups/mongodb | head -1) /var/backups/mongodb/weekly/
```
**Restore Procedure:**
```bash
cat backup_file.archive | docker exec -i gms-mongo mongorestore --archive --drop
```
*(If using MongoDB Atlas, configure automated backups directly in the Atlas Dashboard).*

## 6. System Health Monitoring
The CRM backend exposes a health dashboard endpoint.
- **API Endpoint:** `GET /api/v1/health`
- **Output Includes:** API Uptime, Memory Usage, MongoDB Status, Redis Status.

Docker uses this endpoint to automatically determine the `gms-backend` container's health state. 
- Run `docker ps` to view the health status (`healthy`, `unhealthy`, `starting`).
- If a container is marked unhealthy, the restart policy (`unless-stopped`) will not automatically restart it unless it crashes, but load balancers will stop routing traffic to it.

## 7. Production Logging & Error Handling
- **Log Management:** All containers are configured with the `json-file` driver in `docker-compose.yml` (rotating 3 files max, 10MB each).
- **Viewing Logs:**
  ```bash
  docker-compose logs -f --tail=100 gms-backend
  docker-compose logs -f --tail=100 gms-frontend
  ```

## 8. CI/CD Roadmap
For future CI/CD implementation (e.g., GitHub Actions):
1. On push to `main`, GitHub Actions runs `npm run lint` and `npm run test` for backend/frontend.
2. Build Docker images and push to AWS ECR or Docker Hub.
3. SSH into EC2, pull latest images, and run `docker-compose up -d`.

## 9. Deployment Checklist
### Pre-Deployment
- [ ] Dependencies updated (`ioredis` installed).
- [ ] Dockerfiles and `docker-compose.yml` present.
- [ ] Upload directories mapped to persistent volumes.
- [ ] `.env` files populated with actual credentials.

### Post-Deployment
- [ ] Run `docker-compose ps` to ensure all containers are `Up` and `(healthy)`.
- [ ] Verify `https://crm.globalmarketingsolutions.in` loads the React frontend.
- [ ] Verify `https://crm.globalmarketingsolutions.in/api/v1/health` returns `{"status":"ok",...}`.
- [ ] Upload a test file (e.g., brochure) and verify it appears in `docker volume inspect gms_uploads`.
- [ ] Restart the backend container (`docker restart gms-backend`) and verify the uploaded file still exists.

## Rollback Plan
If deployment fails:
1. Revert to the previous Git commit.
2. Run `docker-compose down`.
3. Run `docker-compose up --build -d` to rebuild from the stable commit.
