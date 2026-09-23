import { useState } from "react";
import { compressImage } from "../utils/compressImage";
import { formatDateTime } from "../utils/formatDate";

export default function EvidenceUpload({ uploadImage, maxImages = 3 }) {
  const [evidence, setEvidence] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    if (evidence.length + files.length > maxImages) {
      setError(`You can upload a maximum of ${maxImages} evidence images.`);
      return;
    }
    setUploading(true);
    setError("");
    try {
      const location = await new Promise((resolve) => {
        if (!navigator.geolocation) return resolve({ latitude: null, longitude: null });
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
          () => resolve({ latitude: null, longitude: null }),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        );
      });
      for (const file of files) {
        const compressed = await compressImage(file);
        const item = await uploadImage(compressed, location);
        if (item) setEvidence((current) => [...current, item]);
      }
    } catch (uploadError) {
      setError(uploadError.response?.data?.message || uploadError.message || "Failed to upload evidence.");
    } finally {
      setUploading(false);
    }
  };

  return <><div className="mt-3 w-full overflow-hidden rounded-md border border-[#dbe5f0] bg-white">
    <div className="border-b border-[#dbe5f0] bg-[#f8fafc] px-3 py-1.5"><b className="text-[13px] text-slate-800">Test Evidence</b></div>
    <div className="p-2">
    <div className="flex flex-wrap items-center justify-between gap-2"><small className="text-[11px] text-slate-500">Attach clear images supporting this test result.</small><label className="inline-flex cursor-pointer items-center rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100">{uploading ? "Uploading..." : "Choose images"}<input type="file" accept="image/*" multiple disabled={uploading || evidence.length >= maxImages} onChange={handleUpload} className="sr-only" /></label></div>
    {error && <p className="mt-1 text-[10px] text-red-600">{error}</p>}
    {evidence.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{evidence.map((item, index) => <div key={item.url} className="flex items-center gap-2 rounded border border-slate-200 p-1"><img src={item.url} alt={`Evidence ${index + 1}`} className="h-14 w-14 rounded object-cover" /><span className="text-[9px] text-slate-500">Uploaded: {formatDateTime(item.uploadedAt)}<br />{item.location?.latitude != null ? `${item.location.latitude.toFixed(5)}, ${item.location.longitude.toFixed(5)}` : "Location unavailable"}</span></div>)}</div>}
    </div></div><p className="px-1 pt-1 text-[11px] text-slate-500">{evidence.length}/{maxImages} images uploaded</p></>;
}
