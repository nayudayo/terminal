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
1. ENTER BOTH WALLET ADDRESSES
   >TYPE "wallet <solana-address> <near-address>" TO PROCEED
   >TYPE "skip wallet" TO BYPASS

SUPPORTED WALLET FORMATS:
-----------------------
1. SOLANA WALLET (REQUIRED)
   - Base58-encoded public key (32-44 chars)
   - Alphanumeric characters only
   Example: 7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q

2. NEAR WALLET (REQUIRED)
   - Format: username.near or username.testnet
   - Username: 2-64 characters
   - Allowed: lowercase letters, numbers, hyphens
   Examples: 
   - alice.near
   - bob.testnet
   - my-wallet-123.near

VALIDATION RULES:
--------------
- Both wallets must be submitted together
- No spaces in wallet addresses
- Case sensitive
- Exact format required
- No private keys

EXAMPLE SUBMISSION:
----------------
>wallet 7v91N7iZ9mNicL8WfG6cgSCKyRXydQjLh6UYBWwm6y1Q alice.near

WARNING: EXACT SYNTAX REQUIRED
AWAITING USER INPUT...
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
   >TYPE "skip mandates" TO BYPASS

2. TELEGRAM SYNC [LOCKED]
3. VERIFICATION CODE [LOCKED]
4. WALLET SUBMISSION [LOCKED]
5. REFERENCE CODE [LOCKED]

>COMPLETE STEPS IN SEQUENCE
>EXACT SYNTAX REQUIRED
>TYPE "help" TO SHOW THIS MESSAGE AGAIN
`;

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
    INVALID: 'Please enter a valid Solana or NEAR wallet address',
    RATE_LIMIT: 'Too many attempts. Please try again in a few minutes.',
    NETWORK_ERROR: 'Network error. Please try again.',
    VERIFICATION_FAILED: 'Wallet verification failed. Please check the address and try again.'
  }
};