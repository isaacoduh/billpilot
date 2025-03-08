# BillPilot - MERN Invoice Web App

## Overview

BillPilot is a **full-stack MERN application** designed for generating invoices, quotations, and receipts. This project leverages **Docker, NGINX, Redux Toolkit, Express, MongoDB**, and other modern technologies to deliver a secure and scalable invoice management system.

## Key Features

- **Authentication & Security**
  - Token-based authentication with refresh token rotation
  - Social authentication via Google OAuth
  - Secure API with HTTPS and SSL (Let's Encrypt)
- **Invoice & Document Management**
  - Generate invoices, quotations, and receipts
  - PDF generation using PhantomJS
  - Cloud-based document storage with Cloudinary
- **User & Role Management**
  - User registration, email verification, and profile management
  - Role-based access control (RBAC)
- **Dockerized Development & Deployment**
  - Multi-container setup using Docker Compose
  - Reverse proxy and load balancing via NGINX
  - Container management with Portainer
  - NGINX Proxy Manager for production environments
- **State Management & Frontend**
  - React with Redux Toolkit & RTK Query
  - Material UI for modern UI components
- **Backend & API Design**
  - Node.js with Express.js
  - MongoDB with Mongoose ORM
  - Custom logging with Morgan & Winston
  - Email notifications using Mailgun
- **DevOps & Deployment**
  - Ubuntu server setup with Docker
  - Automated deployment using Bash scripts
  - Cloud-hosted database via MongoDB Atlas

## Tech Stack

- **Frontend**: React, Redux Toolkit, Material UI
- **Backend**: Node.js, Express.js, Mongoose
- **Database**: MongoDB (MongoDB Atlas for production)
- **Authentication**: JWT, Google OAuth
- **DevOps & Infrastructure**: Docker, NGINX, Portainer, NGINX Proxy Manager
- **Other**: Cloudinary (file storage), Mailgun (email), PhantomJS (PDF generation)

## Installation & Setup

### Prerequisites

Ensure you have the following installed:

- Docker & Docker Compose
- Node.js & npm
- MongoDB (local or MongoDB Atlas)

### Steps to Run Locally

1. Clone the repository:
   ```sh
   git clone https://github.com/your-repo/billpilot.git
   cd billpilot
   ```
2. Set up the environment variables:
   ```sh
   cp .env.example .env
   ```
   Update `.env` with your credentials.
3. Build and start the containers:
   ```sh
   docker-compose up --build
   ```
4. Access the app at `http://localhost:3000`

## API Documentation

API documentation is available at:

- `http://localhost:5000/docs/`

## Deployment

To deploy to a production server:

1. Set up an Ubuntu server
2. Install Docker & Docker Compose
3. Configure NGINX as a reverse proxy
4. Use Let's Encrypt for SSL
5. Deploy using `docker-compose up -d`

## Monitoring & Logs

- Use **Portainer** for container management
- Logs are handled with **Morgan & Winston**

## Future Enhancements

- Add payment gateway integration
- Implement multi-tenant invoicing support
- Improve UI/UX with additional themes

## Conclusion

BillPilot is a **feature-rich, production-ready invoice management system** built with modern web technologies. It provides a hands-on experience with **full-stack MERN development, containerization, and DevOps best practices**.

---

**Contributors**: Isaac Oduh
