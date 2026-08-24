import Link from "next/link";
import Container from "../components/ui/Container";
import { Mail, ArrowRight } from "lucide-react";

const AutomationsPage = () => {
  return (
    <Container
      title="Automations"
      description="Automated workflows that run in the background without manual intervention."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <Link
          href="/automations/five-pound-assessment"
          className="group relative overflow-hidden rounded-xl border border-fuchsia-200 dark:border-fuchsia-900/40 bg-gradient-to-br from-fuchsia-500/10 via-background to-fuchsia-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-fuchsia-500/60"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-fuchsia-600 text-white shadow-md transition-transform group-hover:scale-110">
              <Mail className="h-6 w-6" />
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-fuchsia-600" />
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="text-lg font-bold text-foreground group-hover:text-fuchsia-600 transition-colors">
              £5 Assessment Email Flow
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2">
              3-step AI-generated upsell sequence sent automatically after a
              £5 Assessment purchase, prompting the Premium SME Plan.
            </p>
          </div>
        </Link>
      </div>
    </Container>
  );
};

export default AutomationsPage;
