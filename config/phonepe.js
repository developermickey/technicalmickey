const crypto = require('crypto');

const baseUrl = process.env.PHONEPE_BASE_URL || 'https://api.phonepe.com/apis/hermes';
const merchantId = process.env.PHONEPE_MERCHANT_ID || '';
const saltKey = process.env.PHONEPE_SALT_KEY || '';
const saltIndex = process.env.PHONEPE_SALT_INDEX || '1';

/**
 * PhonePe requires X-VERIFY header as sha256(base64Payload + apiPath + saltKey) + ### + saltIndex
 */
const buildPhonePeSignature = (base64Payload, apiPath) => {
  const stringToSign = `${base64Payload}${apiPath}${saltKey}`;
  const sha = crypto.createHash('sha256').update(stringToSign).digest('hex');
  return `${sha}###${saltIndex}`;
};

const buildPhonePePayload = (payload, apiPath = '/pg/v1/pay') => {
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
  const checksum = buildPhonePeSignature(base64Payload, apiPath);
  return { base64Payload, checksum };
};

const phonePeHeaders = (checksum) => ({
  'Content-Type': 'application/json',
  accept: 'application/json',
  'X-VERIFY': checksum,
  'X-MERCHANT-ID': merchantId,
});

module.exports = {
  baseUrl,
  merchantId,
  buildPhonePePayload,
  phonePeHeaders,
};
