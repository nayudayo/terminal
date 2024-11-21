'use client';

import { useChat } from '../hooks/useChat';
import { ChatInput } from './chat/ChatInput';
import { formatTimestamp } from '@/utils/formatters';
import { Message } from '@/types/chat';
import { useRef, useEffect, useState, useCallback } from 'react';
import { Typewriter } from './chat/Typewriter';
import { v4 as uuidv4 } from 'uuid';
import { POST_PUSH_MESSAGE } from '@/constants/messages';
import { PushButton } from './chat/PushButton';
import AuthModal from './AuthModal';
import AuthCheckModal from './AuthCheckModal';
import CodeGeneratedModal from './CodeGeneratedModal';

const MessageContent = ({ 
  message, 
  onTypewriterComplete,
  setMessages 
}: { 
  message: Message; 
  onTypewriterComplete: () => void;
  setMessages: (newMessage: Message) => void;
}) => {
  const handleFinalComplete = () => {
    onTypewriterComplete();
  };

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

  if (message.showButton && typeof message.content === 'string') {
    return (
      <div className="font-['Courier_New'] text-sm leading-[1.2]">
        <PushButton onPushComplete={() => {
          handleFinalComplete();
          setMessages({
            id: uuidv4(),
            role: 'assistant',
            content: POST_PUSH_MESSAGE,
            timestamp: Date.now(),
          });
        }} />
      </div>
    );
  }

  if (typeof message.content === 'string') {
    return (
      <div className="inline font-['Courier_New'] text-sm leading-[1.2]">
        <Typewriter text={message.content} onComplete={handleFinalComplete} />
      </div>
    );
  }

  return null;
};

export default function Chat({ userId }: { userId: string }) {
  const {
    messages,
    input,
    isLoading,
    isTyping,
    canType,
    showTelegramFallback,
    setInput,
    addMessage,
    setShowTelegramFallback,
    handleSubmit,
    handleTypewriterComplete,
  } = useChat(userId);

  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [activeModal, setActiveModal] = useState<'none' | 'auth' | 'authCheck'>('none');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const handleCommand = useCallback((event: CustomEvent) => {
    console.log('Received command:', event.detail);
    
    if (event.detail === 'CONNECT_TWITTER') {
      console.log('Setting active modal to auth');
      setActiveModal('auth');
    } else if (event.detail === 'AUTH_COMPLETE') {
      setActiveModal('none');
    }
  }, []);

  const handleChatMessage = useCallback((event: CustomEvent) => {
    if (event.detail.type === 'AUTHENTICATED') {
      addMessage({
        id: uuidv4(),
        content: event.detail.message,
        role: 'assistant',
        timestamp: Date.now(),
        isAuthenticated: true,
      });
    } else if (event.detail.type === 'CODE_GENERATED') {
      setGeneratedCode(event.detail.code);
    }
  }, [addMessage]);

  useEffect(() => {
    window.addEventListener('CHAT_COMMAND', handleCommand as EventListener);
    window.addEventListener('CHAT_MESSAGE', handleChatMessage as EventListener);
    
    return () => {
      window.removeEventListener('CHAT_COMMAND', handleCommand as EventListener);
      window.removeEventListener('CHAT_MESSAGE', handleChatMessage as EventListener);
    };
  }, [handleCommand, handleChatMessage]);

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTo({
        top: messageContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
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
          addMessage({
            id: uuidv4(),
            content: data.message,
            role: 'assistant',
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.error('Error loading current stage:', error);
      }
    };

    loadCurrentStage();
  }, [userId, addMessage]);

  const handleAuthStart = () => {
    setActiveModal('authCheck');
    const width = 600;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      '/api/auth/signin/twitter',
      'Twitter Auth',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  const handleRetryAuth = () => {
    setActiveModal('auth');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] sm:h-[calc(100vh-16rem)] rounded-lg relative">
      <div 
        ref={messageContainerRef}
        className="flex-1 min-h-0 overflow-y-auto hide-scrollbar bg-black/95 px-2 sm:px-4"
      >
        <div className="py-4 font-mono whitespace-pre-wrap break-words">
          {messages.map((message) => (
            <div key={message.id} className="text-xs sm:text-sm md:text-base inline-block w-full">
              <span className="opacity-50 text-white select-none break-keep">
                [{formatTimestamp(message.timestamp || Date.now())}]
              </span>{' '}
              {message.role === 'user' ? (
                <span className="text-white break-all">
                  {`<${userId}> ${message.content}`}
                </span>
              ) : (
                <span className="inline-block w-full">
                  <span className="text-white select-none break-keep">
                    {`<Messenger> `}
                  </span>
                  <MessageContent 
                    message={{
                      ...message,
                      timestamp: message.timestamp || Date.now()
                    }}
                    onTypewriterComplete={handleTypewriterComplete}
                    setMessages={addMessage}
                  />
                </span>
              )}
              <br />
            </div>
          ))}
          
          {isTyping && (
            <div className="opacity-50 glow-text-subtle animate-pulse inline-block">
              <span className="text-white text-xs sm:text-sm">Messenger is typing...</span>
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 left-0 right-0 mt-auto bg-black/95 border-t border-[#FF0000]/20">
        <ChatInput
          input={input}
          setInput={setInput}
          canType={canType}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          referralCode={generatedCode}
        />
      </div>

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

      <AuthModal
        isOpen={activeModal === 'auth'}
        onClose={() => setActiveModal('none')}
        onConnect={() => setActiveModal('authCheck')}
        onAuthStart={handleAuthStart}
      />

      <AuthCheckModal
        isOpen={activeModal === 'authCheck'}
        onAuthConfirmed={() => setActiveModal('none')}
        onRetryAuth={handleRetryAuth}
      />

      <CodeGeneratedModal
        isOpen={!!generatedCode}
        onClose={() => setGeneratedCode(null)}
        code={generatedCode || ''}
      />
    </div>
  );
}