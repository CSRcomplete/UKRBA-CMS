import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, ArrowLeft } from "lucide-react";

const SECTIONS = [
  {
    title: "1. Lawful Information",
    body: [
      "Any information you upload to the CRM has been obtained lawfully, and you are entitled to share it with UKRBA.",
    ],
  },
  {
    title: "2. Existing Business Contacts",
    body: [
      "We recognise that you may already have your own business contacts and clients.",
      "Nothing in this agreement prevents you from continuing to use your own existing contacts for the lawful purposes for which they were originally obtained.",
      "However, once information is uploaded into the UKRBA CRM, it becomes part of the UKRBA business database and may only be accessed and used for legitimate UKRBA business purposes whilst held within the CRM.",
    ],
  },
  {
    title: "3. Confidentiality",
    body: [
      "All information contained within the CRM is confidential.",
      "You agree not to copy, share or use CRM information for any purpose outside UKRBA without prior written permission.",
    ],
  },
  {
    title: "4. Data Protection",
    body: [
      "UKRBA is committed to protecting the information held within the CRM and processes data in accordance with UK data protection legislation.",
      "Users must take reasonable care to keep information accurate, protect their login details and report any suspected data breach or unauthorised access immediately.",
    ],
  },
  {
    title: "5. Leaving UKRBA",
    body: [
      "If your relationship with UKRBA ends, your access to the CRM will be removed.",
      "You must not retain or continue to use information taken from the UKRBA CRM after your access has ended.",
    ],
  },
];

const ACCEPTANCE_POINTS = [
  "You have read and understood this agreement.",
  "You will only upload information you are legally entitled to share.",
  "You understand that information uploaded into the UKRBA CRM forms part of the UKRBA business database.",
  "You will use CRM information only for authorised UKRBA business purposes.",
  "You will keep CRM information confidential.",
  "You understand that your acceptance of this agreement will be recorded electronically.",
];

export default function TermsPage() {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">UKRBA CRM User Agreement</h1>
        <Button variant="outline" size="sm" asChild className="gap-1.5">
          <Link href="/sign-in">
            <ArrowLeft className="h-4 w-4" /> Back to Sign In
          </Link>
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Welcome to the UKRBA CRM. This system has been developed to help us manage enquiries, members, prospects
        and business relationships in a secure and professional manner.
      </p>
      <p className="text-sm text-muted-foreground">
        By selecting <strong className="text-foreground">&ldquo;I Agree&rdquo;</strong> and accessing the CRM, you confirm that you
        accept the following:
      </p>

      {SECTIONS.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle className="text-base">{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {section.body.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">6. Acceptance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            By selecting <strong className="text-foreground">&ldquo;I Agree&rdquo;</strong>, you confirm that:
          </p>
          <ul className="space-y-1.5">
            {ACCEPTANCE_POINTS.map((item) => (
              <li key={item} className="flex items-start gap-1.5 text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground text-center pt-2 border-t">
        Thank you for helping us protect our members, our partners and our business.
      </p>
    </div>
  );
}
