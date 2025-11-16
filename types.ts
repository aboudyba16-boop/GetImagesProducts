
export interface ImageResult {
  id: string;
  url: string; // base64 data URL
}

export interface Product {
  id: number;
  name: string;
  status: 'pending' | 'loading' | 'done' | 'error';
  images: ImageResult[];
  selectedImageUrl: string | null;
  error?: string;
}

export enum AppStep {
  UPLOAD,
  MAP_COLUMNS,
  PROCESS_IMAGES,
}
