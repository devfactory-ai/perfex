/**
 * Patient Portal Messages Page
 * Secure messaging between patients and healthcare providers
 */

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type ApiResponse } from '@/lib/api';
import {
  MessageSquare,
  Send,
  ChevronLeft,
  User,
  Paperclip,
  Search,
  Clock,
  CheckCheck,
  Plus,
  Loader2,
  AlertCircle,
  Inbox
} from 'lucide-react';

interface MessageThread {
  id: string;
  subject: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  participants: Array<{
    name: string;
    role: string;
    isStaff: boolean;
  }>;
  status: 'open' | 'closed' | 'pending_response';
}

interface Message {
  id: string;
  content: string;
  senderName: string;
  senderRole: string;
  isFromPatient: boolean;
  createdAt: string;
  readAt: string | null;
  attachments: Array<{
    id: string;
    filename: string;
    url: string;
  }>;
}

interface ThreadsResponse {
  threads: MessageThread[];
}

interface MessagesResponse {
  messages: Message[];
  thread: MessageThread;
}

export function PortalMessagesPage() {
  const queryClient = useQueryClient();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [showNewThread, setShowNewThread] = useState(false);
  const [newThreadSubject, setNewThreadSubject] = useState('');
  const [newThreadCategory, setNewThreadCategory] = useState('general');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch threads
  const { data: threadsData, isLoading: isLoadingThreads } = useQuery({
    queryKey: ['portal-message-threads'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<ThreadsResponse>>(
        '/patient-portal/messages/threads',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('portalToken')}`,
          },
        }
      );
      return response.data.data;
    },
  });

  // Fetch messages for selected thread
  const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['portal-messages', selectedThreadId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<MessagesResponse>>(
        `/patient-portal/messages/threads/${selectedThreadId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('portalToken')}`,
          },
        }
      );
      return response.data.data;
    },
    enabled: !!selectedThreadId,
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(
        `/patient-portal/messages/threads/${selectedThreadId}/messages`,
        { content: newMessage },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('portalToken')}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-messages', selectedThreadId] });
      queryClient.invalidateQueries({ queryKey: ['portal-message-threads'] });
      setNewMessage('');
    },
  });

  // Create thread mutation
  const createThreadMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(
        '/patient-portal/messages/threads',
        {
          subject: newThreadSubject,
          category: newThreadCategory,
          initialMessage: newMessage,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('portalToken')}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['portal-message-threads'] });
      setShowNewThread(false);
      setNewThreadSubject('');
      setNewMessage('');
      if (data.data?.threadId) {
        setSelectedThreadId(data.data.threadId);
      }
    },
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData?.messages]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    }
  };

  const filteredThreads = threadsData?.threads?.filter(
    (thread) =>
      thread.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const CATEGORIES = [
    { value: 'general', label: 'Question générale' },
    { value: 'appointment', label: 'Rendez-vous' },
    { value: 'medication', label: 'Médicaments' },
    { value: 'results', label: 'Résultats' },
    { value: 'administrative', label: 'Administratif' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/portal" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <ChevronLeft className="h-5 w-5" />
              </a>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h1>
                <p className="text-sm text-gray-500">Communiquez avec votre équipe médicale</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowNewThread(true);
                setSelectedThreadId(null);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Nouveau message</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-6xl mx-auto w-full">
        {/* Thread List */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Threads */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingThreads ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : filteredThreads && filteredThreads.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredThreads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => {
                      setSelectedThreadId(thread.id);
                      setShowNewThread(false);
                    }}
                    className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      selectedThreadId === thread.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                        <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {thread.subject}
                          </p>
                          {thread.unreadCount > 0 && (
                            <span className="ml-2 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                              {thread.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">{thread.lastMessage}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatTime(thread.lastMessageAt)}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <Inbox className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500">Aucune conversation</p>
              </div>
            )}
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
          {showNewThread ? (
            /* New Thread Form */
            <div className="flex-1 p-6">
              <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Nouveau message
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sujet
                    </label>
                    <input
                      type="text"
                      value={newThreadSubject}
                      onChange={(e) => setNewThreadSubject(e.target.value)}
                      placeholder="Objet de votre message..."
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Catégorie
                    </label>
                    <select
                      value={newThreadCategory}
                      onChange={(e) => setNewThreadCategory(e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Message
                    </label>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Écrivez votre message..."
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none"
                      rows={6}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={() => setShowNewThread(false)}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => createThreadMutation.mutate()}
                      disabled={!newThreadSubject || !newMessage || createThreadMutation.isPending}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {createThreadMutation.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-5 w-5" />
                          Envoyer
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : selectedThreadId ? (
            /* Message Thread */
            <>
              {/* Thread Header */}
              <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  {messagesData?.thread?.subject}
                </h2>
                <p className="text-sm text-gray-500">
                  {messagesData?.thread?.participants
                    ?.filter((p) => p.isStaff)
                    .map((p) => `${p.name} (${p.role})`)
                    .join(', ')}
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  </div>
                ) : (
                  messagesData?.messages?.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isFromPatient ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                          message.isFromPatient
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                        }`}
                      >
                        {!message.isFromPatient && (
                          <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                            {message.senderName} - {message.senderRole}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <div
                          className={`flex items-center gap-1 mt-2 text-xs ${
                            message.isFromPatient ? 'text-blue-200' : 'text-gray-400'
                          }`}
                        >
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(message.createdAt)}</span>
                          {message.isFromPatient && message.readAt && (
                            <CheckCheck className="h-3 w-3 ml-1" />
                          )}
                        </div>

                        {/* Attachments */}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-white/20">
                            {message.attachments.map((att) => (
                              <a
                                key={att.id}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm underline"
                              >
                                <Paperclip className="h-3 w-3" />
                                {att.filename}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-end gap-3">
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Écrivez votre message..."
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none"
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (newMessage.trim()) {
                            sendMutation.mutate();
                          }
                        }
                      }}
                    />
                  </div>
                  <button
                    onClick={() => sendMutation.mutate()}
                    disabled={!newMessage.trim() || sendMutation.isPending}
                    className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {sendMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* No Thread Selected */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Sélectionnez une conversation
                </h3>
                <p className="text-gray-500 mb-4">
                  Ou créez un nouveau message pour contacter votre équipe médicale
                </p>
                <button
                  onClick={() => setShowNewThread(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  Nouveau message
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
