// Phone number utilities for Hong Kong phone numbers (+852)

/**
 * Validates a Hong Kong phone number (8 digits after +852)
 * @param phone - The phone number to validate (can include +852 prefix)
 * @returns true if valid, false otherwise
 */
export const validateHongKongPhone = (phone: string): boolean => {
  if (!phone.trim()) return false;
  
  // Remove +852 prefix and spaces for validation
  const phoneNumber = phone.replace(/^\+852\s*/, '').replace(/\s/g, '');
  return /^\d{8}$/.test(phoneNumber);
};

/**
 * Formats a phone number for display (adds +852 prefix if not present)
 * @param phone - The phone number to format
 * @returns Formatted phone number with +852 prefix
 */
export const formatPhoneForDisplay = (phone: string): string => {
  if (!phone.trim()) return '';
  
  // Remove +852 prefix and spaces, then add it back
  const phoneNumber = phone.replace(/^\+852\s*/, '').replace(/\s/g, '');
  return `+852 ${phoneNumber}`;
};

/**
 * Normalizes a phone number for storage (removes +852 prefix and spaces)
 * @param phone - The phone number to normalize
 * @returns Normalized phone number (8 digits only)
 */
export const normalizePhoneForStorage = (phone: string): string => {
  if (!phone.trim()) return '';
  
  // Remove +852 prefix and spaces
  return phone.replace(/^\+852\s*/, '').replace(/\s/g, '');
};

/**
 * Gets the error message for phone validation
 * @param phone - The phone number to validate
 * @returns Error message or empty string if valid
 */
export const getPhoneErrorMessage = (phone: string): string => {
  if (!phone.trim()) {
    return '請輸入電話號碼';
  }
  
  if (!validateHongKongPhone(phone)) {
    return '電話號碼必須是8位數字';
  }
  
  return '';
};

/**
 * Filters input to only allow numbers
 * @param value - The input value to filter
 * @returns Filtered value with only numbers
 */
export const filterPhoneInput = (value: string): string => {
  return value.replace(/[^0-9]/g, '');
}; 