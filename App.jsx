import { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx-js-style";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const PHASES = [
  { key: "shopifyStore",   label: "Shopify Store Built",          day: 1, short: "Shopify",    emoji: "🛍️",  color: "#f97316", bg: "#fff7ed" },
  { key: "antiGravity",    label: "Anti-Gravity Website Built",   day: 1, short: "A-Gravity",  emoji: "🚀",  color: "#8b5cf6", bg: "#f5f3ff" },
  { key: "videosWatched",  label: "Videos Watched",               day: 1, short: "Videos",     emoji: "🎬",  color: "#ec4899", bg: "#fdf2f8" },
  { key: "certificate",   label: "Certificate Uploaded",          day: 1, short: "Certificate",emoji: "📜",  color: "#0369a1", bg: "#f0f9ff" },
  { key: "interviewPassed",label: "Interview Passed",             day: 2, short: "Interview",  emoji: "🎤",  color: "#6366f1", bg: "#eef2ff" },
  { key: "chatPart1",      label: "Client Chat Analysis Pt.1",   day: 3, short: "Chat P1",    emoji: "💬",  color: "#0ea5e9", bg: "#f0f9ff" },
  { key: "chatPart2",      label: "Client Chat Analysis Pt.2",   day: 4, short: "Chat P2",    emoji: "📊",  color: "#06b6d4", bg: "#ecfeff" },
  { key: "shopifyTheme",   label: "Shopify Theme Research",       day: 5, short: "S. Theme",   emoji: "🎨",  color: "#10b981", bg: "#ecfdf5" },
  { key: "brandedStore",   label: "Branded Store Research",       day: 6, short: "Branded",    emoji: "🏷️",  color: "#f59e0b", bg: "#fffbeb" },
  { key: "portfolioReview",label: "Portfolio Store Review",       day: 7, short: "Portfolio",  emoji: "🖼️",  color: "#ef4444", bg: "#fef2f2" },
  { key: "finalTest",      label: "Final Test Passed (80%+)",     day: 8, short: "Final Test", emoji: "🏆",  color: "#22c55e", bg: "#f0fdf4" },
];

// Maps each phase key → dedicated Supabase column for its remark text
const PHASE_REMARK_COL = {
  shopifyStore:    "shopify_remarks",
  antiGravity:     "a_gravity_remarks",
  videosWatched:   "videos_remarks",
  certificate:     "certificate_remarks",
  interviewPassed: "interview_remarks",
  chatPart1:       "chat_p1_remarks",
  chatPart2:       "chat_p2_remarks",
  shopifyTheme:    "s_theme_remarks",
  brandedStore:    "branded_remarks",
  portfolioReview: "portfolio_remarks",
  finalTest:       "final_test_remarks",
};

const ONBOARDERS = ["Sarthak", "Archita", "Kritika"];
const ONBOARDER_CONFIG = {
  Sarthak: { color: "#6366f1", bg: "#eef2ff" },
  Archita: { color: "#0ea5e9", bg: "#f0f9ff" },
  Kritika: { color: "#ec4899", bg: "#fdf2f8" },
};

const STATUSES = ["Not Started", "In Progress", "Completed", "Dropped", "Interview Pending", "Pending", "Selected", "Not Selected", "Leaved"];
const GRADUATED_STATUSES = ["Selected", "Not Selected"];
// Any "all 11 done" terminal state — used to decide whether to re-open the outcome modal
const ALL_DONE_STATUSES = ["Selected", "Not Selected", "Pending"];
const BOTTOM_SECTION_STATUSES = ["Pending", "Selected", "Not Selected", "Leaved"];
const STATUS_CONFIG = {
  "Not Started":       { color: "#ef4444", bg: "#fef2f2", dot: "#ef4444" },
  "In Progress":       { color: "#f59e0b", bg: "#fffbeb", dot: "#f59e0b" },
  "Completed":         { color: "#22c55e", bg: "#f0fdf4", dot: "#22c55e" },
  "Dropped":           { color: "#6b7280", bg: "#f9fafb", dot: "#9ca3af" },
  "Interview Pending": { color: "#8b5cf6", bg: "#f5f3ff", dot: "#8b5cf6" },
  "Pending":           { color: "#ca8a04", bg: "#fef9c3", dot: "#eab308" },
  "Selected":          { color: "#0d9488", bg: "#f0fdfa", dot: "#14b8a6" },
  "Not Selected":      { color: "#d97706", bg: "#fffbeb", dot: "#f59e0b" },
  "Leaved":            { color: "#be123c", bg: "#fff1f2", dot: "#f43f5e" },
};

const EMPTY_PHASES     = Object.fromEntries(PHASES.map(p => [p.key, false]));
const EMPTY_PHASE_NOTES = Object.fromEntries(PHASES.map(p => [p.key, ""]));

const INITIAL_TRAINEES = [
  { id: 1, name: "Akansha",               contact: "+91 7491041071", status: "In Progress",  enrollDate: "2026-04-01",
    notes: "", phaseNotes: { ...EMPTY_PHASE_NOTES },
    phases: { shopifyStore: true,  antiGravity: true,  videosWatched: true,  certificate: false, interviewPassed: true,  chatPart1: true,  chatPart2: true,  shopifyTheme: true,  brandedStore: true,  portfolioReview: true,  finalTest: false } },
  { id: 2, name: "Harsh",                 contact: "+91 8887927075", status: "Not Started",  enrollDate: "2026-04-01",
    notes: "", phaseNotes: { ...EMPTY_PHASE_NOTES },
    phases: { shopifyStore: true,  antiGravity: true,  videosWatched: true,  certificate: true,  interviewPassed: true,  chatPart1: true,  chatPart2: true,  shopifyTheme: true,  brandedStore: true,  portfolioReview: true,  finalTest: false } },
  { id: 3, name: "Tushar Vijay Paidlewar",contact: "+91 9156231077", status: "Not Started",  enrollDate: "2026-04-01",
    notes: "", phaseNotes: { ...EMPTY_PHASE_NOTES },
    phases: { shopifyStore: true,  antiGravity: true,  videosWatched: true,  certificate: false, interviewPassed: true,  chatPart1: true,  chatPart2: true,  shopifyTheme: true,  brandedStore: true,  portfolioReview: true,  finalTest: false } },
  { id: 4, name: "Kartik Verma",          contact: "+91 8449725011", status: "Not Started",  enrollDate: "2026-04-01",
    notes: "", phaseNotes: { ...EMPTY_PHASE_NOTES },
    phases: { shopifyStore: true,  antiGravity: true,  videosWatched: true,  certificate: false, interviewPassed: true,  chatPart1: true,  chatPart2: true,  shopifyTheme: true,  brandedStore: true,  portfolioReview: true,  finalTest: false } },
  { id: 5, name: "Nitya Soni",            contact: "+91 7017835868", status: "Not Started",  enrollDate: "2026-04-01",
    notes: "", phaseNotes: { ...EMPTY_PHASE_NOTES },
    phases: { shopifyStore: true,  antiGravity: true,  videosWatched: true,  certificate: false, interviewPassed: false, chatPart1: false, chatPart2: false, shopifyTheme: false, brandedStore: false, portfolioReview: false, finalTest: false } },
  { id: 6, name: "Thoufiq Muhammed",      contact: "+91 7396586970", status: "Not Started",  enrollDate: "2026-04-01",
    notes: "", phaseNotes: { ...EMPTY_PHASE_NOTES },
    phases: { shopifyStore: true,  antiGravity: true,  videosWatched: true,  certificate: false, interviewPassed: true,  chatPart1: true,  chatPart2: false, shopifyTheme: false, brandedStore: false, portfolioReview: false, finalTest: false } },
  { id: 7, name: "Rohit Mishra",          contact: "7028789757",     status: "Not Started",  enrollDate: "2026-04-01",
    notes: "", phaseNotes: { ...EMPTY_PHASE_NOTES },
    phases: { shopifyStore: true,  antiGravity: true,  videosWatched: true,  certificate: false, interviewPassed: false, chatPart1: false, chatPart2: false, shopifyTheme: false, brandedStore: false, portfolioReview: false, finalTest: false } },
];

function getPhaseDay(phases) {
  let last = 0;
  for (const p of PHASES) { if (phases[p.key]) last = p.day; }
  return last;
}
function getCompletedCount(phases) { return PHASES.filter(p => phases[p.key]).length; }
function isOverdue(trainee) {
  const enroll = new Date(trainee.enrollDate);
  const daysSince = Math.floor((new Date() - enroll) / 86400000);
  const completedDay = getPhaseDay(trainee.phases);
  return daysSince > completedDay + 2 && trainee.status !== "Completed" && trainee.status !== "Dropped";
}

