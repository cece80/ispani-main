/**
 * Ispani Input Validators
 * Comprehensive validation for South African job marketplace
 */

const SA_PHONE_REGEX = /^(\+27|0)[6-8][0-9]{8}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SA_ID_REGEX = /^[0-9]{13}$/;

const SA_PROVINCES = [
  'gauteng', 'western_cape', 'kwazulu_natal', 'eastern_cape',
  'free_state', 'limpopo', 'mpumalanga', 'north_west', 'northern_cape',
];

const JOB_CATEGORIES = [
  'plumbing', 'electrical', 'gardening', 'cleaning', 'painting',
  'carpentry', 'moving', 'delivery', 'cooking', 'childcare',
  'tutoring', 'security', 'driving', 'general_labour', 'other',
];

const USER_TYPES = ['worker', 'client', 'admin'];
const JOB_STATUSES = ['draft', 'open', 'assigned', 'in_progress', 'completed', 'cancelled', 'disputed'];
const APPLICATION_STATUSES = ['pending', 'accepted', 'rejected', 'withdrawn'];
const DISPUTE_CATEGORIES = ['non_payment', 'poor_quality', 'no_show', 'safety', 'harassment', 'fraud', 'other'];

const validators = {
  // ─── Primitives ──────────────────────────────────────
  isEmail(value) {
    return typeof value === 'string' && EMAIL_REGEX.test(value.trim());
  },

  isPhone(value) {
    if (typeof value !== 'string') return false;
    const cleaned = value.replace(/[\s-]/g, '');
    return SA_PHONE_REGEX.test(cleaned);
  },

  isUUID(value) {
    return typeof value === 'string' && UUID_REGEX.test(value);
  },

  isSAId(value) {
    if (typeof value !== 'string' || !SA_ID_REGEX.test(value)) return false;
    // Luhn check for SA ID numbers
    let sum = 0;
    for (let i = 0; i < 13; i++) {
      let digit = parseInt(value[i], 10);
      if (i % 2 !== 0) digit *= 2;
      if (digit > 9) digit -= 9;
      sum += digit;
    }
    return sum % 10 === 0;
  },

  isProvince(value) {
    return typeof value === 'string' && SA_PROVINCES.includes(value.toLowerCase());
  },

  isJobCategory(value) {
    return typeof value === 'string' && JOB_CATEGORIES.includes(value.toLowerCase());
  },

  // ─── String Utilities ────────────────────────────────
  sanitize(value) {
    if (typeof value !== 'string') return value;
    return value
      .trim()
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  },

  sanitizeObject(obj, fields) {
    const result = { ...obj };
    for (const field of fields) {
      if (typeof result[field] === 'string') {
        result[field] = validators.sanitize(result[field]);
      }
    }
    return result;
  },

  // ─── Business Rules ──────────────────────────────────
  isValidRating(value) {
    return typeof value === 'number' && value >= 1 && value <= 5 && Number.isInteger(value);
  },

  isValidPaymentAmount(value) {
    return typeof value === 'number' && value > 0 && value <= 1000000;
  },

  isAboveMinimumWage(ratePerHour) {
    const NMW = 27.58; // SA National Minimum Wage per hour
    return typeof ratePerHour === 'number' && ratePerHour >= NMW;
  },

  isValidLatitude(value) {
    return typeof value === 'number' && value >= -90 && value <= 90;
  },

  isValidLongitude(value) {
    return typeof value === 'number' && value >= -180 && value <= 180;
  },

  isValidPassword(value) {
    if (typeof value !== 'string' || value.length < 8) return false;
    if (value.length > 128) return false;
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    return hasUpper && hasLower && hasNumber;
  },

  // ─── Compound Validators ─────────────────────────────
  validateRegistration({ email, password, phone, type }) {
    const errors = [];
    if (!email || !validators.isEmail(email)) errors.push('Valid email is required');
    if (!password || !validators.isValidPassword(password)) {
      errors.push('Password must be 8+ chars with uppercase, lowercase, and number');
    }
    if (phone && !validators.isPhone(phone)) errors.push('Invalid SA phone number format');
    if (type && !USER_TYPES.includes(type)) errors.push(`Type must be one of: ${USER_TYPES.join(', ')}`);
    return { valid: errors.length === 0, errors };
  },

  validateJobCreation({ title, description, payment_amount, category, sa_province, rate_per_hour }) {
    const errors = [];
    if (!title || typeof title !== 'string' || title.trim().length < 3) errors.push('Title must be at least 3 characters');
    if (!description || typeof description !== 'string' || description.trim().length < 10) errors.push('Description must be at least 10 characters');
    if (title && title.length > 200) errors.push('Title must be under 200 characters');
    if (description && description.length > 5000) errors.push('Description must be under 5000 characters');
    if (!payment_amount || !validators.isValidPaymentAmount(payment_amount)) errors.push('Valid payment amount required (1 - 1,000,000)');
    if (category && !validators.isJobCategory(category)) errors.push(`Category must be one of: ${JOB_CATEGORIES.join(', ')}`);
    if (sa_province && !validators.isProvince(sa_province)) errors.push(`Province must be one of: ${SA_PROVINCES.join(', ')}`);
    if (rate_per_hour && !validators.isAboveMinimumWage(rate_per_hour)) {
      errors.push('Rate per hour must meet SA minimum wage (R27.58/hr)');
    }
    return { valid: errors.length === 0, errors };
  },

  validateReview({ rating, comment }) {
    const errors = [];
    if (!validators.isValidRating(rating)) errors.push('Rating must be an integer between 1 and 5');
    if (comment && typeof comment === 'string' && comment.length > 2000) errors.push('Comment must be under 2000 characters');
    return { valid: errors.length === 0, errors };
  },

  validateDispute({ category, description }) {
    const errors = [];
    if (!category || !DISPUTE_CATEGORIES.includes(category)) {
      errors.push(`Category must be one of: ${DISPUTE_CATEGORIES.join(', ')}`);
    }
    if (!description || typeof description !== 'string' || description.trim().length < 20) {
      errors.push('Description must be at least 20 characters');
    }
    if (description && description.length > 5000) errors.push('Description must be under 5000 characters');
    return { valid: errors.length === 0, errors };
  },
};

module.exports = {
  validators,
  SA_PROVINCES,
  JOB_CATEGORIES,
  USER_TYPES,
  JOB_STATUSES,
  APPLICATION_STATUSES,
  DISPUTE_CATEGORIES,
};
