/**
 * AI Chat Widget
 * Floating chat widget for AI assistant conversations
 * Enhanced with animations, markdown rendering, and improved UX
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface Conversation {
  id: string;
  title?: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

interface ChatResponse {
  conversationId: string;
  message: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

type SystemRole = 'assistant' | 'financialAdvisor' | 'invoiceExtractor' | 'customerAnalyst' | 'inventoryOptimizer' | 'dataAnalyst';

const roleConfig: Record<SystemRole, { label: string; icon: string; color: string }> = {
  assistant: { label: 'General Assistant', icon: '🤖', color: 'bg-blue-500' },
  financialAdvisor: { label: 'Financial Advisor', icon: '💰', color: 'bg-green-500' },
  invoiceExtractor: { label: 'Invoice Specialist', icon: '📄', color: 'bg-yellow-500' },
  customerAnalyst: { label: 'Customer Analyst', icon: '👥', color: 'bg-purple-500' },
  inventoryOptimizer: { label: 'Inventory Expert', icon: '📦', color: 'bg-orange-500' },
  dataAnalyst: { label: 'Data Analyst', icon: '📊', color: 'bg-cyan-500' },
};

// Simple markdown-like formatting
function formatMessage(content: string): React.ReactNode {
  const lines = content.split('\n');

  return lines.map((line, i) => {
    // Check for numbered list
    if (/^\d+\.\s/.test(line)) {
      return (
        <div key={i} className="ml-4 my-1">
          {line.split(/\*\*(.*?)\*\*/).map((part, j) =>
            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
          )}
        </div>
      );
    }

    // Check for bullet list
    if (/^[-•]\s/.test(line)) {
      return (
        <div key={i} className="ml-4 my-1 flex gap-2">
          <span>•</span>
          <span>
            {line.substring(2).split(/\*\*(.*?)\*\*/).map((part, j) =>
              j % 2 === 1 ? <strong key={j}>{part}</strong> : part
            )}
          </span>
        </div>
      );
    }

    // Regular line
    return (
      <div key={i} className={line === '' ? 'h-2' : ''}>
        {line.split(/\*\*(.*?)\*\*/).map((part, j) =>
          j % 2 === 1 ? <strong key={j}>{part}</strong> : part
        )}
      </div>
    );
  });
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<(ChatMessage & { id: string; time: Date })[]>([]);
  const [systemRole, setSystemRole] = useState<SystemRole>('assistant');
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  // Fetch conversations list
  const { data: conversations } = useQuery({
    queryKey: ['ai-conversations'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Conversation[]>>('/ai/conversations?limit=10');
      return response.data.data;
    },
    enabled: isOpen,
  });

  // Fetch current conversation
  const { data: currentConversation } = useQuery({
    queryKey: ['ai-conversation', conversationId],
    queryFn: async () => {
      if (!conversationId) return null;
      const response = await api.get<ApiResponse<Conversation>>(`/ai/conversations/${conversationId}`);
      return response.data.data;
    },
    enabled: !!conversationId,
  });

  // Update local messages when conversation is loaded
  useEffect(() => {
    if (currentConversation) {
      setLocalMessages(
        currentConversation.messages
          .filter(m => m.role !== 'system')
          .map((m, i) => ({
            ...m,
            id: `loaded-${i}`,
            time: new Date(currentConversation.createdAt),
          }))
      );
    }
  }, [currentConversation]);

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (userMessage: string) => {
      const response = await api.post<ApiResponse<ChatResponse>>('/ai/chat', {
        message: userMessage,
        conversationId: conversationId || undefined,
        systemRole,
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      setConversationId(data.conversationId);
      setLocalMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        id: `assistant-${Date.now()}`,
        time: new Date(),
      }]);
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
    },
    onError: (error) => {
      setLocalMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${getErrorMessage(error)}. Please try again.`,
        id: `error-${Date.now()}`,
        time: new Date(),
      }]);
    },
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMessage.isPending) return;

    const userMessage = message.trim();
    setMessage('');
    setLocalMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      id: `user-${Date.now()}`,
      time: new Date(),
    }]);
    sendMessage.mutate(userMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const startNewConversation = () => {
    setConversationId(null);
    setLocalMessages([]);
    setShowHistory(false);
  };

  const loadConversation = (id: string) => {
    setConversationId(id);
    setShowHistory(false);
  };

  const copyToClipboard = useCallback(async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // Floating button when closed
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full shadow-lg hover:shadow-xl flex items-center justify-center z-50 transition-all duration-300 hover:scale-110 group"
        title="Open AI Assistant"
      >
        <svg className="w-6 h-6 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
      </button>
    );
  }

  // Minimized state
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-card rounded-full shadow-lg border px-4 py-2 flex items-center gap-3 hover:shadow-xl transition-shadow">
          <div className={`w-8 h-8 rounded-full ${roleConfig[systemRole].color} flex items-center justify-center text-white text-sm`}>
            {roleConfig[systemRole].icon}
          </div>
          <span className="text-sm font-medium">AI Assistant</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1.5 hover:bg-accent rounded-full transition-colors"
              title="Expand"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-accent rounded-full text-muted-foreground transition-colors"
              title="Close"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[400px] h-[600px] bg-card rounded-2xl shadow-2xl border flex flex-col z-50 animate-in slide-in-from-bottom-4 zoom-in-95 duration-300 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${roleConfig[systemRole].color} flex items-center justify-center text-white shadow-md`}>
            <span className="text-lg">{roleConfig[systemRole].icon}</span>
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">{roleConfig[systemRole].label}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2 rounded-lg transition-colors ${showHistory ? 'bg-accent' : 'hover:bg-accent'}`}
            title="Conversation History"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button
            onClick={() => setShowRoleSelector(!showRoleSelector)}
            className={`p-2 rounded-lg transition-colors ${showRoleSelector ? 'bg-accent' : 'hover:bg-accent'}`}
            title="Change AI Role"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={startNewConversation}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
            title="New Conversation"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
            title="Minimize"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-accent rounded-lg text-muted-foreground transition-colors"
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Role Selector Dropdown */}
      {showRoleSelector && (
        <div className="absolute top-16 right-4 bg-card border rounded-xl shadow-xl p-2 z-20 w-56 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-xs text-muted-foreground px-3 py-2 font-medium">Select AI Role</p>
          {(Object.entries(roleConfig) as [SystemRole, typeof roleConfig[SystemRole]][]).map(([role, config]) => (
            <button
              key={role}
              onClick={() => {
                setSystemRole(role);
                setShowRoleSelector(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                systemRole === role ? 'bg-accent' : 'hover:bg-accent/50'
              }`}
            >
              <span className={`w-8 h-8 rounded-lg ${config.color} flex items-center justify-center text-white`}>
                {config.icon}
              </span>
              <span className="font-medium">{config.label}</span>
              {systemRole === role && (
                <svg className="w-4 h-4 ml-auto text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      {/* History Panel */}
      {showHistory && (
        <div className="absolute top-16 left-4 right-4 bg-card border rounded-xl shadow-xl p-3 z-20 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-xs text-muted-foreground px-2 py-1 font-medium">Recent Conversations</p>
          {conversations && conversations.length > 0 ? (
            <div className="space-y-1 mt-2">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    conversationId === conv.id ? 'bg-accent' : 'hover:bg-accent/50'
                  }`}
                >
                  <p className="text-sm font-medium truncate">{conv.title || 'Untitled'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatTimestamp(new Date(conv.updatedAt))}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No conversations yet</p>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {localMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className={`w-16 h-16 rounded-2xl ${roleConfig[systemRole].color} flex items-center justify-center text-white shadow-lg mb-4`}>
              <span className="text-3xl">{roleConfig[systemRole].icon}</span>
            </div>
            <h4 className="font-semibold text-lg mb-2">How can I help you?</h4>
            <p className="text-sm text-muted-foreground mb-6">
              I'm your {roleConfig[systemRole].label.toLowerCase()}. Ask me anything about your business.
            </p>
            <div className="grid grid-cols-2 gap-2 w-full">
              {[
                'Show recent invoices',
                'Analyze my sales',
                'Help with inventory',
                'Customer insights',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setMessage(suggestion);
                    inputRef.current?.focus();
                  }}
                  className="text-xs px-3 py-2 rounded-lg border bg-background hover:bg-accent transition-colors text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          localMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : `${roleConfig[systemRole].color} text-white`
              }`}>
                {msg.role === 'user' ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ) : (
                  <span className="text-sm">{roleConfig[systemRole].icon}</span>
                )}
              </div>

              {/* Message Content */}
              <div className={`flex-1 max-w-[75%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                <div
                  className={`inline-block rounded-2xl px-4 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted rounded-bl-md'
                  }`}
                >
                  <div className="text-sm leading-relaxed">
                    {msg.role === 'assistant' ? formatMessage(msg.content) : msg.content}
                  </div>
                </div>
                <div className={`flex items-center gap-2 mt-1 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  <span className="text-[10px] text-muted-foreground">
                    {formatTimestamp(msg.time)}
                  </span>
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy message"
                    >
                      {copiedId === msg.id ? (
                        <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Typing Indicator */}
        {sendMessage.isPending && (
          <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${roleConfig[systemRole].color} flex items-center justify-center text-white`}>
              <span className="text-sm">{roleConfig[systemRole].icon}</span>
            </div>
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-background/50">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="w-full rounded-xl border border-input bg-background px-4 py-3 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all min-h-[48px] max-h-[120px]"
              rows={1}
              disabled={sendMessage.isPending}
              style={{ height: Math.min(120, Math.max(48, message.split('\n').length * 24)) }}
            />
            <div className="absolute right-2 bottom-2 text-xs text-muted-foreground">
              {message.length > 0 && `${message.length}/2000`}
            </div>
          </div>
          <button
            type="submit"
            disabled={!message.trim() || sendMessage.isPending}
            className="w-12 h-12 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          >
            {sendMessage.isPending ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  );
}
