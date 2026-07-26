import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Asaas API configuration
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || process.env.VITE_ASAAS_API_KEY || '';
const ASAAS_BASE_URL = process.env.ASAAS_ENV === 'production' 
  ? 'https://www.asaas.com/api/v3'
  : 'https://sandbox.asaas.com/api/v3';

// ---------------- Asaas API Proxy Endpoints ----------------

// Check Asaas Integration Status
app.get('/api/asaas/config', (req, res) => {
  res.json({
    configured: Boolean(ASAAS_API_KEY),
    environment: process.env.ASAAS_ENV || 'sandbox',
    apiUrl: ASAAS_BASE_URL,
  });
});

// Create Customer in Asaas
app.post('/api/asaas/create-customer', async (req, res) => {
  try {
    const { name, email, cpfCnpj, phone } = req.body;

    if (!ASAAS_API_KEY) {
      // Mock Customer creation when API Key isn't present
      return res.json({
        success: true,
        id: `cus_mock_${Date.now()}`,
        name,
        email,
        isMock: true,
      });
    }

    const response = await fetch(`${ASAAS_BASE_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY,
      },
      body: JSON.stringify({
        name: name || email.split('@')[0],
        email,
        cpfCnpj: cpfCnpj || '00000000000',
        phone,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: data });
    }

    return res.json({ success: true, ...data });
  } catch (error: any) {
    console.error('Asaas Customer Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Create Payment in Asaas (PIX / Credit Card / Boleto / Payment Link)
app.post('/api/asaas/create-payment', async (req, res) => {
  try {
    const { customerId, value, billingType, description, planId, email } = req.body;

    if (!ASAAS_API_KEY) {
      // Mock Payment response when ASAAS_API_KEY is not set yet
      const mockPaymentId = `pay_mock_${Date.now()}`;
      return res.json({
        success: true,
        isMock: true,
        id: mockPaymentId,
        status: 'PENDING',
        value: value || 29.90,
        billingType: billingType || 'PIX',
        invoiceUrl: '#',
        pixQrCode: {
          encodedImage: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          payload: '00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426614174000520400005303986540529.905802BR5915SaaS Financeiro6009SAO PAULO62070503***6304E2CA',
          expirationDate: new Date(Date.now() + 3600000).toISOString(),
        },
      });
    }

    // Call real Asaas API
    const response = await fetch(`${ASAAS_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY,
      },
      body: JSON.stringify({
        customer: customerId,
        billingType: billingType || 'UNDEFINED',
        value,
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        description: description || `Assinatura SaaS Financeiro - Plano ${planId}`,
        externalReference: `${planId}_${email}`,
      }),
    });

    const paymentData = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: paymentData });
    }

    // If PIX, fetch Pix QR Code details
    let pixDetails = null;
    if (billingType === 'PIX' && paymentData.id) {
      const pixResp = await fetch(`${ASAAS_BASE_URL}/payments/${paymentData.id}/pixQrCode`, {
        headers: { 'access_token': ASAAS_API_KEY },
      });
      if (pixResp.ok) {
        pixDetails = await pixResp.json();
      }
    }

    return res.json({
      success: true,
      ...paymentData,
      pixQrCode: pixDetails,
    });
  } catch (error: any) {
    console.error('Asaas Payment Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Check Payment Status in Asaas
app.get('/api/asaas/payment-status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!ASAAS_API_KEY || paymentId.startsWith('pay_mock_')) {
      return res.json({
        success: true,
        id: paymentId,
        status: 'RECEIVED', // Mock auto-confirmation for testing
        isMock: true,
      });
    }

    const response = await fetch(`${ASAAS_BASE_URL}/payments/${paymentId}`, {
      headers: { 'access_token': ASAAS_API_KEY },
    });

    const data = await response.json();
    return res.json({ success: true, ...data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Asaas Webhook endpoint
app.post('/api/asaas/webhook', (req, res) => {
  const { event, payment } = req.body;
  console.log(`[Asaas Webhook] Event: ${event}`, payment?.id);
  // Returns 200 OK to Asaas
  return res.status(200).json({ received: true });
});

// ---------------- Vite / Static Server ----------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
