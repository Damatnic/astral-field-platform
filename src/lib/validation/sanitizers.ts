/**
 * Comprehensive input sanitization utilities
 * Protects against XSS, injection attacks, and malicious content
 */

import { z } from 'zod';

// ===== HTML/XSS SANITIZATION =====

/**
 * Removes potentially dangerous HTML tags and attributes
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    // Remove script tags and their content
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    // Remove style tags and their content
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    // Remove event handlers (onclick, onload, etc.)
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s*on\w+\s*=\s*[^>\s]+/gi, '')
    // Remove javascript: URLs
    .replace(/javascript\s*:/gi, 'blocked:')
    // Remove data: URLs (can contain scripts)
    .replace(/data\s*:/gi, 'blocked:')
    // Remove vbscript: URLs
    .replace(/vbscript\s*:/gi, 'blocked:')
    // Remove form tags
    .replace(/<\/?form[\s\S]*?>/gi, '')
    // Remove iframe tags
    .replace(/<\/?iframe[\s\S]*?>/gi, '')
    // Remove object and embed tags
    .replace(/<\/?(?:object|embed)[\s\S]*?>/gi, '')
    // Remove meta tags
    .replace(/<\/?meta[\s\S]*?>/gi, '')
    // Remove link tags (can load external resources)
    .replace(/<\/?link[\s\S]*?>/gi, '')
    // Remove base tags
    .replace(/<\/?base[\s\S]*?>/gi, '');
}

/**
 * Strips all HTML tags, leaving only text content
 */
export function stripHtml(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .trim();
}

/**
 * Escapes HTML entities to prevent XSS
 */
