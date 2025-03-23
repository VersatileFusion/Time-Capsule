const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} dirty - The unsanitized HTML string
 * @returns {string} - Sanitized HTML string
 */
exports.sanitizeHtml = (dirty) => {
  if (typeof dirty !== 'string') {
    return '';
  }
  
  // Configure allowed tags and attributes
  const config = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'target'],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false,
    SANITIZE_DOM: true,
    WHOLE_DOCUMENT: false
  };
  
  return DOMPurify.sanitize(dirty, config);
};

/**
 * Strip all HTML tags from input
 * @param {string} dirty - The unsanitized string
 * @returns {string} - String with all HTML removed
 */
exports.stripHtml = (dirty) => {
  if (typeof dirty !== 'string') {
    return '';
  }
  
  const config = {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  };
  
  return DOMPurify.sanitize(dirty, config);
};

/**
 * Sanitize object by cleaning all string values
 * @param {object} obj - Object with potentially unsafe strings
 * @returns {object} - Object with sanitized strings
 */
exports.sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = exports.stripHtml(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = exports.sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}; 