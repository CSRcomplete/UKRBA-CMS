"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Briefcase,
  Plus,
  Search,
  Download,
  Trash2,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Paperclip,
  MessageSquare,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  Filter,
  BarChart3,
  Pencil,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  getCandidates,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  addCandidateActivity,
  type CandidateItem,
  type ActivityType,
} from "@/actions/recruitment/recruitment";

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGES: string[] = [
  "All",
  "Applied",
  "Shortlisted",
  "Interview Scheduled",
  "Interviewed",
  "Accepted",
  "Contract Sent",
  "Contract Signed",
  "Rejected",
  "Withdrawn",
];

const POSITION_TYPES = ["Full-time", "Part-time", "Contract", "Volunteer"];
const SOURCES = ["All", "Manual", "Wix Website", "Indeed", "LinkedIn", "Referral", "Other"];
const ACTIVITY_TYPES: { label: string; value: ActivityType }[] = [
  { label: "📝 Note", value: "note" },
  { label: "📞 Call", value: "call" },
  { label: "✉️ Email", value: "email" },
  { label: "🎤 Interview", value: "interview" },
  { label: "📄 Contract", value: "contract" },
  { label: "💬 Other", value: "other" },
];

const CONTRACT_STATUSES = ["None", "Sent", "Signed"];

// ─── Stage badge helper ───────────────────────────────────────────────────────

function stageBadge(status: string) {
  const map: Record<string, string> = {
    Applied: "bg-slate-500 text-white",
    Shortlisted: "bg-blue-600 text-white",
    "Interview Scheduled": "bg-amber-500 text-white",
    Interviewed: "bg-purple-600 text-white",
    Accepted: "bg-green-600 text-white",
    "Contract Sent": "bg-cyan-600 text-white",
    "Contract Signed": "bg-emerald-700 text-white",
    Rejected: "bg-red-600 text-white",
    Withdrawn: "bg-orange-500 text-white",
  };
  return (
    <Badge className={`${map[status] ?? "bg-muted text-foreground"} text-[11px] font-semibold`}>
      {status}
    </Badge>
  );
}

function contractBadge(status: string) {
  if (status === "Signed") return <Badge className="bg-emerald-700 text-white">✅ Signed</Badge>;
  if (status === "Sent") return <Badge className="bg-cyan-600 text-white">📤 Sent</Badge>;
  return <Badge variant="outline">None</Badge>;
}

