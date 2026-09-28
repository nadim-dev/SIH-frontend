import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";

const getOnlineState = () => typeof navigator === "undefined" || navigator.onLine;

export function NetworkStatusIndicator() {
  const [online, setOnline] = useState(getOnlineState);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const updateStatus = (isOnline) => {
      setOnline(isOnline);
      setNotice(isOnline ? "You are online" : "You are offline");
    };
    const handleOnline = () => updateStatus(true);
    const handleOffline = () => updateStatus(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  return (
    <>
      <div className={`nawi-network-status ${online ? "is-online" : "is-offline"}`} role="status" aria-live="polite">
        {online ? <Wifi size={15} aria-hidden="true" /> : <WifiOff size={15} aria-hidden="true" />}
        <span>{online ? "Online" : "Offline"}</span>
      </div>
      {notice && (
        <div className={`nawi-network-toast ${online ? "is-online" : "is-offline"}`} role="status" aria-live="assertive">
          {notice}
        </div>
      )}
    </>
  );
}

export default NetworkStatusIndicator;
