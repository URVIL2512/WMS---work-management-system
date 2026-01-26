import Settings from '../models/Settings.model.js';

// Cache for company settings
let settingsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get company settings with caching
 * @returns {Promise<Object>} Company settings object
 */
export const getCompanySettings = async () => {
  const now = Date.now();
  
  // Return cached settings if still valid
  if (settingsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return settingsCache;
  }
  
  // Fetch fresh settings from database
  try {
    const settings = await Settings.getSettings();
    settingsCache = settings.toObject();
    cacheTimestamp = now;
    return settingsCache;
  } catch (error) {
    console.error('Error fetching company settings:', error);
    // Return empty object if fetch fails
    return {};
  }
};

/**
 * Clear settings cache (call after updating settings)
 */
export const clearSettingsCache = () => {
  settingsCache = null;
  cacheTimestamp = null;
};
