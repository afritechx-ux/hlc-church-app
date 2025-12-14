# 🚀 Deployment Guide

## Quick Start

### Prerequisites
- Git repository (GitHub, GitLab, or Bitbucket)
- Free accounts on: [Supabase](https://supabase.com), [Railway](https://railway.app), [Vercel](https://vercel.com), [Expo](https://expo.dev)

---

## Step 1: Push to GitHub

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit - ready for deployment"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/hlc-app.git
git push -u origin main
```

---

## Step 2: Database (Supabase)

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Choose a name and password
3. Go to **Settings → Database → Connection String**
4. Copy the URI (use **URI** tab, not **Session Pooler**)
5. Save it - you'll need it for Railway

---

## Step 3: Backend (Railway)

1. Go to [railway.app](https://railway.app) → **New Project**
2. Select **Deploy from GitHub repo**
3. Choose your repository
4. Set **Root Directory**: `backend`
5. Add **Environment Variables**:
   ```
   DATABASE_URL = your-supabase-connection-string
   JWT_SECRET = generate-random-32-char-string
   JWT_REFRESH_SECRET = generate-another-random-string
   NODE_ENV = production
   PORT = 3333
   ```
6. Deploy! Copy your Railway URL (e.g., `https://hlc-backend.railway.app`)

---

## Step 4: Admin Web (Vercel)

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Set **Root Directory**: `admin-web`
4. Add **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL = https://your-backend.railway.app
   ```
5. Deploy! Get your Vercel URL (e.g., `https://hlc-admin.vercel.app`)

---

## Step 5: Mobile App (Expo EAS)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Navigate to mobile app
cd mobile-app

# Update API URL in app config
# Edit app.json or .env to point to your Railway backend

# Configure EAS
eas build:configure

# Build APK for Android
eas build --platform android --profile preview

# Download and install APK from the Expo dashboard
```

---

## Environment Variables Summary

| Service | Variable | Value |
|---------|----------|-------|
| Railway | `DATABASE_URL` | From Supabase |
| Railway | `JWT_SECRET` | Random 32+ chars |
| Railway | `JWT_REFRESH_SECRET` | Random 32+ chars |
| Vercel | `NEXT_PUBLIC_API_URL` | Railway URL |
| Mobile | `EXPO_PUBLIC_API_URL` | Railway URL |

---

## 🎉 Done!

Your app is now live:
- **Backend API**: `https://xxx.railway.app`
- **Admin Web**: `https://xxx.vercel.app`
- **Mobile App**: Download APK from Expo dashboard
