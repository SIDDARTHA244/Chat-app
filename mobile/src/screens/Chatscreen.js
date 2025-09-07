import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api';
import { getCurrentUser } from '../api/auth';
import socketService from '../utils/socket';
import MessageItem from '../components/MessageItem';
import TypingIndicator from '../components/TypingIndicator';

const ChatScreen = ({ route, navigation }) => {
  const { conversationId, recipientId, recipientName, recipientAvatar } = route.params;
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isRecipientOnline, setIsRecipientOnline] = useState(false);
  
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    initializeChat();
    setupSocketListeners();
    
    return () => {
      cleanupSocketListeners();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const initializeChat = async () => {
    try {
      const [messagesResponse, userData] = await Promise.all([
        api.get(`/conversations/${conversationId}/messages`),
        getCurrentUser()
      ]);
      
      setMessages(messagesResponse.data.messages || []);
      setCurrentUser(userData);
      
      // Join conversation room
      socketService.joinConversation(conversationId);
      
    } catch (error) {
      console.error('Initialize chat error:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    socketService.on('message:new', handleNewMessage);
    socketService.on('message:sent', handleMessageSent);
    socketService.on('message:error', handleMessageError);
    socketService.on('typing:start', handleTypingStart);
    socketService.on('typing:stop', handleTypingStop);
    socketService.on('message:read', handleMessageRead);
    socketService.on('user:online', handleUserOnline);
    socketService.on('user:offline', handleUserOffline);
  };

  const cleanupSocketListeners = () => {
    socketService.off('message:new', handleNewMessage);
    socketService.off('message:sent', handleMessageSent);
    socketService.off('message:error', handleMessageError);
    socketService.off('typing:start', handleTypingStart);
    socketService.off('typing:stop', handleTypingStop);
    socketService.off('message:read', handleMessageRead);
    socketService.off('user:online', handleUserOnline);
    socketService.off('user:offline', handleUserOffline);
  };

  const handleNewMessage = (message) => {
    setMessages(prev => [...prev, message]);
    scrollToBottom();
    
    // Mark as read if conversation is active
    markMessagesAsRead([message._id]);
  };

  const handleMessageSent = (data) => {
    // Update temporary message with server data
    setMessages(prev => prev.map(msg => 
      msg.tempId === data.tempId ? data.message : msg
    ));
    setSending(false);
  };

  const handleMessageError = (error) => {
    console.error('Message send error:', error);
    Alert.alert('Error', 'Failed to send message');
    setSending(false);
  };

  const handleTypingStart = (data) => {
    if (data.userId !== currentUser?._id) {
      setTypingUsers(prev => new Set([...prev, data.userId]));
    }
  };

  const handleTypingStop = (data) => {
    if (data.userId !== currentUser?._id) {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    }
  };

  const handleMessageRead = (data) => {
    setMessages(prev => prev.map(msg => 
      data.messageIds.includes(msg._id) 
        ? { ...msg, readBy: [...(msg.readBy || []), { user: data.readBy, readAt: new Date() }] }
        : msg
    ));
  };

  const handleUserOnline = (userId) => {
    if (userId === recipientId) {
      setIsRecipientOnline(true);
    }
  };

  const handleUserOffline = (userId) => {
    if (userId === recipientId) {
      setIsRecipientOnline(false);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || sending) return;

    const tempId = Date.now().toString();
    const messageData = {
      tempId,
      text: newMessage.trim(),
      to: recipientId,
      conversationId,
      sender: currentUser?._id,
      createdAt: new Date(),
      messageType: 'text'
    };

    // Add temporary message to UI
    setMessages(prev => [...prev, messageData]);
    setSending(true);
    
    // Send via socket
    socketService.sendMessage(messageData);
    
    setNewMessage('');
    stopTyping();
    scrollToBottom();
  };

  const startTyping = () => {
    socketService.startTyping(conversationId);
    
    // Auto-stop typing after 3 seconds
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  };

  const stopTyping = () => {
    socketService.stopTyping(conversationId);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const markMessagesAsRead = (messageIds) => {
    socketService.markAsRead(messageIds, conversationId);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessage = ({ item, index }) => (
    <MessageItem
      message={item}
      isCurrentUser={item.sender === currentUser?._id}
      onLongPress={(message) => {
        // Handle message long press (copy, delete, etc.)
        Alert.alert(
          'Message Options',
          'What would you like to do?',
          [
            { text: 'Copy', onPress: () => console.log('Copy message') },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      }}
    />
  );

  const renderTypingIndicator = () => {
    if (typingUsers.size === 0) return null;
    return <TypingIndicator isVisible={true} userName={recipientName} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <View style={styles.avatarContainer}>
            {recipientAvatar ? (
              <Image source={{ uri: recipientAvatar }} style={styles.headerAvatar} />
            ) : (
              <View style={[styles.headerAvatar, styles.defaultHeaderAvatar]}>
                <Text style={styles.headerAvatarText}>
                  {recipientName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {isRecipientOnline && <View style={styles.onlineIndicator} />}
          </View>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{recipientName}</Text>
            <Text style={[styles.headerStatus, { color: isRecipientOnline ? '#4CAF50' : '#999' }]}>
              {isRecipientOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="call" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => item._id || item.tempId || index.toString()}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          ListFooterComponent={renderTypingIndicator}
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={newMessage}
              onChangeText={(text) => {
                setNewMessage(text);
                if (text.length > 0 && !typingTimeoutRef.current) {
                  startTyping();
                }
              }}
              onBlur={stopTyping}
              placeholder="Type a message..."
              placeholderTextColor="#999"
              multiline
              maxLength={1000}
            />
            
            <TouchableOpacity
              style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!newMessage.trim() || sending}
            >
              <Ionicons 
                name={sending ? "hourglass" : "send"} 
                size={20} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  defaultHeaderAvatar: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  headerStatus: {
    fontSize: 12,
    marginTop: 1,
  },
  headerButton: {
    padding: 8,
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 8,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    maxHeight: 80,
    minHeight: 20,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
});

export default ChatScreen;
