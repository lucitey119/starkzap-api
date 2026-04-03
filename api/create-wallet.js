import { PrivyClient } from '@privy-io/node';
import type { NextApiRequest, NextApiResponse } from 'next'; // if using Pages Router

const privy = new PrivyClient(
  process.env.PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // === CORS Headers (Critical for "Failed to fetch") ===
  res.setHeader('Access-Control-Allow-Origin', '*'); // ← Change to your frontend URL in production, e.g. 'https://yourapp.vercel.app'
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authToken = req.headers.authorization?.replace('Bearer ', '');
  if (!authToken) {
    return res.status(401).json({ error: 'Missing auth token' });
  }

  try {
    // Verify the token from frontend
    const verifiedClaims = await privy.verifyAuthToken(authToken);
    const userId = verifiedClaims.userId;

    // Create Starknet wallet (or get existing — Privy handles idempotency)
    const wallet = await privy.wallets().create({
      chain_type: 'starknet',   // Important: use snake_case
      // owner is automatically the userId from the verified token
    });

    console.log(`Starknet wallet created for user ${userId}:`, wallet.address);

    return res.status(200).json({
      address: wallet.address,
      walletId: wallet.id,        // Save this — useful later for signing
    });

  } catch (err: any) {
    console.error('Privy Starknet wallet error:', err);

    if (err.message?.includes('token') || err.code === 'invalid_token') {
      return res.status(401).json({ error: 'Invalid or expired auth token' });
    }

    return res.status(500).json({ 
      error: err.message || 'Failed to create Starknet wallet' 
    });
  }
}
