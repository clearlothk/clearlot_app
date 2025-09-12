// 共用的表單樣式常數
export const FORM_STYLES = {
  // 輸入框基礎樣式
  inputBase: "w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200",
  inputError: "border-red-300",
  inputNormal: "border-gray-300",
  
  // 密碼輸入框樣式（包含右側按鈕）
  passwordInput: "w-full pl-12 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200",
  
  // 按鈕樣式
  primaryButton: "w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center",
  
  // 連結按鈕樣式
  linkButton: "text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors duration-200",
  
  // 返回按鈕樣式
  backButton: "flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-200",
  
  // 錯誤訊息樣式
  errorMessage: "flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg",
  
  // 圖示樣式
  iconInput: "absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400",
  iconButton: "absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
};

// 動態輸入框樣式函數
export const getInputClassName = (hasError: boolean, isPassword = false) => {
  const baseClass = isPassword ? FORM_STYLES.passwordInput : FORM_STYLES.inputBase;
  const errorClass = hasError ? FORM_STYLES.inputError : FORM_STYLES.inputNormal;
  return `${baseClass} ${errorClass}`;
};
