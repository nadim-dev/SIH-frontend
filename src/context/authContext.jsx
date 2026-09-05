import { useState } from "react";
import { AuthContext } from "./authContextByValue.js";


export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading] = useState(false);

  const value = {
    currentUser,
    setCurrentUser,
    authLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
