/**
 * SMS Parser — Strict UPI transaction detection and amount extraction
 *
 * Multi-layer validation:
 * 1. Must contain UPI context keyword (upi, gpay, phonepe, paytm, bhim)
 * 2. Must contain debit keyword (debited, spent, paid, sent, deducted, withdrawn)
 * 3. Must NOT contain reject keywords (otp, credited, received, balance, etc.)
 * 4. Amount must be a valid positive number
 */

// --- Regex patterns ---

// UPI platform/context indicators
const UPI_CONTEXT = /upi|gpay|phonepe|paytm|bhim|neft|imps/i;

// Debit/spend action keywords
const DEBIT_KEYWORDS = /debited|spent|paid|sent|deducted|withdrawn|purchase|payment/i;

// Reject keywords — OTPs, credits, balance inquiries
const REJECT_KEYWORDS = /otp|credited\s+to|credited\s+with|amount\s+credited|received\s+from|balance\s*(is|available|remaining)|your\s*available|limit\s+is|add\s*money|cashback|refund/i;

// Amount extraction — matches "Rs 80", "Rs. 1,250.50", "₹500", "INR 200.00"
const AMOUNT_REGEX = /(?:Rs\.?\s*|₹\s*|INR\s*)([\d,]+(?:\.\d{1,2})?)/i;

// --- Auto-category keyword map ---
const CATEGORY_KEYWORDS = {
  Food: [
    'swiggy', 'zomato', 'dominos', 'pizza', 'food', 'restaurant',
    'cafe', 'mcdonald', 'burger', 'kitchen', 'biryani', 'chai',
    'starbucks', 'kfc', 'subway', 'dunkin',
  ],
  Transport: [
    'uber', 'ola', 'rapido', 'metro', 'irctc', 'railway',
    'petrol', 'diesel', 'fuel', 'parking', 'toll', 'cab',
    'auto', 'rickshaw', 'flight', 'bus',
  ],
  Shopping: [
    'amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'nykaa',
    'mall', 'shop', 'store', 'mart', 'bazaar', 'reliance',
    'dmart', 'bigbasket', 'blinkit', 'zepto', 'instamart',
  ],
  Bills: [
    'electricity', 'electric', 'water', 'gas', 'broadband',
    'wifi', 'internet', 'jio', 'airtel', 'vi', 'bsnl',
    'recharge', 'postpaid', 'prepaid', 'rent', 'emi',
    'insurance', 'premium',
  ],
  Health: [
    'pharma', 'pharmacy', 'medical', 'hospital', 'clinic',
    'doctor', 'apollo', 'medplus', 'netmeds', '1mg',
    'healthkart', 'gym', 'fitness',
  ],
};

/**
 * Check if an SMS message is a valid UPI debit transaction
 * @param {string} message - SMS body text
 * @returns {boolean}
 */
export function isUpiTransaction(message) {
  if (!message || typeof message !== 'string') {
    return false;
  }

  // Step 1: Reject known false-positive patterns
  if (REJECT_KEYWORDS.test(message)) {
    return false;
  }

  // Step 2: Must have UPI context
  if (!UPI_CONTEXT.test(message)) {
    return false;
  }

  // Step 3: Must have debit/spend keywords
  if (!DEBIT_KEYWORDS.test(message)) {
    return false;
  }

  // Step 4: Must contain a parseable amount
  if (!AMOUNT_REGEX.test(message)) {
    return false;
  }

  return true;
}

/**
 * Extract and validate the transaction amount from an SMS
 * @param {string} message - SMS body text
 * @returns {number|null} - Validated amount or null
 */
export function extractAmount(message) {
  if (!message || typeof message !== 'string') {
    return null;
  }

  const match = message.match(AMOUNT_REGEX);
  if (!match || !match[1]) {
    return null;
  }

  // Remove commas and parse
  const raw = match[1].replace(/,/g, '');
  const amount = parseFloat(raw);

  // Validate: must be a real positive number
  if (isNaN(amount) || !isFinite(amount) || amount <= 0) {
    return null;
  }

  // Reject unreasonably large amounts (safety check for personal use)
  if (amount > 10000000) {
    return null;
  }

  // Round to 2 decimal places
  return Math.round(amount * 100) / 100;
}

/**
 * Generate a simple hash from sender + message body for duplicate detection
 * Uses a basic string hash — good enough for local dedup
 * @param {string} sender - SMS sender address
 * @param {string} body - SMS body text
 * @returns {string} - Hash string
 */
export function generateSmsHash(sender, body) {
  const str = `${sender || ''}:${body || ''}`.trim();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Include message length for extra uniqueness
  return `sms_${Math.abs(hash).toString(36)}_${str.length}`;
}

/**
 * Suggest a category based on keywords found in the SMS body
 * @param {string} message - SMS body text
 * @returns {string|null} - Suggested category or null
 */
export function suggestCategory(message) {
  if (!message || typeof message !== 'string') {
    return null;
  }

  const lowerMsg = message.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerMsg.includes(keyword)) {
        return category;
      }
    }
  }

  return null;
}
