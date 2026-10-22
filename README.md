# TanodBukid

TanodBukid is a student capstone project for agricultural monitoring and AI-assisted plant disease identification.

## Technology Stack

- Frontend: HTML, CSS, JavaScript, Vite
- Backend: PHP 8.3
- Database: MySQL 8.4
- AI Service: Python FastAPI
- Development environment: Docker Compose on WSL2

## Local Development

1. Clone the repository.
2. Create your own `.env` using `.env.example` as a template.
3. Configure your own database credentials and secrets.
4. Start the containers:

   docker compose up -d --build

5. Check container health:

   docker compose ps

## Mobile Testing

The application can be tested on a mobile browser using a temporary Cloudflare Tunnel.

Before exposing the application to the internet, disable simulated OTP:

   TANODBUKID_DEV_OTP=0

Recreate the backend container and verify the setting:

   docker compose up -d --no-deps --force-recreate backend
   docker compose exec backend printenv TANODBUKID_DEV_OTP

Expected output: 0

Start the tunnel:

   cloudflared tunnel --url http://localhost:5173 --protocol http2

Open the generated HTTPS URL on the mobile device.

## Security

- Never commit `.env` or real credentials.
- Never enable simulated OTP on an internet-accessible deployment.
- Real SMS delivery is not yet implemented.
- Cloudflare Quick Tunnel is for temporary development testing, not production hosting.
- AI predictions are experimental and should not be treated as definitive diagnoses.

## Development Status

Local development environment is operational. PHP, MySQL, frontend, and AI inference are integrated. UI and responsive layout refinement, security hardening, and final testing remain in progress.

## Security Updates

### October 22, 2026 — PHP Security Update

PHP was updated to version **8.3.36** following a security vulnerability identified on October 22, 2026.

- **Date:** October 22, 2026
- **Component:** PHP backend Docker container
- **Previous version:** PHP 8.3.35
- **Updated version:** PHP 8.3.36
- **Reason:** Security remediation
- **Validation:** PHP 8.3.36 confirmed inside the backend container.

The PHP runtime is managed through Docker. Future deployments should use supported, security-maintained PHP versions.

**Note:** This update does not confirm that all application security vulnerabilities have been remediated.
