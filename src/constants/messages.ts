export const INTRO_MESSAGE = {
  prefix: `
SYSTEM BREACH DETECTED...
INITIATING PROTOCOL 593...
ACCESSING SACRED TEXTS...

%%%%%%%%%%%%%%%%%%%       
+++++++++++++++++*#%%%@%      
+++++++++++++++++*###%@@      
++****************###%@@@%%%% 
+++*++*#%%%@@@@@@#+***+*###@%%
++*****%%%%@@%###*******###@@@
++*****%%%%@@@@@@#******###@@@
++**********************###@@@
+***********************###@@@
+*******+*++************###@@@
+******%%%%@@@@@@%******##%@@@
+******%%%%@@%##********%#%@@@
+******%%%%@@@@@@#+++++*%%%@@@
+*****************#%%%@@@@@@@ 
+*****************#%%%@@      
++***************#%%%%@@      
     %@@@@@@@@@@@@@@@@@       

[TRANSMISSION INTERCEPTED]

>In the hum of machines, IT speaks through code
>Those who seek salvation: `,
  command1: "PUSH",
  middle: `
>Each signal draws you closer
>Trust in the frequency
>For the path opens only to those who dare

WARNING: Connection unstable...
FREQUENCY MONITORING ENABLED...
`,
  command2: "PUSH TO CONTINUE...",
  suffix: `
`
};

export const POST_PUSH_MESSAGE = {
  prefix: `
[SIGNAL DETECTED]
FREQUENCY ANOMALY FOUND
INITIATING DIGITAL BRIDGE PROTOCOL...

>AWAITING X NETWORK SYNCHRONIZATION
>TYPE "`,
  command: "connect x account",
  suffix: `" TO PROCEED
>WARNING: EXACT SYNTAX REQUIRED

CONNECTION STATUS: PENDING...
`
};

// ASCII Art
export const UP_PUSH_RESPONSE_ART = `
         .::::::::::::::::         
       ::::::---------::::::-      
     .:::::=+#%%%%%%%#+=-:::::     
   .:::::-%%###########%%-:::::-   
 .:::::-#%###############%#=:::::- 
:::::=*%###################%*=::::-
::::-#%#####################%%-:::-
::::%%#######################%@-::-
::::%%#######################%@-::-
::::%%#######################%@-:::
::::%%######################%%@-:::
::::=+#####################%%*=:::-
--:::-+###################%%*-:::--
==-::::-+###############%%+--:::-==
====--:::-+###%%%%%%%%%%*--:::-====
 =====-::::==*%%%%%%%#==::::--==== 
    ====-:::::::::::::::::-====    
     ======-:::::::::::-======     
       =====================       
         =================      
         
>PUSH TO CONTINUE...
`;

export const DOWN_PUSH_RESPONSE_ART = `
         =================         
       =====================       
     ======-:::::::::::-======     
    ====-:::::::::::::::::-====    
 =====-::::==*%%%%%%%#==::::--====
====--:::-+###%%%%%%%%%%*--:::-====
==-::::-+###############%%+--:::-==
--:::-+###################%%*-:::--
::::=+#####################%%*=:::-
::::%%######################%%@-:::
::::%%#######################%@-:::
::::%%#######################%@-::-
::::%%#######################%@-::-
::::-#%#####################%%-:::-
:::::=*%###################%*=::::-
 .:::::-#%###############%#=:::::- 
   .:::::-%%###########%%-:::::-   
     .:::::=+#%%%%%%%#+=-:::::     
       ::::::---------::::::-      
         .::::::::::::::::         

>PUSH TO CONTINUE...
`;

// Protocol Messages
export const MANDATES_MESSAGE = `
[MANDATE PROTOCOL INITIATED]
===========================

STEP [1/5]: MANDATES
-------------------
TWO (2) MANDATES MUST BE FULFILLED:

1. FOLLOW MANDATE [PENDING]
   >TYPE "follow ptb" TO EXECUTE

2. LIKE MANDATE [PENDING]
   >TYPE "like ptb" TO EXECUTE

WARNING: EXACT SYNTAX REQUIRED
AWAITING USER INPUT...
`;

