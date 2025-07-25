// lib/chat-utils.ts

import prisma from "@/lib/db";

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: Date;
}

export interface ChatPersistenceOptions {
  userId: string;
  questionId: string;
}

export class ChatPersistence {
  private userId: string;
  private questionId: string;

  constructor({ userId, questionId }: ChatPersistenceOptions) {
    this.userId = userId;
    this.questionId = questionId;
  }

  /**
   * Load chat history for the current user and question
   */
  async loadHistory(): Promise<ChatMessage[]> {
    try {
      const messages = await prisma.chatMessage.findMany({
        where: {
          userId: this.userId,
          questionId: this.questionId,
        },
        orderBy: {
          createdAt: 'asc',
        },
        select: {
          id: true,
          content: true,
          role: true,
          createdAt: true,
        },
      });

      return messages.map(msg => ({
        ...msg,
        role: msg.role as 'user' | 'assistant',
      }));
    } catch (error) {
      console.error('Failed to load chat history:', error);
      return [];
    }
  }

  /**
   * Save a new message to the database
   */
  async saveMessage(content: string, role: 'user' | 'assistant'): Promise<ChatMessage | null> {
    try {
      const message = await prisma.chatMessage.create({
        data: {
          content,
          role,
          userId: this.userId,
          questionId: this.questionId,
        },
      });

      return {
        id: message.id,
        content: message.content,
        role: message.role as 'user' | 'assistant',
        createdAt: message.createdAt,
      };
    } catch (error) {
      console.error('Failed to save message:', error);
      return null;
    }
  }

  /**
   * Save multiple messages in a transaction
   */
  async saveMessages(messages: Array<{ content: string; role: 'user' | 'assistant' }>): Promise<ChatMessage[]> {
    try {
      const savedMessages = await prisma.$transaction(
        messages.map(msg =>
          prisma.chatMessage.create({
            data: {
              content: msg.content,
              role: msg.role,
              userId: this.userId,
              questionId: this.questionId,
            },
          })
        )
      );

      return savedMessages.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role as 'user' | 'assistant',
        createdAt: msg.createdAt,
      }));
    } catch (error) {
      console.error('Failed to save messages:', error);
      return [];
    }
  }

  /**
   * Clear all chat history for the current user and question
   */
  async clearHistory(): Promise<boolean> {
    try {
      await prisma.chatMessage.deleteMany({
        where: {
          userId: this.userId,
          questionId: this.questionId,
        },
      });
      return true;
    } catch (error) {
      console.error('Failed to clear chat history:', error);
      return false;
    }
  }

  /**
   * Get chat statistics
   */
  async getStats(): Promise<{
    messageCount: number;
    firstMessageAt: Date | null;
    lastMessageAt: Date | null;
  }> {
    try {
      const stats = await prisma.chatMessage.aggregate({
        where: {
          userId: this.userId,
          questionId: this.questionId,
        },
        _count: true,
        _min: {
          createdAt: true,
        },
        _max: {
          createdAt: true,
        },
      });

      return {
        messageCount: stats._count,
        firstMessageAt: stats._min.createdAt,
        lastMessageAt: stats._max.createdAt,
      };
    } catch (error) {
      console.error('Failed to get chat stats:', error);
      return {
        messageCount: 0,
        firstMessageAt: null,
        lastMessageAt: null,
      };
    }
  }
}

// Hook for using chat persistence in React components
export function useChatPersistence(userId: string, questionId: string) {
  const chatPersistence = new ChatPersistence({ userId, questionId });

  return {
    loadHistory: () => chatPersistence.loadHistory(),
    saveMessage: (content: string, role: 'user' | 'assistant') => 
      chatPersistence.saveMessage(content, role),
    saveMessages: (messages: Array<{ content: string; role: 'user' | 'assistant' }>) =>
      chatPersistence.saveMessages(messages),
    clearHistory: () => chatPersistence.clearHistory(),
    getStats: () => chatPersistence.getStats(),
  };
}

// API route helpers
export async function loadChatHistoryForAPI(userId: string, questionId: string) {
  const chatPersistence = new ChatPersistence({ userId, questionId });
  return await chatPersistence.loadHistory();
}

export async function saveChatMessageForAPI(
  userId: string, 
  questionId: string, 
  content: string, 
  role: 'user' | 'assistant'
) {
  const chatPersistence = new ChatPersistence({ userId, questionId });
  return await chatPersistence.saveMessage(content, role);
}