import { prismadb } from "@/lib/prisma";

const CHANNEL_LABELS: Record<string, string> = {
  meta: "Meta Ads",
  facebook: "Facebook Ads",
  google: "Google Ads",
  tiktok: "TikTok Ads",
  linkedin: "LinkedIn Ads",
};

export type ReferralOwner = {
  userId: string;
  role: string;
  label: string;
};

/**
 * Resolves a /fsl/[slug] attribution value (carried through checkout as a
 * coupon code or custom field on the purchase webhook) to the user whose
 * sales dashboard the resulting sale should appear under.
 *
 * A slug matching an existing staff member's email prefix (e.g.
 * "c.obwwanda" -> c.obwwanda@ukrba.org) attributes to that person. Any
 * other slug (e.g. "meta") is treated as a marketing channel and gets its
 * own synthetic tracking user, auto-created on first use — the same
 * pattern already used for the "Email Campaign" lead source.
 */
export async function resolveReferralOwner(rawSlug: string | null | undefined): Promise<ReferralOwner | null> {
  if (!rawSlug) return null;
  const slug = rawSlug.trim().toLowerCase();
  if (!slug) return null;

  const staffUser = await prismadb.users.findFirst({
    where: {
      OR: [
        { email: { equals: slug, mode: "insensitive" } },
        { email: { startsWith: `${slug}@`, mode: "insensitive" } },
      ],
    },
    select: { id: true, role: true, name: true },
  });

  if (staffUser) {
    return { userId: staffUser.id, role: staffUser.role, label: staffUser.name || slug };
  }

  // Marketing channel — find or create its synthetic tracking user
  const label = CHANNEL_LABELS[slug] || `${slug.charAt(0).toUpperCase()}${slug.slice(1)} Campaign`;
  const channelEmail = `${slug}@channel.ukrba.org`;

  let channelUser = await prismadb.users.findFirst({ where: { email: channelEmail } });
  if (!channelUser) {
    channelUser = await prismadb.users.create({
      data: {
        name: label,
        email: channelEmail,
        role: "user",
        userStatus: "ACTIVE",
      },
    });
  }

  return { userId: channelUser.id, role: channelUser.role, label };
}

/**
 * Builds the crm_Members attribution field update for a resolved referral
 * owner, routing to the correct owner column based on their role so an
 * RD's or Area Director's own link attributes to the matching column
 * instead of always landing on assigned_channel_partner_id.
 */
export function referralOwnerToMemberFields(owner: ReferralOwner) {
  if (owner.role === "regional_director") {
    return { assigned_regional_director_id: owner.userId };
  }
  if (owner.role === "area_director") {
    return { assigned_area_director_id: owner.userId };
  }
  return { assigned_channel_partner_id: owner.userId };
}
