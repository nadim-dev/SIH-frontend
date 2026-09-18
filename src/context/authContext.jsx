import { useEffect, useState } from "react";
import { getCurrentUserApi } from "../api/authApi.js";
import { AuthContext } from "./authContextByValue.js";


export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getCurrentUserApi()
      .then((response) => {
        if (isMounted) setCurrentUser(response.currentUser);
      })
      .catch(() => {
        if (isMounted) setCurrentUser(null);
      })
      .finally(() => {
        if (isMounted) setAuthLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const value = {
    currentUser,
    setCurrentUser,
    authLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
