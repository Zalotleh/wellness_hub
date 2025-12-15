// components/advisor/AIAdvisor.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Loader2, Sparkles, X, Lightbulb, AlertTriangle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

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
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      {/* Clear Chat Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md mx-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Clear Chat History?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This will permanently delete all messages in this conversation. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelClear}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearChat}
                className="px-4 py-2 bg-red-500 dark:bg-red-600 text-white rounded-lg hover:bg-red-600 dark:hover:bg-red-700 transition-colors"
              >
                Clear Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg">AI Nutrient Advisor</h3>
              <p className="text-sm text-purple-100">Your 5x5x5 wellness guide</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClearClick}
              className="flex items-center space-x-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              title="Clear chat history"
            >
              <X className="w-4 h-4" />
              <span className="text-sm font-medium">Clear Chat</span>
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
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-purple-500 dark:text-purple-400" />
            </div>
            <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
              Welcome to AI Nutrient Advisor!
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Ask me anything about the 5x5x5 system, nutrition, or health goals.
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Try one of the suggestions below to get started
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <p
                className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-purple-100' : 'text-gray-500 dark:text-gray-400'
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
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-500 dark:text-purple-400" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center space-x-2 mb-2">
            <Lightbulb className="w-4 h-4 text-purple-500 dark:text-purple-400" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Suggestions:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={isLoading}
                className="text-xs bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-400 px-3 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about nutrition..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none disabled:bg-gray-100 dark:disabled:bg-gray-700 dark:bg-gray-700 dark:text-white"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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