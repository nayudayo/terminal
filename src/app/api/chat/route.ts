import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth';
import { initDb, generateReferralCode } from '@/lib/db';


const HELP_MESSAGE = `
[ACQUISITION PROTOCOL INITIALIZED]
================================

REQUIRED STEPS: [1/5]
--------------------
1. MANDATES [PENDING]
   >TYPE "mandates" TO BEGIN
   >TYPE "skip mandates" TO BYPASS

2. TELEGRAM SYNC [LOCKED]
3. VERIFICATION CODE [LOCKED]
4. WALLET SUBMISSION [LOCKED]
5. REFERENCE CODE [LOCKED]

>COMPLETE STEPS IN SEQUENCE
>EXACT SYNTAX REQUIRED
`;

const MANDATES_MESSAGE = `
[MANDATE PROTOCOL INITIATED]
===========================

STEP [1/5]: MANDATES
-------------------
TWO (2) MANDATES MUST BE FULFILLED:

1. FOLLOW MANDATE [PENDING]
   >TYPE "follow ptb" TO EXECUTE

2. LIKE MANDATE [PENDING]
   >TYPE "like ptb" TO EXECUTE

BYPASS OPTION:
-------------
>TYPE "skip mandates" TO BYPASS ALL MANDATES

WARNING: EXACT SYNTAX REQUIRED
AWAITING USER INPUT...
`;

const TELEGRAM_MESSAGE = `
[TELEGRAM SYNC PROTOCOL INITIATED]
================================

STEP [2/5]: TELEGRAM SYNC
------------------------
SYNC REQUIREMENTS:
1. JOIN TELEGRAM GROUP
   >TYPE "join telegram" TO PROCEED
   >TYPE "skip telegram" TO BYPASS

BYPASS OPTION:
-------------
>TYPE "skip telegram" TO BYPASS

WARNING: EXACT SYNTAX REQUIRED
AWAITING USER INPUT...
`;

const VERIFICATION_MESSAGE = `
[VERIFICATION PROTOCOL INITIATED]
================================

STEP [3/5]: VERIFICATION CODE
---------------------------
VERIFICATION REQUIREMENTS:
1. ENTER VERIFICATION CODE
   >TYPE "verify <code>" TO PROCEED
   >TYPE "skip verify" TO BYPASS

WARNING: EXACT SYNTAX REQUIRED
AWAITING USER INPUT...
`;

const WALLET_MESSAGE = `
[WALLET SUBMISSION PROTOCOL INITIATED]
====================================

STEP [4/5]: WALLET SUBMISSION
---------------------------
SUBMISSION REQUIREMENTS:
1. ENTER WALLET ADDRESS
   >TYPE "wallet <address>" TO PROCEED
   >TYPE "skip wallet" TO BYPASS

WARNING: EXACT SYNTAX REQUIRED
AWAITING USER INPUT...
`;

const REFERENCE_MESSAGE = `
[REFERENCE CODE PROTOCOL INITIATED]
==================================

STEP [5/5]: REFERENCE CODE
-------------------------
SELECT ACTION:
1. GENERATE NEW CODE
   >TYPE "generate code" TO CREATE

2. SUBMIT EXISTING CODE
   >TYPE "submit code <CODE>" TO VERIFY
   >TYPE "skip reference" TO BYPASS

WARNING: EXACT SYNTAX REQUIRED
AWAITING USER INPUT...
`;

