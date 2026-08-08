import { Estimation } from "../types";

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
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: "gemini-1.5-flash", prompt }),
      });
      const data = await res.json();
      return data.text || "Translation error";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Sorry, unable to translate at the moment.";
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
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: "gemini-1.5-flash", prompt }),
      });
      const data = await res.json();
      return data.text || "Error generating summary";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Sorry, unable to generate the summary at the moment.";
    }
  }
};
