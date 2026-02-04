'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { startChat, sendChatMessage, summarizeChat, ChatMessage } from '@/lib/api';

interface DisplayMessage {
  id: string;
  role: 'bot' | 'user';
  content: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [resumeText, setResumeText] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [chatCompleted, setChatCompleted] = useState(false);
  const [canContinue, setCanContinue] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Initialize chat - fetch resume + get Carey's opening message
  useEffect(() => {
    const initializeChat = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        const result = await startChat(session.access_token, session.user.id);

        setResumeText(result.resumeText);
        setConversationHistory([{ role: 'assistant', content: result.message }]);
        setMessages([{
          id: '1',
          role: 'bot',
          content: result.message,
        }]);
        setQuestionCount(1);
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing chat:', err);
        setError('Failed to start the chat. Please try refreshing the page.');
        setIsLoading(false);
      }
    };

    initializeChat();
  }, [router]);

  const pendingMessageRef = useRef<{ text: string; history: ChatMessage[] } | null>(null);

  const sendWithRetry = async (history: ChatMessage[], retries = 2): Promise<{ message: string }> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await sendChatMessage(history, resumeText);
      } catch (err) {
        if (attempt === retries) throw err;
        // Wait before retrying (500ms, then 1000ms)
        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt)));
      }
    }
    throw new Error('Failed to get a response');
  };

  const handleSendMessage = async (retryPending = false) => {
    let userText: string;
    let updatedHistory: ChatMessage[];

    if (retryPending && pendingMessageRef.current) {
      // Retry the previously failed message
      userText = pendingMessageRef.current.text;
      updatedHistory = pendingMessageRef.current.history;
    } else {
      if (!inputValue.trim() || isTyping || chatCompleted) return;
      userText = inputValue.trim();
      updatedHistory = [
        ...conversationHistory,
        { role: 'user', content: userText },
      ];

      const userDisplayMsg: DisplayMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: userText,
      };
      setMessages(prev => [...prev, userDisplayMsg]);
      setInputValue('');
    }

    pendingMessageRef.current = { text: userText, history: updatedHistory };
    setIsTyping(true);
    setError(null);

    try {
      const result = await sendWithRetry(updatedHistory);

      // Clear pending message on success
      pendingMessageRef.current = null;

      const botDisplayMsg: DisplayMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: result.message,
      };

      const fullHistory: ChatMessage[] = [
        ...updatedHistory,
        { role: 'assistant', content: result.message },
      ];

      setConversationHistory(fullHistory);
      setMessages(prev => [...prev, botDisplayMsg]);
      setQuestionCount(prev => prev + 1);

      // Check if Carey has wrapped up the conversation
      // (look for common closing patterns in the response)
      const lowerMsg = result.message.toLowerCase();
      const closingIndicators = [
        'anything else you want me to know',
        'anything else you\'d like me to know',
        'anything else you\'d like to share',
        'anything else you want to share',
        'is there anything else',
        'thank you for sharing all of this',
        'that covers everything',
        'great talking with you',
        'best of luck',
        'good luck with your',
        'wishing you the best',
      ];
      if (questionCount >= 6 && closingIndicators.some(phrase => lowerMsg.includes(phrase))) {
        setCanContinue(true);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to get a response. Click "Retry" to try again.');
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const [isSummarizing, setIsSummarizing] = useState(false);

  const handleContinue = async () => {
    // Store chat conversation in session storage for downstream use
    const signupData = sessionStorage.getItem('signupData');
    const existingData = signupData ? JSON.parse(signupData) : {};

    sessionStorage.setItem('signupData', JSON.stringify({
      ...existingData,
      chatTranscript: conversationHistory,
      chatResponses: conversationHistory
        .filter(m => m.role === 'user')
        .map(m => m.content),
    }));

    // Generate and store summary if the user had a conversation (not skipped)
    if (conversationHistory.length > 1) {
      try {
        setIsSummarizing(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await summarizeChat(conversationHistory, session.access_token, session.user.id);
        }
      } catch (err) {
        console.error('Error generating summary:', err);
        // Don't block navigation if summary fails
      } finally {
        setIsSummarizing(false);
      }
    }

    router.push('/signup/preferences');
  };

  const totalQuestions = 8; // approximate middle of 6-10 range
  const progress = Math.min((questionCount / totalQuestions) * 100, 100);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">Reviewing your resume...</p>
          <p className="mt-1 text-sm text-slate-400">Setting up your interview with Carey</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-teal-50 flex flex-col">
      {/* Header */}
      <div className="px-4 py-6 bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 shadow-lg">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </Link>
            <div className="text-center flex-1">
              <h1 className="text-xl font-bold text-slate-800">Chat with Carey</h1>
              <p className="text-sm text-slate-600">Your AI Career Coach</p>
            </div>
            <div className="w-10"></div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-teal-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-slate-500 mt-2 text-center">
            {chatCompleted ? 'Interview complete!' : 'Onboarding interview in progress'}
          </p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-sky-500 to-teal-500 text-white rounded-br-md'
                    : 'bg-white shadow-md border border-slate-100 text-slate-700 rounded-bl-md'
                }`}
              >
                {message.role === 'bot' && (
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-slate-500">Carey</span>
                  </div>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white shadow-md border border-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error message with retry */}
          {error && (
            <div className="flex justify-center">
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-600 flex items-center gap-3">
                <span>{error}</span>
                {pendingMessageRef.current && (
                  <button
                    onClick={() => handleSendMessage(true)}
                    disabled={isTyping}
                    className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-md font-medium transition disabled:opacity-50"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          {chatCompleted ? (
            <div className="flex gap-4">
              <Link
                href="/signup/questionnaire"
                className="flex-1 px-6 py-3 rounded-lg border-2 border-slate-300 text-slate-700 font-semibold text-center hover:bg-slate-50 transition"
              >
                Back
              </Link>
              <button
                onClick={handleContinue}
                disabled={isSummarizing}
                className="flex-1 bg-gradient-to-r from-sky-500 to-teal-500 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSummarizing ? 'Saving...' : 'Continue'}
              </button>
            </div>
          ) : (
            <>
              {canContinue && (
                <button
                  onClick={handleContinue}
                  disabled={isSummarizing}
                  className="w-full mb-3 bg-gradient-to-r from-sky-500 to-teal-500 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSummarizing ? 'Saving your conversation...' : "I\u0027m done \u2014 Continue to next step"}
                </button>
              )}
              <div className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={canContinue ? "Ask Carey anything else, or continue above..." : "Type your response..."}
                  disabled={isTyping}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition disabled:bg-slate-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isTyping}
                  className="px-6 py-3 bg-gradient-to-r from-sky-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </>
          )}

          {!chatCompleted && !canContinue && (
            <div className="mt-3 flex justify-between items-center">
              <Link
                href="/signup/questionnaire"
                className="text-sm text-slate-500 hover:text-slate-700 transition"
              >
                &larr; Back to questionnaire
              </Link>
              <button
                onClick={() => {
                  setChatCompleted(true);
                  const skipMsg: DisplayMessage = {
                    id: Date.now().toString(),
                    role: 'bot',
                    content: "No problem! You can always come back to chat later. Click 'Continue' to proceed with your profile setup.",
                  };
                  setMessages(prev => [...prev, skipMsg]);
                }}
                className="text-sm text-slate-500 hover:text-slate-700 transition"
              >
                Skip chat &rarr;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
