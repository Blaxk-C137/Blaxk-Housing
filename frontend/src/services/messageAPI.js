// frontend/src/services/messageAPI.js

import api from './api';

const messageAPI = {
  // ✅ Fixed: Added leading slashes
  getThreads: async () => {
    try {
      const response = await api.get('/messages/threads/');
      return response.data;
    } catch (error) {
      console.error('Error fetching threads:', error);
      throw error;
    }
  },

  getThreadDetail: async (threadId) => {
    try {
      const response = await api.get(`/messages/threads/${threadId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching thread ${threadId}:`, error);
      throw error;
    }
  },

  createOrGetThread: async (listingId) => {
    try {
      const response = await api.post('/messages/threads/create_or_get_thread/', {
        listing_id: listingId,
      });
      return response.data;
    } catch (error) {
      console.error(`Error creating/getting thread for listing ${listingId}:`, error);
      throw error;
    }
  },

  sendMessage: async (threadId, content) => {
    try {
      const response = await api.post(
        `/messages/threads/${threadId}/send_message/`,
        { content }
      );
      return response.data;
    } catch (error) {
      console.error(`Error sending message in thread ${threadId}:`, error);
      throw error;
    }
  },

  markThreadAsRead: async (threadId) => {
    try {
      const response = await api.post(`/messages/threads/${threadId}/mark_as_read/`);
      return response.data;
    } catch (error) {
      console.error(`Error marking thread ${threadId} as read:`, error);
      throw error;
    }
  },
};

export default messageAPI;