import { useRef, useEffect } from 'react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  canType: boolean;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function ChatInput({ input, setInput, canType, isLoading, onSubmit }: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus effect
  useEffect(() => {
    // Focus input when component mounts and whenever canType changes to true
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
          placeholder={canType ? "Enter query..." : "Messenger typing..."}
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
  );
} 