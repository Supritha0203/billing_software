import { useState } from 'react'
import InvoiceForm from './components/InvoiceForm'
import './App.css'

function App() {
  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1>Siddivinayaka Jewellery</h1>
          <p className="tagline">Where Trust is Tradition</p>
        </header>
        <InvoiceForm />
      </div>
    </div>
  )
}

export default App

