import { auth } from "@/auth";

export const requireAuthenticatedUser = async () => {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  return session.user;
};
