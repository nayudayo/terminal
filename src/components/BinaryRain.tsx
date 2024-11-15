'use client';

import { useEffect, useRef } from 'react';

const BinaryRain = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match window
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Characters to use (expanded set for more variety)
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const fontSize = 16;
    const columns = canvas.width / fontSize;
    
    // Array for drops - initialized with random starting positions
    const drops: number[] = Array.from({ length: Math.floor(columns) }, 
      () => -Math.floor(Math.random() * canvas.height/fontSize)
    );

    // Array for character speeds - some columns move faster than others
    const speeds: number[] = Array.from({ length: Math.floor(columns) }, 
      () => Math.random() * 0.5 + 0.5
    );

    // Array for character opacities
    const opacities: number[] = Array.from({ length: Math.floor(columns) }, 
      () => Math.random() * 0.5 + 0.5
    );

    const draw = () => {
      // Semi-transparent black for trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Set text properties
      ctx.font = `${fontSize}px monospace`;
      ctx.textAlign = 'center';

      // Loop over drops
      for (let i = 0; i < drops.length; i++) {
        // Get random character
        const char = chars[Math.floor(Math.random() * chars.length)];
        
        // Calculate position
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Create gradient for each character
        const gradient = ctx.createLinearGradient(x, y - fontSize, x, y);
        gradient.addColorStop(0, `rgba(89, 0, 0, 0)`);
        gradient.addColorStop(0.5, `rgba(255, 26, 26, ${opacities[i]})`);
        gradient.addColorStop(1, `rgba(89, 0, 0, ${opacities[i] * 0.3})`);
        
        // Draw character with glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff1a1a';
        ctx.fillStyle = gradient;
        ctx.fillText(char, x, y);
        
        // Reset shadow for next character
        ctx.shadowBlur = 0;

        // Reset when off screen
        if (y > canvas.height) {
          drops[i] = 0;
          speeds[i] = Math.random() * 0.5 + 0.5;
          opacities[i] = Math.random() * 0.5 + 0.5;
        }

        // Move drop
        drops[i] += speeds[i];
      }
    };

    // Animation loop with higher frame rate
    const interval = setInterval(draw, 33); // ~30fps

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{
        mixBlendMode: 'screen',
        zIndex: 0,
        opacity: 0.6,
        filter: 'contrast(1.2) brightness(1.1)',
        pointerEvents: 'none'
      }}
    />
  );
};

export default BinaryRain; 