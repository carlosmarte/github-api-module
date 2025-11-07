/**
 * @fileoverview GitHub Users Email API
 * @module EmailsAPI
 */

import { validateEmails } from '../utils/validation.mjs';
import { AuthError, ValidationError } from '../utils/errors.mjs';

/**
 * Emails API for authenticated user email management
 */
export class EmailsAPI {
  /**
   * Create EmailsAPI instance
   * @param {HttpClient} http - HTTP client instance
   */
  constructor(http) {
    this.http = http;
  }

  /**
   * List email addresses for the authenticated user
   * Lists all of a user's email addresses, and specifies which one is the
   * user's primary email address. This endpoint requires the `user:email` scope.
   * 
   * @param {Object} [options] - Request options
   * @param {number} [options.per_page=30] - Results per page (max 100)
   * @param {number} [options.page=1] - Page number
   * @returns {Promise<Array>} Array of email objects
   * 
   * @example
   * ```javascript
   * const emails = await client.emails.list();
   * emails.forEach(email => {
   *   console.log(`${email.email} - Primary: ${email.primary}, Verified: ${email.verified}`);
   * });
   * ```
   */
  async list(options = {}) {
    try {
      const params = {
        per_page: options.per_page || 30,
        page: options.page || 1
      };

      const response = await this.http.get('/user/emails', { params, ...options });
      return Array.isArray(response) ? response : [response];
    } catch (error) {
      if (error.status === 401) {
        throw new AuthError('Authentication required. Please provide a valid GitHub token.');
      }
      if (error.status === 403) {
        throw new AuthError('Insufficient permissions. This operation requires the `user:email` scope.');
      }
      throw error;
    }
  }

  /**
   * Add an email address for the authenticated user
   * This endpoint requires the `user` scope.
   * 
   * @param {string|Array<string>} emails - Email address(es) to add
   * @param {Object} [options] - Request options
   * @returns {Promise<Array>} Array of added email objects
   * 
   * @example
   * ```javascript
   * // Add a single email
   * const result = await client.emails.add('user@example.com');
   * 
   * // Add multiple emails
   * const result = await client.emails.add([
   *   'user@example.com',
   *   'user2@example.com'
   * ]);
   * ```
   */
  async add(emails, options = {}) {
    // Normalize to array
    const emailArray = Array.isArray(emails) ? emails : [emails];
    
    // Validate emails
    const validatedEmails = validateEmails(emailArray);

    try {
      const response = await this.http.post('/user/emails', { emails: validatedEmails }, options);
      return Array.isArray(response) ? response : [response];
    } catch (error) {
      if (error.status === 401) {
        throw new AuthError('Authentication required. Please provide a valid GitHub token.');
      }
      if (error.status === 403) {
        throw new AuthError('Insufficient permissions. This operation requires the `user` scope.');
      }
      if (error.status === 422) {
        throw new ValidationError('Email validation failed. Check that all emails are valid and not already added.');
      }
      throw error;
    }
  }

  /**
   * Delete an email address for the authenticated user
   * This endpoint requires the `user` scope.
   * 
   * @param {string|Array<string>} emails - Email address(es) to delete
   * @param {Object} [options] - Request options
   * @returns {Promise<void>}
   * 
   * @example
   * ```javascript
   * // Delete a single email
   * await client.emails.delete('user@example.com');
   * 
   * // Delete multiple emails
   * await client.emails.delete([
   *   'user@example.com',
   *   'user2@example.com'
   * ]);
   * ```
   */
  async delete(emails, options = {}) {
    // Normalize to array
    const emailArray = Array.isArray(emails) ? emails : [emails];
    
    // Validate emails
    const validatedEmails = validateEmails(emailArray);

    try {
      await this.http.delete('/user/emails', { body: { emails: validatedEmails }, ...options });
    } catch (error) {
      if (error.status === 401) {
        throw new AuthError('Authentication required. Please provide a valid GitHub token.');
      }
      if (error.status === 403) {
        throw new AuthError('Insufficient permissions. This operation requires the `user` scope.');
      }
      if (error.status === 422) {
        throw new ValidationError('Email validation failed. Check that the emails exist and can be deleted.');
      }
      throw error;
    }
  }

