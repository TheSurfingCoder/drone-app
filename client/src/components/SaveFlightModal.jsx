import React, { useState } from 'react'
import { XIcon } from 'lucide-react'

export default function SaveFlightModal({ isOpen, onClose, onSave }) {
  const [flightName, setFlightName] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(flightName)
    setFlightName('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <XIcon className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold mb-4">Save Flight</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="flightName" className="block text-sm font-medium text-gray-700 mb-1">
              Flight Name
            </label>
            <input
              type="text"
              id="flightName"
              value={flightName}
              onChange={(e) => setFlightName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter flight name"
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
