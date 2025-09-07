import api from './index';

export const createOrGetConversation = async (participantId) => {
  try {
    const response = await api.post('/conversations/create', {
      participantId
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getConversationMessages = async (conversationId, page = 1, limit = 50) => {
  try {
    const response = await api.get(`/conversations/${conversationId}/messages`, {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserConversations = async () => {
  try {
    const response = await api.get('/conversations');
    return response.data;
  } catch (error) {
    throw error;
  }
};
