import Link from "next/link";
import { format, parseISO } from "date-fns";
import Container from "../../components/ui/Container";
import { Badge } from "@/components/ui/badge";
import { getFivePoundEmailFlows } from "@/actions/automations/get-five-pound-email-flows";

function getStatusBadgeClass(statusLabel: string): string {
  switch (statusLabel) {
    case "Client converted":
      return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400";
    case "Manual Followup required":
      return "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400";
    case "3rd Email sent":
      return "bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-400";
    case "2nd Email sent":
      return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400";
    case "1st Email sent":
      return "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-400";
    default:
      return "bg-slate-100 dark:bg-slate-900/30 text-slate-800 dark:text-slate-400";
  }
}

const FivePoundAssessmentAutomationPage = async () => {
  const flows = await getFivePoundEmailFlows();

  return (
    <Container
      title="£5 Assessment Email Flow"
      description="AI-generated 3-step upsell sequence sent after a £5 Assessment purchase — visible here for leads assigned to you."
    >
      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-muted">
                  <th className="pb-3 font-medium">Lead</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Started</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted">
                {flows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-muted-foreground">
                      No £5 Assessment email flows yet.
                    </td>
                  </tr>
                ) : (
                  flows.map((flow) => (
                    <tr key={flow.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-3 font-medium">
                        <Link href={`/crm/leads/${flow.leadId}`} className="text-primary hover:underline font-semibold">
                          {flow.leadName || "Unnamed Lead"}
                        </Link>
                      </td>
                      <td className="py-3">
                        <Badge className={`${getStatusBadgeClass(flow.statusLabel)} hover:${getStatusBadgeClass(flow.statusLabel)}`}>
                          {flow.statusLabel}
                        </Badge>
                      </td>
                      <td className="py-3 text-xs text-muted-foreground">
                        {format(parseISO(flow.createdAt), "MMM d, yyyy h:mm a")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default FivePoundAssessmentAutomationPage;
