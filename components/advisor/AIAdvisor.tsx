// components/advisor/AIAdvisor.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, X, Lightbulb, AlertTriangle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTION_COLORS = [
  'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/40',
  'border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-100 dark:border-teal-700 dark:bg-teal-900/20 dark:text-teal-300 dark:hover:bg-teal-900/40',
  'border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-300 dark:hover:bg-rose-900/40',
  'border-violet-300 bg-violet-50 text-violet-800 hover:bg-violet-100 dark:border-violet-700 dark:bg-violet-900/20 dark:text-violet-300 dark:hover:bg-violet-900/40',
  'border-green-300 bg-green-50 text-green-800 hover:bg-green-100 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/40',
];

interface AIAdvisorProps {
  initialMessage?: string;
}

export default function AIAdvisor({ initialMessage }: AIAdvisorProps) {
  // Load messages from localStorage on mount
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai-advisor-chat');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Convert timestamp strings back to Date objects
          return parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));
        } catch (e) {
          console.error('Error loading saved chat:', e);
        }
      }
    }
    return [];
  });
  
  const [input, setInput] = useState(initialMessage || '');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    "What foods are best for immunity?",
    "How can I support my microbiome?",
    "Tell me about the 5x5x5 system"
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('ai-advisor-chat', JSON.stringify(messages));
    }
  }, [messages]);

  // Only scroll when a new message is added by the assistant or user sends a message
  // Don't auto-scroll on initial load or when viewing history
  const scrollToBottom = (smooth = true) => {
    if (chatContainerRef.current) {
      const scrollOptions: ScrollIntoViewOptions = {
        behavior: smooth ? 'smooth' : 'auto',
        block: 'nearest',
      };
      messagesEndRef.current?.scrollIntoView(scrollOptions);
    }
  };

  useEffect(() => {
    if (initialMessage) {
      handleSendMessage(initialMessage);
    }
  }, [initialMessage]);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation history for context
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          conversationHistory,
        }),
      });

      // Handle limit reached error (403)
      if (response.status === 403) {
        const errorData = await response.json();
        const errorMessage: Message = {
          role: 'assistant',
          content: errorData.message || "You've reached your AI questions limit for this month. Upgrade to Premium for unlimited access.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to get response from AI advisor');
      }

      const { data } = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      // Scroll to bottom after assistant responds
      setTimeout(() => scrollToBottom(), 100);
      
      // Update suggestions
      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    handleSendMessage(suggestion);
  };

  const handleClearChat = () => {
    setMessages([]);
    setSuggestions([
      "What foods are best for immunity?",
      "How can I support my microbiome?",
      "Tell me about the 5x5x5 system"
    ]);
    setShowClearConfirm(false);
    // Clear localStorage
    localStorage.removeItem('ai-advisor-chat');
  };

  const handleClearClick = () => {
    if (messages.length > 0) {
      setShowClearConfirm(true);
    }
  };

  const handleCancelClear = () => {
    setShowClearConfirm(false);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm ring-1 ring-gray-100 dark:ring-gray-700 overflow-hidden">
      {/* Clear Chat Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-6 max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Clear Chat History?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              This will permanently delete all messages in this conversation. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={handleCancelClear}
                className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearChat}
                className="px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
              >
                Clear Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Chat Header ──────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 text-white px-5 py-4 flex items-center justify-between">
        {/* shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent animate-pulse pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {/* pulse ring */}
            <span className="absolute -inset-1 rounded-2xl border border-white/30 animate-ping opacity-60 pointer-events-none" />
          </div>
          <div>
            <h3 className="font-bold text-base leading-tight tracking-tight">AI Nutrient Advisor</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-200 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
              </span>
              <p className="text-xs text-green-100 font-medium">Online · 5x5x5 wellness guide</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <span className="text-xs text-green-200 font-medium">
              {messages.length} msg{messages.length !== 1 ? 's' : ''}
            </span>
          )}
          {messages.length > 0 && (
            <button
              onClick={handleClearClick}
              className="flex items-center gap-1 px-3 py-1.5 bg-white/15 hover:bg-white/25 border border-white/20 rounded-lg text-xs font-medium transition-all"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Medical Disclaimer Banner */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 dark:border-amber-600 p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
              <span className="font-semibold">Medical Disclaimer:</span> This AI advisor provides general nutritional information and should not replace professional medical advice. 
              Always consult with your doctor, nutritionist, or healthcare provider before making significant dietary changes or if you have specific health concerns.
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[400px] max-h-[600px]"
      >
        {messages.length === 0 && (
          <div className="text-center py-10 px-4">
            {/* Concentric ping rings */}
            <div className="relative flex items-center justify-center w-28 h-28 mx-auto mb-6">
              <span className="absolute inset-0 rounded-full bg-green-300/20 dark:bg-green-500/10 animate-ping" />
              <span className="absolute inset-4 rounded-full bg-teal-300/25 dark:bg-teal-500/15 animate-ping" style={{ animationDelay: '400ms' }} />
              <span className="absolute inset-8 rounded-full bg-emerald-300/30 dark:bg-emerald-500/20 animate-ping" style={{ animationDelay: '800ms' }} />
              <div className="relative w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl shadow-green-500/30">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
            <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
              Ready to guide you 🌿
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[260px] mx-auto leading-relaxed">
              Ask anything about the 5×5×5 system, your defense systems, or nutrition goals.
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              {['🛡️ Immunity', '🦠 Gut', '🧬 DNA'].map((label) => (
                <span key={label} className="text-xs bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full font-medium">{label}</span>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-gradient-to-br from-green-500 to-teal-600 text-white rounded-br-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-sm'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <p
                className={`text-xs mt-1.5 ${
                message.role === 'user' ? 'text-green-100' : 'text-gray-400 dark:text-gray-500'
              }`}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-700 rounded-2xl rounded-bl-sm px-5 py-3.5 shadow-sm ring-1 ring-gray-100 dark:ring-gray-600">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex items-center gap-1.5">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="w-2 h-2 rounded-full bg-teal-500 animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center gap-1.5 mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Suggestions</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={isLoading}
                className={`text-xs border px-3 py-1.5 rounded-full font-medium transition-all hover:shadow-sm disabled:opacity-50 ${SUGGESTION_COLORS[index % SUGGESTION_COLORS.length]}`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-700">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about nutrition…"
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none disabled:bg-gray-50 dark:disabled:bg-gray-700 dark:bg-gray-700 dark:text-white transition-all"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0 p-2.5 bg-gradient-to-br from-green-500 to-teal-600 text-white rounded-xl shadow shadow-green-500/20 hover:shadow-md hover:from-green-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}