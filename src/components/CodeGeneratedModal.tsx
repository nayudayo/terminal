'use client';

import { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';

interface CodeGeneratedModalProps {
 isOpen: boolean;
 onClose: () => void;
 code: string;
}

export default function CodeGeneratedModal({ isOpen, onClose, code }: CodeGeneratedModalProps) {
 const [isVisible, setIsVisible] = useState(false);
 const [scanLine, setScanLine] = useState(0);
 const [hasCopied, setHasCopied] = useState(false);
 const [pushRating] = useState(() => Math.floor(Math.random() * 69420) + 1);
 const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
   if (isOpen) {
     setIsVisible(true);
     const interval = setInterval(() => {
       setScanLine(prev => (prev + 1) % 100);
     }, 50);
     return () => clearInterval(interval);
   } else {
     const timer = setTimeout(() => setIsVisible(false), 300);
     return () => clearTimeout(timer);
   }
 }, [isOpen]);
  const handleCopy = async () => {
   try {
     await navigator.clipboard.writeText(code);
     setHasCopied(true);
   } catch (err) {
     console.error('Failed to copy:', err);
     setHasCopied(true);
   }
 };

  // Get color based on rating intensity
  const getRatingColor = (rating: number) => {
    if (rating >= 90) return 'text-[#FF0000]'; // Intense red
    if (rating >= 70) return 'text-[#FF4500]'; // Orange red
    if (rating >= 50) return 'text-[#FFA500]'; // Orange
    if (rating >= 30) return 'text-[#FFD700]'; // Gold
    return 'text-[#98FB98]'; // Pale green
  };

  const getRatingSize = (rating: number) => {
    if (rating >= 90) return 'text-8xl';
    if (rating >= 70) return 'text-7xl';
    if (rating >= 50) return 'text-6xl';
    if (rating >= 30) return 'text-5xl';
    return 'text-4xl';
  };

  // New function to handle sharing
  const handleShare = () => {
    try {
      // Prepare the tweet text
      const tweetText = `PUSH Rating: ${pushRating} 🔥\nReferral: ${code}\n`;
      
      // Create Twitter Web Intent URL
      const twitterUrl = new URL('https://twitter.com/intent/tweet');
      
      // Add parameters
      twitterUrl.searchParams.append('text', tweetText);
      twitterUrl.searchParams.append('via', 'pushbuttonlol');
      twitterUrl.searchParams.append('url', window.location.href);

      // Open Twitter Web Intent in a popup window
      window.open(
        twitterUrl.toString(),
        'Share on X',
        'width=550,height=420,scrollbars=yes'
      );

      setHasCopied(true);
    } catch (err) {
      console.error('Failed to share:', err);
    }
  };

  if (!isVisible) return null;
  return (
   <div ref={modalRef} 
     className={`fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm
       transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
   >
     <div 
       className={`relative bg-black/95 w-full max-w-md mx-4
         transform transition-all duration-300 
         shadow-[0_0_50px_rgba(153,27,27,0.3)]
         animate-pulse-slow
         ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
       onClick={e => e.stopPropagation()}
     >
       {/* Scan Line Effect */}
       <div 
         className="absolute inset-0 pointer-events-none overflow-hidden"
         style={{
           background: `linear-gradient(transparent ${scanLine}%, rgba(153,27,27,0.15) ${scanLine + 0.5}%, transparent ${scanLine + 1}%)`
         }}
       />
        {/* Glitch Effect Container */}
       <div className="absolute inset-0 glitch-container">
         <div className="absolute inset-0 border-2 border-red-800/70 
                        shadow-[inset_0_0_20px_rgba(153,27,27,0.4)]
                        animate-glitch-1" />
         <div className="absolute inset-0 border border-red-900/50 m-[2px] 
                        shadow-[0_0_15px_rgba(153,27,27,0.3)]
                        animate-glitch-2" />
         <div className="absolute inset-0 border border-red-950/30 m-[4px]
                        animate-glitch-3" />
       </div>
        {/* Content Container */}
       <div className="relative p-6 space-y-6">
         {/* PUSH Rating Section */}
         <div className="space-y-6 py-6 border-b-2 border-red-800/50">
           <p className="text-lg font-['IBM_Plex_Mono'] text-red-700 text-center leading-relaxed tracking-[0.3em]
             drop-shadow-[0_0_8px_rgba(153,27,27,0.5)]
             text-shadow-[0_0_8px_rgba(220,38,38,0.6)]">
             $PUSH RATING
           </p>
           <div className="flex justify-center items-center py-4">
             <span className={`font-['IBM_Plex_Mono'] ${getRatingSize(pushRating)} ${getRatingColor(pushRating)} 
               font-bold tracking-wider drop-shadow-[0_0_15px_rgba(153,27,27,0.8)]
               text-shadow-[0_0_15px_rgba(220,38,38,0.9)]
               animate-pulse-slow`}>
               {pushRating}
             </span>
           </div>
         </div>
          {/* Code Display */}
         <div className="space-y-4 py-4">
           <p className="text-sm font-['IBM_Plex_Mono'] text-red-700 text-center leading-relaxed tracking-wider
                      drop-shadow-[0_0_8px_rgba(153,27,27,0.5)]
                      text-shadow-[0_0_8px_rgba(220,38,38,0.6)]">
             YOUR REFERENCE CODE:
           </p>
           <div className="bg-red-950/20 border-2 border-red-800/70 p-4 shadow-[0_0_20px_rgba(153,27,27,0.3)]">
             <p className="font-['IBM_Plex_Mono'] text-xl text-red-700 text-center font-bold tracking-[0.3em]
                        drop-shadow-[0_0_10px_rgba(153,27,27,0.6)]
                        text-shadow-[0_0_10px_rgba(220,38,38,0.8)]
                        select-all cursor-pointer"
                onClick={() => handleCopy()}>
               {code}
             </p>
           </div>
           <div className="text-xs font-['IBM_Plex_Mono'] text-red-600 text-center tracking-[0.15em]
                         drop-shadow-[0_0_6px_rgba(153,27,27,0.4)]
                         animate-pulse">
             SPREAD THE WORD
           </div>
         </div>
          {/* Actions */}
         <div className="grid grid-cols-2 gap-3 pt-4 border-t border-red-800/50">
           <button
             onClick={handleShare}
             className="group px-4 py-2 bg-red-950/40 border-2 border-red-800/70 text-red-800
                      hover:bg-red-900/50 hover:border-red-700/80 hover:text-red-700
                      transition-all duration-200 font-['IBM_Plex_Mono'] text-sm tracking-[0.2em]
                      shadow-[0_0_20px_rgba(153,27,27,0.3)]
                      hover:shadow-[0_0_25px_rgba(153,27,27,0.4)]
                      relative overflow-hidden
                      focus:outline-none focus:ring-2 focus:ring-red-800/50"
           >
             <span className="relative z-10">
               [{hasCopied ? 'SHARED!' : 'SHARE ON X'}]
             </span>
             <div className="absolute inset-0 bg-gradient-to-r from-red-950/0 via-red-950/30 to-red-950/0
                           transform translate-x-[-100%] group-hover:translate-x-[100%]
                           transition-transform duration-1000" />
           </button>
           <button
             onClick={onClose}
             disabled={!hasCopied}
             className={`group px-4 py-2 border-2 text-sm tracking-[0.2em] font-['IBM_Plex_Mono']
                      transition-all duration-200 relative overflow-hidden
                      ${hasCopied
                        ? 'bg-black border-red-800/70 text-red-800 hover:bg-red-950/40 hover:border-red-700/80 hover:text-red-700' 
                        : 'bg-red-950/10 border-red-900/30 text-red-900/30 cursor-not-allowed'}`}
           >
             <span className="relative z-10">[CONTINUE]</span>
             {hasCopied && (
               <div className="absolute inset-0 bg-gradient-to-r from-red-950/0 via-red-950/30 to-red-950/0
                             transform translate-x-[-100%] group-hover:translate-x-[100%]
                             transition-transform duration-1000" />
             )}
           </button>
         </div>
       </div>
     </div>
   </div>
  );
}