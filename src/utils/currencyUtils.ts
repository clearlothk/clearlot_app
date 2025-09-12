// Currency formatting utilities
export const formatCurrency = (amount: number, currency: string = 'HKD'): string => {
  if (currency === 'HKD') {
    return new Intl.NumberFormat('en-HK', {
      style: 'currency',
      currency: 'HKD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
  
  // Default formatting for other currencies
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatCurrencyCompact = (amount: number, currency: string = 'HKD'): string => {
  if (currency === 'HKD') {
    return new Intl.NumberFormat('en-HK', {
      style: 'currency',
      currency: 'HKD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(amount);
}; 