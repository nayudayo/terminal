'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
  isIntro?: boolean;
  showButton?: boolean;
}

interface TypewriterProps {
  text: string;
  onComplete?: () => void;
}

const Typewriter = ({ text, onComplete }: TypewriterProps) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 30);

      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, onComplete]);

  return <span className="break-words">{displayText}</span>;
};

interface AsciiTypewriterProps {
  text: string;
  onComplete?: () => void;
}


const AsciiTypewriter = ({ text, onComplete  }: AsciiTypewriterProps) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const typewriterRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
        
        // Auto-scroll to the current typing position
        if (typewriterRef.current) {
          typewriterRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }, 5);

      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, onComplete]);

  return (
    <pre 
      ref={typewriterRef}
      className="whitespace-pre font-['Courier_New'] text-sm leading-[1.2]"
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

  useEffect(() => {
    if (isTyping && currentIndex < currentArt.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + currentArt[currentIndex]);
        setCurrentIndex(prev => prev + 1);
        
        if (typewriterRef.current) {
          typewriterRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }, 5);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, currentArt, isTyping]);

  const handlePush = () => {
    if (isPushed) return;
    
    setButtonClicked(true);
    setIsTyping(false);
    setDisplayText(DOWN_PUSH_RESPONSE_ART);
    setCurrentArt(DOWN_PUSH_RESPONSE_ART);
    window.dispatchEvent(new CustomEvent('push-meter'));
    
    // Quick push down (300ms)
    setTimeout(() => {
      setCurrentArt(UP_PUSH_RESPONSE_ART);
      setDisplayText(UP_PUSH_RESPONSE_ART);
      
      // Slower release up (800ms)
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
  const typewriterRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
        
        if (typewriterRef.current) {
          typewriterRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }, 30);

      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, onComplete]);

  return (
    <pre 
      ref={typewriterRef}
      className="whitespace-pre font-['Courier_New'] text-sm leading-[1.2] text-[#FF0000]"
    >
      {displayText}
    </pre>
  );
};

export default function Chat({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [canType, setCanType] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([{
      id: '0',
      role: 'assistant',
      content: INTRO_MESSAGE,
      timestamp: Date.now(),
      isIntro: true
    }]);
    setCanType(false);
  }, []);

  const handleTypewriterComplete = () => {
    setCanType(true);
    setIsTyping(false);
  };

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

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

    if (input.toLowerCase().includes('push')) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
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
        body: JSON.stringify({ message: input.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        content: data.message,
        role: 'assistant',
        timestamp: Date.now(),
      }]);
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
            <span className="opacity-50">
              [{new Date(message.timestamp).toLocaleTimeString()}]
            </span>{' '}
            {message.role === 'user' ? (
              <span>{`<${userId}> ${message.content}`}</span>
            ) : (
              <div className="ml-2 sm:ml-4">
                <span>{`<Messenger> `}</span>
                {message.isIntro && message.showButton ? (
                  <AsciiArtWithButton 
                    text={message.content}
                    onButtonClick={handleButtonClick}
                  />
                ) : message.isIntro ? (
                  <AsciiTypewriter 
                    text={message.content} 
                    onComplete={handleTypewriterComplete}
                  />
                ) : message.content === POST_PUSH_MESSAGE ? (
                  <PostPushTypewriter 
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
          <div className="opacity-50">
            <Typewriter text="Messenger is typing..." />
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
                     disabled:cursor-not-allowed"
            placeholder={canType ? "Enter message..." : "Wait for message to complete..."}
          />
          <button
            type="submit"
            disabled={!canType || isLoading}
            className="px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
