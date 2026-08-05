import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X, ArrowLeft } from "lucide-react";

const TIERS = [
  {
    name: "Basic",
    price: "£50 / year",
    tag: "JOIN",
    greatFor: "Joining the UK's responsible business community.",
    youReceive: ["Membership & digital certificate", "UKRBA Member logo", "Public member listing", "Member resources & events"],
    whatUkrbaDoes: ["Lists your business publicly", "Sends member news & updates"],
    whatYouDo: ["Manage your own responsible business activities", "Maintain your own policies", "Record your own CSR & ESG activities"],
  },
  {
    name: "Verified",
    price: "£19.99 / month",
    tag: "DO IT YOURSELF",
    greatFor: "Organisations that want independent verification while managing their own CSR & ESG programme.",
    youReceive: ["Everything in Basic", "Verified status, certificate & badge", "Online diary & shareable diary URL", "Downloadable CSR & ESG Report", "Public business profile"],
    whatUkrbaDoes: ["Independently verifies your organisation", "Carries out ongoing verification reviews"],
    whatYouDo: ["Manage your own responsible business programme", "Upload your own CSR & ESG activities"],
  },
  {
    name: "Accredited",
    price: "£59.99 / month",
    tag: "MANAGED BY UKRBA",
    mostPopular: true,
    greatFor: "Organisations that want UKRBA to support their accreditation — with monthly social value included.",
    youReceive: ["Everything in Verified", "Full accreditation & certificate", "Complete policy library", "Accredited Badge for your website & email signature", "5 trees + 24 meals every month"],
    whatUkrbaDoes: ["Manages your accreditation", "Maintains your policy library", "Records your monthly Social Value"],
    whatYouDo: ["Continue uploading your own CSR & ESG activities whenever you wish", "Display your Accredited Badge"],
  },
  {
    name: "Premium",
    price: "£99.99 / month",
    tag: "EVERYTHING IN ACCREDITED, PLUS",
    greatFor: "Organisations that want double the monthly social impact, with priority support.",
    youReceive: ["Double the monthly Social Value", "10 trees every month", "48 meals every month", "Premium Badge & Certificate", "Premium Business Profile", "Enhanced CSR & ESG reporting"],
    whatUkrbaDoes: ["Everything in Accredited", "Priority support & accreditation assistance"],
    whatYouDo: ["Display your Premium Badge on your website, emails & social media"],
  },
];

const FEATURE_ROWS: [string, boolean, boolean, boolean, boolean][] = [
  ["Membership", true, true, true, true],
  ["Certificate", true, true, true, true],
  ["Display badge on website", true, true, true, true],
  ["Display badge in email signature", true, true, true, true],
  ["Public business profile", true, true, true, true],
  ["Share your public profile", true, true, true, true],
  ["Independent verification", false, true, true, true],
  ["Online diary", false, true, true, true],
  ["Upload your own activities", false, true, true, true],
  ["Downloadable CSR & ESG Report", false, true, true, true],
  ["Share your diary URL", false, true, true, true],
  ["Full accreditation", false, false, true, true],
  ["Policy library", false, false, true, true],
  ["Policy reviews", false, false, true, true],
  ["UKRBA records monthly Social Value", false, false, true, true],
  ["Priority support", false, false, false, true],
];

