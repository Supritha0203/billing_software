# Debugging Vercel Deployment Issues

## How to View Logs in Vercel

### Method 1: Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click on **Deployments** tab
4. Click on the latest deployment
5. Click on **Functions** tab (or scroll down)
6. Click on the function name (e.g., `api/index`)
7. You'll see **Runtime Logs** and **Invocation Logs**

### Method 2: Real-time Logs
1. In your project dashboard
2. Go to **Logs** tab
3. You'll see real-time logs from all functions

### Method 3: Vercel CLI
```bash
vercel logs [deployment-url]
```

## Common Issues Fixed

### 1. ✅ Added Comprehensive Logging
The API now logs:
- Request received
- Request body
- Template file location checks
- Image processing steps
- PDF generation steps
- All errors with stack traces

### 2. ✅ Template File Inclusion
Added `includeFiles` in vercel.json to ensure `invoice_template.png` is included in the serverless function bundle.

### 3. ✅ Better Error Messages
Errors now include:
- Detailed error messages
- Debug information (paths checked, current directory)
- Stack traces in development mode

### 4. ✅ Health Check Endpoint
Added `/api/health` endpoint that shows:
- Server status
- Whether template file is found
- Current working directory
- Template file path

## Testing the Health Endpoint

Visit: `https://your-app.vercel.app/api/health`

This will show you:
```json
{
  "status": "ok",
  "message": "Billing server is running",
  "templateFound": true/false,
  "templatePath": "/path/to/template",
  "cwd": "/current/working/directory",
  "__dirname": "/function/directory"
}
```

## Debugging Steps

1. **Check Health Endpoint First**
   - Visit `/api/health` to see if template is found
   - Check the paths it shows

2. **Check Function Logs**
   - Go to Vercel Dashboard → Your Project → Deployments → Latest → Functions
   - Look for error messages or logs

3. **Test with Simple Request**
   - Try the health endpoint first
   - Then try generating an invoice with minimal data

4. **Check Template File**
   - Make sure `invoice_template.png` is committed to git
   - Verify it's in the root directory (same level as `vercel.json`)

## What to Look For in Logs

### Successful Request:
```
Invoice generation request received
Request body: {...}
Template found at: /path/to/template
Template loaded, size: 12345
Image dimensions: { width: 800, height: 1200 }
Creating image composite...
PNG created, size: 67890
Converting to PDF...
PDF created, size: 54321
Sending PDF response...
```

### Failed Request:
```
Error generating invoice: [error message]
Error stack: [stack trace]
```

## If Template Not Found

The function now checks multiple paths:
1. `../../invoice_template.png` (from api/ to root)
2. `../../../invoice_template.png` (if nested deeper)
3. `process.cwd()/invoice_template.png` (from project root)
4. `process.cwd()/react_fullstack/../invoice_template.png`

If none are found, check:
- Is the file committed to git?
- Is it in the root directory?
- Check the health endpoint to see what paths were checked

## Next Steps

1. Deploy the updated code
2. Check the health endpoint: `/api/health`
3. Check function logs in Vercel dashboard
4. Try generating an invoice
5. Review the logs for any errors

The enhanced logging should help identify exactly where the issue is!

