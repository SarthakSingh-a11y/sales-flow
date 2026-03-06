import { useState, useEffect, useMemo } from "react";

const PHASES = [
  { key: "shopifyStore",   label: "Shopify Store Built",          day: 1, short: "Shopify",    emoji: "🛍️",  color: "#f97316", bg: "#fff7ed" },
  { key: "antiGravity",    label: "Anti-Gravity Website Built",   day: 1, short: "A-Gravity",  emoji: "🚀",  color: "#8b5cf6", bg: "#f5f3ff" },
  { key: "videosWatched",  label: "Videos Watched",               day: 1, short: "Videos",     emoji: "🎬",  color: "#ec4899", bg: "#fdf2f8" },
  { key: "interviewPassed",label: "Interview Passed",             day: 2, short: "Interview",  emoji: "🎤",  color: "#6366f1", bg: "#eef2ff" },
  { key: "chatPart1",      label: "Client Chat Analysis Pt.1",   day: 3, short: "Chat P1",    emoji: "💬",  color: "#0ea5e9", bg: "#f0f9ff" },
  { key: "chatPart2",      label: "Client Chat Analysis Pt.2",   day: 4, short: "Chat P2",    emoji: "📊",  color: "#06b6d4", bg: "#ecfeff" },
  { key: "shopifyTheme",   label: "Shopify Theme Research",       day: 5, short: "S. Theme",   emoji: "🎨",  color: "#10b981", bg: "#ecfdf5" },
  { key: "brandedStore",   label: "Branded Store Research",       day: 6, short: "Branded",    emoji: "🏷️",  color: "#f59e0b", bg: "#fffbeb" },
  { key: "portfolioReview",label: "Portfolio Store Review",       day: 7, short: "Portfolio",  emoji: "🖼️",  color: "#ef4444", bg: "#fef2f2" },
  { key: "finalTest",      label: "Final Test Passed (80%+)",     day: 8, short: "Final Test", emoji: "🏆",  color: "#22c55e", bg: "#f0fdf4" },
];

const STATUSES = ["Not Started", "In Progress", "Completed", "Dropped", "Interview Pending"];
const STATUS_CONFIG = {
  "Not Started":       { color: "#ef4444", bg: "#fef2f2", dot: "#ef4444" },
  "In Progress":       { color: "#f59e0b", bg: "#fffbeb", dot: "#f59e0b" },
  "Completed":         { color: "#22c55e", bg: "#f0fdf4", dot: "#22c55e" },
  "Dropped":           { color: "#6b7280", bg: "#f9fafb", dot: "#9ca3af" },
  "Interview Pending": { color: "#8b5cf6", bg: "#f5f3ff", dot: "#8b5cf6" },
};

const EMPTY_PHASES     = Object.fromEntries(PHASES.map(p => [p.key, false]));
const EMPTY_PHASE_NOTES = Object.fromEntries(PHASES.map(p => [p.key, ""]));

