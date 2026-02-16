import { getServerEnv } from "@/lib/config/env";

export const getAllowedEmails = () => {
  return (getServerEnv().ALLOWED_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
};

export const isEmailAllowed = (email?: string | null) => {
  const allowlist = getAllowedEmails();

  if (allowlist.length === 0) {
    return true;
  }

  if (!email) {
    return false;
  }

  return allowlist.includes(email.toLowerCase());
};
