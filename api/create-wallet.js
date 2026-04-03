import { PrivyClient } from '@privy-io/node';

const privy = new PrivyClient(
  process.env.PRIVY_APP_ID,
  process.env.PRIVY_APP_SECRET
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authToken = req.headers.authorization?.replace('Bearer ', '');
  if (!authToken) return res.status(401).json({ error: 'Missing auth token' });

  try {
    if (!process.env.PRIVY_APP_ID || !process.env.PRIVY_APP_SECRET) {
      return res.status(500).json({ error: 'Privy environment variables not set on Vercel' });
    }

    const verifiedClaims = await privy.verifyAuthToken(authToken);

    const wallet = await privy.wallets().create({
      chain_type: 'starknet',
    });

    return res.status(200).json({
      success: true,
      address: wallet.address,
      walletId: wallet.id,
    });

  } catch (err) {
    console.error("Full Privy error:", err);
    return res.status(500).json({ 
      error: err.message || 'Failed to create Starknet wallet. Check Vercel logs for details.' 
    });
  }
}
