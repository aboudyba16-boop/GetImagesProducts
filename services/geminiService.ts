import { GoogleGenAI, Modality } from "@google/genai";

const generateImage = async (productName: string): Promise<string> => {
  // It is recommended to create a new client for each request
  // when the API key can change, such as in a multi-user environment.
  // For this app, it's safer to ensure the latest key is always used.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `A professional, clean, high-resolution product photograph of a "${productName}" on a plain white background, studio lighting.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const base64ImageBytes: string = part.inlineData.data;
      return `data:image/png;base64,${base64ImageBytes}`;
    }
  }

  throw new Error('Image generation failed, no image data received.');
};

export const fetchProductImages = async (productName: string): Promise<string[]> => {
  if (!productName || productName.trim() === "") {
    throw new Error("Product name cannot be empty.");
  }
  
  const images: string[] = [];
  // Generate three images sequentially to avoid hitting API rate limits.
  for (let i = 0; i < 3; i++) {
    const imageUrl = await generateImage(productName);
    images.push(imageUrl);
  }
  
  return images;
};
