// frontend/src/pages/MessagesPage/MessagesPage.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMessaging } from '../../hooks/useMessaging';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton from '../../components/ui/Skeleton';
import {
  Send, ArrowLeft, Loader2, AlertCircle, Search,
  MessageCircle, CheckCheck, Home, RefreshCw, MapPin
} from 'lucide-react';
import { motion } from 'framer-motion';

const MessagesPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const {
    threads,
    currentThread,
    loading,
    error,
    fetchThreads,
    fetchThreadDetail,
    sendMessage,
  } = useMessaging();

  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [messageContent, setMessageContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sendError, setSendError] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  // Set when the user sends a message or switches threads so we always scroll
  // to the bottom once, instead of only when already near the bottom
  const forceScrollRef = useRef(false);
  const inputRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const threadPollIntervalRef = useRef(null);

  // Get thread ID from URL params
  const urlThreadId = searchParams.get('thread');

  // Determine user role
  const isLandlord = currentUser?.role === 'landlord';

  // ===== SMART POLLING =====

  // Poll for thread list updates
  const startThreadListPolling = useCallback(() => {
    // Clear existing interval
    if (threadPollIntervalRef.current) {
      clearInterval(threadPollIntervalRef.current);
    }

    // Poll every 30 seconds for thread list
    threadPollIntervalRef.current = setInterval(async () => {
      if (document.visibilityState === 'visible') {
        await fetchThreads();
      }
    }, 30000);
  }, [fetchThreads]);

  // Poll for current chat messages
  const startMessagePolling = useCallback((threadId) => {
    // Clear existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    if (!threadId) return;

    // Poll every 5 seconds for active chat
    pollIntervalRef.current = setInterval(async () => {
      if (document.visibilityState === 'visible' && selectedThreadId === threadId) {
        await fetchThreadDetail(threadId);
      }
    }, 5000);
  }, [fetchThreadDetail, selectedThreadId]);

  // Stop all polling
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (threadPollIntervalRef.current) {
      clearInterval(threadPollIntervalRef.current);
      threadPollIntervalRef.current = null;
    }
  }, []);

  // Visibility change handler
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchThreads();
        if (selectedThreadId) {
          fetchThreadDetail(selectedThreadId);
          startMessagePolling(selectedThreadId);
        }
        startThreadListPolling();
      } else {
        stopPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedThreadId, fetchThreads, fetchThreadDetail, startMessagePolling, startThreadListPolling, stopPolling]);

  // Initial fetch and start polling
  useEffect(() => {
    fetchThreads();
    startThreadListPolling();

    return () => {
      stopPolling();
    };
  }, [fetchThreads, startThreadListPolling, stopPolling]);

  // Auto-select thread from URL param
  useEffect(() => {
    if (urlThreadId && threads.length > 0) {
      const threadId = parseInt(urlThreadId);
      const thread = threads.find(t => t.id === threadId);
      if (thread) {
        handleSelectThread(threadId);
      }
    }
  }, [urlThreadId, threads]);

  // Start message polling when thread is selected
  useEffect(() => {
    if (selectedThreadId) {
      startMessagePolling(selectedThreadId);
    }
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [selectedThreadId, startMessagePolling]);

  // Scroll to bottom when messages update — but only if the user is already
  // near the bottom, so 5s poll refreshes don't yank someone reading history
  // up the thread. forceScrollRef is set on send / thread switch.
  useEffect(() => {
    if (!messagesEndRef.current) return;
    const container = messagesContainerRef.current;
    if (container && !forceScrollRef.current) {
      const nearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 80;
      if (!nearBottom) return;
    }
    forceScrollRef.current = false;
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [currentThread?.messages]);

  // Focus input when thread is selected
  useEffect(() => {
    if (currentThread && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [currentThread]);

  // ===== HANDLERS =====

  const handleSelectThread = useCallback(async (threadId) => {
    setSelectedThreadId(threadId);
    setShowMobileChat(true);
    forceScrollRef.current = true;
    await fetchThreadDetail(threadId);
  }, [fetchThreadDetail]);

  const handleBackToList = () => {
    setShowMobileChat(false);
    setSelectedThreadId(null);
    navigate('/messages', { replace: true });
  };

  const handleGoHome = () => {
    navigate(isLandlord ? '/landlord-home' : '/student-home');
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchThreads();
    if (selectedThreadId) {
      await fetchThreadDetail(selectedThreadId);
    }
    setIsRefreshing(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageContent.trim() || !selectedThreadId) return;

    setSendingMessage(true);
    setSendError('');
    try {
      await sendMessage(selectedThreadId, messageContent);
      setMessageContent('');
      forceScrollRef.current = true;
      // Immediately fetch to show the new message
      await fetchThreadDetail(selectedThreadId);
    } catch (err) {
      console.error('Failed to send:', err);
      setSendError('Message failed to send. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  // ===== HELPERS =====

  const filteredThreads = threads.filter(thread => {
    const searchLower = searchQuery.toLowerCase();
    return (
      thread.listing?.title?.toLowerCase().includes(searchLower) ||
      thread.student?.username?.toLowerCase().includes(searchLower) ||
      thread.student?.first_name?.toLowerCase().includes(searchLower) ||
      thread.landlord?.username?.toLowerCase().includes(searchLower) ||
      thread.landlord?.first_name?.toLowerCase().includes(searchLower)
    );
  });

  const getOtherPerson = (thread) => {
    if (!thread) return null;
    if (currentUser?.id === thread.student?.id) {
      return { ...thread.landlord, role: 'Landlord' };
    }
    return { ...thread.student, role: 'Student' };
  };

  const getUnreadCount = (thread) => {
    if (currentUser?.id === thread.student?.id) {
      return thread.student_unread_count || 0;
    }
    return thread.landlord_unread_count || 0;
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // True while the detail fetch for a newly selected thread is in flight
  // (the previous thread's messages would otherwise flash in the chat pane)
  const isLoadingThread = Boolean(selectedThreadId) && currentThread?.id !== selectedThreadId;

  // Message status component
  const MessageStatus = ({ message, isSender }) => {
    if (!isSender) return null;

    return (
      <CheckCheck
        className={`w-4 h-4 ${message.is_read ? 'text-cream/90' : 'text-cream/50'}`}
      />
    );
  };

  // ===== LOADING STATE =====
  if (loading && !threads.length) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-cream md:grid md:grid-cols-[320px_1fr]">
        <div className="bg-white border-r border-line p-4 space-y-3">
          <Skeleton className="h-10 w-full rounded-full" />
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-card" />
          ))}
        </div>
        <div className="hidden md:flex items-center justify-center">
          <Skeleton className="h-40 w-64 rounded-card" />
        </div>
      </div>
    );
  }

  // ===== RENDER =====
  return (
    <div className="min-h-[calc(100vh-3.5rem)] md:h-[calc(100vh-3.5rem)] md:overflow-hidden bg-cream md:grid md:grid-cols-[320px_1fr]">
      {/* Threads Sidebar */}
      <div className={`bg-white border-r border-line flex flex-col ${showMobileChat ? 'hidden md:flex' : 'flex'} min-h-[calc(100vh-3.5rem)] md:min-h-0`}>
        {/* Header */}
        <div className="p-4 border-b border-line">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-extrabold text-ink">Messages</h1>
            <div className="flex items-center gap-1">
              <button
                onClick={handleGoHome}
                aria-label="Go home"
                className="w-9 h-9 rounded-full flex items-center justify-center text-stone hover:bg-sand hover:text-ink transition-colors"
              >
                <Home className="w-5 h-5" />
              </button>
              <button
                onClick={handleManualRefresh}
                aria-label="Refresh conversations"
                disabled={isRefreshing}
                className="w-9 h-9 rounded-full flex items-center justify-center text-stone hover:bg-sand hover:text-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone pointer-events-none" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-line bg-cream py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-stone/60 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand focus:bg-white transition-colors"
            />
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-3 p-3 bg-brand/10 border border-brand/20 rounded-card flex items-center gap-2 text-brand-dark text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto">
          {filteredThreads.length > 0 ? (
            filteredThreads.map((thread) => {
              const isSelected = thread.id === selectedThreadId;
              const otherPerson = getOtherPerson(thread);
              const unreadCount = getUnreadCount(thread);
              const otherName = otherPerson?.first_name || otherPerson?.username || 'User';

              return (
                <motion.button
                  key={thread.id}
                  onClick={() => handleSelectThread(thread.id)}
                  aria-current={isSelected ? 'true' : undefined}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-line/60 ${
                    isSelected
                      ? 'bg-brand-tint/50'
                      : unreadCount > 0
                        ? 'bg-brand-tint/30 hover:bg-brand-tint/50'
                        : 'bg-white hover:bg-sand/60'
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  <Avatar name={otherName} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`truncate text-sm ${unreadCount > 0 ? 'font-bold text-ink' : 'font-semibold text-ink'}`}>
                        {otherName}
                      </span>
                      <span className="text-xs text-stone shrink-0">
                        {formatTime(thread.updated_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={`text-xs truncate ${unreadCount > 0 ? 'text-ink font-medium' : 'text-stone'}`}>
                        {thread.last_message_preview || 'Start a conversation...'}
                      </p>
                      {unreadCount > 0 && (
                        <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    {thread.listing?.title && (
                      <div className="flex items-center gap-1 text-xs text-stone/80 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{thread.listing.title}</span>
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })
          ) : searchQuery ? (
            <EmptyState
              className="py-16 px-6"
              icon={MessageCircle}
              title={`No conversations match "${searchQuery}"`}
              body="Try a different name or property title."
              action={
                <Button variant="secondary" onClick={() => setSearchQuery('')}>
                  Clear search
                </Button>
              }
            />
          ) : (
            <EmptyState
              className="py-16 px-6"
              icon={MessageCircle}
              title="No conversations yet"
              body={
                isLandlord
                  ? "Students will message you about your listings"
                  : "Browse listings and message landlords to start conversations"
              }
              action={
                <Button onClick={handleGoHome}>
                  {isLandlord ? 'View My Listings' : 'Browse Listings'}
                </Button>
              }
            />
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${showMobileChat ? 'flex' : 'hidden md:flex'} flex-col min-h-[calc(100vh-3.5rem)] md:min-h-0`}>
        {isLoadingThread ? (
          <div className="flex-1 flex flex-col">
            <div className="bg-white border-b border-line px-4 py-4">
              <Skeleton className="h-5 w-44" />
            </div>
            <div className="flex-1 bg-cream page-pad py-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`flex ${i % 2 === 1 ? 'justify-end' : 'justify-start'}`}>
                  <Skeleton className={`h-12 rounded-2xl ${i % 2 === 1 ? 'w-44' : 'w-56'}`} />
                </div>
              ))}
            </div>
          </div>
        ) : currentThread ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-line px-4 py-3 flex items-center gap-3">
              <button
                onClick={handleBackToList}
                aria-label="Back to conversations"
                className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-stone hover:bg-sand hover:text-ink transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <Avatar name={getOtherPerson(currentThread)?.first_name || getOtherPerson(currentThread)?.username || 'User'} size="md" />

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-base font-bold text-ink truncate">
                    {getOtherPerson(currentThread)?.first_name ||
                     getOtherPerson(currentThread)?.username || 'User'}
                  </h2>
                  <span className="text-xs text-stone shrink-0">
                    {getOtherPerson(currentThread)?.role}
                  </span>
                </div>
                {currentThread.listing && (
                  <p className="text-xs text-stone truncate flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {currentThread.listing.title}
                  </p>
                )}
              </div>

              <button
                onClick={handleManualRefresh}
                aria-label="Refresh messages"
                disabled={isRefreshing}
                className="w-9 h-9 rounded-full flex items-center justify-center text-stone hover:bg-sand hover:text-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Listing Card (optional context) */}
            {currentThread.listing && (
              <div className="bg-sand border-b border-line px-4 py-2.5 flex items-center gap-3">
                <img
                  src={currentThread.listing.image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200'}
                  alt=""
                  className="w-10 h-10 rounded-xl object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink truncate">{currentThread.listing.title}</span>
                  <span className="block text-xs text-stone">
                    ₦{currentThread.listing.price?.toLocaleString()}/mo
                  </span>
                </div>
                <button
                  onClick={() => navigate(`/property/${currentThread.listing.id}`)}
                  className="text-brand text-sm font-semibold hover:underline shrink-0"
                >
                  View
                </button>
              </div>
            )}

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto bg-cream page-pad py-4 space-y-2">
              {currentThread.messages?.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <span className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-brand-tint text-brand">
                      <MessageCircle className="w-8 h-8" />
                    </span>
                    <p className="font-semibold text-ink">No messages yet</p>
                    <span className="text-sm text-stone">
                      {isLandlord
                        ? "This student is interested in your property. Say hello!"
                        : "Ask the landlord about this property!"}
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  {currentThread.messages?.map((msg, index) => {
                    const isSender = msg.sender?.id === currentUser?.id;
                    const showDate = index === 0 ||
                      new Date(msg.created_at).toDateString() !==
                      new Date(currentThread.messages[index - 1]?.created_at).toDateString();

                    return (
                      <React.Fragment key={msg.id}>
                        {showDate && (
                          <div className="flex justify-center my-3">
                            <span className="text-xs font-medium text-stone bg-white border border-line rounded-full px-3 py-1">
                              {new Date(msg.created_at).toLocaleDateString([], {
                                weekday: 'long',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        )}
                        <motion.div
                          className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div
                            className={`max-w-[80%] px-4 py-2.5 ${
                              isSender
                                ? 'bg-brand text-white rounded-2xl rounded-tr-sm'
                                : 'bg-sand text-ink rounded-2xl rounded-tl-sm'
                            }`}
                          >
                            <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                            <div className={`flex items-center justify-end gap-1 mt-1 ${isSender ? 'text-cream/80' : 'text-stone'}`}>
                              <span className="text-[11px]">
                                {new Date(msg.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              <MessageStatus message={msg} isSender={isSender} />
                            </div>
                          </div>
                        </motion.div>
                      </React.Fragment>
                    );
                  })}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="bg-white border-t border-line px-4 py-3 flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={messageContent}
                onChange={(e) => {
                  setMessageContent(e.target.value);
                  if (sendError) setSendError('');
                }}
                placeholder={isLandlord ? "Reply to student..." : "Message landlord..."}
                disabled={sendingMessage}
                className="flex-1 rounded-full border border-line bg-cream px-4 py-3 text-sm text-ink placeholder:text-stone/60 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand focus:bg-white transition-colors"
              />
              <motion.button
                type="submit"
                disabled={!messageContent.trim() || sendingMessage}
                whileTap={{ scale: 0.95 }}
                aria-label="Send message"
                className="w-11 h-11 rounded-full bg-brand text-white flex items-center justify-center shadow-warm hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                {sendingMessage ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </motion.button>
            </form>
            {sendError && (
              <p className="bg-white px-4 pb-2.5 text-xs text-red-700 flex items-center gap-1.5" role="alert">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {sendError}
              </p>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              className="px-6"
              icon={MessageCircle}
              title="Select a conversation"
              body={
                isLandlord
                  ? "Choose a conversation to respond to student inquiries"
                  : "Choose a conversation to continue chatting with landlords"
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