export function escapeHtml(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// ===== SQL INJECTION PREVENTION =====

/**
 * Sanitizes input to prevent SQL injection
 */
export function sanitizeSql(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    // Remove or escape dangerous SQL keywords
    .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/gi, '')
    // Remove SQL comments
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove dangerous characters
    .replace(/[';\\]/g, '')
    .trim();
}

// ===== PATH TRAVERSAL PREVENTION =====

/**
 * Prevents path traversal attacks in file paths
 */
export function sanitizePath(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    // Remove path traversal patterns
    .replace(/\.\./g, '')
    .replace(/\\/g, '/')
    // Remove dangerous path elements
    .replace(/\/+/g, '/')
    .replace(/^\/+/, '')
    // Remove null bytes
    .replace(/\0/g, '')
    .trim();
}

// ===== COMMAND INJECTION PREVENTION =====

/**
 * Sanitizes input to prevent command injection
 */
export function sanitizeCommand(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    // Remove shell metacharacters
    .replace(/[;&|`$(){}[\]\\]/g, '')
    // Remove dangerous commands
    .replace(/\b(rm|del|format|fdisk|mkfs|dd|cat|type|more|less|head|tail|grep|find|exec|eval|system|shell_exec|passthru|proc_open|popen)\b/gi, '')
    .trim();
}

// ===== EMAIL SANITIZATION =====

/**
 * Sanitizes and validates email addresses
 */
export function sanitizeEmail(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .toLowerCase()
    .trim()
    // Remove dangerous characters
    .replace(/[<>()[\]\\,;:\s@"]/g, (match, offset, string) => {
      // Allow @ symbol only once and not at start/end
      if (match === '@') {
        const beforeAt = string.substring(0, offset).indexOf('@') === -1;
        const afterAt = string.substring(offset + 1).indexOf('@') === -1;
        return beforeAt && afterAt && offset > 0 && offset < string.length - 1 ? match : '';
      }
      return '';
    })
    // Ensure no consecutive dots
    .replace(/\.{2,}/g, '.');
}

// ===== USERNAME SANITIZATION =====

/**
 * Sanitizes usernames to prevent various attacks
 */
export function sanitizeUsername(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    // Only allow alphanumeric characters, underscores, and hyphens
    .replace(/[^a-zA-Z0-9_-]/g, '')
    // Prevent consecutive special characters
    .replace(/[-_]{2,}/g, (match) => match[0])
    // Remove leading/trailing special characters
    .replace(/^[-_]+|[-_]+$/g, '')
    .substring(0, 30); // Max length limit
}

// ===== PHONE NUMBER SANITIZATION =====

/**
 * Sanitizes phone numbers
 */
export function sanitizePhone(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    // Remove all non-digit characters except + at start
    .replace(/[^\d+]/g, '')
    // Ensure + only at start
    .replace(/(?!^)\+/g, '')
    // Limit length
    .substring(0, 15);
}

// ===== URL SANITIZATION =====

/**
 * Sanitizes URLs to prevent malicious redirects
 */
export function sanitizeUrl(input: string): string {
  if (typeof input !== 'string') return '';
  
  const trimmed = input.trim();
  
  // Block dangerous protocols
  const dangerousProtocols = [
    'javascript:', 'data:', 'vbscript:', 'file:', 'ftp:',
    'telnet:', 'ssh:', 'gopher:', 'ldap:', 'dict:'
  ];
  
  const lower = trimmed.toLowerCase();
  for (const protocol of dangerousProtocols) {
    if (lower.startsWith(protocol)) {
      return '';
    }
  }
  
  // Only allow http and https
  if (!lower.startsWith('http://') && !lower.startsWith('https://')) {
    return lower.startsWith('//') ? `https:${trimmed}` : `https://${trimmed}`;
  }
  
  return trimmed;
}

// ===== NUMERIC SANITIZATION =====

/**
 * Sanitizes numeric input
 */
export function sanitizeNumeric(input: string | number, options: {
  allowDecimal?: boolean;
  allowNegative?: boolean;
  maxValue?: number;
  minValue?: number;
} = {}): number | null {
  const {
    allowDecimal = false,
    allowNegative = false,
    maxValue,
    minValue
  } = options;
  
  if (typeof input === 'number') {
    if (isNaN(input) || !isFinite(input)) return null;
  } else if (typeof input === 'string') {
    const cleaned = input.trim().replace(/[^0-9.-]/g, '');
    if (!cleaned) return null;
    input = parseFloat(cleaned);
  } else {
    return null;
  }
  
  const num = input as number;
  
  // Check if decimal is allowed
  if (!allowDecimal && num % 1 !== 0) {
    return Math.floor(num);
  }
  
  // Check if negative is allowed
  if (!allowNegative && num < 0) {
    return 0;
  }
  
  // Apply range limits
  let result = num;
  if (typeof minValue === 'number' && result < minValue) {
    result = minValue;
  }
  if (typeof maxValue === 'number' && result > maxValue) {
    result = maxValue;
  }
  
  return result;
}

// ===== TEXT CONTENT SANITIZATION =====

/**
 * General text sanitization for user content
 */
export function sanitizeText(input: string, options: {
  maxLength?: number;
  allowHtml?: boolean;
  stripWhitespace?: boolean;
} = {}): string {
  if (typeof input !== 'string') return '';
  
  const { maxLength = 10000, allowHtml = false, stripWhitespace = true } = options;
  
  let result = input;
  
  // Strip or sanitize HTML
  if (!allowHtml) {
    result = stripHtml(result);
  } else {
    result = sanitizeHtml(result);
  }
  
  // Handle whitespace
  if (stripWhitespace) {
    result = result.trim().replace(/\s+/g, ' ');
  }
  
  // Apply length limit
  if (result.length > maxLength) {
    result = result.substring(0, maxLength);
  }
  
  return result;
}

// ===== OBJECT SANITIZATION =====

/**
 * Recursively sanitizes object properties
 */
export function sanitizeObject(obj: any, options: {
  maxDepth?: number;
  allowedKeys?: string[];
  sanitizeStrings?: boolean;
} = {}): any {
  const { maxDepth = 10, allowedKeys, sanitizeStrings = true } = options;
  
  if (maxDepth <= 0) return null;
  
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeStrings ? sanitizeText(obj) : obj;
  }
  
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj
      .slice(0, 1000) // Limit array size
      .map(item => sanitizeObject(item, { ...options, maxDepth: maxDepth - 1 }));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    const keys = Object.keys(obj).slice(0, 100); // Limit object keys
    
    for (const key of keys) {
      // Check allowed keys if specified
      if (allowedKeys && !allowedKeys.includes(key)) continue;
      
      // Sanitize key name
      const sanitizedKey = sanitizeText(key, { maxLength: 100, allowHtml: false });
      if (!sanitizedKey) continue;
      
      // Sanitize value
      sanitized[sanitizedKey] = sanitizeObject(obj[key], { ...options, maxDepth: maxDepth - 1 });
    }
    
    return sanitized;
  }
  
  return null;
}

// ===== RATE LIMITING HELPERS =====

/**
 * Sanitizes rate limiting key to prevent key injection
 */
export function sanitizeRateLimitKey(key: string): string {
  if (typeof key !== 'string') return 'invalid';
  
  return key
    .replace(/[^a-zA-Z0-9_:-]/g, '')
    .substring(0, 200);
}

// ===== COMPREHENSIVE SANITIZER =====

/**
 * Applies appropriate sanitization based on data type and context
 */
export function sanitize(input: any, context: 'html' | 'sql' | 'path' | 'command' | 'email' | 'username' | 'url' | 'text' = 'text'): any {
  if (typeof input !== 'string' && context !== 'text') {
    return input;
  }
  
  switch (context) {
    case 'html':
      return sanitizeHtml(input);
    case 'sql':
      return sanitizeSql(input);
    case 'path':
      return sanitizePath(input);
    case 'command':
      return sanitizeCommand(input);
    case 'email':
      return sanitizeEmail(input);
    case 'username':
      return sanitizeUsername(input);
    case 'url':
      return sanitizeUrl(input);
    case 'text':
    default:
      return typeof input === 'string' ? sanitizeText(input) : sanitizeObject(input);
  }
}