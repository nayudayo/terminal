import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth';
import { storeWalletSubmission } from '@/lib/db';
import { parseWalletCommand, validateWallets } from '@/lib/walletValidator';
import { WALLET_ERROR_MESSAGES } from '@/constants/messages';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { command } = await request.json();
    if (!command) {
      return NextResponse.json(
        { error: WALLET_ERROR_MESSAGES.GENERAL.SYNTAX },
        { status: 400 }
      );
    }

    const parsedCommand = parseWalletCommand(command);
    if (!parsedCommand) {
      return NextResponse.json(
        { error: WALLET_ERROR_MESSAGES.GENERAL.SYNTAX },
        { status: 400 }
      );
    }

    const { solanaAddress, nearAddress } = parsedCommand;

    // Validate both wallet addresses
    const validationResult = validateWallets(solanaAddress, nearAddress);
    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      );
    }

    await storeWalletSubmission(
      session.user.id,
      solanaAddress,
      nearAddress
    );

    return NextResponse.json({
      success: true,
      message: 'Wallet addresses stored successfully'
    });
  } catch (error) {
    console.error('Error storing wallet submission:', error);
    return NextResponse.json(
      { error: 'Failed to store wallet submission' },
      { status: 500 }
    );
  }
}
