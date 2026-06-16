import { PrismaClient } from "@prisma/client";

const englandAreas = [
  "AL", "B", "BA", "BB", "BD", "BH", "BL", "BN", "BR", "BS", "CA", "CB", "CH", "CM", "CO", "CR", "CT", "CV", "CW", "DA",
  "DE", "DH", "DL", "DN", "DT", "DY", "E", "EC", "EN", "EX", "FY", "GL", "GU", "HA", "HD", "HG", "HP", "HR", "HU", "HX",
  "IG", "IP", "KT", "L", "LA", "LE", "LN", "LS", "LU", "M", "ME", "MK", "N", "NE", "NG", "NN", "NR", "NW", "OL", "OX",
  "PE", "PO", "PR", "RG", "RH", "RM", "S", "SE", "SG", "SK", "SL", "SM", "SN", "SO", "SP", "SR", "SS", "ST", "SW", "TA",
  "TF", "TN", "TQ", "TR", "TS", "TW", "UB", "W", "WA", "WC", "WD", "WF", "WN", "WR", "WS", "WV", "YO"
];

const scotlandAreas = [
  "AB", "DD", "DG", "EH", "FK", "G", "HS", "IV", "KA", "KW", "KY", "ML", "PA", "PH", "TD", "ZE"
];

const walesAreas = [
  "CF", "LL", "NP", "SA"
];

const niAreas = [
  "BT"
];

export async function seedPostcodes(prisma: PrismaClient) {
  console.log("Seeding postcode routing rules...");

  const dataToSeed = [
    ...englandAreas.map((area) => ({ postcode_area: area, region_country: "England", assigned_region_id: 1 })),
    ...scotlandAreas.map((area) => ({ postcode_area: area, region_country: "Scotland", assigned_region_id: 2 })),
    ...walesAreas.map((area) => ({ postcode_area: area, region_country: "Wales", assigned_region_id: 3 })),
    ...niAreas.map((area) => ({ postcode_area: area, region_country: "Northern Ireland", assigned_region_id: 4 })),
  ];

  for (const item of dataToSeed) {
    await prisma.nextcrm_postcode_routing.upsert({
      where: { postcode_area: item.postcode_area },
      update: {
        region_country: item.region_country,
        assigned_region_id: item.assigned_region_id,
      },
      create: {
        postcode_area: item.postcode_area,
        region_country: item.region_country,
        assigned_region_id: item.assigned_region_id,
      },
    });
  }

  console.log(`Seeded ${dataToSeed.length} postcode routing rules.`);
}
