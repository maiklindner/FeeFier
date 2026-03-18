/**
 * Decodes HTML entities in a string.
 * Supports numeric entities (decimal and hex) and common named entities.
 * @param {string} text The text to decode.
 * @returns {string} The decoded text.
 */
function decodeHTMLEntities(text) {
  if (!text || !text.includes('&')) return text;

  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&#39;': "'",
    '&nbsp;': ' ',
    '&auml;': 'ä', '&Auml;': 'Ä',
    '&ouml;': 'ö', '&Ouml;': 'Ö',
    '&uuml;': 'ü', '&Uuml;': 'Ü',
    '&szlig;': 'ß'
  };

  return text.replace(/&[a-z0-9#]+;/gi, (match) => {
    if (entities[match]) return entities[match];
    
    // Numeric entities
    if (match.startsWith('&#x')) {
      const hex = match.slice(3, -1);
      return String.fromCodePoint(parseInt(hex, 16));
    }
    if (match.startsWith('&#')) {
      const dec = match.slice(2, -1);
      return String.fromCodePoint(parseInt(dec, 10));
    }
    
    return match;
  });
}
