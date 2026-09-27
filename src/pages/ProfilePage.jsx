import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { BadgeCheck, CalendarDays, Check, KeyRound, Mail, Pencil, Phone, ShieldCheck, UserRound, X } from "lucide-react";
import { changeMyPasswordApi, updateMyProfileApi } from "../api/authApi.js";
import "./profilePage.css";

const readableRole = (role = "") => String(role).trim().replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
const dateLabel = (value, options = {}) => value ? new Intl.DateTimeFormat("en-IN", options).format(new Date(value)) : "Not added";

export default function ProfilePage() {
  const { currentUser, setCurrentUser, setHeaderContent } = useOutletContext();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", dateOfBirth: "", gender: "" });

  useEffect(() => {
    setHeaderContent?.({ title: "My Profile", subtitle: "Manage your personal information and account security." });
  }, [setHeaderContent]);

  useEffect(() => {
    setForm({ name: currentUser?.name || "", phone: currentUser?.phone || "", dateOfBirth: currentUser?.dateOfBirth ? new Date(currentUser.dateOfBirth).toISOString().slice(0, 10) : "", gender: currentUser?.gender || "" });
  }, [currentUser]);

  const initials = useMemo(() => String(currentUser?.name || "User").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(), [currentUser?.name]);
  const startEditing = () => { setError(""); setNotice(""); setEditing(true); };
  const cancelEditing = () => { setForm({ name: currentUser?.name || "", phone: currentUser?.phone || "", dateOfBirth: currentUser?.dateOfBirth ? new Date(currentUser.dateOfBirth).toISOString().slice(0, 10) : "", gender: currentUser?.gender || "" }); setEditing(false); setError(""); };

  const saveProfile = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const response = await updateMyProfileApi(form);
      setCurrentUser(response.currentUser);
      setEditing(false);
      setNotice("Your profile information has been saved.");
    } catch (requestError) { setError(requestError.message || "Could not save profile changes."); }
    finally { setSaving(false); }
  };

  const changePassword = async (event) => {
    event.preventDefault(); setError(""); setNotice("");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { setError("The new passwords do not match."); return; }
    setPasswordSaving(true);
    try {
      const response = await changeMyPasswordApi({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      setNotice(response.message || "Your password has been changed.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordOpen(false);
    } catch (requestError) { setError(requestError.message || "Could not change password."); }
    finally { setPasswordSaving(false); }
  };

  const field = (label, key, icon, type = "text", options = null) => {
    const Icon = icon;
    return <label className="profile-field" key={key}><span className="profile-field-icon"><Icon size={16} /></span><span className="profile-field-body"><span className="profile-field-label">{label}</span>{editing ? options ? <select value={form[key]} onChange={(event) => setForm((previous) => ({ ...previous, [key]: event.target.value }))}><option value="">Select</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select> : <input type={type} value={form[key]} onChange={(event) => setForm((previous) => ({ ...previous, [key]: event.target.value }))} /> : <strong className={key === "dateOfBirth" || key === "gender" ? (!currentUser?.[key] ? "profile-missing" : "") : ""}>{key === "dateOfBirth" ? dateLabel(currentUser?.dateOfBirth, { day: "2-digit", month: "short", year: "numeric" }) : currentUser?.[key] || "Not added"}</strong>}</span></label>;
  };

  return <main className="profile-page">
    <section className="profile-hero">
      <div className="profile-avatar">{currentUser?.profileImage ? <img src={currentUser.profileImage} alt="Profile" /> : initials}</div>
      <div className="profile-hero-copy"><h1>{currentUser?.name || "My Profile"}</h1><p><Mail size={15} />{currentUser?.email}</p><div className="profile-badges"><span className="profile-role"><UserRound size={14} />{readableRole(currentUser?.role)}</span>{currentUser?.officerId && <span className="profile-meta"><BadgeCheck size={14} />{currentUser.officerId}</span>}<span className="profile-meta"><CalendarDays size={14} />Member since {dateLabel(currentUser?.createdAt, { month: "short", year: "numeric" })}</span></div></div>
      <div className="profile-hero-mark"><ShieldCheck size={22} /><span>NAWI<br />VERIFIED ACCOUNT</span></div>
    </section>

    {notice && <div className="profile-alert success"><Check size={16} />{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss">×</button></div>}
    {error && <div className="profile-alert error">{error}<button type="button" onClick={() => setError("")} aria-label="Dismiss">×</button></div>}

    <section className="profile-card">
      <header className="profile-card-header"><span className="profile-section-icon"><UserRound size={19} /></span><div><h2>Personal Information</h2><p>Keep your contact and personal details up to date.</p></div>{editing ? <div className="profile-header-actions"><button type="button" className="profile-btn secondary" onClick={cancelEditing}><X size={15} />Cancel</button><button type="submit" form="profile-form" className="profile-btn primary" disabled={saving}>{saving ? "Saving…" : <><Check size={15} />Save changes</>}</button></div> : <button type="button" className="profile-btn secondary profile-edit" onClick={startEditing}><Pencil size={15} />Edit details</button>}</header>
      <form id="profile-form" onSubmit={saveProfile} className="profile-fields-grid">
        {field("Full name", "name", UserRound)}
        {field("Phone number", "phone", Phone, "tel")}
        {field("Date of birth", "dateOfBirth", CalendarDays, "date")}
        {field("Gender", "gender", UserRound, "text", ["Female", "Male", "Non-binary", "Prefer not to say"])}
        <label className="profile-field"><span className="profile-field-icon"><Mail size={16} /></span><span className="profile-field-body"><span className="profile-field-label">Email address</span><strong>{currentUser?.email || "Not added"}</strong><small>Email address is managed by your account administrator.</small></span></label>
      </form>
    </section>

    <section className="profile-security">
      <span className="profile-security-icon"><ShieldCheck size={21} /></span><div className="profile-security-copy"><h2>Security Center <span>PROTECTED</span></h2><p>Update your login password to keep your account access secure.</p></div><button type="button" className="profile-btn security-btn" onClick={() => { setPasswordOpen((open) => !open); setError(""); setNotice(""); }}><KeyRound size={16} />{passwordOpen ? "Close" : "Change password"}</button>
    </section>

    {passwordOpen && <form className="profile-password-card" onSubmit={changePassword}><div><h3>Change your password</h3><p>Choose a new password with at least 8 characters.</p></div><div className="profile-password-fields">{[["Current password", "currentPassword"], ["New password", "newPassword"], ["Confirm new password", "confirmPassword"]].map(([label, key]) => <label key={key}>{label}<input type="password" required minLength={key === "currentPassword" ? undefined : 8} autoComplete={key === "currentPassword" ? "current-password" : "new-password"} value={passwordForm[key]} onChange={(event) => setPasswordForm((previous) => ({ ...previous, [key]: event.target.value }))} /></label>)}</div><div className="profile-password-actions"><button type="submit" className="profile-btn primary" disabled={passwordSaving}>{passwordSaving ? "Updating…" : "Update password"}</button></div></form>}
  </main>;
}
