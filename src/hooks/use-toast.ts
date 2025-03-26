
import { useState } from "react";

type ToastProps = {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  function toast(props: Omit<ToastProps, "id">) {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, ...props }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
    
    return { id };
  }

  function dismiss(toastId: string) {
    setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
  }

  return {
    toast,
    dismiss,
    toasts,
  };
}

export const toast = (props: Omit<ToastProps, "id">) => {
  // This is a simple implementation
  console.log("Toast:", props);
};
