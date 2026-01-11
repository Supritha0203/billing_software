import jsPDF from 'jspdf';

// Coordinates for text placement on the invoice template
const coordinates = {
  invoiceNumber: { x: 170, y: 370 },
  date: { x: 970, y: 360 },
  customerName: { x: 170, y: 420 },
  phoneNumber: { x: 900, y: 420 },
  goldRate: { x: 755, y: 560 },
  itemStartY: 560,
  itemRowHeight: 50,
  itemNameX: 350,
  gramsX: 640,
  milligramsX: 700,
  rateX: 650,
  amountX: 900,
  totalAmount: { x: 900, y: 930 }
};

/**
 * Generate invoice PDF from form data
 * @param {Object} invoiceData - Invoice data object
 * @param {string} templateImageUrl - URL to the invoice template image
 * @returns {Promise<Blob>} PDF blob
 */
export async function generateInvoicePDF(invoiceData, templateImageUrl) {
  const {
    date,
    invoiceNumber,
    customerName,
    phoneNumber,
    goldRate,
    items,
    totalAmount
  } = invoiceData;

  console.log(invoiceData);
  console.log(templateImageUrl);
  // Load template image
  const img = await loadImage(templateImageUrl);
  const imgWidth = img.width;
  const imgHeight = img.height;

  console.log(imgWidth, imgHeight);
  console.log(img);
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = imgWidth;
  canvas.height = imgHeight;
  const ctx = canvas.getContext('2d');

  // Draw template image
  ctx.drawImage(img, 0, 0);

  // Set text properties
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Draw invoice number
  if (invoiceNumber) {
    ctx.font = 'bold 25px Arial, sans-serif';
    ctx.fillText(String(invoiceNumber), coordinates.invoiceNumber.x, coordinates.invoiceNumber.y);
  }

  // Draw date
  if (date) {
    ctx.font = 'bold 25px Arial, sans-serif';
    ctx.fillText(String(date), coordinates.date.x, coordinates.date.y);
  }

  // Draw customer name
  if (customerName) {
    ctx.font = 'bold 25px Arial, sans-serif';
    ctx.fillText(String(customerName), coordinates.customerName.x, coordinates.customerName.y);
  }

  // Draw phone number
  if (phoneNumber) {
    ctx.font = 'bold 25px Arial, sans-serif';
    ctx.fillText(String(phoneNumber), coordinates.phoneNumber.x, coordinates.phoneNumber.y);
  }

  // Draw gold rate
  if (goldRate) {
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillText(`₹${Number(goldRate).toFixed(2)}`, coordinates.goldRate.x, coordinates.goldRate.y);
  }

  // Draw items
  ctx.font = 'bold 23px Arial, sans-serif';
  items.forEach((item, index) => {
    const y = coordinates.itemStartY + (index * coordinates.itemRowHeight);
    
    if (item.name) {
      ctx.fillText(String(item.name), coordinates.itemNameX, y);
    }
    
    if (item.grams) {
      ctx.fillText(Number(item.grams).toString(), coordinates.gramsX, y);
    }
    
    if (item.milligrams) {
      ctx.fillText(Number(item.milligrams).toString(), coordinates.milligramsX, y);
    }
    
    ctx.fillText(`₹${Number(item.amount).toFixed(2)}`, coordinates.amountX, y);
  });

  // Draw total amount
  ctx.font = 'bold 27px Arial, sans-serif';
  ctx.fillText(`Total: ₹${Number(totalAmount).toFixed(2)}`, coordinates.totalAmount.x, coordinates.totalAmount.y);

  // Convert canvas to image data
  const imageData = canvas.toDataURL('image/png');

  // Create PDF using jsPDF
  // Convert pixels to mm (1px ≈ 0.264583mm at 96 DPI)
  const pdfWidth = imgWidth * 0.264583;
  const pdfHeight = imgHeight * 0.264583;

  const pdf = new jsPDF({
    orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pdfWidth, pdfHeight]
  });

  console.log(pdfWidth, pdfHeight);
  console.log(imageData);
  console.log(pdf);
  console.log(pdf.output('blob'));
  // Add image to PDF
  pdf.addImage(imageData, 'PNG', 0, 0, pdfWidth, pdfHeight);

  // Generate PDF blob
  const pdfBlob = pdf.output('blob');
  return pdfBlob;
}

/**
 * Load image from URL
 * @param {string} url - Image URL
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Handle CORS if needed
    img.onload = () => {
      console.log('Image loaded successfully:', url, img.width, img.height);
      resolve(img);
    };
    img.onerror = (error) => {
      console.error('Failed to load image:', url, error);
      reject(new Error(`Failed to load image from ${url}. Make sure invoice_template.png is in the public folder.`));
    };
    img.src = url;
  });
}
