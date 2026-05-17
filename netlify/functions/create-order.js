const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

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
    const { amount, reading, clientName } = JSON.parse(event.body);

    // Validate amount — minimum 100 paise (₹1)
    const amountPaise = parseInt(amount) * 100;
    if (!amountPaise || amountPaise < 100) {
      return {
        statusCode: 400, headers,
        body: JSON.stringify({ error: 'Invalid amount. Minimum ₹1 required.' })
      };
    }

    const receipt = `tpr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes: {
        reading_type: reading || 'Tarot Reading',
        client_name: clientName || 'Anonymous',
        business: 'The Providence Room',
      },
    });

    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      }),
    };
  } catch (error) {
    console.error('Create order error:', error);
    if (error.statusCode === 401) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Authentication failed. Check Razorpay credentials.' }) };
    }
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to create order. Please try again.' }) };
  }
};
