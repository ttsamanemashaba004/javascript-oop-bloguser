import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import webhookRoutes from './routes/webhook.js';
import paystackRoutes from './routes/paystack.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ message: 'Nail Booking System Running' });
});

// Test route
app.post('/test', (req, res) => {
  console.log('Test route hit:', req.body);
  res.send('OK');
});

// Register webhook routes
app.use('/webhook', webhookRoutes);
app.use('/webhook', paystackRoutes);

// Register admin routes
app.use('/admin', adminRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('\nRegistered routes:');
  console.log('  GET /');
  console.log('  POST /test');
  console.log('  POST /webhook/whatsapp');
  console.log('  GET /webhook/whatsapp');
  console.log('  GET /webhook/paystack-callback');
  console.log('  POST /webhook/paystack-webhook');
  console.log('  GET /admin/clear-conversations');
});
