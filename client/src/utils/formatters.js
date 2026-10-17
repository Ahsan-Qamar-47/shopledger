/**
 * Formats a numeric value into currency representation (e.g., "Rs. 15,000")
 * @param {number|string} amount
 * @param {string} currencySymbol
 * @returns {string}
 */
export const formatCurrency = (amount, currencySymbol = 'Rs. ') => {
  const numericVal = Number(amount) || 0;
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2
  }).format(numericVal);
  return `${currencySymbol}${formatted}`;
};

/**
 * Formats a date string or Date object into "DD-MMM-YY" format (e.g., "12-Oct-23")
 * @param {Date|string|number} dateInput
 * @returns {string}
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2);

  return `${day}-${month}-${year}`;
};

export const COLORS = [
  '#0B6B5D',
  '#7B5EA7',
  '#C2570C',
  '#1D6FB8',
  '#B4325A',
  '#4D7C0F',
  '#8A6D1F'
];

export const colorFor = (s) => {
  if (!s) return COLORS[0];
  const charSum = [...s].reduce((a, c) => a + c.charCodeAt(0), 0);
  return COLORS[charSum % COLORS.length];
};

export const initials = (n) => {
  if (!n) return 'S';
  return n
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
};

export const dateFmt = formatDate;
export const fmt = formatCurrency;

