// Date utilities for Hong Kong timezone (UTC+8)
export const HK_TIMEZONE = 'Asia/Hong_Kong';

/**
 * Get current time in Hong Kong timezone
 */
export const getCurrentHKTime = (): Date => {
  // 直接返回當前時間，因為格式化函數會處理時區轉換
  return new Date();
};

/**
 * Convert UTC date string to Hong Kong timezone
 */
export const convertToHKTime = (dateString: string): Date => {
  const utcDate = new Date(dateString);
  // 直接返回原始日期，因為 toLocaleString 已經會根據時區格式化
  return utcDate;
};

/**
 * Format date for Hong Kong locale (Traditional Chinese)
 */
export const formatHKDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  // Convert string to Date if needed
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    console.warn('Invalid date provided to formatHKDate:', date);
    return 'Invalid Date';
  }
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: HK_TIMEZONE,
    ...options
  };
  
  const formatted = dateObj.toLocaleDateString('zh-HK', defaultOptions);
  
  return formatted;
};

/**
 * Format time for Hong Kong locale (Traditional Chinese)
 */
export const formatHKTime = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  // Convert string to Date if needed
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    console.warn('Invalid date provided to formatHKTime:', date);
    return 'Invalid Time';
  }
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: HK_TIMEZONE,
    ...options
  };
  
  const formatted = date.toLocaleTimeString('zh-HK', defaultOptions);
  
  // 調試信息
  console.log('formatHKTime 調試:', {
    originalDate: date.toISOString(),
    timeZone: HK_TIMEZONE,
    formatted: formatted,
    options: defaultOptions
  });
  
  return formatted;
};

/**
 * Format date and time for Hong Kong locale (Traditional Chinese)
 */
export const formatHKDateTime = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: HK_TIMEZONE,
    ...options
  };
  
  return date.toLocaleString('zh-HK', defaultOptions);
};

/**
 * Get current timestamp in Hong Kong timezone as ISO string
 */
export const getCurrentHKTimestamp = (): string => {
  // 返回當前時間的 ISO 字符串，Firestore 會自動處理時區
  return new Date().toISOString();
};

/**
 * Convert date to Hong Kong timezone and format for display
 */
export const formatDateForDisplay = (dateString: string, format: 'date' | 'time' | 'datetime' = 'date'): string => {
  try {
    const hkDate = convertToHKTime(dateString);
    
    switch (format) {
      case 'date':
        return formatHKDate(hkDate);
      case 'time':
        return formatHKTime(hkDate);
      case 'datetime':
        return formatHKDateTime(hkDate);
      default:
        return formatHKDate(hkDate);
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return '時間格式錯誤';
  }
};

/**
 * Format relative time (e.g., "2小時前", "3天前")
 */
export const formatRelativeTime = (dateString: string): string => {
  try {
    const hkDate = convertToHKTime(dateString);
    const now = getCurrentHKTime();
    const diffInMs = now.getTime() - hkDate.getTime();
    
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMinutes < 1) {
      return '剛剛';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}分鐘前`;
    } else if (diffInHours < 24) {
      return `${diffInHours}小時前`;
    } else if (diffInDays < 7) {
      return `${diffInDays}天前`;
    } else {
      return formatHKDate(hkDate);
    }
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return '時間未知';
  }
};

/**
 * Check if a date is today
 */
export const isToday = (dateString: string): boolean => {
  try {
    const hkDate = convertToHKTime(dateString);
    const today = getCurrentHKTime();
    
    return hkDate.toDateString() === today.toDateString();
  } catch (error) {
    return false;
  }
};

/**
 * Get short date format (e.g., "9月3日")
 */
export const getShortDate = (dateString: string): string => {
  try {
    const hkDate = convertToHKTime(dateString);
    return formatHKDate(hkDate, { month: 'short', day: 'numeric' });
  } catch (error) {
    return '日期未知';
  }
};

/**
 * Get short time format (e.g., "14:30")
 */
export const getShortTime = (dateString: string): string => {
  try {
    const hkDate = convertToHKTime(dateString);
    return formatHKTime(hkDate, { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    return '時間未知';
  }
}; 