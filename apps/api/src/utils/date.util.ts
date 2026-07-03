/**
 * Check if a date is in the future
 * @param date - Date to validate
 * @returns True if the date is in the future, false otherwise
 */
export const isFutureDate = (date: Date): boolean => {
  const now = new Date();
  return date.getTime() > now.getTime();
};

/**
 * Check if a submission was made after the due date
 * @param submittedAt - Timestamp when submission was made
 * @param dueDate - Assignment due date
 * @returns True if submission is late, false otherwise
 */
export const isLateSubmission = (submittedAt: Date, dueDate: Date): boolean => {
  return submittedAt.getTime() > dueDate.getTime();
};
