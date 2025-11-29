# Deployment Guide - Frontend Only

## 📁 Root Directory

**Root Directory for Vercel:** The `billing_software` folder (where `vercel.json` is located)

```
billing_software/                    ← ROOT DIRECTORY (Vercel root)
├── vercel.json                     ← Vercel config
├── package.json                    ← Root package.json (optional scripts)
├── invoice_template.png            ← Original template (backup)
└── react_fullstack/
    ├── client/                     ← Frontend app (this is what gets built)
    │   ├── public/
    │   │   └── invoice_template.png ← Template used by app
    │   ├── src/
    │   ├── package.json            ← Frontend dependencies
    │   └── dist/                    ← Build output (created after build)
    ├── server/                      ← ❌ CAN DELETE (not needed)
    └── api/                         ← ❌ CAN DELETE (not needed)
```

## 🗑️ What You Can Delete

Since it's frontend-only, you can safely delete:

1. **`react_fullstack/server/`** - Server code (not needed)
2. **`react_fullstack/api/`** - API serverless functions (not needed)

These folders are not used in the frontend-only version.

## 📦 Dependency Installation

### For Local Development:

```bash
# From root directory (billing_software folder)
npm run install:client

# Or directly:
cd react_fullstack/client
npm install
```

**Only one dependency location:** `react_fullstack/client/package.json`

### For Vercel Deployment:

Vercel automatically runs:
```bash
cd react_fullstack/client && npm install && npm run build
```

No manual installation needed - Vercel handles it!

## 🚀 Deployment Steps

### 1. Clean Up (Optional)

Delete unused folders:
```bash
# Delete server folder
Remove-Item -Recurse -Force react_fullstack\server

# Delete api folder  
Remove-Item -Recurse -Force react_fullstack\api
```

### 2. Verify Files

Make sure these exist:
- ✅ `vercel.json` in root
- ✅ `react_fullstack/client/public/invoice_template.png`
- ✅ `react_fullstack/client/package.json`

### 3. Vercel Settings

1. Go to Vercel Dashboard → Your Project → Settings
2. **Root Directory:** Should be **empty** or **`.`** (root)
   - ❌ NOT `react_fullstack`
   - ✅ Should be the root of the repository

### 4. Deploy

```bash
# Commit and push
git add .
git commit -m "Frontend-only: Remove server dependencies"
git push origin main
```

Vercel will automatically:
1. Run: `cd react_fullstack/client && npm install && npm run build`
2. Deploy: `react_fullstack/client/dist/` folder
3. Serve: Static files from `dist/`

## 📝 Summary

- **Root Directory:** `billing_software/` (where `vercel.json` is)
- **Build Location:** `react_fullstack/client/`
- **Dependencies:** Only in `react_fullstack/client/package.json`
- **Output:** `react_fullstack/client/dist/`
- **Can Delete:** `react_fullstack/server/` and `react_fullstack/api/`

## ✅ Quick Commands

```bash
# Install dependencies
npm run install:client

# Run locally
npm run dev

# Build for production
npm run build

# Preview build
npm run preview
```

That's it! Simple frontend-only deployment. 🎉

