# Changelog

All notable changes to NextCRM are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0 (2026-10-05)


### Features

* add admin and staff organizational hierarchy and dynamic scopes ([979f620](https://github.com/CSRcomplete/UKRBA-CMS/commit/979f6205aa32cfb202f3b5b87ec13996dec0b168))
* add createTask server action for Zoho logger follow-ups ([ed44c3e](https://github.com/CSRcomplete/UKRBA-CMS/commit/ed44c3e7a49324cb4e5e556fc1bdc25ee1b355be))
* add Docker entrypoint script for auto-initialization ([1acba0a](https://github.com/CSRcomplete/UKRBA-CMS/commit/1acba0a5311dc99181075e61da92d59b099aff1c))
* add docker-compose.yml with all services ([c045ebb](https://github.com/CSRcomplete/UKRBA-CMS/commit/c045ebbfb0d07c25fa3e5c09c44b4ace7467b067))
* add email_partner role for external email-campaign collaborators ([498aadb](https://github.com/CSRcomplete/UKRBA-CMS/commit/498aadbc9506af059789e23e4c9bd109b892e694))
* add manual user creation panel with password and role selection in admin interface ([a0c8e95](https://github.com/CSRcomplete/UKRBA-CMS/commit/a0c8e95c7d37c5f56a9cc20ed81bdecb1aa24ca1))
* add multi-stage Dockerfile for NextCRM ([70a1b45](https://github.com/CSRcomplete/UKRBA-CMS/commit/70a1b45937af818df1a6b1c99f7d774f49af2796))
* add My Workspace meetings and tasks section to all user dashboards ([799e3b2](https://github.com/CSRcomplete/UKRBA-CMS/commit/799e3b21f3df41bdce3d1f96ad40b5f3e3efc0c9))
* add Recent Scheduled Meetings section to CEO/Admin dashboard ([95058c7](https://github.com/CSRcomplete/UKRBA-CMS/commit/95058c7bbcbe5909ac534673f15718686fb710a2))
* add schedule meeting section directly to lead and member details pages ([66d1bce](https://github.com/CSRcomplete/UKRBA-CMS/commit/66d1bce75fb279379716ecbf9798d72b171e57d6))
* Add separate, clickable sections on CEO/Admin dashboard for Operations, Regional, Area Directors, Channel Partners, Leads, and Tasks ([1670a41](https://github.com/CSRcomplete/UKRBA-CMS/commit/1670a41606abfcc618ed0b698c8f6808761907b5))
* Add View All links to all staff sections on CEO/Admin dashboard ([5bbd5e5](https://github.com/CSRcomplete/UKRBA-CMS/commit/5bbd5e5556678806ce15f45bb60c54c608b76fc5))
* allow postcode assignments for regional_director and channel_partner roles in user settings ([7be3c54](https://github.com/CSRcomplete/UKRBA-CMS/commit/7be3c542fa363a7c4ecc8af3b0d815e1e15a7c40))
* **authz:** add account read-scope helpers ([6fdff66](https://github.com/CSRcomplete/UKRBA-CMS/commit/6fdff669fdd1db42789b106e0e4f8939a98f6ff0))
* **authz:** add account write-scope assertion helper ([fb4b8f6](https://github.com/CSRcomplete/UKRBA-CMS/commit/fb4b8f66052d62097bea9c66c1d0c8bf9ae4c05c))
* **authz:** add account/lead/opportunity id-filter helpers (similarity post-filter) ([98b32f1](https://github.com/CSRcomplete/UKRBA-CMS/commit/98b32f17eb2c11e9237f95eddc85d0bf89d8206b))
* **authz:** add activity-for-entity scope dispatch helper ([db08f51](https://github.com/CSRcomplete/UKRBA-CMS/commit/db08f51b8b943ffac1a755029a27c352e6ac7a6f))
* **authz:** add AuthenticationError and AuthorizationError ([47e4980](https://github.com/CSRcomplete/UKRBA-CMS/commit/47e49805928975b8a0932c380871c0e174c287c1))
* **authz:** add barrel export ([48a2a5e](https://github.com/CSRcomplete/UKRBA-CMS/commit/48a2a5e379f8a634ebd322603c139c2cf715a399))
* **authz:** add board and task read/write scope helpers ([380e6a5](https://github.com/CSRcomplete/UKRBA-CMS/commit/380e6a59f636416ef1650ef849b947b6edab7a4a))
* **authz:** add bulk-id authorization filters for contacts and targets ([388d29d](https://github.com/CSRcomplete/UKRBA-CMS/commit/388d29dcbea52c6dfcfe2e3720ed2bb3fc515cb7))
* **authz:** add campaign and template read/write scope helpers ([6af7af0](https://github.com/CSRcomplete/UKRBA-CMS/commit/6af7af033f6d49df1844fb07e2687401d110c7c0))
* **authz:** add canonical AppRole type and legacy role mapper ([1350ed3](https://github.com/CSRcomplete/UKRBA-CMS/commit/1350ed39623a61aa31ed2e9220fa66b7782796a4))
* **authz:** add document read/write scope helpers (linked-entity aware) ([f2122a2](https://github.com/CSRcomplete/UKRBA-CMS/commit/f2122a23eec404e431445d7645ef9c3431e5bdce))
* **authz:** add enrichment cancel permission helpers ([6acbfec](https://github.com/CSRcomplete/UKRBA-CMS/commit/6acbfec765d0bc68748a20f8b3df75602220bd5c))
* **authz:** add lead/contact/opportunity/contract read-scope helpers (linked-account aware) ([bfaef87](https://github.com/CSRcomplete/UKRBA-CMS/commit/bfaef8756686eb2c07236b1250e67032cbaafbb4))
* **authz:** add read/write assertion helpers for contacts and targets ([e0fff6b](https://github.com/CSRcomplete/UKRBA-CMS/commit/e0fff6b911f145fe1878de9d3969657b897bb2f9))
* **authz:** add ReportScope builder for per-role report data filtering ([0035bf0](https://github.com/CSRcomplete/UKRBA-CMS/commit/0035bf0cb3047a5a54c7caf7eb898b2037306d79))
* **authz:** add requireAuthenticated, requireRole, role predicates ([30c3472](https://github.com/CSRcomplete/UKRBA-CMS/commit/30c3472f94e6e2555ad2ca9109f793c795b7c497))
* **authz:** add route response helpers (401/403/404) ([7ad29ae](https://github.com/CSRcomplete/UKRBA-CMS/commit/7ad29aea1639d3c403d1283698c65c74aef164ed))
* **authz:** add scoped contact and target update helpers ([071cb2c](https://github.com/CSRcomplete/UKRBA-CMS/commit/071cb2ceab48858c505a3ed7e3b0ae47119e7b1e))
* **authz:** add target and target-list read-scope helpers ([45b82a8](https://github.com/CSRcomplete/UKRBA-CMS/commit/45b82a87538d54921cbb370b9d873cb42cc68a35))
* **authz:** align UI/action callers to canonical role names ([1dc5618](https://github.com/CSRcomplete/UKRBA-CMS/commit/1dc5618c6c17d3e5b96295c9c38ff2324fd91447))
* **authz:** switch Users.role to Prisma enum AppRole ([d598305](https://github.com/CSRcomplete/UKRBA-CMS/commit/d598305ebc97b15852f41d5cc5f1807836302cfe))
* **authz:** validate setUserRole against canonical AppRole ([77241b7](https://github.com/CSRcomplete/UKRBA-CMS/commit/77241b726b748a5191c5acb6c331888672eac947))
* automatically create member record when lead converts ([5d41398](https://github.com/CSRcomplete/UKRBA-CMS/commit/5d41398067a9a1af55d9147cf984ad0cba000dbc))
* bypass google oauth/otp and switch to email & password auth ([220bd9f](https://github.com/CSRcomplete/UKRBA-CMS/commit/220bd9f6d6d63f9c2f8dc6c099ac512f73d4e756))
* bypass postcode routing when referred_by_rd is direct ([e08a3d9](https://github.com/CSRcomplete/UKRBA-CMS/commit/e08a3d9d577627668b1cdb0898ab984ecfba0af1))
* **calendar:** add Join Meeting button in Diary event modal with automatic video room resolution ([68d29cf](https://github.com/CSRcomplete/UKRBA-CMS/commit/68d29cfedb079f2d3e51e80049888ea8eee5cc6a))
* **calendar:** complete Business Calendar & Staff Diary module with Day/Week/Month views, appointment CRUD, .ics invitations, and CRM meetings & tasks integration ([d48d59f](https://github.com/CSRcomplete/UKRBA-CMS/commit/d48d59fb96b2d5d87b9bbad8e27550f6020b5c50))
* configure all 13 lead workflow stages in crm_Lead_Statuses seed ([1c43fc6](https://github.com/CSRcomplete/UKRBA-CMS/commit/1c43fc686ce259336bd07e2ba743d526eae6e58a))
* **crm:** add admin promotion script ([f4e1c63](https://github.com/CSRcomplete/UKRBA-CMS/commit/f4e1c632cc2d1cafd15b3fbc6b491068fc4cfc28))
* **crm:** add assign/disconnect document server actions for CRM tasks ([26f234a](https://github.com/CSRcomplete/UKRBA-CMS/commit/26f234a4837014b6ce8d8d3ae2f128367a7ec6c2))
* **crm:** add Category column to leads data table ([4d95e5d](https://github.com/CSRcomplete/UKRBA-CMS/commit/4d95e5dfc2acbc1f7dd7c035cf51c006d18cbf27))
* **crm:** add postcode column to leads table UI ([a6d5d97](https://github.com/CSRcomplete/UKRBA-CMS/commit/a6d5d97271f74386a8a9bb280492edca91c63be8))
* **crm:** add target audience hierarchy to noticeboard and copy link button to upcoming meetings ([fea5aad](https://github.com/CSRcomplete/UKRBA-CMS/commit/fea5aad9ea82ea56c82752ba64e10a1ed9fe2146))
* **crm:** add Upload Leads module with CSV parsing, clickable lead rows, and remove expected close date ([81741b2](https://github.com/CSRcomplete/UKRBA-CMS/commit/81741b2730e89ffae802ef94d5730e30987e4c88))
* **crm:** implement Wix Pricing Plans auto-conversion webhook and 1-click lead-to-member conversion modal ([f08b773](https://github.com/CSRcomplete/UKRBA-CMS/commit/f08b7731bfc94b0df2592e3d9646137435c75dc8))
* **crm:** show invoices on account detail page ([a207314](https://github.com/CSRcomplete/UKRBA-CMS/commit/a207314aded4b706b6fca9b537a603cbb55a9972))
* **crm:** show invoices on account detail page ([5f0f4e9](https://github.com/CSRcomplete/UKRBA-CMS/commit/5f0f4e98314cd4bb4efe60e2c7d9967bc09f7d5f))
* **crm:** support query string token auth fallback in wix webhook ([d88b024](https://github.com/CSRcomplete/UKRBA-CMS/commit/d88b0245278b53f993f33a5bde0d60780532e9eb))
* **crm:** update wix webhook to resolve lead types & sources and add test suite ([4554b74](https://github.com/CSRcomplete/UKRBA-CMS/commit/4554b74d3c6c7435bf5cb26160c1e680aa57d7e7))
* **dashboard:** add 7 modern responsive navigation tiles for Emails, Resources, Diary, Tasks, CRM, Video Meetings, and News ([3049060](https://github.com/CSRcomplete/UKRBA-CMS/commit/3049060476d2e111d0b18f517e58f5940e837045))
* **dashboard:** add 8. Upload Leads module card to main homepage navigation grid ([b82ff91](https://github.com/CSRcomplete/UKRBA-CMS/commit/b82ff910a8470d306b59e9ffeb308623777d1c32))
* **dashboard:** add Invoices, Campaigns, Targets cards; remove Employee card ([df13534](https://github.com/CSRcomplete/UKRBA-CMS/commit/df1353496e128f0f6c7035a28391e9ec8c786b76))
* **dashboard:** add per-user unread announcement notification badge and highlighted card ([9d5df7b](https://github.com/CSRcomplete/UKRBA-CMS/commit/9d5df7b997bbb6b5a08d107a7ca34bf3c4185dc4))
* **dashboard:** hide default overview cards for staff roles ([956d809](https://github.com/CSRcomplete/UKRBA-CMS/commit/956d8092f5012a13c837a35f67c29b2cc2b5a023))
* **dashboard:** implement dedicated dashboard views for CEO, Operations, Regional, Area Directors, and Channel Partners ([1b1037d](https://github.com/CSRcomplete/UKRBA-CMS/commit/1b1037dc9f3ce36f8509b75b5c6ecbea50b89e82))
* **dashboard:** remove default statistics cards completely from all dashboards ([a7f761e](https://github.com/CSRcomplete/UKRBA-CMS/commit/a7f761ef26e18e07243176fc0423cad23823ccae))
* **db:** backfill canonical roles (admin/manager/user) and sync is_admin ([f7475f5](https://github.com/CSRcomplete/UKRBA-CMS/commit/f7475f5d081a1cba0ae76c9af962c10f5209648b))
* Docker self-hosting setup with full automation ([bff363e](https://github.com/CSRcomplete/UKRBA-CMS/commit/bff363e646f0bfa55178922f4af05234515a0920))
* **emails:** add company logo to UKRBA HTML email signature layout ([a5b6bff](https://github.com/CSRcomplete/UKRBA-CMS/commit/a5b6bffdb70e26d76d990ab52434d0ac40fed0d2))
* **emails:** add direct Attach File paperclip button on RichTextEditor toolbar and clarify hyperlink prompt ([b937013](https://github.com/CSRcomplete/UKRBA-CMS/commit/b937013cb6b538f72fdaf630183e856d14f4bb8c))
* **emails:** add direct Sync Emails button to Emails interface header ([c561696](https://github.com/CSRcomplete/UKRBA-CMS/commit/c5616969cfe0243533593d48ec87ea3eedcdebe6))
* **emails:** add Gmail-style real-time visual WYSIWYG RichTextEditor component to compose and reply forms ([1688031](https://github.com/CSRcomplete/UKRBA-CMS/commit/1688031dec3eba3a1a9f01bb61f33a66fc4d75b0))
* **emails:** add Hostinger email account setup preset ([dd7c33c](https://github.com/CSRcomplete/UKRBA-CMS/commit/dd7c33c2c39e402cb9f5656e73e98da3b672c1ec))
* **emails:** add UK SME Responsible Business Association official logo asset to email signature ([bdd90bd](https://github.com/CSRcomplete/UKRBA-CMS/commit/bdd90bdf12bbda5c3c65c3f316ddaf3a261f0054))
* **emails:** automatic UKRBA email signature for all staff members across compose and replies ([326dbba](https://github.com/CSRcomplete/UKRBA-CMS/commit/326dbba1d60052241701e8b31c62f52e72fc84df))
* **emails:** complete conversation threading and fully functional inline reply system ([0e2bbe8](https://github.com/CSRcomplete/UKRBA-CMS/commit/0e2bbe8b2b3d6e4773d68d3fc8d077b0fb9ed67a))
* **emails:** complete Email module upgrade with Folders (Drafts, Trash), Attachments, Templates, and Rich Formatting ([556464b](https://github.com/CSRcomplete/UKRBA-CMS/commit/556464bb921760e4a12e2b27f556a2bbda951038))
* **emails:** complete full file attachment upload and dispatch via Nodemailer and database attachment storage ([ce8db27](https://github.com/CSRcomplete/UKRBA-CMS/commit/ce8db277e8f3f19dc3833d457e23c27eedb62d26))
* enable Next.js standalone output for Docker ([d8d1056](https://github.com/CSRcomplete/UKRBA-CMS/commit/d8d10565fb0fbb425f5d9bb2a41c3fe06a24cf83))
* fallback lead_type to General Enquiry if missing from webhook request ([687c343](https://github.com/CSRcomplete/UKRBA-CMS/commit/687c343586813268354d4570e77037c84fa12d6f))
* **hierarchy:** implement scoped dashboards and custom dashboards for hierarchical roles ([946b254](https://github.com/CSRcomplete/UKRBA-CMS/commit/946b254b98853a482ecd889860956141b00021d9))
* ignore postcode for '5GBP purchase' leads and route 'ukrbadisc' to Email Campaign user ([be57c05](https://github.com/CSRcomplete/UKRBA-CMS/commit/be57c05542df1c3597299f1c48aaf3dafaf6ae72))
* implement bulk selection and bulk deletion for CRM leads restricted to Admin and CEO roles ([6dbe045](https://github.com/CSRcomplete/UKRBA-CMS/commit/6dbe04582c536d632ede6987fc3a7bb628bbe0da))
* Implement hierarchical Meeting Scheduler section ([b40e726](https://github.com/CSRcomplete/UKRBA-CMS/commit/b40e726540e0613f1d7c0bafdb417c9866af253d))
* implement lead ownership history tracking, website mapping, and disable manual lead creation ([f0a2dc1](https://github.com/CSRcomplete/UKRBA-CMS/commit/f0a2dc100071037910038d004401b28aff029f13))
* implement postcode routing admin UI and wire up Zoho meeting follow-up tasks ([7d9c2d3](https://github.com/CSRcomplete/UKRBA-CMS/commit/7d9c2d3c47db84fb66e17959a356291260bda957))
* implement tag-based user management page for staff and area routing ([a0efaa8](https://github.com/CSRcomplete/UKRBA-CMS/commit/a0efaa849658bf65c4f42ba3350ce0a20d974a7f))
* Implement Task Management, Leads Next Actions, and CRM Members module, and fix offline build fonts error ([75f2ac0](https://github.com/CSRcomplete/UKRBA-CMS/commit/75f2ac0dab438c9fd97add722b98485403b60613))
* implement zoho meeting link and follow-up tracking in activities ([3a01a3b](https://github.com/CSRcomplete/UKRBA-CMS/commit/3a01a3bc6dd8e901ea445a5d2ea8ef32d8bfe693))
* integrate UKRBA wix webhook, postcode routing, zoho meeting logger, task escalation cron and database schema ([6c13a32](https://github.com/CSRcomplete/UKRBA-CMS/commit/6c13a3248024c17e8f5a3a3962a88074f1d7fe92))
* **invoices:** add FKs, indexes, line-item trigger, money CHECK ([1496266](https://github.com/CSRcomplete/UKRBA-CMS/commit/1496266419db40292f2b0829eacafbc2c9457c4d))
* **invoices:** add numbering format template + counter consumer ([e533aeb](https://github.com/CSRcomplete/UKRBA-CMS/commit/e533aeb4e7bbe55c1b5a4a5e77c8a6872ef2bc6f))
* **invoices:** add PDF i18n string bundles (EN/CZ) ([02bcd7d](https://github.com/CSRcomplete/UKRBA-CMS/commit/02bcd7d04f3ffda004f8b2297038314ea0564dbd))
* **invoices:** add permission guards ([cb12109](https://github.com/CSRcomplete/UKRBA-CMS/commit/cb121093ed0f49895fa079a8158ed02ba74810ef))
* **invoices:** add Prisma schema, migration, tsvector trigger ([6b9f7f3](https://github.com/CSRcomplete/UKRBA-CMS/commit/6b9f7f366e8592a07d0ac534d0cc6b216762379c))
* **invoices:** add search filter builder ([a37c5fb](https://github.com/CSRcomplete/UKRBA-CMS/commit/a37c5fb894101a9f1d30ab91651f3ece0707d109))
* **invoices:** add totals computation with mixed VAT support ([cced002](https://github.com/CSRcomplete/UKRBA-CMS/commit/cced002054d70f3b6ccb26d6fca20d31bcf70584))
* **invoices:** admin pages — tax rates, series, currencies, settings ([9ed05dc](https://github.com/CSRcomplete/UKRBA-CMS/commit/9ed05dc5f6518784e72f697e5ef0595d04eea5b9))
* **invoices:** API routes for invoices CRUD, lifecycle, payments, search, admin config ([dcd47d0](https://github.com/CSRcomplete/UKRBA-CMS/commit/dcd47d09b367006c3fd467d817b7ef98969cc68c))
* **invoices:** fetch FX rates via frankfurter.app ([04c4e0e](https://github.com/CSRcomplete/UKRBA-CMS/commit/04c4e0e208aba5eb5ad849736357fbca4223f708))
* **invoices:** full invoicing module ([2b420ff](https://github.com/CSRcomplete/UKRBA-CMS/commit/2b420ff085211e321572a55e02a400662380fbc7))
* **invoices:** invoice email template ([788252b](https://github.com/CSRcomplete/UKRBA-CMS/commit/788252b5f3e31692f90a965f4132c1147619d8db))
* **invoices:** invoice UI — list, new, detail, edit pages ([40a09a6](https://github.com/CSRcomplete/UKRBA-CMS/commit/40a09a6e3e62da41d9b01bca8cbfab1bf687c4df))
* **invoices:** MinIO storage wrapper for invoice PDFs ([028d4c2](https://github.com/CSRcomplete/UKRBA-CMS/commit/028d4c2ed35b1cc0a945d317263cf76f82d18bc2))
* **invoices:** PDF render entry ([b9112c4](https://github.com/CSRcomplete/UKRBA-CMS/commit/b9112c426ad86b810d28a62a1faf723c4b7271ce))
* **invoices:** PDF template (@react-pdf/renderer) ([11109f6](https://github.com/CSRcomplete/UKRBA-CMS/commit/11109f62c5fdc5754446862b1beffb285a476127))
* **invoices:** seed currencies, default series, tax rates, settings ([68a8b80](https://github.com/CSRcomplete/UKRBA-CMS/commit/68a8b80793a5f989bd5ea031522e8e467d7459c0))
* **invoices:** server actions for invoice lifecycle ([e698e71](https://github.com/CSRcomplete/UKRBA-CMS/commit/e698e716141f4dcd0d48e2bea7a0bb9ec7217e7e))
* **invoices:** sidebar nav entry + i18n (EN/CZ) ([8c5f1d6](https://github.com/CSRcomplete/UKRBA-CMS/commit/8c5f1d609961e870b5823990695f75edbcd6a839))
* **invoices:** Zod schemas + shared types ([103b2c8](https://github.com/CSRcomplete/UKRBA-CMS/commit/103b2c81517ae23eed2e01f7361c0b1d8acc7273))
* **layout:** set sidebar default state to collapsed icon rail mode across entire CRM layout ([3edfb85](https://github.com/CSRcomplete/UKRBA-CMS/commit/3edfb858c4fecc7c817406d810a23341015e0bac))
* make dashboard leads clickable links to lead details ([7fef0e0](https://github.com/CSRcomplete/UKRBA-CMS/commit/7fef0e08eb6b9fa989c8f6feb8d4b415315723af))
* map Company webhook parameter to business name and handle fallback validation ([e5d8943](https://github.com/CSRcomplete/UKRBA-CMS/commit/e5d894313c7ce97f837113d5fa39645e6d9d4b2f))
* **meetings:** add Copy Link and Share buttons to instant video call toolbar ([98c1074](https://github.com/CSRcomplete/UKRBA-CMS/commit/98c10740d32a71411554c86f9e2775e817d78659))
* **meetings:** integrate Jitsi Meet embedded video conferencing — auto-generated rooms, instant meetings, embedded in-CRM call UI, and Jitsi room links in meeting emails ([6ab9e6f](https://github.com/CSRcomplete/UKRBA-CMS/commit/6ab9e6f18c30d63465404108213dca8088ceabb8))
* **news:** complete News & Announcements noticeboard with admin publishing, category filters, attachments, and sidebar + dashboard integration ([5bdf800](https://github.com/CSRcomplete/UKRBA-CMS/commit/5bdf80030ab05a097c57ee84a8ba0e22f11588b3))
* **news:** make noticeboard news cards clickable to open full blog article reader modal ([45cee63](https://github.com/CSRcomplete/UKRBA-CMS/commit/45cee6302f3c579d642cbdd0bc4c624633206697))
* normalize nested Wix webhook payloads inside API endpoint ([9e4fff5](https://github.com/CSRcomplete/UKRBA-CMS/commit/9e4fff54be2825f4b3dc3b57807248ddceb4f2c5))
* parse White Label Partner vs SME Membership from plan title ([62258ee](https://github.com/CSRcomplete/UKRBA-CMS/commit/62258ee721eae1ab175f42153781ef4aa19bdea6))
* **postcode:** add area name support and seed script for UK postcode routing ([7a2e7a8](https://github.com/CSRcomplete/UKRBA-CMS/commit/7a2e7a8b5a467e24e52e786fc33b3cc41acea27b))
* **recruitment:** complete Recruitment Centre module — candidate pipeline, CV storage, interview & contract tracking, activity log, Wix webhook, and admin-only dashboard tile ([980adaa](https://github.com/CSRcomplete/UKRBA-CMS/commit/980adaae8153bc7c8f4e605d18b089ee35a24343))
* refine White Label lead visibility scopes for assigned RDs, ADs, and CPs ([4787314](https://github.com/CSRcomplete/UKRBA-CMS/commit/4787314f429af9f8cc4e27e630ac73089e1b80cb))
* remove language selection field from user invite form ([b628906](https://github.com/CSRcomplete/UKRBA-CMS/commit/b6289062a4337ffd03100358d702b2ee9e56646e))
* **reports:** per-category functions accept ReportScope to filter data by role ([87d73e0](https://github.com/CSRcomplete/UKRBA-CMS/commit/87d73e0c982b11c259bbdeef298641e087fd4251))
* **repository:** add 6-folder system with subfolders, CEO/Admin upload permissions, email signature formatting and homepage link fix ([9d51b78](https://github.com/CSRcomplete/UKRBA-CMS/commit/9d51b78c6f0b9ae940391213a2c60004f5c077a6))
* resolve interested_service payload parameter and map to lead type in Wix webhook ([5ef52b4](https://github.com/CSRcomplete/UKRBA-CMS/commit/5ef52b42b131e8303f7f262fa7279e13c006ba5b))
* restrict Corporate Partnership visibility to CEO and Ops unless assigned ([e304f48](https://github.com/CSRcomplete/UKRBA-CMS/commit/e304f48540e065d0e9d0cee5f8f938883eef5399))
* restrict lead and document deletions to Admin and CEO roles ([262907c](https://github.com/CSRcomplete/UKRBA-CMS/commit/262907c7ac673093ffd0adc4756874f5d2a1b91a))
* route email_partner leads to RDs by postcode, track 15% commission ([0f6aac1](https://github.com/CSRcomplete/UKRBA-CMS/commit/0f6aac19e3b17ea8fa6ae781e6c1671098a9ad24))
* **routing:** implement many-to-many postcode-to-director assignments and round-robin lead distribution ([5d07dd1](https://github.com/CSRcomplete/UKRBA-CMS/commit/5d07dd10bfa70fd3319e0c4e2a44180e2b8dc1ba))
* **security:** permission-driven authorization migration (Phases A → F.1) ([e06478f](https://github.com/CSRcomplete/UKRBA-CMS/commit/e06478ff16f9a7472c6d16cd0ef6e96c5c409446))
* send email notification with host, designation, time, and meeting link when scheduling meetings ([b3bfac7](https://github.com/CSRcomplete/UKRBA-CMS/commit/b3bfac7941855361b3b3f70cc4c8b192f9577d2f))
* support '5GBP purchase' lead type in wix-leads webhook ([9390d35](https://github.com/CSRcomplete/UKRBA-CMS/commit/9390d35ca8300438097d8871ad43cf400caa7b51))
* support prefix matching for referred_by_rd using refId ([7b3cbc8](https://github.com/CSRcomplete/UKRBA-CMS/commit/7b3cbc89c995e4de7cf4b3c2e630f38886f57f5f))
* support regional_director_id assignment override in wix-leads webhook ([e26b8a4](https://github.com/CSRcomplete/UKRBA-CMS/commit/e26b8a48430c3079015579c9228371c80d4c4497))
* task escalation alerts, level repository, and set-user-password fix ([d376311](https://github.com/CSRcomplete/UKRBA-CMS/commit/d3763118ac5ed5e7dced43b41e11a8016bf26914))
* **tasks:** add Trello-style editable description and interactive checklist system ([f95e6a8](https://github.com/CSRcomplete/UKRBA-CMS/commit/f95e6a886b56024e352ce9489cd0de9856557ae8))
* **tasks:** create single task for group assignments and display group target name in table ([d49f148](https://github.com/CSRcomplete/UKRBA-CMS/commit/d49f148e754a0d01399f2f7fa7c629bee1d47e3e))
* **tasks:** implement bulk assignment to All Users, All Regional Directors, All Area Managers, and All Channel Partners ([704b3d1](https://github.com/CSRcomplete/UKRBA-CMS/commit/704b3d15ccb29e5e3adc2feade9530c971fb254e))
* **tasks:** remove project requirement from task creation and auto-assign default task board ([2faa093](https://github.com/CSRcomplete/UKRBA-CMS/commit/2faa093ce0158a827bb3c4742d3c4818e9f7f558))
* **tasks:** replace available documents with task document repository upload system ([927573d](https://github.com/CSRcomplete/UKRBA-CMS/commit/927573dd7ae78f95e98874cd0163f5afeaa41038))
* track and render task completion dates ([abc83bb](https://github.com/CSRcomplete/UKRBA-CMS/commit/abc83bb3379cd044a2a86922b4d0d74dabc4ded2))
* upgrade Wix lead webhook validation and add Velo reference scripts & API documentation ([b56632e](https://github.com/CSRcomplete/UKRBA-CMS/commit/b56632ed705be612c6e86ed20bc13aad96c7a609))
* WL Chambers campaign attribution + role-scoped Accounts & Payments ([b6311b7](https://github.com/CSRcomplete/UKRBA-CMS/commit/b6311b75d4d3e9800b275d739c8b26ecb32c32cc))


### Bug Fixes

* **account-products:** require account read scope on get-account-products ([36f2d0d](https://github.com/CSRcomplete/UKRBA-CMS/commit/36f2d0d073adcab04729e15395d1f1b1d0273890))
* **account-products:** require account write scope on assignment mutations ([dfa1850](https://github.com/CSRcomplete/UKRBA-CMS/commit/dfa18506a9d96eacb31c7014ca39d17cf46c1c56))
* **admin:** require admin role on activate/deactivate user (close audit gap) ([8215af2](https://github.com/CSRcomplete/UKRBA-CMS/commit/8215af27d86575b3a094e554dbe4e401810fc5e4))
* **admin:** require admin role on CRM-settings server actions ([be27db7](https://github.com/CSRcomplete/UKRBA-CMS/commit/be27db7b31c6e65796bed7d73d1ba8433173a561))
* **admin:** require admin role on currency server actions ([8dfc9ad](https://github.com/CSRcomplete/UKRBA-CMS/commit/8dfc9ad99c3c5224675f9d11046f014a98c1115c))
* **api:** filter contact bulk enrichment ids by user scope ([5014d9a](https://github.com/CSRcomplete/UKRBA-CMS/commit/5014d9ad747c75e0278950a361e30073d09c7c17))
* **api:** filter target bulk enrichment ids by user scope ([4af94fe](https://github.com/CSRcomplete/UKRBA-CMS/commit/4af94fe910f9eb3b0290fe519eae0e7efde1a72e))
* **api:** require contact write scope on enrich POST/DELETE ([b1530c0](https://github.com/CSRcomplete/UKRBA-CMS/commit/b1530c091ebc15e255ccce47e220b755bae8db17))
* **api:** require invoice read scope on PDF route ([a35d7d0](https://github.com/CSRcomplete/UKRBA-CMS/commit/a35d7d0c0c7d12a58b4567bb3fa62fe1dc324508))
* **api:** require parent target write scope on target-contact create ([28912b4](https://github.com/CSRcomplete/UKRBA-CMS/commit/28912b43aed27a08243c066ed644d57c195fe817))
* **api:** require target write scope and contact linkage on per-target-contact enrich ([80f9ee4](https://github.com/CSRcomplete/UKRBA-CMS/commit/80f9ee4dadaff611cbd4fc578e2d7048e371ca76))
* **api:** require target write scope on enrich POST/DELETE (auto-fixes campaign re-export) ([18a0b56](https://github.com/CSRcomplete/UKRBA-CMS/commit/18a0b562a14b36f3b6137a18a856fb8f616f3414))
* **api:** require target write scope on per-target enrich (auto-fixes campaign re-export) ([85cfe72](https://github.com/CSRcomplete/UKRBA-CMS/commit/85cfe720fb2281eb73d74ec737d3c7037442b37f))
* **api:** scope reports/export by role; gate users-directory report ([571fbf3](https://github.com/CSRcomplete/UKRBA-CMS/commit/571fbf37caf71a7a2f66980cf28c6e1a710141e7))
* **api:** scoped contact PATCH closes BOLA/IDOR (GHSA-mg5f-m89f-4gmc) ([c80d3ec](https://github.com/CSRcomplete/UKRBA-CMS/commit/c80d3ec564ddb5f3bf38aec54ff5fb5aa3e7e90c))
* **api:** scoped target PATCH closes BOLA/IDOR (auto-fixes campaign re-export) ([cd0ed0a](https://github.com/CSRcomplete/UKRBA-CMS/commit/cd0ed0a4139398cf003505c44e9bc8a91a9def76))
* **auth:** align auth-client roles with renamed manager/user ([66e0e84](https://github.com/CSRcomplete/UKRBA-CMS/commit/66e0e8428556c9c75da28f601ef33d38cf94a674))
* **authz:** drop readonly tuple from accountUserScopeOR for Prisma compat ([39bcebe](https://github.com/CSRcomplete/UKRBA-CMS/commit/39bcebe70acfe17a391b1d0ad06178c7752b0a43))
* **authz:** include deletedAt:null in target read scope (crm_Targets has soft-delete) ([7a8fc2e](https://github.com/CSRcomplete/UKRBA-CMS/commit/7a8fc2e620c11e3abd9c3b1456703eced05eb61d))
* **authz:** replace is_admin checks with requireRole on admin invoice routes ([a54ed98](https://github.com/CSRcomplete/UKRBA-CMS/commit/a54ed9836deb11b7ba8714fc15a0248d36824ab3))
* **authz:** use lowercase prismadb.documents accessor ([a816361](https://github.com/CSRcomplete/UKRBA-CMS/commit/a816361a0029165294d1e201423a10fdc4e570d8))
* automatically create target S3 bucket in upload route if it does not exist ([d9b117e](https://github.com/CSRcomplete/UKRBA-CMS/commit/d9b117e56dec716588e491bf057fb9119cf90157))
* await params in user page for Next.js 15 compatibility ([4067e43](https://github.com/CSRcomplete/UKRBA-CMS/commit/4067e43dfd46f229a8e30a75e3dfbb945a9eb6e2))
* **branding:** replace remaining NextCRM text with UKRBA across dashboard header, sidebar, and CRM forms ([5866418](https://github.com/CSRcomplete/UKRBA-CMS/commit/5866418a650fc8abdd62e57ee03661c5eba7531d))
* **build:** separate server-side ensureGroupSystemUser from client-side group-assignments constants to resolve Turbopack build errors ([cdc3654](https://github.com/CSRcomplete/UKRBA-CMS/commit/cdc3654ee1a724d3dffecf68140ceb8ee3fa51b9))
* **calendar:** cast JSON attendees field in updateAppointment action ([8585683](https://github.com/CSRcomplete/UKRBA-CMS/commit/8585683f06d03e24e994ff1bfa99d7e174f2aee7))
* **calendar:** fix appointment date range overlap and leadership scope filtering for diary meetings ([f1a8e02](https://github.com/CSRcomplete/UKRBA-CMS/commit/f1a8e026d3f67144b83151c1264eaaf24a184784))
* **campaign-templates:** scope template reads/mutations by role and ownership ([417ae5a](https://github.com/CSRcomplete/UKRBA-CMS/commit/417ae5a8e7ad6049397af2a03997d27b81cc2bfe))
* **campaigns:** narrow createCampaign result before using campaign.id ([1794a88](https://github.com/CSRcomplete/UKRBA-CMS/commit/1794a88ebde37b491a532865229c78175e5f65f4))
* **campaigns:** require auth + ownership on create/update/delete/pause ([6f2b02e](https://github.com/CSRcomplete/UKRBA-CMS/commit/6f2b02e1b35823c87a5a9d6a15e751bc90064c23))
* **campaigns:** require manager/admin role on schedule and send-now ([7361442](https://github.com/CSRcomplete/UKRBA-CMS/commit/7361442c5226030125ede66cb45ba6ea5c4a9aab))
* **campaigns:** scope campaign reads by role ([146d5b4](https://github.com/CSRcomplete/UKRBA-CMS/commit/146d5b4b224bd887dacb50e69b954ea7bdbb8795))
* **combobox:** extract GROUP_ASSIGNMENTS to constant file to fix Server Action export error ([4903f55](https://github.com/CSRcomplete/UKRBA-CMS/commit/4903f557a8573d95f60d1836b46d9a28b9033fab))
* **crm-settings:** allow creating industry, opportunity type, and sales stage values ([dc111f0](https://github.com/CSRcomplete/UKRBA-CMS/commit/dc111f03541e3724e1483e832f39dbc0411b58fd))
* **crm:** convert +44 phone prefix to local 0 format in wix webhook ([91001d0](https://github.com/CSRcomplete/UKRBA-CMS/commit/91001d0464a625648032402b61fdebdc67708647))
* **crm:** expand getCrMTask document select and clean up junction on delete ([b6d2f6b](https://github.com/CSRcomplete/UKRBA-CMS/commit/b6d2f6b4197999af116ae2165d80c7feb4cefd42))
* **crm:** extract payload from body.data if present in wix webhook ([7805ab1](https://github.com/CSRcomplete/UKRBA-CMS/commit/7805ab16c67586b70e0f8cdb74a8a53cc5b5766a))
* **crm:** make lead schema permissive to avoid crash when lastName is empty or dates are strings ([5d20c60](https://github.com/CSRcomplete/UKRBA-CMS/commit/5d20c60e860a4e0479e227574134fd1203447ca9))
* **crm:** make lead update fields optional and remove validation blocks ([5765b50](https://github.com/CSRcomplete/UKRBA-CMS/commit/5765b508cd9247408302a5e9779d6f1b57ae4076))
* **crm:** remove default Unknown suffix for last name fallback ([f71fc71](https://github.com/CSRcomplete/UKRBA-CMS/commit/f71fc71d71910f3b4e198c22e47cc28ae097db3a))
* **crm:** remove task-specific filters from document table toolbar ([5cca3d1](https://github.com/CSRcomplete/UKRBA-CMS/commit/5cca3d1e4e25caef5b6b09056575495ec77c9a64))
* **crm:** require account read scope on getAccountById ([edb9b9b](https://github.com/CSRcomplete/UKRBA-CMS/commit/edb9b9b821b10cc5271560b73caf8efaba02c59c))
* **crm:** require entity-scoped read access on activity feed ([568a7cc](https://github.com/CSRcomplete/UKRBA-CMS/commit/568a7cc8c56e0eb10f97442bb43ea3206978a4d6))
* **crm:** sanitize empty UUID strings to null in updateLead action ([83fb8e1](https://github.com/CSRcomplete/UKRBA-CMS/commit/83fb8e1c8c44f257f1bc587264e5a424941934ee))
* **crm:** scope account list by user/manager/admin role ([a9f9a6f](https://github.com/CSRcomplete/UKRBA-CMS/commit/a9f9a6fa3755e561678361d91af6bae8e239fa2e))
* **crm:** scope account search by user/manager/admin role ([3fd6673](https://github.com/CSRcomplete/UKRBA-CMS/commit/3fd6673879f88ffff8c50dd5801d02b141cecc89))
* **crm:** scope audit-log-by-entity and normalize audit-log-admin to canonical helper ([ea45503](https://github.com/CSRcomplete/UKRBA-CMS/commit/ea45503d576a6fc3181f742adaff58e58b735936))
* **crm:** scope contact reads by role and linked-account/opportunity access ([be7e186](https://github.com/CSRcomplete/UKRBA-CMS/commit/be7e186236b2eef48b0915428cc75eca1c6f0667))
* **crm:** scope contract reads by role and linked-account access ([9b39448](https://github.com/CSRcomplete/UKRBA-CMS/commit/9b39448178c3d6ed241aadf60894ea1fd9479a9f))
* **crm:** scope lead reads by role and linked-account access ([b5d088b](https://github.com/CSRcomplete/UKRBA-CMS/commit/b5d088bbb63d69e5bc79fd62c32f37edf46eabbc))
* **crm:** scope opportunity reads by role; cache key respects user scope ([16c64fb](https://github.com/CSRcomplete/UKRBA-CMS/commit/16c64fbfb063ae0ea41678fa059e74357e296561))
* **crm:** scope pgvector similarity results by user/manager/admin ([a1fb3a8](https://github.com/CSRcomplete/UKRBA-CMS/commit/a1fb3a84a6aab9913929d61d1b5b1bc54420e276))
* **crm:** scope remaining opportunity read actions (by-account, by-contact, user-opps) ([e8bcfc9](https://github.com/CSRcomplete/UKRBA-CMS/commit/e8bcfc91192d6929c046d91456393c1b82f0d6b7))
* **crm:** scope target and target-list reads by role ([9e326eb](https://github.com/CSRcomplete/UKRBA-CMS/commit/9e326ebf35c6596af27779a3faa3b366856f9101))
* **crm:** switch CRM task document actions from broken axios calls to server actions ([efae73e](https://github.com/CSRcomplete/UKRBA-CMS/commit/efae73e56c78d80fcfa7b1358a3bf78df32e8f43))
* **crm:** uncomment assigned_to_user in task document schema and remove ts-ignore ([46c2868](https://github.com/CSRcomplete/UKRBA-CMS/commit/46c2868b34779d0924f578ae94dc3eb9cd303d7b))
* **crm:** wire CRM task documents to correct junction table + cleanup ([d4c503c](https://github.com/CSRcomplete/UKRBA-CMS/commit/d4c503c598a6905b6be826d311beb3fac2218bfa))
* **crm:** wire task comments to correct FK column (assigned_crm_account_task) ([c60ea57](https://github.com/CSRcomplete/UKRBA-CMS/commit/c60ea57dd2f45d800ead11466a32a5696d1c3754))
* **dashboard:** restore getEscalationAlerts import and type annotation in page.tsx ([f89b935](https://github.com/CSRcomplete/UKRBA-CMS/commit/f89b935ecb660cc7860ba3d421ce206a556ecbe9))
* **deps:** patch 2 Dependabot vulnerabilities ([0e2746c](https://github.com/CSRcomplete/UKRBA-CMS/commit/0e2746c2dd504e7e6a8c0d5e86ef9186e5b3c8f7))
* **deps:** patch Dependabot advisories via pnpm overrides ([42eba8e](https://github.com/CSRcomplete/UKRBA-CMS/commit/42eba8e1b83cbe87b7f3a21f5d7df096f051e3d1))
* **deps:** patch Dependabot security advisories ([6002241](https://github.com/CSRcomplete/UKRBA-CMS/commit/60022410b56eab12abd4b10615e1602ade8c159f))
* **deps:** patch Dependabot security advisories via pnpm overrides ([22b2ecf](https://github.com/CSRcomplete/UKRBA-CMS/commit/22b2ecf2f09528a3219e740df36b7399ad967298))
* Docker e2e verification fixes ([e1ae699](https://github.com/CSRcomplete/UKRBA-CMS/commit/e1ae699cf8ce0e767bacdd3034f14bf3b4bf304b))
* **docker:** make admin email configurable via ADMIN_EMAIL ([7427b0a](https://github.com/CSRcomplete/UKRBA-CMS/commit/7427b0a3277b8fff83635cd1cf339eab92d442f1))
* **docker:** replace hardcoded credentials with env-driven placeholders ([255b11e](https://github.com/CSRcomplete/UKRBA-CMS/commit/255b11e882d4e6bdcb4172f8905bd65556ee22df))
* **documents:** filter bulk document operations by user scope (fail-closed) ([61132fe](https://github.com/CSRcomplete/UKRBA-CMS/commit/61132fee767cffbd9b4d81d9dc7b052bb969d3c0))
* **documents:** require ownership/account scope on document mutations ([5bb9035](https://github.com/CSRcomplete/UKRBA-CMS/commit/5bb9035052326065cab5d5c56c57d959d60fce07))
* **documents:** scope document reads by role and linked-entity access ([220cf23](https://github.com/CSRcomplete/UKRBA-CMS/commit/220cf231c5ddcda9905e556f92aefa4268d6015b))
* **emails:** add icon imports in ComposeModal component ([be843b0](https://github.com/CSRcomplete/UKRBA-CMS/commit/be843b08360413b11f437659a2a1bdddb785c87a))
* **emails:** add missing closing brace for getUKRBASignatureHtml ([0238a0a](https://github.com/CSRcomplete/UKRBA-CMS/commit/0238a0a6a8dfbcb387cda0189099872dd0bb724a))
* **emails:** correct JSON type casting in email-sync helper ([9f4ce53](https://github.com/CSRcomplete/UKRBA-CMS/commit/9f4ce53c1cb9ce16ccebf5764ad2782756f864f6))
* **emails:** correct JSX closing tags in mail-display component ([87a0a32](https://github.com/CSRcomplete/UKRBA-CMS/commit/87a0a329f28518a0e7a8889623d1372f7bc1dc16))
* **emails:** enable direct synchronous IMAP fetch on sync and account creation ([16a74a6](https://github.com/CSRcomplete/UKRBA-CMS/commit/16a74a6cf99d377c8908e933fefc4eda198775dd))
* **emails:** generate and dispatch HTML email body with visual UK SME logo signature ([bc5c871](https://github.com/CSRcomplete/UKRBA-CMS/commit/bc5c871d259a7e50fa7c4e4596aa923db113e6c3))
* **emails:** leave blank writing lines above signature when opening compose or reply forms ([c2d576c](https://github.com/CSRcomplete/UKRBA-CMS/commit/c2d576c54aea9079c70fa7274e9cec7731d8c97a))
* **emails:** parse bold and italic markdown tags into rich HTML elements before sending via SMTP ([e7b390d](https://github.com/CSRcomplete/UKRBA-CMS/commit/e7b390dddb5317447c29129692182f1dd4ff0024))
* **emails:** render HTML &lt;div&gt;&lt;br&gt;&lt;/div&gt; line breaks in contentEditable visual editor above UKRBA signature ([0443c75](https://github.com/CSRcomplete/UKRBA-CMS/commit/0443c753a706975bcae96b86000ea1a3cb67baad))
* **emails:** render visual image attachment previews in CRM thread view and prevent escaping HTML tags ([6ad3262](https://github.com/CSRcomplete/UKRBA-CMS/commit/6ad326263b28109640fac9bdacedc43a42f16ba7))
* **emails:** update Mail type and MailProps activeFolder to full EmailFolder enum ([9474607](https://github.com/CSRcomplete/UKRBA-CMS/commit/947460736fdc37aa1b4dfe9105cbac4bce469c4f))
* extract file key from absolute url if key is missing to support legacy documents ([bc38be2](https://github.com/CSRcomplete/UKRBA-CMS/commit/bc38be2499609ab9600c2b5aa47c8a07f6169301))
* Fall back to email in MeetingSchedulerForm if display name is null ([fcff9e5](https://github.com/CSRcomplete/UKRBA-CMS/commit/fcff9e5e2834d2d16ac5c024b6c7e27cae3d075b))
* grant CEO and COO the same admin settings/user-management access ([c36db62](https://github.com/CSRcomplete/UKRBA-CMS/commit/c36db62b7b5dc20a1bc1ad3a42d30a5431a3c097))
* include original HTML body when forwarding/replying to emails ([0def0b3](https://github.com/CSRcomplete/UKRBA-CMS/commit/0def0b3f69b023435fa8e6016e2bbee78d7a292a))
* **invoices:** add PROFORMA to Zod invoice type enum ([18d6e40](https://github.com/CSRcomplete/UKRBA-CMS/commit/18d6e40281ab8fb726f21c6c4b99ddb92ea79ff6))
* **invoices:** add supplier company details, PDF regeneration, admin route guard ([31e2b29](https://github.com/CSRcomplete/UKRBA-CMS/commit/31e2b29c0d99d5a86429eeb5b03de38c45586cd2))
* **invoices:** consolidate Invoice_Currencies into shared Currency table ([43f3814](https://github.com/CSRcomplete/UKRBA-CMS/commit/43f3814a57973d18a7d687ee153a7b108231f68b))
* **invoices:** consolidate Invoice_Currencies into shared Currency table ([2c6820d](https://github.com/CSRcomplete/UKRBA-CMS/commit/2c6820d65e440906472f498b490f7c9fbdd73ea3))
* **invoices:** fix Set type annotation in permissions for strict tsc ([1132616](https://github.com/CSRcomplete/UKRBA-CMS/commit/1132616272afd08368884862a2ef436bf24dfb12))
* **invoices:** hydration mismatches, decimal serialization, server action refactor ([75368f4](https://github.com/CSRcomplete/UKRBA-CMS/commit/75368f409bf61792ca0997492448b30ab4a3cd36))
* **invoices:** redirect to /invoices after creating new invoice ([2dd2d5e](https://github.com/CSRcomplete/UKRBA-CMS/commit/2dd2d5ecbee40f515a1f5d77153acffcea519600))
* **invoices:** redirect to invoice detail page after create/edit ([d58c35d](https://github.com/CSRcomplete/UKRBA-CMS/commit/d58c35db10e4ab03d88aec9fa0be7297d915db58))
* **invoices:** remove unused imports and prefix unused params ([b3e4ccc](https://github.com/CSRcomplete/UKRBA-CMS/commit/b3e4cccdabf580dedd4329afd3d2133eba38a436))
* **invoices:** remove unused React import from PDF template ([b851ece](https://github.com/CSRcomplete/UKRBA-CMS/commit/b851ece3b534acfbc4d628ad6fb10227679ee7c1))
* **invoices:** replace Account select with searchable combobox ([08e9b3d](https://github.com/CSRcomplete/UKRBA-CMS/commit/08e9b3d61f87113e6254fae2f48da15f6c2b42b5))
* **invoices:** require account read scope on get-invoices-by-accountId ([c8cbf66](https://github.com/CSRcomplete/UKRBA-CMS/commit/c8cbf669e34e651eb65e9799f25491480eef52f2))
* **invoices:** require account write scope on create and on accountId reassignment ([f8282e5](https://github.com/CSRcomplete/UKRBA-CMS/commit/f8282e5ec64f7f469502173d1d28af34b81f7bae))
* **invoices:** require read scope on source and write scope on accountId for duplicateInvoice ([eb792a7](https://github.com/CSRcomplete/UKRBA-CMS/commit/eb792a76dd05dfba7bf9db855e27f6d293db5ce9))
* **invoices:** review fixes — balanceDue, FX outside tx, permissions, search column, email template ([dde9dfa](https://github.com/CSRcomplete/UKRBA-CMS/commit/dde9dfaba15274c910329a71ad299585407c47f8))
* **invoices:** supplier company details, PDF regeneration, admin route guard ([4c45b8e](https://github.com/CSRcomplete/UKRBA-CMS/commit/4c45b8e48ca60741c39d54ff2744a93242e1fabe))
* **make-admin:** import dotenv for standalone execution ([fd2231e](https://github.com/CSRcomplete/UKRBA-CMS/commit/fd2231ef1dc2e1b4646cfb6d96f07c2c66a43c19))
* **mcp:** set basePath so /api/mcp/{mcp,sse} actually route ([16fb5be](https://github.com/CSRcomplete/UKRBA-CMS/commit/16fb5be137fb54b5de324f659dd8b48881004aad))
* **mcp:** set basePath so /api/mcp/{mcp,sse} actually route ([3c36be2](https://github.com/CSRcomplete/UKRBA-CMS/commit/3c36be22658d27092606e32dea3d083fcc0b1bfd))
* **meetings:** add seamless direct iframe fallback for embedded Jitsi video calls ([b070475](https://github.com/CSRcomplete/UKRBA-CMS/commit/b0704757ba638bdab35ba7cd1daf4f58c75ea61c))
* **meetings:** eliminate duplicate participant connections by enforcing single iframe session ([c168358](https://github.com/CSRcomplete/UKRBA-CMS/commit/c168358600304228483973da283836feb436f096))
* **meetings:** move Jitsi helper functions to lib/jitsi.ts to comply with Next.js Server Action export rules ([7ae3a8d](https://github.com/CSRcomplete/UKRBA-CMS/commit/7ae3a8d9aae976b2816a0245a3a40a7e43a6f944))
* **meetings:** remove legacy meetingLink field from DirectMeetingScheduler, update to Jitsi auto-room pattern ([6e07725](https://github.com/CSRcomplete/UKRBA-CMS/commit/6e07725a3cbb9447da8b9de229f46a7e61db93fb))
* **meetings:** switch Jitsi domain to 8x8.vc and add Launch Pop-up Window button ([5750afb](https://github.com/CSRcomplete/UKRBA-CMS/commit/5750afbaffdb8f5e439b4901e536d73f9244103d))
* **meetings:** switch Jitsi domain to meet.element.io to bypass moderator login requirements ([d0d41be](https://github.com/CSRcomplete/UKRBA-CMS/commit/d0d41be97a041df46e0137e00de00d977aa02809))
* **meetings:** use open public Jitsi server node to bypass 8x8 moderator login wall on room creation ([677f383](https://github.com/CSRcomplete/UKRBA-CMS/commit/677f38343bb713e61d4b1c9834e6f7107f9b2ef8))
* **migration:** scrub orphan creator FK refs before adding new FK constraint ([7fa5196](https://github.com/CSRcomplete/UKRBA-CMS/commit/7fa5196b04d594386ce17bd23049207a556e581e))
* **pm2:** dynamically load environment variables from .env to prevent overwriting production credentials ([7b08404](https://github.com/CSRcomplete/UKRBA-CMS/commit/7b08404000f159d41c7a75072c7957ba24abdc45))
* **prisma:** add missing crm_Target_Contact migration ([7d76537](https://github.com/CSRcomplete/UKRBA-CMS/commit/7d76537f9ae994430fd782b6c7a789eb4dac69a8))
* **prisma:** add missing migration for crm_Target_Contact table ([792b8c3](https://github.com/CSRcomplete/UKRBA-CMS/commit/792b8c3ec24efeea963afdcbc71d4b2bf003bc72))
* **products:** require authentication on product read actions ([b2a860f](https://github.com/CSRcomplete/UKRBA-CMS/commit/b2a860fcbff5cd84bbd73faf574c1f3079653ce2))
* **products:** require manager/admin role on product mutations ([61ed918](https://github.com/CSRcomplete/UKRBA-CMS/commit/61ed918e65629661f9818ca2a4dcf6bc3f46a4cb))
* **projects:** require board write/read scope on board mutations ([522ca13](https://github.com/CSRcomplete/UKRBA-CMS/commit/522ca1323f45b38f5c78fdd64116d5c6c8f07206))
* **projects:** require parent board write scope on section mutations ([65e208f](https://github.com/CSRcomplete/UKRBA-CMS/commit/65e208fcff948eca80e3380fb599dc585f63b0e7))
* **projects:** scope project read actions by board access ([5ddaa97](https://github.com/CSRcomplete/UKRBA-CMS/commit/5ddaa976f853b88b526c129e0787939aa4567a9b))
* **projects:** scope task mutations (board strict + assignee soft) ([27f0cf8](https://github.com/CSRcomplete/UKRBA-CMS/commit/27f0cf8dfd7999599397d4f65a7f9d082900c848))
* **reports:** gate users-directory report behind manager/admin ([20aeeaf](https://github.com/CSRcomplete/UKRBA-CMS/commit/20aeeafec24b3d6f02ad3f69e1d0d2d68c88f4f8))
* **reports:** scope config and schedule reads/mutations by role and ownership ([932de36](https://github.com/CSRcomplete/UKRBA-CMS/commit/932de36cd3dd84c20fae20d49f72badd76a970e0))
* **reports:** scope dashboard tasks count and unified search by role ([d17a880](https://github.com/CSRcomplete/UKRBA-CMS/commit/d17a880eb6b8ac06097756d6006fcf11b44b1138))
* **reports:** scope scheduled-report data by schedule owner role ([7f7c7b6](https://github.com/CSRcomplete/UKRBA-CMS/commit/7f7c7b63f1cf6fd550454b3040981f1bbef13b5d))
* resolve file upload and visibility issues in repository by routing uploads through server-side proxy ([7a2337a](https://github.com/CSRcomplete/UKRBA-CMS/commit/7a2337a9f3a7eab38a52f9a42663bcab6af6dd45))
* restore FormLabel import in InviteForm ([584035f](https://github.com/CSRcomplete/UKRBA-CMS/commit/584035ff91e4e86cb4ad54d24667301e950db204))
* robust package.json version reading in getNextVersion to prevent crashes ([dae023b](https://github.com/CSRcomplete/UKRBA-CMS/commit/dae023b68af1c68267ac6f0e81442aa6c7739fea))
* route direct plan purchases by postcode like other lead intake ([e570495](https://github.com/CSRcomplete/UKRBA-CMS/commit/e570495985511012cf9648d9ccac19a84795e8e5))
* **security:** admin server action lockdown (Phase C) ([5a555fe](https://github.com/CSRcomplete/UKRBA-CMS/commit/5a555febe929bb3d477704914756737a04f3d3fd))
* **security:** authz cleanup — drop is_admin, role enum (Phase F) ([c22bf83](https://github.com/CSRcomplete/UKRBA-CMS/commit/c22bf837e83b10487641fcfc458629fa0fedf5d6))
* **security:** close enrichment BOLA/IDOR (Phase B1) ([726be4c](https://github.com/CSRcomplete/UKRBA-CMS/commit/726be4cb48c60620a15c3a3a850e8bde379a6e54))
* **security:** close GHSA-mg5f-m89f-4gmc + permission-driven authz foundation ([e6987aa](https://github.com/CSRcomplete/UKRBA-CMS/commit/e6987aa049dc6816a25c45436556960893c9c15d))
* **security:** close invoice IDOR (Phase B2) ([88d488b](https://github.com/CSRcomplete/UKRBA-CMS/commit/88d488b939057f4769d22f6ce00442738d73792b))
* **security:** enforce manager/admin RBAC in MCP product tools (GHSA-wv63-cq38-qg58) ([1c41d58](https://github.com/CSRcomplete/UKRBA-CMS/commit/1c41d5832629f50e658fb64a884c98e846830549))
* **security:** enforce object-level authz in MCP campaign tools (GHSA-c9vg-c532-ppqx) ([88258b1](https://github.com/CSRcomplete/UKRBA-CMS/commit/88258b1cce63f42e9399b1ce9575a72dc89b72c5))
* **security:** scope campaigns + templates (Phase E2) ([99effa9](https://github.com/CSRcomplete/UKRBA-CMS/commit/99effa90d2154a930933b58bf64105fd70e0f52a))
* **security:** scope CRM account reads by role (Phase D1) ([cbc3a30](https://github.com/CSRcomplete/UKRBA-CMS/commit/cbc3a30a9b16ef3bd3e85ea7cc5bec234eba17f6))
* **security:** scope CRM accounts list by user authz read scope ([08c0ec7](https://github.com/CSRcomplete/UKRBA-CMS/commit/08c0ec7c521d44c02e7978aaf1744d9229e049df))
* **security:** scope CRM accounts list by user authz read scope ([8e86e03](https://github.com/CSRcomplete/UKRBA-CMS/commit/8e86e03894e4cb4b9d9c5d2265a915fd9ce775bb))
* **security:** scope CRM lead/contact/opportunity/contract reads by role (Phase D2) ([d795b00](https://github.com/CSRcomplete/UKRBA-CMS/commit/d795b00f6558777f3019a830069561fccb4de4f5))
* **security:** scope documents + bulk ops (Phase E3) ([12ac3df](https://github.com/CSRcomplete/UKRBA-CMS/commit/12ac3df7218d9512a5b6f0cf33cc750cc9ffe4d1))
* **security:** scope products + account-products + invoice list (Phase E1) ([4ecfc56](https://github.com/CSRcomplete/UKRBA-CMS/commit/4ecfc565c7b40c2b038f418971fc292a2c596663))
* **security:** scope projects (boards/sections/tasks) (Phase E4) ([bc2a72a](https://github.com/CSRcomplete/UKRBA-CMS/commit/bc2a72a23c6ae4895c7c9cdf74f45ccaeb915bf2))
* **security:** scope reports + dashboard + unified search by role (Phase B3) ([477dcf6](https://github.com/CSRcomplete/UKRBA-CMS/commit/477dcf6b31db740bfb3e875f972c63ba2cd19bba))
* **security:** scope targets, activities, audit log, similarity (Phase D3) ([07a03f9](https://github.com/CSRcomplete/UKRBA-CMS/commit/07a03f9f23b09b29994c1ccacd16fb3e520308c6))
* **seed:** fix ES modules hoisting by dynamically importing prismadb ([8ed9280](https://github.com/CSRcomplete/UKRBA-CMS/commit/8ed9280cbcb100c06e9f7e863d254b04f5e65d7d))
* **seed:** use standard prismadb client configured with PG adapter ([8ffd878](https://github.com/CSRcomplete/UKRBA-CMS/commit/8ffd8782712b492824b5de4d4584de4b4f173b5c))
* show/save a Regional Director's own postcode areas correctly ([68b702a](https://github.com/CSRcomplete/UKRBA-CMS/commit/68b702af4e41e0783fe1835df1eb933cfcbfec82))
* **tasks:** ensure BigInt position casting and valid UUID assignments across task creation actions ([704843c](https://github.com/CSRcomplete/UKRBA-CMS/commit/704843c3c7ab4eb3d61b929aaced9d88124ede3d))
* **tasks:** map group assignments to valid UUID system placeholder records to prevent foreign key errors ([0a5b42d](https://github.com/CSRcomplete/UKRBA-CMS/commit/0a5b42d27958645826542ce82446a69549294945))
* **tasks:** resolve board watcher primary key constraint and section validation blocking task comments ([db1b96a](https://github.com/CSRcomplete/UKRBA-CMS/commit/db1b96ab3bff928030503c913cb2146ce0ea6ae1))
* **tasks:** resolve optional content and priority type validation for task creation dialog ([eb34c92](https://github.com/CSRcomplete/UKRBA-CMS/commit/eb34c92d2db966d9685b300791d4b3d97b1d0667))
* **tasks:** resolve postgres uuid syntax exception on group task email notification lookup ([1ca13f5](https://github.com/CSRcomplete/UKRBA-CMS/commit/1ca13f57c649ecd9d2749a32919fbf4287029f00))
* **tasks:** resolve prisma unique email constraint exception for group system user upserts ([119ebe0](https://github.com/CSRcomplete/UKRBA-CMS/commit/119ebe0db2c72e41024dae206c3aa24aee67ded2))
* **tasks:** resolve task creation authorization error and add board permission fallback ([d072ffc](https://github.com/CSRcomplete/UKRBA-CMS/commit/d072ffca5049a46a700d5c325771e7263b9e3e63))
* **tests:** merge duplicate prismadb.documents mock keys after lowercase fix ([3446bc9](https://github.com/CSRcomplete/UKRBA-CMS/commit/3446bc96e08d28457dee09d014297ef42370e91a))
* validate referred_by_rd as UUID format before querying users id column ([e2616d7](https://github.com/CSRcomplete/UKRBA-CMS/commit/e2616d7aa98b03e564280cf1c787062182f40a81))
* **webhook:** add deduplication to wix leads webhook using email and recent gte created timestamp ([8aece20](https://github.com/CSRcomplete/UKRBA-CMS/commit/8aece202b71611a6140371fc81524f0bd6a07a7a))
* **webhook:** add robust fallbacks for raw Wix webhook payloads ([5539862](https://github.com/CSRcomplete/UKRBA-CMS/commit/55398627e27119950b7dcbbd6e531683342f0b8a))
* **webhook:** add support for postcode_1 field key from Wix checkout forms ([16e14e6](https://github.com/CSRcomplete/UKRBA-CMS/commit/16e14e63552ed5e5e8bc32b506f09976781f8bf1))
* **webhook:** capture business_name_1 field key for White Label checkouts ([52d381d](https://github.com/CSRcomplete/UKRBA-CMS/commit/52d381d7c4c87374798b915881dc4e726a544621))

## [0.12.1](https://github.com/pdovhomilja/nextcrm-app/compare/v0.12.0...v0.12.1) (2026-05-11)


### Bug Fixes

* **mcp:** set basePath so /api/mcp/{mcp,sse} actually route ([16fb5be](https://github.com/pdovhomilja/nextcrm-app/commit/16fb5be137fb54b5de324f659dd8b48881004aad))
* **mcp:** set basePath so /api/mcp/{mcp,sse} actually route ([3c36be2](https://github.com/pdovhomilja/nextcrm-app/commit/3c36be22658d27092606e32dea3d083fcc0b1bfd))

## [0.12.0](https://github.com/pdovhomilja/nextcrm-app/compare/v0.11.1...v0.12.0) (2026-05-08)


### Features

* **authz:** add account read-scope helpers ([6fdff66](https://github.com/pdovhomilja/nextcrm-app/commit/6fdff669fdd1db42789b106e0e4f8939a98f6ff0))
* **authz:** add account write-scope assertion helper ([fb4b8f6](https://github.com/pdovhomilja/nextcrm-app/commit/fb4b8f66052d62097bea9c66c1d0c8bf9ae4c05c))
* **authz:** add account/lead/opportunity id-filter helpers (similarity post-filter) ([98b32f1](https://github.com/pdovhomilja/nextcrm-app/commit/98b32f17eb2c11e9237f95eddc85d0bf89d8206b))
* **authz:** add activity-for-entity scope dispatch helper ([db08f51](https://github.com/pdovhomilja/nextcrm-app/commit/db08f51b8b943ffac1a755029a27c352e6ac7a6f))
* **authz:** add AuthenticationError and AuthorizationError ([47e4980](https://github.com/pdovhomilja/nextcrm-app/commit/47e49805928975b8a0932c380871c0e174c287c1))
* **authz:** add barrel export ([48a2a5e](https://github.com/pdovhomilja/nextcrm-app/commit/48a2a5e379f8a634ebd322603c139c2cf715a399))
* **authz:** add board and task read/write scope helpers ([380e6a5](https://github.com/pdovhomilja/nextcrm-app/commit/380e6a59f636416ef1650ef849b947b6edab7a4a))
* **authz:** add bulk-id authorization filters for contacts and targets ([388d29d](https://github.com/pdovhomilja/nextcrm-app/commit/388d29dcbea52c6dfcfe2e3720ed2bb3fc515cb7))
* **authz:** add campaign and template read/write scope helpers ([6af7af0](https://github.com/pdovhomilja/nextcrm-app/commit/6af7af033f6d49df1844fb07e2687401d110c7c0))
* **authz:** add canonical AppRole type and legacy role mapper ([1350ed3](https://github.com/pdovhomilja/nextcrm-app/commit/1350ed39623a61aa31ed2e9220fa66b7782796a4))
* **authz:** add document read/write scope helpers (linked-entity aware) ([f2122a2](https://github.com/pdovhomilja/nextcrm-app/commit/f2122a23eec404e431445d7645ef9c3431e5bdce))
* **authz:** add enrichment cancel permission helpers ([6acbfec](https://github.com/pdovhomilja/nextcrm-app/commit/6acbfec765d0bc68748a20f8b3df75602220bd5c))
* **authz:** add lead/contact/opportunity/contract read-scope helpers (linked-account aware) ([bfaef87](https://github.com/pdovhomilja/nextcrm-app/commit/bfaef8756686eb2c07236b1250e67032cbaafbb4))
* **authz:** add read/write assertion helpers for contacts and targets ([e0fff6b](https://github.com/pdovhomilja/nextcrm-app/commit/e0fff6b911f145fe1878de9d3969657b897bb2f9))
* **authz:** add ReportScope builder for per-role report data filtering ([0035bf0](https://github.com/pdovhomilja/nextcrm-app/commit/0035bf0cb3047a5a54c7caf7eb898b2037306d79))
* **authz:** add requireAuthenticated, requireRole, role predicates ([30c3472](https://github.com/pdovhomilja/nextcrm-app/commit/30c3472f94e6e2555ad2ca9109f793c795b7c497))
* **authz:** add route response helpers (401/403/404) ([7ad29ae](https://github.com/pdovhomilja/nextcrm-app/commit/7ad29aea1639d3c403d1283698c65c74aef164ed))
* **authz:** add scoped contact and target update helpers ([071cb2c](https://github.com/pdovhomilja/nextcrm-app/commit/071cb2ceab48858c505a3ed7e3b0ae47119e7b1e))
* **authz:** add target and target-list read-scope helpers ([45b82a8](https://github.com/pdovhomilja/nextcrm-app/commit/45b82a87538d54921cbb370b9d873cb42cc68a35))
* **authz:** align UI/action callers to canonical role names ([1dc5618](https://github.com/pdovhomilja/nextcrm-app/commit/1dc5618c6c17d3e5b96295c9c38ff2324fd91447))
* **authz:** switch Users.role to Prisma enum AppRole ([d598305](https://github.com/pdovhomilja/nextcrm-app/commit/d598305ebc97b15852f41d5cc5f1807836302cfe))
* **authz:** validate setUserRole against canonical AppRole ([77241b7](https://github.com/pdovhomilja/nextcrm-app/commit/77241b726b748a5191c5acb6c331888672eac947))
* **db:** backfill canonical roles (admin/manager/user) and sync is_admin ([f7475f5](https://github.com/pdovhomilja/nextcrm-app/commit/f7475f5d081a1cba0ae76c9af962c10f5209648b))
* **reports:** per-category functions accept ReportScope to filter data by role ([87d73e0](https://github.com/pdovhomilja/nextcrm-app/commit/87d73e0c982b11c259bbdeef298641e087fd4251))
* **security:** permission-driven authorization migration (Phases A → F.1) ([e06478f](https://github.com/pdovhomilja/nextcrm-app/commit/e06478ff16f9a7472c6d16cd0ef6e96c5c409446))


### Bug Fixes

* **account-products:** require account read scope on get-account-products ([36f2d0d](https://github.com/pdovhomilja/nextcrm-app/commit/36f2d0d073adcab04729e15395d1f1b1d0273890))
* **account-products:** require account write scope on assignment mutations ([dfa1850](https://github.com/pdovhomilja/nextcrm-app/commit/dfa18506a9d96eacb31c7014ca39d17cf46c1c56))
* **admin:** require admin role on activate/deactivate user (close audit gap) ([8215af2](https://github.com/pdovhomilja/nextcrm-app/commit/8215af27d86575b3a094e554dbe4e401810fc5e4))
* **admin:** require admin role on CRM-settings server actions ([be27db7](https://github.com/pdovhomilja/nextcrm-app/commit/be27db7b31c6e65796bed7d73d1ba8433173a561))
* **admin:** require admin role on currency server actions ([8dfc9ad](https://github.com/pdovhomilja/nextcrm-app/commit/8dfc9ad99c3c5224675f9d11046f014a98c1115c))
* **api:** filter contact bulk enrichment ids by user scope ([5014d9a](https://github.com/pdovhomilja/nextcrm-app/commit/5014d9ad747c75e0278950a361e30073d09c7c17))
* **api:** filter target bulk enrichment ids by user scope ([4af94fe](https://github.com/pdovhomilja/nextcrm-app/commit/4af94fe910f9eb3b0290fe519eae0e7efde1a72e))
* **api:** require contact write scope on enrich POST/DELETE ([b1530c0](https://github.com/pdovhomilja/nextcrm-app/commit/b1530c091ebc15e255ccce47e220b755bae8db17))
* **api:** require invoice read scope on PDF route ([a35d7d0](https://github.com/pdovhomilja/nextcrm-app/commit/a35d7d0c0c7d12a58b4567bb3fa62fe1dc324508))
* **api:** require parent target write scope on target-contact create ([28912b4](https://github.com/pdovhomilja/nextcrm-app/commit/28912b43aed27a08243c066ed644d57c195fe817))
* **api:** require target write scope and contact linkage on per-target-contact enrich ([80f9ee4](https://github.com/pdovhomilja/nextcrm-app/commit/80f9ee4dadaff611cbd4fc578e2d7048e371ca76))
* **api:** require target write scope on enrich POST/DELETE (auto-fixes campaign re-export) ([18a0b56](https://github.com/pdovhomilja/nextcrm-app/commit/18a0b562a14b36f3b6137a18a856fb8f616f3414))
* **api:** require target write scope on per-target enrich (auto-fixes campaign re-export) ([85cfe72](https://github.com/pdovhomilja/nextcrm-app/commit/85cfe720fb2281eb73d74ec737d3c7037442b37f))
* **api:** scope reports/export by role; gate users-directory report ([571fbf3](https://github.com/pdovhomilja/nextcrm-app/commit/571fbf37caf71a7a2f66980cf28c6e1a710141e7))
* **api:** scoped contact PATCH closes BOLA/IDOR (GHSA-mg5f-m89f-4gmc) ([c80d3ec](https://github.com/pdovhomilja/nextcrm-app/commit/c80d3ec564ddb5f3bf38aec54ff5fb5aa3e7e90c))
* **api:** scoped target PATCH closes BOLA/IDOR (auto-fixes campaign re-export) ([cd0ed0a](https://github.com/pdovhomilja/nextcrm-app/commit/cd0ed0a4139398cf003505c44e9bc8a91a9def76))
* **auth:** align auth-client roles with renamed manager/user ([66e0e84](https://github.com/pdovhomilja/nextcrm-app/commit/66e0e8428556c9c75da28f601ef33d38cf94a674))
* **authz:** drop readonly tuple from accountUserScopeOR for Prisma compat ([39bcebe](https://github.com/pdovhomilja/nextcrm-app/commit/39bcebe70acfe17a391b1d0ad06178c7752b0a43))
* **authz:** include deletedAt:null in target read scope (crm_Targets has soft-delete) ([7a8fc2e](https://github.com/pdovhomilja/nextcrm-app/commit/7a8fc2e620c11e3abd9c3b1456703eced05eb61d))
* **authz:** replace is_admin checks with requireRole on admin invoice routes ([a54ed98](https://github.com/pdovhomilja/nextcrm-app/commit/a54ed9836deb11b7ba8714fc15a0248d36824ab3))
* **authz:** use lowercase prismadb.documents accessor ([a816361](https://github.com/pdovhomilja/nextcrm-app/commit/a816361a0029165294d1e201423a10fdc4e570d8))
* **campaign-templates:** scope template reads/mutations by role and ownership ([417ae5a](https://github.com/pdovhomilja/nextcrm-app/commit/417ae5a8e7ad6049397af2a03997d27b81cc2bfe))
* **campaigns:** narrow createCampaign result before using campaign.id ([1794a88](https://github.com/pdovhomilja/nextcrm-app/commit/1794a88ebde37b491a532865229c78175e5f65f4))
* **campaigns:** require auth + ownership on create/update/delete/pause ([6f2b02e](https://github.com/pdovhomilja/nextcrm-app/commit/6f2b02e1b35823c87a5a9d6a15e751bc90064c23))
* **campaigns:** require manager/admin role on schedule and send-now ([7361442](https://github.com/pdovhomilja/nextcrm-app/commit/7361442c5226030125ede66cb45ba6ea5c4a9aab))
* **campaigns:** scope campaign reads by role ([146d5b4](https://github.com/pdovhomilja/nextcrm-app/commit/146d5b4b224bd887dacb50e69b954ea7bdbb8795))
* **crm:** require account read scope on getAccountById ([edb9b9b](https://github.com/pdovhomilja/nextcrm-app/commit/edb9b9b821b10cc5271560b73caf8efaba02c59c))
* **crm:** require entity-scoped read access on activity feed ([568a7cc](https://github.com/pdovhomilja/nextcrm-app/commit/568a7cc8c56e0eb10f97442bb43ea3206978a4d6))
* **crm:** scope account list by user/manager/admin role ([a9f9a6f](https://github.com/pdovhomilja/nextcrm-app/commit/a9f9a6fa3755e561678361d91af6bae8e239fa2e))
* **crm:** scope account search by user/manager/admin role ([3fd6673](https://github.com/pdovhomilja/nextcrm-app/commit/3fd6673879f88ffff8c50dd5801d02b141cecc89))
* **crm:** scope audit-log-by-entity and normalize audit-log-admin to canonical helper ([ea45503](https://github.com/pdovhomilja/nextcrm-app/commit/ea45503d576a6fc3181f742adaff58e58b735936))
* **crm:** scope contact reads by role and linked-account/opportunity access ([be7e186](https://github.com/pdovhomilja/nextcrm-app/commit/be7e186236b2eef48b0915428cc75eca1c6f0667))
* **crm:** scope contract reads by role and linked-account access ([9b39448](https://github.com/pdovhomilja/nextcrm-app/commit/9b39448178c3d6ed241aadf60894ea1fd9479a9f))
* **crm:** scope lead reads by role and linked-account access ([b5d088b](https://github.com/pdovhomilja/nextcrm-app/commit/b5d088bbb63d69e5bc79fd62c32f37edf46eabbc))
* **crm:** scope opportunity reads by role; cache key respects user scope ([16c64fb](https://github.com/pdovhomilja/nextcrm-app/commit/16c64fbfb063ae0ea41678fa059e74357e296561))
* **crm:** scope pgvector similarity results by user/manager/admin ([a1fb3a8](https://github.com/pdovhomilja/nextcrm-app/commit/a1fb3a84a6aab9913929d61d1b5b1bc54420e276))
* **crm:** scope remaining opportunity read actions (by-account, by-contact, user-opps) ([e8bcfc9](https://github.com/pdovhomilja/nextcrm-app/commit/e8bcfc91192d6929c046d91456393c1b82f0d6b7))
* **crm:** scope target and target-list reads by role ([9e326eb](https://github.com/pdovhomilja/nextcrm-app/commit/9e326ebf35c6596af27779a3faa3b366856f9101))
* **documents:** filter bulk document operations by user scope (fail-closed) ([61132fe](https://github.com/pdovhomilja/nextcrm-app/commit/61132fee767cffbd9b4d81d9dc7b052bb969d3c0))
* **documents:** require ownership/account scope on document mutations ([5bb9035](https://github.com/pdovhomilja/nextcrm-app/commit/5bb9035052326065cab5d5c56c57d959d60fce07))
* **documents:** scope document reads by role and linked-entity access ([220cf23](https://github.com/pdovhomilja/nextcrm-app/commit/220cf231c5ddcda9905e556f92aefa4268d6015b))
* **invoices:** require account read scope on get-invoices-by-accountId ([c8cbf66](https://github.com/pdovhomilja/nextcrm-app/commit/c8cbf669e34e651eb65e9799f25491480eef52f2))
* **invoices:** require account write scope on create and on accountId reassignment ([f8282e5](https://github.com/pdovhomilja/nextcrm-app/commit/f8282e5ec64f7f469502173d1d28af34b81f7bae))
* **invoices:** require read scope on source and write scope on accountId for duplicateInvoice ([eb792a7](https://github.com/pdovhomilja/nextcrm-app/commit/eb792a76dd05dfba7bf9db855e27f6d293db5ce9))
* **migration:** scrub orphan creator FK refs before adding new FK constraint ([7fa5196](https://github.com/pdovhomilja/nextcrm-app/commit/7fa5196b04d594386ce17bd23049207a556e581e))
* **products:** require authentication on product read actions ([b2a860f](https://github.com/pdovhomilja/nextcrm-app/commit/b2a860fcbff5cd84bbd73faf574c1f3079653ce2))
* **products:** require manager/admin role on product mutations ([61ed918](https://github.com/pdovhomilja/nextcrm-app/commit/61ed918e65629661f9818ca2a4dcf6bc3f46a4cb))
* **projects:** require board write/read scope on board mutations ([522ca13](https://github.com/pdovhomilja/nextcrm-app/commit/522ca1323f45b38f5c78fdd64116d5c6c8f07206))
* **projects:** require parent board write scope on section mutations ([65e208f](https://github.com/pdovhomilja/nextcrm-app/commit/65e208fcff948eca80e3380fb599dc585f63b0e7))
* **projects:** scope project read actions by board access ([5ddaa97](https://github.com/pdovhomilja/nextcrm-app/commit/5ddaa976f853b88b526c129e0787939aa4567a9b))
* **projects:** scope task mutations (board strict + assignee soft) ([27f0cf8](https://github.com/pdovhomilja/nextcrm-app/commit/27f0cf8dfd7999599397d4f65a7f9d082900c848))
* **reports:** gate users-directory report behind manager/admin ([20aeeaf](https://github.com/pdovhomilja/nextcrm-app/commit/20aeeafec24b3d6f02ad3f69e1d0d2d68c88f4f8))
* **reports:** scope config and schedule reads/mutations by role and ownership ([932de36](https://github.com/pdovhomilja/nextcrm-app/commit/932de36cd3dd84c20fae20d49f72badd76a970e0))
* **reports:** scope dashboard tasks count and unified search by role ([d17a880](https://github.com/pdovhomilja/nextcrm-app/commit/d17a880eb6b8ac06097756d6006fcf11b44b1138))
* **reports:** scope scheduled-report data by schedule owner role ([7f7c7b6](https://github.com/pdovhomilja/nextcrm-app/commit/7f7c7b63f1cf6fd550454b3040981f1bbef13b5d))
* **security:** admin server action lockdown (Phase C) ([5a555fe](https://github.com/pdovhomilja/nextcrm-app/commit/5a555febe929bb3d477704914756737a04f3d3fd))
* **security:** authz cleanup — drop is_admin, role enum (Phase F) ([c22bf83](https://github.com/pdovhomilja/nextcrm-app/commit/c22bf837e83b10487641fcfc458629fa0fedf5d6))
* **security:** close enrichment BOLA/IDOR (Phase B1) ([726be4c](https://github.com/pdovhomilja/nextcrm-app/commit/726be4cb48c60620a15c3a3a850e8bde379a6e54))
* **security:** close GHSA-mg5f-m89f-4gmc + permission-driven authz foundation ([e6987aa](https://github.com/pdovhomilja/nextcrm-app/commit/e6987aa049dc6816a25c45436556960893c9c15d))
* **security:** close invoice IDOR (Phase B2) ([88d488b](https://github.com/pdovhomilja/nextcrm-app/commit/88d488b939057f4769d22f6ce00442738d73792b))
* **security:** scope campaigns + templates (Phase E2) ([99effa9](https://github.com/pdovhomilja/nextcrm-app/commit/99effa90d2154a930933b58bf64105fd70e0f52a))
* **security:** scope CRM account reads by role (Phase D1) ([cbc3a30](https://github.com/pdovhomilja/nextcrm-app/commit/cbc3a30a9b16ef3bd3e85ea7cc5bec234eba17f6))
* **security:** scope CRM accounts list by user authz read scope ([08c0ec7](https://github.com/pdovhomilja/nextcrm-app/commit/08c0ec7c521d44c02e7978aaf1744d9229e049df))
* **security:** scope CRM accounts list by user authz read scope ([8e86e03](https://github.com/pdovhomilja/nextcrm-app/commit/8e86e03894e4cb4b9d9c5d2265a915fd9ce775bb))
* **security:** scope CRM lead/contact/opportunity/contract reads by role (Phase D2) ([d795b00](https://github.com/pdovhomilja/nextcrm-app/commit/d795b00f6558777f3019a830069561fccb4de4f5))
* **security:** scope documents + bulk ops (Phase E3) ([12ac3df](https://github.com/pdovhomilja/nextcrm-app/commit/12ac3df7218d9512a5b6f0cf33cc750cc9ffe4d1))
* **security:** scope products + account-products + invoice list (Phase E1) ([4ecfc56](https://github.com/pdovhomilja/nextcrm-app/commit/4ecfc565c7b40c2b038f418971fc292a2c596663))
* **security:** scope projects (boards/sections/tasks) (Phase E4) ([bc2a72a](https://github.com/pdovhomilja/nextcrm-app/commit/bc2a72a23c6ae4895c7c9cdf74f45ccaeb915bf2))
* **security:** scope reports + dashboard + unified search by role (Phase B3) ([477dcf6](https://github.com/pdovhomilja/nextcrm-app/commit/477dcf6b31db740bfb3e875f972c63ba2cd19bba))
* **security:** scope targets, activities, audit log, similarity (Phase D3) ([07a03f9](https://github.com/pdovhomilja/nextcrm-app/commit/07a03f9f23b09b29994c1ccacd16fb3e520308c6))
* **tests:** merge duplicate prismadb.documents mock keys after lowercase fix ([3446bc9](https://github.com/pdovhomilja/nextcrm-app/commit/3446bc96e08d28457dee09d014297ef42370e91a))

## [0.11.1](https://github.com/pdovhomilja/nextcrm-app/compare/v0.11.0...v0.11.1) (2026-04-24)


### Bug Fixes

* **deps:** patch Dependabot advisories via pnpm overrides ([42eba8e](https://github.com/pdovhomilja/nextcrm-app/commit/42eba8e1b83cbe87b7f3a21f5d7df096f051e3d1))
* **deps:** patch Dependabot security advisories ([6002241](https://github.com/pdovhomilja/nextcrm-app/commit/60022410b56eab12abd4b10615e1602ade8c159f))
* **deps:** patch Dependabot security advisories via pnpm overrides ([22b2ecf](https://github.com/pdovhomilja/nextcrm-app/commit/22b2ecf2f09528a3219e740df36b7399ad967298))

## [0.11.0](https://github.com/pdovhomilja/nextcrm-app/compare/v0.10.3...v0.11.0) (2026-04-23)


### Features

* **crm:** show invoices on account detail page ([a207314](https://github.com/pdovhomilja/nextcrm-app/commit/a207314aded4b706b6fca9b537a603cbb55a9972))

## [0.10.3](https://github.com/pdovhomilja/nextcrm-app/compare/v0.10.2...v0.10.3) (2026-04-21)


### Bug Fixes

* **invoices:** add supplier company details, PDF regeneration, admin route guard ([31e2b29](https://github.com/pdovhomilja/nextcrm-app/commit/31e2b29c0d99d5a86429eeb5b03de38c45586cd2))
* **invoices:** supplier company details, PDF regeneration, admin route guard ([4c45b8e](https://github.com/pdovhomilja/nextcrm-app/commit/4c45b8e48ca60741c39d54ff2744a93242e1fabe))

## [0.10.2](https://github.com/pdovhomilja/nextcrm-app/compare/v0.10.1...v0.10.2) (2026-04-20)


### Bug Fixes

* **crm-settings:** allow creating industry, opportunity type, and sales stage values ([dc111f0](https://github.com/pdovhomilja/nextcrm-app/commit/dc111f03541e3724e1483e832f39dbc0411b58fd))
* **invoices:** consolidate Invoice_Currencies into shared Currency table ([43f3814](https://github.com/pdovhomilja/nextcrm-app/commit/43f3814a57973d18a7d687ee153a7b108231f68b))
* **invoices:** consolidate Invoice_Currencies into shared Currency table ([2c6820d](https://github.com/pdovhomilja/nextcrm-app/commit/2c6820d65e440906472f498b490f7c9fbdd73ea3))

## [0.10.1](https://github.com/pdovhomilja/nextcrm-app/compare/v0.10.0...v0.10.1) (2026-04-19)


### Bug Fixes

* **prisma:** add missing crm_Target_Contact migration ([7d76537](https://github.com/pdovhomilja/nextcrm-app/commit/7d76537f9ae994430fd782b6c7a789eb4dac69a8))
* **prisma:** add missing migration for crm_Target_Contact table ([792b8c3](https://github.com/pdovhomilja/nextcrm-app/commit/792b8c3ec24efeea963afdcbc71d4b2bf003bc72))

## [0.10.0](https://github.com/pdovhomilja/nextcrm-app/compare/v0.9.0...v0.10.0) (2026-04-18)


### Features

* **dashboard:** add Invoices, Campaigns, Targets cards; remove Employee card ([df13534](https://github.com/pdovhomilja/nextcrm-app/commit/df1353496e128f0f6c7035a28391e9ec8c786b76))
* **invoices:** add FKs, indexes, line-item trigger, money CHECK ([1496266](https://github.com/pdovhomilja/nextcrm-app/commit/1496266419db40292f2b0829eacafbc2c9457c4d))
* **invoices:** add numbering format template + counter consumer ([e533aeb](https://github.com/pdovhomilja/nextcrm-app/commit/e533aeb4e7bbe55c1b5a4a5e77c8a6872ef2bc6f))
* **invoices:** add PDF i18n string bundles (EN/CZ) ([02bcd7d](https://github.com/pdovhomilja/nextcrm-app/commit/02bcd7d04f3ffda004f8b2297038314ea0564dbd))
* **invoices:** add permission guards ([cb12109](https://github.com/pdovhomilja/nextcrm-app/commit/cb121093ed0f49895fa079a8158ed02ba74810ef))
* **invoices:** add Prisma schema, migration, tsvector trigger ([6b9f7f3](https://github.com/pdovhomilja/nextcrm-app/commit/6b9f7f366e8592a07d0ac534d0cc6b216762379c))
* **invoices:** add search filter builder ([a37c5fb](https://github.com/pdovhomilja/nextcrm-app/commit/a37c5fb894101a9f1d30ab91651f3ece0707d109))
* **invoices:** add totals computation with mixed VAT support ([cced002](https://github.com/pdovhomilja/nextcrm-app/commit/cced002054d70f3b6ccb26d6fca20d31bcf70584))
* **invoices:** admin pages — tax rates, series, currencies, settings ([9ed05dc](https://github.com/pdovhomilja/nextcrm-app/commit/9ed05dc5f6518784e72f697e5ef0595d04eea5b9))
* **invoices:** API routes for invoices CRUD, lifecycle, payments, search, admin config ([dcd47d0](https://github.com/pdovhomilja/nextcrm-app/commit/dcd47d09b367006c3fd467d817b7ef98969cc68c))
* **invoices:** fetch FX rates via frankfurter.app ([04c4e0e](https://github.com/pdovhomilja/nextcrm-app/commit/04c4e0e208aba5eb5ad849736357fbca4223f708))
* **invoices:** full invoicing module ([2b420ff](https://github.com/pdovhomilja/nextcrm-app/commit/2b420ff085211e321572a55e02a400662380fbc7))
* **invoices:** invoice email template ([788252b](https://github.com/pdovhomilja/nextcrm-app/commit/788252b5f3e31692f90a965f4132c1147619d8db))
* **invoices:** invoice UI — list, new, detail, edit pages ([40a09a6](https://github.com/pdovhomilja/nextcrm-app/commit/40a09a6e3e62da41d9b01bca8cbfab1bf687c4df))
* **invoices:** MinIO storage wrapper for invoice PDFs ([028d4c2](https://github.com/pdovhomilja/nextcrm-app/commit/028d4c2ed35b1cc0a945d317263cf76f82d18bc2))
* **invoices:** PDF render entry ([b9112c4](https://github.com/pdovhomilja/nextcrm-app/commit/b9112c426ad86b810d28a62a1faf723c4b7271ce))
* **invoices:** PDF template (@react-pdf/renderer) ([11109f6](https://github.com/pdovhomilja/nextcrm-app/commit/11109f62c5fdc5754446862b1beffb285a476127))
* **invoices:** seed currencies, default series, tax rates, settings ([68a8b80](https://github.com/pdovhomilja/nextcrm-app/commit/68a8b80793a5f989bd5ea031522e8e467d7459c0))
* **invoices:** server actions for invoice lifecycle ([e698e71](https://github.com/pdovhomilja/nextcrm-app/commit/e698e716141f4dcd0d48e2bea7a0bb9ec7217e7e))
* **invoices:** sidebar nav entry + i18n (EN/CZ) ([8c5f1d6](https://github.com/pdovhomilja/nextcrm-app/commit/8c5f1d609961e870b5823990695f75edbcd6a839))
* **invoices:** Zod schemas + shared types ([103b2c8](https://github.com/pdovhomilja/nextcrm-app/commit/103b2c81517ae23eed2e01f7361c0b1d8acc7273))


### Bug Fixes

* **invoices:** add PROFORMA to Zod invoice type enum ([18d6e40](https://github.com/pdovhomilja/nextcrm-app/commit/18d6e40281ab8fb726f21c6c4b99ddb92ea79ff6))
* **invoices:** fix Set type annotation in permissions for strict tsc ([1132616](https://github.com/pdovhomilja/nextcrm-app/commit/1132616272afd08368884862a2ef436bf24dfb12))
* **invoices:** hydration mismatches, decimal serialization, server action refactor ([75368f4](https://github.com/pdovhomilja/nextcrm-app/commit/75368f409bf61792ca0997492448b30ab4a3cd36))
* **invoices:** redirect to /invoices after creating new invoice ([2dd2d5e](https://github.com/pdovhomilja/nextcrm-app/commit/2dd2d5ecbee40f515a1f5d77153acffcea519600))
* **invoices:** redirect to invoice detail page after create/edit ([d58c35d](https://github.com/pdovhomilja/nextcrm-app/commit/d58c35db10e4ab03d88aec9fa0be7297d915db58))
* **invoices:** remove unused imports and prefix unused params ([b3e4ccc](https://github.com/pdovhomilja/nextcrm-app/commit/b3e4cccdabf580dedd4329afd3d2133eba38a436))
* **invoices:** remove unused React import from PDF template ([b851ece](https://github.com/pdovhomilja/nextcrm-app/commit/b851ece3b534acfbc4d628ad6fb10227679ee7c1))
* **invoices:** replace Account select with searchable combobox ([08e9b3d](https://github.com/pdovhomilja/nextcrm-app/commit/08e9b3d61f87113e6254fae2f48da15f6c2b42b5))
* **invoices:** review fixes — balanceDue, FX outside tx, permissions, search column, email template ([dde9dfa](https://github.com/pdovhomilja/nextcrm-app/commit/dde9dfaba15274c910329a71ad299585407c47f8))

## [0.9.0](https://github.com/pdovhomilja/nextcrm-app/compare/v0.8.0...v0.9.0) (2026-04-12)


### Features

* **crm:** add assign/disconnect document server actions for CRM tasks ([26f234a](https://github.com/pdovhomilja/nextcrm-app/commit/26f234a4837014b6ce8d8d3ae2f128367a7ec6c2))


### Bug Fixes

* **crm:** expand getCrMTask document select and clean up junction on delete ([b6d2f6b](https://github.com/pdovhomilja/nextcrm-app/commit/b6d2f6b4197999af116ae2165d80c7feb4cefd42))
* **crm:** remove task-specific filters from document table toolbar ([5cca3d1](https://github.com/pdovhomilja/nextcrm-app/commit/5cca3d1e4e25caef5b6b09056575495ec77c9a64))
* **crm:** switch CRM task document actions from broken axios calls to server actions ([efae73e](https://github.com/pdovhomilja/nextcrm-app/commit/efae73e56c78d80fcfa7b1358a3bf78df32e8f43))
* **crm:** uncomment assigned_to_user in task document schema and remove ts-ignore ([46c2868](https://github.com/pdovhomilja/nextcrm-app/commit/46c2868b34779d0924f578ae94dc3eb9cd303d7b))
* **crm:** wire CRM task documents to correct junction table + cleanup ([d4c503c](https://github.com/pdovhomilja/nextcrm-app/commit/d4c503c598a6905b6be826d311beb3fac2218bfa))
* **crm:** wire task comments to correct FK column (assigned_crm_account_task) ([c60ea57](https://github.com/pdovhomilja/nextcrm-app/commit/c60ea57dd2f45d800ead11466a32a5696d1c3754))
* **deps:** patch 2 Dependabot vulnerabilities ([0e2746c](https://github.com/pdovhomilja/nextcrm-app/commit/0e2746c2dd504e7e6a8c0d5e86ef9186e5b3c8f7))

## [0.8.0](https://github.com/pdovhomilja/nextcrm-app/compare/v0.7.1...v0.8.0) (2026-04-10)


### Features

* add Docker entrypoint script for auto-initialization ([1acba0a](https://github.com/pdovhomilja/nextcrm-app/commit/1acba0a5311dc99181075e61da92d59b099aff1c))
* add docker-compose.yml with all services ([c045ebb](https://github.com/pdovhomilja/nextcrm-app/commit/c045ebbfb0d07c25fa3e5c09c44b4ace7467b067))
* add multi-stage Dockerfile for NextCRM ([70a1b45](https://github.com/pdovhomilja/nextcrm-app/commit/70a1b45937af818df1a6b1c99f7d774f49af2796))
* Docker self-hosting setup with full automation ([bff363e](https://github.com/pdovhomilja/nextcrm-app/commit/bff363e646f0bfa55178922f4af05234515a0920))
* enable Next.js standalone output for Docker ([d8d1056](https://github.com/pdovhomilja/nextcrm-app/commit/d8d10565fb0fbb425f5d9bb2a41c3fe06a24cf83))


### Bug Fixes

* Docker e2e verification fixes ([e1ae699](https://github.com/pdovhomilja/nextcrm-app/commit/e1ae699cf8ce0e767bacdd3034f14bf3b4bf304b))
* **docker:** make admin email configurable via ADMIN_EMAIL ([7427b0a](https://github.com/pdovhomilja/nextcrm-app/commit/7427b0a3277b8fff83635cd1cf339eab92d442f1))
* **docker:** replace hardcoded credentials with env-driven placeholders ([255b11e](https://github.com/pdovhomilja/nextcrm-app/commit/255b11e882d4e6bdcb4172f8905bd65556ee22df))

## [0.7.1](https://github.com/pdovhomilja/nextcrm-app/compare/v0.7.0...v0.7.1) (2026-04-08)


### Bug Fixes

* merge dependabot vulnerability patches to main ([db6975a](https://github.com/pdovhomilja/nextcrm-app/commit/db6975a43a23fded9abb53bbdf6e9c45aa6c165d))
* patch 9 open dependabot vulnerabilities ([4c659fa](https://github.com/pdovhomilja/nextcrm-app/commit/4c659fa89d180933ef6ddc4df161e12e025d35a4))

## [0.7.0](https://github.com/pdovhomilja/nextcrm-app/compare/v0.6.1...v0.7.0) (2026-04-08)


### Features

* add SKILL.md download to Developer tab ([b1f528d](https://github.com/pdovhomilja/nextcrm-app/commit/b1f528d03b26ca4332f4d673c60cf51a8f303cab))
* add SKILL.md for Claude Code MCP integration ([b3a57b8](https://github.com/pdovhomilja/nextcrm-app/commit/b3a57b870403285efb883fafd1a4306db19fc5c2))

## [0.6.1](https://github.com/pdovhomilja/nextcrm-app/compare/v0.6.0...v0.6.1) (2026-04-07)


### Bug Fixes

* allow null description in opportunities table schema ([662e6bd](https://github.com/pdovhomilja/nextcrm-app/commit/662e6bd7992537a3f7c31e708f1b89d1d4399e96))
* allow null description in opportunities table schema ([8b414ac](https://github.com/pdovhomilja/nextcrm-app/commit/8b414acbe81bc327ffa7ff6a23fbc21436b817b0))

## [0.6.0](https://github.com/pdovhomilja/nextcrm-app/compare/v0.5.1...v0.6.0) (2026-04-07)


### Features

* align activity actions with deletedAt soft delete ([95de688](https://github.com/pdovhomilja/nextcrm-app/commit/95de688b97f712271e4ae771423aaadea627d104))
* align board/project actions with deletedAt soft delete ([df3fe1e](https://github.com/pdovhomilja/nextcrm-app/commit/df3fe1eb1a222cec130c1abd92918cfdbcc76c09))
* align campaign template actions with deletedAt soft delete ([a95ac24](https://github.com/pdovhomilja/nextcrm-app/commit/a95ac246e784cb3748a676126beefbd6b7e20d37))
* align crm-data and target-list actions with deletedAt soft delete ([eaa6a15](https://github.com/pdovhomilja/nextcrm-app/commit/eaa6a15ab8d76867100bb28bc84892180e583434))
* align target actions with deletedAt soft delete ([bbdad13](https://github.com/pdovhomilja/nextcrm-app/commit/bbdad13defcf45a9756cf055ea977cf156d66fab))
* MCP full parity (104 tools) + universal deletedAt soft-delete ([a164dcb](https://github.com/pdovhomilja/nextcrm-app/commit/a164dcb458a99a423a30357111c2068136973dc1))
* **mcp:** accounts delete uses deletedAt instead of status ([f565523](https://github.com/pdovhomilja/nextcrm-app/commit/f5655230775e703c0390811c0f9e7a4b77c2af25))
* **mcp:** add activities tools (5 tools, with entity links) ([7298d63](https://github.com/pdovhomilja/nextcrm-app/commit/7298d632b1ed1f87e32a911b216bbbae60f93425))
* **mcp:** add barrel export and update route handler with new error codes ([bec7bbd](https://github.com/pdovhomilja/nextcrm-app/commit/bec7bbd4a3eb832795c0485df508a1c88085cb4b))
* **mcp:** add campaigns tools (19 tools, full lifecycle + templates + steps + stats) ([7155053](https://github.com/pdovhomilja/nextcrm-app/commit/7155053f44598eb5db45b5f4460a370578ee2bf7))
* **mcp:** add contracts tools (5 tools, with line items) ([79c3013](https://github.com/pdovhomilja/nextcrm-app/commit/79c301311e0c1873941bb40d4af231aeec56e19a))
* **mcp:** add documents tools (8 tools, presigned URLs, entity linking) ([756d2be](https://github.com/pdovhomilja/nextcrm-app/commit/756d2bea8630cbd1196df6e14884139fe22fa465))
* **mcp:** add enrichment tools (4 tools, single + bulk for contacts and targets) ([2067f21](https://github.com/pdovhomilja/nextcrm-app/commit/2067f21ba57c61594cffa0ace229e3843a8bf9c4))
* **mcp:** add products tools (5 tools, org-wide catalog) ([7038bf2](https://github.com/pdovhomilja/nextcrm-app/commit/7038bf2dac23b7a12ad23cc0213f2aeb49ba56f1))
* **mcp:** add projects tools (18 tools, boards/sections/tasks/comments/watchers) ([b40f3ae](https://github.com/pdovhomilja/nextcrm-app/commit/b40f3ae572c61ad62de8b8c2ce0477535f2c6849))
* **mcp:** add reports tools (2) and email accounts tool (1) ([efe9cc7](https://github.com/pdovhomilja/nextcrm-app/commit/efe9cc719ac15ed1f3d99f8496eee9e5bb39adf4))
* **mcp:** add shared helpers for pagination, search, soft-delete, errors ([a8a0eb0](https://github.com/pdovhomilja/nextcrm-app/commit/a8a0eb0dd40375242c167c4f1a7f398286cfd683))
* **mcp:** add target lists tools (7 tools, membership management) ([4cdd748](https://github.com/pdovhomilja/nextcrm-app/commit/4cdd748582733be4f63f7382a6717cfb70a0cf62))
* **mcp:** campaigns use deletedAt instead of status for soft-delete ([0fac95e](https://github.com/pdovhomilja/nextcrm-app/commit/0fac95e803ff1bcd07a22e0af68e1da4ad76b8bd))
* **mcp:** documents use deletedAt instead of status for soft-delete ([440c629](https://github.com/pdovhomilja/nextcrm-app/commit/440c629f31a4af548640fd18ba66fc36ea9b2eb3))
* **mcp:** enable board soft-delete, add deletedAt filters to board queries ([8973d34](https://github.com/pdovhomilja/nextcrm-app/commit/8973d343ef5bc2bd7828f36b90fcf65f8cd2fabe))
* **mcp:** enable opportunities soft-delete, add deletedAt filters ([3805ab2](https://github.com/pdovhomilja/nextcrm-app/commit/3805ab298afb1f0c14848af12c503025ce472ad5))
* **mcp:** enable soft-delete for contacts, leads, targets, activities ([75217e4](https://github.com/pdovhomilja/nextcrm-app/commit/75217e431146a4a6871f17445a67c178c0e01405))
* **mcp:** rename account tools with crm_ prefix, add soft-delete, use helpers ([288204b](https://github.com/pdovhomilja/nextcrm-app/commit/288204bf7e870a7cc2b560c3994f7823ad311eb2))
* **mcp:** rename contacts/leads/opportunities/targets with crm_ prefix, add delete stubs ([24bfdcd](https://github.com/pdovhomilja/nextcrm-app/commit/24bfdcd7bbebdb164a25305438f566557995bb9e))
* **mcp:** target lists use deletedAt instead of boolean status ([1e917ed](https://github.com/pdovhomilja/nextcrm-app/commit/1e917edf1ba029648bee72cd9aa9c81aba907450))
* **mcp:** update helpers to use deletedAt-based soft delete ([41433ce](https://github.com/pdovhomilja/nextcrm-app/commit/41433ce7d26ac6b2ae6a31b7865b3da9007539db))


### Bug Fixes

* **mcp:** add explicit ReportFilters type annotation to fix date type mismatch ([68414eb](https://github.com/pdovhomilja/nextcrm-app/commit/68414eb4001ce2e0c35ea1e690db58c99960f510))
* **mcp:** fix campaign status filter collision and document unlink auth ([fc6f8a9](https://github.com/pdovhomilja/nextcrm-app/commit/fc6f8a91a24098a21b1f1a9ad454fa7c14d6c0e4))
* **mcp:** fix remaining status:true in target lists, update soft-delete report ([3037daf](https://github.com/pdovhomilja/nextcrm-app/commit/3037daf3dbc6a06360096f5934efab835a7401cb))
* **mcp:** prefix unused entity param in notFound helper ([e76305f](https://github.com/pdovhomilja/nextcrm-app/commit/e76305f4ff439c27c76f1cfedff31ae1296ef405))
* **mcp:** remove isNotDeleted from opportunities (enum type mismatch), fix unused import in products ([3792d51](https://github.com/pdovhomilja/nextcrm-app/commit/3792d515a0c05f97ea6f2c37749adcdafda8c3bc))

## [0.5.1](https://github.com/pdovhomilja/nextcrm-app/compare/v0.5.0...v0.5.1) (2026-04-06)


### Bug Fixes

* close pg pool on seed completion ([8193219](https://github.com/pdovhomilja/nextcrm-app/commit/81932196b5988495e329313b01c2f2e8a50b3ca6))

## [0.5.0](https://github.com/pdovhomilja/nextcrm-app/compare/v0.4.2...v0.5.0) (2026-04-05)


### Features

* **line-items:** add line items section to Contract detail page with copy-from-opportunity ([e3235fe](https://github.com/pdovhomilja/nextcrm-app/commit/e3235fe0f8c4c1e468ed239668dcb1d60a46a1ac))
* **line-items:** add line items section to Opportunity detail page ([24436e1](https://github.com/pdovhomilja/nextcrm-app/commit/24436e17a3d043ac1cefed2269cb6bebcf008323))
* **line-items:** add Prisma schema for Opportunity and Contract line items ([f3b1f30](https://github.com/pdovhomilja/nextcrm-app/commit/f3b1f301e464760780dea6402192e71cbfb90de8))
* **line-items:** add server actions for Contract line items with copy-from-opportunity ([baa83d1](https://github.com/pdovhomilja/nextcrm-app/commit/baa83d1b2bcc8401dd895f54c98402727ad8568b))
* **line-items:** add server actions for Opportunity line items ([680fa93](https://github.com/pdovhomilja/nextcrm-app/commit/680fa93ef4d2631b7f71d035804f954966b629a9))
* **line-items:** add shared calculation helper ([825c733](https://github.com/pdovhomilja/nextcrm-app/commit/825c7339302d995094ef595722f5c4f0718e6383))
* **line-items:** add shared LineItemsTable, AddLineItemForm, and EditLineItemForm components ([e839227](https://github.com/pdovhomilja/nextcrm-app/commit/e839227a731660b4c1bd32d9c6206f6ac03c6543))
* Products module, Line Items, and E2E test coverage ([cdb4498](https://github.com/pdovhomilja/nextcrm-app/commit/cdb4498460b2081c8609370a79e19ae7e9d4f6fc))
* **products:** add create and update product form components ([98c4e60](https://github.com/pdovhomilja/nextcrm-app/commit/98c4e60128ce5c983e48056197d6c69615d4ad56))
* **products:** add CSV bulk import server action ([3ed188a](https://github.com/pdovhomilja/nextcrm-app/commit/3ed188aee12bc9d9b98b00b1c0481a0acb569888))
* **products:** add CSV import dialog with preview and template download ([c9b7388](https://github.com/pdovhomilja/nextcrm-app/commit/c9b7388e0319c425716489a28a4a71bb1638a6dc))
* **products:** add Prisma schema for Products, ProductCategories, AccountProducts ([2c51b70](https://github.com/pdovhomilja/nextcrm-app/commit/2c51b70350dcede4e3ef2ec4e64993477916f79c))
* **products:** add product categories to CRM data fetching ([eba0ea6](https://github.com/pdovhomilja/nextcrm-app/commit/eba0ea653b3872c1288b8c1c40f83f7198e18d74))
* **products:** add product detail page with basic view, accounts tab, and history ([53d0d1f](https://github.com/pdovhomilja/nextcrm-app/commit/53d0d1f3fb6be30b08b5487e8c5996e74893dbc6))
* **products:** add products list page and view component ([9b33aa7](https://github.com/pdovhomilja/nextcrm-app/commit/9b33aa7440a4f7acb3a5eaba6d47f38b66d0a0fd))
* **products:** add server actions for Account-Product assignments ([ea3bc87](https://github.com/pdovhomilja/nextcrm-app/commit/ea3bc8746f4fa3bd3225ed47818d345a8f8e4d4c))
* **products:** add server actions for Product CRUD and data fetching ([e84ea83](https://github.com/pdovhomilja/nextcrm-app/commit/e84ea835663c59cef8021b86f3fd3afb9b64655b))
* **products:** add sidebar nav, account detail products tab with assign form ([3c1ab8b](https://github.com/pdovhomilja/nextcrm-app/commit/3c1ab8b1ceec1616362676b1cf6de7968d5aeb22))
* **products:** add table components with columns, filters, and row actions ([7fe5c4c](https://github.com/pdovhomilja/nextcrm-app/commit/7fe5c4ce5e1dfbfe196a55d2245e473952162ee4))


### Bug Fixes

* add currency field to contracts table schema ([ed6a675](https://github.com/pdovhomilja/nextcrm-app/commit/ed6a675648110d30aaf57920d9439c0f4c3f88fb))
* add line items migration and resolve migration drift ([1b6f483](https://github.com/pdovhomilja/nextcrm-app/commit/1b6f48392cf3801551ed918fd7b379aefe6b4513))
* default accounts prop to empty array in UpdateContractForm ([3e21eac](https://github.com/pdovhomilja/nextcrm-app/commit/3e21eac5fba06aed2e718964995a0b06f7f3ef50))
* guard FormSelect against undefined data and pass safe defaults ([91f1a45](https://github.com/pdovhomilja/nextcrm-app/commit/91f1a457083794e2301dda4863376acbc37e7584))
* **line-items:** resolve build and type issues ([211ab7c](https://github.com/pdovhomilja/nextcrm-app/commit/211ab7cf3cc496d08cc522c123323d9159426ecf))
* make FormSelect fully controlled to show defaultValue correctly ([0c926fc](https://github.com/pdovhomilja/nextcrm-app/commit/0c926fc80a7851d780dd62611b3f63e3596d8d3f))
* **products:** resolve audit log type errors and build issues ([784c444](https://github.com/pdovhomilja/nextcrm-app/commit/784c444267f635594402f0528be6679e3e9d37d2))
* refactor UpdateContractForm to self-fetch accounts and currencies ([23e1dab](https://github.com/pdovhomilja/nextcrm-app/commit/23e1dabcc8185deb0f93c161d08aa6347a972636))
* remove conflicting defaultValue from controlled FormDatePicker input ([326f995](https://github.com/pdovhomilja/nextcrm-app/commit/326f995857da1294a86ebb45420c9affc0d579b5))
* replace getEnabledCurrencies with proper server action ([614162d](https://github.com/pdovhomilja/nextcrm-app/commit/614162d9a2a70941cf6d338e5ad6c85243d04caf))
* serialize Decimal fields in getAllCrmData for client components ([8451299](https://github.com/pdovhomilja/nextcrm-app/commit/845129965078a0260c7cdc2a82a5a326104e38f4))
* serialize opportunity Decimal fields before passing to client component ([bed1604](https://github.com/pdovhomilja/nextcrm-app/commit/bed16042018525b18b9e2c59ace7f74568e1e574))
* stabilize flaky e2e tests across CRM modules ([dbb88b6](https://github.com/pdovhomilja/nextcrm-app/commit/dbb88b69fbe5dd013d7ea61d0da0c72036fbe3b2))

## [0.4.2](https://github.com/pdovhomilja/nextcrm-app/compare/v0.4.1...v0.4.2) (2026-04-04)


### Bug Fixes

* **security:** override defu&lt;=6.1.4 to 6.1.5 for prototype pollution CVE-2026-35209 ([507a866](https://github.com/pdovhomilja/nextcrm-app/commit/507a866326a3920e04e38afefdc60bd4140f9de7))
* **security:** patch defu prototype pollution CVE-2026-35209 ([29d187d](https://github.com/pdovhomilja/nextcrm-app/commit/29d187d2ab56fc7ec78913563864c2f7093c9c1b))

## [0.4.1](https://github.com/pdovhomilja/nextcrm-app/compare/v0.4.0...v0.4.1) (2026-04-04)


### Bug Fixes

* **build:** resolve failed migration before deploy ([d063791](https://github.com/pdovhomilja/nextcrm-app/commit/d0637914f2f296e079afd3fd280be204540c8b60))
* **migration:** rename and make idempotent for failed deploy recovery ([3393859](https://github.com/pdovhomilja/nextcrm-app/commit/339385928a7005ff36fbc6a3df64eaf678fa600b))
* **migration:** seed currencies and clean data before VARCHAR cast ([6ca3dcc](https://github.com/pdovhomilja/nextcrm-app/commit/6ca3dccf08960b8cf6c2d1e83c8a8a2632acb75a))

## [0.4.0](https://github.com/pdovhomilja/nextcrm-app/compare/v0.3.1...v0.4.0) (2026-04-04)


### Features

* add currency conversion library with unit tests ([b2eb41c](https://github.com/pdovhomilja/nextcrm-app/commit/b2eb41cdea7381c3aa513b785ef22a4410b8de90))
* add CurrencyProvider context and header CurrencySwitcher ([4851c56](https://github.com/pdovhomilja/nextcrm-app/commit/4851c562ee47116890bd414448ee2ecfa55f0b7f))
* **admin:** add currencies management page with table, rates, and ECB toggle ([6011159](https://github.com/pdovhomilja/nextcrm-app/commit/60111591311e525f2d5857f73ce40cd9e7aca231))
* **contracts:** add currency and snapshot rate to create/update actions ([1a6a4c8](https://github.com/pdovhomilja/nextcrm-app/commit/1a6a4c8010f7561985e2b865c20bae5d77e81082))
* **contracts:** add currency dropdown to create/update forms ([f0e961d](https://github.com/pdovhomilja/nextcrm-app/commit/f0e961d184c98acb39b4edb2d598e2e78ea651d7))
* **contracts:** display contract value with dynamic currency formatting ([d2c7308](https://github.com/pdovhomilja/nextcrm-app/commit/d2c7308d76ae70d6f5838bf33474d2bfb1f59b38))
* convert opportunity detail budget to display currency ([aa82933](https://github.com/pdovhomilja/nextcrm-app/commit/aa82933d27d3b5a960232c679f98fe451947786a))
* convert opportunity table budget to display currency ([030ca11](https://github.com/pdovhomilja/nextcrm-app/commit/030ca11feb1427455d33d1143b8ab1bf7cbb1e36))
* convert reports dashboard KPIs to display currency ([a564588](https://github.com/pdovhomilja/nextcrm-app/commit/a5645887b2f4ec14ee4db19a62bde43c25a85295))
* **dashboard:** display expected revenue in selected display currency ([7a2fa8f](https://github.com/pdovhomilja/nextcrm-app/commit/7a2fa8fece3fc5a10b35eabc1ebcf5b4dce2a9ff))
* **inngest:** add daily ECB exchange rate sync function ([61e0819](https://github.com/pdovhomilja/nextcrm-app/commit/61e08199f0bf783f7ebbb5230e298b8feafb0c56))
* **migration:** add currency support migration ([86b7663](https://github.com/pdovhomilja/nextcrm-app/commit/86b76636742c8bc4860de078f3731ac0e36886f9))
* multi-currency support for Sales module ([19848b0](https://github.com/pdovhomilja/nextcrm-app/commit/19848b0b050cf7f76e1694cc1a608c1f7a558eb2))
* **opportunities:** add currency dropdown to create/update forms ([49cb1b7](https://github.com/pdovhomilja/nextcrm-app/commit/49cb1b78e2595ee86651fe5ab6c0471856034d50))
* **opportunities:** add snapshot rate lookup on create/update ([f0f8380](https://github.com/pdovhomilja/nextcrm-app/commit/f0f8380a2cc72cac4ede8304a737129ec4f93313))
* **opportunities:** display budget and revenue with currency formatting ([664c096](https://github.com/pdovhomilja/nextcrm-app/commit/664c09645f9f161499e1e3486afda7b6700eeced))
* **reports:** convert sales report values to display currency ([3784f7d](https://github.com/pdovhomilja/nextcrm-app/commit/3784f7df9df29567cfe4a443f2fc9fdfefadd1d2))
* **schema:** add Currency, ExchangeRate, SystemSettings models and migrate money fields to Decimal ([bf3f16d](https://github.com/pdovhomilja/nextcrm-app/commit/bf3f16d29532af16e8cd9dae46bb2d570fa6d0fd))
* **seed:** add currency and exchange rate seed data ([3da4975](https://github.com/pdovhomilja/nextcrm-app/commit/3da4975b75029a1b7134c875e8f6656849cd73df))


### Bug Fixes

* add currency to Opportunity schema type and fix implicit any ([a7ab752](https://github.com/pdovhomilja/nextcrm-app/commit/a7ab752aa9c5879ee13600e7565852e0d251f2c6))
* add explicit types to currency map callbacks ([7d4d5a4](https://github.com/pdovhomilja/nextcrm-app/commit/7d4d5a4912b285c7f84974fd08fadef3855c3aa1))
* add explicit types to currency map callbacks in layout ([33e74f4](https://github.com/pdovhomilja/nextcrm-app/commit/33e74f44d2bf16a28a880986803e1247034e294d))
* remove any casts from serializeDecimalsList call sites ([10a5fe9](https://github.com/pdovhomilja/nextcrm-app/commit/10a5fe9e8d0530d8993d080cf5b78555840b4709))
* resolve build errors - type casts and Inngest function signature ([0e3bf0f](https://github.com/pdovhomilja/nextcrm-app/commit/0e3bf0f0ae5abed134d9319d460985c4dae7c782))
* resolve type issues in ECB sync function ([79b2663](https://github.com/pdovhomilja/nextcrm-app/commit/79b266346fada836cb16c971224bc4a9ee502b9b))
* **schema:** add [@db](https://github.com/db).VarChar(3) to crm_Opportunities.currency field ([0ef0b8b](https://github.com/pdovhomilja/nextcrm-app/commit/0ef0b8ba54251aed2900f8dc03558c315025869e))
* serialize Decimal fields before passing to client components ([ff68db2](https://github.com/pdovhomilja/nextcrm-app/commit/ff68db28f40b01111cf56ccd4b6d822f3e69cf24))
* split currency lib into client-safe and server-only modules ([1a61be3](https://github.com/pdovhomilja/nextcrm-app/commit/1a61be3b404ce10b85e50769b76dba1a8037477c))
* **tests:** update sales report tests for currency-aware aggregation ([c02d752](https://github.com/pdovhomilja/nextcrm-app/commit/c02d7524a9636eb1ea2f2e81f27cb303833db81e))
* wire currencies prop through opportunity and contract components ([dba0036](https://github.com/pdovhomilja/nextcrm-app/commit/dba0036335819f598ec430f165cad8edf55b8213))

## [0.3.1](https://github.com/pdovhomilja/nextcrm-app/compare/v0.3.0...v0.3.1) (2026-04-04)


### Bug Fixes

* **auth:** resolve Google OAuth user creation failures ([844389a](https://github.com/pdovhomilja/nextcrm-app/commit/844389a689c0f20ab8d75bdf10648beeb829c5e3))
* **auth:** resolve Google OAuth user creation failures ([094e7ee](https://github.com/pdovhomilja/nextcrm-app/commit/094e7ee715c034b7c023a574241871690cee68ad))

## [0.3.0](https://github.com/pdovhomilja/nextcrm-app/compare/v0.2.0...v0.3.0) (2026-04-04)


### Features

* **documents:** add batch actions bar for bulk delete, type change, and account linking ([7ed7cfa](https://github.com/pdovhomilja/nextcrm-app/commit/7ed7cfa0ef97bd7281605a390a7b212fc3aa1324))
* **documents:** add bulk actions, versioning, and account linking server actions ([6a8908a](https://github.com/pdovhomilja/nextcrm-app/commit/6a8908a39580f20e99e232fc03f944d381b1265f))
* **documents:** add document detail panel with summary, metadata, and version history ([9fd00f1](https://github.com/pdovhomilja/nextcrm-app/commit/9fd00f1a0785e7715aaf4e4e6c70457e7256efee))
* **documents:** add enrichment fields, chunks table, and embeddings model ([c58a1e6](https://github.com/pdovhomilja/nextcrm-app/commit/c58a1e657b23795504cdc9708682ab6e5d69178c))
* **documents:** add Inngest enrichment orchestrator with text extraction, embedding, summary, classification ([a7216cb](https://github.com/pdovhomilja/nextcrm-app/commit/a7216cbb1a0a5370096560a5a513ec0e732b1743))
* **documents:** add name/content search toggle on documents page ([8043818](https://github.com/pdovhomilja/nextcrm-app/commit/8043818bc1c2756ceb4cf7d3dd19f0fabe8de461))
* **documents:** add processing status badge component ([514fa69](https://github.com/pdovhomilja/nextcrm-app/commit/514fa6963c9c4c7946bd4f08ac4d634110f68dc2))
* **documents:** add thumbnail generator and register Inngest functions ([b0b406e](https://github.com/pdovhomilja/nextcrm-app/commit/b0b406ea4be6e75d865b0f85f1f21ccb5a693365))
* **documents:** add upload-from-account-context with auto-linking ([cb3a096](https://github.com/pdovhomilja/nextcrm-app/commit/cb3a0963573e6ca5d38e4bb2d731b639dce09ee0))
* **documents:** redesign columns with type badges, summaries, status, and filters ([9ecd298](https://github.com/pdovhomilja/nextcrm-app/commit/9ecd2984127f91fdcbe50616a5ae21afcf8eb64d))
* **documents:** replace 3 upload buttons with single bulk upload modal ([dde3a47](https://github.com/pdovhomilja/nextcrm-app/commit/dde3a477e01ded54ba52953ed80da2baa8099e4e))
* **documents:** update createDocument with Inngest event, add checkDuplicate action ([90c2bbc](https://github.com/pdovhomilja/nextcrm-app/commit/90c2bbc3021ba54eb3133a89fe6df9c9c8ecdfef))
* **documents:** update Zod schema and static filter data for enrichment fields ([4ce71b3](https://github.com/pdovhomilja/nextcrm-app/commit/4ce71b37a63ab09999ba4d7283a8d1a4850fb6bc))
* **search:** add document search to command palette ([a0a5bbe](https://github.com/pdovhomilja/nextcrm-app/commit/a0a5bbe064b358933f33fa8ad1b43c039c64659d))
* **search:** add documents to unified search with keyword + vector similarity ([299736f](https://github.com/pdovhomilja/nextcrm-app/commit/299736fd74c539b65472db021cc8cfe0f1335abd))


### Bug Fixes

* **documents:** check upload response status in bulk upload modal ([d71dbf5](https://github.com/pdovhomilja/nextcrm-app/commit/d71dbf52edb03144ba89f3b20e2dc5b4ef9deca1))
* **documents:** exclude pdf-parse and pdfjs-dist from Turbopack server bundle ([6ea7e4b](https://github.com/pdovhomilja/nextcrm-app/commit/6ea7e4bec671046ea396e29930d132dcbe10d6f0))
* **documents:** replace next/image with img tag in DocumentViewModal ([3d2dafd](https://github.com/pdovhomilja/nextcrm-app/commit/3d2dafdae168a2dccc6826d0b897a99351d0c901))
* **documents:** use pdf-parse v2 class-based API for text extraction ([2825f90](https://github.com/pdovhomilja/nextcrm-app/commit/2825f90efc4f2cf97c65901f7c1f7d9f4125db25))
* **documents:** use row.original directly instead of Zod parse in row actions ([20a6016](https://github.com/pdovhomilja/nextcrm-app/commit/20a601665e0e7b24b6a9555eeb298460c4468505))
* update @vercel/mcp-adapter to v1.0.0 and add to trusted builds ([e1583c2](https://github.com/pdovhomilja/nextcrm-app/commit/e1583c2a7d87f6fc1790f0e0432d4812308988a7))

## [0.2.0](https://github.com/pdovhomilja/nextcrm-app/compare/v0.1.0...v0.2.0) (2026-04-03)


### Features

* **footer:** read app version from package.json ([0052e17](https://github.com/pdovhomilja/nextcrm-app/commit/0052e17aadf5283299da88bc695c4b4124fa48fd))
* **footer:** read app version from package.json instead of env var ([003a728](https://github.com/pdovhomilja/nextcrm-app/commit/003a728b56429230d40058622e7d0f6fb925e150))

## [0.1.0] - 2026-04-03

This release is a major milestone — it replaces the entire authentication system, adds a full reporting module, CRM activity tracking, audit logging, soft delete, configurable CRM settings, and AI-powered contact enrichment via E2B sandboxes.

### Added

#### Authentication (better-auth)
- Replaced next-auth with better-auth (Google OAuth + Email OTP login)
- Role-based access control (RBAC) — admin / member / viewer roles
- Server-side `getSession` helper and admin plugins
- Email OTP authentication flow with magic link support
- Admin UI for role management (replaces activate/deactivate toggles)
- Idempotent role backfill migration script
- better-auth session, account, and verification tables in database

#### Reports Module
- Full reporting dashboard with KPI cards (sales, leads, accounts, activity, campaigns, users)
- Sub-pages: Sales, Leads, Accounts, Activity, Campaigns, Users
- Date range picker and filter bar
- CSV export via API route
- PDF export with Inngest-scheduled email delivery
- Save report configurations and schedule recurring reports
- shadcn/ui chart components replacing Tremor

#### CRM Activities
- Activity tracking on all 5 CRM entity detail pages (accounts, contacts, leads, opportunities, contracts)
- `ActivityForm` sheet for creating/editing activities
- `ActivitiesView` paginated feed with compound cursor pagination
- `crm_Activities` and `crm_ActivityLinks` database models

#### CRM Audit Log & Soft Delete
- Soft delete on accounts, contacts, leads, opportunities, contracts
- `crm_AuditLog` model tracking all field changes with before/after diffs
- History tab on all CRM entity detail pages
- Admin audit log page with global filterable table and restore actions

#### CRM Settings (Admin)
- Admin page with 7-tab configuration UI for CRM field values
- Configurable: Contact Types, Lead Sources, Lead Statuses, Lead Types
- CRUD dialogs for each config category
- CRM Settings link in admin sidebar

#### AI Enrichment (E2B Agent)
- E2B sandbox agent enrichment for campaign targets
- Multi-field enrichment with preset selector
- Company-name-only enrichment path (no email required)
- Bulk enrichment modal with field selector
- `crm_Target_Contact` model for multi-contact per target
- 8 new enrichment fields: personal email, LinkedIn, Twitter, phone, title, department, location, bio
- Skip-list cache (5-min TTL) to avoid re-enriching recently processed targets

#### Target Enrichment & Conversion
- Convert Target → Account/Contact flow
- Conversion tracking fields in `crm_Targets`
- Gmail quick-connect with App Password guide and folder discovery
- `TargetContactsTable` with add-contact and enrich actions

#### Contracts
- Contracts detail page with BasicView
- Contracts listed in admin audit log

### Fixed

- Auth: Critical authorization bypass patched
- Auth: Operator precedence bugs in session checks
- Auth: Redirect to sign-in after sign-out
- Auth: better-auth schema compatibility and modelName mapping for Users table
- Reports: Chart colors using `hsl()` wrapper and purple palette
- Reports: Prisma field names aligned across all report actions
- Reports: `created_on` vs `createdAt` field name in campaigns action
- CRM: `assigned_to_user` null guard in account BasicView
- CRM: UUID constraints in update forms (`z.uuid()` replacing `max(30)`)
- CRM: Operator precedence in leads name column cell
- CRM: Soft-delete columns migration made idempotent
- Campaigns: Targets import validation relaxed (last_name or company required)
- Enrichment: Company domain discovery before agent runs
- Enrichment: Personal email vs company domain routing
- Enrichment: Null upsert key guard and DB updates wrapped in `step.run`
- Inngest: `gen_random_uuid()` added to embedding INSERT statements
- Inngest: v4 API compatibility fixes
- Build: All TypeScript errors resolved (operator precedence, missing imports, type safety)

### Changed

- Login page rewritten — credentials/register flow removed, Google OAuth + Email OTP only
- All server actions migrated from next-auth to better-auth session
- All API routes migrated to better-auth session
- Admin `isAdmin`/`is_admin` checks replaced with role-based RBAC
- CRM lead/contact forms now use DB-backed FK select values
- Reports page replaced static view with live KPI dashboard
- Tremor chart library removed — replaced with shadcn/ui charts

### Security

- Critical authorization bypass fixed in auth middleware
- Password removed from invite email template
- Session token strategy updated to better-auth cookie-based auth

### Removed

- next-auth package and all type definitions
- Register page and password reset flow
- Credentials-based login
- Tremor (`@tremor/react`) dependency

---

## [0.0.3-beta] - 2024

- Initial beta releases with MongoDB → PostgreSQL migration
- Basic CRM modules: Accounts, Contacts, Leads, Opportunities
- Campaign management with target lists
- AI document processing (OCR, PDF, DOCX)
- Vector embeddings with pgvector

[0.1.0]: https://github.com/pdovhomilja/nextcrm-app/compare/v0.0.3-beta...v0.1.0
[0.0.3-beta]: https://github.com/pdovhomilja/nextcrm-app/releases/tag/v0.0.3-beta
