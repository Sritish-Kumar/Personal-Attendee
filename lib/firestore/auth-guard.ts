// Auth removed - returns mock user for compatibility
export const requireAuthenticatedUser = async () => {
  return {
    id: "user",
    email: "user@localhost",
    name: "User"
  };
};
