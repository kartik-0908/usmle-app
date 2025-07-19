import React from 'react';
import { cn } from '@/lib/utils'; // Adjust import path as needed

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'dots' | 'pulse' | 'bars';
  className?: string;
  text?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  variant = 'default', 
  className,
  text 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  if (variant === 'dots') {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
        <div className="flex space-x-1">
          <div className={cn("bg-blue-500 rounded-full animate-bounce", sizeClasses[size])} style={{ animationDelay: '0ms' }}></div>
          <div className={cn("bg-blue-500 rounded-full animate-bounce", sizeClasses[size])} style={{ animationDelay: '150ms' }}></div>
          <div className={cn("bg-blue-500 rounded-full animate-bounce", sizeClasses[size])} style={{ animationDelay: '300ms' }}></div>
        </div>
        {text && <p className={cn("text-muted-foreground", textSizeClasses[size])}>{text}</p>}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
        <div className={cn("bg-blue-500 rounded-full animate-pulse", sizeClasses[size])}></div>
        {text && <p className={cn("text-muted-foreground animate-pulse", textSizeClasses[size])}>{text}</p>}
      </div>
    );
  }

  if (variant === 'bars') {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
        <div className="flex space-x-1">
          <div className={cn("bg-blue-500 animate-pulse", sizeClasses[size])} style={{ animationDelay: '0ms' }}></div>
          <div className={cn("bg-blue-500 animate-pulse", sizeClasses[size])} style={{ animationDelay: '150ms' }}></div>
          <div className={cn("bg-blue-500 animate-pulse", sizeClasses[size])} style={{ animationDelay: '300ms' }}></div>
          <div className={cn("bg-blue-500 animate-pulse", sizeClasses[size])} style={{ animationDelay: '450ms' }}></div>
        </div>
        {text && <p className={cn("text-muted-foreground", textSizeClasses[size])}>{text}</p>}
      </div>
    );
  }

  // Default spinner
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-gray-300 border-t-blue-600",
          sizeClasses[size]
        )}
      />
      {text && <p className={cn("text-muted-foreground", textSizeClasses[size])}>{text}</p>}
    </div>
  );
}

// Full page loading component
export function PageLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px] w-full">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

// Inline loading component
export function InlineLoader({ text }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <LoadingSpinner size="md" text={text} />
    </div>
  );
}

// Button loading state
export function ButtonLoader({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  return (
    <LoadingSpinner 
      size={size} 
      className="inline-flex" 
    />
  );
}