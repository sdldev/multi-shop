import validator from 'validator';

export function validatePassword(password) {
  const errors = [];
  
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!validator.isStrongPassword(password, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1
  })) {
    errors.push('Password must contain uppercase, lowercase, number, and special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function sanitizeSearchTerm(search, maxLength = 50) {
  if (!search) return '';
  
  // Trim and limit length
  let sanitized = search.trim().substring(0, maxLength);
  
  // Escape special LIKE characters
  sanitized = sanitized
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
  
  return sanitized;
}
