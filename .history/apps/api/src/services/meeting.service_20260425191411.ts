import { prisma } from '../../lib/prisma';

export interface CreateMeetingDTO {
  title: string;
  classId: number;
  createdBy: number;
}

export const createMeeting = async (data: CreateMeetingDTO) => {
  const meeting = await prisma.meeting.create({
    data: {
      title: data.title,
      classId: data.classId,
      createdBy: data.createdBy,
      startedAt: new Date(),
    },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      participants: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
  return meeting;
};

export const getActiveMeetingByClass = async (classId: number) => {
  const meeting = await prisma.meeting.findFirst({
    where: {
      classId,
      isActive: true,
    },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      participants: {
        where: { leftAt: null },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return meeting;
};

export const getMeetingById = async (meetingId: number) => {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      participants: {
        where: { leftAt: null },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
  return meeting;
};

export const joinMeeting = async (meetingId: number, userId: number) => {
  const participant = await prisma.meetingParticipant.upsert({
    where: {
      meetingId_userId: {
        meetingId,
        userId,
      },
    },
    update: {
      leftAt: null,
    },
    create: {
      meetingId,
      userId,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
  return participant;
};

export const leaveMeeting = async (meetingId: number, userId: number) => {
  await prisma.meetingParticipant.updateMany({
    where: {
      meetingId,
      userId,
      leftAt: null,
    },
    data: {
      leftAt: new Date(),
    },
  });
};

export const endMeeting = async (meetingId: number, userId: number) => {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
  });

  if (!meeting) return null;
  if (meeting.createdBy !== userId) return null;

  await prisma.meetingParticipant.updateMany({
    where: {
      meetingId,
      leftAt: null,
    },
    data: {
      leftAt: new Date(),
    },
  });

  const updated = await prisma.meeting.update({
    where: { id: meetingId },
    data: {
      isActive: false,
      endedAt: new Date(),
    },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      participants: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  return updated;
};

export const getMeetingHistory = async (classId: number) => {
  const meetings = await prisma.meeting.findMany({
    where: { classId },
    orderBy: { createdAt: 'desc' },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      participants: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
  return meetings;
};

