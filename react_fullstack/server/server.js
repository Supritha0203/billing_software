import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import sharp from 'sharp';
import fs from 'fs';
import PDFDocument from 'pdfkit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from React app in production
const clientDistPath = join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

// Paths to template
const templatePath = join(__dirname, '../../invoice_template.png');

// Helper function to create SVG text overlay
function createTextSVG(text, x, y, fontSize = 25, fontWeight = 'normal', color = '#000000', width = 800, height = 1200) {
  const escapedText = String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="${fontWeight}" fill="${color}">${escapedText}</text>
</svg>`;
}

// Invoice generation endpoint
app.post('/api/generate-invoice', async (req, res) => {
  try {
    const {
      date,
      invoiceNumber,
      customerName,
      phoneNumber,
      goldRate,
      items,
      totalAmount
    } = req.body;

    // Load template image
    const templateBuffer = await fs.promises.readFile(templatePath);
    const image = sharp(templateBuffer);
    const metadata = await image.metadata();
    const imgWidth = metadata.width || 800;
    const imgHeight = metadata.height || 1200;

    // Define coordinates (adjust these based on your template)
    // These are approximate - you'll need to fine-tune them
    const coordinates = {
      invoiceNumber: { x: 170, y: 390 },
      date: { x: 970, y: 380 },
      customerName: { x: 170, y: 440 },
      phoneNumber: { x: 900, y: 440 },
      goldRate: { x: 755, y: 580 },
      itemStartY: 580,
      itemRowHeight: 50,
      itemNameX: 350,
      gramsX: 640,
      milligramsX: 700,
      rateX: 650,
      amountX: 900,
      totalAmount: { x: 900, y: 950 }
    };

    // Build a single SVG with all text elements
    const textElements = [];

    // Invoice number
    if (invoiceNumber) {
      textElements.push(`<text x="${coordinates.invoiceNumber.x}" y="${coordinates.invoiceNumber.y}" font-family="Arial, sans-serif" font-size="25" font-weight="bold" fill="#000000">${String(invoiceNumber).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>`);
    }

    // Date
    if (date) {
      textElements.push(`<text x="${coordinates.date.x}" y="${coordinates.date.y}" font-family="Arial, sans-serif" font-size="25" font-weight="bold" fill="#000000">${String(date).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>`);
    }

    // Customer name
    if (customerName) {
      textElements.push(`<text x="${coordinates.customerName.x}" y="${coordinates.customerName.y}" font-family="Arial, sans-serif" font-size="25" font-weight="bold" fill="#000000">${String(customerName).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>`);
    }

    // Phone number
    if (phoneNumber) {
      textElements.push(`<text x="${coordinates.phoneNumber.x}" y="${coordinates.phoneNumber.y}" font-family="Arial, sans-serif" font-size="25" font-weight="bold" fill="#000000">${String(phoneNumber).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>`);
    }

    // Gold rate
    if (goldRate) {
      textElements.push(`<text x="${coordinates.goldRate.x}" y="${coordinates.goldRate.y}" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#000000">₹${Number(goldRate).toFixed(2)}</text>`);
    }

    // Items
    items.forEach((item, index) => {
      const y = coordinates.itemStartY + (index * coordinates.itemRowHeight);
      
      if (item.name) {
        textElements.push(`<text x="${coordinates.itemNameX}" y="${y}" font-family="Arial, sans-serif" font-size="23" font-weight="bold" fill="#000000">${String(item.name).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>`);
      }
      
      if (item.grams) {
        textElements.push(`<text x="${coordinates.gramsX}" y="${y}" font-family="Arial, sans-serif" font-size="23" font-weight="bold" fill="#000000">${Number(item.grams).toString()}</text>`);
      }
      
      if (item.milligrams) {
        textElements.push(`<text x="${coordinates.milligramsX}" y="${y}" font-family="Arial, sans-serif" font-size="23" font-weight="bold" fill="#000000">${Number(item.milligrams).toString()}</text>`);
      }
      
      // textElements.push(`<text x="${coordinates.rateX}" y="${y}" font-family="Arial, sans-serif" font-size="22" fill="#000000">₹${Number(goldRate).toFixed(2)}</text>`);
      textElements.push(`<text x="${coordinates.amountX}" y="${y}" font-family="Arial, sans-serif" font-size="23" font-weight="bold" fill="#000000">₹${Number(item.amount).toFixed(2)}</text>`);
    });

    // Total amount
    textElements.push(`<text x="${coordinates.totalAmount.x}" y="${coordinates.totalAmount.y}" font-family="Arial, sans-serif" font-size="27" font-weight="bold" fill="#000000">Total: ₹${Number(totalAmount).toFixed(2)}</text>`);

    // Create single SVG with all text
    const svgText = `<svg width="${imgWidth}" height="${imgHeight}" xmlns="http://www.w3.org/2000/svg">
  ${textElements.join('\n  ')}
</svg>`;

    // Composite the SVG text overlay onto the image (as PNG)
    const pngBuffer = await image
      .composite([{
        input: Buffer.from(svgText),
        top: 0,
        left: 0
      }])
      .png()
      .toBuffer();

    // Convert PNG to PDF using PDFKit
    const pdfBuffer = await new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: [imgWidth, imgHeight],
        margin: 0
      });

      // Collect PDF data
      const pdfChunks = [];
      doc.on('data', chunk => pdfChunks.push(chunk));
      doc.on('end', () => {
        resolve(Buffer.concat(pdfChunks));
      });
      doc.on('error', reject);

      // Add the image to PDF
      doc.image(pngBuffer, 0, 0, {
        width: imgWidth,
        height: imgHeight
      });

      doc.end();
    });

    // Send response as PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoiceNumber}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ error: 'Failed to generate invoice', details: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Billing server is running' });
});

// Serve React app in production (only if dist folder exists)
app.get('*', (req, res) => {
  const indexPath = join(__dirname, '../client/dist/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ message: 'Frontend not built. Run "npm run build" first.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Template path: ${templatePath}`);
});
