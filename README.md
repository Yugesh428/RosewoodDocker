# 🏥 Rosewood Pharmacy - Docker Setup Guide

Complete guide for setting up the Rosewood Pharmacy application using Docker on any machine.

---

## 📦 What You Need to Transfer

To set up this project on another laptop, you need to transfer the **ENTIRE PROJECT FOLDER**, not just the docker folder.

### Required Project Structure:

```
rosewood/                          ← Transfer this ENTIRE folder
├── docker/                        ← Docker configuration
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── seed-admin.ts
│   ├── seed-heavy.ts
│   └── README.md (this file)
├── src/                           ← Source code (REQUIRED)
│   ├── app/
│   ├── components/
│   ├── features/
│   └── lib/
├── public/                        ← Static files (REQUIRED)
│   └── uploads/
├── package.json                   ← Dependencies (REQUIRED)
├── package-lock.json              ← Lock file (REQUIRED)
├── next.config.ts                 ← Next.js config (REQUIRED)
├── tsconfig.json                  ← TypeScript config (REQUIRED)
├── tsconfig.scripts.json          ← Scripts config (REQUIRED)
├── .env.example                   ← Environment template
└── .gitignore
```

### ⚠️ CRITICAL: You Must Transfer the Complete Project

**DO NOT** copy just the `docker/` folder. The Dockerfile needs access to:
- `src/` - Application source code
- `package.json` - Dependencies
- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- All other project files

---

## 🚚 How to Transfer to Another Laptop

### Method 1: ZIP the Entire Project (Recommended)

**On your current laptop:**

1. Navigate to the project parent folder:
   ```cmd
   cd C:\Users\Acer\Desktop\RosewoodFinal
   ```

2. Right-click on the `rosewood` folder → Send to → Compressed (zipped) folder

3. Copy `rosewood.zip` to USB drive or upload to cloud storage

**On the new laptop:**

1. Extract `rosewood.zip` to any location (e.g., `C:\Projects\rosewood`)

2. Open terminal in the extracted folder:
   ```cmd
   cd C:\Projects\rosewood
   ```

3. Navigate to docker folder:
   ```cmd
   cd docker
   ```

