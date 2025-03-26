
import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { X } from 'lucide-react';

export interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const Sheet: React.FC<SheetProps> = ({ 
  open = false, 
  onOpenChange,
  children
}) => {
  const [isOpen, setIsOpen] = useState(open);
  
  const handleOpenChange = (value: boolean) => {
    setIsOpen(value);
    onOpenChange?.(value);
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      {children}
    </div>
  );
};

export interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'left' | 'right' | 'top' | 'bottom';
  children: React.ReactNode;
}

export const SheetContent: React.FC<SheetContentProps> = ({
  side = 'right',
  className,
  children,
  ...props
}) => {
  const sideClasses = {
    top: 'inset-x-0 top-0 border-b',
    bottom: 'inset-x-0 bottom-0 border-t',
    left: 'inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm',
    right: 'inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm',
  };

  return (
    <div 
      className={cn(
        "fixed z-50 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300",
        sideClasses[side],
        className
      )} 
      {...props}
    >
      {children}
      <button 
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
        onClick={() => {}}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
    </div>
  );
};
