import { prisma } from '../../lib/prisma';

export interface SendPrivateMessageDTO {
  content: string;
  senderId: number;
  receiverId: number;
}

export const getConversations = async (userId: number) => {
  const messages = await prisma.privateMessage.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { id: true, name: true, email: true } },
      receiver: { select: { id: true, name: true, email: true } },
    },
  });

  // Group messages by conversation partner
  const conversationMap = new Map<number, typeof messages[0]>();

  for (const msg of messages) {
    const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
    if (!conversationMap.has(partnerId)) {
      conversationMap.set(partnerId, msg);
    }
  }

  return Array.from(conversationMap.values()).map((msg) => {
    const partner = msg.senderId === userId ? msg.receiver : msg.sender;
    return {
      partner,
      lastMessage: {
        id: msg.id,
        content: msg.content,
        createdAt: msg.createdAt,
        sentByMe: msg.senderId === userId,
      },
    };
  });
};

export const getMessagesBetweenUsers = async (userId: number, otherUserId: number) => {
  const messages = await prisma.privateMessage.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    },
    orderBy: { createdAt: 'asc' },
    include: {
      sender: { select: { id: true, name: true, email: true } },
      receiver: { select: { id: true, name: true, email: true } },
    },
  });

  return messages;
};

export const sendPrivateMessage = async (data: SendPrivateMessageDTO) => {
  const message = await prisma.privateMessage.create({
    data: {
      content: data.content,
      senderId: data.senderId,
      receiverId: data.receiverId,
    },
    include: {
      sender: { select: { id: true, name: true, email: true } },
      receiver: { select: { id: true, name: true, email: true } },
    },
  });

  return message;
};

export const markMessagesAsRead = async (userId: number, senderId: number) => {
  await prisma.privateMessage.updateMany({
    where: {
      senderId,
      receiverId: userId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });
};

