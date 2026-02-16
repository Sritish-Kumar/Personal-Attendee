"use client";

import type { MouseEvent } from "react";
import type { ReactNode } from "react";

import SubmitButton from "@/components/ui/submit-button";

type ConfirmSubmitButtonProps = {
  children: ReactNode;
  confirmMessage: string;
  className?: string;
  pendingText?: string;
  name?: string;
  value?: string;
};

export default function ConfirmSubmitButton({
  children,
  confirmMessage,
  className,
  pendingText,
  name,
  value
}: ConfirmSubmitButtonProps) {
  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    const shouldProceed = window.confirm(confirmMessage);
    if (!shouldProceed) {
      event.preventDefault();
    }
  };

  return (
    <SubmitButton
      className={className}
      pendingText={pendingText}
      onClick={onClick}
      name={name}
      value={value}
    >
      {children}
    </SubmitButton>
  );
}
