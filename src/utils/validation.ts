import { VALIDATION_RULES } from '../config/constants';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ValidationRule {
  test: (value: unknown) => boolean;
  message: string;
}

export class Validator {
  private rules: ValidationRule[] = [];
  
  constructor(private value: unknown) {}
  
  static create(value: unknown): Validator {
    return new Validator(value);
  }
  
  required(message: string = 'This field is required'): Validator {
    this.rules.push({
      test: (value) => value !== null && value !== undefined && value !== '',
      message
    });
    return this;
  }
  
  email(message: string = 'Please enter a valid email address'): Validator {
    this.rules.push({
      test: (value) => {
        if (!value) return true; // Allow empty if not required
        if (typeof value !== 'string') return false;
        return VALIDATION_RULES.EMAIL_REGEX.test(value);
      },
      message
    });
    return this;
  }
  
  minLength(min: number, message?: string): Validator {
    this.rules.push({
      test: (value) => {
        if (!value) return true; // Allow empty if not required
        if (typeof value !== 'string' && !Array.isArray(value)) return false;
        return value.length >= min;
      },
      message: message || `Must be at least ${min} characters long`
    });
    return this;
  }
  
  maxLength(max: number, message?: string): Validator {
    this.rules.push({
      test: (value) => {
        if (!value) return true; // Allow empty if not required
        if (typeof value !== 'string' && !Array.isArray(value)) return false;
        return value.length <= max;
      },
      message: message || `Must be no more than ${max} characters long`
    });
    return this;
  }
  
  min(min: number, message?: string): Validator {
    this.rules.push({
      test: (value) => {
        if (value === null || value === undefined || value === '') return true;
        return Number(value) >= min;
      },
      message: message || `Must be at least ${min}`
    });
    return this;
  }
  
  max(max: number, message?: string): Validator {
    this.rules.push({
      test: (value) => {
        if (value === null || value === undefined || value === '') return true;
        return Number(value) <= max;
      },
      message: message || `Must be no more than ${max}`
    });
    return this;
  }
  
  pattern(regex: RegExp, message: string): Validator {
    this.rules.push({
      test: (value) => {
        if (!value) return true; // Allow empty if not required
        if (typeof value !== 'string') return false;
        return regex.test(value);
      },
      message
    });
    return this;
  }
  
  phone(message: string = 'Please enter a valid phone number'): Validator {
    this.rules.push({
      test: (value) => {
        if (!value) return true; // Allow empty if not required
        if (typeof value !== 'string') return false;
        return VALIDATION_RULES.PHONE_REGEX.test(value);
      },
      message
    });
    return this;
  }
  
  url(message: string = 'Please enter a valid URL'): Validator {
    this.rules.push({
      test: (value) => {
        if (!value) return true; // Allow empty if not required
        if (typeof value !== 'string') return false;
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      message
    });
    return this;
  }
  
  custom(test: (value: unknown) => boolean, message: string): Validator {
    this.rules.push({ test, message });
    return this;
  }
  
  validate(): ValidationResult {
    const errors: string[] = [];
    
    for (const rule of this.rules) {
      if (!rule.test(this.value)) {
        errors.push(rule.message);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Utility functions for common validations
export const ValidationUtils = {
  validateEmail: (email: string): boolean => {
    return VALIDATION_RULES.EMAIL_REGEX.test(email);
  },
  
  validatePhone: (phone: string): boolean => {
    return VALIDATION_RULES.PHONE_REGEX.test(phone);
  },
  
  validatePassword: (password: string): ValidationResult => {
    return Validator.create(password)
      .required('Password is required')
      .minLength(VALIDATION_RULES.PASSWORD_MIN_LENGTH, `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters long`)
      .validate();
  },
  
  validateRequired: (value: unknown, fieldName: string): ValidationResult => {
    return Validator.create(value)
      .required(`${fieldName} is required`)
      .validate();
  },
  
  validatePrice: (price: number): ValidationResult => {
    return Validator.create(price)
      .required('Price is required')
      .min(0, 'Price must be positive')
      .max(VALIDATION_RULES.MAX_PRICE, `Price cannot exceed $${VALIDATION_RULES.MAX_PRICE}`)
      .validate();
  },
  
  validateFileSize: (file: File): ValidationResult => {
    return Validator.create(file.size)
      .max(VALIDATION_RULES.MAX_FILE_SIZE, `File size cannot exceed ${VALIDATION_RULES.MAX_FILE_SIZE / (1024 * 1024)}MB`)
      .validate();
  },
  
  validateImageFile: (file: File): ValidationResult => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    
    return Validator.create(file.type)
      .custom(
        (type) => typeof type === 'string' && allowedTypes.includes(type),
        'Please select a valid image file (JPEG, PNG, WebP, or GIF)'
      )
      .validate();
  }
};

// Form validation helper
export function validateForm(data: Record<string, unknown>, rules: Record<string, (value: unknown) => ValidationResult>): {
  isValid: boolean;
  errors: Record<string, string[]>;
} {
  const errors: Record<string, string[]> = {};
  let isValid = true;
  
  for (const [field, rule] of Object.entries(rules)) {
    const result = rule(data[field]);
    if (!result.isValid) {
      errors[field] = result.errors;
      isValid = false;
    }
  }
  
  return { isValid, errors };
}

// Sanitization utilities
export const SanitizationUtils = {
  sanitizeString: (str: string): string => {
    return str.trim().replace(/[<>"'&]/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[char] || char;
    });
  },
  
  sanitizeEmail: (email: string): string => {
    return email.toLowerCase().trim();
  },
  
  sanitizePhone: (phone: string): string => {
    return phone.replace(/[^\d+\-()\s]/g, '').trim();
  },
  
  sanitizePrice: (price: string | number): number => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return Math.max(0, Math.round(numPrice * 100) / 100); // Round to 2 decimal places
  }
};