import jsPDF from 'jspdf';

// Coordinates for text placement on the invoice template
const coordinates = {
  invoiceNumber: { x: 170, y: 370 },
  date: { x: 970, y: 360 },
  customerName: { x: 170, y: 420 },
  phoneNumber: { x: 900, y: 420 },
  goldRate: { x: 760, y: 540 },
  itemStartY: 540,
  itemRowHeight: 70,
  itemNameX: 300,
  // weights: label and value columns (keeps numbers aligned)
  weightLabelX: 490,
  weightValueX: 640,
  // stone weight values use same value column
  stoneWeightX: 640,
  // rates column (gold rate, stone rate, making charges)
  rateX: 760,
  amountX: 950,
  totalsBlock: { x: 880, y: 880 },
  totalsLabelX: 880,
  totalsValueX: 980
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
    totalAmount,
    discount,
    netPayable,
    amountPaid,
    amountDue,
    vaAsWeight
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
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillText(String(invoiceNumber), coordinates.invoiceNumber.x, coordinates.invoiceNumber.y);
  }

  // Draw date
  if (date) {
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillText(String(date), coordinates.date.x, coordinates.date.y);
  }

  // Draw customer name
  if (customerName) {
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillText(String(customerName), coordinates.customerName.x, coordinates.customerName.y);
  }

  // Draw phone number
  if (phoneNumber) {
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillText(String(phoneNumber), coordinates.phoneNumber.x, coordinates.phoneNumber.y);
  }

  // Draw gold rate
  if (goldRate) {
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillText(`₹${Number(goldRate).toFixed(2)}`, coordinates.goldRate.x, coordinates.goldRate.y);
  }

  // Draw items (handle dynamic lines per item including per-stone details)
  ctx.font = 'bold 18px Arial, sans-serif';
  const lineGap = 24;
  let currentY = coordinates.itemStartY;

  items.forEach((item) => {
    const y = currentY;

    if (item.name) {
      ctx.fillText(String(item.name), coordinates.itemNameX, y);
    }

    // Weight details: draw label in label column and numeric value in value column for alignment
    let weightY = y + 4;

    if (item.mainWeight !== undefined && item.mainWeight !== null && item.mainWeight !== '') {
      ctx.fillText(`Main Wt:`, coordinates.weightLabelX, weightY);
      ctx.fillText(`${Number(item.mainWeight).toFixed(3)}g`, coordinates.weightValueX, weightY);
      weightY += lineGap;
    }

    // Draw each stone's details (name, weight, rate)
    const stones = item.stones || [];
    let stoneLineY = weightY;
    stones.forEach((stone, sidx) => {
      const stoneName = stone.name || `Stone${sidx + 1}`;
      ctx.fillText(String(stoneName), coordinates.itemNameX + 20, stoneLineY);
      if (stone.weight !== undefined && stone.weight !== null && stone.weight !== '') {
        ctx.fillText(`${Number(stone.weight).toFixed(3)}g`, coordinates.stoneWeightX, stoneLineY);
      }
      if (stone.rate !== undefined && stone.rate !== null && stone.rate !== '') {
        ctx.fillText(`₹${Number(stone.rate).toFixed(2)}`, coordinates.rateX, stoneLineY);
      }
      stoneLineY += lineGap;
    });
    weightY = stoneLineY;

    if (item.totalStoneWeight !== undefined && item.totalStoneWeight !== null && item.totalStoneWeight !== '') {
      ctx.fillText(`Stone Total:`, coordinates.weightLabelX, weightY);
      ctx.fillText(`${Number(item.totalStoneWeight).toFixed(3)}g`, coordinates.weightValueX, weightY);
      weightY += lineGap;
    }

    if (item.netWeight !== undefined && item.netWeight !== null && item.netWeight !== '') {
      ctx.fillText(`Net Wt:`, coordinates.weightLabelX, weightY);
      ctx.fillText(`${Number(item.netWeight).toFixed(3)}g`, coordinates.weightValueX, weightY);
      weightY += lineGap;
    }

    if (item.vaPercent !== undefined && item.vaPercent !== null && item.vaPercent !== '') {
      ctx.fillText(`VA:`, coordinates.weightLabelX, weightY);
      if (vaAsWeight) {
        const vaGrams = (Number(item.netWeight) * Number(item.vaPercent)) / 100;
        ctx.fillText(`${Number(vaGrams).toFixed(3)}g`, coordinates.weightValueX, weightY);
      } else {
        ctx.fillText(`${Number(item.vaPercent).toFixed(2)}%`, coordinates.weightValueX, weightY);
      }
      weightY += lineGap;
    }

    if (item.grossWeight !== undefined && item.grossWeight !== null && item.grossWeight !== '') {
      ctx.fillText(`Gross Wt:`, coordinates.weightLabelX, weightY);
      ctx.fillText(`${Number(item.grossWeight).toFixed(3)}g`, coordinates.weightValueX, weightY);
      weightY += lineGap;
    }

    // Making charges and total amounts anchored to the top of the item block
    if (item.makingCharges) {
      ctx.fillText(`Mkg Charges:`, coordinates.weightLabelX, weightY);
      ctx.fillText(`₹${Number(item.makingCharges).toFixed(2)}`, coordinates.rateX, weightY);
      weightY += lineGap;
    }

    ctx.fillText(`₹${Number(item.amount).toFixed(2)}`, coordinates.amountX, y);

    // Advance currentY by the greater of default row height or used lines
    const usedLines = Math.ceil((stoneLineY - y) / lineGap) + 1;
    const usedHeight = usedLines * lineGap + 10;
    currentY += Math.max(coordinates.itemRowHeight, usedHeight);
  });

  // Totals block: Total, Discount, Payable, Paid, Due
  ctx.font = 'bold 18px Arial, sans-serif';
  let totalsY = coordinates.totalsBlock.y;
  const tLabelX = coordinates.totalsLabelX;
  const tValueX = coordinates.totalsValueX;
  ctx.fillText(`Total`, tLabelX, totalsY);
  ctx.fillText(`₹${Number(totalAmount).toFixed(2)}`, tValueX, totalsY);
  totalsY += lineGap;
  ctx.fillText(`Discount`, tLabelX, totalsY);
  ctx.fillText(`₹${Number(discount || 0).toFixed(2)}`, tValueX, totalsY);
  totalsY += lineGap;
  ctx.fillText(`Payable`, tLabelX, totalsY);
  ctx.fillText(`₹${Number(netPayable || 0).toFixed(2)}`, tValueX, totalsY);
  totalsY += lineGap;
  ctx.fillText(`Paid`, tLabelX, totalsY);
  ctx.fillText(`₹${Number(amountPaid || 0).toFixed(2)}`, tValueX, totalsY);
  totalsY += lineGap;
  ctx.fillText(`Due`, tLabelX, totalsY);
  ctx.fillText(`₹${Number(amountDue || 0).toFixed(2)}`, tValueX, totalsY);

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
