import { prisma } from '../../lib/prisma';

export interface CreateAnnouncementDTO {
  title: string;
  content: string;
  teacherId: number;
  classId: number;
}

export const createAnnouncement = async (data: CreateAnnouncementDTO) => {
  const announcement = await prisma.announcement.create({
    data: {
      title: data.title,
      content: data.content,
      teacherId: data.teacherId,
      classId: data.classId,
    },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return announcement;
};

export const getAllAnnouncements = async (classId: number) => {
  const announcements = await prisma.announcement.findMany({
    where: {
      classId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      comments: {
        orderBy: {
          createdAt: 'asc',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return announcements;
};

export const getAnnouncementById = async (id: number) => {
  const announcement = await prisma.announcement.findUnique({
    where: { id },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      comments: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  return announcement;
};
