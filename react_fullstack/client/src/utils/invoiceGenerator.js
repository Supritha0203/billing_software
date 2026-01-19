import jsPDF from 'jspdf';

// Coordinates for text placement on the invoice template
const coordinates = {
  invoiceNumber: { x: 100, y: 360 },
  date: { x: 870, y: 350 },
  customerName: { x: 100, y: 410 },
  phoneNumber: { x: 800, y: 410 },
  goldRate: { x: 700, y: 520 },
  itemStartY: 520,
  itemRowHeight: 70,
  itemNameX: 220,
  // weights: label and value columns (keeps numbers aligned)
  weightLabelX: 390,
  weightValueX: 560,
  // stone weight values use same value column
  stoneWeightX: 330,
  // rates column (gold rate, stone rate, making charges)
  rateX: 700,
  amountX: 850,
  totalsBlock: { x: 780, y: 1100 },
  totalsLabelX: 725,
  totalsValueX: 860
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
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText(`₹${Number(goldRate).toFixed(2)}`, coordinates.goldRate.x, coordinates.goldRate.y);
  }

  // Draw items (handle dynamic lines per item including per-stone details)
  const lineGap = 20;
  const pageHeight = imgHeight;
  const maxItemsPerPage = 3;
  let currentY = coordinates.itemStartY;
  let pageIndex = 0;
  let itemsOnCurrentPage = 0;
  let canvases = [canvas];
  let ctxArray = [ctx];
  const y = currentY;
  // Weight details: draw label in label column and numeric value in value column for alignment
    let weightY = y + 2;
  items.forEach((item, itemIndex) => {
    // Check if we need a new page
    if (itemsOnCurrentPage >= maxItemsPerPage) {
      // Create new canvas for new page
      const newCanvas = document.createElement('canvas');
      newCanvas.width = imgWidth;
      newCanvas.height = imgHeight;
      const newCtx = newCanvas.getContext('2d');
      newCtx.drawImage(img, 0, 0);
      newCtx.fillStyle = '#000000';
      newCtx.textAlign = 'left';
      newCtx.textBaseline = 'top';
      canvases.push(newCanvas);
      ctxArray.push(newCtx);
      pageIndex++;
      itemsOnCurrentPage = 0;
      currentY = coordinates.itemStartY;
    }

    const currentCtx = ctxArray[pageIndex];
    currentCtx.font = 'bold 16px Arial, sans-serif';
    const y = currentY;

    if (item.name) {
      currentCtx.fillText(`${itemIndex+1}. ${String(item.name)}`, coordinates.itemNameX, weightY);
    }


    const itemAmountY = weightY+lineGap;
    if (item.mainWeight !== undefined && item.mainWeight !== null && item.mainWeight !== '') {
      currentCtx.fillText(`Main Wt:`, coordinates.weightLabelX, weightY);
      currentCtx.fillText(`${Number(item.mainWeight).toFixed(3)}g`, coordinates.weightValueX, weightY);
      weightY += lineGap;
    }

    // Draw each stone's details (name, weight, rate)
    const stones = item.stones || [];
    let stoneLineY = weightY;
    stones.forEach((stone, sidx) => {
      const stoneName = stone.name || `Stone${sidx + 1}`;
      currentCtx.fillText(String(stoneName), coordinates.itemNameX + 50, stoneLineY);
      if (stone.weight !== undefined && stone.weight !== null && stone.weight !== '') {
        currentCtx.fillText(`${Number(stone.weight).toFixed(3)}g`, coordinates.stoneWeightX, stoneLineY);
      }
      if (stone.rate !== undefined && stone.rate !== null && stone.rate !== '') {
        currentCtx.fillText(`₹${Number(stone.rate).toFixed(2)}`, coordinates.rateX, stoneLineY);
      }
      stoneLineY += lineGap;
    });
    weightY = stoneLineY;

    if (item.totalStoneWeight !== undefined && item.totalStoneWeight !== null && item.totalStoneWeight !== '') {
      currentCtx.fillText(`Stone Total:`, coordinates.weightLabelX, weightY);
      currentCtx.fillText(`${Number(item.totalStoneWeight).toFixed(3)}g`, coordinates.weightValueX, weightY);
      weightY += lineGap;
    }

    if (item.netWeight !== undefined && item.netWeight !== null && item.netWeight !== '') {
      currentCtx.fillText(`Net Wt:`, coordinates.weightLabelX, weightY);
      currentCtx.fillText(`${Number(item.netWeight).toFixed(3)}g`, coordinates.weightValueX, weightY);
      weightY += lineGap;
    }

    if (item.vaPercent !== undefined && item.vaPercent !== null && item.vaPercent !== '') {
      currentCtx.fillText(`VA:`, coordinates.weightLabelX, weightY);
      if (vaAsWeight) {
        const vaGrams = (Number(item.netWeight) * Number(item.vaPercent)) / 100;
        currentCtx.fillText(`${Number(vaGrams).toFixed(3)}g`, coordinates.weightValueX, weightY);
      } else {
        currentCtx.fillText(`${Number(item.vaPercent).toFixed(2)}%`, coordinates.weightValueX, weightY);
      }
      weightY += lineGap;
    }

    if (item.grossWeight !== undefined && item.grossWeight !== null && item.grossWeight !== '') {
      currentCtx.fillText(`Gross Wt:`, coordinates.weightLabelX, weightY);
      currentCtx.fillText(`${Number(item.grossWeight).toFixed(3)}g`, coordinates.weightValueX, weightY);
      weightY += lineGap;
    }

    // Making charges and total amounts anchored to the top of the item block
    if (item.makingCharges) {
      currentCtx.fillText(`Mkg Charges:`, coordinates.weightLabelX, weightY);
      currentCtx.fillText(`₹${Number(item.makingCharges).toFixed(2)}`, coordinates.rateX, weightY);
      weightY += 2*lineGap;
    }

    currentCtx.fillText(`₹${Number(item.amount).toFixed(2)}`, coordinates.amountX, itemAmountY);

    // Advance currentY by the greater of default row height or used lines
    const usedLines = Math.ceil((stoneLineY - y) / lineGap) + 2;
    const usedHeight = usedLines * lineGap + 12;
    currentY += Math.max(coordinates.itemRowHeight, usedHeight);
    itemsOnCurrentPage++;
  });

  // Draw totals on last page only
  const lastCtx = ctxArray[pageIndex];

  // Totals block: Total, Discount, Payable, Paid, Due
  lastCtx.font = 'bold 16px Arial, sans-serif';
  let totalsY = coordinates.totalsBlock.y;
  const tLabelX = coordinates.totalsLabelX;
  const tValueX = coordinates.totalsValueX;
  lastCtx.fillText(`Total`, tLabelX, totalsY);
  lastCtx.font = 'bold 24px Arial, sans-serif';
  lastCtx.fillText(`₹${Number(totalAmount).toFixed(2)}`, tValueX, totalsY);
  totalsY += lineGap+6;
  lastCtx.font = 'normal 16px Arial, sans-serif';

  lastCtx.fillText(`Discount`, tLabelX, totalsY);
  lastCtx.fillText(`₹${Number(discount || 0).toFixed(2)}`, tValueX, totalsY);
  totalsY += lineGap+3;
  lastCtx.font = 'normal 16px Arial, sans-serif';

  lastCtx.fillText(`Payable`, tLabelX, totalsY);
  lastCtx.fillText(`₹${Number(netPayable || 0).toFixed(2)}`, tValueX, totalsY);
  totalsY += lineGap+3;
  lastCtx.font = 'normal 16px Arial, sans-serif';

  lastCtx.fillText(`Paid`, tLabelX, totalsY);
  lastCtx.fillText(`₹${Number(amountPaid || 0).toFixed(2)}`, tValueX, totalsY);
  totalsY += lineGap+3;
  lastCtx.font = 'bold 20px Arial, sans-serif';

  // Determine if it's surplus or due
  const isSurplus = amountPaid > netPayable;
  const label = isSurplus ? 'Surplus' : 'Due';
  const amount = Math.abs(netPayable - amountPaid);

  lastCtx.fillText(label, tLabelX, totalsY);
  lastCtx.fillText(`₹${Number(amount || 0).toFixed(2)}`, tValueX, totalsY);

  // Convert all pages to image data and create multi-page PDF
  const imageDataArray = canvases.map(c => c.toDataURL('image/png'));

  // Create PDF using jsPDF with multiple pages
  // Convert pixels to mm (1px ≈ 0.264583mm at 96 DPI)
  const pdfWidth = imgWidth * 0.264583;
  const pdfHeight = imgHeight * 0.264583;

  const pdf = new jsPDF({
    orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pdfWidth, pdfHeight]
  });

  // Add first page
  pdf.addImage(imageDataArray[0], 'PNG', 0, 0, pdfWidth, pdfHeight);

  // Add remaining pages if any
  for (let i = 1; i < imageDataArray.length; i++) {
    pdf.addPage([pdfWidth, pdfHeight]);
    pdf.addImage(imageDataArray[i], 'PNG', 0, 0, pdfWidth, pdfHeight);
  }

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
