'use client';

import { useChat } from '../hooks/useChat';
import { ChatInput } from './chat/ChatInput';
import { formatTimestamp } from '@/utils/formatters';
import { Message, CompletionStatus } from '@/types/chat';
import { useRef, useEffect } from 'react';
import { Typewriter } from './chat/Typewriter';
import { v4 as uuidv4 } from 'uuid';
import { POST_PUSH_MESSAGE } from '@/constants/messages';
import { PushButton } from './chat/PushButton';
import AuthModal from './AuthModal';
import BinaryRain from './BinaryRain';

// Create a MessageContent component to handle different message types
const MessageContent = ({ 
  message, 
  onTypewriterComplete,
  setMessages 
}: { 
  message: Message; 
  onTypewriterComplete: () => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}) => {
  const handleFinalComplete = () => {
    onTypewriterComplete();
  };

  // For INTRO_MESSAGE type
  if (typeof message.content === 'object' && 'prefix' in message.content && 'command1' in message.content) {
    const fullText = 
      message.content.prefix +
      `<red>${message.content.command1}</red>` +
      message.content.middle +
      `<red>${message.content.command2}</red>` +
      message.content.suffix;

    return (
      <div className="inline font-mono">
        <Typewriter 
          text={fullText}
          onComplete={handleFinalComplete}
          processColor={(text) => {
            return text.split(/(<red>.*?<\/red>)/).map((part, index) => {
              if (part.startsWith('<red>') && part.endsWith('</red>')) {
                const content = part.replace(/<\/?red>/g, '');
                return <span key={index} className="text-[#FF0000]">{content}</span>;
              }
              return <span key={index}>{part}</span>;
            });
          }}
        />
      </div>
    );
  }

  // For POST_PUSH_MESSAGE type
  if (typeof message.content === 'object' && 'prefix' in message.content && 'command' in message.content) {
    const fullText = 
      message.content.prefix +
      `<red>${message.content.command}</red>` +
      message.content.suffix;

    return (
      <div className="inline font-['Courier_New'] text-sm leading-[1.2]">
        <Typewriter 
          text={fullText}
          onComplete={handleFinalComplete}
          processColor={(text) => {
            return text.split(/(<red>.*?<\/red>)/).map((part, index) => {
              if (part.startsWith('<red>') && part.endsWith('</red>')) {
                const content = part.replace(/<\/?red>/g, '');
                return <span key={index} className="text-[#FF0000]">{content}</span>;
              }
              return <span key={index}>{part}</span>;
            });
          }}
        />
      </div>
    );
  }

  // For ASCII art push button
  if (message.showButton && typeof message.content === 'string') {
    return (
      <div className="font-['Courier_New'] text-sm leading-[1.2]">
        <PushButton onPushComplete={() => {
          handleFinalComplete();
          setMessages(prev => [...prev, {
            id: uuidv4(),
            role: 'assistant',
            content: POST_PUSH_MESSAGE,
            timestamp: Date.now(),
          }]);
        }} />
      </div>
    );
  }

  // For regular string messages
  if (typeof message.content === 'string') {
    return (
      <div className="inline font-['Courier_New'] text-sm leading-[1.2]">
        <Typewriter text={message.content} onComplete={handleFinalComplete} />
      </div>
    );
  }

  return null;
};

// Add this interface at the top of the file
interface ChatHookReturn {
  messages: Message[];
  input: string;
  isLoading: boolean;
  isTyping: boolean;
  canType: boolean;
  showTelegramFallback: boolean;
  completionStatus: CompletionStatus;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setShowTelegramFallback: React.Dispatch<React.SetStateAction<boolean>>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleTypewriterComplete: () => void;
  showAuthModal: boolean;
  setShowAuthModal: React.Dispatch<React.SetStateAction<boolean>>;
  handleAuthConnect: () => void;
}

export default function Chat({ userId }: { userId: string }) {
  const {
    messages,
    input,
    isLoading,
    isTyping,
    canType,
    showTelegramFallback,
    setInput,
    setMessages,
    setShowTelegramFallback,
    handleSubmit,
    handleTypewriterComplete,
    showAuthModal,
    setShowAuthModal,
    handleAuthConnect,
  } = useChat(userId) as ChatHookReturn;

  const messageContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTo({
        top: messageContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Add effect for auto-scroll
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadCurrentStage = async () => {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: 'LOAD_CURRENT_STAGE',
            userId
          })
        });

        if (response.ok) {
          const data = await response.json();
          setMessages(prev => [...prev, {
            id: uuidv4(),
            content: data.message,
            role: 'assistant',
            timestamp: Date.now()
          }]);
        }
      } catch (error) {
        console.error('Error loading current stage:', error);
      }
    };

    loadCurrentStage();
  }, [userId, setMessages]);

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)] bg-black/80 rounded-lg relative overflow-hidden">
      <BinaryRain />
      {/* Messages container - scrollable area */}
      <div 
        ref={messageContainerRef}
        className="flex-1 min-h-0 overflow-y-auto hide-scrollbar bg-black/30"
      >
        <div className="p-4 font-mono whitespace-pre-wrap">
          {messages.map((message) => (
            <div key={message.id} className="text-sm sm:text-base inline">
              <span className="opacity-50 text-white select-none">
                [{formatTimestamp(message.timestamp)}]
              </span>{' '}
              {message.role === 'user' ? (
                <span className="text-white">
                  {`<${userId}> ${message.content}`}
                </span>
              ) : (
                <span className="inline">
                  <span className="text-white select-none">
                    {`<Messenger> `}
                  </span>
                  <MessageContent 
                    message={message} 
                    onTypewriterComplete={handleTypewriterComplete}
                    setMessages={setMessages}
                  />
                </span>
              )}
              <br />
            </div>
          ))}
          
          {isTyping && (
            <div className="opacity-50 glow-text-subtle animate-pulse inline">
              <span className="text-white">Messenger is typing...</span>
            </div>
          )}
        </div>
      </div>

      {/* Input section - fixed at bottom */}
      <div className="sticky bottom-0 left-0 right-0 mt-auto bg-black/95">
        <ChatInput
          input={input}
          setInput={setInput}
          canType={canType}
          isLoading={isLoading}
          onSubmit={handleSubmit}
        />
      </div>

      {/* Telegram fallback */}
      {showTelegramFallback && (
        <div className="absolute bottom-24 left-4 right-4 bg-black/90 border border-[#FF0000]/20 rounded-lg p-4 shadow-lg">
          <div className="flex justify-between items-start">
            <div className="text-sm text-white font-['Courier_New']">
              If you weren&apos;t redirected automatically, 
              <a 
                href="https://t.me/PTB_Auth_Bot" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#FF0000] hover:text-[#FF0000]/80 ml-1"
              >
                click here to join Telegram
              </a>
            </div>
            <button 
              onClick={() => setShowTelegramFallback(false)}
              className="text-[#FF0000] hover:text-[#FF0000]/80 ml-4 font-['Press_Start_2P'] text-xs"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onConnect={handleAuthConnect}
        onAuthStart={() => {
          setShowAuthModal(false);
          // Add any additional auth start logic here
        }}
      />
    </div>
  );
}