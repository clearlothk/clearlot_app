/**
 * Slug 工具函數
 * 用於生成和解析用戶專屬的 URL slug
 */

/**
 * 生成用戶專屬的 slug URL
 * @param userId 用戶 ID
 * @param pageName 頁面名稱
 * @returns 完整的 slug URL
 */
export const generateUserSlug = (userId: string, pageName: string): string => {
  return `/hk/${userId}/${pageName}`;
};

/**
 * 解析 slug URL 中的用戶 ID 和頁面名稱
 * @param slugPath slug 路徑 (例如: "/hk/user123/profile")
 * @returns 包含用戶 ID 和頁面名稱的對象
 */
export const parseUserSlug = (slugPath: string): { userId: string; pageName: string } | null => {
  const slugPattern = /^\/hk\/([^\/]+)\/([^\/]+)$/;
  const match = slugPath.match(slugPattern);
  
  if (match) {
    return {
      userId: match[1],
      pageName: match[2]
    };
  }
  
  return null;
};

/**
 * 檢查路徑是否為有效的用戶 slug
 * @param path 路徑
 * @returns 是否為有效的用戶 slug
 */
export const isValidUserSlug = (path: string): boolean => {
  return parseUserSlug(path) !== null;
};

/**
 * 生成用戶個人資料頁面的 slug
 * @param userId 用戶 ID
 * @returns 個人資料頁面的 slug
 */
export const generateProfileSlug = (userId: string): string => {
  return generateUserSlug(userId, 'profile');
};

/**
 * 生成用戶優惠頁面的 slug
 * @param userId 用戶 ID
 * @returns 優惠頁面的 slug
 */
export const generateOffersSlug = (userId: string): string => {
  return generateUserSlug(userId, 'offers');
};

/**
 * 生成用戶聯絡頁面的 slug
 * @param userId 用戶 ID
 * @returns 聯絡頁面的 slug
 */
export const generateContactSlug = (userId: string): string => {
  return generateUserSlug(userId, 'contact');
};

/**
 * 生成用戶評價頁面的 slug
 * @param userId 用戶 ID
 * @returns 評價頁面的 slug
 */
export const generateReviewsSlug = (userId: string): string => {
  return generateUserSlug(userId, 'reviews');
};

/**
 * 從當前路徑獲取用戶 ID
 * @param currentPath 當前路徑
 * @returns 用戶 ID 或 null
 */
export const getUserIdFromPath = (currentPath: string): string | null => {
  const parsed = parseUserSlug(currentPath);
  return parsed ? parsed.userId : null;
};

/**
 * 從當前路徑獲取頁面名稱
 * @param currentPath 當前路徑
 * @returns 頁面名稱或 null
 */
export const getPageNameFromPath = (currentPath: string): string | null => {
  const parsed = parseUserSlug(currentPath);
  return parsed ? parsed.pageName : null;
};

/**
 * 預定義的頁面名稱常量
 */
export const USER_PAGES = {
  PROFILE: 'profile',
  OFFERS: 'offers',
  CONTACT: 'contact',
  REVIEWS: 'reviews',
  ABOUT: 'about',
  GALLERY: 'gallery'
} as const;

export type UserPageName = typeof USER_PAGES[keyof typeof USER_PAGES];

/**
 * 檢查頁面名稱是否有效
 * @param pageName 頁面名稱
 * @returns 是否為有效的頁面名稱
 */
export const isValidPageName = (pageName: string): pageName is UserPageName => {
  return Object.values(USER_PAGES).includes(pageName as UserPageName);
};

/**
 * 生成用戶所有頁面的 slug 映射
 * @param userId 用戶 ID
 * @returns 包含所有頁面 slug 的對象
 */
export const generateAllUserSlugs = (userId: string) => {
  return {
    profile: generateProfileSlug(userId),
    offers: generateOffersSlug(userId),
    contact: generateContactSlug(userId),
    reviews: generateReviewsSlug(userId),
    about: generateUserSlug(userId, 'about'),
    gallery: generateUserSlug(userId, 'gallery')
  };
};

// 新增：生成所有應用頁面的 slug
export const generateAppPageSlugs = (userId: string) => {
  return {
    // 主要功能頁面（需要用戶 ID 的私有頁面）
    marketplace: generateUserSlug(userId, 'marketplace'),
    upload: generateUserSlug(userId, 'upload'),
    'my-offers': generateUserSlug(userId, 'my-offers'),
    'my-orders': generateUserSlug(userId, 'my-orders'),
    'company-settings': generateUserSlug(userId, 'company-settings'),
    watchlist: generateUserSlug(userId, 'watchlist'),
    notifications: generateUserSlug(userId, 'notifications'),
    messages: generateUserSlug(userId, 'messages'),
    
    // 個人資料頁面
    profile: generateProfileSlug(userId),
    offers: generateOffersSlug(userId),
  };
};

// 新增：生成特定頁面的 slug
export const generatePageSlug = (userId: string, pageName: string): string => {
  return generateUserSlug(userId, pageName);
};

// 新增：檢查當前用戶是否與 URL 中的用戶 ID 匹配
export const isCurrentUserPage = (currentUserId: string, urlUserId: string): boolean => {
  return currentUserId === urlUserId;
}; 