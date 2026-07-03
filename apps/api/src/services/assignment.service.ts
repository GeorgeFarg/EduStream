import { prisma } from '../../lib/prisma';
import { isFutureDate } from '../utils/date.util';

export interface CreateAssignmentDTO {
  title: string;
  description: string;
  dueDate: Date;
  teacherId: number;
  classId: number;
  fileUrl?: string | null;
}

/**
 * Create a new assignment
 * @param data - Assignment creation data
 * @returns Promise resolving to created assignment
 * @throws Error with status 400 if due date is in the past
 */
export const createAssignment = async (data: CreateAssignmentDTO) => {
  // Validate due date is in the future
  if (!isFutureDate(data.dueDate)) {
    const error = new Error('Due date must be in the future') as any;
    error.statusCode = 400;
    throw error;
  }

  // Create the assignment
  const assignment = await prisma.assignment.create({
    data: {
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      teacherId: data.teacherId,
      classId: data.classId,
      fileUrl: data.fileUrl ?? null,
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

  return assignment;
};

/**
 * Get all assignments for a class
 * @param classId - Class ID
 * @returns Promise resolving to array of assignments ordered by due date ascending
 */
export const getAllAssignments = async (classId: number) => {
  const assignments = await prisma.assignment.findMany({
    where: {
      classId,
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
    orderBy: {
      dueDate: 'asc',
    },
  });

  return assignments;
};

/**
 * Get a single assignment by ID
 * @param id - Assignment ID
 * @returns Promise resolving to assignment or null if not found
 */
export const getAssignmentById = async (id: number) => {
  const assignment = await prisma.assignment.findUnique({
    where: { id },
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

  return assignment;
};