4. Continue with [Quick Start](#quick-start-3-steps) below

### Method 2: Git Clone (If using Git)

```bash
git clone <repository-url>
cd rosewood/docker
```

### Method 3: USB/External Drive

1. Copy the entire `rosewood` folder to USB drive
2. Paste on new laptop
3. Navigate to `rosewood/docker` folder
4. Continue with setup

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start (3 Steps)](#quick-start-3-steps)
- [Detailed Setup Instructions](#detailed-setup-instructions)
- [Common Commands](#common-commands)
- [Troubleshooting](#troubleshooting)
- [What's Included](#whats-included)
- [Customization](#customization)
- [Production Deployment](#production-deployment)

---

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

1. **Docker Desktop** (Latest version)
   - Windows: [Download Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
   - Mac: [Download Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)
   - Linux: [Install Docker Engine](https://docs.docker.com/engine/install/)

2. **Git** (Optional, for cloning the repository)
   - [Download Git](https://git-scm.com/downloads)

### System Requirements

- **RAM**: Minimum 4GB available (8GB recommended)
- **Disk Space**: At least 5GB free
- **Ports**: 3000 and 5432 must be available

### Verify Installation

Open your terminal and run:

```bash
docker --version
docker compose version
```

You should see version numbers for both commands.

---

## 🚀 Quick Start (3 Steps)

### Step 1: Navigate to Docker Directory

```bash
cd /path/to/rosewood/docker
```

**Windows Example:**
```cmd
cd C:\Users\YourName\Desktop\RosewoodFinal\rosewood\docker
```

**Mac/Linux Example:**
```bash
cd ~/Desktop/RosewoodFinal/rosewood/docker
```

### Step 2: Build and Start Services

```bash
docker compose build
docker compose up -d
```

**What this does:**
- Builds Docker images for the application (~5 minutes first time)
- Starts PostgreSQL database
- Starts Next.js application
- Creates necessary volumes for data persistence

### Step 3: Seed Database with Demo Data

```bash
docker compose run --rm seed-heavy
```

**What this creates:**
- ✅ 1 Admin user + 5 sample customers
- ✅ 8 Pharmacy categories with 8 top-selling products
- ✅ 8 Customer reviews (4.6★ average)
- ✅ 4 UI product collections with videos
- ✅ 2 Hero carousel slides
- ✅ 3 Customer testimonials
- ✅ Complete About Us content
- ✅ Contact information
- ✅ 44+ Sample orders

### 🎉 You're Ready!

Open your browser and visit:

- **Public Site**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin/login

**Admin Credentials:**
- Email: `admin@rosewood.com`
- Password: `Admin@1234`

**Sample Customer:**
- Email: `john@example.com`
- Password: `Customer@123`

---

## 📖 Detailed Setup Instructions

### Understanding the Docker Setup

The application consists of 3 main services:

1. **db** (PostgreSQL 16)
   - Database server
   - Port: 5432
   - Persistent storage via Docker volume

2. **app** (Next.js Application)
   - Web application server
   - Port: 3000
   - Production-optimized build

3. **seed-heavy** (Data Seeding)
   - One-time script to populate database
   - Runs and exits automatically

### File Structure

```
docker/
├── Dockerfile              # Multi-stage build configuration
├── docker-compose.yml      # Services orchestration
├── README.md              # This file
├── seed-admin.ts          # Basic seed (admin only)
├── seed-heavy.ts          # Complete seed (recommended)
└── DEPLOYMENT-SUMMARY.md  # Detailed deployment info
```

### Environment Variables

The Docker setup uses default values that work out of the box. To customize, create a `.env` file in the project root:

```env
# Database
DATABASE_URL=postgresql://rosewood_user:rosewood_pass@db:5432/rosewood?sslmode=disable

# Authentication
NEXTAUTH_SECRET=your-secret-key-min-32-chars
AUTH_SECRET=your-secret-key-min-32-chars
NEXTAUTH_URL=http://localhost:3000

# Admin Credentials (for seeding)
SEED_ADMIN_NAME=Your Admin Name
SEED_ADMIN_EMAIL=admin@yourdomain.com
SEED_ADMIN_PASSWORD=YourSecurePassword

# Storage (local for Docker)
STORAGE_PROVIDER=local
```

---

## 🔧 Common Commands

### Starting & Stopping

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# Stop and remove volumes (delete all data)
docker compose down -v

# Restart a specific service
docker compose restart app
```

### Viewing Logs

```bash
# View all logs
docker compose logs

# Follow logs in real-time
docker compose logs -f

# View logs for specific service
docker compose logs app
docker compose logs db

# View last 50 lines
docker compose logs --tail=50 app
```

### Database Operations

```bash
# Run basic seed (admin + themes only)
docker compose run --rm seed

# Run heavy seed (complete demo data)
docker compose run --rm seed-heavy

# Access database directly
docker exec -it rosewood_db psql -U rosewood_user -d rosewood

# Backup database
docker exec rosewood_db pg_dump -U rosewood_user rosewood > backup.sql

# Restore database
docker exec -i rosewood_db psql -U rosewood_user rosewood < backup.sql
```

### Rebuilding

```bash
# Rebuild all images
docker compose build

# Rebuild specific service
docker compose build app

# Force rebuild without cache
docker compose build --no-cache

# Rebuild and restart
docker compose build app && docker compose up -d app
```

### Health Checks

```bash
# Check service status
docker compose ps

# View all containers (including stopped)
docker compose ps -a

# Check logs for errors
docker compose logs app | grep -i error
```

---

## 🐛 Troubleshooting

### Port Already in Use

**Problem:** Error message about port 3000 or 5432 already in use.

**Solution:**

```bash
# Find process using the port (Windows)
netstat -ano | findstr :3000
netstat -ano | findstr :5432

# Find process using the port (Mac/Linux)
lsof -i :3000
lsof -i :5432

# Kill the process or change ports in docker-compose.yml
```

### Database Not Ready

**Problem:** App fails to connect to database.

**Solution:**

```bash
# Check database logs
docker compose logs db

# Wait for health check
docker compose ps

# Ensure database is "healthy" before running seed
docker compose up -d
# Wait 30 seconds
docker compose run --rm seed-heavy
```

### Build Failures

**Problem:** Docker build fails with errors.

**Solution:**

```bash
# Clean Docker cache
docker system prune -a

# Remove all containers and volumes
docker compose down -v

# Rebuild from scratch
docker compose build --no-cache
docker compose up -d
```

### Seed Script Fails

**Problem:** Seed script exits with errors.

**Solution:**

```bash
# Ensure database is running and healthy
docker compose ps

# Check if tables exist
docker compose exec app npx tsx --tsconfig tsconfig.scripts.json src/lib/database/sync.ts

# Try running seed again
docker compose run --rm seed-heavy
```

### Application Not Accessible

**Problem:** Can't access http://localhost:3000

**Solution:**

```bash
# Check if app is running
docker compose ps

# Check app logs
docker compose logs app

# Restart app service
docker compose restart app

# Ensure no firewall blocking port 3000
```

### Out of Disk Space

**Problem:** Docker build fails due to disk space.

**Solution:**

```bash
# Remove unused Docker resources
docker system prune -a --volumes

# Check disk usage
docker system df

# Remove specific old images
docker images
docker rmi <image-id>
```

---

## 📦 What's Included

### Demo Data Overview

After running `docker compose run --rm seed-heavy`, you'll have:

#### Users & Authentication
- **1 Admin Account** (full access to admin panel)
- **5 Customer Accounts** (for testing customer features)

#### Pharmacy Products (8 Categories)
1. **Pain Relief** - Paracetamol 500mg Tablets ($8.99)
2. **Cold & Flu** - Day & Night Capsules ($15.99)
3. **Digestive Health** - Probiotic 30B CFU ($29.99)
4. **Vitamins & Supplements** - Vitamin D3 4000 IU ($18.99)
5. **Heart Health** - Omega-3 Fish Oil ($34.99)
6. **Allergy Relief** - Cetirizine 10mg ($12.99)
7. **Diabetes Care** - Blood Glucose Test Strips ($24.99)
8. **First Aid** - Adhesive Bandages Pack ($9.99)

Each product includes:
- ✅ Real product images (from Unsplash)
- ✅ Multiple product photos
- ✅ Detailed descriptions
- ✅ Ingredients with quantities
- ✅ Usage instructions
- ✅ Safety information
- ✅ Specifications

#### Product Reviews
- **8 Customer Reviews** (verified purchases)
- Average rating: **4.6/5.0 stars** ⭐
- Realistic review text
- Mix of 4-star and 5-star ratings

#### UI Content
- **2 Hero Slides** (carousel on homepage)
- **4 Product Collections** with video URLs:
  - Skincare Premium Line
  - Wellness Premium Line
  - Personal Care Premium Line
  - Vitamins & Supplements Premium Line
- **3 Customer Testimonials**
- **Complete About Us Section**:
  - Our Story (3 paragraphs)
  - Mission Statement
  - 4 Core Values (Trust, Quality, Care, Excellence)
- **Contact Information** with business hours

#### E-commerce Data
- **44+ Sample Orders** in various states:
  - Pending (awaiting confirmation)
  - Confirmed (payment received)
  - Processing (preparing for shipment)
  - Shipped (in transit)
  - Delivered (completed)
- Mix of customer and guest orders
- Realistic pricing with tax and discounts

#### Theme
- **Gold & Black Theme** active by default
- Luxury pharmacy aesthetic
- Professional color scheme

---

## 🎨 Customization

### Changing Admin Credentials

Edit `docker-compose.yml` before running seed:

```yaml
environment:
  SEED_ADMIN_NAME: "Your Name"
  SEED_ADMIN_EMAIL: "your@email.com"
  SEED_ADMIN_PASSWORD: "YourPassword123"
```

### Using Different Ports

Edit `docker-compose.yml`:

```yaml
services:
  app:
    ports:
      - "8080:3000"  # Change 8080 to your desired port
  
  db:
    ports:
      - "5433:5432"  # Change 5433 to your desired port
```

### Adding Your Own Content

After seeding, login to the admin panel and:

1. **Add Products**: Admin → Products → Add New
2. **Upload Images**: Admin → Products → Edit → Upload
3. **Manage Categories**: Admin → Categories
4. **Edit Hero Slides**: Admin → Dashboard → Hero Section
5. **Customize Theme**: Admin → Settings → Theme
6. **Update Contact Info**: Admin → Settings → Contact

---

## 🌐 Production Deployment

### Important Security Steps

Before deploying to production:

1. **Change Default Passwords**
   ```bash
   # Login to admin panel
   # Navigate to Settings → Change Password
   ```

2. **Set Secure Environment Variables**
   ```env
   NEXTAUTH_SECRET=<generate-random-32-char-string>
   AUTH_SECRET=<same-as-nextauth-secret>
   NEXTAUTH_URL=https://yourdomain.com
   ```

3. **Use External Database**
   - Don't use Docker database in production
   - Use managed PostgreSQL (AWS RDS, Supabase, etc.)

4. **Configure S3 for File Uploads**
   ```env
   STORAGE_PROVIDER=s3
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-key
   AWS_SECRET_ACCESS_KEY=your-secret
   AWS_S3_BUCKET=your-bucket-name
   ```

5. **Set Up SSL/HTTPS**
   - Use reverse proxy (Nginx, Caddy)
   - Configure SSL certificates
   - Force HTTPS redirects

6. **Configure SMTP for Emails**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your@email.com
   SMTP_PASS=your-app-password
   ```

### Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
services:
  app:
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://user:pass@external-db:5432/dbname
    restart: always
    # Remove db dependency
```

### Deployment Checklist

- [ ] Change all default passwords
- [ ] Set secure random secrets
- [ ] Configure external database
- [ ] Set up S3 for file storage
- [ ] Configure SMTP for emails
- [ ] Set up SSL/HTTPS
- [ ] Configure domain name
- [ ] Set up backup strategy
- [ ] Enable monitoring/logging
- [ ] Test all features
- [ ] Set up CI/CD pipeline

---

## 📞 Support & Documentation

### Additional Resources

- **Main README**: `../README.md`
- **Quick Start Guide**: `../DOCKER-QUICKSTART.md`
- **Deployment Summary**: `DEPLOYMENT-SUMMARY.md`
- **Application Guide**: `../GUIDE.md`

### Getting Help

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review Docker logs: `docker compose logs`
3. Verify prerequisites are met
4. Ensure ports 3000 and 5432 are available
5. Try clean rebuild: `docker compose down -v && docker compose build --no-cache`

### Useful Docker Commands Reference

```bash
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# Remove stopped containers
docker container prune

# View images
docker images

# Remove unused images
docker image prune -a

# View volumes
docker volume ls

# Remove unused volumes
docker volume prune

# View system disk usage
docker system df

# Clean up everything (careful!)
docker system prune -a --volumes
```

---

## 🎯 Next Steps

After successful setup:

1. **Explore the Admin Panel**
   - Login at http://localhost:3000/admin/login
   - Review demo data
   - Test product management

2. **Browse the Public Site**
   - Visit http://localhost:3000
   - Test product search
   - Try adding items to cart
   - Test checkout flow

3. **Test Customer Features**
   - Login as `john@example.com`
   - Place a test order
   - Add products to wishlist
   - Leave a product review

4. **Customize Content**
   - Upload your own product images
   - Edit product descriptions
   - Customize theme colors
   - Update business information

5. **Prepare for Production**
   - Review security checklist
   - Plan deployment strategy
   - Set up external services
   - Test thoroughly

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🙏 Acknowledgments

- **Next.js** - React framework
- **PostgreSQL** - Database
- **Docker** - Containerization
- **Sequelize** - ORM
- **Unsplash** - Product images

---

**Built with ❤️ for modern pharmacy management**

**Version**: 1.0.0  
**Last Updated**: September 2026
"# RosewoodDocker" 
