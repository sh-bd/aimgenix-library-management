/**
 * Calculates the due date, skipping Fridays and Saturdays.
 * @param {Date} issueDate The date the book is issued.
 * @returns {Date} The calculated due date.
 */
export const calculateDueDate = (issueDate = new Date()) => {
  const dueDate = new Date(issueDate.getTime());
  dueDate.setDate(dueDate.getDate() + 14); // Add 14 days
  const dayOfWeek = dueDate.getDay(); // 0=Sunday, 1=Monday, ..., 5=Friday, 6=Saturday
  
  if (dayOfWeek === 5) { // If it's Friday
    dueDate.setDate(dueDate.getDate() + 2); // Move to Sunday
  } else if (dayOfWeek === 6) { // If it's Saturday
    dueDate.setDate(dueDate.getDate() + 1); // Move to Sunday
  }
  
  // Set time to end of day
  dueDate.setHours(23, 59, 59, 999);
  return dueDate;
};