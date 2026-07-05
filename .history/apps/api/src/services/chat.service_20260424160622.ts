import { prisma } from '../../lib/prisma';

export interface CreateChatMessageDTO {
  content: string;
  classId: number;
  senderId: number;
}

export const getMessagesByClass = async (classId: number) => {
  const messages = await prisma.chatMessage.findMany({
    where: { classId },
    orderBy: { createdAt: 'asc' },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return messages;
};

export const createMessage = async (data: CreateChatMessageDTO) => {
  const message = await prisma.chatMessage.create({
    data: {
      content: data.content,
      classId: data.classId,
      senderId: data.senderId,
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return message;
};

