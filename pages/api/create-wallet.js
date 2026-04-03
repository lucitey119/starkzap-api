import { PrivyClient } from '@privy-io/node';

const privy = new PrivyClient(
  process.env.PRIVY_APP_ID,
  process.env.PRIVY_APP_SECRET
);

export default async function handler(req, res) {
  // CORS headers - fixes "Failed to fetch"
  res.setHeader('Access-Control-Allow-Origin', '*'); // Change to your frontend domain in production
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
    // Verify the token from frontend (Google login)
    const verifiedClaims = await privy.verifyAuthToken(authToken);

    // Create Starknet wallet (Privy returns the same address if it already exists)
    const wallet = await privy.wallets().create({
      chain_type: 'starknet',
    });

    console.log(`✅ Starknet address generated for user ${verifiedClaims.userId}: ${wallet.address}`);

    return res.status(200).json({
      success: true,
      address: wallet.address,
      walletId: wallet.id,
    });

  } catch (err) {
    console.error('Privy Starknet error:', err);

    if (err.message?.toLowerCase().includes('token') || err.code === 'invalid_token') {
      return res.status(401).json({ error: 'Invalid or expired auth token' });
    }

    return res.status(500).json({ 
      error: err.message || 'Failed to create Starknet wallet' 
    });
  }
}
