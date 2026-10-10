/**
 * Formats a raw phone number into WhatsApp API compatible format with country code
 * @param {string} phone
 * @param {string} defaultCountryCode (e.g. '92' for Pakistan)
 * @returns {string} Cleaned international phone number digits
 */
export const formatPhoneForWhatsApp = (phone, defaultCountryCode = '92') => {
  if (!phone) return '';
  
  // Remove non-digit characters (strips spaces, dashes, +)
  let digits = String(phone).replace(/\D/g, '');

  // If number starts with 0, replace 0 with country code
  if (digits.startsWith('0')) {
    digits = defaultCountryCode + digits.slice(1);
  } else if (digits.length <= 10 && !digits.startsWith(defaultCountryCode)) {
    // If it's a raw number without 0 (e.g. 3001234567), append 92
    digits = defaultCountryCode + digits;
  }

  // If it already starts with 92, we leave it as is
  return digits;
};

/**
 * Generates a WhatsApp click-to-chat URL
 * @param {string} phone 
 * @param {string} message 
 * @returns {string} WhatsApp direct link
 */
export const getWhatsAppLink = (phone, message = '') => {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  if (!formattedPhone || formattedPhone.length < 10) return null; // Invalid phone indicator
  
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}${encodedMessage ? `?text=${encodedMessage}` : ''}`;
};
