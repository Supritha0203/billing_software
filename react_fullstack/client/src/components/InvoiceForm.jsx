import { useState } from 'react'
import { generateInvoicePDF } from '../utils/invoiceGenerator.js'
import './InvoiceForm.css'

function InvoiceForm() {
  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    goldRate: '',
    invoiceNumber: '',
    discount: '',
    amountPaid: '',
    vaAsWeight: false
  })

  const [items, setItems] = useState([
    { id: 1, name: '', mainWeight: '', vaPercent: '', makingCharges: '', stones: [], amount: 0 }
  ])

  const [isGenerating, setIsGenerating] = useState(false)

  // Get today's date in DD/MM/YYYY format
  const getTodayDate = () => {
    const today = new Date()
    const day = String(today.getDate()).padStart(2, '0')
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const year = today.getFullYear()
    return `${day}/${month}/${year}`
  }

  const toNumber = (value) => {
    if (value === '' || value === null || value === undefined) return 0
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
  }

  const calculateStoneTotals = (stones = []) => {
    return (stones || []).reduce(
      (acc, stone) => ({
        totalStoneWeight: acc.totalStoneWeight + toNumber(stone.weight),
        totalStoneRate: acc.totalStoneRate + toNumber(stone.rate)
      }),
      { totalStoneWeight: 0, totalStoneRate: 0 }
    )
  }

  const calculateWeights = (mainWeight, stones, vaPercent) => {
    const main = toNumber(mainWeight)
    const { totalStoneWeight } = calculateStoneTotals(stones)
    const va = toNumber(vaPercent)

    const netWeight = Math.max(0, main - totalStoneWeight)
    const grossWeight = netWeight * (1 + (va / 100))

    return { netWeight, grossWeight }
  }

  // Calculate amount for an item (gross weight * gold rate)
  const calculateItemAmount = (mainWeight, stones, vaPercent, makingCharges, goldRate) => {
    if (!mainWeight || !goldRate) return 0
    const { grossWeight } = calculateWeights(mainWeight, stones, vaPercent)
    const { totalStoneRate } = calculateStoneTotals(stones)
    const goldComponent = grossWeight * toNumber(goldRate)
    const stoneComponent = totalStoneRate
    const makingComponent = toNumber(makingCharges)
    return goldComponent + stoneComponent + makingComponent
  }

  // Calculate total amount
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)
  const discountAmount = toNumber(formData.discount)
  const netPayable = Math.max(0, totalAmount - discountAmount)
  const amountPaid = toNumber(formData.amountPaid)
  const amountDue = Math.max(0, netPayable - amountPaid)

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Recalculate all item amounts when gold rate changes
    if (name === 'goldRate') {
      setItems(prevItems => 
        prevItems.map(item => ({
          ...item,
          amount: parseFloat(
            calculateItemAmount(
              item.mainWeight,
              item.stones || [],
              item.vaPercent,
              item.makingCharges,
              value
            ).toFixed(2)
          )
        }))
      )
    }
  }

  const handleVaToggle = (checked) => {
    setFormData(prev => ({ ...prev, vaAsWeight: checked }))
  }

  // Handle item input changes
  const handleItemChange = (itemId, field, value) => {
    setItems(prevItems => 
      prevItems.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value }
          const mainForCalc = field === 'mainWeight' ? value : updatedItem.mainWeight
          const stonesForCalc = updatedItem.stones || []
          const vaForCalc = field === 'vaPercent' ? value : updatedItem.vaPercent
          const makingForCalc = field === 'makingCharges' ? value : updatedItem.makingCharges
          const amount = calculateItemAmount(
            mainForCalc,
            stonesForCalc,
            vaForCalc,
            makingForCalc,
            formData.goldRate
          )
          return { ...updatedItem, amount: parseFloat(amount.toFixed(2)) }
        }
        return item
      })
    )
  }

  // Add new item
  const addItem = () => {
    const newId = Math.max(...items.map(i => i.id), 0) + 1
    setItems([
      ...items,
      { id: newId, name: '', mainWeight: '', vaPercent: '', makingCharges: '', stones: [], amount: 0 }
    ])
  }

  const addStone = (itemId) => {
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id !== itemId) return item
        const newStone = {
          id: Date.now() + Math.random(),
          name: '',
          weight: '',
          rate: ''
        }
        const updatedStones = [...(item.stones || []), newStone]
        const amount = calculateItemAmount(
          item.mainWeight,
          updatedStones,
          item.vaPercent,
          item.makingCharges,
          formData.goldRate
        )
        return {
          ...item,
          stones: updatedStones,
          amount: parseFloat(amount.toFixed(2))
        }
      })
    )
  }

  const handleStoneChange = (itemId, stoneId, field, value) => {
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id !== itemId) return item
        const updatedStones = (item.stones || []).map(stone =>
          stone.id === stoneId ? { ...stone, [field]: value } : stone
        )
        const amount = calculateItemAmount(
          item.mainWeight,
          updatedStones,
          item.vaPercent,
          item.makingCharges,
          formData.goldRate
        )
        return {
          ...item,
          stones: updatedStones,
          amount: parseFloat(amount.toFixed(2))
        }
      })
    )
  }

  const removeStone = (itemId, stoneId) => {
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id !== itemId) return item
        const updatedStones = (item.stones || []).filter(stone => stone.id !== stoneId)
        const amount = calculateItemAmount(
          item.mainWeight,
          updatedStones,
          item.vaPercent,
          item.makingCharges,
          formData.goldRate
        )
        return {
          ...item,
          stones: updatedStones,
          amount: parseFloat(amount.toFixed(2))
        }
      })
    )
  }

  // Remove item
  const removeItem = (itemId) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== itemId))
    }
  }

  // Generate invoice
  const handleGenerateInvoice = async () => {
    // Validation
    if (!formData.customerName || !formData.phoneNumber || !formData.goldRate) {
      alert('Please fill in all required fields (Customer Name, Phone Number, Gold Rate)')
      return
    }

    const validItems = items.filter(item => item.name && item.mainWeight)
    if (validItems.length === 0) {
      alert('Please add at least one item with name and main weight')
      return
    }

    setIsGenerating(true)

    try {
      const invoiceData = {
        date: getTodayDate(),
        invoiceNumber: formData.invoiceNumber || `INV-${Date.now()}`,
        customerName: formData.customerName,
        phoneNumber: formData.phoneNumber,
        goldRate: parseFloat(formData.goldRate),
          vaAsWeight: !!formData.vaAsWeight,
        items: validItems.map(item => ({
          name: item.name,
          mainWeight: parseFloat(item.mainWeight),
          vaPercent: parseFloat(item.vaPercent || 0),
          makingCharges: parseFloat(item.makingCharges || 0),
          stones: item.stones || [],
          ...(() => {
            const { totalStoneWeight, totalStoneRate } = calculateStoneTotals(item.stones || [])
            const { netWeight, grossWeight } = calculateWeights(item.mainWeight, item.stones || [], item.vaPercent)
            return {
              totalStoneWeight,
              totalStoneRate,
              netWeight,
              grossWeight
            }
          })(),
          amount: item.amount
        })),
        totalAmount: totalAmount,
        discount: toNumber(formData.discount),
        netPayable: Math.max(0, totalAmount - toNumber(formData.discount)),
        amountPaid: toNumber(formData.amountPaid),
        amountDue: Math.max(0, Math.max(0, totalAmount - toNumber(formData.discount)) - toNumber(formData.amountPaid))
      }

      // Load template image from public folder
      const templateImageUrl = '/invoice_template.png'
      console.log(templateImageUrl);
      console.log("starting pdf generation");
      // Generate PDF in browser
      const pdfBlob = await generateInvoicePDF(invoiceData, templateImageUrl)

      // Create download link
      const url = window.URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `invoice-${invoiceData.invoiceNumber}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      alert('Invoice generated successfully!')
    } catch (error) {
      console.error('Error generating invoice:', error)
      console.error('Error stack:', error.stack)
      console.error('Error message:', error.message)
      alert(`Error generating invoice: ${error.message || 'Unknown error'}. Check browser console for details.`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="invoice-form">
      <div className="form-section">
        <h2>Invoice Details</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Date</label>
            <input
              type="text"
              value={getTodayDate()}
              disabled
              className="disabled-input"
            />
          </div>
          <div className="form-group">
            <label>Invoice Number</label>
            <input
              type="text"
              name="invoiceNumber"
              value={formData.invoiceNumber}
              onChange={handleInputChange}
              placeholder="Auto-generated if empty"
            />
          </div>
          <div className="form-group">
            <label>Customer Name <span className="required">*</span></label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleInputChange}
              placeholder="Enter customer name"
              required
            />
          </div>
          <div className="form-group">
            <label>Phone Number <span className="required">*</span></label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              placeholder="Enter phone number"
              required
            />
          </div>
          <div className="form-group full-width">
            <label>Today's Gold Rate (per gram) <span className="required">*</span></label>
            <input
              type="number"
              name="goldRate"
              value={formData.goldRate}
              onChange={handleInputChange}
              placeholder="Enter gold rate"
              step="0.01"
              min="0"
              required
            />
            <div className="va-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={!!formData.vaAsWeight}
                  onChange={(e) => handleVaToggle(e.target.checked)}
                /> Print V.A. as grams (instead of %)
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="section-header">
          <h2>Items</h2>
          <button type="button" onClick={addItem} className="btn-add">
            <span>+</span> Add Item
          </button>
        </div>
        <div className="items-list">
          {items.map((item, index) => (
            <div key={item.id} className="item-row">
              <div className="item-number">{index + 1}</div>
              <div className="item-card">
                <div className="item-topRow">
                  <input
                    type="text"
                    placeholder="Item name"
                    value={item.name}
                    onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                    className="item-name"
                  />
                  <div className="item-amount">
                    ₹{item.amount.toFixed(2)}
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="btn-remove"
                      aria-label="Remove item"
                      title="Remove item"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="item-bottomRow">
                  <input
                    type="number"
                    placeholder="Main wt (g)"
                    value={item.mainWeight}
                    onChange={(e) => handleItemChange(item.id, 'mainWeight', e.target.value)}
                    step="0.001"
                    min="0"
                    className="item-mainWeight"
                  />
                  <input
                    type="number"
                    placeholder="V.A (%)"
                    value={item.vaPercent}
                    onChange={(e) => handleItemChange(item.id, 'vaPercent', e.target.value)}
                    step="0.01"
                    min="0"
                    max="100"
                    className="item-vaPercent"
                  />
                  <input
                    type="number"
                    placeholder="Making charges"
                    value={item.makingCharges}
                    onChange={(e) => handleItemChange(item.id, 'makingCharges', e.target.value)}
                    step="0.01"
                    min="0"
                    className="item-makingCharges"
                  />

                  <div className="item-netWeight">
                    Net {calculateWeights(item.mainWeight, item.stones || [], item.vaPercent).netWeight.toFixed(3)} g
                  </div>
                  <div className="item-grossWeight">
                    Gross {calculateWeights(item.mainWeight, item.stones || [], item.vaPercent).grossWeight.toFixed(3)} g
                  </div>

                  <button
                    type="button"
                    className="btn-add-stone"
                    onClick={() => addStone(item.id)}
                  >
                    + Add stone
                  </button>
                </div>

                <div className="stones-section">
                  {(item.stones || []).length > 0 && (
                    <div className="stones-header">
                      <span>Stones</span>
                    </div>
                  )}
                  <div className="stones-list">
                    {(item.stones || []).map(stone => (
                      <div key={stone.id} className="stone-row">
                        <input
                          type="text"
                          placeholder="Stone name"
                          value={stone.name}
                          onChange={(e) => handleStoneChange(item.id, stone.id, 'name', e.target.value)}
                          className="stone-name"
                        />
                        <input
                          type="number"
                          placeholder="Stone wt (g)"
                          value={stone.weight}
                          onChange={(e) => handleStoneChange(item.id, stone.id, 'weight', e.target.value)}
                          step="0.001"
                          min="0"
                          className="stone-weight"
                        />
                        <input
                          type="number"
                          placeholder="Stone rate"
                          value={stone.rate}
                          onChange={(e) => handleStoneChange(item.id, stone.id, 'rate', e.target.value)}
                          step="0.01"
                          min="0"
                          className="stone-rate"
                        />
                        <button
                          type="button"
                          className="btn-remove-stone"
                          onClick={() => removeStone(item.id, stone.id)}
                          aria-label="Remove stone"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="form-section total-section">
        <div className="totals-grid">
          <div className="total-box">
            <span className="total-label">Total</span>
            <span className="total-value">₹{totalAmount.toFixed(2)}</span>
          </div>
          <div className="total-box input-box">
            <label>Discount</label>
            <input
              type="number"
              name="discount"
              value={formData.discount}
              onChange={handleInputChange}
              placeholder="Discount amount"
              step="0.01"
              min="0"
            />
          </div>
          <div className="total-box">
            <span className="total-label">Payable after discount</span>
            <span className="total-value">₹{netPayable.toFixed(2)}</span>
          </div>
          <div className="total-box input-box">
            <label>Paid</label>
            <input
              type="number"
              name="amountPaid"
              value={formData.amountPaid}
              onChange={handleInputChange}
              placeholder="Amount paid"
              step="0.01"
              min="0"
            />
          </div>
          <div className="total-box due-box">
            <span className="total-label">Amount Due</span>
            <span className="total-value">₹{amountDue.toFixed(2)}</span>
          </div>
        </div>
        <div className="generate-row">
          <button
            type="button"
            onClick={handleGenerateInvoice}
            disabled={isGenerating}
            className="btn-generate"
          >
            {isGenerating ? 'Generating...' : 'Generate Invoice'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default InvoiceForm

