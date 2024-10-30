'use client';

import { useState, useEffect } from 'react';

export default function FrequencyMeter() {
  const [pushes, setPushes] = useState<number[]>([]);
  const [frequency, setFrequency] = useState(0);
  const maxTimeWindow = 60000; // 1 minute in milliseconds
  const resetTimeout = 5000;   // 5 seconds for reset

  const calculateFrequency = (timestamps: number[]) => {
    const now = Date.now();
    const recentPushes = timestamps.filter(time => now - time <= maxTimeWindow);
    return (recentPushes.length / (maxTimeWindow / 1000)) * 60;
  };

  useEffect(() => {
    const handlePush = () => {
      const now = Date.now();
      setPushes(prev => {
        const newPushes = [...prev, now].filter(time => now - time <= maxTimeWindow);
        return newPushes;
      });
    };

    let resetTimer: NodeJS.Timeout;

    const interval = setInterval(() => {
      const now = Date.now();
      setPushes(prev => {
        const filteredPushes = prev.filter(time => now - time <= maxTimeWindow);
        
        // Reset if no pushes in last 5 seconds
        if (filteredPushes.length > 0 && now - Math.max(...filteredPushes) > resetTimeout) {
          return [];
        }
        
        return filteredPushes;
      });
      setFrequency(calculateFrequency(pushes));
    }, 100);

    window.addEventListener('push-meter', handlePush);
    
    return () => {
      window.removeEventListener('push-meter', handlePush);
      clearInterval(interval);
      if (resetTimer) clearTimeout(resetTimer);
    };
  }, [pushes]);

  const getFrequencyColor = () => {
    if (frequency >= 15) return 'text-[#FF0000]';  // High frequency - Red
    if (frequency >= 8) return 'text-[#FFA500]';   // Medium frequency - Orange
    return 'text-[#00FF00]';                       // Low frequency - Green
  };

  const getMeterBars = () => {
    const maxBars = 20; // Limit the meter size
    const bars = Math.min(Math.floor(frequency), maxBars);
    return '|'.repeat(bars);
  };

  return (
    <div className="font-mono text-xs sm:text-base break-words">
      <span>Frequency: </span>
      <span className={getFrequencyColor()}>
        {getMeterBars()} [{frequency.toFixed(1)}/min]
      </span>
    </div>
  );
}
