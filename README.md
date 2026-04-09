# ✈️ Travel Curator — Quotation System

> A full-stack internal tool for travel agencies to create, manage, and export professional travel quotations — with PDF generation, photo uploads, service catalog, and a rich admin dashboard.

![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-CDN-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-Internal_Use-red?style=for-the-badge)

---

## 📸 Screenshots

> Place your screenshots in a `/screenshots` folder at the project root, then they will render here automatically.

| Quotation Builder | Day-by-Day Itinerary |
|---|---|
| ![Quotation Form](./screenshots/quotation-form.png) | ![Itinerary](./screenshots/itinerary.png) |

| PDF Export Preview | Service Catalog Picker |
|---|---|
| ![PDF Export](./screenshots/pdf-export.png) | ![Service Catalog](./screenshots/service-catalog.png) |

| Admin — Destinations | Admin — Cities & Services |
|---|---|
| ![Admin Destinations](./screenshots/admin-destinations.png) | ![Admin Cities](./screenshots/admin-cities.png) |

| Admin — services | services Management |
|---|---|
| ![Admin services](./screenshots/admin-services.png) | ![Staff](./screenshots/admin-services.png) |

---

## 🗂️ Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Local Setup](#-local-setup)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [CSV Import Format](#-csv-import-format-for-service-catalog)
- [Push to GitHub](#-push-to-github)
- [Deploy to DigitalOcean](#-deploy-to-digitalocean-no-domain-needed)

---

## ✨ Features

### Quotation Builder (`/`)
- Create detailed travel quotations with destination, dates, pax details, and agent name
- Add multiple hotels with city, check-in/out, room type, rooms, meal plan, and nightly rate
- Day-by-day itinerary cards auto-generated from travel dates
- **7 service types** per day: Airport Transfer, Day Tour, Hotel Transfer, Tour Guide, Visa, Car Rental, Other
- **Service Catalog Picker** — choose from pre-defined city services with fixed rates
- Attach photos to individual hotels and services (thumbnails appear inline and in the PDF)
- Grand Total auto-calculated from hotels + services
- Save, edit, copy, and delete quotations
- One-click PDF export — client-facing format, no prices shown

### Admin Dashboard (`/admin.html`)
- **Destinations** — create and delete destinations with descriptions
- **Cities & Services** — manage cities per destination; full service catalog with rates; bulk CSV import/export
- **Quotations** — browse all quotations with filters, delete entries, export summary CSV
- **Staff** — register and delete staff/agent accounts
- No login required (open internal tool)

### PDF Export
- Professional A4 format with company branding
- Hotel accommodation table (no prices)
- Included services table with day numbers and photo thumbnails beside each service
- No total price shown — clean, client-friendly layout

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js 20 LTS |
| **Framework** | Express 4 |
| **Database** | MongoDB 7 via Mongoose 8 |
| **Frontend** | Vanilla JS + Tailwind CSS (CDN) |
| **File Uploads** | Multer (disk + memory storage) |
| **Security** | Helmet, express-rate-limit, CORS |
| **Process Manager** | PM2 (production) |
| **Reverse Proxy** | Nginx (production) |

---

## 📁 Project Structure

```
travel-quotation-api/
├── config/
│   └── database.js              # MongoDB connection
├── controllers/
│   ├── adminController.js       # Stats, CSV export/import, users, destinations
│   ├── destinationController.js # Destination CRUD
│   ├── quotationController.js   # Quotation CRUD + photo upload
│   └── userController.js        # Staff list
├── middleware/
│   └── auth.js                  # JWT middleware (available, not enforced)
├── models/
│   ├── Destination.js           # Destinations → cities → cityServices catalog
│   ├── Quotation.js             # Quotations: hotels, services, photos, total
│   └── User.js                  # Staff accounts
├── routes/
│   ├── admin.js                 # /api/admin/*
│   ├── destinations.js          # /api/destinations/*
│   ├── quotations.js            # /api/quotations/*
│   └── users.js                 # /api/staff, /api/auth
├── public/
│   ├── index.html               # Quotation builder UI
│   ├── admin.html               # Admin dashboard UI
│   ├── js/
│   │   ├── app.js               # Quotation builder logic (~1,500 lines)
│   │   └── admin.js             # Admin dashboard logic
│   ├── css/
│   └── uploads/                 # Uploaded images (gitignored)
├── screenshots/                 # Add your app screenshots here
├── .env                         # Environment variables (NOT committed)
├── .env.example                 # Safe template to commit
├── package.json
├── seed.js                      # Optional database seeder
└── server.js                    # Express entry point + middleware stack
```

---

## ✅ Prerequisites

Before you begin, make sure you have installed:

- **Node.js** v18 or v20 LTS → [nodejs.org](https://nodejs.org)
- **MongoDB** v7 local, **or** a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- **Git** → [git-scm.com](https://git-scm.com)
- `npm` comes bundled with Node.js

---

## 💻 Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create your environment file

```bash
cp .env.example .env
```

Edit `.env` with your values — see [Environment Variables](#-environment-variables).

### 4. Start the server

```bash
# Development mode (auto-restarts on file changes — requires nodemon)
npm run dev

# Standard start
npm start
```

### 5. Open the app

| Page | URL |
|---|---|
| Quotation Builder | http://localhost:5000 |
| Admin Dashboard | http://localhost:5000/admin.html |
| API Health Check | http://localhost:5000/health |

---

## 🔐 Environment Variables

**`.env`** (never commit this file):

```env
# ── Server ────────────────────────────────────────────────────
PORT=5000
NODE_ENV=production

# ── MongoDB ───────────────────────────────────────────────────
# Option A: Local MongoDB
MONGODB_URI=mongodb://localhost:27017/travel_quotations

# Option B: MongoDB Atlas (recommended for cloud deployments)
# MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/travel_quotations?retryWrites=true&w=majority

# ── CORS ──────────────────────────────────────────────────────
# Leave empty to allow all origins (fine for internal tools)
# Or set to your server IP: http://143.198.xx.xx
CORS_ORIGINS=

# ── JWT (available for optional future auth) ──────────────────
JWT_SECRET=replace_with_a_long_random_string_minimum_32_chars
JWT_EXPIRE=7d
```

**`.env.example`** (safe to commit):

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/travel_quotations
CORS_ORIGINS=
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d
```

---

## 📡 API Reference

### Quotations — `/api/quotations`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/quotations` | List all (filters: `destination`, `status`, `startDate`, `endDate`, `limit`, `sort`) |
| `POST` | `/api/quotations` | Create quotation |
| `GET` | `/api/quotations/:id` | Get single quotation |
| `PUT` | `/api/quotations/:id` | Update quotation |
| `DELETE` | `/api/quotations/:id` | Delete quotation |
| `PATCH` | `/api/quotations/:id/status` | Update status (`draft` / `confirmed` / `cancelled`) |
| `POST` | `/api/quotations/:id/copy` | Duplicate a quotation |
| `POST` | `/api/quotations/:id/photos` | Upload photos to a quotation |
| `POST` | `/api/quotations/upload` | Upload a single item-level photo (returns URL) |

### Destinations — `/api/destinations`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/destinations` | List all active (returns name, cities, cityServices) |
| `POST` | `/api/destinations` | Create destination |
| `PUT` | `/api/destinations/:id` | Update (cities, hotels, cityServices catalog) |
| `GET` | `/api/destinations/:name` | Get by name (full data) |
| `GET` | `/api/destinations/:name/hotels/:city` | Get hotels filtered by city |

### Admin — `/api/admin`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/destinations` | All destinations with full data |
| `DELETE` | `/api/admin/destinations/:id` | Delete destination |
| `GET` | `/api/admin/users` | List all staff members |
| `DELETE` | `/api/admin/users/:id` | Delete staff member |
| `GET` | `/api/admin/stats` | Quotation statistics (count, revenue, by status, top destinations) |
| `GET` | `/api/admin/export` | Export quotations as CSV |
| `GET` | `/api/admin/export/catalog` | Export service catalog as CSV |
| `POST` | `/api/admin/import/catalog` | Import service catalog from CSV (`multipart/form-data`, field: `csv`) |

### Staff & Auth — `/api`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/staff` | List all staff names |
| `POST` | `/api/auth/register` | Register a new staff member |

---

## 📄 CSV Import Format for Service Catalog

Use the **Admin Dashboard → Cities & Services → Import CSV** button to bulk-load services.

The file must use this exact column format:

```csv
Destination,City,Service Name,Service Type,Rate
Morocco,Marrakech,Airport to Hotel Transfer,AirportTransfer,120.00
Morocco,Marrakech,Full-Day Medina City Tour,DayTour,200.00
Morocco,Casablanca,Hassan II Mosque Private Tour,TourGuide,175.00
Turkey,Istanbul,Sabiha Airport to Hotel,AirportTransfer,80.00
Turkey,Istanbul,Bosphorus Cruise & Dinner,DayTour,95.00
Turkey,Cappadocia,Hot Air Balloon Ride,Other,250.00
```

**Valid values for Service Type:**

| Value | Display Name |
|---|---|
| `AirportTransfer` | Airport Transfer |
| `DayTour` | Day Tour |
| `HotelTransfer` | Hotel / Station Transfer |
| `TourGuide` | Tour Guide |
| `Visa` | Visa Service |
| `CarRental` | Car Rental |
| `Other` | Other |

> The import skips duplicate entries (same destination + city + service name) and skips rows where the destination name does not exist in the database.

---

## 🚀 Push to GitHub

### First-time setup — initialize and push

```bash
# 1. Navigate to the project root
cd /path/to/travel-quotation-api

# 2. Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
.env
public/uploads/*
!public/uploads/.gitkeep
*.log
.DS_Store
Thumbs.db
EOF

# 3. Keep the uploads folder but ignore its contents
touch public/uploads/.gitkeep

# 4. Create .env.example from your .env (remove real values)
cp .env .env.example
# Then open .env.example and replace real values with placeholders

# 5. Initialize git repo (skip if already initialized)
git init

# 6. Stage all files
git add .

# 7. Create initial commit
git commit -m "Initial commit — Travel Curator quotation system"

# 8. Go to https://github.com/new and create a new repository
#    Copy the repo URL, then:

# 9. Add the GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 10. Push to GitHub
git branch -M main
git push -u origin main
```

### Every update after that

```bash
# Stage your changes
git add .

# Commit with a clear message
git commit -m "Add: feature description / Fix: bug description"

# Push to GitHub
git push
```

### Quick-reference git commands

```bash
git status                        # See what changed
git diff                          # See exact line changes
git log --oneline --graph         # Visual commit history
git pull origin main              # Pull latest (if collaborating)
git push origin main              # Push latest
git stash                         # Temporarily save uncommitted changes
git stash pop                     # Restore stashed changes
```

> ⚠️ **Never commit `.env`** — it contains your database URI and secrets. Confirm `.env` is listed in `.gitignore` before every push.

---

## 🌊 Deploy to DigitalOcean (No Domain Needed)

Access the live app via the droplet's public IP: `http://YOUR_DROPLET_IP`

---

### Step 1 — Create a Droplet

1. Log in to [cloud.digitalocean.com](https://cloud.digitalocean.com)
2. **Create → Droplets**
3. Settings:
   - **Image:** Ubuntu 22.04 LTS x64
   - **Plan:** Basic → Regular → **$6/mo** (1 vCPU · 1 GB RAM · 25 GB SSD) — sufficient for an internal tool
   - **Region:** Closest to your team
   - **Authentication:** SSH Key (recommended) or Password
4. Click **Create Droplet**
5. Note down the **Public IP Address**

---

### Step 2 — Connect via SSH

```bash
# From your local terminal (Mac/Linux)
ssh root@YOUR_DROPLET_IP

# If using an SSH key file
ssh -i ~/.ssh/id_rsa root@YOUR_DROPLET_IP
```

> **Windows users:** Use [PuTTY](https://putty.org) or the built-in Windows Terminal / PowerShell with the same `ssh` command.

---

### Step 3 — Install Node.js 20

```bash
# Update system packages
apt update && apt upgrade -y

# Install Node.js 20 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify
node --version    # v20.x.x
npm --version
```

---

### Step 4 — Install MongoDB

```bash
# Import MongoDB signing key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
  gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add MongoDB repo
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \
  https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
  tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install
apt update && apt install -y mongodb-org

# Start MongoDB and enable auto-start on reboot
systemctl start mongod
systemctl enable mongod

# Verify it's running
systemctl status mongod
```

> **Alternative:** Skip this step and use [MongoDB Atlas Free Tier](https://www.mongodb.com/atlas) instead. Just paste your Atlas connection string as `MONGODB_URI` in the `.env` file.

---

### Step 5 — Install PM2 and Nginx

```bash
# PM2 — production process manager for Node.js
npm install -g pm2

# Nginx — web server to proxy traffic on port 80
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

---

### Step 6 — Clone the Repository

```bash
cd /var/www

# Clone your GitHub repo
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git travel-curator

cd travel-curator
```

---

### Step 7 — Install Dependencies and Configure Environment

```bash
# Install production dependencies only
npm install --production

# Ensure uploads directory exists
mkdir -p public/uploads

# Create the environment file
nano .env
```

Paste and edit this into the editor:

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/travel_quotations
CORS_ORIGINS=
JWT_SECRET=replace_with_a_very_long_random_string_here
JWT_EXPIRE=7d
```

Save: `Ctrl+O` → `Enter` → `Ctrl+X`

---

### Step 8 — Start the App with PM2

```bash
# Start the Node.js app
pm2 start server.js --name "travel-curator"

# Save the PM2 process list
pm2 save

# Register PM2 to auto-start after server reboots
pm2 startup
# ↑ Run the exact command it prints out (starts with "sudo env PATH=...")

# Verify the app is running
pm2 status
pm2 logs travel-curator --lines 30
```

---

### Step 9 — Configure Nginx as Reverse Proxy

```bash
nano /etc/nginx/sites-available/travel-curator
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name _;          # Matches any hostname / IP address

    # Allow large file uploads (photos)
    client_max_body_size 25M;

    location / {
        proxy_pass         http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;

        # Increase timeouts for slow connections
        proxy_read_timeout 120s;
        proxy_connect_timeout 120s;
    }
}
```

Save and exit, then activate:

```bash
# Enable the site
ln -s /etc/nginx/sites-available/travel-curator /etc/nginx/sites-enabled/

# Remove the default placeholder page
rm -f /etc/nginx/sites-enabled/default

# Test the configuration for errors
nginx -t

# Apply the configuration
systemctl reload nginx
```

---

### Step 10 — Configure Firewall (UFW)

```bash
# Allow SSH (ALWAYS do this first — or you'll lock yourself out)
ufw allow OpenSSH

# Allow HTTP (port 80) through Nginx
ufw allow 'Nginx HTTP'

# Enable the firewall
ufw enable

# Verify rules
ufw status verbose
```

---

### Step 11 — Access the Live App

Open any browser on your network:

```
http://YOUR_DROPLET_IP
```

| Page | URL |
|---|---|
| Quotation Builder | `http://YOUR_DROPLET_IP` |
| Admin Dashboard | `http://YOUR_DROPLET_IP/admin.html` |
| API Health Check | `http://YOUR_DROPLET_IP/health` |

---

### Step 12 — Updating the App After Changes

Every time you push new code to GitHub:

```bash
# 1. SSH into the droplet
ssh root@YOUR_DROPLET_IP

# 2. Navigate to the app
cd /var/www/travel-curator

# 3. Pull latest code
git pull origin main

# 4. Install any new dependencies
npm install --production

# 5. Restart the app
pm2 restart travel-curator

# 6. Confirm it's healthy
pm2 status
curl http://localhost:5000/health
```

---

### Useful Commands on the Server

**PM2 — process management:**
```bash
pm2 status                           # Show running processes
pm2 logs travel-curator              # Live log stream
pm2 logs travel-curator --lines 100  # Last 100 lines
pm2 restart travel-curator           # Restart app
pm2 stop travel-curator              # Stop app
pm2 monit                            # Real-time CPU / memory monitor
```

**MongoDB — database:**
```bash
mongosh                              # Open MongoDB shell
use travel_quotations                # Switch to app database
db.quotations.countDocuments()       # Count quotations
db.destinations.find({},{name:1})    # List destination names
exit                                 # Exit shell
```

**Nginx:**
```bash
nginx -t                             # Test config for errors
systemctl reload nginx               # Apply config changes
systemctl status nginx               # Check Nginx status
cat /var/log/nginx/error.log         # View Nginx error log
```

---

## 🔒 Security Notes for Production

| Concern | Recommendation |
|---|---|
| **Access control** | Restrict port 80 in DigitalOcean Firewall to your office IP(s) only |
| **MongoDB** | Stays bound to `127.0.0.1` — never exposed publicly |
| **Uploads** | Stored in `public/uploads/` on the server's local disk |
| **Secrets** | `.env` is never committed to Git |
| **Rate limiting** | API is limited to 100 requests per 15 minutes per IP (configured in `server.js`) |

### Restrict app to your office IP only (recommended)

In DigitalOcean: **Networking → Firewalls → Create Firewall**

- **Inbound rule:** HTTP (port 80) → **Source:** Your office IP address
- **Inbound rule:** SSH (port 22) → **Source:** Your office IP address
- Attach the firewall to your droplet

This makes the tool invisible to the public internet while remaining fully accessible from your office.

---

## 🧱 Architecture Diagram

```
Browser (your team)
        │
        │ HTTP :80
        ▼
   ┌─────────┐
   │  Nginx  │  ← Reverse proxy, handles uploads, SSL (optional later)
   └────┬────┘
        │ proxy_pass :5000
        ▼
   ┌─────────────┐
   │  Node.js    │  ← Express app managed by PM2
   │  (Express)  │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │  MongoDB    │  ← Local or Atlas
   │  :27017     │
   └─────────────┘
          │
          ▼
   ┌─────────────┐
   │  /uploads/  │  ← Images stored on disk
   └─────────────┘
```

---

*Built for Dopamine Travel — Internal Use Only*
