'use client';

interface CodeGeneratedModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
}

export default function CodeGeneratedModal({ isOpen, onClose, code }: CodeGeneratedModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm
        transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
    >
      <div 
        className={`bg-black border-2 border-[#FF0000] p-4 sm:p-8 rounded-none w-full max-w-[90vw] sm:max-w-md mx-2 sm:mx-4
          transform transition-all duration-300 shadow-[0_0_15px_rgba(255,0,0,0.3)]
          ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="border-b-2 border-[#FF0000] pb-3 sm:pb-4 mb-4 sm:mb-6">
          <h2 className="text-[#FF0000] text-lg sm:text-2xl font-['Press_Start_2P'] glitch-text text-center">
            [CODE GENERATED]
          </h2>
        </div>

        <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
          <p className="text-[#FF0000] font-mono text-base sm:text-lg leading-relaxed tracking-wider text-center">
            YOUR REFERENCE CODE:
          </p>
          <div className="bg-[#FF0000]/10 border-2 border-[#FF0000] p-3 sm:p-4">
            <p className="text-[#FF0000] font-mono text-lg sm:text-xl text-center font-bold tracking-wider">
              {code}
            </p>
          </div>
          <p className="text-[#FF0000]/80 font-mono text-sm sm:text-base text-center">
            SHARE THIS CODE WITH OTHERS
          </p>
        </div>

        <div className="flex justify-center pt-3 sm:pt-4 border-t-2 border-[#FF0000]/20">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-[#FF0000] text-black hover:bg-[#CC0000] 
                     transition-all duration-200 font-mono text-sm sm:text-base tracking-wider
                     focus:outline-none focus:ring-2 focus:ring-[#FF0000] focus:ring-opacity-50
                     shadow-[0_0_10px_rgba(255,0,0,0.5)]"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
} 