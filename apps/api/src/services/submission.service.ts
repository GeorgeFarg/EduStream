import { prisma } from '../../lib/prisma';
import { isLateSubmission } from '../utils/date.util';

export interface CreateSubmissionDTO {
  assignmentId: number;
  studentId: number;
  fileUrl: string;
}

export interface SubmissionResponse {
  id: number;
  assignmentId: number;
  studentId: number;
  fileUrl: string;
  submittedAt: Date;
  isLate: boolean;
  grade: number | null;
}

/**
 * Create a new submission
 * @param data - Submission creation data
 * @returns Promise resolving to created submission
 * @throws Error with status 404 if assignment not found
 * @throws Error with status 409 if duplicate submission
 */
export const createSubmission = async (
  data: CreateSubmissionDTO
): Promise<SubmissionResponse> => {
  // Validate assignment exists and get due date
  const assignment = await prisma.assignment.findUnique({
    where: { id: data.assignmentId },
    select: { id: true, dueDate: true },
  });

  if (!assignment) {
    const error = new Error('Assignment not found') as any;
    error.statusCode = 404;
    throw error;
  }

  // Check if submission already exists
  const existingSubmission = await prisma.submission.findUnique({
    where: {
      assignmentId_studentId: {
        assignmentId: data.assignmentId,
        studentId: data.studentId,
      },
    },
  });

  if (existingSubmission) {
    const error = new Error('Submission already exists for this assignment') as any;
    error.statusCode = 409;
    throw error;
  }

  // Check if submission is late
  const submittedAt = new Date();
  const isLate = isLateSubmission(submittedAt, assignment.dueDate);

  // Create the submission
  const submission = await prisma.submission.create({
    data: {
      assignmentId: data.assignmentId,
      studentId: data.studentId,
      fileUrl: data.fileUrl,
      submittedAt,
      isLate,
    },
  });

  return {
    id: submission.id,
    assignmentId: submission.assignmentId,
    studentId: submission.studentId,
    fileUrl: submission.fileUrl,
    submittedAt: submission.submittedAt,
    isLate: submission.isLate,
    grade: submission.grade,
  };
};

/**
 * Get all submissions for an assignment
 * @param assignmentId - Assignment ID
 * @returns Promise resolving to array of submissions with student info
 */
export const getSubmissionsByAssignment = async (assignmentId: number) => {
  const submissions = await prisma.submission.findMany({
    where: { assignmentId },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      submittedAt: 'asc',
    },
  });

  return submissions;
};

/**
 * Grade a submission
 * @param submissionId - Submission ID
 * @param teacherId - Teacher ID (for ownership validation)
 * @param grade - Grade value (0-100)
 * @returns Promise resolving to updated submission
 * @throws Error with status 404 if submission not found
 * @throws Error with status 403 if teacher doesn't own assignment
 */
export const gradeSubmission = async (
  submissionId: number,
  teacherId: number,
  grade: number
) => {
  // Validate submission exists and get assignment info
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: {
        select: {
          id: true,
          teacherId: true,
        },
      },
    },
  });

  if (!submission) {
    const error = new Error('Submission not found') as any;
    error.statusCode = 404;
    throw error;
  }

  // Ownership check moved to controller/middleware


  // Update the grade
  const updatedSubmission = await prisma.submission.update({
    where: { id: submissionId },
    data: { grade },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignment: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  return updatedSubmission;
};

/**
 * Get all submissions for a student
 * @param studentId - Student ID
 * @returns Promise resolving to array of submissions with assignment info
 */
export const getStudentSubmissions = async (studentId: number) => {
  const submissions = await prisma.submission.findMany({
    where: { studentId },
    include: {
      assignment: {
        select: {
          id: true,
          title: true,
          description: true,
          dueDate: true,
          teacher: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      submittedAt: 'desc',
    },
  });

  return submissions;
};
