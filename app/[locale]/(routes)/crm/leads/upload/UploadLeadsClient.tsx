"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  UserPlus,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  UserCheck,
  Tag,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadLeads, type IndividualLeadInput } from "@/actions/crm/leads/upload-leads";
import Link from "next/link";

interface UploadLeadsClientProps {
  currentUser: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
}

export default function UploadLeadsClient({ currentUser }: UploadLeadsClientProps) {
  const router = useRouter();

  // Active Mode Tab: "csv" | "individual"
  const [activeTab, setActiveTab] = useState<"csv" | "individual">("csv");

  // Drag & drop state
  const [dragActive, setDragActive] = useState(false);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);

  // Parsed CSV leads state
  const [parsedLeads, setParsedLeads] = useState<IndividualLeadInput[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  // Individual Form State
  const [formState, setFormState] = useState<IndividualLeadInput>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    postcode: "",
  });

  // Submission / Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Parse CSV string into array of leads
  const parseCSVText = (text: string) => {
    try {
      const lines = text
        .split(/\r\n|\n|\r/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (lines.length < 2) {
        setParseError("CSV file must contain a header row and at least one lead data row.");
        setParsedLeads([]);
        return;
      }

      // Parse headers
      const rawHeaders = lines[0].split(",").map((h) => h.replace(/^["']|["']$/g, "").trim().toLowerCase());

      // Helper to find column index by name candidates
      const findHeaderIndex = (candidates: string[], excludeIndex?: number) => {
        return rawHeaders.findIndex(
          (h, idx) => idx !== excludeIndex && candidates.some((c) => h.includes(c))
        );
      };

      const idxFirstName = findHeaderIndex(["first name", "firstname", "first_name", "fname"]);
      // Exclude the first-name column so the generic "name" fallback below
      // doesn't match "first name" again via substring and duplicate it.
      const idxLastName = findHeaderIndex(
        ["last name", "lastname", "last_name", "lname", "surname", "name"],
        idxFirstName
      );
      const idxEmail = findHeaderIndex(["email", "e-mail", "mail"]);
      const idxPhone = findHeaderIndex(["phone", "mobile", "telephone", "tel", "number"]);
      const idxCompany = findHeaderIndex(["company", "organization", "organisation", "business"]);
      const idxPostcode = findHeaderIndex(["postcode", "post code", "zip", "postal"]);

      const leads: IndividualLeadInput[] = [];

      for (let i = 1; i < lines.length; i++) {
        // Parse CSV row with simple quote handling
        const row = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || lines[i].split(",");
        const cleanRow = row.map((cell) => cell.replace(/^["']|["']$/g, "").trim());

        const fName = idxFirstName !== -1 ? cleanRow[idxFirstName] || "" : "";
        let lName = idxLastName !== -1 ? cleanRow[idxLastName] || "" : "";
        const email = idxEmail !== -1 ? cleanRow[idxEmail] || "" : "";
        const phone = idxPhone !== -1 ? cleanRow[idxPhone] || "" : "";
        const company = idxCompany !== -1 ? cleanRow[idxCompany] || "" : "";
        const postcode = idxPostcode !== -1 ? cleanRow[idxPostcode] || "" : "";

        // If surname missing but fname present, split or fallback
        if (!lName && fName) {
          const parts = fName.split(" ");
          if (parts.length > 1) {
            lName = parts.slice(1).join(" ");
          } else {
            lName = "Lead";
          }
        }

        if (fName || lName || email || phone || company || postcode) {
          leads.push({
            firstName: fName,
            lastName: lName || "Lead",
            email,
            phone,
            company,
            postcode,
          });
        }
      }

      if (leads.length === 0) {
        setParseError("No valid lead rows could be extracted from the CSV file.");
        setParsedLeads([]);
      } else {
        setParseError(null);
        setParsedLeads(leads);
      }
    } catch (err: any) {
      console.error(err);
      setParseError("Failed to parse CSV file. Please make sure it is a valid CSV format.");
      setParsedLeads([]);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      setParseError("Please select a valid CSV file (.csv).");
      return;
    }

    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCSVText(text);
    };
    reader.readAsText(file);
  };

  // Drag & drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  // Submit CSV Leads Batch
  const handleCsvSubmit = async () => {
    if (parsedLeads.length === 0) {
      setSubmitError("No parsed leads available to upload.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);

    const res = await uploadLeads(parsedLeads);

    setIsSubmitting(false);

    if (res.error) {
      setSubmitError(res.error);
    } else {
      setSuccessMessage(`Successfully uploaded ${res.count} leads to the CRM!`);
      setParsedLeads([]);
      setCsvFileName(null);
    }
  };

  // Submit Individual Lead Form
  const handleIndividualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState.lastName && !formState.firstName) {
      setSubmitError("Please enter at least a First Name or Last Name.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);

    const res = await uploadLeads([formState]);

    setIsSubmitting(false);

    if (res.error) {
      setSubmitError(res.error);
    } else {
      const fullName = `${formState.firstName || ""} ${formState.lastName || ""}`.trim();
      setSuccessMessage(`Successfully created lead "${fullName}"!`);
      setFormState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        company: "",
        postcode: "",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between border-b pb-4">
        <Link
          href="/crm/leads"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Leads</span>
        </Link>

        {/* Tab Switchers */}
        <div className="flex items-center bg-muted/60 p-1 rounded-xl border">
          <button
            onClick={() => {
              setActiveTab("csv");
              setSubmitError(null);
              setSuccessMessage(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "csv"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>CSV Batch Upload</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("individual");
              setSubmitError(null);
              setSuccessMessage(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "individual"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Individual Lead Upload</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <span className="text-sm font-semibold">{successMessage}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => router.push("/crm/leads")}
              variant="outline"
              size="sm"
              className="text-xs bg-background"
            >
              View Leads Table
            </Button>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-700 dark:text-emerald-400 hover:opacity-80"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error Notification Banner */}
      {submitError && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <span className="text-sm font-medium">{submitError}</span>
          </div>
          <button onClick={() => setSubmitError(null)} className="text-red-700 dark:text-red-400 hover:opacity-80">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Auto-Assigned Metadata Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-card border p-4 rounded-xl shadow-sm text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <UserCheck className="h-4 w-4" />
          </div>
          <div>
            <div className="text-muted-foreground font-medium">Assigned To</div>
            <div className="font-bold text-foreground truncate">{currentUser.name || currentUser.email}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Tag className="h-4 w-4" />
          </div>
          <div>
            <div className="text-muted-foreground font-medium">Category</div>
            <div className="font-bold text-foreground">Partner Upload</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <div className="text-muted-foreground font-medium">Last Update & Status</div>
            <div className="font-bold text-foreground">Auto (Current Time) | Blank Status</div>
          </div>
        </div>
      </div>

      {/* MODE 1: CSV BATCH UPLOADER */}
      {activeTab === "csv" && (
        <div className="space-y-6">
          {/* CSV Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all bg-card ${
              dragActive
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-muted-foreground/30 hover:border-primary/50"
            }`}
          >
            <input
              id="csvFileInput"
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <label htmlFor="csvFileInput" className="cursor-pointer flex flex-col items-center justify-center gap-3">
              <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-inner">
                <Upload className="h-10 w-10" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {csvFileName ? `File selected: ${csvFileName}` : "Drag and drop your CSV file here"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports CSV columns: <span className="font-mono text-foreground">first name, last name, email, phone number, company name, postcode</span>
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-2 text-xs">
                Browse CSV File
              </Button>
            </label>
          </div>

          {/* Parsing error */}
          {parseError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4" />
              <span>{parseError}</span>
            </div>
          )}

          {/* CSV Parsed Preview Table */}
          {parsedLeads.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  <h3 className="text-base font-bold text-foreground">
                    Parsed CSV Leads ({parsedLeads.length} rows ready)
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setParsedLeads([]);
                      setCsvFileName(null);
                    }}
                    className="text-xs"
                  >
                    Clear CSV
                  </Button>
                  <Button
                    onClick={handleCsvSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 text-xs"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Uploading Leads...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span>Upload All {parsedLeads.length} Leads</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="sticky top-0 bg-muted border-b text-muted-foreground font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Name</th>
                        <th className="p-3">E-mail</th>
                        <th className="p-3">Phone</th>
                        <th className="p-3">Company</th>
                        <th className="p-3">Postcode</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Assigned To</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted font-medium">
                      {parsedLeads.map((lead, idx) => (
                        <tr key={idx} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 text-muted-foreground">{idx + 1}</td>
                          <td className="p-3 font-semibold text-foreground">
                            {lead.firstName ? `${lead.firstName} ${lead.lastName}` : lead.lastName}
                          </td>
                          <td className="p-3 text-muted-foreground">{lead.email || "-"}</td>
                          <td className="p-3 text-muted-foreground">{lead.phone || "-"}</td>
                          <td className="p-3 text-foreground font-medium">{lead.company || "-"}</td>
                          <td className="p-3 text-muted-foreground font-mono">{lead.postcode || "-"}</td>
                          <td className="p-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                              Partner Upload
                            </span>
                          </td>
                          <td className="p-3 text-muted-foreground">{currentUser.name || currentUser.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: INDIVIDUAL LEAD FORM */}
      {activeTab === "individual" && (
        <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              <span>Add Single Lead</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Enter lead details manually. The lead will be automatically assigned to you under Category "Partner Upload".
            </p>
          </div>

          <form onSubmit={handleIndividualSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs font-semibold flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>First Name</span>
                </Label>
                <Input
                  id="firstName"
                  placeholder="e.g. John"
                  value={formState.firstName}
                  onChange={(e) => setFormState({ ...formState, firstName: e.target.value })}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs font-semibold flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Last Name <span className="text-red-500">*</span></span>
                </Label>
                <Input
                  id="lastName"
                  placeholder="e.g. Smith"
                  value={formState.lastName}
                  onChange={(e) => setFormState({ ...formState, lastName: e.target.value })}
                  required
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>E-mail Address</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g. john.smith@company.co.uk"
                  value={formState.email}
                  onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-semibold flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Phone Number</span>
                </Label>
                <Input
                  id="phone"
                  placeholder="e.g. 07700 900123"
                  value={formState.phone}
                  onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="company" className="text-xs font-semibold flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Company Name</span>
                </Label>
                <Input
                  id="company"
                  placeholder="e.g. Acme Enterprise Ltd"
                  value={formState.company}
                  onChange={(e) => setFormState({ ...formState, company: e.target.value })}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="postcode" className="text-xs font-semibold flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Postcode</span>
                </Label>
                <Input
                  id="postcode"
                  placeholder="e.g. SW1A 1AA"
                  value={formState.postcode}
                  onChange={(e) => setFormState({ ...formState, postcode: e.target.value })}
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2 text-xs">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving Lead...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>Save Lead</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
