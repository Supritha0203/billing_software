import { useState } from 'react'
import axios from 'axios'
import './InvoiceForm.css'

function InvoiceForm() {
  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    goldRate: '',
    invoiceNumber: '',
  })

  const [items, setItems] = useState([
    { id: 1, name: '', grams: '', milligrams: '', amount: 0 }
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

  // Calculate amount for an item
  const calculateItemAmount = (grams, milligrams, goldRate) => {
    if (!grams || !goldRate) return 0
    const totalGrams = parseFloat(grams) + (parseFloat(milligrams || 0) / 1000)
    return totalGrams * parseFloat(goldRate)
  }

  // Update item amount when grams, milligrams, or gold rate changes
  const updateItemAmount = (itemId) => {
    setItems(prevItems => 
      prevItems.map(item => {
        if (item.id === itemId) {
          const amount = calculateItemAmount(item.grams, item.milligrams, formData.goldRate)
          return { ...item, amount: parseFloat(amount.toFixed(2)) }
        }
        return item
      })
    )
  }

  // Calculate total amount
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Recalculate all item amounts when gold rate changes
    if (name === 'goldRate') {
      setItems(prevItems => 
        prevItems.map(item => ({
          ...item,
          amount: calculateItemAmount(item.grams, item.milligrams, value)
        }))
      )
    }
  }

  // Handle item input changes
  const handleItemChange = (itemId, field, value) => {
    setItems(prevItems => 
      prevItems.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value }
          const amount = calculateItemAmount(
            field === 'grams' ? value : updatedItem.grams,
            field === 'milligrams' ? value : updatedItem.milligrams,
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
    setItems([...items, { id: newId, name: '', grams: '', milligrams: '', amount: 0 }])
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

    const validItems = items.filter(item => item.name && item.grams)
    if (validItems.length === 0) {
      alert('Please add at least one item with name and grams')
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
        items: validItems.map(item => ({
          name: item.name,
          grams: parseFloat(item.grams),
          milligrams: parseFloat(item.milligrams || 0),
          amount: item.amount
        })),
        totalAmount: totalAmount
      }

      const response = await axios.post('/api/generate-invoice', invoiceData, {
        responseType: 'blob'
      })

      // Create download link for PDF
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
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
      alert('Error generating invoice. Please try again.')
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
              <div className="item-fields">
                <input
                  type="text"
                  placeholder="Item name"
                  value={item.name}
                  onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                  className="item-name"
                />
                <input
                  type="number"
                  placeholder="Grams"
                  value={item.grams}
                  onChange={(e) => handleItemChange(item.id, 'grams', e.target.value)}
                  step="0.001"
                  min="0"
                  className="item-grams"
                />
                <input
                  type="number"
                  placeholder="Milligrams"
                  value={item.milligrams}
                  onChange={(e) => handleItemChange(item.id, 'milligrams', e.target.value)}
                  step="1"
                  min="0"
                  max="999"
                  className="item-milligrams"
                />
                <div className="item-amount">
                  ₹{item.amount.toFixed(2)}
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="btn-remove"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="form-section total-section">
        <div className="total-amount">
          <span className="total-label">Total Amount:</span>
          <span className="total-value">₹{totalAmount.toFixed(2)}</span>
        </div>
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
  )
}

export default InvoiceForm