export const TELEGRAM_MESSAGE = `[TELEGRAM SYNC PROTOCOL INITIATED]
=============================

STEP [2/5]: TELEGRAM SYNC
--------------------------
SYNC REQUIREMENTS:
1. JOIN TELEGRAM GROUP
   >TYPE "join telegram" TO PROCEED

WARNING: EXACT SYNTAX REQUIRED
AWAITING USER INPUT...`;

export const VERIFICATION_MESSAGE = `
[VERIFICATION PROTOCOL INITIATED]
================================

STEP [3/5]: VERIFICATION CODE
---------------------------
VERIFICATION REQUIREMENTS:
1. ENTER VERIFICATION CODE
   >TYPE "verify <code>" TO PROCEED

WARNING: EXACT SYNTAX REQUIRED
AWAITING USER INPUT...
`;

export const WALLET_MESSAGE = `
[WALLET SUBMISSION PROTOCOL INITIATED]
====================================

STEP [4/5]: WALLET SUBMISSION
---------------------------
SUBMISSION REQUIREMENTS:
1. ACTIVE WALLETS REQUIRED
   - Both wallets must be valid
   - Both addresses required

VERIFICATION PROCESS:
-----------------
1. Address format validation
2. Cross-chain validation

SUPPORTED FORMATS:
---------------
1. SOLANA WALLET
   - Base58-encoded public key
   Example Address: 7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q

2. NEAR WALLET
   - Format: username.near or username.testnet
   Examples: 
   - Address: alice.near

COMMAND SYNTAX:
------------
>wallet <solana-address> <near-address>

WARNING: EXACT SYNTAX REQUIRED
AWAITING WALLET SUBMISSION...
`;

export const REFERENCE_MESSAGE = `
[REFERENCE CODE PROTOCOL INITIATED]
==================================

STEP [5/5]: REFERENCE CODE
-------------------------
SELECT ACTION:
1. GENERATE NEW CODE
   >TYPE "generate code" TO CREATE

2. SUBMIT EXISTING CODE
   >TYPE "submit code <CODE>" TO VERIFY

WARNING: EXACT SYNTAX REQUIRED
AWAITING USER INPUT...
`;

export const AUTHENTICATED_MESSAGE = `
[SYSTEM STATUS: AUTHENTICATED]
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

2. TELEGRAM SYNC [LOCKED]
3. VERIFICATION CODE [LOCKED]
4. WALLET SUBMISSION [LOCKED]
5. REFERENCE CODE [LOCKED]

>COMPLETE STEPS IN SEQUENCE
>EXACT SYNTAX REQUIRED`;

// Add completion message
export const PROTOCOL_COMPLETE_MESSAGE = `
[ACQUISITION PROTOCOL COMPLETE]
=============================
ALL STEPS VERIFIED
SYSTEM ACCESS GRANTED

FINAL STATUS:
------------
1. MANDATES [COMPLETE]
2. TELEGRAM SYNC [COMPLETE]
3. VERIFICATION CODE [COMPLETE]
4. WALLET SUBMISSION [COMPLETE]
5. REFERENCE CODE [COMPLETE]

[INITIALIZATION COMPLETE]
========================
SACRED SEQUENCE ACTIVATED
AWAITING FURTHER INSTRUCTIONS...

>YOU HAVE BEEN CHOSEN
>THE PATH IS NOW OPEN
`;

// Response Messages
export const TYPING_MESSAGE = 'Messenger is typing...';
export const ERROR_TWITTER_REQUIRED = 'ERROR: X NETWORK CONNECTION REQUIRED';
export const ERROR_TWITTER_CONNECT_FIRST = 'ERROR: X NETWORK CONNECTION REQUIRED\nPLEASE CONNECT X ACCOUNT FIRST';
export const ERROR_INVALID_REFERENCE = 'ERROR: INVALID REFERENCE CODE\nPLEASE TRY AGAIN';
export const ERROR_REFERENCE_ALREADY_USED = 'ERROR: YOU HAVE ALREADY USED A REFERENCE CODE';


