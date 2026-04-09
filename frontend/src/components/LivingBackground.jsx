import { useEffect, useState } from 'react';
import './LivingBackground.css';

export default function LivingBackground() {
  const [timeOfDay, setTimeOfDay] = useState('morning');
  const [season, setSeason] = useState('spring');

  useEffect(() => {
    function updateEnvironment() {
      const now = new Date();
      const hour = now.getHours();
      const month = now.getMonth();

      // Time of day
      if (hour >= 5 && hour < 12) {
        setTimeOfDay('morning');
      } else if (hour >= 12 && hour < 17) {
        setTimeOfDay('afternoon');
      } else if (hour >= 17 && hour < 20) {
        setTimeOfDay('evening');
      } else {
        setTimeOfDay('night');
      }

      // Season (Northern Hemisphere)
      if (month >= 2 && month <= 4) {
        setSeason('spring');
      } else if (month >= 5 && month <= 7) {
        setSeason('summer');
      } else if (month >= 8 && month <= 10) {
        setSeason('autumn');
      } else {
        setSeason('winter');
      }
    }

    updateEnvironment();
    const interval = setInterval(updateEnvironment, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`living-background ${timeOfDay} ${season}`}>
      {/* Clouds (morning/afternoon) */}
      {(timeOfDay === 'morning' || timeOfDay === 'afternoon') && (
        <div id="clouds">
          <div className="cloud x1"></div>
          <div className="cloud x2"></div>
          <div className="cloud x3"></div>
          <div className="cloud x4"></div>
          <div className="cloud x5"></div>
        </div>
      )}

      {/* Stars (night) */}
      {timeOfDay === 'night' && (
        <div id="stars"></div>
      )}

      {/* Seasonal particles */}
      <div id="seasonal-particles" className={season}></div>
    </div>
  );
}