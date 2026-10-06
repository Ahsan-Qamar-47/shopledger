/**
 * Formats a raw phone number into WhatsApp API compatible format with country code
 * @param {string} phone
 * @param {string} defaultCountryCode (e.g. '92' for Pakistan)
 * @returns {string} Cleaned international phone number digits
 */
export const formatWhatsAppNumber = (phone, defaultCountryCode = '92') => {
  if (!phone) return '';
  
  // Remove non-digit characters
  let digits = String(phone).replace(/\D/g, '');

  // If number starts with 0, replace 0 with country code
  if (digits.startsWith('0')) {
    digits = defaultCountryCode + digits.slice(1);
  } else if (digits.length <= 10 && !digits.startsWith(defaultCountryCode)) {
    digits = defaultCountryCode + digits;
  }

  return digits;
};

/**
 * Generates a WhatsApp click-to-chat URL
 * @param {string} phone 
 * @param {string} message 
 * @returns {string} WhatsApp direct link
 */
export const getWhatsAppLink = (phone, message = '') => {
  const formattedPhone = formatWhatsAppNumber(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}${encodedMessage ? `?text=${encodedMessage}` : ''}`;
};
