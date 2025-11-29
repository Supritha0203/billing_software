# Siddivinayaka Jewellery - Billing Software

A complete React fullstack application for generating invoices for jewellery billing.

## Features

- ✨ Beautiful, modern UI with gradient designs
- 📅 Auto-filled today's date
- 👤 Customer information (name, phone number)
- 💰 Gold rate input with real-time calculations
- 📦 Multiple items with grams and milligrams
- 🧮 Automatic amount calculation based on gold rate and weight
- 🖨️ Invoice generation with template overlay
- 📱 Responsive design

## Quick Start

See [INSTALLATION.md](./INSTALLATION.md) for detailed installation and running instructions.

### Quick Commands (From Root Directory)

```bash
# Install all dependencies
npm run install:all

# Run in development (single command - starts both servers)
npm run dev
```

Then open **http://localhost:3000** in your browser!

**Note:** Invoices are now downloaded as **PDF files**!

## Technology Stack

- **Frontend:** React 18 + Vite
- **Backend:** Node.js + Express
- **Image Processing:** Sharp (Windows-compatible, no native dependencies)
- **Styling:** Modern CSS with gradients and animations

## Important Notes

The invoice generation uses coordinates to place text on the template image. The current coordinates in `server.js` are approximate and may need adjustment based on your exact template layout. 

If you need to adjust the coordinates, edit the `coordinates` object in `react_fullstack/server/server.js`.

