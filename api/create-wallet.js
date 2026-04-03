import { PrivyClient } from '@privy-io/node';

const privy = new PrivyClient(
  process.env.PRIVY_APP_ID,
  process.env.PRIVY_APP_SECRET
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const authToken = req.headers.authorization?.replace('Bearer ', '');
  if (!authToken) {
    return res.status(401).json({ error: 'Missing auth token' });
  }

  try {
    const verifiedClaims = await privy.verifyAuthToken(authToken);
    const userId = verifiedClaims.userId;

    const user = await privy.getUser(userId);
    const existing = user.linkedAccounts?.find(
      (acc) => acc.type === 'wallet' && acc.chainType === 'starknet'
    );

    if (existing?.address) {
      return res.status(200).json({ address: existing.address });
    }

    const wallet = await privy.walletApi.create({
      chainType: 'starknet',
      userId,
    });

    return res.status(200).json({ address: wallet.address });

  } catch (err) {
    console.error('Error:', err);
    if (err.message?.includes('token')) {
      return res.status(401).json({ error: 'Invalid or expired auth token' });
    }
    return res.status(500).json({ error: err.message });
  }
}
