
import React, { useState } from 'react';
import { cn } from "@/lib/utils";

export interface TooltipProps {
  children: React.ReactNode;
  delayDuration?: number;
}

export const TooltipProvider: React.FC<TooltipProps> = ({ children }) => {
  return <>{children}</>;
};

export interface TooltipTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
  className?: string;
  [key: string]: any; // This allows passing arbitrary props to the underlying element
}

export const TooltipTrigger: React.FC<TooltipTriggerProps> = ({ 
  asChild = false,
  children,
  className,
  ...props
}) => {
  const Comp = asChild ? 'div' : 'button';
  return <Comp className={className} {...props}>{children}</Comp>;
};

export interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  hidden?: boolean;
}

export const TooltipContent: React.FC<TooltipContentProps> = ({ 
  className,
  children,
  hidden = false,
  ...props
}) => {
  if (hidden) return null;
  
  return (
    <div 
      className={cn(
        "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const Tooltip = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};