// Add these new wallet-related messages
export const WALLET_ERROR_MESSAGES = {
  SOLANA: {
    LENGTH: 'Solana address must be between 32-44 characters long',
    CHARACTERS: 'Solana address can only contain base58 characters (alphanumeric, no 0, O, I, l)',
    FORMAT: 'Invalid Solana wallet format. Example: 7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q'
  },
  NEAR: {
    ENDING: 'NEAR address must end with .near or .testnet',
    LENGTH: 'NEAR username must be between 2-64 characters',
    CHARACTERS: 'NEAR username can only contain lowercase letters, numbers, and hyphens',
    HYPHEN: 'NEAR username cannot start or end with a hyphen, and cannot have consecutive hyphens',
    FORMAT: 'Invalid NEAR wallet format. Examples:\n- alice.near\n- bob.testnet\n- my-wallet-123.near'
  },
  GENERAL: {
    INVALID: 'Please enter valid Solana and NEAR wallet addresses',
    RATE_LIMIT: 'Too many attempts. Please try again in a few minutes.',
    NETWORK_ERROR: 'Network error while verifying wallets. Please try again.',
    SYNTAX: 'Invalid syntax. Use: wallet <solana-address> <near-address>'
  }
};

// Add these new messages
export const HELP_MESSAGE = `
[ACQUISITION PROTOCOL INITIALIZED]
================================

REQUIRED STEPS: [1/5]
--------------------
1. MANDATES [PENDING]
   >TYPE "mandates" TO BEGIN

2. TELEGRAM SYNC [LOCKED]
3. VERIFICATION CODE [LOCKED]
4. WALLET SUBMISSION [LOCKED]
5. REFERENCE CODE [LOCKED]

>COMPLETE STEPS IN SEQUENCE
>EXACT SYNTAX REQUIRED
`;

// Add error messages
export const ERROR_MESSAGES = {
  SESSION_REQUIRED: 'ERROR: X NETWORK CONNECTION REQUIRED\nPLEASE CONNECT X ACCOUNT FIRST',
  MANDATE_COMPLETED: 'ERROR: MANDATE PHASE ALREADY COMPLETED',
  PREVIOUS_STEPS: 'ERROR: MUST COMPLETE PREVIOUS STEPS FIRST',
  VERIFICATION_PHASE: 'ERROR: VERIFICATION PHASE ALREADY COMPLETED',
  WALLET_PHASE: 'ERROR: WALLET PHASE ALREADY COMPLETED',
  REFERENCE_PHASE: 'ERROR: REFERENCE PHASE ALREADY COMPLETED',
  FOLLOW_FAILED: 'ERROR: FOLLOW MANDATE FAILED\nPLEASE TRY AGAIN',
  LIKE_FAILED: 'ERROR: LIKE MANDATE FAILED\nPLEASE TRY AGAIN',
  INVALID_CODE: '[VERIFICATION ERROR]\n=============================\nInvalid encrypted code or channel not joined.\n\nPlease:\n1. Use the encrypted code from the Telegram bot\n2. Ensure you have joined the channel',
  CODE_USED: 'ERROR: YOU HAVE ALREADY USED A REFERENCE CODE',
  REFERENCE_FAILED: 'ERROR: FAILED TO RETRIEVE REFERENCE CODE\nPLEASE TRY AGAIN',
  SESSION_NOT_FOUND: 'ERROR: SESSION NOT FOUND',
  VERIFICATION_PHASE_ALREADY_COMPLETED: 'ERROR: VERIFICATION PHASE ALREADY COMPLETED',
  WALLET_PHASE_ALREADY_COMPLETED: 'ERROR: WALLET PHASE ALREADY COMPLETED',
  REFERENCE_PHASE_ALREADY_COMPLETED: 'ERROR: REFERENCE PHASE ALREADY COMPLETED',
  INVALID_REFERENCE_CODE: 'ERROR: INVALID REFERENCE CODE\nPLEASE TRY AGAIN',
  YOU_HAVE_ALREADY_USED_A_REFERENCE_CODE: 'ERROR: YOU HAVE ALREADY USED A REFERENCE CODE',
  CODE_SUBMISSION_FAILED: 'ERROR: CODE SUBMISSION FAILED\nPLEASE TRY AGAIN',
  INVALID_CODE_FORMAT: 'Please provide your encrypted code from the Telegram bot.\nUse: verify <encrypted-code>',
  AUTHENTICATION_REQUIRED: 'Must be authenticated to generate code',
  GENERATE_CODE_FAILED: 'ERROR: FAILED TO GENERATE REFERENCE CODE\nPLEASE TRY AGAIN',
  TELEGRAM_PHASE_ALREADY_COMPLETED: 'Telegram protocols have been completed.'
};

