'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Trash2, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  _count: { messages: number };
}

export default function AiAssistantPage() {
  const queryClient = useQueryClient();
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations } = useQuery<Conversation[]>({
    queryKey: ['ai-conversations'],
    queryFn: () => aiApi.getConversations() as Promise<Conversation[]>,
  });

  const chatMutation = useMutation({
    mutationFn: (msg: string) => aiApi.chat({ message: msg, conversationId }) as Promise<{ conversationId: string; message: string }>,
    onSuccess: (data) => {
      setConversationId(data.conversationId);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => aiApi.deleteConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
      if (conversationId) { setConversationId(undefined); setMessages([]); }
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;
    const msg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    chatMutation.mutate(msg);
  };

  const loadConversation = async (id: string) => {
    const data = await aiApi.getConversation(id) as { id: string; messages: Message[] };
    setConversationId(data.id);
    setMessages(data.messages);
  };

  const newChat = () => { setConversationId(undefined); setMessages([]); };

  const suggestions = [
    'Qual foi o faturamento deste mês?',
    'Quais produtos estão com estoque baixo?',
    'Mostre os 5 clientes mais ativos',
    'Analise meu fluxo de caixa',
  ];

  return (
    <div className="h-full flex gap-4" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Conversations sidebar */}
      <div className="w-64 flex-shrink-0 bg-white rounded-xl border border-gray-200 flex flex-col hidden lg:flex">
        <div className="p-4 border-b border-gray-100">
          <button
            onClick={newChat}
            className="flex items-center gap-2 w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            <Plus size={16} /> Nova conversa
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations?.map((c) => (
            <div key={c.id} className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 ${conversationId === c.id ? 'bg-blue-50' : ''}`}>
              <div className="flex-1 min-w-0" onClick={() => loadConversation(c.id)}>
                <p className="text-sm font-medium text-gray-900 truncate">{c.title}</p>
                <p className="text-xs text-gray-400">{formatDate(c.updatedAt)} · {c._count.messages} msgs</p>
              </div>
              <button
                onClick={() => deleteMutation.mutate(c.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">Assistente IA</h1>
            <p className="text-xs text-gray-500">Powered by Claude · Análises em tempo real</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="bg-blue-50 p-4 rounded-2xl">
                <Bot size={40} className="text-blue-600" />
              </div>
              <p className="text-gray-500 text-center max-w-sm">
                Olá! Sou seu assistente de negócios. Posso ajudar com análises, relatórios e recomendações baseadas nos dados da sua empresa.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setInput(s); }}
                    className="text-left px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-blue-50 hover:border-blue-200 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-200'}`}>
                {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-gray-600" />}
              </div>
              <div className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-900 rounded-tl-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {chatMutation.isPending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <Bot size={16} className="text-gray-600" />
              </div>
              <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm">
                <Loader2 size={16} className="animate-spin text-gray-500" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-100">
          <div className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Pergunte sobre seu negócio..."
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              disabled={chatMutation.isPending}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || chatMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-2.5 rounded-xl transition"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
