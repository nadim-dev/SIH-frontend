import React, { useEffect, useState } from "react";
import { compressImage } from "../utils/compressImage.js";

export default function NonComplianceReportModal({
  open,
  failedItems = [],
  instrumentId,
  onClose,
  onSubmit,
  onSubmitted,
}) {
  const [remarks, setRemarks] = useState("");
  const [evidence, setEvidence] = useState([]);
  const [sent, setSent] = useState(false);
  const [compressing, setCompressing] = useState(false);

  useEffect(() => {
    if (open) {
      setRemarks("");
      setEvidence([]);
      setSent(false);
    }
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    const payload = {
      instrumentId,
      failedItems,
      remarks,
      evidence,
    };
    try {
      await onSubmit?.(payload);
      setSent(true);
      onSubmitted?.();
    } catch (error) {
      window.alert(error?.response?.data?.message || "Failed to send the non-compliance report.");
    }
  };

  const handleEvidenceChange = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setCompressing(true);
    try {
      const processed = await Promise.all(files.map((file) => file.type.startsWith("image/") ? compressImage(file) : file));
      setEvidence(processed);
    } finally {
      setCompressing(false);
      event.target.value = "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07132e]/60 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-xl rounded-2xl border border-[#dbe5f0] bg-[#fbfdff] p-6 shadow-[0_24px_70px_rgba(7,19,46,0.28)]">
        <div className="flex items-start justify-between border-b border-[#e2eaf3] pb-4">
          <div>
            <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#fff1f2] text-sm text-[#d9364f]">!</span><p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#d9364f]">Non-Compliance Report</p></div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-2xl text-[#8da0ba] hover:bg-[#f0f4f9] hover:text-[#172033]">×</button>
        </div>

        {sent ? (
          <div className="mt-6 rounded-xl border border-[#bce4cf] bg-[#effbf4] p-4 text-sm text-[#147a43]">
            <strong className="block text-base">Report sent to supervisor</strong>
            <span className="mt-1 block text-xs">Your non-compliance report and evidence were submitted successfully.</span>
          </div>
        ) : (
          <>
            <div className="mt-5 rounded-xl border border-[#f5c5cb] bg-[#fff5f6] p-4">
              <div className="flex items-center justify-between"><h3 className="text-sm font-bold text-[#8f1d2e]">Failed test items ({failedItems.length})</h3><span className="rounded-full bg-[#d9364f] px-2 py-1 text-[10px] font-bold text-white">FAILED</span></div>
              <ul className="mt-2 space-y-2 text-sm text-[#a52637]">
                {failedItems.map((item) => <li key={item.key || item.code || item.label}>• {item.label || item}</li>)}
              </ul>
            </div>

            <div>
            <label className="mt-5 block text-sm font-semibold text-[#52627a]">
              Remarks / explanation
              <textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} rows={3} placeholder="Describe the non-compliance..." className="mt-2 w-full resize-y rounded-lg border border-[#cbd8e7] bg-white p-3 text-sm text-[#172033] outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10" required />
            </label>

            <label className="mt-4 block text-sm font-semibold text-[#52627a]">
              Upload evidence
              <span className="mt-2 flex cursor-pointer flex-col items-center rounded-lg border border-dashed border-[#9db4cf] bg-white px-3 py-2.5 text-center normal-case tracking-normal hover:border-[#2563eb] hover:bg-[#f7faff]"><span className="mb-1 text-lg text-[#2563eb]">↑</span><span className="text-xs font-semibold text-[#33445e]">Choose files to upload</span><span className="mt-1 text-[10px] font-normal text-[#8292a8]">You can select multiple images or PDF files</span><input type="file" multiple accept="image/*,.pdf" onChange={handleEvidenceChange} className="sr-only" /></span>
            </label>
            {compressing && <p className="mt-2 text-xs text-[#2563eb]">Compressing image evidence...</p>}
            {evidence.length > 0 && <div className="mt-2 rounded-lg bg-[#eef5fb] px-3 py-2 text-xs text-[#46617f]">{evidence.map((file) => file.name).join(", ")}</div>}

            <div className="mt-6 flex justify-end gap-3 border-t border-[#e2eaf3] pt-4">
              <button type="button" onClick={onClose} className="cursor-pointer rounded-lg border border-[#cbd8e7] bg-white px-4 py-2 text-sm font-semibold text-[#33445e] hover:bg-[#f5f8fc]">Cancel</button>
              <button type="button" disabled={!remarks.trim()} onClick={submit} className="cursor-pointer rounded-lg bg-[#17345a] px-4 py-2 text-sm font-bold text-white shadow-[0_4px_10px_rgba(23,52,90,0.2)] hover:bg-[#102946] disabled:cursor-not-allowed disabled:bg-[#b9c7d8]">Send to Supervisor&nbsp; →</button>
            </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
