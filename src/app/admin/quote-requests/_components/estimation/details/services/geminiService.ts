import { Estimation } from "../types";

// Note: In Next.js, we should use the appropriate Google Generative AI library
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' 
});
const modelName = "gemini-1.5-flash"; 

export const geminiService = {
  async translateToChinese(estimation: Estimation): Promise<string> {
    const total = estimation.products.reduce((acc, p) => acc + (p.quantity * p.unitPrice), 0);
    const prompt = `Translate the following estimation details into professional Chinese (Simplified). 
    Include client name, products, quantities, prices, and the total. 
    Format it as a clean, readable quote.
    
    Estimation Details:
    Client: ${estimation.client.name}
    Products: ${estimation.products.map(p => `${p.name} (x${p.quantity}): ${p.unitPrice}€`).join(', ')}
    Total Produit: ${total}€
    `;

    try {
      const response = await (ai as any).models.generateContent({
        model: modelName,
        contents: prompt,
      });
      return response.text || "Erreur de traduction";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Désolé, impossible de traduire pour le moment.";
    }
  },

  async generateSummary(estimation: Estimation): Promise<string> {
    const prompt = `Provide a concise executive summary of this estimation for a supplier. 
    Highlight the total amount, the number of items, and any significant discounts applied.
    Keep it professional and action-oriented.
    
    Data:
    Client: ${estimation.client.name}
    Item Count: ${estimation.products.length}
    Subtotal: ${estimation.productDiscount}% discount applied.
    Tax: ${estimation.taxRate}%
    `;

    try {
      const response = await (ai as any).models.generateContent({
        model: modelName,
        contents: prompt,
      });
      return response.text || "Erreur de génération du résumé";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Désolé, impossible de générer le résumé pour le moment.";
    }
  }
};
