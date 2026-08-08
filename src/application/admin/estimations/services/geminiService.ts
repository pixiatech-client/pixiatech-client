export const geminiService = {
  async translateToChinese(estimation: any): Promise<string> {
    try {
      const total = estimation.products?.reduce((acc: number, p: any) => acc + (p.quantity * (p.unitPrice || 0)), 0) || 0;
      const prompt = `Translate the following estimation details into professional Chinese (Simplified). 
      Include client name, products, quantities, prices, and the total. 
      Format it as a clean, readable quote.
      
      Estimation Details:
      Client: ${estimation.client?.name || estimation.client}
      Products: ${estimation.products?.map((p: any) => `${p.name || p.productName} (x${p.quantity}): ${p.unitPrice || 0}€`).join(', ')}
      Total Produit: ${total}€
      `;

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: "gemini-1.5-flash", prompt }),
      });
      const data = await res.json();
      return data.text || "Erreur de traduction";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Désolé, impossible de traduire pour le moment.";
    }
  },

  async generateSummary(estimation: any): Promise<string> {
    try {
      const prompt = `Provide a concise executive summary of this estimation for a supplier. 
      Highlight the total amount, the number of items, and any significant discounts applied.
      Keep it professional and action-oriented.
      
      Data:
      Client: ${estimation.client?.name || estimation.client}
      Item Count: ${estimation.products?.length || 0}
      Subtotal Discount: ${estimation.productDiscount || 0}% discount applied.
      Tax: ${estimation.taxRate || 20}%
      `;

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: "gemini-1.5-flash", prompt }),
      });
      const data = await res.json();
      return data.text || "Erreur de génération du résumé";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Désolé, impossible de générer le résumé pour le moment.";
    }
  }
};
