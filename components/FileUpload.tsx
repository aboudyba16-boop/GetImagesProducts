
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons';

interface FileUploadProps {
  onFileUpload: (data: string[][], headers: string[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseCSV = (text: string) => {
    // Basic CSV parser that handles quoted fields
    const result: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        if (inQuotes) {
            if (char === '"' && text[i+1] === '"') { // Escaped quote
                currentField += '"';
                i++;
            } else if (char === '"') {
                inQuotes = false;
            } else {
                currentField += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                currentRow.push(currentField);
                currentField = '';
            } else if (char === '\n' || char === '\r') {
                if (i > 0 && text[i-1] !== '\n' && text[i-1] !== '\r') {
                    currentRow.push(currentField);
                    result.push(currentRow);
                    currentRow = [];
                    currentField = '';
                }
                if (char === '\r' && text[i+1] === '\n') {
                  i++; // handle CRLF
                }
            } else {
                currentField += char;
            }
        }
    }
    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField);
        result.push(currentRow);
    }
    return result.filter(row => row.length > 0 && (row.length > 1 || row[0] !== ''));
  };

  const handleFile = useCallback((file: File) => {
    setError(null);
    if (!file || !file.type.match('text/csv')) {
      setError('Invalid file type. Please upload a .csv file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = parseCSV(text);
        if (data.length > 1) {
          const headers = data[0];
          const records = data.slice(1);
          onFileUpload(records, headers);
        } else {
          setError('CSV file is empty or contains only a header.');
        }
      } catch (e) {
        setError('Failed to parse the CSV file.');
        console.error(e);
      }
    };
    reader.onerror = () => {
        setError('Error reading file.');
    };
    reader.readAsText(file);
  }, [onFileUpload]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-slate-200">
      <h2 className="text-xl font-semibold text-center text-slate-700 mb-2">Upload your Product List</h2>
      <p className="text-center text-slate-500 mb-6">Drag & drop a CSV file or click to select one.</p>
      
      <div
        onDrop={handleDrop}
        onDragEnter={handleDragEvents}
        onDragOver={handleDragEvents}
        onDragLeave={handleDragEvents}
        className={`relative flex flex-col items-center justify-center w-full p-12 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ${
          isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
        }`}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          id="file-upload"
        />
        <UploadIcon className="w-12 h-12 text-slate-400 mb-4" />
        <p className="text-slate-600 font-semibold">
          {isDragging ? 'Drop it like it\'s hot!' : 'Click to upload or drag and drop'}
        </p>
        <p className="text-sm text-slate-500">CSV files only</p>
      </div>
      {error && <p className="mt-4 text-center text-red-500 font-medium">{error}</p>}
    </div>
  );
};

export default FileUpload;
