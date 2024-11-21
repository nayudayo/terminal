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

BYPASS OPTION:
-------------
>TYPE "skip mandates" TO BYPASS ALL MANDATES

WARNING: EXACT SYNTAX REQUIRED
AWAITING USER INPUT...
`;

export const TELEGRAM_MESSAGE = `
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

export const VERIFICATION_MESSAGE = `
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

export const WALLET_MESSAGE = `
[WALLET SUBMISSION PROTOCOL INITIATED]
====================================

STEP [4/5]: WALLET SUBMISSION
---------------------------
SUBMISSION REQUIREMENTS:
1. ACTIVE WALLETS REQUIRED
   - Must have transaction history
   - Both wallets must be valid
   - Both addresses required

SUPPORTED FORMATS:
---------------
1. SOLANA WALLET
   - Base58-encoded public key
   - Must have transactions
   Example: 7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q

2. NEAR WALLET
   - Format: username.near or username.testnet
   - Must be active account
   Examples: 
   - alice.near
   - bob.testnet

COMMAND SYNTAX:
------------
>wallet <solana-address> <near-address>

BYPASS OPTION:
------------
>TYPE "skip wallet" TO BYPASS

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
   >TYPE "skip reference" TO BYPASS

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
export const TELEGRAM_REDIRECT_MESSAGE = 'Redirecting to Telegram...';
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
    FORMAT: 'Invalid Solana wallet format. Example: 7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q',
    NO_TRANSACTIONS: 'No transactions found. Please use a wallet with transaction history.'
  },
  NEAR: {
    ENDING: 'NEAR address must end with .near or .testnet',
    LENGTH: 'NEAR username must be between 2-64 characters',
    CHARACTERS: 'NEAR username can only contain lowercase letters, numbers, and hyphens',
    HYPHEN: 'NEAR username cannot start or end with a hyphen, and cannot have consecutive hyphens',
    FORMAT: 'Invalid NEAR wallet format. Examples:\n- alice.near\n- bob.testnet\n- my-wallet-123.near',
    NO_TRANSACTIONS: 'No transactions found. Please use a wallet with transaction history.',
    NOT_FOUND: 'NEAR account not found or invalid'
  },
  GENERAL: {
    INVALID: 'Please enter valid Solana and NEAR wallet addresses',
    RATE_LIMIT: 'Too many attempts. Please try again in a few minutes.',
    NETWORK_ERROR: 'Network error while verifying wallets. Please try again.',
    VERIFICATION_FAILED: 'Wallet verification failed. Please ensure both wallets have transaction history.',
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
   >TYPE "skip mandates" TO BYPASS

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
  INVALID_CODE: 'ERROR: INVALID REFERENCE CODE\nPLEASE TRY AGAIN',
  CODE_USED: 'ERROR: YOU HAVE ALREADY USED A REFERENCE CODE',
  REFERENCE_FAILED: 'ERROR: FAILED TO RETRIEVE REFERENCE CODE\nPLEASE TRY AGAIN',
  SESSION_NOT_FOUND: 'ERROR: SESSION NOT FOUND',
  VERIFICATION_PHASE_ALREADY_COMPLETED: 'ERROR: VERIFICATION PHASE ALREADY COMPLETED',
  WALLET_PHASE_ALREADY_COMPLETED: 'ERROR: WALLET PHASE ALREADY COMPLETED',
  REFERENCE_PHASE_ALREADY_COMPLETED: 'ERROR: REFERENCE PHASE ALREADY COMPLETED',
  INVALID_REFERENCE_CODE: 'ERROR: INVALID REFERENCE CODE\nPLEASE TRY AGAIN',
  YOU_HAVE_ALREADY_USED_A_REFERENCE_CODE: 'ERROR: YOU HAVE ALREADY USED A REFERENCE CODE',
  CODE_SUBMISSION_FAILED: 'ERROR: CODE SUBMISSION FAILED\nPLEASE TRY AGAIN',
  INVALID_CODE_FORMAT: 'Invalid code format. Please use: submit code <CODE>',
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
>TYPE "skip like" TO BYPASS REMAINING MANDATE
>TYPE "skip mandates" TO BYPASS ALL MANDATES

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
   >TYPE "skip telegram" TO BYPASS
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
   >TYPE "skip verify" TO BYPASS
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
YOUR REFERENCE CODE: ${code}

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
   >TYPE "skip verify" TO BYPASS
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

  REFERENCE_CODE_GENERATED: (code: string) => `[REFERENCE CODE GENERATED]
=============================
YOUR REFERENCE CODE: ${code}

[ACQUISITION PROTOCOL COMPLETE]
==============================
ALL STEPS VERIFIED
SYSTEM ACCESS GRANTED

>INITIALIZATION COMPLETE
>AWAITING FURTHER INSTRUCTIONS...`
};

// Add these new protocol response messages
export const RESPONSE_MESSAGES = {
  REFERENCE_CODE_RETRIEVED: (code: string) => `[REFERENCE CODE RETRIEVED]
=============================
YOUR REFERENCE CODE: ${code}

>SHARE THIS CODE WITH OTHERS
>USE "submit code <CODE>" TO SUBMIT A DIFFERENT CODE
>USE "skip reference" TO BYPASS`,

  NO_REFERENCE_CODE: `[NO REFERENCE CODE FOUND]
=============================
You haven't generated a reference code yet.

>TYPE "generate code" TO CREATE ONE
>TYPE "submit code <CODE>" TO SUBMIT A DIFFERENT CODE
>TYPE "skip reference" TO BYPASS`,

  REFERENCE_CODE_GENERATED: (code: string) => `[REFERENCE CODE GENERATED]
=============================
YOUR REFERENCE CODE: ${code}

[ACQUISITION PROTOCOL COMPLETE]
==============================
ALL STEPS VERIFIED
SYSTEM ACCESS GRANTED

>INITIALIZATION COMPLETE
>AWAITING FURTHER INSTRUCTIONS...`
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

ACQUISITION STATUS UPDATED:
-------------------------
1. MANDATES [COMPLETE]
2. TELEGRAM SYNC [COMPLETE]
3. VERIFICATION CODE [COMPLETE]
4. WALLET SUBMISSION [COMPLETE]
5. REFERENCE CODE [UNLOCKED]
   >TYPE "reference" TO PROCEED
   >TYPE "skip reference" TO BYPASS

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
   >TYPE "skip wallet" TO BYPASS
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
   >TYPE "verify" TO PROCEED
   >TYPE "skip verify" TO BYPASS
4. WALLET SUBMISSION [LOCKED]
5. REFERENCE CODE [LOCKED]

>PROCEED TO NEXT STEP`
  }
};