function activityIcon(type: string) {
  const icons: Record<string, React.ReactNode> = {
    call: <Phone className="h-3.5 w-3.5 text-blue-500" />,
    email: <Mail className="h-3.5 w-3.5 text-indigo-500" />,
    interview: <Calendar className="h-3.5 w-3.5 text-purple-500" />,
    contract: <FileText className="h-3.5 w-3.5 text-cyan-600" />,
    note: <MessageSquare className="h-3.5 w-3.5 text-slate-500" />,
    other: <Clock className="h-3.5 w-3.5 text-orange-400" />,
  };
  return icons[type] ?? icons.note;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function RecruitmentClient() {
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CandidateItem | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // Add candidate modal
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Add candidate form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [position, setPosition] = useState("");
  const [positionType, setPositionType] = useState("Full-time");
  const [status, setStatus] = useState("Applied");
  const [source, setSource] = useState("Manual");
  const [notes, setNotes] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  // Activity log
  const [activityContent, setActivityContent] = useState("");
  const [activityType, setActivityType] = useState<ActivityType>("note");
  const [loggingActivity, setLoggingActivity] = useState(false);

  // Interview / contract inline edit
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewNotes, setInterviewNotes] = useState("");
  const [interviewedBy, setInterviewedBy] = useState("");
  const [contractStatus, setContractStatus] = useState("None");
  const [contractSentAt, setContractSentAt] = useState("");
  const [contractSignedAt, setContractSignedAt] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCandidates({
        status: stageFilter !== "All" ? stageFilter : undefined,
        source: sourceFilter !== "All" ? sourceFilter : undefined,
      });
      setCandidates(res.candidates);
    } catch {
      // Error
    } finally {
      setLoading(false);
    }
  }, [stageFilter, sourceFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // When panel candidate changes, sync inline edit fields
  useEffect(() => {
    if (selected) {
      setInterviewDate(selected.interviewDate ? selected.interviewDate.slice(0, 16) : "");
      setInterviewNotes(selected.interviewNotes ?? "");
      setInterviewedBy(selected.interviewedBy ?? "");
      setContractStatus(selected.contractStatus);
      setContractSentAt(selected.contractSentAt ? selected.contractSentAt.slice(0, 10) : "");
      setContractSignedAt(selected.contractSignedAt ? selected.contractSignedAt.slice(0, 10) : "");
    }
  }, [selected]);

  const filteredCandidates = candidates.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.position.toLowerCase().includes(q) ||
      c.status.toLowerCase().includes(q)
    );
  });

  // ── Stats ──────────────────────────────────────────────────────────────────
  const total = candidates.length;
  const inInterview = candidates.filter((c) =>
    ["Interview Scheduled", "Interviewed"].includes(c.status)
  ).length;
  const accepted = candidates.filter((c) => c.status === "Accepted").length;
  const signed = candidates.filter((c) => c.status === "Contract Signed").length;

  // ── Open candidate panel ───────────────────────────────────────────────────
  const openPanel = (c: CandidateItem) => {
    setSelected(c);
    setEditingSection(null);
    setPanelOpen(true);
  };

  // ── Reset add form ─────────────────────────────────────────────────────────
  const resetForm = () => {
    setFirstName(""); setLastName(""); setEmail(""); setPhone("");
    setAddress(""); setPosition(""); setPositionType("Full-time");
    setStatus("Applied"); setSource("Manual"); setNotes(""); setCvFile(null);
    setFormError(null);
  };

  // ── Add candidate ──────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !position.trim()) {
      setFormError("Please fill in: First Name, Last Name, Email, and Position.");
      return;
    }
    setSubmitting(true); setFormError(null);
    try {
      let cvPayload = undefined;
      if (cvFile) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1] || "");
          reader.onerror = reject;
          reader.readAsDataURL(cvFile);
        });
        cvPayload = { name: cvFile.name, content: base64, contentType: cvFile.type, size: cvFile.size };
      }
      await createCandidate({ firstName, lastName, email, phone, address, position, positionType, status, source, notes, cv: cvPayload });
      setAddOpen(false); resetForm(); fetchData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add candidate.");
    } finally { setSubmitting(false); }
  };

  // ── Quick stage update ─────────────────────────────────────────────────────
  const handleStageChange = async (id: string, newStatus: string) => {
    await updateCandidate(id, { status: newStatus });
    fetchData();
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status: newStatus } : prev);
  };

  // ── Save interview / contract section ──────────────────────────────────────
  const saveSection = async (section: string) => {
    if (!selected) return;
    if (section === "interview") {
      await updateCandidate(selected.id, { interviewDate, interviewNotes, interviewedBy });
      setSelected((prev) => prev ? { ...prev, interviewDate: interviewDate || null, interviewNotes, interviewedBy } : prev);
    }
    if (section === "contract") {
      await updateCandidate(selected.id, { contractStatus, contractSentAt, contractSignedAt });
      setSelected((prev) => prev ? { ...prev, contractStatus, contractSentAt: contractSentAt || null, contractSignedAt: contractSignedAt || null } : prev);
    }
    setEditingSection(null);
    fetchData();
  };

  // ── Log activity ───────────────────────────────────────────────────────────
  const handleLogActivity = async () => {
    if (!selected || !activityContent.trim()) return;
    setLoggingActivity(true);
    try {
      await addCandidateActivity(selected.id, activityContent, activityType);
      setActivityContent("");
      // Refresh selected candidate's activities
      const res = await getCandidates({});
      const refreshed = res.candidates.find((c) => c.id === selected.id);
      if (refreshed) setSelected(refreshed);
      setCandidates(res.candidates);
    } catch { /* err */ } finally { setLoggingActivity(false); }
  };

  // ── Delete candidate ───────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this candidate? This cannot be undone.")) return;
    await deleteCandidate(id);
    setPanelOpen(false); setSelected(null); fetchData();
  };

  // ─────────────────────────────────────────────────────────────────── Render

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-[1600px] mx-auto">

      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            Recruitment Centre
          </h1>
          <p className="text-sm text-muted-foreground">
            One-stop pipeline for all candidates — from CV receipt to signed contract.
          </p>
        </div>
        <Button onClick={() => { resetForm(); setAddOpen(true); }} className="gap-1.5 font-semibold">
          <Plus className="h-4 w-4" /> Add Candidate
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Applicants", value: total, icon: <User className="h-5 w-5 text-primary" />, color: "border-primary/30 bg-primary/5" },
          { label: "In Interview", value: inInterview, icon: <Calendar className="h-5 w-5 text-amber-500" />, color: "border-amber-300/40 bg-amber-50/20 dark:bg-amber-950/10" },
          { label: "Accepted", value: accepted, icon: <CheckCircle2 className="h-5 w-5 text-green-600" />, color: "border-green-300/40 bg-green-50/20 dark:bg-green-950/10" },
          { label: "Contracts Signed", value: signed, icon: <FileText className="h-5 w-5 text-emerald-700" />, color: "border-emerald-300/40 bg-emerald-50/20 dark:bg-emerald-950/10" },
        ].map((s) => (
          <Card key={s.label} className={`border ${s.color}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-background border">{s.icon}</div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        {/* Stage filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap flex-1">
          {STAGES.map((s) => (
            <Button
              key={s}
              variant={stageFilter === s ? "default" : "outline"}
              size="sm"
              className="text-xs h-7 rounded-full"
              onClick={() => setStageFilter(s)}
            >
              {s}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded-md border border-input bg-transparent px-2 py-1 text-xs h-8 shadow-sm"
          >
            {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidates..."
              className="pl-8 h-8 text-xs w-52"
            />
          </div>
        </div>
      </div>

      {/* Candidate List */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground">Loading candidates...</div>
      ) : filteredCandidates.length === 0 ? (
        <div className="p-12 text-center border rounded-xl bg-card">
          <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
          <h3 className="text-base font-semibold">No candidates found</h3>
          <p className="text-xs text-muted-foreground mt-1">Add your first candidate or adjust your filters.</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Candidate</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Position</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Stage</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Contract</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden xl:table-cell">Source</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden xl:table-cell">Applied</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">CV</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredCandidates.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => openPanel(c)}
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold">{c.firstName} {c.lastName}</div>
                    <div className="text-xs text-muted-foreground">{c.email}</div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="font-medium text-xs">{c.position}</div>
                    <div className="text-[11px] text-muted-foreground">{c.positionType}</div>
                  </td>
                  <td className="px-4 py-3">
                    {stageBadge(c.status)}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {contractBadge(c.contractStatus)}
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell text-xs text-muted-foreground">
                    {c.source}
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell text-xs text-muted-foreground">
                    {format(parseISO(c.createdAt), "dd MMM yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    {c.cvUrl ? (
                      <a
                        href={c.cvUrl}
                        download={c.cvFileName || "cv"}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold"
                      >
                        <Download className="h-3.5 w-3.5" />
                        CV
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Candidate Detail Panel ─────────────────────────────────────────── */}
      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[600px] overflow-y-auto p-0">
          {selected && (
            <>
              <SheetHeader className="px-6 py-4 border-b bg-muted/30">
                <div className="flex items-start justify-between">
                  <div>
                    <SheetTitle className="text-xl">
                      {selected.firstName} {selected.lastName}
                    </SheetTitle>
                    <p className="text-sm text-muted-foreground">{selected.position} · {selected.positionType}</p>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      {stageBadge(selected.status)}
                      {contractBadge(selected.contractStatus)}
                      <Badge variant="outline" className="text-[10px]">{selected.source}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(selected.id)}
                      title="Delete Candidate"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </SheetHeader>

              <div className="p-6 space-y-6">
                {/* Quick Stage Picker */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pipeline Stage</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {STAGES.filter((s) => s !== "All").map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStageChange(selected.id, s)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all
                          ${selected.status === s
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground hover:border-primary"
                          }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contact Details */}
                <div className="space-y-2 rounded-xl border p-4 bg-card">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5"><User className="h-4 w-4 text-primary" /> Contact Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /><span>{selected.email}</span></div>
                    {selected.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /><span>{selected.phone}</span></div>}
                    {selected.address && <div className="flex items-center gap-2 col-span-2"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /><span>{selected.address}</span></div>}
                  </div>
                </div>

                {/* CV */}
                {selected.cvUrl && (
                  <div className="rounded-xl border p-4 bg-card flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Paperclip className="h-4 w-4 text-primary" />
                      <span className="font-medium">{selected.cvFileName || "CV Document"}</span>
                      {selected.cvSize && (
                        <span className="text-xs text-muted-foreground">({Math.round(selected.cvSize / 1024)} KB)</span>
                      )}
                    </div>
                    <a
                      href={selected.cvUrl}
                      download={selected.cvFileName || "cv"}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <Download className="h-3.5 w-3.5" /> Download CV
                    </a>
                  </div>
                )}

                {/* Interview Section */}
                <div className="rounded-xl border p-4 bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold flex items-center gap-1.5"><Calendar className="h-4 w-4 text-amber-500" /> Interview Details</h3>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setEditingSection(editingSection === "interview" ? null : "interview")}>
                      <Pencil className="h-3 w-3" /> {editingSection === "interview" ? "Cancel" : "Edit"}
                    </Button>
                  </div>

                  {editingSection === "interview" ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Interview Date & Time</Label>
                          <Input type="datetime-local" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} className="text-xs h-8" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Interviewed By</Label>
                          <Input value={interviewedBy} onChange={(e) => setInterviewedBy(e.target.value)} placeholder="Interviewer name" className="text-xs h-8" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Interview Notes</Label>
                        <Textarea value={interviewNotes} onChange={(e) => setInterviewNotes(e.target.value)} placeholder="Notes from the interview..." rows={3} className="text-xs" />
                      </div>
                      <Button size="sm" className="text-xs h-7" onClick={() => saveSection("interview")}>Save Interview Details</Button>
                    </div>
                  ) : (
                    <div className="text-xs space-y-1 text-muted-foreground">
                      {selected.interviewDate ? (
                        <>
                          <p><span className="font-medium text-foreground">Date:</span> {format(parseISO(selected.interviewDate), "PPpp")}</p>
                          {selected.interviewedBy && <p><span className="font-medium text-foreground">Interviewer:</span> {selected.interviewedBy}</p>}
                          {selected.interviewNotes && <p className="mt-1 italic">"{selected.interviewNotes}"</p>}
                        </>
                      ) : (
                        <p className="italic">No interview details recorded. Click Edit to add.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Contract Section */}
                <div className="rounded-xl border p-4 bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold flex items-center gap-1.5"><FileText className="h-4 w-4 text-cyan-600" /> Contract Status</h3>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setEditingSection(editingSection === "contract" ? null : "contract")}>
                      <Pencil className="h-3 w-3" /> {editingSection === "contract" ? "Cancel" : "Edit"}
                    </Button>
                  </div>

                  {editingSection === "contract" ? (
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Contract Status</Label>
                        <select
                          value={contractStatus}
                          onChange={(e) => setContractStatus(e.target.value)}
                          className="w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs h-8"
                        >
                          {CONTRACT_STATUSES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Contract Sent Date</Label>
                          <Input type="date" value={contractSentAt} onChange={(e) => setContractSentAt(e.target.value)} className="text-xs h-8" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Contract Signed Date</Label>
                          <Input type="date" value={contractSignedAt} onChange={(e) => setContractSignedAt(e.target.value)} className="text-xs h-8" />
                        </div>
                      </div>
                      <Button size="sm" className="text-xs h-7" onClick={() => saveSection("contract")}>Save Contract Details</Button>
                    </div>
                  ) : (
                    <div className="text-xs space-y-1 text-muted-foreground">
                      <p><span className="font-medium text-foreground">Status:</span> {contractBadge(selected.contractStatus)}</p>
                      {selected.contractSentAt && <p><span className="font-medium text-foreground">Sent:</span> {format(parseISO(selected.contractSentAt), "PP")}</p>}
                      {selected.contractSignedAt && <p><span className="font-medium text-foreground">Signed:</span> {format(parseISO(selected.contractSignedAt), "PP")}</p>}
                      {selected.contractStatus === "None" && !selected.contractSentAt && (
                        <p className="italic">No contract issued yet.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Effort & Activity Log */}
                <div className="rounded-xl border p-4 bg-card space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-indigo-500" /> Effort & Activity Log
                  </h3>

                  {/* Log new activity */}
                  <div className="space-y-2 border rounded-lg p-3 bg-muted/20">
                    <div className="flex gap-2">
                      <select
                        value={activityType}
                        onChange={(e) => setActivityType(e.target.value as ActivityType)}
                        className="rounded-md border border-input bg-transparent px-2 py-1 text-xs h-8 w-36"
                      >
                        {ACTIVITY_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Textarea
                        value={activityContent}
                        onChange={(e) => setActivityContent(e.target.value)}
                        placeholder="Log a note, call, email, interview outcome..."
                        rows={2}
                        className="text-xs flex-1"
                      />
                      <Button
                        size="sm"
                        className="self-end gap-1 h-9"
                        onClick={handleLogActivity}
                        disabled={loggingActivity || !activityContent.trim()}
                      >
                        <Send className="h-3.5 w-3.5" />
                        Log
                      </Button>
                    </div>
                  </div>

                  {/* Activity history */}
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {selected.activities.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic text-center py-2">No activity logged yet.</p>
                    ) : (
                      selected.activities.map((a) => (
                        <div key={a.id} className="flex gap-2.5 text-xs">
                          <div className="mt-0.5 flex-shrink-0">{activityIcon(a.type)}</div>
                          <div className="flex-1 border-l pl-3">
                            <div className="text-[11px] text-muted-foreground mb-0.5">
                              <span className="font-semibold text-foreground">{a.userName}</span>
                              {" · "}
                              {format(parseISO(a.createdAt), "dd MMM yyyy, HH:mm")}
                              {" · "}
                              <span className="capitalize">{a.type}</span>
                            </div>
                            <p className="text-foreground">{a.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* General Notes */}
                {selected.notes && (
                  <div className="rounded-xl border p-4 bg-card">
                    <h3 className="text-sm font-semibold mb-1">Notes</h3>
                    <p className="text-xs text-muted-foreground">{selected.notes}</p>
                  </div>
                )}

                {/* Meta */}
                <div className="text-[11px] text-muted-foreground border-t pt-3">
                  Added by <strong>{selected.createdByName}</strong> on {format(parseISO(selected.createdAt), "dd MMM yyyy, HH:mm")}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Add Candidate Modal ────────────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Candidate</DialogTitle>
          </DialogHeader>

          {formError && <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">{formError}</p>}

          <div className="space-y-3 py-2 text-xs max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>First Name *</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane" />
              </div>
              <div className="space-y-1">
                <Label>Last Name *</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Email Address *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Phone Number</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+44 7700 000000" />
              </div>
              <div className="space-y-1">
                <Label>Source</Label>
                <select value={source} onChange={(e) => setSource(e.target.value)} className="w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs h-9">
                  {SOURCES.filter((s) => s !== "All").map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="City, Postcode" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Position Applied For *</Label>
                <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="e.g. Business Development Manager" />
              </div>
              <div className="space-y-1">
                <Label>Position Type</Label>
                <select value={positionType} onChange={(e) => setPositionType(e.target.value)} className="w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs h-9">
                  {POSITION_TYPES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Initial Stage</Label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs h-9">
                {STAGES.filter((s) => s !== "All").map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any initial notes about this candidate..." rows={2} />
            </div>

            {/* CV Upload */}
            <div className="space-y-1 pt-1 border-t">
              <Label>CV / Resume (optional)</Label>
              <input
                ref={cvInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.odt"
                className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) setCvFile(e.target.files[0]); }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 w-full"
                onClick={() => cvInputRef.current?.click()}
              >
                <Paperclip className="h-3.5 w-3.5" />
                {cvFile ? `Attached: ${cvFile.name}` : "Attach CV / Resume"}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAdd} disabled={submitting}>
              {submitting ? "Adding..." : "Add Candidate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
