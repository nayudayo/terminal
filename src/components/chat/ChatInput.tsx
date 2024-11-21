import { useRef, useEffect, useState } from 'react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  canType: boolean;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  referralCode?: string | null;
}

export function ChatInput({ 
  input, 
  setInput, 
  canType, 
  isLoading, 
  onSubmit,
  referralCode 
}: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showCode, setShowCode] = useState(false);

  // Auto-focus effect
  useEffect(() => {
    if (canType && inputRef.current) {
      inputRef.current.focus();
    }
  }, [canType]);

  // Re-focus when user clicks anywhere in the window
  useEffect(() => {
    const handleWindowClick = () => {
      if (canType && inputRef.current) {
        inputRef.current.focus();
      }
    };

    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, [canType]);

  return (
    <form onSubmit={onSubmit} className="border-t border-[#FF0000]/20 p-4 bg-black/30">
      <div className="flex items-center gap-2 relative">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!canType || isLoading}
          className="flex-1 bg-black/50 focus:outline-none disabled:opacity-50 
                   disabled:cursor-not-allowed glow-text-input px-3 py-2 
                   border border-[#FF0000]/20 rounded font-['Press_Start_2P'] text-xs text-white"
          placeholder={canType ? "Enter query..." : "Messenger typing..."}
        />
        <div className="flex items-center gap-2">
          {referralCode && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="px-3 py-2 text-[#FF0000] border border-[#FF0000]/20 rounded
                         hover:bg-[#FF0000]/10 transition-colors
                         font-['Press_Start_2P'] text-xs"
              >
                CODE
              </button>
              {showCode && (
                <div className="absolute bottom-full mb-2 right-0 
                              bg-black border-2 border-[#FF0000] p-4 rounded-none
                              shadow-[0_0_15px_rgba(255,0,0,0.3)] min-w-[200px]">
                  <p className="text-[#FF0000] font-mono text-xs mb-2">
                    YOUR REFERENCE CODE:
                  </p>
                  <p className="text-[#FF0000] font-mono text-sm font-bold tracking-wider">
                    {referralCode}
                  </p>
                </div>
              )}
            </div>
          )}
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
      </div>
    </form>
  );
} 