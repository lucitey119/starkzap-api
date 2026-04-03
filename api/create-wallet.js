import express from 'express';
import { PrivyClient } from '@privy-io/node';

const app = express();
const PORT = process.env.PORT || 3000;

const privy = new PrivyClient(
  process.env.PRIVY_APP_ID,
  process.env.PRIVY_APP_SECRET
);

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

app.post('/create-wallet', async (req, res) => {
  const authToken = req.headers.authorization?.replace('Bearer ', '');
  if (!authToken) return res.status(401).json({ error: 'Missing auth token' });

  try {
    const verifiedClaims = await privy.verifyAuthToken(authToken);

    const wallet = await privy.wallets().create({
      chain_type: 'starknet',
    });

    console.log(`✅ Starknet address: ${wallet.address}`);

    return res.json({
      success: true,
      address: wallet.address,
      walletId: wallet.id,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to create wallet' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
