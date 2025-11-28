/**
 * AI Smart Search
 * Semantic search interface with enhanced UI and animations
 */

import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';

interface SearchResult {
  entityType: string;
  entityId: string;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
}

interface AISmartSearchProps {
  onResultClick?: (result: SearchResult) => void;
  placeholder?: string;
  className?: string;
}

const entityTypeConfig: Record<string, { icon: React.ReactNode; color: string; bgColor: string; label: string }> = {
  invoice: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Invoice',
  },
  customer: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    label: 'Customer',
  },
  product: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Product',
  },
  contact: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    label: 'Contact',
  },
  default: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    label: 'Item',
  },
};

const recentSearches = [
  'invoices from last month',
  'overdue payments',
  'top customers',
  'low stock items',
];

export function AISmartSearch({ onResultClick, placeholder = 'Search with AI...', className = '' }: AISmartSearchProps) {
  const [query, setQuery] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const search = useMutation({
    mutationFn: async (searchQuery: string) => {
      const params: Record<string, string | number> = {
        query: searchQuery,
        limit: 10,
      };
      if (entityTypeFilter) {
        params.entityType = entityTypeFilter;
      }
      const response = await api.post<ApiResponse<SearchResult[]>>('/ai/search', params);
      return response.data.data;
    },
    onSuccess: (data) => {
      setResults(data);
      setShowResults(true);
      setShowSuggestions(false);
      setSelectedIndex(-1);
    },
    onError: (error) => {
      console.error('Search error:', getErrorMessage(error));
      setResults([]);
    },
  });

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showResults && !showSuggestions) return;

      const items = showResults ? results : recentSearches;
      const maxIndex = items.length - 1;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, maxIndex));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, -1));
          break;
        case 'Enter':
          if (selectedIndex >= 0) {
            e.preventDefault();
            if (showResults && results[selectedIndex]) {
              handleResultClick(results[selectedIndex]);
            } else if (showSuggestions && recentSearches[selectedIndex]) {
              setQuery(recentSearches[selectedIndex]);
              search.mutate(recentSearches[selectedIndex]);
            }
          }
          break;
        case 'Escape':
          setShowResults(false);
          setShowSuggestions(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showResults, showSuggestions, selectedIndex, results]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    search.mutate(query.trim());
  };

  const handleResultClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result);
    }
    setShowResults(false);
  };

  const handleFocus = () => {
    if (results.length > 0) {
      setShowResults(true);
    } else if (!query) {
      setShowSuggestions(true);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getConfig = (type: string) => entityTypeConfig[type] || entityTypeConfig.default;

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              {search.isPending ? (
                <svg className="w-5 h-5 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              onFocus={handleFocus}
              onBlur={() => setTimeout(() => {
                setShowSuggestions(false);
              }, 200)}
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setResults([]);
                  setShowResults(false);
                  inputRef.current?.focus();
                }}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Entity Type Filter */}
          <select
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value)}
            className="rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all min-w-[140px]"
          >
            <option value="">All Types</option>
            <option value="invoice">Invoices</option>
            <option value="customer">Customers</option>
            <option value="product">Products</option>
            <option value="contact">Contacts</option>
          </select>

          {/* Search Button */}
          <button
            type="submit"
            disabled={!query.trim() || search.isPending}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 text-sm font-medium transition-all hover:shadow-md active:scale-95"
          >
            Search
          </button>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && !query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3">
            <p className="text-xs text-muted-foreground font-medium px-2 mb-2">Recent Searches</p>
            <div className="space-y-1">
              {recentSearches.map((suggestion, index) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setQuery(suggestion);
                    search.mutate(suggestion);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                    selectedIndex === index ? 'bg-accent' : 'hover:bg-accent/50'
                  }`}
                >
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results Dropdown */}
      {showResults && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-xl shadow-xl z-50 max-h-[480px] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {results.length > 0 ? (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                <span className="text-sm font-medium">{results.length} results found</span>
                <button
                  onClick={() => setShowResults(false)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Close
                </button>
              </div>
              <div className="overflow-y-auto max-h-[400px] divide-y">
                {results.map((result, index) => {
                  const config = getConfig(result.entityType);
                  return (
                    <button
                      key={`${result.entityType}-${result.entityId}-${index}`}
                      onClick={() => handleResultClick(result)}
                      className={`w-full text-left p-4 hover:bg-accent/50 transition-colors ${
                        selectedIndex === index ? 'bg-accent' : ''
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${config.bgColor} ${config.color} flex items-center justify-center`}>
                          {config.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-semibold ${config.color} uppercase tracking-wide`}>
                              {config.label}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <div className={`w-2 h-2 rounded-full ${getScoreColor(result.score)}`} />
                              <span className="text-xs text-muted-foreground">
                                {Math.round(result.score * 100)}% match
                              </span>
                            </div>
                          </div>
                          <p className="text-sm font-medium line-clamp-2">{result.content}</p>
                          {result.metadata && Object.keys(result.metadata).length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {Object.entries(result.metadata).slice(0, 3).map(([key, value]) => (
                                <span
                                  key={key}
                                  className="inline-flex items-center text-xs bg-muted px-2 py-1 rounded-md"
                                >
                                  <span className="text-muted-foreground mr-1">{key}:</span>
                                  <span className="font-medium">{String(value)}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Arrow */}
                        <div className="flex-shrink-0 text-muted-foreground">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : !search.isPending && query ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="font-medium mb-1">No results found</p>
              <p className="text-sm text-muted-foreground">
                Try different keywords or remove filters
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* Click outside to close */}
      {(showResults || showSuggestions) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowResults(false);
            setShowSuggestions(false);
          }}
        />
      )}
    </div>
  );
}
