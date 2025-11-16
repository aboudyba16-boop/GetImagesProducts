
import React, { useState } from 'react';

interface ColumnMapperProps {
  headers: string[];
  onMapComplete: (productColumnIndex: number) => void;
}

const ColumnMapper: React.FC<ColumnMapperProps> = ({ headers, onMapComplete }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleContinue = () => {
    if (selectedIndex !== null) {
      onMapComplete(selectedIndex);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-slate-200">
      <h2 className="text-xl font-semibold text-center text-slate-700 mb-2">Map Your Data</h2>
      <p className="text-center text-slate-500 mb-6">Which column contains the product names?</p>
      
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {headers.map((header, index) => (
          <label
            key={index}
            className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
              selectedIndex === index
                ? 'bg-indigo-50 border-indigo-500 shadow-sm'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <input
              type="radio"
              name="product-column"
              checked={selectedIndex === index}
              onChange={() => setSelectedIndex(index)}
              className="h-5 w-5 text-indigo-600 border-slate-300 focus:ring-indigo-500"
            />
            <span className="ml-4 text-slate-700 font-medium">{header}</span>
          </label>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleContinue}
          disabled={selectedIndex === null}
          className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition duration-150 ease-in-out"
        >
          Generate Images
        </button>
      </div>
    </div>
  );
};

export default ColumnMapper;
