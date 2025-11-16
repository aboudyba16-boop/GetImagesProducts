
import React, { useState, useMemo } from 'react';
import FileUpload from './components/FileUpload';
import ColumnMapper from './components/ColumnMapper';
import ImageProcessor from './components/ImageProcessor';
import { AppStep, Product } from './types';
import { LogoIcon } from './components/icons';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [productColumnIndex, setProductColumnIndex] = useState<number | null>(null);

  const handleFileUpload = (data: string[][], headers: string[]) => {
    setCsvData(data);
    setHeaders(headers);
    setStep(AppStep.MAP_COLUMNS);
  };

  const handleMapComplete = (index: number) => {
    setProductColumnIndex(index);
    setStep(AppStep.PROCESS_IMAGES);
  };
  
  const handleReset = () => {
    setStep(AppStep.UPLOAD);
    setCsvData([]);
    setHeaders([]);
    setProductColumnIndex(null);
  };

  const products = useMemo((): Product[] => {
    if (productColumnIndex === null) {
      return [];
    }
    return csvData
      .map((row, index) => ({
        id: index,
        name: row[productColumnIndex] || `Row ${index + 1} product`,
        status: 'pending' as const,
        images: [],
        selectedImageUrl: null,
      }))
      .filter(p => p.name.trim() !== '');
  }, [csvData, productColumnIndex]);

  const renderStep = () => {
    switch (step) {
      case AppStep.UPLOAD:
        return <FileUpload onFileUpload={handleFileUpload} />;
      case AppStep.MAP_COLUMNS:
        return <ColumnMapper headers={headers} onMapComplete={handleMapComplete} />;
      case AppStep.PROCESS_IMAGES:
        return <ImageProcessor initialProducts={products} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-6xl mb-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <LogoIcon className="h-10 w-10 text-indigo-600" />
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
            CSV Product Image Finder
          </h1>
        </div>
        {step !== AppStep.UPLOAD && (
           <button 
             onClick={handleReset}
             className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition duration-150 ease-in-out"
           >
             Start Over
           </button>
        )}
      </header>
      <main className="w-full max-w-6xl">
        {renderStep()}
      </main>
    </div>
  );
};

export default App;
