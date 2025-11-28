/**
 * Compliance Copilot Page (EF2)
 * AI-powered compliance assistant with knowledge base
 */

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Shield,
  Send,
  Book,
  Search,
  MessageSquare,
  FileText,
  Plus,
} from 'lucide-react';
import { api } from '@/lib/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: Array<{ id: string; title: string; category: string }>;
}

interface KnowledgeBaseEntry {
  id: string;
  title: string;
  documentType: string;
  category: string;
  summary: string | null;
  status: string;
  usageCount: number;
}

export function ComplianceCopilotPage() {
  const [activeTab, setActiveTab] = useState<'chat' | 'knowledge'>('chat');
  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: knowledgeBase, isLoading: kbLoading } = useQuery<KnowledgeBaseEntry[]>({
    queryKey: ['compliance-kb'],
    queryFn: async () => {
      const response = await api.get('/audit/compliance/knowledge-base');
      return response.data.data;
    },
  });

  const chatMutation = useMutation({
    mutationFn: async (msg: string) => {
      const response = await api.post('/audit/compliance/chat', {
        message: msg,
        conversationId,
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      setConversationId(data.conversationId);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString(),
          sources: data.sources,
        },
      ]);
    },
  });

  const handleSendMessage = () => {
    if (!message.trim()) return;

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: message, timestamp: new Date().toISOString() },
    ]);
    chatMutation.mutate(message);
    setMessage('');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const categoryColors: Record<string, string> = {
    iso9001: 'bg-blue-100 text-blue-800',
    iso14001: 'bg-green-100 text-green-800',
    osha: 'bg-red-100 text-red-800',
    industry_specific: 'bg-purple-100 text-purple-800',
    internal: 'bg-gray-100 text-gray-800',
  };

  const filteredKB = (knowledgeBase || []).filter(
    (entry) =>
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Shield className="h-7 w-7 mr-3 text-green-600" />
            EF2: Copilote de Conformité
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Assistant IA pour la conformité ISO 9001, OSHA et standards internes
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              activeTab === 'chat'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            <MessageSquare className="h-4 w-4 inline mr-2" />
            Chat
          </button>
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              activeTab === 'knowledge'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            <Book className="h-4 w-4 inline mr-2" />
            Base de Connaissances
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {activeTab === 'chat' ? (
          <div className="h-full flex flex-col">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="h-16 w-16 mx-auto text-green-200 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Bienvenue dans le Copilote de Conformité
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                    Posez vos questions sur les standards ISO 9001, ISO 14001, OSHA,
                    ou les procédures internes de qualité.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                      'Quelles sont les exigences ISO 9001 pour la documentation?',
                      'Comment gérer une non-conformité majeure?',
                      'Procédure d\'audit interne',
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setMessage(suggestion)}
                        className="px-3 py-2 text-sm text-green-700 bg-green-50 rounded-lg hover:bg-green-100"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-3xl rounded-lg px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <p className="text-xs font-medium mb-2 opacity-75">Sources:</p>
                          <div className="flex flex-wrap gap-2">
                            {msg.sources.map((source) => (
                              <span
                                key={source.id}
                                className="inline-flex items-center px-2 py-1 text-xs bg-white/20 rounded"
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                {source.title}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {chatMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="animate-bounce h-2 w-2 bg-green-500 rounded-full" />
                      <div className="animate-bounce h-2 w-2 bg-green-500 rounded-full" style={{ animationDelay: '0.1s' }} />
                      <div className="animate-bounce h-2 w-2 bg-green-500 rounded-full" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Posez votre question sur la conformité..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || chatMutation.isPending}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Knowledge Base Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher dans la base de connaissances..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </button>
              </div>
            </div>

            {/* Knowledge Base List */}
            <div className="flex-1 overflow-y-auto p-4">
              {kbLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600" />
                </div>
              ) : filteredKB.length === 0 ? (
                <div className="text-center py-12">
                  <Book className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Base de connaissances vide
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Ajoutez des standards, procédures et guides de conformité.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredKB.map((entry) => (
                    <div
                      key={entry.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded mb-2 ${categoryColors[entry.category] || 'bg-gray-100 text-gray-800'}`}>
                            {entry.category.toUpperCase()}
                          </span>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {entry.title}
                          </h3>
                          {entry.summary && (
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                              {entry.summary}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                        <span className="capitalize">{entry.documentType}</span>
                        <span>{entry.usageCount} consultations</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
