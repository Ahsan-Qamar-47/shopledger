/**
 * Escapes regex special characters to prevent ReDoS / Regex Injection attacks
 * @param {string} string 
 * @returns {string}
 */
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

module.exports = { escapeRegex };