  /**
   * Get primary email address
   * @param {Object} [options] - Request options
   * @returns {Promise<Object|null>} Primary email object or null
   */
  async getPrimary(options = {}) {
    const emails = await this.list(options);
    return emails.find(email => email.primary) || null;
  }

  /**
   * Get all verified email addresses
   * @param {Object} [options] - Request options
   * @returns {Promise<Array>} Array of verified email objects
   */
  async getVerified(options = {}) {
    const emails = await this.list(options);
    return emails.filter(email => email.verified);
  }

  /**
   * Get all unverified email addresses
   * @param {Object} [options] - Request options
   * @returns {Promise<Array>} Array of unverified email objects
   */
  async getUnverified(options = {}) {
    const emails = await this.list(options);
    return emails.filter(email => !email.verified);
  }

  /**
   * Check if an email address exists for the authenticated user
   * @param {string} email - Email address to check
   * @param {Object} [options] - Request options
   * @returns {Promise<boolean>} True if email exists
   */
  async exists(email, options = {}) {
    const emails = await this.list(options);
    return emails.some(userEmail => userEmail.email === email);
  }

  /**
   * Get email statistics
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} Email statistics
   */
  async getStats(options = {}) {
    const emails = await this.list(options);
    
    return {
      total: emails.length,
      verified: emails.filter(e => e.verified).length,
      unverified: emails.filter(e => !e.verified).length,
      primary: emails.filter(e => e.primary).length,
      public: emails.filter(e => e.visibility === 'public').length,
      private: emails.filter(e => e.visibility === 'private').length
    };
  }

  /**
   * Bulk operation to add multiple emails with error handling
   * @param {Array<string>} emails - Email addresses to add
   * @param {Object} [options] - Options
   * @param {boolean} [options.continueOnError=false] - Continue adding other emails if some fail
   * @returns {Promise<Object>} Result with successful and failed emails
   */
  async bulkAdd(emails, options = {}) {
    if (!options.continueOnError) {
      // Add all at once - faster but all fail if any fail
      const result = await this.add(emails, options);
      return {
        successful: result,
        failed: []
      };
    }

    // Add one by one to handle individual failures
    const successful = [];
    const failed = [];

    for (const email of emails) {
      try {
        const result = await this.add(email, options);
        successful.push(...result);
      } catch (error) {
        failed.push({
          email,
          error: error.message
        });
      }
    }

    return { successful, failed };
  }

  /**
   * Bulk operation to delete multiple emails with error handling
   * @param {Array<string>} emails - Email addresses to delete
   * @param {Object} [options] - Options
   * @param {boolean} [options.continueOnError=false] - Continue deleting other emails if some fail
   * @returns {Promise<Object>} Result with successful and failed emails
   */
  async bulkDelete(emails, options = {}) {
    if (!options.continueOnError) {
      // Delete all at once - faster but all fail if any fail
      await this.delete(emails, options);
      return {
        successful: emails,
        failed: []
      };
    }

    // Delete one by one to handle individual failures
    const successful = [];
    const failed = [];

    for (const email of emails) {
      try {
        await this.delete(email, options);
        successful.push(email);
      } catch (error) {
        failed.push({
          email,
          error: error.message
        });
      }
    }

    return { successful, failed };
  }
}

/**
 * Export email API functions for direct usage
 */

/**
 * List email addresses for the authenticated user
 * @param {HttpClient} http - HTTP client instance
 * @param {Object} [options] - Request options
 * @returns {Promise<Array>} Array of email objects
 */
export async function list(http, options = {}) {
  const api = new EmailsAPI(http);
  return api.list(options);
}

/**
 * Add an email address for the authenticated user
 * @param {HttpClient} http - HTTP client instance
 * @param {string|Array<string>} emails - Email address(es) to add
 * @param {Object} [options] - Request options
 * @returns {Promise<Array>} Array of added email objects
 */
export async function add(http, emails, options = {}) {
  const api = new EmailsAPI(http);
  return api.add(emails, options);
}

/**
 * Delete an email address for the authenticated user
 * @param {HttpClient} http - HTTP client instance
 * @param {string|Array<string>} emails - Email address(es) to delete
 * @param {Object} [options] - Request options
 * @returns {Promise<void>}
 */
export async function deleteEmails(http, emails, options = {}) {
  const api = new EmailsAPI(http);
  return api.delete(emails, options);
}