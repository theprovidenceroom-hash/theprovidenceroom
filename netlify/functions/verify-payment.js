const crypto = require('crypto');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = JSON.parse(event.body);

    // Validate all required fields present
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return {
        statusCode: 400, headers,
        body: JSON.stringify({ error: 'Missing required payment verification fields.' })
      };
    }

    // HMAC-SHA256 signature verification
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('Signature mismatch — possible fraud attempt');
      return {
        statusCode: 400, headers,
        body: JSON.stringify({ error: 'Payment verification failed. Signature mismatch.' })
      };
    }

    // Payment is genuine
    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        verified: true,
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        message: 'Payment verified successfully.',
      }),
    };
  } catch (error) {
    console.error('Verify payment error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Verification failed. Please contact us.' }) };
  }
};
