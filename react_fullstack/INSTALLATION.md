# Installation and Running Instructions

## Prerequisites
- Node.js (version 16 or higher)
- npm (comes with Node.js)

## Step-by-Step Installation

### Step 1: Install Concurrently (Required for Single Command)

From the **root directory** (where the main `package.json` is):

```bash
npm install
```

This installs `concurrently` which allows running both servers with one command.

### Step 2: Install All Dependencies

From the root directory:

```bash
npm run install:all
```

Or manually:

```bash
cd react_fullstack/client && npm install
cd ../server && npm install
```

**Note:** Unlike the previous `canvas` package, `sharp` doesn't require Python or native compilation on Windows, so installation should be smooth!

## Running the Application

### Development Mode (Single Command - Recommended)

From the root directory, run:

```bash
npm run dev
```

This single command will start both the backend server (port 5000) and frontend dev server (port 3000) simultaneously.

Open your browser and navigate to **http://localhost:3000** to use the application.

### Alternative: Run Separately

If you prefer to run them separately:

#### Terminal 1 - Backend Server:
```bash
npm run dev:server
```

#### Terminal 2 - Frontend Development Server:
```bash
npm run dev:client
```

### Production Mode (For Deployment)

#### Step 1: Build the Frontend
```bash
cd react_fullstack/client
npm run build
```

This creates an optimized production build in the `dist` folder.

#### Step 2: Start the Server
```bash
cd react_fullstack/server
npm start
```

The server will serve both the API and the built React app. Access it at **http://localhost:5000**

## Troubleshooting

### Port Already in Use
If port 5000 or 3000 is already in use:
- **Backend:** Set `PORT` environment variable: `set PORT=5001` (Windows) or `export PORT=5001` (Mac/Linux)
- **Frontend:** Edit `vite.config.js` and change the port number

### Template Image Not Found
Make sure `invoice_template.png` is in the root directory (same level as `react_fullstack` folder)

### Font File Not Found
The `calibri-bold-italic.ttf` file is optional. The application will work without it, using system fonts.

## Quick Start (All Commands)

```bash
# Step 1: Install concurrently (from root directory)
npm install

# Step 2: Install all dependencies
npm run install:all

# Step 3: Run in development (single command - starts both servers)
npm run dev
```

Then open **http://localhost:3000** in your browser!

**Note:** Invoices are now downloaded as **PDF files** instead of PNG images!

