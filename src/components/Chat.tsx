'use client';

import { useState, useRef, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  content: string | typeof INTRO_MESSAGE;
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

const AsciiArtWithButton = ({ onButtonClick }: { text: string | typeof INTRO_MESSAGE; onButtonClick: () => void }) => {
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
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('push-meter'));
    }
    
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

const INTRO_MESSAGE = {
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

const IntroTypewriter = ({ text, onComplete }: { text: typeof INTRO_MESSAGE; onComplete?: () => void }) => {
  const [displayText, setDisplayText] = useState<React.ReactNode>('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const typewriterRef = useRef<HTMLPreElement>(null);

  const fullText = text.prefix + text.command1 + text.middle + text.command2 + text.suffix;

  useEffect(() => {
    if (isComplete) return;

    if (currentIndex < fullText.length) {
      const timeout = setTimeout(() => {
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
  }, [currentIndex, fullText, onComplete, isComplete]);

  useEffect(() => {
    const prefix = text.prefix.slice(0, currentIndex);
    const command1Length = text.command1.length;
    const middleLength = text.middle.length;
    const command2Length = text.command2.length;
    
    const command1Start = text.prefix.length;
    const middleStart = command1Start + command1Length;
    const command2Start = middleStart + middleLength;

    const command1 = currentIndex > command1Start 
      ? text.command1.slice(0, currentIndex - command1Start) 
      : '';
    const middle = currentIndex > middleStart
      ? text.middle.slice(0, currentIndex - middleStart)
      : '';
    const command2 = currentIndex > command2Start
      ? text.command2.slice(0, currentIndex - command2Start)
      : '';
    const suffix = currentIndex > command2Start + command2Length
      ? text.suffix.slice(0, currentIndex - command2Start - command2Length)
      : '';

    setDisplayText(
      <>
        <span className="text-white">{prefix}</span>
        <span className="text-[#FF0000]">{command1}</span>
        <span className="text-white">{middle}</span>
        <span className="text-[#FF0000]">{command2}</span>
        <span className="text-white">{suffix}</span>
      </>
    );
  }, [currentIndex, text]);

  useEffect(() => {
    if (isComplete) {
      onComplete?.();
    }
  }, [isComplete, onComplete]);

  return (
    <pre 
      ref={typewriterRef}
      className="whitespace-pre font-['Courier_New'] text-sm leading-[1.2]"
    >
      {displayText}
    </pre>
  );
};

const POST_PUSH_MESSAGE = {
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

const PostPushTypewriter = ({ text, onComplete }: { text: typeof POST_PUSH_MESSAGE; onComplete?: () => void }) => {
  const [displayText, setDisplayText] = useState<React.ReactNode>('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const typewriterRef = useRef<HTMLPreElement>(null);

  const fullText = text.prefix + text.command + text.suffix;

  useEffect(() => {
    if (isComplete) return;

    if (currentIndex < fullText.length) {
      const timeout = setTimeout(() => {
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
  }, [currentIndex, fullText, onComplete, isComplete]);

  useEffect(() => {
    const prefix = text.prefix.slice(0, currentIndex);
    const command = currentIndex > text.prefix.length 
      ? text.command.slice(0, currentIndex - text.prefix.length) 
      : '';
    const suffix = currentIndex > text.prefix.length + text.command.length
      ? text.suffix.slice(0, currentIndex - text.prefix.length - text.command.length)
      : '';

    setDisplayText(
      <>
        <span className="text-white">{prefix}</span>
        <span className="text-[#FF0000]">{command}</span>
        <span className="text-white">{suffix}</span>
      </>
    );
  }, [currentIndex, text]);

  useEffect(() => {
    if (isComplete) {
      onComplete?.();
    }
  }, [isComplete, onComplete]);

  return (
    <pre 
      ref={typewriterRef}
      className="whitespace-pre font-['Courier_New'] text-sm leading-[1.2]"
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

// Add this helper function at the top level
const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Create the main component
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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleFocus = async () => {
        // Re-check session when window gains focus
        const event = new Event("visibilitychange");
        document.dispatchEvent(event);
      };

      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }
  }, []);

  // Initialize messages with a stable timestamp
  useEffect(() => {
    const initialTimestamp = Math.floor(Date.now() / 1000) * 1000; // Round to nearest second
    const initialMessageId = '1'; // Use a stable ID for initial message

    if (session?.user) {
      setMessages([{
        id: initialMessageId,
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
        timestamp: initialTimestamp,
        isIntro: true,
        isAuthenticated: true
      }]);
    } else {
      setMessages([{
        id: initialMessageId,
        role: 'assistant',
        content: INTRO_MESSAGE,
        timestamp: initialTimestamp,
        isIntro: true
      }]);
    }
    setCanType(true);
  }, [session]);

  const handleTypewriterComplete = () => {
    setCanType(true);
    setIsTyping(false);
    inputRef.current?.focus();
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

  // Modify handleSubmit to use uuidv4
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const messageTimestamp = Date.now();
    const messageId = uuidv4();

    const userMessage: Message = {
      id: messageId,
      role: 'user',
      content: input,
      timestamp: messageTimestamp,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    if (input.toLowerCase().includes('push')) {
      setTimeout(() => {
        const responseId = uuidv4();
        setMessages(prev => [...prev, {
          id: responseId,
          role: 'assistant',
          content: UP_PUSH_RESPONSE_ART,
          timestamp: Date.now(),
          isIntro: true,
          showButton: true
        }]);
        setIsLoading(false);
        setIsTyping(false);
      }, 1000);
      return;
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
          id: uuidv4(),
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
        id: uuidv4(),
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
        id: uuidv4(),
        role: 'assistant',
        content: POST_PUSH_MESSAGE.prefix + POST_PUSH_MESSAGE.command + POST_PUSH_MESSAGE.suffix,
        timestamp: Date.now(),
      }]);
      setIsTyping(false);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-transparent rounded-lg">
      <div className="flex-1 overflow-y-auto space-y-4 hide-scrollbar p-6">
        {messages.map((message) => (
          <div key={message.id} className="font-mono text-sm sm:text-base break-words">
            <span className="opacity-50 text-white select-none" suppressHydrationWarning>
              [{formatTimestamp(message.timestamp)}]
            </span>{' '}
            {message.role === 'user' ? (
              <span className="text-white" suppressHydrationWarning>
                {`<${userId}> ${message.content}`}
              </span>
            ) : (
              <div className="ml-2 sm:ml-4">
                <span className="text-white select-none" suppressHydrationWarning>
                  {`<Messenger> `}
                </span>
                {message.isIntro && message.showButton ? (
                  <AsciiArtWithButton 
                    text={message.content}
                    onButtonClick={handleButtonClick}
                  />
                ) : typeof message.content === 'object' ? (
                  <IntroTypewriter 
                    text={message.content}
                    onComplete={handleTypewriterComplete}
                  />
                ) : message.content === (POST_PUSH_MESSAGE.prefix + POST_PUSH_MESSAGE.command + POST_PUSH_MESSAGE.suffix) ? (
                  <PostPushTypewriter 
                    text={POST_PUSH_MESSAGE}
                    onComplete={handleTypewriterComplete}
                  />
                ) : message.content.includes('[') || message.content.includes('ERROR:') ? (
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
          <div className="opacity-50 glow-text-subtle animate-pulse">
            <AsciiTypewriter text="Messenger is typing..." />
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-[#FF0000]/20 p-4 bg-black/30">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!canType || isLoading}
            className="flex-1 bg-black/50 focus:outline-none disabled:opacity-50 
                     disabled:cursor-not-allowed glow-text-input px-3 py-2 
                     border border-[#FF0000]/20 rounded font-['Press_Start_2P'] text-xs text-white"
            placeholder={canType ? "Enter message..." : "Wait for message to complete..."}
          />
          <button
            type="submit"
            disabled={!canType || isLoading}
            className="px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed 
                     text-white border border-[#FF0000]/20 rounded
                     hover:bg-[#FF0000]/10 transition-colors
                     font-['Press_Start_2P'] text-xs"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}