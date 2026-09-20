import React, { useState, useMemo, useRef, useEffect } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import {
  getInstrumentForTestingApi,
  uploadGeneralExaminationPhotoApi,
  createNonComplianceReportApi,
  getLatestNonComplianceReportApi,
} from "../../api/instrumentApi.js";
import { getInstrumentImage } from "../../utils/instrumentImage.js";
import { compressImage } from "../../utils/compressImage.js";
import { Eye } from "lucide-react";
import NonComplianceReportModal from "../../components/NonComplianceReportModal.jsx";

// ═══════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════

const instrumentData = {
  id: "INST-2024-00147",
  model: "XYZ-500",
  accuracyClass: "III",
  max: "500 kg",
  min: "5 kg",
  e: "0.2 kg",
};

const requiredPhotos = [
  {
    key: "nameplate",
    label: "Nameplate Photo",
    hint: "Covers: Class, Max, Min, e, Serial No.",
  },
];

const sections = [
  {
    id: "identification",
    title: "1. Instrument Identification & Metrological Characteristics",
    clause: "R 76-1 § 7.1",
    photoKey: "nameplate",
    photoLabel: "Nameplate Photo",
    photoHint: "One photo covers Class, Max, Min, e, Serial No.",
    items: [
      {
        key: "accuracyClass",
        label: "Accuracy Class matches nameplate",
        hint: "Verify Class I, II, III, or IIII",
      },
      {
        key: "maxMin",
        label: "Max, Min, and Scale Interval (e) are correct",
        hint: "Compare with nameplate",
      },
      {
        key: "serialNumber",
        label: "Serial Number is present and matches records",
        hint: "Unique identifier",
      },
      {
        key: "softwareId",
        label: "Software Identification recorded",
        hint: "Check and record version",
        hasTextInput: true,
      },
    ],
  },
  {
    id: "markings",
    title: "2. Descriptive Markings (Inscriptions)",
    clause: "R 76-1 § 7.2",
    photoKey: "nameplate",
    reusePhoto: true,
    items: [
      {
        key: "manufacturerMark",
        label: "Manufacturer's Mark / Name is present",
        hint: "Clearly visible",
      },
      {
        key: "typeApprovalMark",
        label: "Type Approval Mark / Number is present",
        hint: "Approval number",
      },
      {
        key: "verificationMark",
        label: "Verification Mark is accessible and secure",
        hint: "Sticker/stamp intact",
      },
      {
        key: "specialMarkings",
        label: "Special / Additional Markings are present",
        hint: 'E.g., "Not for direct sales"',
      },
    ],
  },
  {
    id: "construction",
    title: "3. Construction & Security",
    clause: "R 76-1 § 7.3 / 8.1",
    items: [
      {
        key: "levelIndicator",
        label: "Level Indicator confirms instrument is level",
        hint: "Bubble within circle",
      },
      {
        key: "sealing",
        label: "Seals / Security marks are intact",
        hint: "Unbroken",
      },
      {
        key: "softwareSecurity",
        label: "Software access is restricted / protected",
        hint: "Parameters protected",
      },
    ],
  },
  {
    id: "functional",
    title: "4. Functional Spot Checks",
    clause: "R 76-1 § 8.2",
    items: [
      {
        key: "zeroSetting",
        label: "Zero-Setting Device functions correctly",
        hint: "Resets within ±0.25e",
      },
      {
        key: "tareDevice",
        label: "Tare Device functions correctly",
        hint: "Additive/subtractive tare",
      },
      {
        key: "indicatingDevice",
        label: "Indicating Device is functional and clear",
        hint: "Correct units, readable",
      },
      {
        key: "printingDevice",
        label: "Printing / Data Output contains required info",
        hint: "Ticket no., serial no., date",
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function InstrumentBar({ instrument }) {
  const items = [
    { label: "Serial Number", value: instrument.serialNumber },
    { label: "Model", value: instrument.model },
    { label: "Accuracy Class", value: instrument.accuracyClass },
    { label: "Max", value: instrument.max },
    { label: "Min", value: instrument.min },
    { label: "Scale Interval (e)", value: instrument.e },
  ];

  return (
    <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-[#dbe5f0] bg-white p-3 shadow-sm sm:p-4">
      <div className="grid h-[88px] w-[112px] shrink-0 place-items-center overflow-hidden rounded-lg bg-transparent">
        <img
          src={getInstrumentImage(instrument.instrumentType)}
          alt={instrument.instrumentType || "Instrument"}
          className="h-full w-full object-contain mix-blend-multiply"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-lg font-bold text-slate-900">
          {instrument.instrumentType || "Instrument"}
        </div>
        <div className="mt-1 text-xs text-slate-500">
          Model: {instrument.modelNumber || instrument.model}
          <span className="mx-2">|</span>Serial No: {instrument.serialNumber}
          <span className="mx-2">|</span>Manufacturer: {instrument.manufacturer}
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span className="rounded-md bg-slate-100 px-2.5 py-1">
            {instrument.technology}
          </span>
          <span className="rounded-md bg-slate-100 px-2.5 py-1">
            Accuracy Class {instrument.accuracyClass}
          </span>
          <span className="rounded-md bg-slate-100 px-2.5 py-1">
            Max: {instrument.max}
          </span>
          <span className="rounded-md bg-slate-100 px-2.5 py-1">
            e = {instrument.e}
          </span>
          <span className="rounded-md bg-slate-100 px-2.5 py-1">
            Tare Device: {instrument.tareDevice}
          </span>
        </div>
      </div>
    </div>
  );
}

function GroupPhotoUpload({
  photoKey,
  label,
  hint,
  onUpload,
  fileName,
  fileUrl,
  reuse,
  uploading,
}) {
  const inputRef = useRef(null);

  if (photoKey === "nameplate" && fileName) {
    return (
      <div className="bg-green-50 px-6 py-3 border-b border-gray-200 flex items-center gap-3 text-sm">
        <span className="font-semibold text-green-700">📷 {label}</span>
        <span className="text-xs text-green-600">
          ✓ Registered during instrument registration
        </span>
        <button
          type="button"
          onClick={() =>
            fileUrl && window.open(fileUrl, "_blank", "noopener,noreferrer")
          }
          className="ml-auto inline-flex items-center gap-1 rounded-md border border-green-200 bg-white px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50"
          disabled={!fileUrl}
        >
          <Eye size={14} /> View
        </button>
      </div>
    );
  }

  if (reuse) {
    return (
      <div className="bg-blue-50/60 px-6 py-3 border-b border-gray-200 flex items-center gap-3 text-sm">
        <span className="font-semibold text-blue-700">📷 {label} (shared)</span>
        <span className="text-xs text-gray-500">✓ Already uploaded above</span>
      </div>
    );
  }

  return (
    <div className="bg-blue-50/60 px-6 py-3 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center gap-3 text-sm">
      <span className="font-semibold text-blue-700 whitespace-nowrap">
        📷 {label} <span className="text-red-500">*</span>
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => onUpload(photoKey, e.target.files[0])}
        className="!hidden"
      />
      <div className="[&>span:first-of-type]:hidden flex min-h-[42px] min-w-0 flex-1 basis-0 items-center overflow-hidden rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 shadow-sm">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-xs cursor-pointer font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {uploading
            ? "Uploading..."
            : fileUrl
              ? "Replace File"
              : "Choose File"}
        </button>
        {fileName && (
          <span className="text-xs text-green-600 font-medium">
            ✓ {fileName}
          </span>
        )}
        <span
          className={`ml-3 min-w-0 truncate text-sm ${fileName ? "text-slate-800" : "text-slate-500"}`}
        >
          {fileName || "No file chosen"}
        </span>
      </div>
      {fileUrl && (
        <button
          type="button"
          onClick={() => window.open(fileUrl, "_blank", "noopener,noreferrer")}
          className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 cursor-pointer"
        >
          <Eye size={14} /> View
        </button>
      )}
      {hint && (
        <span className="max-w-[140px] shrink-0 text-xs text-gray-500">
          {hint}
        </span>
      )}
    </div>
  );
}

function ChecklistItem({
  item,
  value,
  onToggle,
  textValue,
  onTextChange,
  canAssess,
}) {
  return (
    <div className="px-6 py-4 border-b border-gray-100 last:border-b-0 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-gray-50 transition-colors">
      <div className="flex-1">
        <div className="font-medium text-gray-900 text-sm">{item.label}</div>
        {item.hint && (
          <div className="text-xs text-gray-500 mt-0.5">{item.hint}</div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => onToggle(item.key, "pass")}
          disabled={!canAssess}
          className={`px-4 py-1.5 rounded-md text-xs font-semibold border-2 transition-all ${
            value === "pass"
              ? "bg-green-600 border-green-600 text-white"
              : canAssess
                ? "bg-white border-gray-300 text-gray-700 hover:border-green-600 hover:text-green-600"
                : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          Pass
        </button>
        <button
          type="button"
          onClick={() => onToggle(item.key, "fail")}
          disabled={!canAssess}
          className={`px-4 py-1.5 rounded-md text-xs font-semibold border-2 transition-all ${
            value === "fail"
              ? "bg-red-600 border-red-600 text-white"
              : canAssess
                ? "bg-white border-gray-300 text-gray-700 hover:border-red-600 hover:text-red-600"
                : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          Fail
        </button>

        {item.hasTextInput && (
          <input
            type="text"
            placeholder="e.g., v2.4.1"
            value={textValue || ""}
            onChange={(e) => onTextChange(item.key, e.target.value)}
            className="ml-2 px-3 py-1.5 border border-gray-300 rounded-md text-xs w-28 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        )}
      </div>
    </div>
  );
}

function SectionCard({
  section,
  instrument,
  values,
  onToggle,
  textValues,
  onTextChange,
  photos,
  onPhotoUpload,
  uploadingPhoto,
}) {
  const visibleItems = section.items.filter((item) => {
    if (item.key === "tareDevice") return instrument.tareDevice === "Yes";
    if (["softwareId", "softwareSecurity"].includes(item.key))
      return instrument.technology === "Electronic";
    if (item.key === "printingDevice")
      return instrument.hasPrintingDevice === true;
    return true;
  });
  return (
    <div className="bg-white rounded-lg shadow-sm mb-5 overflow-hidden border border-gray-100">
      <div className="px-6 py-3 bg-gray-100 border-b border-gray-200 flex justify-between items-center">
        <h2 className="font-bold text-gray-900 text-base">{section.title}</h2>
        <span className="text-xs text-gray-500 font-medium">
          {section.clause}
        </span>
      </div>

      {section.photoKey && (
        <GroupPhotoUpload
          photoKey={section.photoKey}
          label={section.photoLabel || "Photo"}
          hint={section.photoHint || ""}
          fileName={photos[section.photoKey]?.name}
          fileUrl={photos[section.photoKey]?.url}
          onUpload={onPhotoUpload}
          uploading={uploadingPhoto === section.photoKey}
          reuse={section.reusePhoto}
        />
      )}

      {visibleItems.map((item) => {
        const itemPhoto = item.photoKey && item.photoKey !== section.photoKey
          ? requiredPhotos.find((photo) => photo.key === item.photoKey)
          : null;
        return (
          <React.Fragment key={item.key}>
            {itemPhoto && (
              <GroupPhotoUpload
                photoKey={itemPhoto.key}
                label={itemPhoto.label}
                hint={itemPhoto.hint}
                fileName={photos[itemPhoto.key]?.name}
                fileUrl={photos[itemPhoto.key]?.url}
                onUpload={onPhotoUpload}
                uploading={uploadingPhoto === itemPhoto.key}
              />
            )}
            <ChecklistItem
              item={item}
              value={values[item.key]}
              onToggle={onToggle}
              textValue={textValues[item.key]}
              onTextChange={onTextChange}
              canAssess={(!item.photoKey && !section.photoKey) || Boolean(photos[item.photoKey || section.photoKey])}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function GeneralExamination() {
  const { instrumentId } = useParams();
  const [instrumentData, setInstrumentData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [values, setValues] = useState({});
  const [textValues, setTextValues] = useState({});
  const [photos, setPhotos] = useState({});
  const [uploadingPhoto, setUploadingPhoto] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [showNcrForm, setShowNcrForm] = useState(false);
  const [ncrEvidence, setNcrEvidence] = useState([]);
  const [ncrSent, setNcrSent] = useState(false);
  const [ncrSubmitted, setNcrSubmitted] = useState(false);
  const { setHeaderContent } = useOutletContext();

  useEffect(() => {
    setHeaderContent?.({
      title: "General Examination",
      subtitle:
        "Visual and functional examination of the instrument, markings and devices.",
    });
  }, [setHeaderContent]);

  useEffect(() => {
    const loadInstrument = async () => {
      try {
        const [response, ncrResponse] = await Promise.all([
          getInstrumentForTestingApi(instrumentId),
          getLatestNonComplianceReportApi(instrumentId),
        ]);
        if (ncrResponse?.data) setNcrSubmitted(true);
        const instrument = response?.data || response;
        setInstrumentData({
          ...instrument,
          id: instrument._id,
          model: instrument.modelNumber,
          max: `${instrument.max} ${instrument.unit}`,
          min: `${instrument.min} ${instrument.unit}`,
          e: `${instrument.e} ${instrument.unit}`,
        });
        const storedPhotos = Object.fromEntries(
          Object.entries(instrument.generalExaminationPhotos || {})
            .filter(([, url]) => Boolean(url))
            .map(([key, url]) => [
              key,
              { name: "Stored examination photo", url },
            ]),
        );
        if (instrument.nameplatePhotoUrl && !storedPhotos.nameplate) {
          storedPhotos.nameplate = {
            name: "Registered nameplate photo",
            url: instrument.nameplatePhotoUrl,
          };
        }
        setPhotos(storedPhotos);
      } catch (error) {
        setLoadError(error.message || "Failed to load instrument details.");
      }
    };
    loadInstrument();
  }, [instrumentId]);

  const totalItems = useMemo(
    () => sections.reduce((sum, s) => sum + s.items.length, 0),
    [],
  );

  const { passedCount, failedCount } = useMemo(() => {
    const vals = Object.values(values);
    return {
      passedCount: vals.filter((v) => v === "pass").length,
      failedCount: vals.filter((v) => v === "fail").length,
    };
  }, [values]);

  const missingPhotos = useMemo(
    () => requiredPhotos.filter((p) => !photos[p.key]),
    [photos],
  );

  const progress = totalItems ? (passedCount / totalItems) * 100 : 0;

  const hasFailures = failedCount > 0;
  const allPassed = passedCount === totalItems && totalItems > 0;
  const canProceed = allPassed && missingPhotos.length === 0;
  const canGenerateNCR = hasFailures;
  const failedItems = useMemo(
    () => sections.flatMap((section) => section.items
      .filter((item) => values[item.key] === "fail")
      .map((item) => ({ key: item.key, label: item.label }))),
    [values],
  );

  if (!instrumentData) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 text-center text-sm text-red-600">
        {loadError || "Loading instrument details..."}
      </div>
    );
  }

  const handleToggle = (key, value) => {
    const item = sections
      .flatMap((section) => section.items)
      .find((candidate) => candidate.key === key);
    const section = sections.find((candidate) =>
      candidate.items.some((candidateItem) => candidateItem.key === key),
    );
    const photoKey = item?.photoKey || section?.photoKey;
    if (photoKey && !photos[photoKey]) return;

    setValues((prev) => {
      if (prev[key] === value) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
  };

  const handleTextChange = (key, val) => {
    setTextValues((prev) => ({ ...prev, [key]: val }));
  };

  const handlePhotoUpload = async (photoKey, file) => {
    if (!file) return;
    setUploadingPhoto(photoKey);
    try {
      const compressedFile = await compressImage(file);
      const response = await uploadGeneralExaminationPhotoApi(
        instrumentId,
        photoKey,
        compressedFile,
      );
      setPhotos((prev) => ({
        ...prev,
        [photoKey]: { name: compressedFile.name, url: response.url },
      }));
    } catch (error) {
      alert(error.message || "Failed to upload photo.");
    } finally {
      setUploadingPhoto(null);
    }
  };

  const handleGenerateNCR = () => {
    setNcrSent(false);
    setShowNcrForm(true);
    return;
    const failedItems = sections.flatMap((s) =>
      s.items.filter((i) => values[i.key] === "fail").map((i) => i.label),
    );

    const ncrData = {
      ncrId: "NCR-" + Date.now(),
      instrument: instrumentData,
      failedItems,
      remarks,
      photos: Object.keys(photos),
      timestamp: new Date().toISOString(),
    };

    console.log("NCR Generated:", ncrData);
    alert(
      `📋 Non-Compliance Report Generated\n\n` +
        `NCR ID: ${ncrData.ncrId}\n\n` +
        `Failed Items:\n${failedItems.map((f, i) => `${i + 1}. ${f}`).join("\n")}\n\n` +
        `Photos: ${Object.keys(photos).join(", ")}\n\n` +
        `Sent to Supervisor for review.`,
    );
  };

  const handleProceed = (e) => {
    e.preventDefault();
    if (!canProceed) return;

    const submission = {
      instrument: instrumentData,
      results: values,
      textValues,
      photos: Object.keys(photos),
      remarks,
      timestamp: new Date().toISOString(),
      status: "PASSED",
    };

    console.log("Submitting General Examination:", submission);
    alert("✅ General Examination passed!\n\nProceeding to Weighing Tests...");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-3 px-4">
      <div className="max-w-4xl mx-auto ">
        {/* Instrument Bar */}
        <InstrumentBar instrument={instrumentData} />

        {/* Alerts */}
        {hasFailures && !ncrSubmitted && (
          <div className="bg-red-50 border-l-4 border-red-600 text-red-800 px-5 py-3 rounded-lg mb-4 text-sm font-medium">
            ⚠️ Cannot proceed. {failedCount} item(s) failed. Please generate a
            Non-Compliance Report.
          </div>
        )}

        {allPassed && missingPhotos.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 px-5 py-3 rounded-lg mb-4 text-sm font-medium">
            ⚠️ Missing required photos:{" "}
            {missingPhotos.map((p) => p.label).join(", ")}
          </div>
        )}

        {canProceed && (
          <div className="bg-green-50 border-l-4 border-green-600 text-green-800 px-5 py-3 rounded-lg mb-4 text-sm font-medium">
            ✅ All examination items passed. You may proceed to weighing tests.
          </div>
        )}

        {ncrSubmitted && <div className="mb-4 rounded-lg border-l-4 border-blue-600 bg-blue-50 px-5 py-3 text-sm font-medium text-blue-900">NCR submitted successfully. This examination is locked while waiting for supervisor review.</div>}

        {/* Sections */}
        <form onSubmit={handleProceed}>
          <div className={ncrSubmitted ? "pointer-events-none opacity-60" : ""}>
          {sections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              instrument={instrumentData}
              values={values}
              onToggle={handleToggle}
              textValues={textValues}
              onTextChange={handleTextChange}
              photos={photos}
              onPhotoUpload={handlePhotoUpload}
              uploadingPhoto={uploadingPhoto}
            />
          ))}
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pb-8">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-3 rounded-lg bg-white border-2 border-gray-300 text-gray-700 font-semibold text-sm hover:border-gray-500 transition-all"
            >
              ← Back
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleGenerateNCR}
                disabled={!canGenerateNCR || ncrSubmitted}
                className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all ${
                  canGenerateNCR
                    ? "bg-red-600 text-white hover:bg-red-700 shadow-md"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                Generate Non-Compliance
              </button>

              <button
                type="submit"
                disabled={!canProceed || ncrSubmitted}
                className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all ${
                  canProceed
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                Proceed to Weighing Tests →
              </button>
            </div>
          </div>
        </form>

        <NonComplianceReportModal
          open={showNcrForm}
          instrumentId={instrumentId}
          failedItems={failedItems}
          onClose={() => setShowNcrForm(false)}
          onSubmit={createNonComplianceReportApi}
          onSubmitted={() => { setNcrSubmitted(true); setShowNcrForm(false); }}
        />

        {false && showNcrForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div><p className="text-xs font-bold uppercase tracking-widest text-red-600">Non-Compliance</p><h2 className="mt-1 text-xl font-bold text-slate-900">Send report to supervisor</h2><p className="mt-1 text-xs text-slate-500">Failed items are fetched automatically.</p></div>
                <button type="button" onClick={() => setShowNcrForm(false)} className="text-2xl text-slate-400">×</button>
              </div>
              {ncrSent ? <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">NCR draft prepared. Backend submission will be connected next.</div> : <>
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4"><h3 className="text-sm font-bold text-red-900">Failed test items ({failedItems.length})</h3><ul className="mt-2 space-y-2 text-sm text-red-800">{failedItems.map((item) => <li key={item.key}>• {item.label}</li>)}</ul></div>
                <label className="mt-5 block text-sm font-semibold text-slate-700">Remarks / explanation<textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} rows={4} placeholder="Describe the non-compliance..." className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm" required /></label>
                <label className="mt-4 block text-sm font-semibold text-slate-700">Upload evidence<input type="file" multiple accept="image/*,.pdf" onChange={(event) => setNcrEvidence(Array.from(event.target.files || []))} className="mt-2 block w-full rounded-lg border border-dashed border-slate-300 p-3 text-xs" /></label>
                {ncrEvidence.length > 0 && <p className="mt-2 text-xs text-slate-500">{ncrEvidence.map((file) => file.name).join(", ")}</p>}
                <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setShowNcrForm(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button><button type="button" onClick={() => { console.log("NCR draft:", { instrumentId, failedItems, remarks, evidence: ncrEvidence.map((file) => file.name) }); setNcrSent(true); }} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">Send to Supervisor</button></div>
              </>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