/* ─── Phase checkbox ─── */
function PhaseCheckbox({ checked, onChange, overdue }) {
  return (
    <label style={{ display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ display:"none" }} />
      <span style={{
        width:20, height:20, borderRadius:5,
        border: checked ? "none" : `2px solid ${overdue ? "#ef4444" : "#d1d5db"}`,
        background: checked ? "#22c55e" : overdue ? "#fef2f2" : "#f9fafb",
        display:"flex", alignItems:"center", justifyContent:"center",
        transition:"all 0.15s",
        boxShadow: checked ? "0 1px 4px #22c55e55" : "none",
      }}>
        {checked && <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </span>
    </label>
  );
}

/* ─── Trainee Notes Modal ─── */
function TraineeNotesModal({ trainee, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState(PHASES[0].key);
  const [phases, setPhases]       = useState({ ...trainee.phases });
  const [phaseNotes, setPhaseNotes] = useState({ ...(trainee.phaseNotes || EMPTY_PHASE_NOTES) });
  const [generalNotes, setGeneralNotes] = useState(trainee.notes || "");
  const [status, setStatus] = useState(trainee.status);
  const [certImage, setCertImage] = useState(trainee.certificateImage || "");
  const [certText, setCertText]   = useState(trainee.certificateText || "");

  const handleCertUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCertImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  const save = () => {
    onUpdate(trainee.id, { phases, phaseNotes, notes: generalNotes, status, certificateImage: certImage, certificateText: certText });
    onClose();
  };

  const activePhase = PHASES.find(p => p.key === activeTab);

  return (
    <div style={{
      position:"fixed", inset:0, background:"#00000088", zIndex:300,
      display:"flex", alignItems:"center", justifyContent:"center",
      padding: "16px",
    }} onClick={onClose}>
      <div style={{
        background:"#fff", borderRadius:20, width:820, maxWidth:"97vw",
        maxHeight:"90vh", display:"flex", flexDirection:"column",
        boxShadow:"0 32px 80px #0004",
        fontFamily:"'DM Sans', sans-serif",
        overflow:"hidden",
      }} onClick={e => e.stopPropagation()}>

        {/* Modal Header */}
        <div style={{
          padding:"18px 24px", borderBottom:"1.5px solid #e8eaf6",
          background:"linear-gradient(135deg, #f8faff, #f0f4ff)",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          flexShrink:0,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{
              width:42, height:42, borderRadius:12,
              background:`linear-gradient(135deg, ${STATUS_CONFIG[status]?.color}22, ${STATUS_CONFIG[status]?.color}44)`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontWeight:800, fontSize:15, color: STATUS_CONFIG[status]?.color,
            }}>
              {trainee.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:18, color:"#1e293b" }}>
                📋 {trainee.name}
              </div>
              <div style={{ fontSize:12, color:"#94a3b8", marginTop:1, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                📱 {trainee.contact} · 📅 Enrolled {new Date(trainee.enrollDate || trainee.enroll_date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}
                {trainee.onboarder && (
                  <span style={{ fontWeight:700, padding:"2px 8px", borderRadius:99, background: ONBOARDER_CONFIG[trainee.onboarder]?.bg||"#f1f5f9", color: ONBOARDER_CONFIG[trainee.onboarder]?.color||"#64748b", fontSize:11 }}>
                    👤 {trainee.onboarder}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {/* Status selector in modal */}
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              style={{
                padding:"6px 12px",
                background: STATUS_CONFIG[status]?.bg,
                color: STATUS_CONFIG[status]?.color,
                border:`1.5px solid ${STATUS_CONFIG[status]?.color}55`,
                borderRadius:8, fontWeight:700, fontSize:12,
                cursor:"pointer", outline:"none", fontFamily:"inherit",
              }}
            >
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={onClose} style={{
              width:32, height:32, borderRadius:8, border:"none",
              background:"#f1f5f9", cursor:"pointer", fontSize:18, color:"#64748b",
            }}>×</button>
          </div>
        </div>

        {/* Phase Tabs */}
        <div style={{
          display:"flex", gap:0, overflowX:"auto", flexShrink:0,
          borderBottom:"1.5px solid #e8eaf6",
          background:"#fafbff", padding:"0 16px",
        }}>
          {PHASES.map(p => {
            const done = phases[p.key];
            const hasNote = !!(phaseNotes[p.key]?.trim());
            const isActive = activeTab === p.key;
            return (
              <button key={p.key} onClick={() => setActiveTab(p.key)} style={{
                padding:"11px 14px", border:"none", background:"transparent",
                borderBottom: isActive ? `3px solid ${p.color}` : "3px solid transparent",
                color: isActive ? p.color : "#94a3b8",
                fontWeight: isActive ? 700 : 500,
                fontSize:12, cursor:"pointer", whiteSpace:"nowrap",
                fontFamily:"inherit", display:"flex", alignItems:"center", gap:5,
                transition:"all 0.15s",
              }}>
                {p.emoji} {p.short}
                {done && <span style={{ color:"#22c55e", fontSize:10 }}>✓</span>}
                {hasNote && !done && <span style={{ width:6, height:6, borderRadius:"50%", background: p.color, display:"inline-block" }}/>}
              </button>
            );
          })}
          <button onClick={() => setActiveTab("general")} style={{
            padding:"11px 14px", border:"none", background:"transparent",
            borderBottom: activeTab==="general" ? "3px solid #64748b" : "3px solid transparent",
            color: activeTab==="general" ? "#1e293b" : "#94a3b8",
            fontWeight: activeTab==="general" ? 700 : 500,
            fontSize:12, cursor:"pointer", whiteSpace:"nowrap",
            fontFamily:"inherit", display:"flex", alignItems:"center", gap:5,
          }}>
            📝 Notes
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ flex:1, overflowY:"auto", padding:24 }}>
          {activeTab === "general" ? (
            <div>
              <div style={{ fontWeight:700, fontSize:14, color:"#1e293b", marginBottom:12 }}>📝 General Notes</div>
              <textarea
                value={generalNotes}
                onChange={e => setGeneralNotes(e.target.value)}
                rows={8}
                placeholder="Add general notes about this trainee..."
                style={{
                  width:"100%", padding:"14px", border:"1.5px solid #e2e8f0",
                  borderRadius:12, fontSize:14, color:"#1e293b", outline:"none",
                  resize:"vertical", fontFamily:"inherit", boxSizing:"border-box",
                  lineHeight:1.7, background:"#fafbff",
                }}
              />
            </div>
          ) : (
            <div>
              {/* Phase detail card */}
              <div style={{
                background: activePhase.bg,
                border:`1.5px solid ${activePhase.color}33`,
                borderRadius:14, padding:20, marginBottom:20,
              }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:28 }}>{activePhase.emoji}</span>
                    <div>
                      <div style={{ fontWeight:800, fontSize:16, color: activePhase.color, fontFamily:"'Sora',sans-serif" }}>
                        {activePhase.label}
                      </div>
                      <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>Day {activePhase.day}</div>
                    </div>
                  </div>
                  {/* Completion toggle */}
                  <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
                    <span style={{ fontSize:13, fontWeight:600, color:"#475569" }}>
                      {phases[activeTab] ? "✅ Completed" : "⬜ Not Done"}
                    </span>
                    <div
                      onClick={() => setPhases(p => ({ ...p, [activeTab]: !p[activeTab] }))}
                      style={{
                        width:44, height:24, borderRadius:99,
                        background: phases[activeTab] ? "#22c55e" : "#e2e8f0",
                        position:"relative", cursor:"pointer", transition:"background 0.2s",
                        flexShrink:0,
                      }}
                    >
                      <div style={{
                        position:"absolute", top:3, left: phases[activeTab] ? 23 : 3,
                        width:18, height:18, borderRadius:"50%", background:"#fff",
                        transition:"left 0.2s", boxShadow:"0 1px 4px #0003",
                      }}/>
                    </div>
                  </label>
                </div>
              </div>

              {/* Remark textarea */}
              <div style={{ marginBottom:12 }}>
                <div style={{ fontWeight:700, fontSize:13, color:"#475569", marginBottom:8, display:"flex", alignItems:"center", gap:6 }}>
                  <span>✏️</span> Remarks / Feedback for this stage
                </div>
                <textarea
                  value={phaseNotes[activeTab] || ""}
                  onChange={e => setPhaseNotes(n => ({ ...n, [activeTab]: e.target.value }))}
                  rows={6}
                  placeholder={`Add your remarks for "${activePhase.label}"...\n\nE.g. quality of work, issues faced, feedback given, score, link shared, etc.`}
                  style={{
                    width:"100%", padding:"14px",
                    border:`1.5px solid ${activePhase.color}44`,
                    borderRadius:12, fontSize:14, color:"#1e293b", outline:"none",
                    resize:"vertical", fontFamily:"inherit", boxSizing:"border-box",
                    lineHeight:1.7, background:"#fff",
                  }}
                />
              </div>

              {/* Certificate upload — only on certificate tab */}
              {activeTab === "certificate" && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontWeight:700, fontSize:13, color:"#0369a1", marginBottom:10, display:"flex", alignItems:"center", gap:6 }}>
                    <span>📜</span> Certificate Image & Details
                  </div>

                  {/* Image upload area */}
                  <div style={{
                    border: certImage ? "2px solid #0369a133" : "2px dashed #bae6fd",
                    borderRadius:14, overflow:"hidden", marginBottom:14,
                    background: certImage ? "#f0f9ff" : "#f8faff",
                  }}>
                    {certImage ? (
                      <div style={{ position:"relative" }}>
                        <img src={certImage} alt="Certificate" style={{ width:"100%", maxHeight:300, objectFit:"contain", display:"block", background:"#fff" }} />
                        <div style={{ padding:"10px 14px", borderTop:"1px solid #e0e7ff", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                          <span style={{ fontSize:12, color:"#0369a1", fontWeight:600 }}>📎 Certificate uploaded</span>
                          <div style={{ display:"flex", gap:8 }}>
                            <label style={{
                              padding:"5px 14px", borderRadius:7, border:"1.5px solid #bae6fd",
                              background:"#f0f9ff", color:"#0369a1", fontWeight:600, fontSize:11,
                              cursor:"pointer", fontFamily:"inherit",
                            }}>
                              🔄 Replace
                              <input type="file" accept="image/*" onChange={handleCertUpload} style={{ display:"none" }} />
                            </label>
                            <button onClick={()=>setCertImage("")} style={{
                              padding:"5px 14px", borderRadius:7, border:"1.5px solid #fecdd3",
                              background:"#fff1f2", color:"#be123c", fontWeight:600, fontSize:11,
                              cursor:"pointer", fontFamily:"inherit",
                            }}>🗑 Remove</button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <label style={{
                        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                        padding:"36px 20px", cursor:"pointer", gap:10,
                      }}>
                        <div style={{ fontSize:40 }}>📷</div>
                        <div style={{ fontSize:14, fontWeight:600, color:"#0369a1" }}>Click to upload certificate image</div>
                        <div style={{ fontSize:12, color:"#94a3b8" }}>JPG, PNG, or any image format</div>
                        <input type="file" accept="image/*" onChange={handleCertUpload} style={{ display:"none" }} />
                      </label>
                    )}
                  </div>

                  {/* Certificate text notes */}
                  <div style={{ fontWeight:600, fontSize:12, color:"#475569", marginBottom:6 }}>📝 Certificate Details / Notes</div>
                  <textarea
                    value={certText}
                    onChange={e => setCertText(e.target.value)}
                    rows={3}
                    placeholder="e.g. Certificate ID, issuing organization, date, any remarks..."
                    style={{
                      width:"100%", padding:"12px",
                      border:"1.5px solid #bae6fd",
                      borderRadius:10, fontSize:13, color:"#1e293b", outline:"none",
                      resize:"vertical", fontFamily:"inherit", boxSizing:"border-box",
                      lineHeight:1.6, background:"#fff",
                    }}
                  />
                </div>
              )}

              {/* Quick nav: all phases mini grid */}
              <div style={{ marginTop:20 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#94a3b8", marginBottom:10, textTransform:"uppercase", letterSpacing:"0.05em" }}>All Phases Overview</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(6, 1fr)", gap:8 }}>
                  {PHASES.map(p => {
                    const done = phases[p.key];
                    const hasRemark = !!(phaseNotes[p.key]?.trim());
                    return (
                      <div
                        key={p.key}
                        onClick={() => setActiveTab(p.key)}
                        style={{
                          padding:"10px 8px", borderRadius:10, cursor:"pointer",
                          border: activeTab===p.key ? `2px solid ${p.color}` : `1.5px solid ${done ? p.color+"44" : "#e8eaf6"}`,
                          background: done ? p.bg : activeTab===p.key ? p.bg : "#fafbff",
                          textAlign:"center", transition:"all 0.15s",
                        }}
                      >
                        <div style={{ fontSize:18 }}>{p.emoji}</div>
                        <div style={{ fontSize:10, fontWeight:700, color: done ? p.color : "#94a3b8", marginTop:3, lineHeight:1.3 }}>{p.short}</div>
                        <div style={{ marginTop:4, fontSize:10 }}>
                          {done ? <span style={{ color:"#22c55e" }}>✓ Done</span> : <span style={{ color:"#d1d5db" }}>—</span>}
                          {hasRemark && <span style={{ marginLeft:4, color: p.color }}>📝</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding:"14px 24px", borderTop:"1.5px solid #e8eaf6",
          background:"#fafbff", display:"flex", gap:10,
          justifyContent:"flex-end", flexShrink:0,
        }}>
          <button onClick={onClose} style={{
            padding:"9px 22px", borderRadius:9, border:"1.5px solid #e2e8f0",
            background:"#fff", color:"#64748b", fontWeight:600,
            fontSize:13, cursor:"pointer", fontFamily:"inherit",
          }}>Cancel</button>
          <button onClick={save} style={{
            padding:"9px 28px", borderRadius:9, border:"none",
            background:"linear-gradient(135deg, #6366f1, #8b5cf6)",
            color:"#fff", fontWeight:700, fontSize:13,
            cursor:"pointer", fontFamily:"inherit",
            boxShadow:"0 4px 16px #6366f133",
          }}>💾 Save Changes</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Add Trainee Modal ─── */
function AddTraineeModal({ onClose, onAdd, isAdmin, defaultOnboarder }) {
  const [form, setForm] = useState({
    name:"",
    contact:"",
    onboarder: isAdmin ? "" : (defaultOnboarder || ""),
    enrollDate: new Date().toISOString().slice(0,10),
    notes:"",
  });
  const set = (k,v) => setForm(f => ({...f,[k]:v}));
  // Employees don't need to pick an onboarder — it's auto-set, so name is the only required field
  const canAdd = form.name.trim() && (isAdmin ? !!form.onboarder : true);
  const ob = ONBOARDER_CONFIG[form.onboarder];
  return (
    <div style={{ position:"fixed",inset:0,background:"#0008",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center" }} onClick={onClose}>
      <div style={{ background:"#fff",borderRadius:20,padding:36,width:480,maxWidth:"95vw",boxShadow:"0 25px 60px #0003",fontFamily:"'DM Sans',sans-serif" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24 }}>
          <h2 style={{ margin:0,fontSize:22,fontWeight:700,color:"#1e293b",fontFamily:"'Sora',sans-serif" }}>Add New Trainee</h2>
          <button onClick={onClose} style={{ background:"#f1f5f9",border:"none",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:18,color:"#64748b" }}>×</button>
        </div>
        {[{label:"Full Name",key:"name",type:"text",placeholder:"e.g. Ayesha Khan"},{label:"WhatsApp Contact",key:"contact",type:"text",placeholder:"+91-300-0000000"},{label:"Enroll Date",key:"enrollDate",type:"date"}].map(({label,key,type,placeholder})=>(
          <div key={key} style={{ marginBottom:16 }}>
            <label style={{ display:"block",fontSize:13,fontWeight:600,color:"#475569",marginBottom:6 }}>{label}</label>
            <input type={type} value={form[key]} onChange={e=>set(key,e.target.value)} placeholder={placeholder} style={{ width:"100%",padding:"10px 14px",border:"2px solid #e2e8f0",borderRadius:10,fontSize:14,color:"#1e293b",outline:"none",boxSizing:"border-box",fontFamily:"inherit" }}/>
          </div>
        ))}
        {/* Onboarder — only admins pick; employees are auto-assigned their own profile name */}
        {isAdmin && (
          <div style={{ marginBottom:16 }}>
            <label style={{ display:"block",fontSize:13,fontWeight:600,color:"#475569",marginBottom:6 }}>👤 Onboarder — Who is taking this training?</label>
            <select
              value={form.onboarder}
              onChange={e=>set("onboarder",e.target.value)}
              style={{ width:"100%",padding:"10px 14px",border: form.onboarder ? `2px solid ${ob?.color}88` : "2px solid #e2e8f0",borderRadius:10,fontSize:14,color: form.onboarder ? ob?.color : "#94a3b8",background: form.onboarder ? ob?.bg : "#fff",outline:"none",boxSizing:"border-box",fontFamily:"inherit",fontWeight: form.onboarder ? 700 : 400,cursor:"pointer" }}
            >
              <option value="">— Select onboarder —</option>
              {ONBOARDERS.map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        )}
        <div style={{ marginBottom:24 }}>
          <label style={{ display:"block",fontSize:13,fontWeight:600,color:"#475569",marginBottom:6 }}>Notes</label>
          <textarea value={form.notes} onChange={e=>set("notes",e.target.value)} rows={3} placeholder="Any notes about this trainee..." style={{ width:"100%",padding:"10px 14px",border:"2px solid #e2e8f0",borderRadius:10,fontSize:14,color:"#1e293b",outline:"none",boxSizing:"border-box",resize:"vertical",fontFamily:"inherit" }}/>
        </div>
        <div style={{ display:"flex",gap:12 }}>
          <button onClick={onClose} style={{ flex:1,padding:"11px",borderRadius:10,border:"2px solid #e2e8f0",background:"#fff",color:"#64748b",fontWeight:600,cursor:"pointer",fontSize:14,fontFamily:"inherit" }}>Cancel</button>
          <button
            onClick={()=>{ if(canAdd){ onAdd({...form,status:"Not Started",phases:{...EMPTY_PHASES},phaseNotes:{...EMPTY_PHASE_NOTES}}); onClose(); }}}
            style={{ flex:2,padding:"11px",borderRadius:10,border:"none",background: canAdd ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "#e2e8f0",color: canAdd ? "#fff" : "#94a3b8",fontWeight:700,cursor: canAdd ? "pointer" : "not-allowed",fontSize:14,fontFamily:"inherit",boxShadow: canAdd ? "0 4px 16px #6366f144" : "none",transition:"all 0.2s" }}
          >+ Add Trainee</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Day Messages Panel ─── */
function DayMessagesPanel({ dayMessages, setDayMessages, onSave, onReset, onClose, isAdmin, personalTabs, showToast }) {
  const [selectedDay, setSelectedDay] = useState("intro");
  const [editing, setEditing]         = useState(false);
  const [draft, setDraft]             = useState("");
  const [copied, setCopied]           = useState(false);

  const dayLabels = {
    intro:"Introduction",
    faq:"FAQ PDF",
    1:"Videos",
    2:"Interview",
    3:"Chat Part 1",
    4:"Chat Part 2",
    5:"Theme + Brand",
    7:"Portfolio",
    8:"Final Test",
  };
  const currentMsg = dayMessages[selectedDay] || "";
  const handleCopy = () => { navigator.clipboard.writeText(currentMsg).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),2000); }); };

  return (
    <div style={{ position:"fixed",inset:0,background:"#0009",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }} onClick={onClose}>
      <div style={{ width:700,maxWidth:"96vw",maxHeight:"90vh",background:"#fff",borderRadius:20,boxShadow:"0 32px 80px #0004",display:"flex",flexDirection:"column",fontFamily:"'DM Sans',sans-serif",overflow:"hidden" }} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:"20px 24px",borderBottom:"2px solid #e0e7ff",background:"linear-gradient(135deg,#eef2ff,#ede9fe)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0 }}>
          <div>
            <div style={{ fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:18,color:"#1e293b" }}>📨 Day Messages</div>
            <div style={{ fontSize:12,color:"#6366f1",fontWeight:600,marginTop:2 }}>Store your messages per day — click to copy</div>
          </div>
          <button onClick={onClose} style={{ width:34,height:34,borderRadius:8,border:"none",background:"#fff",cursor:"pointer",fontSize:18,color:"#64748b",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px #0001" }}>×</button>
        </div>

        {/* Day Tabs */}
        <div style={{ display:"flex",gap:0,overflowX:"auto",borderBottom:"2px solid #e8eaf6",background:"#fafbff",padding:"0 16px",flexShrink:0 }}>
          {["intro","faq",1,2,3,4,5,7,8].map(d => {
            const tabNames = { intro:"✨ Intro", faq:"📄 FAQ PDF", 1:"Videos", 2:"Interview", 3:"Chat P1", 4:"Chat P2", 5:"Theme + Brand", 7:"Portfolio", 8:"Final Test" };
            return (
              <button key={d} onClick={()=>{setSelectedDay(d);setEditing(false);setCopied(false);}} style={{
                padding:"12px 14px",border:"none",background:"transparent",
                borderBottom: selectedDay===d ? "3px solid #6366f1" : "3px solid transparent",
                color: selectedDay===d ? "#6366f1" : "#94a3b8",
                fontWeight: selectedDay===d ? 700 : 500,
                fontSize:13,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",
                transition:"all 0.15s",
              }}>
                {tabNames[d]}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{ flex:1,overflowY:"auto",padding:24 }}>
          {selectedDay === "faq" ? (
            <FAQPanel isAdmin={isAdmin} showToast={showToast} />
          ) : (<>
          {/* Context banner — explains master vs personal copy */}
          <div style={{ marginBottom:14,padding:"10px 14px",borderRadius:10,fontSize:12,fontWeight:600,lineHeight:1.5,
            background: isAdmin ? "#eef2ff" : (personalTabs?.has(String(selectedDay)) ? "#fef9c3" : "#ecfdf5"),
            color: isAdmin ? "#4338ca" : (personalTabs?.has(String(selectedDay)) ? "#a16207" : "#047857"),
            border: `1.5px solid ${isAdmin ? "#c7d2fe" : (personalTabs?.has(String(selectedDay)) ? "#fde047" : "#a7f3d0")}`,
          }}>
            {isAdmin
              ? "🛡 You're editing the global MASTER template. Changes apply to every employee who hasn't personally edited this message."
              : (personalTabs?.has(String(selectedDay))
                  ? "✏️ You're viewing YOUR personal copy. Admin's master updates will not overwrite it until you reset."
                  : "📄 You're viewing the admin's master template. Saving will create your personal copy.")}
          </div>

          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
            <div style={{ fontWeight:700,fontSize:16,color:"#1e293b" }}>{dayLabels[selectedDay]}</div>
            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
              {!editing ? (
                <>
                  {currentMsg && (
                    <button onClick={handleCopy} style={{
                      padding:"8px 18px",borderRadius:8,border:"none",
                      background: copied ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#6366f1,#8b5cf6)",
                      color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",
                      boxShadow: copied ? "0 4px 12px #22c55e33" : "0 4px 12px #6366f133",
                      transition:"all 0.2s",
                    }}>
                      {copied ? "✅ Copied!" : "📋 Copy"}
                    </button>
                  )}
                  {/* Employee-only: Reset to Default — visible when they have a personal override */}
                  {!isAdmin && personalTabs?.has(String(selectedDay)) && (
                    <button onClick={()=>{ if(confirm("Remove your personal copy and revert to the admin's master version?")) onReset(selectedDay); }} style={{ padding:"8px 14px",borderRadius:8,border:"1.5px solid #fde047",background:"#fefce8",color:"#a16207",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>
                      ↺ Reset to Default
                    </button>
                  )}
                  <button onClick={()=>{setEditing(true);setDraft(currentMsg);}} style={{ padding:"8px 18px",borderRadius:8,border:"1.5px solid #c7d2fe",background:"#eef2ff",color:"#6366f1",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>
                    ✏️ {currentMsg ? "Edit" : "Write"}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={()=>{setEditing(false);onSave(selectedDay,draft);}} style={{ padding:"8px 18px",borderRadius:8,border:"none",background:"#22c55e",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>💾 Save</button>
                  <button onClick={()=>setEditing(false)} style={{ padding:"8px 18px",borderRadius:8,border:"1.5px solid #e2e8f0",background:"#fff",color:"#64748b",fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>Cancel</button>
                </>
              )}
            </div>
          </div>

          {editing ? (
            <textarea
              value={draft}
              onChange={e=>setDraft(e.target.value)}
              rows={12}
              autoFocus
              placeholder={`Write your Day ${selectedDay} message here...\n\nThis is just for you to store and copy.`}
              style={{
                width:"100%",padding:"16px",border:"2px solid #c7d2fe",
                borderRadius:14,fontSize:14,color:"#1e293b",outline:"none",
                resize:"vertical",fontFamily:"inherit",boxSizing:"border-box",
                lineHeight:1.7,background:"#fff",
              }}
              onFocus={e=>e.target.style.borderColor="#6366f1"}
              onBlur={e=>e.target.style.borderColor="#c7d2fe"}
            />
          ) : currentMsg ? (
            <div style={{ background:"#f8faff",borderRadius:14,border:"1.5px solid #e0e7ff",overflow:"hidden" }}>
              <pre style={{ margin:0,padding:"20px",fontSize:14,color:"#374151",whiteSpace:"pre-wrap",fontFamily:"inherit",lineHeight:1.8,background:"#fff",userSelect:"all" }}>
                {currentMsg}
              </pre>
            </div>
          ) : (
            <div style={{
              textAlign:"center",padding:"60px 24px",
              background:"#fafbff",borderRadius:14,border:"2px dashed #e0e7ff",
            }}>
              <div style={{ fontSize:40,marginBottom:12 }}>📝</div>
              <div style={{ fontSize:15,color:"#64748b",marginBottom:8 }}>No message saved for Day {selectedDay}</div>
              <button onClick={()=>{setEditing(true);setDraft("");}} style={{
                padding:"10px 24px",borderRadius:9,border:"none",
                background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
                color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",
                boxShadow:"0 4px 16px #6366f133",
              }}>
                ✏️ Write Message
              </button>
            </div>
          )}
          </>)}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════ FAQ PDF PANEL ══════════════════════════════ */
function FAQPanel({ isAdmin, showToast }) {
  const [pdfs, setPdfs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("faq_pdfs").select("*").order("uploaded_at", { ascending: false });
    if (error) { console.error("faq_pdfs load:", error); setLoading(false); return; }
    setPdfs(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("faq-pdfs-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "faq_pdfs" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of files) {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        showToast && showToast("error", `${file.name} is not a PDF`);
        continue;
      }
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("faq-docs").upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) {
        console.error("upload:", upErr);
        showToast && showToast("error", `Upload failed: ${upErr.message}`);
        continue;
      }
      const { data: { publicUrl } } = supabase.storage.from("faq-docs").getPublicUrl(path);
      const { error: dbErr } = await supabase.from("faq_pdfs").insert({
        file_name: file.name,
        file_url: publicUrl,
        storage_path: path,
      });
      if (dbErr) {
        console.error("insert:", dbErr);
        showToast && showToast("error", `Save failed: ${dbErr.message}`);
        // Best-effort cleanup of orphaned file
        await supabase.storage.from("faq-docs").remove([path]);
        continue;
      }
    }
    setUploading(false);
    showToast && showToast("success", "PDF uploaded!");
  };

  const handleDelete = async (pdf) => {
    if (!confirm(`Delete "${pdf.file_name}"?`)) return;
    // Derive storage path: prefer stored column, else parse URL
    const path = pdf.storage_path || (pdf.file_url.match(/\/faq-docs\/(.+)$/)?.[1]);
    if (path) await supabase.storage.from("faq-docs").remove([path]);
    const { error } = await supabase.from("faq_pdfs").delete().eq("id", pdf.id);
    if (error) { showToast && showToast("error", `Delete failed: ${error.message}`); return; }
    showToast && showToast("success", "PDF deleted");
  };

  const formatDate = (iso) => {
    try { return new Date(iso).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }); }
    catch { return iso; }
  };

  return (
    <div>
      <div style={{ marginBottom:14,padding:"10px 14px",borderRadius:10,fontSize:12,fontWeight:600,lineHeight:1.5,
        background:"#f0f9ff",color:"#0369a1",border:"1.5px solid #bae6fd" }}>
        📄 FAQ documents — {isAdmin ? "upload PDFs that every employee can download." : "download reference PDFs uploaded by admin."}
      </div>

      {/* Admin upload area */}
      {isAdmin && (
        <label style={{
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
          padding:"28px 20px",marginBottom:18,cursor: uploading ? "wait" : "pointer",gap:8,
          border:"2px dashed #bae6fd",borderRadius:14,background: uploading ? "#eef2ff" : "#f0f9ff",
          transition:"all 0.2s",
        }}>
          <div style={{ fontSize:32 }}>{uploading ? "⏳" : "📤"}</div>
          <div style={{ fontSize:14,fontWeight:700,color:"#0369a1" }}>
            {uploading ? "Uploading…" : "Click to upload PDF(s)"}
          </div>
          <div style={{ fontSize:11,color:"#64748b" }}>PDF files only · multiple allowed</div>
          <input
            type="file"
            accept="application/pdf,.pdf"
            multiple
            disabled={uploading}
            onChange={e => handleUpload(e.target.files)}
            style={{ display:"none" }}
          />
        </label>
      )}

      {/* List */}
      {loading ? (
        <div style={{ textAlign:"center",padding:40,color:"#94a3b8",fontSize:13 }}>Loading…</div>
      ) : pdfs.length === 0 ? (
        <div style={{ textAlign:"center",padding:"50px 20px",background:"#fafbff",borderRadius:14,border:"2px dashed #e0e7ff" }}>
          <div style={{ fontSize:40,marginBottom:10 }}>📂</div>
          <div style={{ fontSize:14,color:"#64748b",fontWeight:600 }}>No FAQ documents uploaded yet.</div>
        </div>
      ) : (
        <div style={{ border:"1.5px solid #e8eaf6",borderRadius:14,overflow:"hidden" }}>
          {pdfs.map((pdf, idx) => (
            <div key={pdf.id} style={{
              display:"flex",alignItems:"center",gap:12,padding:"14px 16px",
              background: idx % 2 === 0 ? "#fff" : "#fafbff",
              borderBottom: idx === pdfs.length - 1 ? "none" : "1px solid #f1f5f9",
            }}>
              <div style={{ width:38,height:38,borderRadius:10,background:"linear-gradient(135deg,#fef2f2,#fee2e2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>📕</div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:13,fontWeight:700,color:"#1e293b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }} title={pdf.file_name}>
                  {pdf.file_name}
                </div>
                <div style={{ fontSize:11,color:"#94a3b8",marginTop:2 }}>
                  Uploaded {formatDate(pdf.uploaded_at)}
                </div>
              </div>
              <a
                href={pdf.file_url}
                download={pdf.file_name}
                target="_blank"
                rel="noopener noreferrer"
                style={{ padding:"7px 14px",borderRadius:8,background:"linear-gradient(135deg,#0ea5e9,#06b6d4)",color:"#fff",fontWeight:700,fontSize:12,textDecoration:"none",fontFamily:"inherit",boxShadow:"0 3px 10px #0ea5e933" }}
              >
                ⬇ Download
              </a>
              {isAdmin && (
                <button onClick={()=>handleDelete(pdf)} style={{ padding:"7px 10px",borderRadius:8,border:"1.5px solid #fecaca",background:"#fff1f2",color:"#be123c",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>
                  🗑
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Delete Confirm ─── */
function DeleteConfirmModal({ trainee, onConfirm, onClose }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"#0009",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center" }} onClick={onClose}>
      <div style={{ background:"#fff",borderRadius:20,padding:36,width:400,maxWidth:"92vw",boxShadow:"0 25px 60px #ef444433",fontFamily:"'DM Sans',sans-serif",border:"2px solid #fecaca" }} onClick={e=>e.stopPropagation()}>
        <div style={{ textAlign:"center",marginBottom:20 }}>
          <div style={{ fontSize:48,marginBottom:8 }}>🗑️</div>
          <h2 style={{ margin:"0 0 8px",fontSize:20,fontWeight:800,color:"#1e293b",fontFamily:"'Sora',sans-serif" }}>Delete Trainee?</h2>
          <p style={{ margin:0,fontSize:14,color:"#64748b",lineHeight:1.6 }}>You are about to permanently delete <strong style={{ color:"#ef4444" }}>{trainee.name}</strong>.<br/>All their progress and notes will be lost.</p>
        </div>
        <div style={{ display:"flex",gap:12,marginTop:24 }}>
          <button onClick={onClose} style={{ flex:1,padding:"11px",borderRadius:10,border:"2px solid #e2e8f0",background:"#fff",color:"#64748b",fontWeight:700,cursor:"pointer",fontSize:14,fontFamily:"inherit" }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex:1,padding:"11px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#ef4444,#dc2626)",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:14,boxShadow:"0 4px 16px #ef444444",fontFamily:"inherit" }}>Yes, Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Leaved Reason Modal ─── */
function LeavedReasonModal({ trainee, onConfirm, onClose }) {
  const [reason, setReason] = useState("");
  return (
    <div style={{ position:"fixed",inset:0,background:"#0008",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }} onClick={onClose}>
      <div style={{ background:"#fff",borderRadius:20,padding:36,width:480,maxWidth:"95vw",boxShadow:"0 25px 60px #be123c33",fontFamily:"'DM Sans',sans-serif",border:"2px solid #fecdd3" }} onClick={e=>e.stopPropagation()}>
        <div style={{ textAlign:"center",marginBottom:20 }}>
          <div style={{ fontSize:48,marginBottom:8 }}>🚪</div>
          <h2 style={{ margin:"0 0 8px",fontSize:20,fontWeight:800,color:"#1e293b",fontFamily:"'Sora',sans-serif" }}>Mark as Leaved</h2>
          <p style={{ margin:0,fontSize:14,color:"#64748b",lineHeight:1.6 }}>
            Moving <strong style={{ color:"#be123c" }}>{trainee.name}</strong> to Leaved section.<br/>Please provide a reason below.
          </p>
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={{ display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:8 }}>📝 Reason for leaving</label>
          <textarea
            value={reason}
            onChange={e=>setReason(e.target.value)}
            rows={4}
            autoFocus
            placeholder="e.g. Personal reasons, got another job, health issues, lost interest, relocated..."
            style={{
              width:"100%",padding:"14px",border:"2px solid #fecdd3",
              borderRadius:12,fontSize:14,color:"#1e293b",outline:"none",
              resize:"vertical",fontFamily:"inherit",boxSizing:"border-box",
              lineHeight:1.7,background:"#fff1f2",
            }}
            onFocus={e=>e.target.style.borderColor="#f43f5e"}
            onBlur={e=>e.target.style.borderColor="#fecdd3"}
          />
        </div>
        <div style={{ display:"flex",gap:12 }}>
          <button onClick={onClose} style={{ flex:1,padding:"11px",borderRadius:10,border:"2px solid #e2e8f0",background:"#fff",color:"#64748b",fontWeight:700,cursor:"pointer",fontSize:14,fontFamily:"inherit" }}>Cancel</button>
          <button
            onClick={()=>{ if(reason.trim()) onConfirm(reason.trim()); }}
            style={{
              flex:2,padding:"11px",borderRadius:10,border:"none",
              background: reason.trim() ? "linear-gradient(135deg,#be123c,#e11d48)" : "#e2e8f0",
              color: reason.trim() ? "#fff" : "#94a3b8",
              fontWeight:700,cursor: reason.trim() ? "pointer" : "not-allowed",
              fontSize:14,fontFamily:"inherit",
              boxShadow: reason.trim() ? "0 4px 16px #be123c44" : "none",
              transition:"all 0.2s",
            }}
          >🚪 Confirm Leaved</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Outcome Modal — shown when all 11 phases become complete ─── */
function OutcomeModal({ trainee, onPick, onClose }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"#0009",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }} onClick={onClose}>
      <div
        style={{ background:"#fff",borderRadius:22,padding:40,width:520,maxWidth:"95vw",boxShadow:"0 28px 80px #0004",fontFamily:"'DM Sans',sans-serif",border:"2px solid #fde68a",animation:"popIn 0.25s ease" }}
        onClick={e=>e.stopPropagation()}
      >
        <style>{`@keyframes popIn{from{transform:scale(0.92);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
        <div style={{ textAlign:"center",marginBottom:24 }}>
          <div style={{ fontSize:54,marginBottom:10 }}>🎉</div>
          <h2 style={{ margin:"0 0 10px",fontSize:22,fontWeight:800,color:"#1e293b",fontFamily:"'Sora',sans-serif",lineHeight:1.3 }}>
            {trainee.name} has completed<br/>all stages!
          </h2>
          <p style={{ margin:0,fontSize:14,color:"#64748b",lineHeight:1.6 }}>
            What's the final result?
          </p>
        </div>
        <div style={{ display:"flex",gap:12,marginBottom:14 }}>
          <button
            onClick={()=>onPick("Selected")}
            style={{ flex:1,padding:"14px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#0d9488,#14b8a6)",color:"#fff",fontWeight:800,cursor:"pointer",fontSize:15,fontFamily:"inherit",boxShadow:"0 6px 20px #0d948844",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}
          >✅ Selected</button>
          <button
            onClick={()=>onPick("Not Selected")}
            style={{ flex:1,padding:"14px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#d97706,#f59e0b)",color:"#fff",fontWeight:800,cursor:"pointer",fontSize:15,fontFamily:"inherit",boxShadow:"0 6px 20px #d9770644",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}
          >❌ Not Selected</button>
        </div>
        <button
          onClick={onClose}
          style={{ width:"100%",padding:"10px",borderRadius:10,border:"1.5px solid #fde68a",background:"#fefce8",color:"#a16207",fontWeight:700,cursor:"pointer",fontSize:13,fontFamily:"inherit" }}
        >⏳ Decide Later (keep as Pending)</button>
      </div>
    </div>
  );
}

/* ─── STAT CARDS ─── */
const STAT_CARDS = [
  { key:"total",        label:"Total Trainees", color:"#6366f1", bg:"linear-gradient(135deg,#eef2ff,#e0e7ff)", icon:"👥" },
  { key:"Pending",      label:"Pending",        color:"#ca8a04", bg:"linear-gradient(135deg,#fefce8,#fef9c3)", icon:"⏳" },
  { key:"Selected",     label:"Selected",       color:"#0d9488", bg:"linear-gradient(135deg,#f0fdfa,#ccfbf1)", icon:"✅" },
  { key:"Not Selected", label:"Not Selected",   color:"#d97706", bg:"linear-gradient(135deg,#fffbeb,#fef3c7)", icon:"❌" },
  { key:"Leaved",       label:"Leaved",         color:"#be123c", bg:"linear-gradient(135deg,#fff1f2,#ffe4e6)", icon:"🚪" },
];

const thStyle = { fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.04em" };

/* ══════════════════════════════ LOGIN PAGE ══════════════════════════════ */
function LoginPage({ onLogin, error, busy }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const submit = (e) => { e.preventDefault(); if (email && password) onLogin(email, password); };
  return (
    <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(160deg,#f8faff 0%,#f0f4ff 50%,#faf5ff 100%)",fontFamily:"'DM Sans','Segoe UI',sans-serif",padding:20 }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
      <form onSubmit={submit} style={{ background:"#fff",borderRadius:24,padding:44,width:440,maxWidth:"95vw",boxShadow:"0 28px 80px #6366f122",border:"1.5px solid #e0e7ff" }}>
        <div style={{ textAlign:"center",marginBottom:28 }}>
          <div style={{ width:60,height:60,margin:"0 auto 14px",borderRadius:16,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,boxShadow:"0 8px 24px #6366f144" }}>🎓</div>
          <h1 style={{ margin:0,fontSize:26,fontWeight:800,color:"#1e293b",fontFamily:"'Sora',sans-serif" }}>TrainFlow <span style={{ color:"#6366f1" }}>Pro</span></h1>
          <p style={{ margin:"6px 0 0",fontSize:14,color:"#94a3b8" }}>Sign in to continue</p>
        </div>
        <div style={{ marginBottom:14 }}>
          <label htmlFor="tf-login-email" style={{ display:"block",fontSize:13,fontWeight:600,color:"#475569",marginBottom:6 }}>Email</label>
          <input
            id="tf-login-email"
            name="email"
            type="email"
            autoComplete="username"
            inputMode="email"
            required
            autoFocus
            value={email}
            onChange={e=>setEmail(e.target.value)}
            placeholder="you@company.com"
            style={{ width:"100%",padding:"11px 44px 11px 14px",border:"2px solid #e2e8f0",borderRadius:11,fontSize:14,color:"#1e293b",outline:"none",boxSizing:"border-box",fontFamily:"inherit" }}
          />
        </div>
        <div style={{ marginBottom:18 }}>
          <label htmlFor="tf-login-pw" style={{ display:"block",fontSize:13,fontWeight:600,color:"#475569",marginBottom:6 }}>Password</label>
          <input
            id="tf-login-pw"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={e=>setPassword(e.target.value)}
            placeholder="••••••••"
            style={{ width:"100%",padding:"11px 44px 11px 14px",border:"2px solid #e2e8f0",borderRadius:11,fontSize:14,color:"#1e293b",outline:"none",boxSizing:"border-box",fontFamily:"inherit" }}
          />
        </div>
        {error && (
          <div style={{ marginBottom:14,padding:"10px 14px",background:"#fef2f2",border:"1.5px solid #fecaca",borderRadius:10,color:"#dc2626",fontSize:13,fontWeight:600 }}>
            ⚠ {error}
          </div>
        )}
        <button type="submit" disabled={busy} style={{
          width:"100%",padding:"12px",borderRadius:11,border:"none",
          background: busy ? "#cbd5e1" : "linear-gradient(135deg,#6366f1,#8b5cf6)",
          color:"#fff",fontWeight:800,fontSize:14,cursor: busy ? "not-allowed" : "pointer",
          fontFamily:"inherit",boxShadow: busy ? "none" : "0 6px 22px #6366f144",transition:"all 0.2s",
        }}>{busy ? "Signing in…" : "Login"}</button>
        <div style={{ marginTop:18,fontSize:11,color:"#94a3b8",textAlign:"center",lineHeight:1.6 }}>
          Access controlled by your admin. Contact them if you cannot sign in.
        </div>
      </form>
    </div>
  );
}

/* ══════════════════════════════ BANNED SCREEN ══════════════════════════════ */
function BannedScreen({ onLogout }) {
  return (
    <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(160deg,#fff1f2 0%,#ffe4e6 100%)",fontFamily:"'DM Sans',sans-serif",padding:20 }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
      <div style={{ background:"#fff",borderRadius:22,padding:44,width:440,maxWidth:"95vw",boxShadow:"0 24px 60px #be123c22",border:"2px solid #fecdd3",textAlign:"center" }}>
        <div style={{ fontSize:54,marginBottom:14 }}>🚫</div>
        <h1 style={{ margin:"0 0 10px",fontSize:22,fontWeight:800,color:"#be123c",fontFamily:"'Sora',sans-serif" }}>Access Revoked</h1>
        <p style={{ margin:"0 0 22px",fontSize:14,color:"#64748b",lineHeight:1.6 }}>
          Your access has been revoked.<br/>Contact your admin.
        </p>
        <button onClick={onLogout} style={{
          padding:"11px 28px",borderRadius:11,border:"none",
          background:"linear-gradient(135deg,#be123c,#e11d48)",color:"#fff",
          fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 6px 22px #be123c44",
        }}>Log out</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════ ADMIN PANEL ══════════════════════════════ */
function AdminPanel({ currentUserId, onClose, showToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: true });
      if (error) { console.error(error); showToast("error", `Load failed: ${error.message}`); }
      else setUsers(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const toggleBan = async (u) => {
    const newVal = !u.is_banned;
    setUsers(us => us.map(x => x.id === u.id ? { ...x, is_banned: newVal } : x));
    const { error } = await supabase.from("profiles").update({ is_banned: newVal }).eq("id", u.id);
    if (error) {
      console.error(error);
      showToast("error", `Save failed: ${error.message}`);
      setUsers(us => us.map(x => x.id === u.id ? { ...x, is_banned: !newVal } : x));
    } else {
      showToast("success", newVal ? `${u.email} banned` : `${u.email} unbanned`);
    }
  };

  const changeRole = async (u, newRole) => {
    setUsers(us => us.map(x => x.id === u.id ? { ...x, role: newRole } : x));
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", u.id);
    if (error) {
      console.error(error);
      showToast("error", `Save failed: ${error.message}`);
      setUsers(us => us.map(x => x.id === u.id ? { ...x, role: u.role } : x));
    } else {
      showToast("success", `${u.email} → ${newRole}`);
    }
  };

  return (
    <div style={{ position:"fixed",inset:0,background:"#0009",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }} onClick={onClose}>
      <div style={{ width:780,maxWidth:"97vw",maxHeight:"90vh",background:"#fff",borderRadius:20,boxShadow:"0 32px 80px #0004",display:"flex",flexDirection:"column",fontFamily:"'DM Sans',sans-serif",overflow:"hidden" }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:"20px 26px",borderBottom:"2px solid #e0e7ff",background:"linear-gradient(135deg,#eef2ff,#ede9fe)",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div>
            <div style={{ fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:19,color:"#1e293b" }}>👥 User Management</div>
            <div style={{ fontSize:12,color:"#6366f1",fontWeight:600,marginTop:2 }}>Manage roles and access for all users</div>
          </div>
          <button onClick={onClose} style={{ width:34,height:34,borderRadius:8,border:"none",background:"#fff",cursor:"pointer",fontSize:18,color:"#64748b",boxShadow:"0 2px 8px #0001" }}>×</button>
        </div>

        <div style={{ flex:1,overflowY:"auto",padding:24 }}>
          {loading ? (
            <div style={{ textAlign:"center",padding:40,color:"#94a3b8" }}>Loading users…</div>
          ) : users.length === 0 ? (
            <div style={{ textAlign:"center",padding:40,color:"#94a3b8" }}>No users yet.</div>
          ) : (
            <div style={{ border:"1.5px solid #e8eaf6",borderRadius:14,overflow:"hidden" }}>
              <div style={{ display:"grid",gridTemplateColumns:"2fr 2fr 130px 130px",padding:"12px 16px",background:"#fafbff",borderBottom:"2px solid #e8eaf6",gap:10 }}>
                <div style={thStyle}>Name</div>
                <div style={thStyle}>Email</div>
                <div style={{ ...thStyle,textAlign:"center" }}>Role</div>
                <div style={{ ...thStyle,textAlign:"center" }}>Status</div>
              </div>
              {users.map((u,idx) => {
                const isSelf = u.id === currentUserId;
                return (
                  <div key={u.id} style={{
                    display:"grid",gridTemplateColumns:"2fr 2fr 130px 130px",
                    padding:"13px 16px",gap:10,alignItems:"center",
                    background: idx%2===0 ? "#fff" : "#fafbff",
                    borderBottom:"1px solid #f1f5f9",
                    opacity: u.is_banned ? 0.6 : 1,
                  }}>
                    <div style={{ fontSize:13,fontWeight:600,color:"#1e293b",display:"flex",alignItems:"center",gap:6 }}>
                      {u.name || u.email?.split("@")[0] || "—"}
                      {isSelf && <span style={{ fontSize:10,fontWeight:700,color:"#6366f1",background:"#eef2ff",padding:"1px 7px",borderRadius:99 }}>you</span>}
                    </div>
                    <div style={{ fontSize:12,color:"#64748b" }}>{u.email}</div>
                    <div style={{ textAlign:"center" }}>
                      <select
                        value={u.role || "employee"}
                        disabled={isSelf}
                        onChange={e=>changeRole(u, e.target.value)}
                        style={{
                          padding:"5px 10px",borderRadius:7,fontSize:11,fontWeight:700,cursor:isSelf?"not-allowed":"pointer",outline:"none",fontFamily:"inherit",
                          background: u.role === "admin" ? "#eef2ff" : "#f0fdf4",
                          color:    u.role === "admin" ? "#6366f1" : "#059669",
                          border: `1.5px solid ${u.role === "admin" ? "#c7d2fe" : "#bbf7d0"}`,
                        }}>
                        <option value="admin">admin</option>
                        <option value="employee">employee</option>
                      </select>
                    </div>
                    <div style={{ textAlign:"center" }}>
                      <button
                        onClick={()=>toggleBan(u)}
                        disabled={isSelf}
                        style={{
                          padding:"5px 14px",borderRadius:7,fontSize:11,fontWeight:700,border:"none",cursor:isSelf?"not-allowed":"pointer",fontFamily:"inherit",
                          background: u.is_banned ? "linear-gradient(135deg,#ef4444,#dc2626)" : "linear-gradient(135deg,#22c55e,#16a34a)",
                          color:"#fff",opacity: isSelf ? 0.5 : 1,
                        }}>{u.is_banned ? "🚫 Banned" : "✅ Active"}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ padding:"14px 26px",borderTop:"1.5px solid #e8eaf6",background:"#fafbff",fontSize:11,color:"#94a3b8",lineHeight:1.6 }}>
          💡 New users: create their account in <strong>Supabase Dashboard → Authentication → Users</strong>. A profile row is created automatically on first login (as <em>employee</em>), then you can promote them here.
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════ MAIN PORTAL ═══════════════════════════════ */
function TraineePortal({ profile, onLogout }) {
  const isAdmin = profile?.role === "admin";

  const [trainees, setTrainees]   = useState([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [showAdd,        setShowAdd]        = useState(false);
  const [showMessages,   setShowMessages]   = useState(false);
  const [notesModal,     setNotesModal]     = useState(null);   // trainee object
  const [deleteConfirm,  setDeleteConfirm]  = useState(null);   // trainee id
  const [filterName,     setFilterName]     = useState("All");
  const [filterStatus,   setFilterStatus]   = useState("All");
  const [filterOnboarder, setFilterOnboarder] = useState("All");
  const [search,         setSearch]         = useState("");
  const [selectedRows,   setSelectedRows]   = useState(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [showSelected,     setShowSelected]     = useState(false);
  const [showNotSelected,  setShowNotSelected]  = useState(false);
  const [showLeaved,       setShowLeaved]       = useState(false);
  const [showPending,      setShowPending]      = useState(true); // open by default so users see who's awaiting a decision
  const [leavedModal,      setLeavedModal]      = useState(null); // { id, name } — trainee being moved to Leaved
  const [outcomeModal,     setOutcomeModal]     = useState(null); // { id, name } — trainee awaiting outcome decision
  const [showAdminPanel,   setShowAdminPanel]   = useState(false); // admin-only user management modal
  const [toast,            setToast]            = useState(null); // { type:"success"|"error", msg }
  const pendingSaves = useRef(new Set()); // IDs currently mid-save — blocks real-time bounce-back
  const DEFAULT_MESSAGES = {
    intro:"Hi {name}! 👋 Welcome to the DMH Sales Training Program!\n\nWe're excited to have you on board. Here's a quick intro to what the program looks like:\n\n📌 This is a structured 8-day training.\n✅ Each day has specific tasks you need to complete.\n💬 I'll be messaging you daily with your tasks.\n🔓 Each phase unlocks after the previous one is done.\n\nGet ready — let's build something great together! 🚀",
    1:"Hi {name}! 👋 Welcome to Day 1 of the Sales Training Program. Today your tasks are:\n1️⃣ Build your Shopify Store\n2️⃣ Build your Anti-Gravity Website\n3️⃣ Watch the Day 1 Videos\n\nLet me know once done! 💪",
    2:"Hi {name}! 🎤 It's Day 2 — Interview Day!\n\nYour interview is scheduled. Please be prepared and confident. We believe in you!\n\nAll the best! 🌟",
    3:"Hi {name}! 📊 Day 3 — Client Chat Analysis Part 1.\n\nStudy the provided client chat examples carefully. Note the tone, language, and approach used.\n\nShare your analysis when ready! ✅",
    4:"Hi {name}! 💬 Day 4 — Client Chat Analysis Part 2.\n\nComplete the second part of the chat analysis and submit your findings.\n\nYou are doing great! 🔥",
    5:"Hi {name}! 🛍️ Day 5 — Shopify Theme Research.\n\nResearch and document the best Shopify themes for different niches.\n\nSend your research report today! 📋",
    7:"Hi {name}! 🖼️ Day 7 — Portfolio Store Review.\n\nReview your portfolio store and make any final improvements.\n\nShare the link when done! 🔗",
    8:"Hi {name}! 🏆 Final Test Time!\n\nYou need to score 80%+ to pass. Take your time and trust your training.\n\nGood luck! 🎯",
  };
  const [dayMessages,  setDayMessages]  = useState(DEFAULT_MESSAGES);
  const [personalTabs, setPersonalTabs] = useState(new Set()); // tab keys where this user has a personal override
  const masterRef   = useRef({}); // { tab(string): content } — admin master copies
  const personalRef = useRef({}); // { tab(string): content } — current user's personal overrides

  // Normalize "1" → 1 but keep "intro" as "intro"
  const normKey = (k) => (k === null || k === undefined) ? k : (isNaN(k) ? k : Number(k));

  const recomputeDayMessages = () => {
    const merged = { ...DEFAULT_MESSAGES };
    Object.entries(masterRef.current).forEach(([k, v])   => { merged[normKey(k)] = v; });
    Object.entries(personalRef.current).forEach(([k, v]) => { merged[normKey(k)] = v; }); // personal wins
    setDayMessages(merged);
    setPersonalTabs(new Set(Object.keys(personalRef.current)));
  };

  // ── Helper: map a DB row → app trainee object ──
  const rowToTrainee = (t) => {
    // Build phaseNotes from dedicated remark columns; fall back to JSONB for rows
    // that predate the column migration, so no existing remark is ever lost.
    const phaseNotes = { ...EMPTY_PHASE_NOTES };
    PHASES.forEach(p => {
      const col = PHASE_REMARK_COL[p.key];
      phaseNotes[p.key] = t[col] || t.phase_notes?.[p.key] || "";
    });
    return {
      ...t,
      phases:     { ...EMPTY_PHASES, ...(t.phases || {}) },
      phaseNotes,
      notes:            t.notes || "",
      certificateImage: t.certificate_image || "",
      certificateText:  t.certificate_text  || "",
      leavedReason:     t.leaved_reason || "",
      leavedDate:       t.leaved_date   || "",
      onboarder:        t.onboarder || "",
    };
  };

  // ── Load data from Supabase on mount ──
  // Supabase is the ONLY source of truth. No local fallback, no seed inserts.
  useEffect(() => {
    const load = async () => {
      setDbLoading(true);
      try {
        // .limit(10000) bypasses the default PostgREST 1000-row cap
        const [{ data: tData }, { data: mData }] = await Promise.all([
          supabase.from("trainees").select("*").order("created_at", { ascending: true }).limit(10000),
          supabase.from("day_messages").select("*"),
        ]);

        // Trainees: read from Supabase only — empty DB = empty list
        setTrainees((tData || []).map(rowToTrainee));

        // Day messages: new schema → { user_id, tab, content, is_master }
        // If an older schema row slips through (day_key/message), ignore it silently.
        if (mData && mData.length > 0) {
          // Sort newest-first so the latest master wins if multiple admins saved
          const sorted = [...mData].sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
          sorted.forEach(r => {
            const tab = r.tab; if (!tab) return;
            if (r.is_master) {
              if (!masterRef.current[tab]) masterRef.current[tab] = r.content;
            } else if (r.user_id === profile?.id) {
              personalRef.current[tab] = r.content;
            }
          });
          recomputeDayMessages();
        }
      } catch (e) { console.error("Supabase load error:", e); }
      setDbLoading(false);
    };
    load();
  }, []);

  // ── Helper: convert trainee object → DB row ──
  const traineeToRow = (t) => {
    const row = {
      id:                t.id,
      name:              t.name,
      contact:           t.contact,
      status:            t.status,
      enroll_date:       t.enrollDate || t.enroll_date || "",
      notes:             t.notes || "",
      phases:            t.phases || {},
      phase_notes:       t.phaseNotes || {},
      certificate_image: t.certificateImage || "",
      certificate_text:  t.certificateText  || "",
      leaved_reason:     t.leavedReason || "",
      leaved_date:       t.leavedDate   || "",
      onboarder:         t.onboarder || "",
      // Preserve ownership — fall back to current user's id on first save (new trainee)
      created_by:        t.created_by || profile?.id || null,
    };
    // Write every phase remark into its own dedicated column
    PHASES.forEach(p => { row[PHASE_REMARK_COL[p.key]] = t.phaseNotes?.[p.key] || ""; });
    return row;
  };

  // ── Toast helpers ──
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 2500);
  };

  // ── Immediate per-action save helpers ──
  const saveTrainee = async (trainee) => {
    pendingSaves.current.add(trainee.id);
    try {
      const { error } = await supabase.from("trainees").upsert(traineeToRow(trainee));
      if (error) {
        console.error("saveTrainee error:", error.message, error.details, error.hint, traineeToRow(trainee));
        showToast("error", `Save failed: ${error.message || "check connection"}`);
      } else {
        showToast("success", "Saved to server!");
      }
    } finally {
      pendingSaves.current.delete(trainee.id);
    }
  };

  // Admin → upsert the global master for this tab (only 1 master per tab exists,
  //         enforced by partial unique index; we delete-then-insert to reassign ownership).
  // Employee → upsert their own personal copy; master is untouched.
  const saveDayMessage = async (key, value) => {
    if (!profile?.id) { showToast("error", "Not signed in"); return; }
    const tab = String(key);

    if (isAdmin) {
      // Remove any existing master row for this tab (regardless of which admin authored it)
      await supabase.from("day_messages").delete().eq("tab", tab).eq("is_master", true);
      const { error } = await supabase.from("day_messages").insert({
        user_id: profile.id, tab, content: value, is_master: true, updated_at: new Date().toISOString(),
      });
      if (error) {
        console.error("saveDayMessage (admin) error:", error);
        showToast("error", `Save failed: ${error.message || "check connection"}`);
        return;
      }
      masterRef.current[tab] = value;
    } else {
      const { error } = await supabase.from("day_messages").upsert({
        user_id: profile.id, tab, content: value, is_master: false, updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,tab" });
      if (error) {
        console.error("saveDayMessage (employee) error:", error);
        showToast("error", `Save failed: ${error.message || "check connection"}`);
        return;
      }
      personalRef.current[tab] = value;
    }
    recomputeDayMessages();
    showToast("success", "Saved to server!");
  };

  // Employee: delete personal copy → fall back to master
  const resetDayMessage = async (key) => {
    if (!profile?.id) return;
    const tab = String(key);
    const { error } = await supabase.from("day_messages")
      .delete()
      .eq("user_id", profile.id).eq("tab", tab).eq("is_master", false);
    if (error) {
      console.error("resetDayMessage error:", error);
      showToast("error", `Reset failed: ${error.message || "check connection"}`);
      return;
    }
    delete personalRef.current[tab];
    recomputeDayMessages();
    showToast("success", "Reverted to default");
  };

  // ── Real-time subscriptions — reflect changes from ANY device instantly ──
  useEffect(() => {
    const channel = supabase
      .channel("trainflow-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trainees" },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const r = payload.new;
            // Skip if this tab is mid-save for this row — we already have the latest state
            if (pendingSaves.current.has(r.id)) return;
            // Visibility: employees only see/react to rows they own
            if (!isAdmin && r.created_by && r.created_by !== profile?.id) return;
            const mapped = {
              ...r,
              phases:     { ...EMPTY_PHASES,      ...(r.phases      || {}) },
              phaseNotes: { ...EMPTY_PHASE_NOTES,  ...(r.phase_notes || {}) },
              notes:      r.notes || "",
              certificateImage: r.certificate_image || "",
              certificateText:  r.certificate_text  || "",
              leavedReason: r.leaved_reason || "",
              leavedDate:   r.leaved_date   || "",
            };
            setTrainees(ts => {
              const exists = ts.some(t => t.id === mapped.id);
              if (exists) return ts.map(t => t.id === mapped.id ? { ...t, ...mapped } : t);
              return [...ts, mapped];
            });
          } else if (payload.eventType === "DELETE") {
            setTrainees(ts => ts.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "day_messages" },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const r = payload.new;
            if (!r?.tab) return;
            if (r.is_master) {
              masterRef.current[r.tab] = r.content;
            } else if (r.user_id === profile?.id) {
              personalRef.current[r.tab] = r.content;
            } else {
              return; // someone else's personal copy — RLS should already filter this out
            }
            recomputeDayMessages();
          } else if (payload.eventType === "DELETE") {
            const r = payload.old;
            if (!r?.tab) return;
            if (r.is_master) delete masterRef.current[r.tab];
            else if (r.user_id === profile?.id) delete personalRef.current[r.tab];
            else return;
            recomputeDayMessages();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []); // subscribe once on mount

  const stats = useMemo(() => {
    const c={total:trainees.length}; STATUSES.forEach(s=>{c[s]=trainees.filter(t=>t.status===s).length;}); return c;
  }, [trainees]);

  const filtered = useMemo(() => trainees.filter(t => {
    if (filterName!=="All" && t.name!==filterName) return false;
    if (filterStatus!=="All" && t.status!==filterStatus) return false;
    if (filterOnboarder!=="All" && t.onboarder!==filterOnboarder) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [trainees, filterName, filterStatus, filterOnboarder, search]);

  const activeTrainees      = useMemo(() => {
    // If the user explicitly filters by a bottom-section status (Pending / Selected /
    // Not Selected / Leaved), surface those trainees in the main table instead of hiding them.
    if (BOTTOM_SECTION_STATUSES.includes(filterStatus)) return filtered;
    return filtered.filter(t => !BOTTOM_SECTION_STATUSES.includes(t.status));
  }, [filtered, filterStatus]);
  const pendingTrainees     = useMemo(() => filtered.filter(t => t.status === "Pending"), [filtered]);
  const selectedTrainees    = useMemo(() => filtered.filter(t => t.status === "Selected"), [filtered]);
  const notSelectedTrainees = useMemo(() => filtered.filter(t => t.status === "Not Selected"), [filtered]);
  const leavedTrainees      = useMemo(() => filtered.filter(t => t.status === "Leaved"), [filtered]);

  const updatePhase = (id, key, val) => {
    const t = trainees.find(t => t.id === id); if (!t) return;
    const newPhases = { ...t.phases, [key]: val };
    const allDone   = PHASES.every(p => newPhases[p.key]);
    let newStatus   = t.status;
    let triggerOutcome = false;
    if (t.status !== "Leaved" && t.status !== "Dropped") {
      // Just became fully complete and hasn't been resolved yet → Pending + open outcome modal
      if (allDone && !ALL_DONE_STATUSES.includes(t.status)) {
        newStatus = "Pending";
        triggerOutcome = true;
      }
      // Reverted from a terminal/Pending state by unchecking → back to In Progress
      if (!allDone && ALL_DONE_STATUSES.includes(t.status)) newStatus = "In Progress";
    }
    const updated = { ...t, phases: newPhases, status: newStatus };
    setTrainees(ts => ts.map(tr => tr.id === id ? updated : tr));
    saveTrainee(updated);
    if (triggerOutcome) setOutcomeModal({ id, name: t.name });
  };

  const addTrainee = (data) => {
    const newT = { ...data, id: Date.now(), created_by: profile?.id };
    setTrainees(ts => [...ts, newT]);
    saveTrainee(newT);
  };

  const deleteTrainee = async (id) => {
    setTrainees(ts => ts.filter(t => t.id !== id));
    setDeleteConfirm(null);
    const { error } = await supabase.from("trainees").delete().eq("id", id);
    if (error) showToast("error", "Delete failed — check connection");
    else        showToast("success", "Deleted!");
  };

  const bulkDelete = async () => {
    const ids = [...selectedRows];
    setTrainees(ts => ts.filter(t => !selectedRows.has(t.id)));
    setSelectedRows(new Set());
    setBulkDeleteConfirm(false);
    const { error } = await supabase.from("trainees").delete().in("id", ids);
    if (error) showToast("error", "Delete failed — check connection");
    else        showToast("success", `${ids.length} trainee${ids.length > 1 ? "s" : ""} deleted!`);
  };

  const updateTrainee = (id, updates) => {
    const t = trainees.find(tr => tr.id === id); if (!t) return;
    const merged = { ...t, ...updates };
    const allDone = PHASES.every(p => merged.phases[p.key]);
    let triggerOutcome = false;
    if (merged.status !== "Leaved" && merged.status !== "Dropped") {
      if (allDone && !ALL_DONE_STATUSES.includes(merged.status)) {
        merged.status = "Pending";
        triggerOutcome = true;
      }
      if (!allDone && ALL_DONE_STATUSES.includes(merged.status)) merged.status = "In Progress";
    }
    setTrainees(ts => ts.map(tr => tr.id === id ? merged : tr));
    saveTrainee(merged);
    if (triggerOutcome) setOutcomeModal({ id, name: merged.name });
  };

  const changeTraineeStatus = (id, newStatus) => {
    if (newStatus === "Leaved") {
      const t = trainees.find(t => t.id === id);
      setLeavedModal({ id, name: t?.name || "" });
      return;
    }
    const t = trainees.find(tr => tr.id === id); if (!t) return;
    const updated = { ...t, status: newStatus };
    setTrainees(ts => ts.map(tr => tr.id === id ? updated : tr));
    saveTrainee(updated);
  };

  const confirmLeaved = (id, reason) => {
    const t = trainees.find(tr => tr.id === id); if (!t) return;
    const updated = { ...t, status: "Leaved", leavedReason: reason, leavedDate: new Date().toISOString().slice(0,10) };
    setTrainees(ts => ts.map(tr => tr.id === id ? updated : tr));
    setLeavedModal(null);
    saveTrainee(updated);
  };

  // Called when user picks Selected / Not Selected in the outcome modal
  const confirmOutcome = (id, outcome /* "Selected" | "Not Selected" */) => {
    const t = trainees.find(tr => tr.id === id); if (!t) return;
    const updated = { ...t, status: outcome };
    setTrainees(ts => ts.map(tr => tr.id === id ? updated : tr));
    setOutcomeModal(null);
    saveTrainee(updated);
  };

  const changeOnboarder = async (id, newOnboarder) => {
    const t = trainees.find(tr => tr.id === id); if (!t) return;
    // Optimistic local update
    setTrainees(ts => ts.map(tr => tr.id === id ? { ...tr, onboarder: newOnboarder } : tr));
    // Surgical update — only touches the onboarder column, nothing else
    const { error } = await supabase
      .from("trainees")
      .update({ onboarder: newOnboarder })
      .eq("id", id);
    if (error) {
      console.error("changeOnboarder error:", error.message, error.details, error.hint, { id, newOnboarder });
      showToast("error", `Save failed: ${error.message || "check connection"}`);
      // Roll back optimistic update
      setTrainees(ts => ts.map(tr => tr.id === id ? { ...tr, onboarder: t.onboarder } : tr));
    } else {
      showToast("success", "Saved to server!");
    }
  };

  // ── Export to Excel (admin only) ──
  const exportToExcel = () => {
    const ORDER = ["Sarthak", "Archita", "Kritika"];
    const HEADER_COLORS = {
      Sarthak:    "6366F1", // indigo
      Archita:    "EC4899", // pink
      Kritika:    "10B981", // green
      Unassigned: "64748B", // slate
    };

    // Build ordered groups
    const groups = { Sarthak:[], Archita:[], Kritika:[], Unassigned:[] };
    trainees.forEach(t => {
      const k = ORDER.includes(t.onboarder) ? t.onboarder : (t.onboarder ? t.onboarder : "Unassigned");
      if (!groups[k]) groups[k] = [];
      groups[k].push(t);
    });

    // active → Pending → Selected → Not Selected → Leaved
    const outcomeOrder = (s) => {
      if (s === "Pending")      return 2;
      if (s === "Selected")     return 3;
      if (s === "Not Selected") return 4;
      if (s === "Leaved")       return 5;
      return 1; // active (anything else)
    };

    const columnHeaders = [
      "Name","Contact","Onboarder","Phase/Day","Status/Outcome","Enroll Date",
      "Shopify","A-Gravity","Videos","Certificate","Interview",
      "Chat P1","Chat P2","S. Theme","Branded","Portfolio","Final Test",
    ];

    const phaseKeys = [
      "shopifyStore","antiGravity","videosWatched","certificate","interviewPassed",
      "chatPart1","chatPart2","shopifyTheme","brandedStore","portfolioReview","finalTest",
    ];

    const rows = [columnHeaders];

    // Build ordered list of groups that actually contain trainees
    const activeGroups = [...ORDER, "Unassigned"].filter(k => (groups[k] && groups[k].length > 0));
    // Any extra custom onboarder names (employee names that aren't in ORDER)
    Object.keys(groups).forEach(k => {
      if (!activeGroups.includes(k) && groups[k].length > 0) activeGroups.push(k);
    });

    // Track section header row indices so we can style them after
    const sectionMeta = []; // { rowIndex, group }

    activeGroups.forEach(group => {
      const headerRow = new Array(columnHeaders.length).fill("");
      headerRow[0] = `── ${group} ──`;
      sectionMeta.push({ rowIndex: rows.length, group });
      rows.push(headerRow);

      const sorted = [...groups[group]].sort((a, b) => outcomeOrder(a.status) - outcomeOrder(b.status));
      sorted.forEach(t => {
        const phaseDay = getPhaseDay(t.phases);
        const done     = getCompletedCount(t.phases);
        rows.push([
          t.name || "",
          t.contact || "",
          t.onboarder || "",
          done === PHASES.length ? `Done (${done}/${PHASES.length})` : `Day ${phaseDay} (${done}/${PHASES.length})`,
          t.status || "",
          t.enrollDate || t.enroll_date || "",
          ...phaseKeys.map(k => t.phases?.[k] ? "✓" : "✗"),
        ]);
      });

      rows.push(new Array(columnHeaders.length).fill("")); // blank separator
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Column widths
    ws["!cols"] = [
      { wch: 26 }, // Name
      { wch: 18 }, // Contact
      { wch: 12 }, // Onboarder
      { wch: 18 }, // Phase/Day
      { wch: 16 }, // Status
      { wch: 12 }, // Enroll Date
      ...new Array(11).fill({ wch: 11 }),
    ];

    // Style top column-header row (row 0)
    const topHeaderStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
      fill: { fgColor: { rgb: "1E293B" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top:    { style: "thin", color: { rgb: "CBD5E1" } },
        bottom: { style: "thin", color: { rgb: "CBD5E1" } },
        left:   { style: "thin", color: { rgb: "CBD5E1" } },
        right:  { style: "thin", color: { rgb: "CBD5E1" } },
      },
    };
    columnHeaders.forEach((_, c) => {
      const addr = XLSX.utils.encode_cell({ r: 0, c });
      if (ws[addr]) ws[addr].s = topHeaderStyle;
    });

    // Style each section header row + merge across the full width
    const merges = [];
    sectionMeta.forEach(({ rowIndex, group }) => {
      const color = HEADER_COLORS[group] || "6366F1";
      const sectionStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 13 },
        fill: { fgColor: { rgb: color } },
        alignment: { horizontal: "center", vertical: "center" },
      };
      const addr = XLSX.utils.encode_cell({ r: rowIndex, c: 0 });
      if (ws[addr]) ws[addr].s = sectionStyle;
      merges.push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: columnHeaders.length - 1 } });
      // Row height for section headers
      if (!ws["!rows"]) ws["!rows"] = [];
      ws["!rows"][rowIndex] = { hpt: 22 };
    });
    ws["!merges"] = merges;

    // Center-align checkbox columns
    const dataStart = 1;
    const dataEnd   = rows.length - 1;
    for (let r = dataStart; r <= dataEnd; r++) {
      // Skip section-header rows
      if (sectionMeta.some(s => s.rowIndex === r)) continue;
      for (let c = 6; c <= 16; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        if (ws[addr]) {
          ws[addr].s = {
            font: { sz: 12, color: { rgb: ws[addr].v === "✓" ? "16A34A" : "DC2626" }, bold: true },
            alignment: { horizontal: "center", vertical: "center" },
          };
        }
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Trainees");

    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `TrainFlow-Report-${today}.xlsx`);
    showToast("success", "Excel exported!");
  };

  const uniqueNames = ["All", ...trainees.map(t=>t.name)];

  if (dbLoading) return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"linear-gradient(160deg,#f8faff 0%,#f0f4ff 50%,#faf5ff 100%)", fontFamily:"'DM Sans',sans-serif", gap:16 }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
      <div style={{ width:48,height:48,borderRadius:"50%",border:"4px solid #e0e7ff",borderTop:"4px solid #6366f1",animation:"spin 0.8s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ fontFamily:"'Sora',sans-serif",fontWeight:700,fontSize:18,color:"#6366f1" }}>TrainFlow Pro</div>
      <div style={{ fontSize:13,color:"#94a3b8" }}>Loading your data...</div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#f8faff 0%,#f0f4ff 50%,#faf5ff 100%)", fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>

      {/* ── Header ── */}
      <div style={{ background:"#fff",borderBottom:"1px solid #e8eaf6",padding:"0 32px",display:"flex",alignItems:"center",justifyContent:"space-between",height:64,boxShadow:"0 2px 12px #6366f10a",position:"sticky",top:0,zIndex:100 }}>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <div style={{ width:38,height:38,borderRadius:10,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,boxShadow:"0 4px 14px #6366f133" }}>🎓</div>
          <div>
            <div style={{ fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:18,color:"#1e293b",lineHeight:1 }}>TrainFlow <span style={{ color:"#6366f1" }}>Pro</span></div>
            <div style={{ fontSize:11,color:"#94a3b8",marginTop:2 }}>Sales Training Portal</div>
          </div>
        </div>
        <div style={{ display:"flex",gap:10,alignItems:"center" }}>
          {isAdmin && (
            <>
              <button onClick={exportToExcel} title="Export all trainees to Excel (Admin only)" style={{ display:"flex",alignItems:"center",gap:6,background:"linear-gradient(135deg,#16a34a,#22c55e)",color:"#fff",border:"none",borderRadius:10,padding:"9px 16px",fontWeight:700,fontSize:13,cursor:"pointer",boxShadow:"0 4px 14px #16a34a33",fontFamily:"inherit" }}>
                📊 Export Excel
              </button>
              <button onClick={()=>setShowAdminPanel(true)} title="User Management (Admin only)" style={{ display:"flex",alignItems:"center",gap:6,background:"#fff",color:"#6366f1",border:"1.5px solid #c7d2fe",borderRadius:10,padding:"9px 16px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit" }}>
                👥 Users
              </button>
            </>
          )}
          <button onClick={()=>setShowMessages(true)} style={{ display:"flex",alignItems:"center",gap:8,background:"linear-gradient(135deg,#0ea5e9,#06b6d4)",color:"#fff",border:"none",borderRadius:10,padding:"9px 20px",fontWeight:700,fontSize:14,cursor:"pointer",boxShadow:"0 4px 16px #0ea5e933",fontFamily:"inherit" }}>📨 Day Messages</button>
          <button onClick={()=>setShowAdd(true)} style={{ display:"flex",alignItems:"center",gap:8,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",border:"none",borderRadius:10,padding:"9px 20px",fontWeight:700,fontSize:14,cursor:"pointer",boxShadow:"0 4px 16px #6366f133",fontFamily:"inherit" }}><span style={{ fontSize:18,lineHeight:1 }}>+</span> New Trainee</button>
          {/* User badge + Logout */}
          <div style={{ display:"flex",alignItems:"center",gap:8,paddingLeft:10,marginLeft:4,borderLeft:"1.5px solid #e8eaf6" }}>
            <div style={{ textAlign:"right",lineHeight:1.2 }}>
              <div style={{ fontSize:12,fontWeight:700,color:"#1e293b" }}>{profile?.name || profile?.email?.split("@")[0] || "User"}</div>
              {isAdmin && (
                <div style={{ fontSize:10,fontWeight:700,color:"#6366f1",textTransform:"uppercase",letterSpacing:"0.05em" }}>Admin</div>
              )}
            </div>
            <button onClick={onLogout} title="Log out" style={{ background:"#fff",color:"#ef4444",border:"1.5px solid #fecaca",borderRadius:10,padding:"8px 12px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>
              ↪ Logout
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding:"28px 32px" }}>
        {/* ── Stats ── */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:14,marginBottom:28 }}>
          {STAT_CARDS.map(card=>{
            const isActive = card.key === "total" ? filterStatus === "All" : filterStatus === card.key;
            return (
            <div key={card.key}
              onClick={()=>{ setFilterStatus(card.key==="total" ? "All" : (filterStatus===card.key ? "All" : card.key)); }}
              style={{ background:card.bg,borderRadius:16,padding:"20px 22px",
                border: isActive ? `2px solid ${card.color}` : `1.5px solid ${card.color}18`,
                boxShadow: isActive ? `0 8px 28px ${card.color}33` : "0 2px 12px #0000060a",
                transition:"transform 0.15s,box-shadow 0.15s,border 0.15s",
                cursor:"pointer",
                transform: isActive ? "translateY(-3px)" : "",
                position:"relative",
                outline:"none",
              }}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 10px 28px ${card.color}33`;}}
              onMouseLeave={e=>{e.currentTarget.style.transform=isActive?"translateY(-3px)":"";e.currentTarget.style.boxShadow=isActive?`0 8px 28px ${card.color}33`:"0 2px 12px #0000060a";}}>
              {isActive && (
                <div style={{ position:"absolute",top:10,right:10,width:8,height:8,borderRadius:"50%",background:card.color,boxShadow:`0 0 0 3px ${card.color}33` }}/>
              )}
              <div style={{ fontSize:22,marginBottom:8 }}>{card.icon}</div>
              <div style={{ fontSize:32,fontWeight:800,color:card.color,fontFamily:"'Sora',sans-serif",lineHeight:1 }}>{stats[card.key]??0}</div>
              <div style={{ fontSize:12,color:"#64748b",fontWeight:600,marginTop:4 }}>{card.label}</div>
            </div>
            );
          })}
        </div>

        {/* ── Filters ── */}
        <div style={{ background:"#fff",borderRadius:16,padding:"16px 20px",border:"1.5px solid #e8eaf6",marginBottom:20,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",boxShadow:"0 2px 12px #0000060a" }}>
          {[{label:"Trainee",value:filterName,set:setFilterName,options:uniqueNames},{label:"Status",value:filterStatus,set:setFilterStatus,options:["All",...STATUSES]}].map(({label,value,set,options})=>(
            <select key={label} value={value} onChange={e=>set(e.target.value)} style={{ padding:"8px 14px",border:"1.5px solid #e2e8f0",borderRadius:9,fontSize:13,color:"#374151",background:"#f8fafc",outline:"none",fontFamily:"inherit",fontWeight:500,cursor:"pointer",minWidth:150 }}>
              {options.map(o=><option key={o} value={o}>{o==="All"?`All ${label}s`:o}</option>)}
            </select>
          ))}
          {/* Onboarder filter — admins only (employees see only their own trainees) */}
          {isAdmin && (
            <select value={filterOnboarder} onChange={e=>setFilterOnboarder(e.target.value)} style={{ padding:"8px 14px",border:"1.5px solid #e2e8f0",borderRadius:9,fontSize:13,color: filterOnboarder!=="All" ? ONBOARDER_CONFIG[filterOnboarder]?.color : "#374151",background: filterOnboarder!=="All" ? ONBOARDER_CONFIG[filterOnboarder]?.bg : "#f8fafc",outline:"none",fontFamily:"inherit",fontWeight: filterOnboarder!=="All" ? 700 : 500,cursor:"pointer",minWidth:150 }}>
              <option value="All">All Onboarders</option>
              {ONBOARDERS.map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          )}
          <div style={{ flex:1,minWidth:200,position:"relative" }}>
            <span style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#94a3b8",fontSize:16 }}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search trainee name..." style={{ width:"100%",padding:"8px 14px 8px 36px",border:"1.5px solid #e2e8f0",borderRadius:9,fontSize:13,color:"#374151",background:"#f8fafc",outline:"none",fontFamily:"inherit",boxSizing:"border-box" }}/>
          </div>
          <div style={{ fontSize:13,color:"#94a3b8",fontWeight:500,marginLeft:"auto" }}>
            Showing <strong style={{ color:"#6366f1" }}>{activeTrainees.length}</strong> active{pendingTrainees.length > 0 ? `, ${pendingTrainees.length} pending` : ""}{selectedTrainees.length > 0 ? `, ${selectedTrainees.length} selected` : ""}{notSelectedTrainees.length > 0 ? `, ${notSelectedTrainees.length} not selected` : ""}{leavedTrainees.length > 0 ? `, ${leavedTrainees.length} leaved` : ""} of {trainees.length} trainees
          </div>
        </div>

        {/* ── Bulk Action Bar ── */}
        {selectedRows.size > 0 && (
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"12px 20px", marginBottom:8,
            background:"linear-gradient(135deg,#fef2f2,#fee2e2)",
            border:"1.5px solid #fecaca", borderRadius:12,
            animation:"fadeIn 0.2s ease",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:20 }}>☑️</span>
              <span style={{ fontWeight:700, fontSize:14, color:"#1e293b" }}>
                {selectedRows.size} trainee{selectedRows.size>1?"s":""} selected
              </span>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setSelectedRows(new Set())} style={{
                padding:"8px 18px", borderRadius:8, border:"1.5px solid #e2e8f0",
                background:"#fff", color:"#64748b", fontWeight:600, fontSize:13,
                cursor:"pointer", fontFamily:"inherit",
              }}>✕ Deselect All</button>
              {isAdmin && (
                <button onClick={()=>setBulkDeleteConfirm(true)} style={{
                  padding:"8px 18px", borderRadius:8, border:"none",
                  background:"linear-gradient(135deg,#ef4444,#dc2626)",
                  color:"#fff", fontWeight:700, fontSize:13,
                  cursor:"pointer", fontFamily:"inherit",
                  boxShadow:"0 4px 14px #ef444433",
                  display:"flex", alignItems:"center", gap:6,
                }}>🗑 Delete Selected</button>
              )}
            </div>
          </div>
        )}

        {/* ── Table ── */}
        <div style={{ background:"#fff",borderRadius:18,border:"1.5px solid #e8eaf6",overflow:"hidden",boxShadow:"0 4px 24px #0000080a" }}>
          {/* Header */}
          <div style={{ display:"grid",gridTemplateColumns:"40px 2fr 1.6fr 100px 90px repeat(11,64px)",padding:"12px 20px",background:"linear-gradient(135deg,#f8faff,#f0f4ff)",borderBottom:"2px solid #e8eaf6",gap:8,alignItems:"center" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"center" }}>
              <input type="checkbox"
                checked={activeTrainees.length>0 && activeTrainees.every(t=>selectedRows.has(t.id))}
                onChange={e=>{ if(e.target.checked) setSelectedRows(new Set(activeTrainees.map(t=>t.id))); else setSelectedRows(new Set()); }}
                style={{ width:16,height:16,cursor:"pointer",accentColor:"#6366f1" }}
              />
            </div>
            <div style={thStyle}>Trainee Name</div>
            <div style={thStyle}>Contact</div>
            <div style={{ ...thStyle, textAlign:"center" }}>Onboarder</div>
            <div style={{ ...thStyle, textAlign:"center" }}>Phase</div>
            {PHASES.map(p=>(
              <div key={p.key} title={p.label} style={{ ...thStyle,textAlign:"center",fontSize:10,lineHeight:1.3,color:p.color }}>{p.short}</div>
            ))}
          </div>

          {/* Rows */}
          {activeTrainees.length===0 && (
            <div style={{ textAlign:"center",padding:"48px",color:"#94a3b8",fontSize:15 }}>No active trainees found. Try adjusting your filters.</div>
          )}
          {activeTrainees.map((trainee,idx) => {
            const overdue       = isOverdue(trainee);
            const completedCount= getCompletedCount(trainee.phases);
            const currentDay    = getPhaseDay(trainee.phases);
            const cfg           = STATUS_CONFIG[trainee.status] || STATUS_CONFIG["Not Started"];
            const rowBg         = overdue ? "#fff9f9" : idx%2===0 ? "#fff" : "#fafbff";

            return (
              <div key={trainee.id} style={{
                display:"grid", gridTemplateColumns:"40px 2fr 1.6fr 100px 90px repeat(11,64px)",
                padding:"13px 20px", gap:8, alignItems:"center",
                background:rowBg,
                borderLeft: overdue ? "4px solid #ef4444" : "4px solid transparent",
                borderBottom:"1px solid #f1f5f9",
                cursor:"pointer", transition:"background 0.15s",
              }}
                onMouseEnter={e=>e.currentTarget.style.background="#eef2ff"}
                onMouseLeave={e=>e.currentTarget.style.background=rowBg}
                onClick={()=>setNotesModal(trainee)}
              >
                {/* Row Checkbox */}
                <div style={{ display:"flex",alignItems:"center",justifyContent:"center" }} onClick={e=>e.stopPropagation()}>
                  <input type="checkbox"
                    checked={selectedRows.has(trainee.id)}
                    onChange={e=>{ const s=new Set(selectedRows); e.target.checked?s.add(trainee.id):s.delete(trainee.id); setSelectedRows(s); }}
                    style={{ width:16,height:16,cursor:"pointer",accentColor:"#6366f1" }}
                  />
                </div>

                {/* Name */}
                <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                  <div style={{ width:34,height:34,borderRadius:10,background:`linear-gradient(135deg,${cfg.color}22,${cfg.color}44)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,color:cfg.color,flexShrink:0 }}>
                    {trainee.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight:600,fontSize:14,color:"#1e293b" }}>{trainee.name}</div>
                    {overdue && <div style={{ fontSize:10,color:"#ef4444",fontWeight:600,marginTop:2 }}>⚠ Overdue</div>}
                  </div>
                </div>

                {/* Contact */}
                <div style={{ fontSize:13,color:"#64748b",display:"flex",alignItems:"center",gap:6 }}>📱 {trainee.contact}</div>

                {/* Onboarder — admins get a dropdown, employees see a read-only badge */}
                <div style={{ display:"flex",alignItems:"center",justifyContent:"center" }} onClick={e=>e.stopPropagation()}>
                  {(() => {
                    const ob = ONBOARDER_CONFIG[trainee.onboarder];
                    if (!isAdmin) {
                      return (
                        <span style={{
                          padding:"4px 10px", borderRadius:7, fontSize:11, fontWeight:700,
                          fontFamily:"inherit", display:"inline-block", maxWidth:95,
                          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                          background: ob?.bg||"#f1f5f9", color: ob?.color||"#64748b",
                          border:`1.5px solid ${ob?.color||"#cbd5e1"}44`,
                        }}>
                          {trainee.onboarder || "—"}
                        </span>
                      );
                    }
                    return (
                      <select value={trainee.onboarder||""} onChange={e=>changeOnboarder(trainee.id,e.target.value)} style={{
                        padding:"4px 6px", borderRadius:7, fontSize:11, fontWeight:700, cursor:"pointer", outline:"none", fontFamily:"inherit",
                        background: ob?.bg||"#f8fafc", color: ob?.color||"#64748b",
                        border:`1.5px solid ${ob?.color||"#cbd5e1"}55`, maxWidth:95,
                      }}>
                        {ONBOARDERS.map(o=><option key={o} value={o}>{o}</option>)}
                      </select>
                    );
                  })()}
                </div>

                {/* Phase */}
                <div style={{ textAlign:"center" }}>
                  <div style={{ display:"inline-block",background:"linear-gradient(135deg,#eef2ff,#ede9fe)",color:"#6366f1",fontWeight:700,fontSize:12,borderRadius:7,padding:"3px 8px" }}>
                    {completedCount===PHASES.length ? "Done ✓" : currentDay===0 ? "Day 0" : `Day ${currentDay}`}
                  </div>
                  <div style={{ fontSize:10,color:"#94a3b8",marginTop:2 }}>{completedCount}/{PHASES.length}</div>
                </div>

                {/* Phase Checkboxes */}
                {PHASES.map(p => (
                  <div key={p.key} style={{ display:"flex",justifyContent:"center" }} onClick={e=>e.stopPropagation()}>
                    <PhaseCheckbox
                      checked={trainee.phases[p.key]}
                      onChange={e=>updatePhase(trainee.id,p.key,e.target.checked)}
                      overdue={overdue && !trainee.phases[p.key]}
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ marginTop:20,display:"flex",alignItems:"center",gap:24,padding:"12px 20px",background:"#fff",borderRadius:12,border:"1.5px solid #e8eaf6",flexWrap:"wrap" }}>
          <span style={{ fontSize:12,fontWeight:700,color:"#64748b" }}>Status Legend:</span>
          {Object.entries(STATUS_CONFIG).map(([status,cfg])=>(
            <div key={status} style={{ display:"flex",alignItems:"center",gap:6 }}>
              <span style={{ width:10,height:10,borderRadius:"50%",background:cfg.dot,display:"inline-block" }}/>
              <span style={{ fontSize:12,color:"#64748b" }}>{status}</span>
            </div>
          ))}
          <div style={{ marginLeft:"auto",display:"flex",alignItems:"center",gap:6 }}>
            <div style={{ width:14,height:14,background:"#fef2f2",border:"2px solid #ef4444",borderRadius:3 }}/>
            <span style={{ fontSize:12,color:"#ef4444",fontWeight:600 }}>Overdue</span>
          </div>
          <div style={{ fontSize:12,color:"#94a3b8" }}>· Click any row to view/edit remarks per stage</div>
        </div>

        {/* ── Pending Section ── (awaiting outcome decision) */}
        {pendingTrainees.length > 0 && filterStatus !== "Pending" && (
          <div style={{ marginTop:24 }}>
            <div
              onClick={()=>setShowPending(g=>!g)}
              style={{
                display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"16px 22px", borderRadius: showPending ? "16px 16px 0 0" : 16,
                background:"linear-gradient(135deg,#fefce8,#fef9c3)",
                border:"1.5px solid #fde047", cursor:"pointer",
                transition:"border-radius 0.2s",
              }}
            >
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:24 }}>⏳</span>
                <div>
                  <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:16, color:"#ca8a04" }}>
                    Pending — Awaiting Decision
                  </div>
                  <div style={{ fontSize:12, color:"#a16207", fontWeight:600, marginTop:2 }}>
                    {pendingTrainees.length} trainee{pendingTrainees.length>1?"s":""} completed all stages — click to decide Selected / Not Selected
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ background:"#ca8a04", color:"#fff", borderRadius:99, padding:"4px 14px", fontSize:13, fontWeight:700 }}>
                  {pendingTrainees.length}
                </span>
                <span style={{ fontSize:18, color:"#ca8a04", transition:"transform 0.2s", transform: showPending ? "rotate(180deg)" : "rotate(0deg)", display:"inline-block" }}>▼</span>
              </div>
            </div>

            {showPending && (
              <div style={{ background:"#fff", borderRadius:"0 0 18px 18px", border:"1.5px solid #fde047", borderTop:"none", overflow:"hidden", boxShadow:"0 4px 24px #0000080a" }}>
                <div style={{ display:"grid",gridTemplateColumns:"2fr 1.4fr 130px 90px repeat(11,64px)",padding:"12px 20px",background:"linear-gradient(135deg,#fefce8,#fef9c3)",borderBottom:"2px solid #fde047",gap:8,alignItems:"center" }}>
                  <div style={thStyle}>Trainee Name</div>
                  <div style={thStyle}>Contact</div>
                  <div style={{ ...thStyle, textAlign:"center" }}>Decide Now</div>
                  <div style={{ ...thStyle, textAlign:"center" }}>Phase</div>
                  {PHASES.map(p=>(<div key={p.key} title={p.label} style={{ ...thStyle,textAlign:"center",fontSize:10,lineHeight:1.3,color:p.color }}>{p.short}</div>))}
                </div>
                {pendingTrainees.map((trainee,idx) => {
                  const completedCount = getCompletedCount(trainee.phases);
                  return (
                    <div key={trainee.id} style={{
                      display:"grid", gridTemplateColumns:"2fr 1.4fr 130px 90px repeat(11,64px)",
                      padding:"13px 20px", gap:8, alignItems:"center",
                      background: idx%2===0 ? "#fff" : "#fefce8",
                      borderBottom:"1px solid #f1f5f9",
                      cursor:"pointer", transition:"background 0.15s",
                    }}
                      onMouseEnter={e=>e.currentTarget.style.background="#fef9c3"}
                      onMouseLeave={e=>e.currentTarget.style.background=idx%2===0?"#fff":"#fefce8"}
                      onClick={()=>setOutcomeModal({ id: trainee.id, name: trainee.name })}
                    >
                      <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                        <div style={{ width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#ca8a0422,#eab30844)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,color:"#ca8a04",flexShrink:0 }}>
                          {trainee.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight:600,fontSize:14,color:"#1e293b" }}>{trainee.name}</div>
                          <div style={{ display:"flex",alignItems:"center",gap:5,marginTop:2,flexWrap:"wrap" }}>
                            <span style={{ fontSize:10,color:"#ca8a04",fontWeight:600 }}>⏳ Awaiting decision</span>
                            {trainee.onboarder && <span style={{ fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:99,background: ONBOARDER_CONFIG[trainee.onboarder]?.bg||"#f1f5f9",color: ONBOARDER_CONFIG[trainee.onboarder]?.color||"#64748b" }}>👤 {trainee.onboarder}</span>}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize:13,color:"#64748b",display:"flex",alignItems:"center",gap:6 }}>📱 {trainee.contact}</div>
                      <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:6 }} onClick={e=>e.stopPropagation()}>
                        <button onClick={()=>confirmOutcome(trainee.id,"Selected")} title="Selected" style={{
                          padding:"5px 10px", borderRadius:7, border:"none",
                          background:"linear-gradient(135deg,#0d9488,#14b8a6)", color:"#fff",
                          fontWeight:700, fontSize:11, cursor:"pointer", fontFamily:"inherit",
                        }}>✅</button>
                        <button onClick={()=>confirmOutcome(trainee.id,"Not Selected")} title="Not Selected" style={{
                          padding:"5px 10px", borderRadius:7, border:"none",
                          background:"linear-gradient(135deg,#d97706,#f59e0b)", color:"#fff",
                          fontWeight:700, fontSize:11, cursor:"pointer", fontFamily:"inherit",
                        }}>❌</button>
                      </div>
                      <div style={{ textAlign:"center" }}>
                        <div style={{ display:"inline-block",background:"linear-gradient(135deg,#fefce8,#fde047)",color:"#ca8a04",fontWeight:700,fontSize:12,borderRadius:7,padding:"3px 8px" }}>Done ✓</div>
                        <div style={{ fontSize:10,color:"#94a3b8",marginTop:2 }}>{completedCount}/{PHASES.length}</div>
                      </div>
                      {PHASES.map(p => (
                        <div key={p.key} style={{ display:"flex",justifyContent:"center" }} onClick={e=>e.stopPropagation()}>
                          <PhaseCheckbox checked={trainee.phases[p.key]} onChange={e=>updatePhase(trainee.id,p.key,e.target.checked)} overdue={false} />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Selected Section ── */}
        {selectedTrainees.length > 0 && filterStatus !== "Selected" && (
          <div style={{ marginTop:24 }}>
            <div
              onClick={()=>setShowSelected(g=>!g)}
              style={{
                display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"16px 22px", borderRadius: showSelected ? "16px 16px 0 0" : 16,
                background:"linear-gradient(135deg,#f0fdfa,#ccfbf1)",
                border:"1.5px solid #99f6e4", cursor:"pointer",
                transition:"border-radius 0.2s",
              }}
            >
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:24 }}>✅</span>
                <div>
                  <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:16, color:"#0d9488" }}>
                    Selected Trainees
                  </div>
                  <div style={{ fontSize:12, color:"#5eead4", fontWeight:600, marginTop:2 }}>
                    {selectedTrainees.length} trainee{selectedTrainees.length>1?"s":""} passed Final Test and got selected
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ background:"#0d9488", color:"#fff", borderRadius:99, padding:"4px 14px", fontSize:13, fontWeight:700 }}>
                  {selectedTrainees.length}
                </span>
                <span style={{ fontSize:18, color:"#0d9488", transition:"transform 0.2s", transform: showSelected ? "rotate(180deg)" : "rotate(0deg)", display:"inline-block" }}>▼</span>
              </div>
            </div>

            {showSelected && (
              <div style={{ background:"#fff", borderRadius:"0 0 18px 18px", border:"1.5px solid #99f6e4", borderTop:"none", overflow:"hidden", boxShadow:"0 4px 24px #0000080a" }}>
                <div style={{ display:"grid",gridTemplateColumns:"2fr 1.4fr 130px 90px repeat(11,64px)",padding:"12px 20px",background:"linear-gradient(135deg,#f0fdfa,#ecfdf5)",borderBottom:"2px solid #d1fae5",gap:8,alignItems:"center" }}>
                  <div style={thStyle}>Trainee Name</div>
                  <div style={thStyle}>Contact</div>
                  <div style={{ ...thStyle, textAlign:"center" }}>Change Status</div>
                  <div style={{ ...thStyle, textAlign:"center" }}>Phase</div>
                  {PHASES.map(p=>(<div key={p.key} title={p.label} style={{ ...thStyle,textAlign:"center",fontSize:10,lineHeight:1.3,color:p.color }}>{p.short}</div>))}
                </div>
                {selectedTrainees.map((trainee,idx) => {
                  const completedCount = getCompletedCount(trainee.phases);
                  return (
                    <div key={trainee.id} style={{
                      display:"grid", gridTemplateColumns:"2fr 1.4fr 130px 90px repeat(11,64px)",
                      padding:"13px 20px", gap:8, alignItems:"center",
                      background: idx%2===0 ? "#fff" : "#f0fdfa",
                      borderBottom:"1px solid #f1f5f9",
                      cursor:"pointer", transition:"background 0.15s",
                    }}
                      onMouseEnter={e=>e.currentTarget.style.background="#ecfdf5"}
                      onMouseLeave={e=>e.currentTarget.style.background=idx%2===0?"#fff":"#f0fdfa"}
                      onClick={()=>setNotesModal(trainee)}
                    >
                      <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                        <div style={{ width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#0d948822,#14b8a644)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,color:"#0d9488",flexShrink:0 }}>
                          {trainee.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight:600,fontSize:14,color:"#1e293b" }}>{trainee.name}</div>
                          <div style={{ display:"flex",alignItems:"center",gap:5,marginTop:2,flexWrap:"wrap" }}>
                            <span style={{ fontSize:10,color:"#0d9488",fontWeight:600 }}>✅ Selected</span>
                            {trainee.onboarder && <span style={{ fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:99,background: ONBOARDER_CONFIG[trainee.onboarder]?.bg||"#f1f5f9",color: ONBOARDER_CONFIG[trainee.onboarder]?.color||"#64748b" }}>👤 {trainee.onboarder}</span>}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize:13,color:"#64748b",display:"flex",alignItems:"center",gap:6 }}>📱 {trainee.contact}</div>
                      <div style={{ display:"flex",alignItems:"center",justifyContent:"center" }} onClick={e=>e.stopPropagation()}>
                        <select value={trainee.status} onChange={e=>changeTraineeStatus(trainee.id,e.target.value)} style={{
                          padding:"5px 8px", borderRadius:7, fontSize:11, fontWeight:700, cursor:"pointer", outline:"none", fontFamily:"inherit",
                          background:STATUS_CONFIG[trainee.status]?.bg, color:STATUS_CONFIG[trainee.status]?.color,
                          border:`1.5px solid ${STATUS_CONFIG[trainee.status]?.color}55`,
                        }}>
                          {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div style={{ textAlign:"center" }}>
                        <div style={{ display:"inline-block",background:"linear-gradient(135deg,#ecfdf5,#d1fae5)",color:"#0d9488",fontWeight:700,fontSize:12,borderRadius:7,padding:"3px 8px" }}>Done ✓</div>
                        <div style={{ fontSize:10,color:"#94a3b8",marginTop:2 }}>{completedCount}/{PHASES.length}</div>
                      </div>
                      {PHASES.map(p => (
                        <div key={p.key} style={{ display:"flex",justifyContent:"center" }} onClick={e=>e.stopPropagation()}>
                          <PhaseCheckbox checked={trainee.phases[p.key]} onChange={e=>updatePhase(trainee.id,p.key,e.target.checked)} overdue={false} />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Not Selected Section ── */}
        {notSelectedTrainees.length > 0 && filterStatus !== "Not Selected" && (
          <div style={{ marginTop:20 }}>
            <div
              onClick={()=>setShowNotSelected(g=>!g)}
              style={{
                display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"16px 22px", borderRadius: showNotSelected ? "16px 16px 0 0" : 16,
                background:"linear-gradient(135deg,#fffbeb,#fef3c7)",
                border:"1.5px solid #fcd34d", cursor:"pointer",
                transition:"border-radius 0.2s",
              }}
            >
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:24 }}>❌</span>
                <div>
                  <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:16, color:"#d97706" }}>
                    Not Selected Trainees
                  </div>
                  <div style={{ fontSize:12, color:"#f59e0b", fontWeight:600, marginTop:2 }}>
                    {notSelectedTrainees.length} trainee{notSelectedTrainees.length>1?"s":""} completed training but not selected
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ background:"#d97706", color:"#fff", borderRadius:99, padding:"4px 14px", fontSize:13, fontWeight:700 }}>
                  {notSelectedTrainees.length}
                </span>
                <span style={{ fontSize:18, color:"#d97706", transition:"transform 0.2s", transform: showNotSelected ? "rotate(180deg)" : "rotate(0deg)", display:"inline-block" }}>▼</span>
              </div>
            </div>

            {showNotSelected && (
              <div style={{ background:"#fff", borderRadius:"0 0 18px 18px", border:"1.5px solid #fcd34d", borderTop:"none", overflow:"hidden", boxShadow:"0 4px 24px #0000080a" }}>
                <div style={{ display:"grid",gridTemplateColumns:"2fr 1.4fr 130px 90px repeat(11,64px)",padding:"12px 20px",background:"linear-gradient(135deg,#fffbeb,#fef3c7)",borderBottom:"2px solid #fde68a",gap:8,alignItems:"center" }}>
                  <div style={thStyle}>Trainee Name</div>
                  <div style={thStyle}>Contact</div>
                  <div style={{ ...thStyle, textAlign:"center" }}>Change Status</div>
                  <div style={{ ...thStyle, textAlign:"center" }}>Phase</div>
                  {PHASES.map(p=>(<div key={p.key} title={p.label} style={{ ...thStyle,textAlign:"center",fontSize:10,lineHeight:1.3,color:p.color }}>{p.short}</div>))}
                </div>
                {notSelectedTrainees.map((trainee,idx) => {
                  const completedCount = getCompletedCount(trainee.phases);
                  return (
                    <div key={trainee.id} style={{
                      display:"grid", gridTemplateColumns:"2fr 1.4fr 130px 90px repeat(11,64px)",
                      padding:"13px 20px", gap:8, alignItems:"center",
                      background: idx%2===0 ? "#fff" : "#fffbeb",
                      borderBottom:"1px solid #f1f5f9",
                      cursor:"pointer", transition:"background 0.15s",
                    }}
                      onMouseEnter={e=>e.currentTarget.style.background="#fef3c7"}
                      onMouseLeave={e=>e.currentTarget.style.background=idx%2===0?"#fff":"#fffbeb"}
                      onClick={()=>setNotesModal(trainee)}
                    >
                      <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                        <div style={{ width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#d9770622,#f59e0b44)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,color:"#d97706",flexShrink:0 }}>
                          {trainee.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight:600,fontSize:14,color:"#1e293b" }}>{trainee.name}</div>
                          <div style={{ display:"flex",alignItems:"center",gap:5,marginTop:2,flexWrap:"wrap" }}>
                            <span style={{ fontSize:10,color:"#d97706",fontWeight:600 }}>❌ Not Selected</span>
                            {trainee.onboarder && <span style={{ fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:99,background: ONBOARDER_CONFIG[trainee.onboarder]?.bg||"#f1f5f9",color: ONBOARDER_CONFIG[trainee.onboarder]?.color||"#64748b" }}>👤 {trainee.onboarder}</span>}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize:13,color:"#64748b",display:"flex",alignItems:"center",gap:6 }}>📱 {trainee.contact}</div>
                      <div style={{ display:"flex",alignItems:"center",justifyContent:"center" }} onClick={e=>e.stopPropagation()}>
                        <select value={trainee.status} onChange={e=>changeTraineeStatus(trainee.id,e.target.value)} style={{
                          padding:"5px 8px", borderRadius:7, fontSize:11, fontWeight:700, cursor:"pointer", outline:"none", fontFamily:"inherit",
                          background:STATUS_CONFIG[trainee.status]?.bg, color:STATUS_CONFIG[trainee.status]?.color,
                          border:`1.5px solid ${STATUS_CONFIG[trainee.status]?.color}55`,
                        }}>
                          {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div style={{ textAlign:"center" }}>
                        <div style={{ display:"inline-block",background:"linear-gradient(135deg,#fffbeb,#fde68a)",color:"#d97706",fontWeight:700,fontSize:12,borderRadius:7,padding:"3px 8px" }}>Done ✓</div>
                        <div style={{ fontSize:10,color:"#94a3b8",marginTop:2 }}>{completedCount}/{PHASES.length}</div>
                      </div>
                      {PHASES.map(p => (
                        <div key={p.key} style={{ display:"flex",justifyContent:"center" }} onClick={e=>e.stopPropagation()}>
                          <PhaseCheckbox checked={trainee.phases[p.key]} onChange={e=>updatePhase(trainee.id,p.key,e.target.checked)} overdue={false} />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Leaved Section ── */}
        {leavedTrainees.length > 0 && filterStatus !== "Leaved" && (
          <div style={{ marginTop:20 }}>
            <div
              onClick={()=>setShowLeaved(g=>!g)}
              style={{
                display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"16px 22px", borderRadius: showLeaved ? "16px 16px 0 0" : 16,
                background:"linear-gradient(135deg,#fff1f2,#ffe4e6)",
                border:"1.5px solid #fecdd3", cursor:"pointer",
                transition:"border-radius 0.2s",
              }}
            >
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:24 }}>🚪</span>
                <div>
                  <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:16, color:"#be123c" }}>
                    Leaved Trainees
                  </div>
                  <div style={{ fontSize:12, color:"#f43f5e", fontWeight:600, marginTop:2 }}>
                    {leavedTrainees.length} trainee{leavedTrainees.length>1?"s":""} left the program
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ background:"#be123c", color:"#fff", borderRadius:99, padding:"4px 14px", fontSize:13, fontWeight:700 }}>
                  {leavedTrainees.length}
                </span>
                <span style={{ fontSize:18, color:"#be123c", transition:"transform 0.2s", transform: showLeaved ? "rotate(180deg)" : "rotate(0deg)", display:"inline-block" }}>▼</span>
              </div>
            </div>

            {showLeaved && (
              <div style={{ background:"#fff", borderRadius:"0 0 18px 18px", border:"1.5px solid #fecdd3", borderTop:"none", overflow:"hidden", boxShadow:"0 4px 24px #0000080a" }}>
                <div style={{ display:"grid",gridTemplateColumns:"2fr 1.4fr 1.5fr 130px 90px repeat(11,64px)",padding:"12px 20px",background:"linear-gradient(135deg,#fff1f2,#ffe4e6)",borderBottom:"2px solid #fecdd3",gap:8,alignItems:"center" }}>
                  <div style={thStyle}>Trainee Name</div>
                  <div style={thStyle}>Contact</div>
                  <div style={thStyle}>Reason</div>
                  <div style={{ ...thStyle, textAlign:"center" }}>Change Status</div>
                  <div style={{ ...thStyle, textAlign:"center" }}>Phase</div>
                  {PHASES.map(p=>(<div key={p.key} title={p.label} style={{ ...thStyle,textAlign:"center",fontSize:10,lineHeight:1.3,color:p.color }}>{p.short}</div>))}
                </div>
                {leavedTrainees.map((trainee,idx) => {
                  const completedCount = getCompletedCount(trainee.phases);
                  const currentDay = getPhaseDay(trainee.phases);
                  return (
                    <div key={trainee.id} style={{
                      display:"grid", gridTemplateColumns:"2fr 1.4fr 1.5fr 130px 90px repeat(11,64px)",
                      padding:"13px 20px", gap:8, alignItems:"center",
                      background: idx%2===0 ? "#fff" : "#fff1f2",
                      borderBottom:"1px solid #f1f5f9",
                      cursor:"pointer", transition:"background 0.15s",
                    }}
                      onMouseEnter={e=>e.currentTarget.style.background="#ffe4e6"}
                      onMouseLeave={e=>e.currentTarget.style.background=idx%2===0?"#fff":"#fff1f2"}
                      onClick={()=>setNotesModal(trainee)}
                    >
                      <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                        <div style={{ width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#be123c22,#f43f5e44)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,color:"#be123c",flexShrink:0 }}>
                          {trainee.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight:600,fontSize:14,color:"#1e293b" }}>{trainee.name}</div>
                          <div style={{ display:"flex",alignItems:"center",gap:5,marginTop:2,flexWrap:"wrap" }}>
                            <span style={{ fontSize:10,color:"#be123c",fontWeight:600 }}>🚪 Leaved{trainee.leavedDate ? ` · ${new Date(trainee.leavedDate).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}` : ""}</span>
                            {trainee.onboarder && <span style={{ fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:99,background: ONBOARDER_CONFIG[trainee.onboarder]?.bg||"#f1f5f9",color: ONBOARDER_CONFIG[trainee.onboarder]?.color||"#64748b" }}>👤 {trainee.onboarder}</span>}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize:13,color:"#64748b",display:"flex",alignItems:"center",gap:6 }}>📱 {trainee.contact}</div>
                      {/* Reason */}
                      <div style={{ fontSize:12,color:"#64748b",lineHeight:1.5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" }} title={trainee.leavedReason||""}>
                        {trainee.leavedReason ? (
                          <span style={{ background:"#fff1f2",border:"1px solid #fecdd3",borderRadius:6,padding:"4px 8px",display:"inline-block",color:"#be123c",fontSize:11,fontWeight:500,maxWidth:"100%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                            📝 {trainee.leavedReason}
                          </span>
                        ) : <span style={{ color:"#d1d5db",fontStyle:"italic" }}>No reason</span>}
                      </div>
                      <div style={{ display:"flex",alignItems:"center",justifyContent:"center" }} onClick={e=>e.stopPropagation()}>
                        <select value={trainee.status} onChange={e=>changeTraineeStatus(trainee.id,e.target.value)} style={{
                          padding:"5px 8px", borderRadius:7, fontSize:11, fontWeight:700, cursor:"pointer", outline:"none", fontFamily:"inherit",
                          background:STATUS_CONFIG[trainee.status]?.bg, color:STATUS_CONFIG[trainee.status]?.color,
                          border:`1.5px solid ${STATUS_CONFIG[trainee.status]?.color}55`,
                        }}>
                          {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div style={{ textAlign:"center" }}>
                        <div style={{ display:"inline-block",background:"linear-gradient(135deg,#fff1f2,#fecdd3)",color:"#be123c",fontWeight:700,fontSize:12,borderRadius:7,padding:"3px 8px" }}>
                          {completedCount===PHASES.length ? "Done ✓" : currentDay===0 ? "Day 0" : `Day ${currentDay}`}
                        </div>
                        <div style={{ fontSize:10,color:"#94a3b8",marginTop:2 }}>{completedCount}/{PHASES.length}</div>
                      </div>
                      {PHASES.map(p => (
                        <div key={p.key} style={{ display:"flex",justifyContent:"center" }} onClick={e=>e.stopPropagation()}>
                          <PhaseCheckbox checked={trainee.phases[p.key]} onChange={e=>updatePhase(trainee.id,p.key,e.target.checked)} overdue={false} />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showAdd && <AddTraineeModal onClose={()=>setShowAdd(false)} onAdd={addTrainee} isAdmin={isAdmin} defaultOnboarder={profile?.name || ""}/>}
      {showMessages && <DayMessagesPanel
        dayMessages={dayMessages}
        setDayMessages={setDayMessages}
        onSave={saveDayMessage}
        onReset={resetDayMessage}
        onClose={()=>setShowMessages(false)}
        isAdmin={isAdmin}
        personalTabs={personalTabs}
        showToast={showToast}
      />}
      {notesModal && (
        <TraineeNotesModal
          trainee={notesModal}
          onClose={()=>setNotesModal(null)}
          onUpdate={(id, updates) => {
            updateTrainee(id, updates);
            setNotesModal(null);
          }}
        />
      )}
      {bulkDeleteConfirm && (
        <div style={{ position:"fixed",inset:0,background:"#0009",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center" }} onClick={()=>setBulkDeleteConfirm(false)}>
          <div style={{ background:"#fff",borderRadius:20,padding:36,width:420,maxWidth:"92vw",boxShadow:"0 25px 60px #ef444433",fontFamily:"'DM Sans',sans-serif",border:"2px solid #fecaca" }} onClick={e=>e.stopPropagation()}>
            <div style={{ textAlign:"center",marginBottom:20 }}>
              <div style={{ fontSize:48,marginBottom:8 }}>🗑️</div>
              <h2 style={{ margin:"0 0 8px",fontSize:20,fontWeight:800,color:"#1e293b",fontFamily:"'Sora',sans-serif" }}>Delete {selectedRows.size} Trainee{selectedRows.size>1?"s":""}?</h2>
              <p style={{ margin:0,fontSize:14,color:"#64748b",lineHeight:1.6 }}>
                This will permanently delete <strong style={{ color:"#ef4444" }}>{selectedRows.size} selected trainee{selectedRows.size>1?"s":""}</strong>.<br/>All their progress and notes will be lost.
              </p>
            </div>
            <div style={{ display:"flex",gap:12,marginTop:24 }}>
              <button onClick={()=>setBulkDeleteConfirm(false)} style={{ flex:1,padding:"11px",borderRadius:10,border:"2px solid #e2e8f0",background:"#fff",color:"#64748b",fontWeight:700,cursor:"pointer",fontSize:14,fontFamily:"inherit" }}>Cancel</button>
              <button onClick={bulkDelete} style={{ flex:1,padding:"11px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#ef4444,#dc2626)",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:14,boxShadow:"0 4px 16px #ef444444",fontFamily:"inherit" }}>Yes, Delete All</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <DeleteConfirmModal
          trainee={trainees.find(t=>t.id===deleteConfirm)}
          onConfirm={()=>deleteTrainee(deleteConfirm)}
          onClose={()=>setDeleteConfirm(null)}
        />
      )}

      {leavedModal && (
        <LeavedReasonModal
          trainee={leavedModal}
          onConfirm={(reason)=>confirmLeaved(leavedModal.id, reason)}
          onClose={()=>setLeavedModal(null)}
        />
      )}

      {outcomeModal && (
        <OutcomeModal
          trainee={outcomeModal}
          onPick={(outcome)=>confirmOutcome(outcomeModal.id, outcome)}
          onClose={()=>setOutcomeModal(null)}
        />
      )}

      {showAdminPanel && isAdmin && (
        <AdminPanel
          currentUserId={profile?.id}
          onClose={()=>setShowAdminPanel(false)}
          showToast={showToast}
        />
      )}

      {/* ── Toast notification ── */}
      {toast && (
        <div style={{
          position:"fixed", bottom:24, right:24, zIndex:9999,
          padding:"13px 22px",
          background: toast.type === "success"
            ? "linear-gradient(135deg,#22c55e,#16a34a)"
            : "linear-gradient(135deg,#ef4444,#dc2626)",
          color:"#fff", borderRadius:13, fontWeight:700, fontSize:14,
          boxShadow: toast.type === "success" ? "0 8px 28px #22c55e44" : "0 8px 28px #ef444444",
          display:"flex", alignItems:"center", gap:9,
          fontFamily:"'DM Sans',sans-serif",
          animation:"tfToastIn 0.25s ease",
          userSelect:"none",
        }}>
          {toast.type === "success" ? "✅" : "❌"} {toast.msg}
        </div>
      )}
      <style>{`@keyframes tfToastIn{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
    </div>
  );
}

/* ═══════════════════════════════ AUTH WRAPPER ═══════════════════════════════ */
export default function App() {
  const [session,     setSession]     = useState(null);
  const [profile,     setProfile]     = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginError,  setLoginError]  = useState("");
  const [loginBusy,   setLoginBusy]   = useState(false);

  // Fetch (or create) the profile row for this user
  const fetchProfile = async (user) => {
    const { data, error } = await supabase
      .from("profiles").select("*").eq("id", user.id).single();

    if (error && error.code === "PGRST116") {
      // No row yet — create one on first login as 'employee'
      const { data: inserted, error: insErr } = await supabase
        .from("profiles")
        .insert({ id: user.id, email: user.email, role: "employee", is_banned: false })
        .select().single();
      if (insErr) { console.error("profile insert:", insErr); setAuthLoading(false); return; }
      setProfile(inserted);
    } else if (error) {
      console.error("profile fetch:", error);
    } else {
      setProfile(data);
    }
    setAuthLoading(false);
  };

  // Bootstrap + listen for auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) fetchProfile(s.user);
      else setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) fetchProfile(s.user);
      else { setProfile(null); setAuthLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Live-watch this user's profile row. If an admin bans them, sign them out immediately.
  useEffect(() => {
    if (!session?.user?.id) return;
    const channel = supabase
      .channel(`profile-${session.user.id}`)
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${session.user.id}` },
        (payload) => {
          setProfile(payload.new);
          if (payload.new?.is_banned) supabase.auth.signOut();
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session?.user?.id]);

  const login = async (email, password) => {
    setLoginError("");
    setLoginBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoginBusy(false);
    if (error) setLoginError(error.message || "Login failed");
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  // ── Gating ──
  if (authLoading) return (
    <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(160deg,#f8faff,#f0f4ff,#faf5ff)",fontFamily:"'DM Sans',sans-serif",flexDirection:"column",gap:14 }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
      <div style={{ width:46,height:46,borderRadius:"50%",border:"4px solid #e0e7ff",borderTop:"4px solid #6366f1",animation:"spin 0.8s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ fontSize:13,color:"#94a3b8" }}>Checking session…</div>
    </div>
  );

  if (!session)               return <LoginPage onLogin={login} error={loginError} busy={loginBusy}/>;
  if (!profile)               return <LoginPage onLogin={login} error="Profile load failed — contact admin" busy={false}/>;
  if (profile.is_banned)      return <BannedScreen onLogout={logout}/>;

  return <TraineePortal profile={profile} onLogout={logout}/>;
}
