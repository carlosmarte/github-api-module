export function validateOptions(options, allowedKeys) {
  const invalidKeys = Object.keys(options).filter(key => !allowedKeys.includes(key));
  
  if (invalidKeys.length > 0) {
    console.warn(`Warning: Invalid options provided: ${invalidKeys.join(', ')}`);
  }
  
  return true;
}

export function validateRequiredFields(data, requiredFields) {
  const missing = requiredFields.filter(field => !data[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  return true;
}

export function validateEnum(value, enumValues, fieldName) {
  if (!enumValues.includes(value)) {
    throw new Error(`Invalid value for ${fieldName}: must be one of ${enumValues.join(', ')}`);
  }
  
  return true;
}

export function validateString(value, fieldName, options = {}) {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  
  if (options.minLength && value.length < options.minLength) {
    throw new Error(`${fieldName} must be at least ${options.minLength} characters long`);
  }
  
  if (options.maxLength && value.length > options.maxLength) {
    throw new Error(`${fieldName} must not exceed ${options.maxLength} characters`);
  }
  
  if (options.pattern && !options.pattern.test(value)) {
    throw new Error(`${fieldName} has invalid format`);
  }
  
  return true;
}

export function validateInteger(value, fieldName, options = {}) {
  if (!Number.isInteger(value)) {
    throw new Error(`${fieldName} must be an integer`);
  }
  
  if (options.min !== undefined && value < options.min) {
    throw new Error(`${fieldName} must be at least ${options.min}`);
  }
  
  if (options.max !== undefined && value > options.max) {
    throw new Error(`${fieldName} must not exceed ${options.max}`);
  }
  
  return true;
}

export function validateUrl(value, fieldName) {
  try {
    new URL(value);
    return true;
  } catch (error) {
    throw new Error(`${fieldName} must be a valid URL`);
  }
}

export function validateEmail(value, fieldName) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(value)) {
    throw new Error(`${fieldName} must be a valid email address`);
  }
  
  return true;
}

export function sanitizeInput(value) {
  if (typeof value !== 'string') return value;
  
  return value
    .trim()
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ');
}