// api/webhook.js
const { MongoClient } = require('mongodb');

let cachedClient = null;

async function getMongoClient() {
  if (cachedClient && cachedClient.isConnected && cachedClient.isConnected()) return cachedClient;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  cachedClient = client;
  return client;
}

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(200).send('OK');
      return;
    }

    // Trello does a handshake GET/HEAD when registering webhook; handle that
    // If it's a HEAD request or empty body, respond 200
    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(200).send('noop');
      return;
    }

    // payload from Trello
    const payload = req.body;

    // TODO: اینجا منطق mirror را قرار بده
    // برای شروع: فقط payload را در یک collection لاگ کن
    const client = await getMongoClient();
    const db = client.db(); // DB از connection string گرفته می‌شود
    const col = db.collection('trello_webhook_logs');
    await col.insertOne({ receivedAt: new Date(), payload });

    // پاسخ سریع
    res.status(200).json({ status: 'received' });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: String(err) });
  }
};
