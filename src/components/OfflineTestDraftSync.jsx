import { useCallback, useEffect, useRef, useState } from "react";
import { Cloud, CloudOff, RefreshCw, Save } from "lucide-react";
import { deleteTestDraftApi, getTestDraftApi, saveTestDraftApi } from "../api/instrumentApi";

const storageKeyFor = (draftKey) => `nawi-test-draft:${draftKey}`;

const readLocalDraft = (storageKey) => {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export const useOfflineTestDraft = (draftKey, initialValue) => {
  const storageKey = storageKeyFor(draftKey);
  const [storedDraft] = useState(() => readLocalDraft(storageKey));
  const [draft, setDraft] = useState(() => storedDraft?.enabled ? storedDraft.data : initialValue);
  const [enabled, setEnabled] = useState(() => storedDraft?.enabled === true);
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [status, setStatus] = useState(() => storedDraft?.enabled
    ? (typeof navigator !== "undefined" && !navigator.onLine ? "Your work is saved on this device. Sync it when you're back online." : "Your saved work is ready on this device.")
    : "Sync is off");
  const editedRef = useRef(false);
  const lastSavedAtRef = useRef(storedDraft?.updatedAt || null);

  const syncNow = useCallback(async () => {
    if (!enabled) return;
    if (!navigator.onLine) {
      setStatus("Your work is saved on this device. Sync it when you're back online.");
      return;
    }
    setStatus("Syncing draft…");
    try {
      const response = await saveTestDraftApi(draftKey, draft);
      lastSavedAtRef.current = response?.updatedAt || new Date().toISOString();
      setStatus("Synced to server");
    } catch (error) {
      setStatus("Sync failed · draft saved on this device");
    }
  }, [draft, draftKey, enabled]);

  const enableSync = useCallback(async () => {
    setEnabled(true);
    setStatus(navigator.onLine ? "Offline saving is on. Your work will sync when you're online." : "Your work is saved on this device. Sync it when you're back online.");
    if (!editedRef.current && !readLocalDraft(storageKey)?.enabled && navigator.onLine) {
      try {
        const response = await getTestDraftApi(draftKey);
        if (response?.data && typeof response.data === "object") {
          setDraft(response.data);
          setStatus("Restored saved server draft");
        }
      } catch {
        // Local draft saving remains available if the server cannot be reached.
      }
    }
  }, [draftKey, storageKey]);

  const updateDraft = useCallback((valueOrUpdater) => {
    editedRef.current = true;
    setDraft(valueOrUpdater);
  }, []);

  const clearDraft = useCallback(async () => {
    try { localStorage.removeItem(storageKey); } catch { /* Local storage may be unavailable. */ }
    setEnabled(false);
    setDraft(initialValue);
    editedRef.current = false;
    lastSavedAtRef.current = null;
    setStatus("Sync is off");
    if (navigator.onLine) {
      try { await deleteTestDraftApi(draftKey); } catch { /* The submitted test is already saved. */ }
    }
  }, [draftKey, initialValue, storageKey]);

  useEffect(() => {
    if (!enabled) return;
    const updatedAt = new Date().toISOString();
    lastSavedAtRef.current = updatedAt;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ enabled: true, data: draft, updatedAt }));
      setStatus(navigator.onLine ? "Your work is saved on this device. Sync to back it up." : "Your work is saved on this device. Sync it when you're back online.");
    } catch {
      setStatus("Unable to save draft on this device");
    }
  }, [draft, enabled, storageKey]);

  useEffect(() => {
    const markOnline = () => { setOnline(true); };
    const markOffline = () => { setOnline(false); setStatus(enabled ? "Your work is saved on this device. Sync it when you're back online." : "Offline. Turn on offline saving to keep your work on this device."); };
    window.addEventListener("online", markOnline);
    window.addEventListener("offline", markOffline);
    return () => {
      window.removeEventListener("online", markOnline);
      window.removeEventListener("offline", markOffline);
    };
  }, [enabled]);

  useEffect(() => {
    if (online && enabled && status.startsWith("Offline")) syncNow();
  }, [enabled, online, status, syncNow]);

  return { draft, setDraft: updateDraft, enabled, online, status, enableSync, syncNow, clearDraft };
};

export const OfflineTestDraftControl = ({ enabled, online, status, onEnable, onSync }) => (
  <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
    <span className={`inline-flex items-center gap-1.5 font-medium ${online ? "text-emerald-700" : "text-amber-700"}`}>
      {online ? <Cloud size={15} /> : <CloudOff size={15} />}
      {status}
    </span>
    {!enabled ? (
      <button type="button" onClick={onEnable} className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 font-semibold text-white hover:bg-blue-700">
        <Save size={14} />Enable offline sync
      </button>
    ) : (
      <button type="button" onClick={onSync} disabled={!online} className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50">
        <RefreshCw size={14} />Sync now
      </button>
    )}
  </div>
);
