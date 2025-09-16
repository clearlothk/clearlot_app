import { AuthUser } from '../types';

/**
 * Check if a user is active and can perform actions
 * @param user - The user object
 * @returns boolean - true if user is active, false otherwise
 */
export const isUserActive = (user: AuthUser | null): boolean => {
  if (!user) return false;
  return user.status === 'active' && user.emailVerified === true;
};

/**
 * Check if a user can access marketplace
 * @param user - The user object
 * @returns boolean - true if user can access marketplace, false otherwise
 */
export const canAccessMarketplace = (user: AuthUser | null): boolean => {
  return isUserActive(user);
};

/**
 * Check if a user can upload offers
 * @param user - The user object
 * @returns boolean - true if user can upload offers, false otherwise
 */
export const canUploadOffers = (user: AuthUser | null): boolean => {
  return isUserActive(user);
};

/**
 * Check if a user can make purchases
 * @param user - The user object
 * @returns boolean - true if user can make purchases, false otherwise
 */
export const canMakePurchases = (user: AuthUser | null): boolean => {
  return isUserActive(user);
};

/**
 * Check if a user can send messages
 * @param user - The user object
 * @returns boolean - true if user can send messages, false otherwise
 */
export const canSendMessages = (user: AuthUser | null): boolean => {
  return isUserActive(user);
};

/**
 * Check if a user can access watchlist
 * @param user - The user object
 * @returns boolean - true if user can access watchlist, false otherwise
 */
export const canAccessWatchlist = (user: AuthUser | null): boolean => {
  return isUserActive(user);
};

/**
 * Check if a user can access my orders
 * @param user - The user object
 * @returns boolean - true if user can access my orders, false otherwise
 */
export const canAccessMyOrders = (user: AuthUser | null): boolean => {
  return isUserActive(user);
};

/**
 * Check if a user needs email verification
 * @param user - The user object
 * @returns boolean - true if user needs email verification, false otherwise
 */
export const needsEmailVerification = (user: AuthUser | null): boolean => {
  if (!user) return false;
  return user.status === 'pending_verification' || !user.emailVerified;
};

/**
 * Get the restriction message for inactive users
 * @param user - The user object
 * @returns string - The restriction message
 */
export const getRestrictionMessage = (user: AuthUser | null): string => {
  if (!user) return 'Please log in to access this feature.';
  
  switch (user.status) {
    case 'inactive':
      return 'Your account has been deactivated. Please contact support for assistance.';
    case 'suspended':
      return 'Your account has been suspended. Please contact support for assistance.';
    case 'pending':
      return 'Your account is pending approval. Please wait for admin verification.';
    case 'pending_verification':
      return 'Please verify your email address to access this feature.';
    default:
      return 'Access denied. Please contact support for assistance.';
  }
};