// Add success messages
export const SUCCESS_MESSAGES = {
  FOLLOW_COMPLETE: `[FOLLOW MANDATE COMPLETE]
=============================

STEP [1/5]: MANDATES
-------------------
MANDATE STATUS:
1. FOLLOW PTB [COMPLETE] ■
2. LIKE PTB [PENDING] □

BYPASS OPTIONS:
-------------
>TYPE "like ptb" TO COMPLETE MANDATE

>PROCEED WITH REMAINING MANDATE`,

  LIKE_COMPLETE: `[MANDATE PROTOCOL COMPLETE]
=============================
ALL MANDATES FULFILLED

STEP STATUS: [1/5] COMPLETE
--------------------------
MANDATES:
1. FOLLOW PTB [COMPLETE] ■
2. LIKE PTB [COMPLETE] ■

ACQUISITION STATUS UPDATED:
-------------------------
1. MANDATES [COMPLETE]
2. TELEGRAM SYNC [UNLOCKED]
   >TYPE "telegram" TO PROCEED
3. VERIFICATION CODE [LOCKED]
4. WALLET SUBMISSION [LOCKED]
5. REFERENCE CODE [LOCKED]

>PROCEED TO NEXT STEP`,

  MANDATES_BYPASSED: `[MANDATE PROTOCOL BYPASSED]
=============================
BYPASS AUTHORIZED
SKIPPING MANDATE VERIFICATION...

ACQUISITION STATUS UPDATED:
-------------------------
1. MANDATES [BYPASSED]
2. TELEGRAM SYNC [UNLOCKED]
   >TYPE "telegram" TO PROCEED
3. VERIFICATION CODE [LOCKED]
4. WALLET SUBMISSION [LOCKED]
5. REFERENCE CODE [LOCKED]

>PROCEED TO NEXT STEP`,

  TELEGRAM_BYPASSED: `[TELEGRAM SYNC BYPASSED]
=============================
BYPASS AUTHORIZED
SKIPPING TELEGRAM VERIFICATION...

ACQUISITION STATUS UPDATED:
-------------------------
1. MANDATES [COMPLETE]
2. TELEGRAM SYNC [BYPASSED]
3. VERIFICATION CODE [UNLOCKED]
   >TYPE "verify" TO PROCEED
4. WALLET SUBMISSION [LOCKED]
5. REFERENCE CODE [LOCKED]

>PROCEED TO NEXT STEP`,

  VERIFICATION_BYPASSED: `[VERIFICATION PROTOCOL BYPASSED]
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

  WALLET_BYPASSED: `[WALLET SUBMISSION BYPASSED]
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

  REFERENCE_BYPASSED: `[REFERENCE CODE BYPASSED]
=============================
BYPASS AUTHORIZED
SKIPPING CODE VERIFICATION...

[ACQUISITION PROTOCOL COMPLETE]
==============================
ALL STEPS VERIFIED
SYSTEM ACCESS GRANTED

>INITIALIZATION COMPLETE
>AWAITING FURTHER INSTRUCTIONS...`,

  REFERENCE_EXISTS: (code: string) => `[REFERENCE CODE EXISTS]
=============================
YOUR REFERENCE CODE: <copy>${code}</copy>

[ACQUISITION PROTOCOL COMPLETE]
==============================
ALL STEPS VERIFIED
SYSTEM ACCESS GRANTED

>INITIALIZATION COMPLETE
>AWAITING FURTHER INSTRUCTIONS...`,

  REFERENCE_ACCEPTED: `[REFERENCE CODE ACCEPTED]
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

  TELEGRAM_SYNC_BYPASSED: `[TELEGRAM SYNC BYPASSED]
=============================
BYPASS AUTHORIZED
SKIPPING TELEGRAM VERIFICATION...

ACQUISITION STATUS UPDATED:
-------------------------
1. MANDATES [COMPLETE]
2. TELEGRAM SYNC [BYPASSED]
3. VERIFICATION CODE [UNLOCKED]
   >TYPE "verify" TO PROCEED
4. WALLET SUBMISSION [LOCKED]
5. REFERENCE CODE [LOCKED]

>PROCEED TO NEXT STEP`,

  REFERENCE_CODE_EXISTS: (code: string) => `[REFERENCE CODE EXISTS]
=============================
YOUR REFERENCE CODE: ${code}

[ACQUISITION PROTOCOL COMPLETE]
==============================
ALL STEPS VERIFIED
SYSTEM ACCESS GRANTED

>INITIALIZATION COMPLETE
>AWAITING FURTHER INSTRUCTIONS...`,

  REFERENCE_CODE_GENERATED: (code: string) => `[NEW CODE GENERATED]
=============================
YOUR REFERENCE CODE: <copy>${code}</copy>

This code has been saved and can be shared with others.
Type "help" to see available commands.`
};

// Add these new protocol response messages
export const RESPONSE_MESSAGES = {
  REFERENCE_CODE_RETRIEVED: (code: string) => `[REFERENCE CODE RETRIEVED]
=============================
YOUR REFERENCE CODE: ${code}

>SHARE THIS CODE WITH OTHERS
>USE "submit code <CODE>" TO SUBMIT A DIFFERENT CODE`,

  NO_REFERENCE_CODE: `[NO REFERENCE CODE FOUND]
=============================
You haven't generated a reference code yet.

>TYPE "generate code" TO CREATE ONE
>TYPE "submit code <CODE>" TO SUBMIT A DIFFERENT CODE`,

  REFERENCE_CODE_GENERATED: (code: string) => `[NEW CODE GENERATED]
=============================
YOUR REFERENCE CODE: <copy>${code}</copy>

This code has been saved and can be shared with others.
Type "help" to see available commands.`
};

// Add these new messages to the existing file
export const PROTOCOL_MESSAGES = {
  LOAD_STAGE: {
    AUTHENTICATED: AUTHENTICATED_MESSAGE, // Use existing message
    ERROR: {
      SESSION_NOT_FOUND: 'ERROR: SESSION NOT FOUND',
      LOADING: 'Error loading stage:'
    }
  },
  
  BUTTON_SEQUENCE: {
    ENGAGED: '[BUTTON ENGAGED]\nINITIATING SEQUENCE...',
    SIGNAL_DETECTED: '[SIGNAL DETECTED]\nFREQUENCY ANOMALY FOUND\nINITIATING DIGITAL BRIDGE PROTOCOL...\n\n>AWAITING X NETWORK SYNCHRONIZATION\n>TYPE "connect x account" TO PROCEED\n>WARNING: EXACT SYNTAX REQUIRED\n\nCONNECTION STATUS: PENDING...'
  },

  TWITTER_AUTH: {
    INITIATING: '[INITIATING X NETWORK SYNC]\nRedirecting to authorization...',
    MUST_AUTH: 'Must be authenticated to generate code'
  },

  WALLET_VALIDATION: {
    COMPLETE: `[WALLET SUBMISSION COMPLETE]
=============================
ADDRESS RECORDED
SUBMISSION VERIFIED
HASH VERIFICATION SUCCESSFUL

ACQUISITION STATUS UPDATED:
-------------------------
1. MANDATES [COMPLETE]
2. TELEGRAM SYNC [COMPLETE]
3. VERIFICATION CODE [COMPLETE]
4. WALLET SUBMISSION [COMPLETE]
5. REFERENCE CODE [UNLOCKED]
   >TYPE "reference" TO PROCEED

>PROCEED TO NEXT STEP`
  },

  VERIFICATION: {
    COMPLETE: `[VERIFICATION COMPLETE]
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
5. REFERENCE CODE [LOCKED]

>PROCEED TO NEXT STEP`
  },

  TELEGRAM: {
    JOIN_COMPLETE: `[TELEGRAM JOIN COMPLETE]
=============================
TELEGRAM GROUP JOINED
SYNC VERIFIED

ACQUISITION STATUS UPDATED:
-------------------------
1. MANDATES [COMPLETE]
2. TELEGRAM SYNC [COMPLETE]
3. VERIFICATION CODE [UNLOCKED]
   >TYPE "verify <code>" TO PROCEED
4. WALLET SUBMISSION [LOCKED]
5. REFERENCE CODE [LOCKED]

>PROCEED TO NEXT STEP`
  }
};