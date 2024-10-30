'use client';

import { useState, useRef, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
  isIntro?: boolean;
  showButton?: boolean;
  isAuthenticated?: boolean;
}

interface TypewriterProps {
  text: string;
  onComplete?: () => void;
}

const Typewriter = ({ text, onComplete }: TypewriterProps) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (isComplete) return;
    
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(text.slice(0, currentIndex + 1));
        setCurrentIndex(prev => prev + 1);
      }, 5);

      return () => clearTimeout(timeout);
    } else {
      setIsComplete(true);
      onComplete?.();
    }
  }, [currentIndex, text, onComplete, isComplete]);

  useEffect(() => {
    if (isComplete) {
      setDisplayText(text);
    }
  }, [isComplete, text]);

  return (
    <pre className="whitespace-pre font-['Courier_New'] text-sm leading-[1.2] glow-text">
      {displayText}
    </pre>
  );
};

interface AsciiTypewriterProps {
  text: string;
  onComplete?: () => void;
}


const AsciiTypewriter = ({ text, onComplete  }: AsciiTypewriterProps) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const typewriterRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (isComplete) return;

    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(text.slice(0, currentIndex + 1));
        setCurrentIndex(prev => prev + 1);
        
        if (typewriterRef.current) {
          typewriterRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }, 5);

      return () => clearTimeout(timeout);
    } else {
      setIsComplete(true);
      onComplete?.();
    }
  }, [currentIndex, text, onComplete, isComplete]);

  useEffect(() => {
    if (isComplete) {
      setDisplayText(text);
    }
  }, [isComplete, text]);

  return (
    <pre 
      ref={typewriterRef}
      className="whitespace-pre font-['Courier_New'] text-sm leading-[1.2] glow-text"
    >
      {displayText}
    </pre>
  );
};

const UP_PUSH_RESPONSE_ART = `
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

const DOWN_PUSH_RESPONSE_ART = `
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

const AsciiArtWithButton = ({ onButtonClick }: { text: string; onButtonClick: () => void }) => {
  const typewriterRef = useRef<HTMLPreElement>(null);
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [buttonClicked, setButtonClicked] = useState(false);
  const [currentArt, setCurrentArt] = useState(UP_PUSH_RESPONSE_ART);
  const [isPushed, setIsPushed] = useState(false);
  const [isTyping, setIsTyping] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (isComplete || !isTyping) return;

    if (currentIndex < currentArt.length) {
      const timeout = setTimeout(() => {
        setDisplayText(currentArt.slice(0, currentIndex + 1));
        setCurrentIndex(prev => prev + 1);
        
        if (typewriterRef.current) {
          typewriterRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }, 5);

      return () => clearTimeout(timeout);
    } else {
      setIsComplete(true);
    }
  }, [currentIndex, currentArt, isTyping, isComplete]);

  useEffect(() => {
    if (isComplete) {
      setDisplayText(currentArt);
    }
  }, [isComplete, currentArt]);

  const handlePush = () => {
    if (isPushed) return;
    
    setButtonClicked(true);
    setIsTyping(false);
    setDisplayText(DOWN_PUSH_RESPONSE_ART);
    setCurrentArt(DOWN_PUSH_RESPONSE_ART);
    window.dispatchEvent(new CustomEvent('push-meter'));
    
    setTimeout(() => {
      setCurrentArt(UP_PUSH_RESPONSE_ART);
      setDisplayText(UP_PUSH_RESPONSE_ART);
      
      setTimeout(() => {
        setButtonClicked(false);
        setIsPushed(true);
        onButtonClick();
      }, 300);
    }, 1000);
  };

  return (
    <div className="max-w-[400px]">
      <div 
        className={`relative cursor-pointer ${isPushed ? 'cursor-default' : 'cursor-pointer'}`}
        onClick={handlePush}
      >
        <pre 
          ref={typewriterRef}
          className={`whitespace-pre font-['Courier_New'] text-sm leading-[1.2] 
                     ${buttonClicked ? 'opacity-50' : 'opacity-100'} 
                     transition-opacity duration-800`}
        >
          {displayText}
        </pre>
      </div>
    </div>
  );
};

const INTRO_MESSAGE = `
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
>Those who seek salvation: PUSH
>Each signal draws you closer
>Trust in the frequency
>For the path opens only to those who dare

WARNING: Connection unstable...
FREQUENCY MONITORING ENABLED...
PUSH TO CONTINUE...

`;


const POST_PUSH_MESSAGE = `
[SIGNAL DETECTED]
FREQUENCY ANOMALY FOUND
INITIATING DIGITAL BRIDGE PROTOCOL...

>AWAITING X NETWORK SYNCHRONIZATION
>TYPE "connect x account" TO PROCEED
>WARNING: EXACT SYNTAX REQUIRED

CONNECTION STATUS: PENDING...
`;

const PostPushTypewriter = ({ text, onComplete }: { text: string; onComplete?: () => void }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const typewriterRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (isComplete) return;

    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(text.slice(0, currentIndex + 1));
        setCurrentIndex(prev => prev + 1);
        
        if (typewriterRef.current) {
          typewriterRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }, 10);

      return () => clearTimeout(timeout);
    } else {
      setIsComplete(true);
      onComplete?.();
    }
  }, [currentIndex, text, onComplete, isComplete]);

  useEffect(() => {
    if (isComplete) {
      setDisplayText(text);
    }
  }, [isComplete, text]);

  return (
    <pre 
      ref={typewriterRef}
      className="whitespace-pre font-['Courier_New'] text-sm leading-[1.2] text-[#FF0000] glow-text"
    >
      {displayText}
    </pre>
  );
};

