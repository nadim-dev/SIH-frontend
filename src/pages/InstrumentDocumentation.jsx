import { useEffect, useState } from "react";
import {ArrowLeft,ArrowRight,BookOpen,Eye,FileCheck2,FileText,RefreshCw,Upload,UsersRound} from "lucide-react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { completeEvaluationDocumentsApi, getEvaluationDocumentsApi, getMyEvaluationsApi, uploadEvaluationDocumentApi } from "../api/instrumentApi";
import { getInstrumentImage } from "../utils/instrumentImage";

const documents = [
  {
    title: "Technical Documentation",
    note: "Upload technical specifications, drawings or other relevant documents.",
    icon: FileText,
    tone: "bg-[#F3E8FF] text-[#9333EA]",
    required: true,
    documentType: "TECHNICAL_DOCUMENTATION",
    pdfOnly: true,
  },
  {
    title: "Type / Model Approval Certificate",
    note: "Upload the applicable type approval or pattern approval certificate issued by the competent authority.",
    icon: FileCheck2,
    tone: "bg-[#FEE2E2] text-[#EF4444]",
    required: false,
    availability: "If applicable",
    documentType: "TYPE_APPROVAL_CERTIFICATE",
    pdfOnly: true,
  },
  {
    title: "Previous Test / Calibration Report ",
    note: "Upload the latest test or calibration certificate",
    icon: FileText,
    tone: "bg-[#DCFCE7] text-[#10B981]",
    required: false,
    availability: "If available/applicable",
    documentType: "CALIBRATION_CERTIFICATE",
    pdfOnly: true,
  },
  {
    title: "User / Operating Manual",
    note: "Upload the user manual or operating instructions (if available).",
    icon: BookOpen,
    tone: "bg-[#DBEAFE] text-[#2563EB]",
    required: false,
    availability: "If available",
    documentType: "USER_MANUAL",
    pdfOnly: true,
  },
  {
    title: "Other Supporting Documents",
    note: "Upload any other relevant documents.",
    icon: UsersRound,
    tone: "bg-[#F1F5F9] text-[#64748B]",
    required: false,
    documentType: "OTHER",
  },
];

