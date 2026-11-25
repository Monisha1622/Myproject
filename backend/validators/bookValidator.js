const validateBook = (req, res, next) => {
  const { book_name, author, category, isbn, total_copies, available_copies } = req.body;
  const errors = [];

  if (!book_name || typeof book_name !== 'string' || !book_name.trim()) {
    errors.push('Book name is required.');
  }

  if (!author || typeof author !== 'string' || !author.trim()) {
    errors.push('Author is required.');
  }

  if (!category || typeof category !== 'string' || !category.trim()) {
    errors.push('Category is required.');
  }

  if (!isbn || typeof isbn !== 'string' || !isbn.trim()) {
    errors.push('ISBN is required.');
  }

  const parsedTotal = parseInt(total_copies, 10);
  if (isNaN(parsedTotal) || parsedTotal <= 0) {
    errors.push('Total copies must be an integer greater than zero.');
  }

  // available_copies is optional on creation (defaults to total_copies), but if provided must be valid
  if (available_copies !== undefined && available_copies !== null) {
    const parsedAvailable = parseInt(available_copies, 10);
    if (isNaN(parsedAvailable) || parsedAvailable < 0) {
      errors.push('Available copies cannot be negative.');
    } else if (!isNaN(parsedTotal) && parsedAvailable > parsedTotal) {
      errors.push('Available copies cannot exceed total copies.');
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
  validateBook,
};
