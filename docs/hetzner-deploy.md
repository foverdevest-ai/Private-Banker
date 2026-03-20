# Hetzner Deployment Guide

## 1. Provision server
- Create Ubuntu 24.04 VPS.
- Install Docker and Docker Compose plugin.
- Open ports `80`, `443`, and `22`.

## 2. Clone and configure
```bash
git clone <your-repo-url> private-banker-dashboard
cd private-banker-dashboard
cp .env.production.example .env
```

Set production values in `.env`:
- `DATABASE_URL` (points to local docker postgres or managed DB)
- `NEXTAUTH_URL` (public https URL)
- `NEXTAUTH_SECRET`
- Google OAuth credentials
- OpenAI key/base URL
- `ALLOWED_EMAILS`

## 3. Run migrations and seed (optional)
```bash
docker compose run --rm app npm run db:migrate
docker compose run --rm app npm run db:seed
```

## 4. Start stack
```bash
docker compose up -d --build
```

Healthcheck:
```bash
curl http://localhost:3000/api/health
```

## 5. Reverse proxy
Use Nginx or Caddy in front of container. Example Nginx config is in `docs/nginx.conf`.

## 6. TLS
- Use Certbot for Nginx or Caddy automatic certificates.
- Ensure `NEXTAUTH_URL` is HTTPS.
