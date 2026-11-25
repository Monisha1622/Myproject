const validateMember = (req, res, next) => {
  const { full_name, email, phone_number } = req.body;
  const errors = [];

  if (!full_name || typeof full_name !== 'string' || !full_name.trim()) {
    errors.push('Full name is required.');
  }

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push('Email is required.');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push('Please provide a valid email address.');
    }
  }

  if (!phone_number || typeof phone_number !== 'string' || !phone_number.trim()) {
    errors.push('Phone number is required.');
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
  validateMember,
};
