import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const MessageItem = ({ message, isCurrentUser, onLongPress }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageStatus = () => {
    if (!isCurrentUser) return null;
    
    if (message.readBy && message.readBy.length > 1) {
      return '✓✓'; // Read
    } else {
      return '✓'; // Delivered
    }
  };

  return (
    <View style={[
      styles.container,
      isCurrentUser ? styles.sentContainer : styles.receivedContainer
    ]}>
      <TouchableOpacity
        onLongPress={() => onLongPress && onLongPress(message)}
        activeOpacity={0.8}
      >
        {isCurrentUser ? (
          <LinearGradient
            colors={['#007AFF', '#0051D0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.messageBubble, styles.sentBubble]}
          >
            <Text style={[styles.messageText, styles.sentText]}>
              {message.text}
            </Text>
            <View style={styles.messageFooter}>
              <Text style={[styles.timestamp, styles.sentTimestamp]}>
                {formatTime(message.createdAt)}
              </Text>
              <Text style={[styles.status, styles.sentStatus]}>
                {getMessageStatus()}
              </Text>
            </View>
          </LinearGradient>
        ) : (
          <View style={[styles.messageBubble, styles.receivedBubble]}>
            <Text style={[styles.messageText, styles.receivedText]}>
              {message.text}
            </Text>
            <Text style={[styles.timestamp, styles.receivedTimestamp]}>
              {formatTime(message.createdAt)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
    marginHorizontal: 16,
  },
  sentContainer: {
    alignItems: 'flex-end',
  },
  receivedContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: width * 0.75,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sentBubble: {
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: '#F0F0F0',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  sentText: {
    color: '#FFFFFF',
  },
  receivedText: {
    color: '#000000',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  sentTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  receivedTimestamp: {
    color: '#666666',
  },
  status: {
    fontSize: 12,
    marginLeft: 4,
  },
  sentStatus: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default MessageItem;
