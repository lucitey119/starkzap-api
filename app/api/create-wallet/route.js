import { PrivyClient } from '@privy-io/node';
import { NextResponse } from 'next/server';

const privy = new PrivyClient(
  process.env.PRIVY_APP_ID,
  process.env.PRIVY_APP_SECRET
);

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

export async function POST(request) {
  const authToken = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!authToken) {
    return NextResponse.json({ error: 'Missing auth token' }, { 
      status: 401,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const verifiedClaims = await privy.verifyAuthToken(authToken);

    const wallet = await privy.wallets().create({
      chain_type: 'starknet',
    });

    console.log(`✅ Starknet address generated: ${wallet.address}`);

    return NextResponse.json({
      success: true,
      address: wallet.address,
      walletId: wallet.id,
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    console.error('Privy Starknet error:', err);

    if (err.message?.toLowerCase().includes('token')) {
      return NextResponse.json({ error: 'Invalid or expired auth token' }, { 
        status: 401,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    return NextResponse.json({ 
      error: err.message || 'Failed to create Starknet wallet' 
    }, { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}