export default function TermsPage() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Terms & Conditions — UKRBA Membership</h1>
        <Button variant="outline" size="sm" asChild className="gap-1.5">
          <Link href="/sign-in">
            <ArrowLeft className="h-4 w-4" /> Back to Sign In
          </Link>
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        UK SME Responsible Business Association (UKRBA) — Trust • Transparency • Responsibility. This page sets
        out the membership options, features, and social value commitments referenced throughout the UKRBA CRM
        and member-facing materials.
      </p>

      {/* Tier cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {TIERS.map((tier) => (
          <Card
            key={tier.name}
            className={tier.mostPopular ? "border-emerald-500 ring-1 ring-emerald-500/40" : ""}
          >
            <CardHeader className="space-y-1">
              {tier.mostPopular && (
                <span className="w-fit text-[10px] font-bold uppercase tracking-wide bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                  Most Popular
                </span>
              )}
              <CardTitle className="text-lg">{tier.name}</CardTitle>
              <CardDescription className="text-base font-semibold text-foreground">{tier.price}</CardDescription>
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{tier.tag}</span>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">You receive</h4>
                <ul className="space-y-1">
                  {tier.youReceive.map((item) => (
                    <li key={item} className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">What UKRBA does</h4>
                <ul className="space-y-1">
                  {tier.whatUkrbaDoes.map((item) => (
                    <li key={item} className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">What you do</h4>
                <ul className="space-y-1">
                  {tier.whatYouDo.map((item) => (
                    <li key={item} className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-2 border-t">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Great for</h4>
                <p className="text-xs text-muted-foreground">{tier.greatFor}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feature comparison table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compare memberships at a glance</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature</TableHead>
                <TableHead className="text-center">Basic</TableHead>
                <TableHead className="text-center">Verified</TableHead>
                <TableHead className="text-center">Accredited</TableHead>
                <TableHead className="text-center">Premium</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FEATURE_ROWS.map(([feature, basic, verified, accredited, premium]) => (
                <TableRow key={feature}>
                  <TableCell className="font-medium">{feature}</TableCell>
                  {[basic, verified, accredited, premium].map((included, idx) => (
                    <TableCell key={idx} className="text-center">
                      {included ? (
                        <Check className="h-4 w-4 text-emerald-600 inline" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/40 inline" />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="font-medium">Trees every month</TableCell>
                <TableCell className="text-center text-muted-foreground/40">—</TableCell>
                <TableCell className="text-center text-muted-foreground/40">—</TableCell>
                <TableCell className="text-center font-semibold text-emerald-700">5</TableCell>
                <TableCell className="text-center font-semibold text-emerald-700">10</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Meals every month</TableCell>
                <TableCell className="text-center text-muted-foreground/40">—</TableCell>
                <TableCell className="text-center text-muted-foreground/40">—</TableCell>
                <TableCell className="text-center font-semibold text-emerald-700">24</TableCell>
                <TableCell className="text-center font-semibold text-emerald-700">48</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Price</TableCell>
                <TableCell className="text-center font-semibold">£50 / yr</TableCell>
                <TableCell className="text-center font-semibold">£19.99 / mo</TableCell>
                <TableCell className="text-center font-semibold">£59.99 / mo</TableCell>
                <TableCell className="text-center font-semibold">£99.99 / mo</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Social value */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Accredited & Premium members — included monthly social value</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border bg-muted/20">
              <p className="font-semibold">Accredited — £59.99 / month</p>
              <p className="text-muted-foreground">5 trees • 24 meals</p>
            </div>
            <div className="p-3 rounded-lg border bg-muted/20">
              <p className="font-semibold">Premium — £99.99 / month</p>
              <p className="text-muted-foreground">10 trees • 48 meals</p>
            </div>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-muted-foreground">
            <li className="flex items-start gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" /> Trees planted through Mbedza Projects</li>
            <li className="flex items-start gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" /> Meals donated through The Felix Project</li>
            <li className="flex items-start gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" /> Automatically recorded by UKRBA</li>
            <li className="flex items-start gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" /> Included within your CSR & ESG reporting</li>
          </ul>
        </CardContent>
      </Card>

      {/* Marketing tools + why businesses join */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Market your membership</CardTitle>
          <CardDescription>Every membership gives you ready-made marketing tools to win business and build trust.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
          {[
            "Display your badge on your website",
            "Add your badge to email signatures",
            "Promote your membership on social media",
            "Share your certificate with customers",
            "Invite customers to your public UKRBA profile",
            "Share your unique Responsible Business Diary URL",
          ].map((item) => (
            <div key={item} className="flex items-start gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" /> {item}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Why businesses join UKRBA</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          {[
            "Win more business",
            "Build customer trust",
            "Demonstrate independent verification",
            "Produce professional CSR & ESG reports",
            "Save administration time",
            "Create genuine social impact",
          ].map((item) => (
            <div key={item} className="p-3 rounded-lg border bg-muted/20 flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" /> {item}
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center pt-2 border-t">
        UK SME Responsible Business Association • ukrba.org
      </p>
    </div>
  );
}
