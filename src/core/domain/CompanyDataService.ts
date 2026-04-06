// src/core/domain/CompanyDataService.ts
import type { CompanyData } from './types';
import { CompanyDataRepository } from '../repositories/CompanyDataRepository';
import { logger } from '../common/Logger';

export interface CompanyDataConfig {
  commissionBasis?: 'TOTAL_PRICE' | 'RENTAL_ONLY';
  appName?: string;
  phone?: string;
  cnpj?: string;
}

export class CompanyDataService {
  private static cachedConfig: CompanyData | null = null;
  private static cacheExpiry: number = 0;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get company configuration with validation (replaces in-memory defaults)
   */
  static async getValidatedConfig(): Promise<CompanyData> {
    try {
      // Check cache first
      const now = Date.now();
      if (this.cachedConfig && now < this.cacheExpiry) {
        return this.cachedConfig;
      }

      // Fetch from repository
      const config = await CompanyDataRepository.getInstance().get();
      
      if (!config) {
        logger.warn('No company configuration found, using defaults');
        throw new Error('Company configuration is required but not found');
      }

      // Validate required fields
      const validationErrors = this.validateConfig(config);
      if (validationErrors.length > 0) {
        throw new Error(`Invalid company configuration: ${validationErrors.join(', ')}`);
      }

      // Cache the validated config
      this.cachedConfig = config;
      this.cacheExpiry = now + this.CACHE_DURATION;

      logger.debug('Company configuration loaded and cached', {
        commissionBasis: config.commissionBasis,
        appName: config.appName
      });

      return config;

    } catch (error) {
      logger.error('Failed to get company configuration', error as Error);
      throw new Error('Unable to load company configuration');
    }
  }

  /**
   * Validate company configuration
   */
  static validateConfig(config: CompanyData): string[] {
    const errors: string[] = [];

    if (!config.commissionBasis) {
      errors.push('Commission basis is required');
    }

    if (!['TOTAL_PRICE', 'RENTAL_ONLY'].includes(config.commissionBasis || 'RENTAL_ONLY')) {
      errors.push('Invalid commission basis. Must be TOTAL_PRICE or RENTAL_ONLY');
    }

    if (!(config.appName && config.appName.trim().length > 0)) {
      errors.push('App name is required');
    }

    if (!(config.phone && config.phone.trim().length > 0)) {
      errors.push('Company phone is required');
    }

    return errors;
  }

  /**
   * Get commission basis with fallback
   */
  static async getCommissionBasis(): Promise<'TOTAL_PRICE' | 'RENTAL_ONLY'> {
    try {
      const config = await this.getValidatedConfig();
      return config.commissionBasis || 'RENTAL_ONLY';
    } catch (error) {
      logger.warn('Failed to get commission basis, using fallback', error as Error);
      return 'RENTAL_ONLY';
    }
  }

  /**
   * Get reservation fee percentage
   */
  static async getReservationFeePercentage(): Promise<number> {
    try {
      const config = await this.getValidatedConfig();
      return config.reservationFeePercentage || 0;
    } catch (error) {
      logger.warn('Failed to get reservation fee percentage, using fallback', error as Error);
      return 0;
    }
  }

  /**
   * Update company configuration
   */
  static async updateConfig(updates: CompanyDataConfig): Promise<CompanyData> {
    try {
      const currentConfig = await this.getValidatedConfig();
      const updatedConfig = { ...currentConfig, ...updates };

      // Validate updated config
      const validationErrors = this.validateConfig(updatedConfig);
      if (validationErrors.length > 0) {
        throw new Error(`Invalid configuration updates: ${validationErrors.join(', ')}`);
      }

      // Save to repository
      await CompanyDataRepository.getInstance().update(updatedConfig);

      // Clear cache to force refresh
      this.cachedConfig = null;
      this.cacheExpiry = 0;

      logger.info('Company configuration updated', {
        updates: Object.keys(updates),
        newConfig: updatedConfig
      });

      return updatedConfig;

    } catch (error) {
      logger.error('Failed to update company configuration', error as Error);
      throw new Error('Unable to update company configuration');
    }
  }

  /**
   * Clear cache (useful after configuration changes)
   */
  static clearCache(): void {
    this.cachedConfig = null;
    this.cacheExpiry = 0;
    logger.debug('Company configuration cache cleared');
  }

  /**
   * Check if configuration is loaded and valid
   */
  static async isConfigurationValid(): Promise<boolean> {
    try {
      await this.getValidatedConfig();
      return true;
    } catch (error) {
      logger.debug('Company configuration validation failed', error as Error);
      return false;
    }
  }

  /**
   * Get required configuration fields (throws if missing)
   */
  static async getRequiredConfig(): Promise<{
    commissionBasis: 'TOTAL_PRICE' | 'RENTAL_ONLY';
    appName: string;
    phone: string;
    reservationFeePercentage: number;
  }> {
    const config = await this.getValidatedConfig();
    
    return {
      commissionBasis: config.commissionBasis as 'TOTAL_PRICE' | 'RENTAL_ONLY',
      appName: config.appName,
      phone: config.phone,
      reservationFeePercentage: config.reservationFeePercentage || 0
    };
  }
}
