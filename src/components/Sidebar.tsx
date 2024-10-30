export default function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed right-0 top-0 h-screen w-80 
                    border-l-4 border-[#FF0000] bg-black/95 
                    p-4 shadow-[0_0_15px_rgba(255,0,0,0.3)] scanline">
      {children}
    </div>
  );
}
