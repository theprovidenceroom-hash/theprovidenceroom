exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const { name, channel, focus, reading, format, amount, paymentId, message } = JSON.parse(event.body);

    const today = new Date().toISOString().split('T')[0];
    const body = {
      parent: { database_id: process.env.NOTION_DB_ID },
      properties: {
        Name:              { title: [{ text: { content: name || 'Anonymous' } }] },
        Status:            { select: { name: 'Active' } },
        'Contact Channel': { select: { name: channel === 'Stay anonymous' ? 'WhatsApp' : (channel || 'WhatsApp') } },
        'Focus Area':      { rich_text: [{ text: { content: focus || '' } }] },
        'Consent Given':   { checkbox: true },
        'Total Sessions':  { number: 0 },
        'Private Notes':   { rich_text: [{ text: { content: `Reading: ${reading} | Format: ${format} | Payment: ${paymentId} | Amount: ₹${amount}${message ? ' | Notes: ' + message : ''}` } }] },
        'Last Session Date': { date: { start: today } },
      }
    };

    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error('Notion error:', err);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to create Notion record' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error('Notion function error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
