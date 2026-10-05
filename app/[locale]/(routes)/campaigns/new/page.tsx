import { WizardShell } from "./components/WizardShell";
import { getTemplates } from "@/actions/campaigns/templates/get-templates";
import { getPostcodeOptions } from "@/actions/crm/get-postcode-options";
import { getLeadsForAudience } from "@/actions/crm/leads/get-leads-for-audience";
import { prismadb } from "@/lib/prisma";

export default async function NewCampaignPage() {
  const [templates, targetLists, postcodeOptions, leads] = await Promise.all([
    getTemplates(),
    prismadb.crm_TargetLists.findMany({
      where: { status: true },
      orderBy: { name: "asc" },
      include: { _count: { select: { targets: true } } },
    }),
    getPostcodeOptions(),
    getLeadsForAudience(),
  ]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">New Campaign</h1>
        <p className="text-muted-foreground">Create an email campaign</p>
      </div>
      <WizardShell templates={templates} targetLists={targetLists} postcodeOptions={postcodeOptions} leads={leads} />
    </div>
  );
}