export const InstrumentDocumentation = () => {
  const { applicationId } = useParams();
  const { setHeaderContent } = useOutletContext();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState(null);
  const [uploadedDocuments, setUploadedDocuments] = useState({});
  const [uploadingType, setUploadingType] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    setHeaderContent({
      title: "Manufacturer Documents",
      subtitle: "Upload documents submitted by the manufacturer for this evaluation.",
    });
    getMyEvaluationsApi()
      .then((response) => setEvaluation((response.data || []).find((item) => item.applicationNumber === applicationId) || null))
      .catch(() => setUploadError("Unable to load evaluation details."));

    getEvaluationDocumentsApi(applicationId)
      .then((response) => setUploadedDocuments(Object.fromEntries((response.data || []).map((document) => [document.documentType, document]))))
      .catch((error) => setUploadError(error.data?.message || "Unable to load uploaded documents."));
  }, [applicationId, setHeaderContent]);

  const handleUpload = async (event, documentType) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploadingType(documentType);
    try {
      const formData = new FormData();
      formData.append("document", file);
      formData.append("documentType", documentType);
      const response = await uploadEvaluationDocumentApi(applicationId, formData);
      setUploadedDocuments((current) => ({ ...current, [documentType]: response.data }));
    } catch (error) {
      setUploadError(error.data?.message || "Document upload failed.");
    } finally {
      setUploadingType("");
      event.target.value = "";
    }
  };

  const handleCompleteDocuments = async () => {
    setUploadError("");
    setCompleting(true);
    try {
      await completeEvaluationDocumentsApi(applicationId);
      navigate(`/testing/${applicationId}/workflow`);
    } catch (error) {
      setUploadError(error.data?.message || "Unable to complete document upload.");
    } finally {
      setCompleting(false);
    }
  };

  const instrument = evaluation?.instrumentId || {};
  return (
    <section className="-mt-3 mx-auto max-w-6xl text-[#0F1B33]">
      <button
        type="button"
        onClick={() => navigate(`/testing/${applicationId}/workflow`)}
        className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-[#D8E0EA] bg-white px-3 py-2 text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC]"
      >
        <ArrowLeft size={14} />
        Back
      </button>
      
      {evaluation && (
        <article className="mt-2 flex flex-wrap items-start gap-3 rounded-lg border border-[#E2E8F0] bg-white p-3 shadow-sm">
          <img
            src={getInstrumentImage(instrument.instrumentType)}
            alt=""
            className="h-14 w-14 object-contain"
          />
          <div className="min-w-[220px] flex-1">
            <strong className="text-sm">
              Application: {evaluation.applicationNumber}
            </strong>
            <strong className="mt-1 block text-xs">
              {instrument.instrumentType}
            </strong>
            <div className="mt-1 flex flex-wrap gap-x-4 text-[10px] text-[#64748B]">
              <span>Model: {instrument.modelNumber || "—"}</span>
              <span>Serial: {instrument.serialNumber || "—"}</span>
              <span>Manufacturer: {instrument.manufacturer || "—"}</span>
            </div>
          </div>
          <span className="ml-auto rounded bg-[#DBEAFE] px-2 py-1 text-[9px] font-semibold text-[#2563EB]">In Progress</span>
        </article>
      )}
      <section className="mt-3 rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-sm">
        <h2 className="m-0 text-sm font-bold">Required Documents</h2>
        <p className="mt-1 text-[10px] text-[#64748B]">
          Upload the following documents to proceed with the evaluation. File
          formats: PDF, JPG, PNG (Max size: 10 MB).
        </p>
        {uploadError && <p className="mt-2 rounded bg-[#FEF2F2] px-3 py-2 text-[10px] text-[#DC2626]">{uploadError}</p>}
        <div className="mt-3 border-t border-[#E2E8F0]">
          {documents.map(({ title, note, icon: Icon, tone, required, availability, documentType, pdfOnly }) => {
            const uploadedDocument = uploadedDocuments[documentType];
            const isUploading = uploadingType === documentType;
            return (
            <div
              key={title}
              className="flex flex-wrap items-center gap-3 border-b border-[#E2E8F0] py-3"
            >
              <div
                className={`grid h-9 w-9 place-items-center rounded-md ${tone}`}
              >
                <Icon size={18} />
              </div>
              <div className="min-w-[200px] flex-1">
                <strong className="text-[11px]">
                  {title}{" "}
                  {required ? (
                    <span className="text-[#EF4444]">*</span>
                  ) : availability ? (
                    <span className="ml-1 rounded bg-[#E8F1FF] px-1.5 py-0.5 text-[8px] font-semibold text-[#2563EB]">{availability}</span>
                  ) : (
                    <span className="ml-1 rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[8px] font-medium text-[#64748B]">
                      Optional
                    </span>
                  )}
                </strong>
                <p className="m-0 mt-0.5 max-w-md text-[9px] leading-4 text-[#64748B]">
                  {note}
                </p>
              </div>
              {uploadedDocument ? <div className="flex w-full gap-2 sm:w-auto"><a href={uploadedDocument.fileUrl} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-[#BFDBFE] px-3 py-2 text-[10px] font-semibold text-[#2563EB] hover:bg-[#EFF6FF]"><Eye size={14} />View</a><label className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-dashed border-[#93C5FD] bg-[#F8FBFF] px-3 py-2 text-[10px] font-semibold text-[#2563EB] hover:bg-[#EFF6FF]"><RefreshCw size={13} className={isUploading ? "animate-spin" : ""} />{isUploading ? "Replacing..." : "Replace"}<input type="file" accept={pdfOnly ? ".pdf,application/pdf" : ".pdf,image/png,image/jpeg"} className="!hidden" disabled={isUploading} onChange={(event) => handleUpload(event, documentType)} /></label></div> : <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-[#93C5FD] bg-[#F8FBFF] px-2 py-2 text-[#2563EB] sm:w-36"><Upload size={16} className={`text-[#2563EB] ${isUploading ? "animate-bounce" : ""}`} /><span className="text-[10px] font-extrabold">{isUploading ? "Uploading..." : "Upload"}</span><input type="file" accept={pdfOnly ? ".pdf,application/pdf" : ".pdf,image/png,image/jpeg"} className="!hidden" disabled={isUploading} onChange={(event) => handleUpload(event, documentType)} /></label>}
            </div>
          );
          })}
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={handleCompleteDocuments}
            disabled={completing}
            className="inline-flex items-center gap-2 rounded-md bg-[#2563EB] px-4 py-2 text-[10px] font-semibold text-white shadow-sm hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {completing ? "Checking documents..." : "Complete & Continue"}
            <ArrowRight size={14} />
          </button>
        </div>
      </section>
    </section>
  );
};