const INITIAL_TRAINEES = [
  { id: 1, name: "Ayesha Khan",    contact: "+91-300-1234567", status: "In Progress",       enrollDate: "2026-03-01",
    notes: "Very motivated learner. Completed Day 1 tasks ahead of schedule.",
    phaseNotes: { ...EMPTY_PHASE_NOTES, shopifyStore: "Store looks clean, good niche selection.", antiGravity: "", videosWatched: "Watched all 3 videos, shared summary." },
    phases: { shopifyStore: true, antiGravity: true, videosWatched: true, interviewPassed: false, chatPart1: false, chatPart2: false, shopifyTheme: false, brandedStore: false, portfolioReview: false, finalTest: false } },
  { id: 2, name: "Bilal Ahmed",    contact: "+91-321-9876543", status: "Interview Pending", enrollDate: "2026-03-02",
    notes: "Waiting for interview slot. Has completed all Day 1 tasks.",
    phaseNotes: { ...EMPTY_PHASE_NOTES },
    phases: { shopifyStore: true, antiGravity: true, videosWatched: true, interviewPassed: false, chatPart1: false, chatPart2: false, shopifyTheme: false, brandedStore: false, portfolioReview: false, finalTest: false } },
  { id: 3, name: "Sana Malik",     contact: "+91-333-5551234", status: "Completed",         enrollDate: "2026-02-20",
    notes: "Outstanding performance. Scored 94% on final test. Ready to be assigned a client.",
    phaseNotes: { ...EMPTY_PHASE_NOTES, finalTest: "Scored 94%. Excellent result!" },
    phases: { shopifyStore: true, antiGravity: true, videosWatched: true, interviewPassed: true, chatPart1: true, chatPart2: true, shopifyTheme: true, brandedStore: true, portfolioReview: true, finalTest: true } },
  { id: 4, name: "Usman Tariq",    contact: "+91-345-7778889", status: "Not Started",       enrollDate: "2026-03-05",
    notes: "Just enrolled. Needs orientation call.",
    phaseNotes: { ...EMPTY_PHASE_NOTES },
    phases: { shopifyStore: false, antiGravity: false, videosWatched: false, interviewPassed: false, chatPart1: false, chatPart2: false, shopifyTheme: false, brandedStore: false, portfolioReview: false, finalTest: false } },
  { id: 5, name: "Fatima Zahra",   contact: "+91-312-4445556", status: "In Progress",       enrollDate: "2026-02-28",
    notes: "Struggling with Anti-Gravity website. Needs additional support on Day 1.",
    phaseNotes: { ...EMPTY_PHASE_NOTES, antiGravity: "Stuck on DNS setup — needs guidance." },
    phases: { shopifyStore: true, antiGravity: false, videosWatched: true, interviewPassed: false, chatPart1: false, chatPart2: false, shopifyTheme: false, brandedStore: false, portfolioReview: false, finalTest: false } },
  { id: 6, name: "Hamza Riaz",     contact: "+91-301-6667778", status: "Dropped",           enrollDate: "2026-02-25",
    notes: "Dropped due to personal reasons. May re-enroll next batch.",
    phaseNotes: { ...EMPTY_PHASE_NOTES },
    phases: { shopifyStore: true, antiGravity: false, videosWatched: false, interviewPassed: false, chatPart1: false, chatPart2: false, shopifyTheme: false, brandedStore: false, portfolioReview: false, finalTest: false } },
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

  const save = () => {
    onUpdate(trainee.id, { phases, phaseNotes, notes: generalNotes, status });
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
              <div style={{ fontSize:12, color:"#94a3b8", marginTop:1 }}>
                📱 {trainee.contact} · 📅 Enrolled {new Date(trainee.enrollDate).toLocaleDateString("en-PK",{day:"numeric",month:"short",year:"numeric"})}
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

              {/* Quick nav: all phases mini grid */}
              <div style={{ marginTop:20 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#94a3b8", marginBottom:10, textTransform:"uppercase", letterSpacing:"0.05em" }}>All Phases Overview</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:8 }}>
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
function AddTraineeModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name:"", contact:"", status:"Not Started", enrollDate:new Date().toISOString().slice(0,10), notes:"" });
  const set = (k,v) => setForm(f => ({...f,[k]:v}));
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
        <div style={{ marginBottom:16 }}>
          <label style={{ display:"block",fontSize:13,fontWeight:600,color:"#475569",marginBottom:6 }}>Status</label>
          <select value={form.status} onChange={e=>set("status",e.target.value)} style={{ width:"100%",padding:"10px 14px",border:"2px solid #e2e8f0",borderRadius:10,fontSize:14,color:"#1e293b",outline:"none",boxSizing:"border-box",background:"#fff",fontFamily:"inherit" }}>
            {STATUSES.map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ marginBottom:24 }}>
          <label style={{ display:"block",fontSize:13,fontWeight:600,color:"#475569",marginBottom:6 }}>Notes</label>
          <textarea value={form.notes} onChange={e=>set("notes",e.target.value)} rows={3} placeholder="Any notes about this trainee..." style={{ width:"100%",padding:"10px 14px",border:"2px solid #e2e8f0",borderRadius:10,fontSize:14,color:"#1e293b",outline:"none",boxSizing:"border-box",resize:"vertical",fontFamily:"inherit" }}/>
        </div>
        <div style={{ display:"flex",gap:12 }}>
          <button onClick={onClose} style={{ flex:1,padding:"11px",borderRadius:10,border:"2px solid #e2e8f0",background:"#fff",color:"#64748b",fontWeight:600,cursor:"pointer",fontSize:14,fontFamily:"inherit" }}>Cancel</button>
          <button onClick={()=>{ if(form.name.trim()){ onAdd({...form,phases:{...EMPTY_PHASES},phaseNotes:{...EMPTY_PHASE_NOTES}}); onClose(); }}} style={{ flex:2,padding:"11px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:14,fontFamily:"inherit",boxShadow:"0 4px 16px #6366f144" }}>+ Add Trainee</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Day Messages Panel ─── */
function DayMessagesPanel({ dayMessages, setDayMessages, trainees, onClose }) {
  const [selectedDay, setSelectedDay] = useState(1);
  const [editing, setEditing]         = useState(false);
  const [draft, setDraft]             = useState("");
  const [copied, setCopied]           = useState(null);

  const dayLabels = { 1:"Day 1 — Shopify + Videos", 2:"Day 2 — Interview", 3:"Day 3 — Chat Analysis P1", 4:"Day 4 — Chat Analysis P2", 5:"Day 5 — Shopify Theme Research", 6:"Day 6 — Branded Store Research", 7:"Day 7 — Portfolio Review", 8:"Day 8 — Final Test" };
  const currentMsg = dayMessages[selectedDay] || "";

  const getPersonalized = (msg, trainee) => msg.replace(/{name}/g, trainee ? trainee.name.split(" ")[0] : "{name}");
  const handleCopy = (msg, trainee) => { navigator.clipboard.writeText(getPersonalized(msg,trainee)).then(()=>{ setCopied(trainee?trainee.id:"generic"); setTimeout(()=>setCopied(null),2000); }); };
  const handleWhatsApp = (msg, trainee) => { const text=encodeURIComponent(getPersonalized(msg,trainee)); const number=trainee?trainee.contact.replace(/[^0-9]/g,""):""; window.open(`https://wa.me/${number}?text=${text}`,"_blank"); };

  const PHASE_KEYS = ["shopifyStore","antiGravity","videosWatched","interviewPassed","chatPart1","chatPart2","shopifyTheme","brandedStore","portfolioReview","finalTest"];
  const PHASE_DAYS_ARR = [1,1,1,2,3,4,5,6,7,8];
  const getDayOfTrainee = (t) => { let last=0; PHASE_KEYS.forEach((k,i)=>{ if(t.phases&&t.phases[k]) last=PHASE_DAYS_ARR[i]; }); return last===0?1:last; };
  const traineesByDay = trainees.filter(t => getDayOfTrainee(t)===selectedDay && t.status!=="Completed" && t.status!=="Dropped");

  return (
    <div style={{ position:"fixed",inset:0,background:"#0009",zIndex:200,display:"flex",alignItems:"stretch",justifyContent:"flex-end" }} onClick={onClose}>
      <div style={{ width:620,maxWidth:"96vw",background:"#fff",boxShadow:"-8px 0 48px #0003",display:"flex",flexDirection:"column",fontFamily:"'DM Sans',sans-serif" }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:"20px 24px",borderBottom:"2px solid #e0e7ff",background:"linear-gradient(135deg,#eef2ff,#ede9fe)",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div>
            <div style={{ fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:18,color:"#1e293b" }}>📨 Day Message Templates</div>
            <div style={{ fontSize:12,color:"#6366f1",fontWeight:600,marginTop:2 }}>Write messages per training day · Use {"{name}"} for personalization</div>
          </div>
          <button onClick={onClose} style={{ width:34,height:34,borderRadius:8,border:"none",background:"#fff",cursor:"pointer",fontSize:18,color:"#64748b",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px #0001" }}>×</button>
        </div>
        <div style={{ display:"flex",flex:1,overflow:"hidden" }}>
          <div style={{ width:160,borderRight:"1.5px solid #e8eaf6",background:"#fafbff",overflowY:"auto",padding:"12px 8px",flexShrink:0 }}>
            <div style={{ fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8,paddingLeft:8 }}>Select Day</div>
            {[1,2,3,4,5,6,7,8].map(d => {
              const cnt = trainees.filter(t=>getDayOfTrainee(t)===d&&t.status!=="Completed"&&t.status!=="Dropped").length;
              return (
                <button key={d} onClick={()=>{setSelectedDay(d);setEditing(false);}} style={{ width:"100%",textAlign:"left",padding:"10px 12px",borderRadius:9,border:"none",cursor:"pointer",marginBottom:4,background:selectedDay===d?"linear-gradient(135deg,#6366f1,#8b5cf6)":"transparent",color:selectedDay===d?"#fff":"#475569",fontWeight:selectedDay===d?700:500,fontFamily:"inherit",fontSize:13,transition:"all 0.15s" }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                    <span>Day {d}</span>
                    {cnt>0&&<span style={{ background:selectedDay===d?"rgba(255,255,255,0.3)":"#eef2ff",color:selectedDay===d?"#fff":"#6366f1",borderRadius:99,fontSize:10,fontWeight:700,padding:"1px 6px" }}>{cnt}</span>}
                  </div>
                </button>
              );
            })}
          </div>
          <div style={{ flex:1,overflowY:"auto",padding:20,display:"flex",flexDirection:"column",gap:16 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <div>
                <div style={{ fontWeight:700,fontSize:15,color:"#1e293b" }}>{dayLabels[selectedDay]}</div>
                <div style={{ fontSize:12,color:"#94a3b8",marginTop:2 }}>{traineesByDay.length>0?`${traineesByDay.length} active trainee(s) on this day`:"No active trainees on this day"}</div>
              </div>
              {!editing ? <button onClick={()=>{setEditing(true);setDraft(currentMsg);}} style={{ padding:"7px 16px",borderRadius:8,border:"1.5px solid #c7d2fe",background:"#eef2ff",color:"#6366f1",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>✏ {currentMsg?"Edit":"Write"} Message</button>
              : <div style={{ display:"flex",gap:8 }}><button onClick={()=>{setDayMessages(m=>({...m,[selectedDay]:draft}));setEditing(false);}} style={{ padding:"7px 16px",borderRadius:8,border:"none",background:"#22c55e",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>💾 Save</button><button onClick={()=>setEditing(false)} style={{ padding:"7px 16px",borderRadius:8,border:"1.5px solid #e2e8f0",background:"#fff",color:"#64748b",fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>Cancel</button></div>}
            </div>
            <div style={{ background:"#f8faff",borderRadius:12,border:"1.5px solid #e0e7ff",overflow:"hidden" }}>
              <div style={{ padding:"8px 14px",background:"linear-gradient(135deg,#eef2ff,#ede9fe)",borderBottom:"1px solid #e0e7ff",fontSize:11,fontWeight:700,color:"#6366f1",display:"flex",alignItems:"center",gap:6 }}>
                💬 Message Template <span style={{ fontWeight:400,color:"#94a3b8",marginLeft:4 }}>· Use {"{name}"} to auto-personalize</span>
              </div>
              {editing ? <textarea value={draft} onChange={e=>setDraft(e.target.value)} rows={8} placeholder={"Write your Day "+selectedDay+" message here..."} style={{ width:"100%",padding:"14px",border:"none",fontSize:13,color:"#1e293b",outline:"none",resize:"vertical",fontFamily:"inherit",background:"#fff",boxSizing:"border-box",lineHeight:1.7 }}/>
              : currentMsg ? <div><pre style={{ margin:0,padding:"14px",fontSize:13,color:"#374151",whiteSpace:"pre-wrap",fontFamily:"inherit",lineHeight:1.7,background:"#fff" }}>{currentMsg}</pre><div style={{ padding:"10px 14px",borderTop:"1px solid #e0e7ff" }}><button onClick={()=>handleCopy(currentMsg,null)} style={{ padding:"6px 14px",borderRadius:7,border:"1.5px solid #e2e8f0",background:"#fff",color:"#64748b",fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>{copied==="generic"?"✅ Copied!":"📋 Copy Template"}</button></div></div>
              : <div style={{ padding:24,textAlign:"center",color:"#94a3b8",fontSize:13 }}>No message written yet for Day {selectedDay}.<br/><span style={{ color:"#6366f1",fontWeight:600,cursor:"pointer" }} onClick={()=>{setEditing(true);setDraft("");}}>Click "Write Message" →</span></div>}
            </div>
            {currentMsg&&traineesByDay.length>0&&(
              <div>
                <div style={{ fontSize:13,fontWeight:700,color:"#1e293b",marginBottom:10 }}>🎯 Send to Active Trainees on Day {selectedDay}</div>
                <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                  {traineesByDay.map(t=>(
                    <div key={t.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:10,border:"1.5px solid #e8eaf6",background:"#fff" }}>
                      <div style={{ width:34,height:34,borderRadius:9,flexShrink:0,background:"linear-gradient(135deg,#eef2ff,#ede9fe)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,color:"#6366f1" }}>{t.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}</div>
                      <div style={{ flex:1 }}><div style={{ fontWeight:600,fontSize:13,color:"#1e293b" }}>{t.name}</div><div style={{ fontSize:11,color:"#94a3b8" }}>{t.contact}</div></div>
                      <div style={{ fontStyle:"italic",fontSize:12,color:"#94a3b8",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>"{getPersonalized(currentMsg,t).slice(0,40)}..."</div>
                      <div style={{ display:"flex",gap:6,flexShrink:0 }}>
                        <button onClick={()=>handleCopy(currentMsg,t)} style={{ padding:"5px 12px",borderRadius:7,border:"1.5px solid #e2e8f0",background:"#fff",color:"#64748b",fontWeight:600,fontSize:11,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap" }}>{copied===t.id?"✅ Copied!":"📋 Copy"}</button>
                        <button onClick={()=>handleWhatsApp(currentMsg,t)} style={{ padding:"5px 12px",borderRadius:7,border:"none",background:"linear-gradient(135deg,#25d366,#128c7e)",color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap" }}>💬 WhatsApp</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
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

/* ─── STAT CARDS ─── */
const STAT_CARDS = [
  { key:"total",            label:"Total Trainees",    color:"#6366f1", bg:"linear-gradient(135deg,#eef2ff,#e0e7ff)", icon:"👥" },
  { key:"Interview Pending",label:"Interview Pending", color:"#8b5cf6", bg:"linear-gradient(135deg,#f5f3ff,#ede9fe)", icon:"🎤" },
  { key:"In Progress",      label:"In Progress",       color:"#f59e0b", bg:"linear-gradient(135deg,#fffbeb,#fef3c7)", icon:"⚡" },
  { key:"Completed",        label:"Completed",         color:"#22c55e", bg:"linear-gradient(135deg,#f0fdf4,#dcfce7)", icon:"✅" },
  { key:"Dropped",          label:"Dropped",           color:"#ef4444", bg:"linear-gradient(135deg,#fef2f2,#fee2e2)", icon:"🚫" },
];

const thStyle = { fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.04em" };

/* ═══════════════════════════════ MAIN PORTAL ═══════════════════════════════ */
export default function TraineePortal() {
  const [trainees, setTrainees] = useState(() => {
    try {
      const s = localStorage.getItem("trainee_portal_data");
      if (s) {
        // Migrate +92 → +91 if old data exists
        const parsed = JSON.parse(s.replace(/\+92/g, "+91"));
        return parsed;
      }
      return INITIAL_TRAINEES;
    } catch { return INITIAL_TRAINEES; }
  });
  const [showAdd,        setShowAdd]        = useState(false);
  const [showMessages,   setShowMessages]   = useState(false);
  const [notesModal,     setNotesModal]     = useState(null);   // trainee object
  const [deleteConfirm,  setDeleteConfirm]  = useState(null);   // trainee id
  const [filterName,     setFilterName]     = useState("All");
  const [filterStatus,   setFilterStatus]   = useState("All");
  const [filterPhase,    setFilterPhase]    = useState("All");
  const [search,         setSearch]         = useState("");
  const [selectedRows,   setSelectedRows]   = useState(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [dayMessages,    setDayMessages]    = useState(() => {
    try { const s=localStorage.getItem("trainee_day_messages"); if(s) return JSON.parse(s); } catch {}
    return {
      1:"Hi {name}! 👋 Welcome to Day 1 of the Sales Training Program. Today your tasks are:\n1️⃣ Build your Shopify Store\n2️⃣ Build your Anti-Gravity Website\n3️⃣ Watch the Day 1 Videos\n\nLet me know once done! 💪",
      2:"Hi {name}! 🎤 It's Day 2 — Interview Day!\n\nYour interview is scheduled. Please be prepared and confident. We believe in you!\n\nAll the best! 🌟",
      3:"Hi {name}! 📊 Day 3 — Client Chat Analysis Part 1.\n\nStudy the provided client chat examples carefully. Note the tone, language, and approach used.\n\nShare your analysis when ready! ✅",
      4:"Hi {name}! 💬 Day 4 — Client Chat Analysis Part 2.\n\nComplete the second part of the chat analysis and submit your findings.\n\nYou are doing great! 🔥",
      5:"Hi {name}! 🛍️ Day 5 — Shopify Theme Research.\n\nResearch and document the best Shopify themes for different niches.\n\nSend your research report today! 📋",
      6:"Hi {name}! 🏷️ Day 6 — Branded Store Research.\n\nAnalyze 3 successful branded Shopify stores.\n\nLooking forward to your report! 🚀",
      7:"Hi {name}! 🖼️ Day 7 — Portfolio Store Review.\n\nReview your portfolio store and make any final improvements.\n\nShare the link when done! 🔗",
      8:"Hi {name}! 🏆 Final Test Time!\n\nYou need to score 80%+ to pass. Take your time and trust your training.\n\nGood luck! 🎯",
    };
  });

  useEffect(() => { try { localStorage.setItem("trainee_portal_data",JSON.stringify(trainees)); } catch {} }, [trainees]);
  useEffect(() => { try { localStorage.setItem("trainee_day_messages",JSON.stringify(dayMessages)); } catch {} }, [dayMessages]);

  const stats = useMemo(() => {
    const c={total:trainees.length}; STATUSES.forEach(s=>{c[s]=trainees.filter(t=>t.status===s).length;}); return c;
  }, [trainees]);

  const filtered = useMemo(() => trainees.filter(t => {
    if (filterName!=="All" && t.name!==filterName) return false;
    if (filterStatus!=="All" && t.status!==filterStatus) return false;
    if (filterPhase!=="All") { const day=parseInt(filterPhase.replace("Day ","")); if(getPhaseDay(t.phases)!==day) return false; }
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [trainees, filterName, filterStatus, filterPhase, search]);

  const updatePhase    = (id, key, val) => setTrainees(ts => ts.map(t => t.id===id ? {...t, phases:{...t.phases,[key]:val}} : t));
  const addTrainee     = (data) => setTrainees(ts => [...ts, {...data, id:Date.now()}]);
  const deleteTrainee  = (id)  => { setTrainees(ts=>ts.filter(t=>t.id!==id)); setDeleteConfirm(null); };
  const bulkDelete     = ()    => { setTrainees(ts=>ts.filter(t=>!selectedRows.has(t.id))); setSelectedRows(new Set()); setBulkDeleteConfirm(false); };
  const updateTrainee  = (id, updates) => setTrainees(ts => ts.map(t => t.id===id ? {...t,...updates} : t));

  const uniqueNames = ["All", ...trainees.map(t=>t.name)];
  const uniqueDays  = ["All", ...Array.from(new Set(PHASES.map(p=>`Day ${p.day}`))).sort()];

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
        <div style={{ display:"flex",gap:10 }}>
          <button onClick={()=>setShowMessages(true)} style={{ display:"flex",alignItems:"center",gap:8,background:"linear-gradient(135deg,#0ea5e9,#06b6d4)",color:"#fff",border:"none",borderRadius:10,padding:"9px 20px",fontWeight:700,fontSize:14,cursor:"pointer",boxShadow:"0 4px 16px #0ea5e933",fontFamily:"inherit" }}>📨 Day Messages</button>
          <button onClick={()=>setShowAdd(true)} style={{ display:"flex",alignItems:"center",gap:8,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",border:"none",borderRadius:10,padding:"9px 20px",fontWeight:700,fontSize:14,cursor:"pointer",boxShadow:"0 4px 16px #6366f133",fontFamily:"inherit" }}><span style={{ fontSize:18,lineHeight:1 }}>+</span> New Trainee</button>
        </div>
      </div>

      <div style={{ padding:"28px 32px" }}>
        {/* ── Stats ── */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:16,marginBottom:28 }}>
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
          {[{label:"Trainee",value:filterName,set:setFilterName,options:uniqueNames},{label:"Status",value:filterStatus,set:setFilterStatus,options:["All",...STATUSES]},{label:"Phase/Day",value:filterPhase,set:setFilterPhase,options:uniqueDays}].map(({label,value,set,options})=>(
            <select key={label} value={value} onChange={e=>set(e.target.value)} style={{ padding:"8px 14px",border:"1.5px solid #e2e8f0",borderRadius:9,fontSize:13,color:"#374151",background:"#f8fafc",outline:"none",fontFamily:"inherit",fontWeight:500,cursor:"pointer",minWidth:150 }}>
              {options.map(o=><option key={o} value={o}>{o==="All"?`All ${label}s`:o}</option>)}
            </select>
          ))}
          <div style={{ flex:1,minWidth:200,position:"relative" }}>
            <span style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#94a3b8",fontSize:16 }}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search trainee name..." style={{ width:"100%",padding:"8px 14px 8px 36px",border:"1.5px solid #e2e8f0",borderRadius:9,fontSize:13,color:"#374151",background:"#f8fafc",outline:"none",fontFamily:"inherit",boxSizing:"border-box" }}/>
          </div>
          <div style={{ fontSize:13,color:"#94a3b8",fontWeight:500,marginLeft:"auto" }}>
            Showing <strong style={{ color:"#6366f1" }}>{filtered.length}</strong> of {trainees.length} trainees
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
              <button onClick={()=>setBulkDeleteConfirm(true)} style={{
                padding:"8px 18px", borderRadius:8, border:"none",
                background:"linear-gradient(135deg,#ef4444,#dc2626)",
                color:"#fff", fontWeight:700, fontSize:13,
                cursor:"pointer", fontFamily:"inherit",
                boxShadow:"0 4px 14px #ef444433",
                display:"flex", alignItems:"center", gap:6,
              }}>🗑 Delete Selected</button>
            </div>
          </div>
        )}

        {/* ── Table ── */}
        <div style={{ background:"#fff",borderRadius:18,border:"1.5px solid #e8eaf6",overflow:"hidden",boxShadow:"0 4px 24px #0000080a" }}>
          {/* Header */}
          <div style={{ display:"grid",gridTemplateColumns:"40px 2fr 1.6fr 100px 90px repeat(10,64px)",padding:"12px 20px",background:"linear-gradient(135deg,#f8faff,#f0f4ff)",borderBottom:"2px solid #e8eaf6",gap:8,alignItems:"center" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"center" }}>
              <input type="checkbox"
                checked={filtered.length>0 && filtered.every(t=>selectedRows.has(t.id))}
                onChange={e=>{ if(e.target.checked) setSelectedRows(new Set(filtered.map(t=>t.id))); else setSelectedRows(new Set()); }}
                style={{ width:16,height:16,cursor:"pointer",accentColor:"#6366f1" }}
              />
            </div>
            <div style={thStyle}>Trainee Name</div>
            <div style={thStyle}>Contact</div>
            <div style={{ ...thStyle, textAlign:"center" }}>Status</div>
            <div style={{ ...thStyle, textAlign:"center" }}>Phase</div>
            {PHASES.map(p=>(
              <div key={p.key} title={p.label} style={{ ...thStyle,textAlign:"center",fontSize:10,lineHeight:1.3,color:p.color }}>{p.short}</div>
            ))}
          </div>

          {/* Rows */}
          {filtered.length===0 && (
            <div style={{ textAlign:"center",padding:"48px",color:"#94a3b8",fontSize:15 }}>No trainees found. Try adjusting your filters.</div>
          )}
          {filtered.map((trainee,idx) => {
            const overdue       = isOverdue(trainee);
            const completedCount= getCompletedCount(trainee.phases);
            const currentDay    = getPhaseDay(trainee.phases);
            const cfg           = STATUS_CONFIG[trainee.status] || STATUS_CONFIG["Not Started"];
            const rowBg         = overdue ? "#fff9f9" : idx%2===0 ? "#fff" : "#fafbff";

            return (
              <div key={trainee.id} style={{
                display:"grid", gridTemplateColumns:"40px 2fr 1.6fr 100px 90px repeat(10,64px)",
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
                    {overdue && <div style={{ fontSize:10,color:"#ef4444",fontWeight:600 }}>⚠ Overdue</div>}
                  </div>
                </div>

                {/* Contact */}
                <div style={{ fontSize:13,color:"#64748b",display:"flex",alignItems:"center",gap:6 }}>📱 {trainee.contact}</div>

                {/* Status — colored badge, NO dropdown */}
                <div style={{ display:"flex",alignItems:"center",justifyContent:"center" }}>
                  <div style={{
                    display:"flex", alignItems:"center", gap:5,
                    background: cfg.bg, color: cfg.color,
                    border:`1.5px solid ${cfg.color}44`,
                    borderRadius:7, padding:"4px 8px",
                    fontSize:10, fontWeight:700,
                  }}>
                    <span style={{ width:7,height:7,borderRadius:"50%",background:cfg.dot,flexShrink:0 }}/>
                    {trainee.status === "Interview Pending" ? "Interview…" :
                     trainee.status === "Not Started" ? "Not Started" :
                     trainee.status}
                  </div>
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
      </div>

      {/* ── Modals ── */}
      {showAdd && <AddTraineeModal onClose={()=>setShowAdd(false)} onAdd={addTrainee}/>}
      {showMessages && <DayMessagesPanel dayMessages={dayMessages} setDayMessages={setDayMessages} trainees={trainees} onClose={()=>setShowMessages(false)}/>}
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
    </div>
  );
}
