import React from 'react';

interface AIVoiceAnimationProps {
  status?: 'inactive' | 'connecting' | 'active';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AIVoiceAnimation: React.FC<AIVoiceAnimationProps> = ({ 
  status = 'active', 
  size = 'md',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40'
  };

  const pulseDelay = (index: number) => ({
    animationDelay: `${index * 0.3}s`
  });

  const connectingPulseDelay = (index: number) => ({
    animationDelay: `${index * 0.15}s`
  });

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      {/* ACTIVE STATE - Outer pulsing rings */}
      {status === 'active' && (
        <>
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="absolute inset-0 rounded-full border-2 border-blue-400/30 animate-pulse"
              style={{
                ...pulseDelay(i),
                transform: `scale(${1 + i * 0.25})`,
                animationDuration: '2s'
              }}
            />
          ))}
        </>
      )}

      {/* CONNECTING STATE - Progressive loading rings */}
      {status === 'connecting' && (
        <>
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute inset-0 rounded-full border-2 border-orange-400/40"
              style={{
                transform: `scale(${1 + i * 0.2})`,
                animation: `connectingPulse 1.5s ease-in-out infinite`,
                ...connectingPulseDelay(i)
              }}
            />
          ))}
          <style jsx>{`
            @keyframes connectingPulse {
              0%, 20% { opacity: 0; transform: scale(0.8); }
              50% { opacity: 1; transform: scale(1.2); }
              100% { opacity: 0; transform: scale(1.4); }
            }
          `}</style>
        </>
      )}
      
      {/* ACTIVE STATE - Middle rotating ring */}
      {status === 'active' && (
        <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-purple-400 border-r-blue-400 animate-spin" 
             style={{ animationDuration: '3s' }} />
      )}

      {/* CONNECTING STATE - Rotating dashed circle */}
      {status === 'connecting' && (
        <div className="absolute inset-3 rounded-full border-2 border-dashed border-orange-400 animate-spin" 
             style={{ animationDuration: '2s' }} />
      )}
      
      {/* Inner circle with status-based styling */}
      <div className={`
        relative rounded-full flex items-center justify-center transition-all duration-500
        ${status === 'active' 
          ? 'bg-gradient-to-br from-blue-500 via-purple-500 to-teal-500 animate-pulse shadow-lg shadow-blue-500/50' 
          : status === 'connecting'
          ? 'bg-gradient-to-br from-orange-400 via-yellow-500 to-orange-600 shadow-lg shadow-orange-500/50'
          : 'bg-gray-300'
        }
        ${size === 'sm' ? 'w-10 h-10' : size === 'md' ? 'w-14 h-14' : size === 'lg' ? 'w-20 h-20' : 'w-24 h-24'}
      `}>
        {/* ACTIVE STATE - Voice indicator dots */}
        {status === 'active' && (
          <div className="flex items-center justify-center space-x-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`
                  w-1 bg-white rounded-full animate-bounce
                  ${size === 'sm' ? 'h-2' : size === 'md' ? 'h-3' : 'h-4'}
                `}
                style={{
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        )}

        {/* CONNECTING STATE - Loading dots */}
        {status === 'connecting' && (
          <div className="flex items-center justify-center space-x-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`
                  bg-white rounded-full
                  ${size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-1.5 h-1.5' : 'w-2 h-2'}
                `}
                style={{
                  animation: `loadingDot 1.4s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
          </div>
        )}

        {/* INACTIVE STATE - Static dot */}
        {status === 'inactive' && (
          <div className={`
            bg-gray-500 rounded-full
            ${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'}
          `} />
        )}
        
        {/* Status-based inner glow effect */}
        {status !== 'inactive' && (
          <div className={`
            absolute inset-1 rounded-full animate-pulse
            ${status === 'active' ? 'bg-white/20' : 'bg-white/30'}
          `} style={{ animationDuration: status === 'connecting' ? '1s' : '1.5s' }} />
        )}
      </div>
      
      {/* Status text and indicators */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center">
        <p className={`text-xs font-medium transition-colors duration-300 ${
          status === 'active' ? 'text-blue-600' : 
          status === 'connecting' ? 'text-orange-600' : 
          'text-gray-400'
        }`}>
          {status === 'active' ? 'Active' : 
           status === 'connecting' ? 'Connecting...' : 
           'Inactive'}
        </p>
        {(status === 'active' || status === 'connecting') && (
          <div className="flex justify-center mt-1 space-x-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`w-1 h-1 rounded-full animate-pulse ${
                  status === 'active' ? 'bg-blue-400' : 'bg-orange-400'
                }`}
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* CSS for custom animations */}
      <style>{`
        @keyframes loadingDot {
          0%, 20% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.5); opacity: 1; }
          100% { transform: scale(1); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};