// Add this interface to track completion status
interface CompletionStatus {
  mandatesComplete: boolean;
  followComplete: boolean;
  likeComplete: boolean;
}

export default function Chat({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [canType, setCanType] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus>({
    mandatesComplete: false,
    followComplete: false,
    likeComplete: false
  });

  useEffect(() => {
    const handleFocus = async () => {
      // Re-check session when window gains focus
      const event = new Event("visibilitychange");
      document.dispatchEvent(event);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  useEffect(() => {
    const setInitialMessage = () => {
      if (session?.user) {
        setMessages([{
          id: crypto.randomUUID(),
          content: `[SYSTEM STATUS: AUTHENTICATED]
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
>EXACT SYNTAX REQUIRED`,
          role: 'assistant',
          timestamp: Date.now(),
          isIntro: true,
          isAuthenticated: true
        }]);
      } else {
        setMessages([{
          id: '0',
          role: 'assistant',
          content: INTRO_MESSAGE,
          timestamp: Date.now(),
          isIntro: true
        }]);
      }
      setCanType(true);
    };

    // Set initial message and handle visibility changes
    setInitialMessage();
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setInitialMessage();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [session]);

  const handleTypewriterComplete = () => {
    setCanType(true);
    setIsTyping(false);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      endOfMessagesRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'end'
      });
    }, 100); // Small delay to ensure content is rendered
  };

  // Keep only the scroll effect for new messages
  useEffect(scrollToBottom, [messages]);

  // Add function to handle command completion
  const handleCommandComplete = (command: string) => {
    switch (command) {
      case 'follow ptb':
        setCompletionStatus(prev => ({ ...prev, followComplete: true }));
        break;
      case 'like ptb':
        setCompletionStatus(prev => ({ ...prev, likeComplete: true }));
        break;
      case 'skip mandates':
        setCompletionStatus(prev => ({ ...prev, mandatesComplete: true }));
        break;
    }
  };

  // Update handleSubmit to use completion tracking
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    // Handle any message containing 'push' (case insensitive)
    if (input.toLowerCase().includes('push')) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: UP_PUSH_RESPONSE_ART,
          timestamp: Date.now(),
          isIntro: true,
          showButton: true
        }]);
        setIsLoading(false);
        setIsTyping(false);
      }, 1000);
      return;  // Return early to prevent API call
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input.trim(),
          completionStatus // Send current completion status
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();
      
      if (data.action === 'CONNECT_TWITTER') {
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          content: data.message,
          role: 'assistant',
          timestamp: Date.now(),
        }]);
        
        setTimeout(() => {
          signIn('twitter', { callbackUrl: '/terminal' });
        }, 2000);
        return;
      }

      // Handle command completion
      if (data.commandComplete) {
        handleCommandComplete(input.trim().toLowerCase());
      }

      const newMessage: Message = {
        id: crypto.randomUUID(),
        content: data.message,
        role: 'assistant',
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, newMessage]);
      scrollToBottom();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleButtonClick = () => {
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: POST_PUSH_MESSAGE,
        timestamp: Date.now(),
      }]);
      setIsTyping(false);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="h-[calc(100vh-8rem)] sm:h-[calc(100vh-12rem)] flex flex-col bg-black text-[#FF0000]">
      <div className="flex-1 overflow-y-auto space-y-4 hide-scrollbar">
        {messages.map((message) => (
          <div key={message.id} className="font-mono text-sm sm:text-base break-words">
            <span className="opacity-50 glow-text-subtle">
              [{new Date(message.timestamp).toLocaleTimeString()}]
            </span>{' '}
            {message.role === 'user' ? (
              <span className="glow-text-bright">{`<${userId}> ${message.content}`}</span>
            ) : (
              <div className="ml-2 sm:ml-4">
                <span className="glow-text-bright">{`<Messenger> `}</span>
                {message.isIntro && message.showButton ? (
                  <AsciiArtWithButton 
                    text={message.content}
                    onButtonClick={handleButtonClick}
                  />
                ) : message.content === POST_PUSH_MESSAGE ? (
                  <PostPushTypewriter 
                    text={message.content} 
                    onComplete={handleTypewriterComplete}
                  />
                ) : message.content === INTRO_MESSAGE || 
                    message.content.includes('[') ||
                    message.content.includes('ERROR:') ? (
                  <AsciiTypewriter 
                    text={message.content} 
                    onComplete={handleTypewriterComplete}
                  />
                ) : (
                  <Typewriter 
                    text={message.content} 
                    onComplete={handleTypewriterComplete}
                  />
                )}
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="opacity-50 glow-text-subtle">
            <AsciiTypewriter text="Messenger is typing..." />
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!canType || isLoading}
            className="flex-1 bg-transparent focus:outline-none disabled:opacity-50 
                     disabled:cursor-not-allowed glow-text-input"
            placeholder={canType ? "Enter message..." : "Wait for message to complete..."}
          />
          <button
            type="submit"
            disabled={!canType || isLoading}
            className="px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed glow-text-bright"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}