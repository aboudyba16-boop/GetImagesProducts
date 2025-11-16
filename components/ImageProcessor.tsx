import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Product, ImageResult } from '../types';
import { fetchProductImages } from '../services/geminiService';
import Spinner from './Spinner';
import { DownloadIcon, CheckCircleIcon, ErrorIcon } from './icons';

interface ImageProcessorProps {
  initialProducts: Product[];
}

// Sub-component defined outside the main component to prevent re-creation on re-renders.
const ImageThumbnail: React.FC<{
  imageUrl: string;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ imageUrl, isSelected, onSelect }) => {
  return (
    <div
      onClick={onSelect}
      className={`relative rounded-lg overflow-hidden cursor-pointer aspect-square transition-all duration-200 transform hover:scale-105 ${
        isSelected ? 'ring-4 ring-indigo-500 shadow-lg' : 'ring-2 ring-transparent'
      }`}
    >
      <img src={imageUrl} alt="Generated product" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity duration-200"></div>
      {isSelected && (
        <div className="absolute top-2 right-2 bg-indigo-600 rounded-full text-white p-1">
          <CheckCircleIcon className="h-5 w-5" />
        </div>
      )}
    </div>
  );
};

// Sub-component defined outside the main component
const ProductCard: React.FC<{
  product: Product;
  onSelectImage: (productId: number, imageUrl: string) => void;
}> = ({ product, onSelectImage }) => {
  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden p-4 flex flex-col h-full">
      <h3 className="font-bold text-slate-800 truncate mb-3" title={product.name}>{product.name}</h3>
      <div className="flex-grow flex items-center justify-center">
        {product.status === 'loading' && (
          <div className="flex flex-col items-center text-slate-500">
            <Spinner />
            <span className="mt-2 text-sm">Generating...</span>
          </div>
        )}
        {product.status === 'error' && (
          <div className="flex flex-col items-center text-red-500">
            <ErrorIcon className="w-10 h-10 mb-2" />
            <span className="text-sm font-semibold">{product.error}</span>
          </div>
        )}
        {product.status === 'done' && (
          <div className="grid grid-cols-3 gap-2 w-full">
            {product.images.map(image => (
              <ImageThumbnail
                key={image.id}
                imageUrl={image.url}
                isSelected={image.url === product.selectedImageUrl}
                onSelect={() => onSelectImage(product.id, image.url)}
              />
            ))}
          </div>
        )}
        {(product.status === 'pending') && (
           <div className="text-slate-400 text-sm">Queued</div>
        )}
      </div>
    </div>
  );
};

const ImageProcessor: React.FC<ImageProcessorProps> = ({ initialProducts }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const BATCH_SIZE = 5;

  const updateProduct = useCallback((productId: number, updates: Partial<Product>) => {
    setProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, ...updates } : p))
    );
  }, []);

  const processBatch = useCallback(async () => {
    const batch = products.slice(currentIndex, currentIndex + BATCH_SIZE);
    if (batch.length === 0 || isProcessing) {
      return;
    }

    setIsProcessing(true);

    const processingPromises = batch.map(async (product) => {
      if (product.status !== 'pending') return;
      
      updateProduct(product.id, { status: 'loading' });
      try {
        const imageUrls = await fetchProductImages(product.name);
        const imageResults: ImageResult[] = imageUrls.map((url, i) => ({
          id: `${product.id}-${i}`,
          url,
        }));
        updateProduct(product.id, {
          status: 'done',
          images: imageResults,
          selectedImageUrl: imageResults[0]?.url || null,
        });
      } catch (error) {
        console.error(`Failed to generate images for ${product.name}:`, error);
        let errorMessage = 'API Failed';
        if (error instanceof Error && error.message) {
            if (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('quota')) {
                errorMessage = 'Rate limit exceeded';
            }
        }
        updateProduct(product.id, { status: 'error', error: errorMessage });
      }
    });

    await Promise.all(processingPromises);
    setIsProcessing(false);
  }, [products, currentIndex, updateProduct, isProcessing]);

  useEffect(() => {
    processBatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]); // Intentionally only run when the index changes to trigger a new batch

  const handleSelectImage = (productId: number, imageUrl: string) => {
    updateProduct(productId, { selectedImageUrl: imageUrl });
  };
  
  const handleNextBatch = () => {
    if (currentIndex + BATCH_SIZE < products.length) {
      setCurrentIndex(prev => prev + BATCH_SIZE);
    }
  };

  const handleDownload = () => {
    products.forEach(product => {
      if (product.selectedImageUrl) {
        const a = document.createElement('a');
        a.href = product.selectedImageUrl;
        const filename = product.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        a.download = `${filename}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
  };

  const hasNextBatch = currentIndex + BATCH_SIZE < products.length;
  const processedCount = useMemo(() => products.filter(p => p.status === 'done' || p.status === 'error').length, [products]);
  const totalCount = products.length;
  const selectedCount = useMemo(() => products.filter(p => !!p.selectedImageUrl).length, [products]);

  return (
    <div>
      <div className="sticky top-0 bg-slate-50/80 backdrop-blur-lg z-10 py-4 mb-6 px-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
                 <h2 className="text-xl font-semibold text-slate-800">Processing Products</h2>
                 <p className="text-slate-500">{processedCount} of {totalCount} processed</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleNextBatch}
                disabled={!hasNextBatch || isProcessing}
                className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg shadow-sm hover:bg-slate-100 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition duration-150 ease-in-out"
              >
                {isProcessing ? 'Processing...' : `Next ${BATCH_SIZE}`}
              </button>
              <button
                onClick={handleDownload}
                disabled={selectedCount === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition duration-150 ease-in-out"
              >
                <DownloadIcon className="h-5 w-5" />
                Download ({selectedCount})
              </button>
            </div>
          </div>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onSelectImage={handleSelectImage}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageProcessor;
