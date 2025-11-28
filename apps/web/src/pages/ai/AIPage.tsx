/**
 * AI Features Page
 * Central hub for all AI-powered features
 */

import { useSearchParams } from 'react-router-dom';
import { AISmartSearch } from '@/components/ai/AISmartSearch';
import { AIInvoiceExtractor } from '@/components/ai/AIInvoiceExtractor';
import { AIInsightsDashboard } from '@/components/ai/AIInsightsDashboard';

type Tab = 'search' | 'extract' | 'insights';

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'search',
    label: 'Smart Search',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    id: 'extract',
    label: 'Invoice Extractor',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: 'insights',
    label: 'Insights & Usage',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
];

export function AIPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as Tab) || 'search';

  const setActiveTab = (tab: Tab) => {
    setSearchParams({ tab });
  };

  const handleSearchResultClick = (result: { entityType: string; entityId: string }) => {
    // Navigate to the entity page based on type
    const routes: Record<string, string> = {
      invoice: '/finance/invoices',
      customer: '/crm/companies',
      contact: '/crm/contacts',
      product: '/inventory',
    };
    const route = routes[result.entityType];
    if (route) {
      window.location.href = `${route}?id=${result.entityId}`;
    }
  };

  const handleCreateInvoice = (data: unknown) => {
    // Navigate to invoice creation with pre-filled data
    console.log('Create invoice with data:', data);
    // Store in sessionStorage and redirect
    sessionStorage.setItem('prefillInvoice', JSON.stringify(data));
    window.location.href = '/finance/invoices?action=create';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Features</h1>
          <p className="text-muted-foreground mt-1">
            Leverage AI to search, extract, and gain insights from your data
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-primary">AI Powered</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'search' && (
          <div className="space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold mb-2">Semantic Search</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Use natural language to find invoices, customers, products, and more.
                AI understands context and meaning, not just keywords.
              </p>
              <AISmartSearch
                onResultClick={handleSearchResultClick}
                placeholder="Try: 'invoices from last month over $1000' or 'customers in New York'"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border bg-card p-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-medium">Invoice Search</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Find invoices by amount, date, customer, or status
                </p>
              </div>

              <div className="rounded-lg border bg-card p-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="font-medium">Customer Lookup</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Search customers by name, location, or history
                </p>
              </div>

              <div className="rounded-lg border bg-card p-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="font-medium">Product Discovery</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Find products by description or attributes
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'extract' && (
          <AIInvoiceExtractor onCreateInvoice={handleCreateInvoice} />
        )}

        {activeTab === 'insights' && (
          <AIInsightsDashboard />
        )}
      </div>
    </div>
  );
}
