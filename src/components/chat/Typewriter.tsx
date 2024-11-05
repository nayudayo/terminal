import { useState, useEffect, useRef } from 'react';

interface TypewriterProps {
  text: string;
  onComplete?: () => void;
  delay?: number;
  processColor?: (text: string) => React.ReactNode;
}

export function Typewriter({ text, onComplete, delay = 5, processColor }: TypewriterProps) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const textRef = useRef<HTMLPreElement>(null);

  // Function to scroll to bottom of text
  const scrollToBottom = () => {
    if (textRef.current) {
      const container = textRef.current.closest('.overflow-y-auto');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  };

  useEffect(() => {
    // Reset state when text changes
    setDisplayText('');
    setCurrentIndex(0);
    setIsComplete(false);
  }, [text]);

  useEffect(() => {
    if (isComplete) return;
    
    if (currentIndex < text.length) {
      timeoutRef.current = setTimeout(() => {
        setDisplayText(text.slice(0, currentIndex + 1));
        setCurrentIndex(prev => prev + 1);
        // Scroll after each character
        scrollToBottom();
      }, delay);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    } else {
      setIsComplete(true);
      onComplete?.();
    }
  }, [currentIndex, text, delay, onComplete, isComplete]);

  return (
    <pre 
      ref={textRef}
      className="whitespace-pre font-mono text-sm leading-[1.2] glow-text"
    >
      {processColor ? processColor(displayText) : displayText}
    </pre>
  );
} 