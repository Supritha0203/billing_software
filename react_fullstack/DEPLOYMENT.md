# Deployment Guide

## Vercel Deployment

The application is configured for Vercel deployment with the `vercel.json` file.

### Steps to Deploy:

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Deploy from root directory**:
   ```bash
   vercel
   ```

3. **For production deployment**:
   ```bash
   vercel --prod
   ```

### Important Notes for Vercel:

- The `vercel.json` file configures the build and routing
- Frontend is built automatically during deployment
- API routes are handled by the Express server
- Make sure `invoice_template.png` is in the root directory (same level as `react_fullstack`)

### Environment Variables (if needed):

If you need to set environment variables in Vercel:
- Go to your project settings in Vercel dashboard
- Add any required environment variables
- Redeploy the application

## Local Development

### First Time Setup:

```bash
# Install concurrently (needed for single dev command)
npm install

# Install all dependencies
npm run install:all
```

### Running Development Server:

```bash
# Single command to run both frontend and backend
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend dev server on http://localhost:3000

### Production Build:

```bash
# Build frontend
npm run build

# Start production server
npm start
```

## Invoice Format

Invoices are now generated as **PDF files** instead of PNG images, making them easier to share and print professionally.

