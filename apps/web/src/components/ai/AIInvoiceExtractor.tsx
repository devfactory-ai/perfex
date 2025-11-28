/**
 * AI Invoice Extractor
 * Upload and extract structured data from invoice documents
 * Enhanced with better UX, progress indicators, and editable fields
 */

import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface ExtractedInvoice {
  invoiceNumber?: string;
  date?: string;
  dueDate?: string;
  customerName?: string;
  lineItems: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  raw?: string;
}

interface AIInvoiceExtractorProps {
  onExtracted?: (data: ExtractedInvoice) => void;
  onCreateInvoice?: (data: ExtractedInvoice) => void;
}

const steps = [
  { id: 'upload', label: 'Upload', icon: '📄' },
  { id: 'extract', label: 'Extract', icon: '🔍' },
  { id: 'review', label: 'Review', icon: '✅' },
];

export function AIInvoiceExtractor({ onExtracted, onCreateInvoice }: AIInvoiceExtractorProps) {
  const [text, setText] = useState('');
  const [, setExtractedData] = useState<ExtractedInvoice | null>(null);
  const [editedData, setEditedData] = useState<ExtractedInvoice | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractInvoice = useMutation({
    mutationFn: async (invoiceText: string) => {
      const response = await api.post<ApiResponse<ExtractedInvoice>>('/ai/extract/invoice', {
        text: invoiceText,
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      setExtractedData(data);
      setEditedData(data);
      setCurrentStep(2);
      if (onExtracted) {
        onExtracted(data);
      }
    },
    onError: (error) => {
      alert(`Extraction failed: ${getErrorMessage(error)}`);
      setCurrentStep(0);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setCurrentStep(1);
    extractInvoice.mutate(text.trim());
  };

  const handleFileRead = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setText(content);
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileRead(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileRead(e.target.files[0]);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleCreateInvoice = () => {
    if (editedData && onCreateInvoice) {
      onCreateInvoice(editedData);
    }
  };

  const handleClear = () => {
    setText('');
    setExtractedData(null);
    setEditedData(null);
    setFileName(null);
    setCurrentStep(0);
  };

  const updateField = (field: keyof ExtractedInvoice, value: string | number) => {
    if (!editedData) return;
    setEditedData({ ...editedData, [field]: value });
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    if (!editedData) return;
    const newLineItems = [...editedData.lineItems];
    newLineItems[index] = { ...newLineItems[index], [field]: value };

    // Recalculate amount
    if (field === 'quantity' || field === 'unitPrice') {
      newLineItems[index].amount = newLineItems[index].quantity * newLineItems[index].unitPrice;
    }

    // Recalculate totals
    const subtotal = newLineItems.reduce((sum, item) => sum + item.amount, 0);
    const tax = editedData.tax; // Keep original tax rate
    const total = subtotal + tax;

    setEditedData({ ...editedData, lineItems: newLineItems, subtotal, total });
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                index <= currentStep
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}>
                <span>{step.icon}</span>
                <span className="text-sm font-medium">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 transition-all ${
                  index < currentStep ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Input Section */}
      {currentStep < 2 && (
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="p-6 border-b bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <span className="text-2xl">📄</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold">AI Invoice Extractor</h3>
                <p className="text-sm text-muted-foreground">
                  Paste invoice text or upload a file to extract structured data
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Drag and Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                dragActive
                  ? 'border-primary bg-primary/5 scale-[1.02]'
                  : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.csv,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              {fileName ? (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">{fileName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFileName(null);
                      setText('');
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Drag and drop a file here, or{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-primary hover:underline font-medium"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Supports TXT, CSV files</p>
                </>
              )}
            </div>

            {/* Text Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Or paste invoice text</label>
                {text && (
                  <span className="text-xs text-muted-foreground">{text.length} characters</span>
                )}
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste the invoice content here...

Example:
INVOICE #INV-2024-001
Date: 2024-01-15
Due Date: 2024-02-15
Customer: Acme Corp

Items:
- Widget A x 10 @ $25.00 = $250.00
- Service B x 1 @ $150.00 = $150.00

Subtotal: $400.00
Tax (10%): $40.00
Total: $440.00"
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary font-mono transition-all"
                rows={12}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={!text.trim() || extractInvoice.isPending}
                className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 text-sm font-medium transition-all hover:shadow-lg active:scale-[0.98]"
              >
                {extractInvoice.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Extracting with AI...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Extract Invoice Data
                  </span>
                )}
              </button>
              {text && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-6 py-3 border border-input rounded-xl hover:bg-accent text-sm font-medium transition-all"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Extraction Progress */}
      {currentStep === 1 && (
        <div className="rounded-2xl border bg-card p-12 text-center animate-in fade-in duration-300">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Extracting Invoice Data</h3>
          <p className="text-muted-foreground">Our AI is analyzing your invoice...</p>
          <div className="flex items-center justify-center gap-1 mt-6">
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}

      {/* Extracted Data */}
      {currentStep === 2 && editedData && (
        <div className="rounded-2xl border bg-card overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="p-6 border-b bg-gradient-to-r from-green-500/10 to-green-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Extraction Complete</h3>
                  <p className="text-sm text-muted-foreground">
                    Review and edit the extracted information
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                AI Extracted
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Header Info */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Invoice Number</label>
                <input
                  type="text"
                  value={editedData.invoiceNumber || ''}
                  onChange={(e) => updateField('invoiceNumber', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Not found"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Date</label>
                <input
                  type="date"
                  value={editedData.date || ''}
                  onChange={(e) => updateField('date', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Due Date</label>
                <input
                  type="date"
                  value={editedData.dueDate || ''}
                  onChange={(e) => updateField('dueDate', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Customer</label>
                <input
                  type="text"
                  value={editedData.customerName || ''}
                  onChange={(e) => updateField('customerName', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Not found"
                />
              </div>
            </div>

            {/* Line Items */}
            {editedData.lineItems.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-3 block">Line Items</label>
                <div className="rounded-xl border overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide w-24">Qty</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide w-32">Unit Price</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide w-32">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {editedData.lineItems.map((item, index) => (
                        <tr key={index} className="hover:bg-accent/30 transition-colors">
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                              className="w-full px-2 py-1 rounded border border-transparent hover:border-input focus:border-primary bg-transparent text-sm focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 rounded border border-transparent hover:border-input focus:border-primary bg-transparent text-sm text-right focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 rounded border border-transparent hover:border-input focus:border-primary bg-transparent text-sm text-right focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-sm">
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-72 space-y-3 bg-muted/30 rounded-xl p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(editedData.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">{formatCurrency(editedData.tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-3">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(editedData.total)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={handleClear}
                className="px-6 py-2.5 border border-input rounded-xl hover:bg-accent text-sm font-medium transition-all"
              >
                Start Over
              </button>
              {onCreateInvoice && (
                <button
                  onClick={handleCreateInvoice}
                  className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 text-sm font-medium transition-all hover:shadow-lg active:scale-[0.98]"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Invoice from Data
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