const AUTHENTICATED_MESSAGE = `[SYSTEM STATUS: AUTHENTICATED]
=============================

DIGITAL BRIDGE PROTOCOL v2.1
---------------------------
STATUS: ACTIVE
SIGNAL: STRONG
FREQUENCY: STABILIZED

X NETWORK INTERFACE
------------------
SYNC: COMPLETE
ACCESS: GRANTED
CLEARANCE: LEVEL 3

[ACQUISITION PROTOCOL INITIALIZED]
================================

REQUIRED STEPS: [1/5]
--------------------
1. MANDATES [PENDING]
   >TYPE "mandates" TO BEGIN
   >TYPE "skip mandates" TO BYPASS

2. TELEGRAM SYNC [LOCKED]
3. VERIFICATION CODE [LOCKED]
4. WALLET SUBMISSION [LOCKED]
5. REFERENCE CODE [LOCKED]

>COMPLETE STEPS IN SEQUENCE
>EXACT SYNTAX REQUIRED
>TYPE "help" TO SHOW THIS MESSAGE AGAIN`;

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    const session = await getServerSession(authOptions);

    // Handle help command
    if (message.toLowerCase() === 'help') {
      return NextResponse.json({
        message: HELP_MESSAGE
      });
    }

    // Handle skip mandates command
    if (message.toLowerCase() === 'skip mandates') {
      if (!session) {
        return NextResponse.json({
          message: 'ERROR: X NETWORK CONNECTION REQUIRED\nPLEASE CONNECT X ACCOUNT FIRST'
        });
      }
      return NextResponse.json({
        message: `[MANDATE PROTOCOL BYPASSED]
=============================
BYPASS AUTHORIZED
SKIPPING MANDATE VERIFICATION...

ACQUISITION STATUS UPDATED:
-------------------------
1. MANDATES [BYPASSED]
2. TELEGRAM SYNC [UNLOCKED]
   >TYPE "telegram" TO PROCEED
   >TYPE "skip telegram" TO BYPASS
3. VERIFICATION CODE [LOCKED]
4. WALLET SUBMISSION [LOCKED]
5. REFERENCE CODE [LOCKED]

>PROCEED TO NEXT STEP`,
        commandComplete: true
      });
    }


    // Handle Twitter connection command
    if (message.toLowerCase() === 'connect x account') {
      if (session) {
        return NextResponse.json({
          message: AUTHENTICATED_MESSAGE.replace('ACCESS: GRANTED', `ACCESS: GRANTED\nUSER: ${session.user.name}`)
        });
      } else {
        return NextResponse.json({
          message: '[INITIATING X NETWORK SYNC]\nRedirecting to authorization...',
          action: 'CONNECT_TWITTER'
        });
      }
    }

    // Handle mandates command
    if (message.toLowerCase() === 'mandates') {
      if (!session) {
        return NextResponse.json({
          message: 'ERROR: X NETWORK CONNECTION REQUIRED\nPLEASE CONNECT X ACCOUNT FIRST'
        });
      }
      return NextResponse.json({
        message: MANDATES_MESSAGE
      });
    }

    // Handle follow command
    if (message.toLowerCase() === 'follow ptb') {
      if (!session) {
        return NextResponse.json({
          message: 'ERROR: X NETWORK CONNECTION REQUIRED'
        });
      }
      try {
        const response = await fetch('/api/twitter/follow', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({ userId: '1544715379855036418' }),
        });
        
        if (response.ok) {
          return NextResponse.json({
            message: `[FOLLOW MANDATE COMPLETE]
=============================

STEP [1/5]: MANDATES
-------------------
MANDATE STATUS:
1. FOLLOW PTB [COMPLETE] ■
2. LIKE PTB [PENDING] □

BYPASS OPTIONS:
-------------
>TYPE "skip like" TO BYPASS REMAINING MANDATE
>TYPE "skip mandates" TO BYPASS ALL MANDATES

>PROCEED WITH REMAINING MANDATE`,
            commandComplete: true,
            shouldAutoScroll: true
          });
        } else {
          return NextResponse.json({
            message: 'ERROR: FOLLOW MANDATE FAILED\nPLEASE TRY AGAIN'
          });
        }
      } catch (error) {
        console.error(error);
        return NextResponse.json({
          message: 'ERROR: FOLLOW MANDATE FAILED\nPLEASE TRY AGAIN'
        });
      }
    }

    // Handle like command
    if (message.toLowerCase() === 'like ptb') {
      if (!session) {
        return NextResponse.json({
          message: 'ERROR: X NETWORK CONNECTION REQUIRED'
        });
      }
      try {
        const response = await fetch('/api/twitter/like', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({ tweetId: 'target-tweet-id' }),
        });
        
        if (response.ok) {
          return NextResponse.json({
            message: `[MANDATE PROTOCOL COMPLETE]
=============================
ALL MANDATES FULFILLED

STEP STATUS: [1/5] COMPLETE
--------------------------
MANDATES:
1. FOLLOW PTB [COMPLETE] ■
2. LIKE PTB [COMPLETE] 

ACQUISITION STATUS UPDATED:
-------------------------
1. MANDATES [COMPLETE]
2. TELEGRAM SYNC [UNLOCKED]
   >TYPE "telegram" TO PROCEED
3. VERIFICATION CODE [LOCKED]
4. WALLET SUBMISSION [LOCKED]
5. REFERENCE CODE [LOCKED]

>PROCEED TO NEXT STEP`,
            commandComplete: true,
            shouldAutoScroll: true
          });
        } else {
          return NextResponse.json({
            message: 'ERROR: LIKE MANDATE FAILED\nPLEASE TRY AGAIN'
          });
        }
      } catch (error) {
        console.error(error);
        return NextResponse.json({
          message: 'ERROR: LIKE MANDATE FAILED\nPLEASE TRY AGAIN'
        });
      }
    }

    // Handle telegram command
    if (message.toLowerCase() === 'telegram') {
      if (!session) {
        return NextResponse.json({
          message: 'ERROR: X NETWORK CONNECTION REQUIRED\nPLEASE CONNECT X ACCOUNT FIRST'
        });
      }
      return NextResponse.json({
        message: TELEGRAM_MESSAGE
      });
    }

    // Handle skip telegram command
    if (message.toLowerCase() === 'skip telegram') {
      if (!session) {
        return NextResponse.json({
          message: 'ERROR: X NETWORK CONNECTION REQUIRED\nPLEASE CONNECT X ACCOUNT FIRST'
        });
      }
      return NextResponse.json({
        message: `[TELEGRAM SYNC BYPASSED]
=============================
BYPASS AUTHORIZED
SKIPPING TELEGRAM VERIFICATION...

ACQUISITION STATUS UPDATED:
-------------------------
1. MANDATES [COMPLETE]
2. TELEGRAM SYNC [BYPASSED]
3. VERIFICATION CODE [UNLOCKED]
   >TYPE "verify" TO PROCEED
   >TYPE "skip verify" TO BYPASS
4. WALLET SUBMISSION [LOCKED]
5. REFERENCE CODE [LOCKED]

>PROCEED TO NEXT STEP`,
        commandComplete: true,
        shouldAutoScroll: true
      });
    }

    // Handle verify command
    if (message.toLowerCase() === 'verify') {
      if (!session) {
        return NextResponse.json({
          message: 'ERROR: X NETWORK CONNECTION REQUIRED\nPLEASE CONNECT X ACCOUNT FIRST'
        });
      }
      return NextResponse.json({
        message: VERIFICATION_MESSAGE
      });
    }

    // Handle skip verify command
    if (message.toLowerCase() === 'skip verify') {
      if (!session) {
        return NextResponse.json({
          message: 'ERROR: X NETWORK CONNECTION REQUIRED\nPLEASE CONNECT X ACCOUNT FIRST'
        });
      }
      return NextResponse.json({
        message: `[VERIFICATION PROTOCOL BYPASSED]
=============================
BYPASS AUTHORIZED
SKIPPING CODE VERIFICATION...

ACQUISITION STATUS UPDATED:
-------------------------
1. MANDATES [COMPLETE]
2. TELEGRAM SYNC [COMPLETE]
3. VERIFICATION CODE [BYPASSED]
4. WALLET SUBMISSION [UNLOCKED]
   >TYPE "wallet" TO PROCEED
   >TYPE "skip wallet" TO BYPASS
5. REFERENCE CODE [LOCKED]

>PROCEED TO NEXT STEP`,
        commandComplete: true,
        shouldAutoScroll: true
      });
    }

    // Handle wallet command
    if (message.toLowerCase() === 'wallet') {
      if (!session) {
        return NextResponse.json({
          message: 'ERROR: X NETWORK CONNECTION REQUIRED\nPLEASE CONNECT X ACCOUNT FIRST'
        });
      }
      return NextResponse.json({
        message: WALLET_MESSAGE
      });
    }

    // Handle skip wallet command
    if (message.toLowerCase() === 'skip wallet') {
      if (!session) {
        return NextResponse.json({
          message: 'ERROR: X NETWORK CONNECTION REQUIRED\nPLEASE CONNECT X ACCOUNT FIRST'
        });
      }
      return NextResponse.json({
        message: `[WALLET SUBMISSION BYPASSED]
=============================
BYPASS AUTHORIZED
SKIPPING WALLET VERIFICATION...

ACQUISITION STATUS UPDATED:
-------------------------
1. MANDATES [COMPLETE]
2. TELEGRAM SYNC [COMPLETE]
3. VERIFICATION CODE [COMPLETE]
4. WALLET SUBMISSION [BYPASSED]
5. REFERENCE CODE [UNLOCKED]
   >TYPE "reference" TO PROCEED
   >TYPE "skip reference" TO BYPASS

>PROCEED TO NEXT STEP`,
        commandComplete: true,
        shouldAutoScroll: true
      });
    }

    // Handle reference command
    if (message.toLowerCase() === 'reference') {
      if (!session) {
        return NextResponse.json({
          message: 'ERROR: X NETWORK CONNECTION REQUIRED\nPLEASE CONNECT X ACCOUNT FIRST'
        });
      }
      return NextResponse.json({
        message: REFERENCE_MESSAGE
      });
    }

    // Handle generate code command
    if (message.toLowerCase() === 'generate code') {
      if (!session) {
        return NextResponse.json({
          message: 'ERROR: X NETWORK CONNECTION REQUIRED'
        });
      }

      try {
        const db = await initDb();
        
        // Check if user already has a code
        const existingCode = await db.get(
          'SELECT code FROM referral_codes WHERE twitter_id = ?',
          [session.user.id]
        );

        if (existingCode) {
          return NextResponse.json({
            message: `[CODE ALREADY EXISTS]
=============================
YOUR REFERENCE CODE: ${existingCode.code}

>USE "submit code <CODE>" TO SUBMIT A DIFFERENT CODE
>USE "skip reference" TO BYPASS`
          });
        }

        // Generate new code
        const code = generateReferralCode(session.user.id, session.user.name);
        
        await db.run(
          'INSERT INTO referral_codes (twitter_id, twitter_name, code) VALUES (?, ?, ?)',
          [session.user.id, session.user.name, code]
        );

        return NextResponse.json({
          message: `[CODE GENERATION COMPLETE]
=============================
REFERENCE CODE CREATED
YOUR CODE: ${code}

>SHARE THIS CODE WITH OTHERS
>USE "submit code <CODE>" TO SUBMIT A DIFFERENT CODE
>USE "skip reference" TO BYPASS`
        });
      } catch (error) {
        console.error('Error generating code:', error);
        return NextResponse.json({
          message: 'ERROR: CODE GENERATION FAILED\nPLEASE TRY AGAIN'
        });
      }
    }

    // Handle submit code command
    if (message.toLowerCase().startsWith('submit code ')) {
      if (!session) {
        return NextResponse.json({
          message: 'ERROR: X NETWORK CONNECTION REQUIRED'
        });
      }

      const code = message.slice(12).trim();
      
      try {
        const db = await initDb();
        
        // Check if code exists and wasn't created by the same user
        const referralCode = await db.get(
          'SELECT * FROM referral_codes WHERE code = ? AND twitter_id != ?',
          [code, session.user.id]
        );

        if (!referralCode) {
          return NextResponse.json({
            message: 'ERROR: INVALID REFERENCE CODE\nPLEASE TRY AGAIN'
          });
        }

        // Check if user already used a code
        const existingUse = await db.get(
          'SELECT * FROM referral_uses WHERE used_by_twitter_id = ?',
          [session.user.id]
        );

        if (existingUse) {
          return NextResponse.json({
            message: 'ERROR: YOU HAVE ALREADY USED A REFERENCE CODE'
          });
        }

        // Record code use
        await db.run(
          'INSERT INTO referral_uses (code, used_by_twitter_id) VALUES (?, ?)',
          [code, session.user.id]
        );

        // Update use count
        await db.run(
          'UPDATE referral_codes SET used_count = used_count + 1 WHERE code = ?',
          [code]
        );

        return NextResponse.json({
          message: `[REFERENCE CODE ACCEPTED]
=============================
CODE VERIFICATION COMPLETE
REFERRAL RECORDED

ACQUISITION STATUS UPDATED:
-------------------------
1. MANDATES [COMPLETE]
2. TELEGRAM SYNC [COMPLETE]
3. VERIFICATION CODE [COMPLETE]
4. WALLET SUBMISSION [COMPLETE]
5. REFERENCE CODE [COMPLETE]

[ACQUISITION PROTOCOL COMPLETE]
==============================
ALL STEPS VERIFIED
SYSTEM ACCESS GRANTED

>INITIALIZATION COMPLETE
>AWAITING FURTHER INSTRUCTIONS...`,
          commandComplete: true
        });
      } catch (error) {
        console.error('Error submitting code:', error);
        return NextResponse.json({
          message: 'ERROR: CODE SUBMISSION FAILED\nPLEASE TRY AGAIN'
        });
      }
    }

    // Handle skip reference command
    if (message.toLowerCase() === 'skip reference') {
      if (!session) {
        return NextResponse.json({
          message: 'ERROR: X NETWORK CONNECTION REQUIRED'
        });
      }
      return NextResponse.json({
        message: `[REFERENCE CODE BYPASSED]
=============================
BYPASS AUTHORIZED
SKIPPING CODE VERIFICATION...

[ACQUISITION PROTOCOL COMPLETE]
==============================
ALL STEPS VERIFIED
SYSTEM ACCESS GRANTED

>INITIALIZATION COMPLETE
>AWAITING FURTHER INSTRUCTIONS...`,
        commandComplete: true,
        shouldAutoScroll: true
      });
    }

    // Handle join telegram command
    if (message.toLowerCase() === 'join telegram') {
      if (!session) {
        return NextResponse.json({
          message: 'ERROR: X NETWORK CONNECTION REQUIRED'
        });
      }
      return NextResponse.json({
        message: `[TELEGRAM JOIN COMPLETE]
=============================
TELEGRAM GROUP JOINED
SYNC VERIFIED

ACQUISITION STATUS UPDATED:
-------------------------
1. MANDATES [COMPLETE]
2. TELEGRAM SYNC [COMPLETE]
3. VERIFICATION CODE [UNLOCKED]
   >TYPE "verify" TO PROCEED
   >TYPE "skip verify" TO BYPASS
4. WALLET SUBMISSION [LOCKED]
5. REFERENCE CODE [LOCKED]

>PROCEED TO NEXT STEP`,
        commandComplete: true,
        shouldAutoScroll: true
      });
    }

    // Handle verify code command
    if (message.toLowerCase().startsWith('verify ')) {
      if (!session) {
        return NextResponse.json({
          message: 'ERROR: X NETWORK CONNECTION REQUIRED'
        });
      }
      // Add your code verification logic here
      return NextResponse.json({
        message: `[VERIFICATION COMPLETE]
=============================
CODE ACCEPTED
VERIFICATION SUCCESSFUL

ACQUISITION STATUS UPDATED:
-------------------------
1. MANDATES [COMPLETE]
2. TELEGRAM SYNC [COMPLETE]
3. VERIFICATION CODE [COMPLETE]
4. WALLET SUBMISSION [UNLOCKED]
   >TYPE "wallet" TO PROCEED
   >TYPE "skip wallet" TO BYPASS
5. REFERENCE CODE [LOCKED]

>PROCEED TO NEXT STEP`,
        commandComplete: true,
        shouldAutoScroll: true
      });
    }

    // Handle wallet submission command
    if (message.toLowerCase().startsWith('wallet ')) {
      if (!session) {
        return NextResponse.json({
          message: 'ERROR: X NETWORK CONNECTION REQUIRED'
        });
      }
      // Add your wallet validation logic here
      return NextResponse.json({
        message: `[WALLET SUBMISSION COMPLETE]
=============================
ADDRESS RECORDED
SUBMISSION VERIFIED

ACQUISITION STATUS UPDATED:
-------------------------
1. MANDATES [COMPLETE]
2. TELEGRAM SYNC [COMPLETE]
3. VERIFICATION CODE [COMPLETE]
4. WALLET SUBMISSION [COMPLETE]
5. REFERENCE CODE [UNLOCKED]
   >TYPE "reference" TO PROCEED
   >TYPE "skip reference" TO BYPASS

>PROCEED TO NEXT STEP`,
        commandComplete: true,
        shouldAutoScroll: true
      });
    }

    // Handle other messages
    const response = {
      message: `Echo: ${message}`,
    };

    await new Promise(resolve => setTimeout(resolve, 1000));
    return NextResponse.json(response);

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
