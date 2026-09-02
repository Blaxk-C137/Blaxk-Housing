// frontend/src/hooks/useMessaging.js

import { useState, useCallback } from 'react';
import messageAPI from '../services/messageAPI';

export const useMessaging = () => {
  const [threads, setThreads] = useState([]);
  const [currentThread, setCurrentThread] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchThreads = useCallback(async () => {
    try {
      const data = await messageAPI.getThreads();
      // Normalize API response: support both array and paginated { results: [] }
      const items = Array.isArray(data) ? data : (data?.results || []);
      setThreads(items);
      setError(null);
    } catch (err) {
      // Silent fail for polling
    }
  }, []);

  const fetchThreadDetail = useCallback(async (threadId) => {
    try {
      const data = await messageAPI.getThreadDetail(threadId);
      setCurrentThread(data);
      setError(null);
      return data;
    } catch (err) {
      // Silent fail for polling
    }
  }, []);

  const createOrGetThread = useCallback(async (listingId) => {
    setLoading(true);
    try {
      const data = await messageAPI.createOrGetThread(listingId);
      setCurrentThread(data);
      await fetchThreads();
      setError(null);
      return data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to create conversation';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchThreads]);

  const sendMessage = useCallback(async (threadId, content) => {
    if (!content?.trim()) return;
    try {
      const newMessage = await messageAPI.sendMessage(threadId, content);
      setCurrentThread(prev => {
        if (!prev || prev.id !== threadId) return prev;
        return {
          ...prev,
          messages: [...(prev.messages || []), newMessage],
          last_message_preview: content.substring(0, 100),
        };
      });
      setThreads(prev => prev.map(t =>
        t.id === threadId
          ? { ...t, last_message_preview: content.substring(0, 100), updated_at: new Date().toISOString() }
          : t
      ));
      setError(null);
      return newMessage;
    } catch (err) {
      setError('Failed to send message');
      throw err;
    }
  }, []);

  const markAsRead = useCallback(async (threadId) => {
    try {
      const data = await messageAPI.markThreadAsRead(threadId);
      setThreads(prev => prev.map(t => t.id === threadId ? { ...t, ...data } : t));
      if (currentThread?.id === threadId) {
        setCurrentThread(prev => ({ ...prev, ...data }));
      }
    } catch {}
  }, [currentThread]);

  return {
    threads,
    currentThread,
    loading,
    error,
    fetchThreads,
    fetchThreadDetail,
    createOrGetThread,
    sendMessage,
    markAsRead,
  };
};

export default useMessaging;