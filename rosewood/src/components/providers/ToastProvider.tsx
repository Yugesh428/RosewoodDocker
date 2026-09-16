"use client";

import { Toaster } from "sonner";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      expand={false}
      richColors
      closeButton
      duration={3000}
      toastOptions={{
        style: {
          fontFamily: "var(--font-sans)",
        },
        classNames: {
          toast: "rounded-sm border",
          title: "font-medium",
          description: "text-sm",
          success: "border-green-200",
          error: "border-red-200",
          warning: "border-yellow-200",
          info: "border-blue-200",
        },
      }}
    />
  );
}
