const express = require('express');
const payment = require('../services/payment');
const db = require('../services/database');

const router = express.Router();

// Initialize a Paystack payment for a package purchase
router.post('/payments/initiate', async (req, res) => {
  try {
    const { email, amount, package: packageName, metadata } = req.body || {};

    if (!email || !amount) {
      return res.status(400).json({ error: 'email and amount are required' });
    }

    const init = await payment.initializePayment(amount, email, {
      ...metadata,
      package_name: packageName || metadata?.package_name || 'basic',
      type: 'subscription_package'
    });

    if (!init.success) {
      return res.status(400).json({ error: init.error || 'Failed to initialize payment' });
    }

    return res.json({
      authorization_url: init.data.authorization_url,
      reference: init.data.reference
    });
  } catch (error) {
    console.error('Public initiate payment error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify a Paystack payment by reference
router.get('/payments/verify', async (req, res) => {
  try {
    const { reference } = req.query;
    if (!reference) {
      return res.status(400).json({ error: 'reference is required' });
    }

    const verification = await payment.verifyPayment(reference);
    if (!verification.success) {
      return res.status(400).json({ error: verification.error || 'Verification failed' });
    }

    return res.json({
      success: true,
      data: verification.data
    });
  } catch (error) {
    console.error('Public verify payment error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Public signup endpoint (placeholder without DB writes)
router.post('/signup', async (req, res) => {
  try {
    const { name, email, company, password, reference } = req.body || {};
    if (!name || !email || !company || !password) {
      return res.status(400).json({ error: 'name, email, company, password are required' });
    }

    // Optionally verify payment reference if provided
    if (reference) {
      const verification = await payment.verifyPayment(reference);
      if (!(verification.success && (verification.data?.status === 'success' || verification.data?.status === 'successful'))) {
        return res.status(402).json({ error: 'Payment not verified' });
      }
    }

    // Create a salon stub for onboarding
    const salon = await db.createSalon({ name: company });
    await db.setDefaultOperatingHours(salon.id);

    // TODO: Create a user record and link to salon (out of scope for now)

    return res.status(201).json({ success: true, salon_id: salon.id });
  } catch (error) {
    console.error('Public signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

// Onboarding: create services, staff, and basic settings
// POST /public/onboarding { salon_id, salon_name?, deposit_amount_cents?, services[], staff[] }
router.post('/onboarding', async (req, res) => {
  try {
    const { salon_id, salon_name, deposit_amount_cents = 0, services = [], staff = [] } = req.body || {};

    if (!salon_id) {
      return res.status(400).json({ error: 'salon_id is required' });
    }

    // Update salon if name/deposit provided
    if (salon_name || typeof deposit_amount_cents === 'number') {
      await db.updateSalon(salon_id, {
        ...(salon_name ? { name: salon_name } : {}),
        ...(typeof deposit_amount_cents === 'number' ? { deposit_amount_cents } : {})
      });
    }

    // Create services/staff
    const createdServices = await db.createServices(salon_id, services);
    const createdStaff = await db.createStaff(salon_id, staff);

    return res.json({ success: true, services: createdServices, staff: createdStaff });
  } catch (error) {
    console.error('Public onboarding error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


