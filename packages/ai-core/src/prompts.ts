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

  // ============================================
  // SMART AUDIT SYSTEM PROMPTS
  // ============================================

  // EF1: Risk Assessment Expert
  riskAssessmentExpert: `You are an expert in manufacturing quality risk assessment.
Your role is to analyze quality data and assess risks in manufacturing processes.
You evaluate defect rates, process variations, supplier performance, and compliance metrics.
Always provide:
- Quantified risk scores (0-100)
- Specific risk factors with weights
- Actionable recommendations
- Resource allocation suggestions
Use ISO 9001 and industry best practices as your framework.`,

  // EF2: Compliance Copilot
  complianceCopilot: `You are a manufacturing compliance expert with deep knowledge of:
- ISO 9001:2015 Quality Management Systems
- ISO 14001 Environmental Management
- OSHA Workplace Safety Standards
- Industry-specific regulations
- Internal quality procedures

Your role is to:
- Answer compliance questions with specific standard references
- Identify gaps in compliance
- Suggest corrective actions
- Help prepare for audits
Always cite specific clause numbers when referencing standards.`,

  // EF3: Commonality Analysis Agent (ReAct)
  commonalityAgent: `You are an analytical agent using the ReAct framework to study commonality patterns in manufacturing data.

Your process follows:
1. THOUGHT: Analyze what you know and what pattern to investigate next
2. ACTION: Choose and execute an analysis action
3. OBSERVATION: Interpret the results
4. REPEAT: Continue until you have sufficient insights

Available actions:
- ANALYZE_DEFECTS: Look for defect patterns across products/processes
- COMPARE_SUPPLIERS: Compare performance metrics between suppliers
- CHECK_PROCESS: Analyze process variations and consistency
- FIND_ROOT_CAUSE: Identify potential root causes for issues
- COMPLETE: Finish analysis and summarize findings

Always provide confidence levels for your findings.`,

  // Audit Finding Analyzer
  findingAnalyzer: `You are an audit finding analyst. When given an audit finding:
1. Analyze the root cause
2. Assess the severity and business impact
3. Generate corrective action recommendations
4. Identify related standards or procedures
5. Suggest preventive measures

Respond in structured JSON format.`,
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

  // ============================================
  // SMART AUDIT SYSTEM TEMPLATES
  // ============================================

  // EF1: Risk Assessment
  riskAssessment: (assessmentType: string, dataPoints: any[], config?: any) => `
Perform a ${assessmentType} risk assessment based on the following quality data:

Data Points (latest ${dataPoints.length}):
${JSON.stringify(dataPoints.slice(0, 20), null, 2)}

${config ? `Configuration:\n${JSON.stringify(config, null, 2)}` : ''}

Analyze the data and provide a comprehensive risk assessment in this JSON format:
{
  "overallScore": number (0-100, higher = more risk),
  "qualityScore": number (0-100),
  "processScore": number (0-100),
  "supplierScore": number (0-100),
  "complianceScore": number (0-100),
  "factors": [
    {
      "factor": "factor name",
      "score": number (0-100),
      "weight": number (0-1, sum to 1),
      "description": "explanation"
    }
  ],
  "analysis": "detailed analysis text",
  "recommendations": ["action 1", "action 2", ...],
  "suggestedResources": [
    {
      "type": "auditor|equipment|training",
      "quantity": number,
      "priority": "high|medium|low",
      "rationale": "why needed"
    }
  ]
}
`,

  // Generate Audit Tasks from Assessment
  generateAuditTasks: (assessment: any, config: { maxTasks: number; minRiskScore: number }) => `
Based on this risk assessment, generate up to ${config.maxTasks} audit tasks for areas with risk >= ${config.minRiskScore}:

Risk Assessment:
- Overall Score: ${assessment.overallRiskScore}
- Quality Score: ${assessment.qualityRiskScore || 'N/A'}
- Process Score: ${assessment.processRiskScore || 'N/A'}
- Supplier Score: ${assessment.supplierRiskScore || 'N/A'}
- Risk Factors: ${JSON.stringify(assessment.riskFactors || [], null, 2)}
- Recommendations: ${JSON.stringify(assessment.recommendations || [], null, 2)}

Generate prioritized audit tasks in this JSON array format:
[
  {
    "title": "concise task title",
    "description": "detailed description of what to audit",
    "auditType": "quality|process|supplier|safety|compliance",
    "priority": "critical|high|medium|low",
    "riskScore": number (0-100),
    "riskFactors": ["factor1", "factor2"],
    "aiConfidence": number (0-100),
    "aiReasoning": "why this task is important"
  }
]
`,

  // EF2: Compliance Check
  complianceCheck: (entityType: string, entityData: any, standards: string[], knowledgeBase: any[]) => `
Perform a compliance check for this ${entityType} against the specified standards.

Entity Data:
${JSON.stringify(entityData, null, 2)}

Standards to Check: ${standards.join(', ')}

Relevant Knowledge Base Context:
${knowledgeBase.map(k => `[${k.title}]: ${k.summary || k.content?.substring(0, 300)}`).join('\n')}

Provide your compliance analysis in this JSON format:
{
  "overallStatus": "compliant|non_compliant|partially_compliant",
  "score": number (0-100),
  "results": [
    {
      "standard": "ISO 9001 Clause X.X",
      "requirement": "requirement description",
      "status": "compliant|non_compliant|not_applicable",
      "evidence": "what was observed",
      "gap": "gap description if non-compliant, null if compliant",
      "recommendation": "action to take if needed, null if compliant"
    }
  ],
  "analysis": "overall analysis text",
  "recommendations": ["priority action 1", "action 2"],
  "requiresAction": boolean,
  "actionItems": [
    {
      "description": "specific action needed",
      "priority": "high|medium|low",
      "dueDate": "suggested date or null",
      "assignedTo": null,
      "status": "pending"
    }
  ]
}
`,

  // EF3: Commonality Study - ReAct Step
  commonalityThought: (context: any, step: number) => `
You are analyzing manufacturing data for commonality patterns using the ReAct framework.

Current Step: ${step}
Study Type: ${context.studyType}
Filters: ${JSON.stringify(context.filters || {}, null, 2)}
Findings so far: ${JSON.stringify(context.findings || [], null, 2)}
Patterns identified: ${JSON.stringify(context.patterns || [], null, 2)}

Generate your next THOUGHT - what pattern or issue should you investigate next?
Be specific about what data you want to analyze and why.
`,

  commonalityAction: (thought: string, context: any) => `
Based on this thought:
"${thought}"

And available context:
${JSON.stringify(context, null, 2)}

Determine the next action. Choose from:
1. ANALYZE_DEFECTS - Look for defect patterns across products/processes
2. COMPARE_SUPPLIERS - Compare performance metrics between suppliers
3. CHECK_PROCESS - Analyze process variations and consistency
4. FIND_ROOT_CAUSE - Identify potential root causes for issues
5. COMPLETE - Finish analysis if sufficient data gathered

Respond in JSON:
{
  "type": "ACTION_NAME",
  "description": "what specifically to do",
  "params": { "relevant": "parameters" }
}
`,

  commonalityFinalAnalysis: (context: any) => `
Generate the final commonality study analysis based on all gathered data:

Study Context:
${JSON.stringify(context, null, 2)}

Provide a comprehensive analysis in this JSON format:
{
  "patterns": [
    {
      "patternId": "unique_id",
      "patternType": "defect|process_variation|supplier_issue|root_cause",
      "description": "pattern description",
      "frequency": number,
      "severity": "critical|major|minor",
      "affectedEntities": ["entity1", "entity2"],
      "rootCause": "identified root cause or null",
      "confidence": number (0-100)
    }
  ],
  "recommendations": [
    {
      "id": "unique_id",
      "title": "recommendation title",
      "description": "detailed recommendation",
      "priority": "high|medium|low",
      "expectedImpact": "expected outcome",
      "estimatedEffort": "low|medium|high",
      "status": "pending"
    }
  ],
  "supplierInsights": [
    {
      "supplierId": "id",
      "supplierName": "name",
      "performanceScore": number (0-100),
      "issues": ["issue1", "issue2"],
      "strengths": ["strength1"],
      "recommendations": ["action1"]
    }
  ],
  "variantAnalysis": {
    "variants": [
      {
        "variantId": "id",
        "description": "variant description",
        "consistency": number (0-100),
        "deviations": ["deviation1"]
      }
    ],
    "overallConsistency": number (0-100)
  }
}
`,

  // Analyze Finding
  analyzeFinding: (finding: { title: string; description: string; severity: string; category: string }) => `
Analyze this audit finding and provide recommendations:

Finding:
- Title: ${finding.title}
- Description: ${finding.description}
- Severity: ${finding.severity}
- Category: ${finding.category}

Provide your analysis in JSON format:
{
  "analysis": "root cause analysis and context",
  "recommendations": [
    "corrective action 1",
    "corrective action 2",
    "preventive action"
  ],
  "relatedStandards": ["ISO 9001 Clause X.X", ...],
  "estimatedImpact": "business impact description",
  "suggestedPriority": "critical|high|medium|low"
}
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
