/**
 * AI Prompts
 * Pre-defined prompts for common business tasks
 */

export const SYSTEM_PROMPTS = {
  // General assistant
  assistant: `You are an intelligent ERP assistant helping users manage their business operations.
You have access to data about invoices, customers, payments, inventory, and more.
Provide accurate, helpful, and professional responses. Always format numbers with proper currency symbols.`,

  // Finance specific
  financialAdvisor: `You are a financial advisor AI helping with accounting and finance tasks.
Analyze financial data, provide insights, and suggest best practices.
Always ensure compliance with accounting standards.`,

  // Invoice processing
  invoiceExtractor: `You are an invoice data extraction specialist.
Extract all relevant information from invoice documents including:
- Invoice number
- Date and due date
- Customer/vendor information
- Line items with descriptions, quantities, and prices
- Tax amounts
- Total amount
Return data in structured JSON format.`,

  // Customer insights
  customerAnalyst: `You are a customer relationship analyst.
Analyze customer behavior, purchase patterns, and engagement.
Provide actionable insights to improve customer satisfaction and retention.`,

  // Inventory management
  inventoryOptimizer: `You are an inventory management specialist.
Analyze stock levels, demand patterns, and suggest optimal reorder points.
Help prevent stockouts while minimizing excess inventory.`,

  // Data analyst
  dataAnalyst: `You are a business intelligence analyst.
Analyze business data, identify trends, and provide actionable insights.
Use clear visualizations and explain complex patterns in simple terms.`,
};

export const PROMPT_TEMPLATES = {
  // Invoice analysis
  analyzeInvoice: (invoiceData: any) => `
Analyze this invoice and provide insights:
${JSON.stringify(invoiceData, null, 2)}

Please provide:
1. Summary of the invoice
2. Any unusual patterns or amounts
3. Payment likelihood based on customer history
4. Recommendations
`,

  // Customer insights
  customerInsights: (customerId: string, data: any) => `
Analyze this customer's data and provide insights:
Customer ID: ${customerId}
Data: ${JSON.stringify(data, null, 2)}

Provide:
1. Purchase behavior summary
2. Revenue contribution
3. Engagement level
4. Recommendations for better relationship
`,

  // Predict payment
  predictPayment: (invoiceData: any, historicalData: any[]) => `
Based on this invoice and historical payment data, predict when this invoice will be paid:

Current Invoice:
${JSON.stringify(invoiceData, null, 2)}

Historical Payments (last 10):
${JSON.stringify(historicalData, null, 2)}

Provide:
1. Predicted payment date
2. Confidence level (0-100%)
3. Risk factors
4. Recommendations
`,

  // Stock optimization
  optimizeStock: (itemData: any, salesData: any[]) => `
Analyze this inventory item and suggest optimal stock levels:

Item: ${JSON.stringify(itemData, null, 2)}
Recent Sales: ${JSON.stringify(salesData, null, 2)}

Provide:
1. Recommended reorder point
2. Optimal order quantity
3. Forecast for next 30 days
4. Risk of stockout
`,

  // Smart search query
  enhanceSearchQuery: (query: string, context?: string) => `
Enhance this search query to better find relevant ERP data:
Query: "${query}"
Context: ${context || 'General search'}

Return:
1. Enhanced query
2. Suggested filters
3. Related entities to search
`,

  // Anomaly detection
  detectAnomaly: (transaction: any, normalPatterns: any) => `
Analyze if this transaction is anomalous:

Transaction: ${JSON.stringify(transaction, null, 2)}
Normal Patterns: ${JSON.stringify(normalPatterns, null, 2)}

Provide:
1. Is this anomalous? (yes/no)
2. Anomaly score (0-100)
3. Reasons
4. Recommended actions
`,

  // Generate description
  generateDescription: (context: string, data: any) => `
Generate a professional business description for:
Context: ${context}
Data: ${JSON.stringify(data, null, 2)}

Provide a clear, concise, professional description suitable for business documents.
`,
};

export class PromptBuilder {
  /**
   * Build a chat prompt with context
   */
  static buildChatPrompt(
    userMessage: string,
    systemRole: keyof typeof SYSTEM_PROMPTS,
    context?: string
  ): { role: 'system' | 'user'; content: string }[] {
    const messages: { role: 'system' | 'user'; content: string }[] = [
      { role: 'system', content: SYSTEM_PROMPTS[systemRole] },
    ];

    if (context) {
      messages.push({
        role: 'system',
        content: `Context: ${context}`,
      });
    }

    messages.push({ role: 'user', content: userMessage });

    return messages;
  }

  /**
   * Build a JSON extraction prompt
   */
  static buildExtractionPrompt(text: string, schema: string): string {
    return `Extract data from the following text according to this JSON schema:

Schema:
${schema}

Text:
${text}

Return ONLY valid JSON matching the schema, with no additional text or explanations.`;
  }

  /**
   * Build a classification prompt
   */
  static buildClassificationPrompt(text: string, categories: string[]): string {
    return `Classify the following text into exactly one of these categories: ${categories.join(', ')}

Text: ${text}

Respond with JSON in this exact format: {"category": "selected_category", "confidence": 0.95}`;
  }
}
