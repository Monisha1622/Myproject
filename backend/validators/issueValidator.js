const validateIssue = (req, res, next) => {
  const { member_id, book_id, due_date, issue_date } = req.body;
  const errors = [];

  const parsedMemberId = parseInt(member_id, 10);
  if (isNaN(parsedMemberId) || parsedMemberId <= 0) {
    errors.push('A valid positive integer member_id is required.');
  }

  const parsedBookId = parseInt(book_id, 10);
  if (isNaN(parsedBookId) || parsedBookId <= 0) {
    errors.push('A valid positive integer book_id is required.');
  }

  if (!due_date) {
    errors.push('due_date is required (format: YYYY-MM-DD).');
  } else {
    const dueTime = new Date(due_date).getTime();
    if (isNaN(dueTime)) {
      errors.push('due_date must be a valid date.');
    } else {
      const issueTime = issue_date ? new Date(issue_date).getTime() : new Date().setHours(0,0,0,0);
      if (dueTime < issueTime) {
        errors.push('due_date must not be earlier than the issue_date.');
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors,
    });
  }

  next();
};

module.exports = {
  validateIssue,
};
