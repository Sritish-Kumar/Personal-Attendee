"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type ToastState = {
  status: "success" | "error";
  message: string;
};

export default function QueryToast() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastShownKeyRef = useRef<string | null>(null);

  const status = searchParams.get("status");
  const message = searchParams.get("message");

  const cleanPath = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("status");
    params.delete("message");

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!status || !message) {
      return;
    }

    const normalizedStatus = status === "success" ? "success" : "error";
    const key = `${normalizedStatus}:${message}`;

    if (lastShownKeyRef.current === key) {
      return;
    }

    lastShownKeyRef.current = key;
    setToast({ status: normalizedStatus, message });
    router.replace(cleanPath, { scroll: false });

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [cleanPath, message, router, status]);

  if (!toast) {
    return null;
  }

  return (
    <div className={`toast ${toast.status === "success" ? "success" : "error"}`} role="status" aria-live="polite">
      <strong>{toast.status === "success" ? "Success" : "Error"}</strong>
      <p>{toast.message}</p>
    </div>
  );
}
