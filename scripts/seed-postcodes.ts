import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const postcodes = [
  { area: "AB", name: "Aberdeen" },
  { area: "AL", name: "St Albans" },
  { area: "BA", name: "Bath" },
  { area: "BB", name: "Blackburn" },
  { area: "BD", name: "Bradford" },
  { area: "BH", name: "Bournemouth" },
  { area: "BL", name: "Bolton" },
  { area: "BN", name: "Brighton" },
  { area: "BR", name: "Bromley" },
  { area: "BS", name: "Bristol" },
  { area: "BT", name: "Northern Ireland (Belfast)" },
  { area: "CA", name: "Carlisle" },
  { area: "CB", name: "Cambridge" },
  { area: "CF", name: "Cardiff" },
  { area: "CH", name: "Chester" },
  { area: "CM", name: "Chelmsford" },
  { area: "CO", name: "Colchester" },
  { area: "CR", name: "Croydon" },
  { area: "CT", name: "Canterbury" },
  { area: "CV", name: "Coventry" },
  { area: "CW", name: "Crewe" },
  { area: "DA", name: "Dartford" },
  { area: "DD", name: "Dundee" },
  { area: "DE", name: "Derby" },
  { area: "DG", name: "Dumfries" },
  { area: "DH", name: "Durham" },
  { area: "DL", name: "Darlington" },
  { area: "DN", name: "Doncaster" },
  { area: "DT", name: "Dorchester" },
  { area: "DY", name: "Dudley" },
  { area: "EC", name: "London (East Central)" },
  { area: "EH", name: "Edinburgh" },
  { area: "EN", name: "Enfield" },
  { area: "EX", name: "Exeter" },
  { area: "FK", name: "Falkirk" },
  { area: "FY", name: "Blackpool (Fylde)" },
  { area: "GL", name: "Gloucester" },
  { area: "GU", name: "Guildford" },
  { area: "HA", name: "Harrow" },
  { area: "HD", name: "Huddersfield" },
  { area: "HG", name: "Harrogate" },
  { area: "HP", name: "Hemel Hempstead" },
  { area: "HR", name: "Hereford" },
  { area: "HS", name: "Outer Hebrides" },
  { area: "HU", name: "Hull" },
  { area: "HX", name: "Halifax" },
  { area: "IG", name: "Ilford" },
  { area: "IP", name: "Ipswich" },
  { area: "IV", name: "Inverness" },
  { area: "KA", name: "Kilmarnock" },
  { area: "KT", name: "Kingston upon Thames" },
  { area: "KW", name: "Kirkwall" },
  { area: "KY", name: "Kirkcaldy" },
  { area: "LA", name: "Lancaster" },
  { area: "LD", name: "Llandrindod Wells" },
  { area: "LE", name: "Leicester" },
  { area: "LL", name: "Llandudno" },
  { area: "LN", name: "Lincoln" },
  { area: "LS", name: "Leeds" },
  { area: "LU", name: "Luton" },
  { area: "ME", name: "Medway" },
  { area: "MK", name: "Milton Keynes" },
  { area: "ML", name: "Motherwell" },
  { area: "NE", name: "Newcastle upon Tyne" },
  { area: "NG", name: "Nottingham" },
  { area: "NN", name: "Northampton" },
  { area: "NP", name: "Newport" },
  { area: "NR", name: "Norwich" },
  { area: "NW", name: "London (North West)" },
  { area: "OL", name: "Oldham" },
  { area: "PA", name: "Paisley" },
  { area: "PE", name: "Peterborough" },
  { area: "PH", name: "Perth" },
  { area: "PL", name: "Plymouth" },
  { area: "PO", name: "Portsmouth" },
  { area: "PR", name: "Preston" },
  { area: "RG", name: "Reading" },
  { area: "RH", name: "Redhill" },
  { area: "RM", name: "Romford" },
  { area: "SA", name: "Swansea" },
  { area: "SE", name: "London (South East)" },
  { area: "SG", name: "Stevenage" },
  { area: "SK", name: "Stockport" },
  { area: "SL", name: "Slough" },
  { area: "SM", name: "Sutton" },
  { area: "SN", name: "Swindon" },
  { area: "SO", name: "Southampton" },
  { area: "SP", name: "Salisbury" },
  { area: "SR", name: "Sunderland" },
  { area: "SS", name: "Southend-on-Sea" },
  { area: "ST", name: "Stoke-on-Trent" },
  { area: "SW", name: "London (South West)" },
  { area: "SY", name: "Shrewsbury" },
  { area: "TA", name: "Taunton" },
  { area: "TD", name: "Galashiels (Tweeddale)" },
  { area: "TF", name: "Telford" },
  { area: "TN", name: "Tonbridge" },
  { area: "TQ", name: "Torquay" },
  { area: "TR", name: "Truro" },
  { area: "TS", name: "Cleveland (Teesside)" },
  { area: "TW", name: "Twickenham" },
  { area: "UB", name: "Southall (Uxbridge)" },
  { area: "WA", name: "Warrington" },
  { area: "WC", name: "London (West Central)" },
  { area: "WD", name: "Watford" },
  { area: "WF", name: "Wakefield" },
  { area: "WN", name: "Wigan" },
  { area: "WR", name: "Worcester" },
  { area: "WS", name: "Walsall" },
  { area: "WV", name: "Wolverhampton" },
  { area: "YO", name: "York" },
  { area: "ZE", name: "Shetland (Lerwick)" }
];

async function main() {
  console.log(`Starting to seed ${postcodes.length} UK postcode areas...`);
  
  for (const pc of postcodes) {
    await prisma.nextcrm_postcode_routing.upsert({
      where: { postcode_area: pc.area },
      update: { area_name: pc.name },
      create: {
        postcode_area: pc.area,
        area_name: pc.name,
        region_country: "United Kingdom",
        assigned_region_id: 1,
      }
    });
  }

  console.log("Seeding postcode areas completed successfully.");
}

main()
  .catch((e) => {
    console.error("Error seeding postcode areas:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
