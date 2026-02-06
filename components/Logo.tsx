
import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-xl',
    lg: 'w-20 h-20 text-3xl'
  };

  return (
    <div className={`relative flex items-center justify-center font-black tracking-tighter rounded-xl overflow-hidden shadow-inner bg-white/20 border border-white/30 group-hover:bg-white/40 transition-all ${sizeClasses[size]} ${className}`}>
      {/* Abstract tyre tread background pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-1 bg-white rotate-45 transform origin-top-left scale-150"></div>
        <div className="absolute top-2 left-0 w-full h-1 bg-white rotate-45 transform origin-top-left scale-150"></div>
        <div className="absolute top-4 left-0 w-full h-1 bg-white rotate-45 transform origin-top-left scale-150"></div>
      </div>
      
      <span className="relative z-10 flex items-center">
        <span className="text-white">C</span>
        <span className="text-amber-400 -ml-1">T</span>
      </span>
      
      {/* Decorative dot */}
      <div className="absolute bottom-1 right-1 w-1 h-1 bg-amber-400 rounded-full animate-pulse"></div>
    </div>
  );
};

export default Logo;
