import { buildTeamActivityWhere, canViewTeamActivity } from "../team-activity";

describe("canViewTeamActivity", () => {
  it("allows admin, CEO and COO", () => {
    expect(canViewTeamActivity("admin")).toBe(true);
    expect(canViewTeamActivity("ceo")).toBe(true);
    expect(canViewTeamActivity("coo")).toBe(true);
  });

  it("blocks everyone else", () => {
    for (const role of ["regional_director", "area_director", "user", "manager", "", null, undefined]) {
      expect(canViewTeamActivity(role as string | null | undefined)).toBe(false);
    }
  });
});

describe("buildTeamActivityWhere", () => {
  it("always limits to lead activity logged by RDs and ADs, excluding deleted", () => {
    expect(buildTeamActivityWhere()).toEqual({
      deletedAt: null,
      links: { some: { entityType: "lead" } },
      created_by_user: { role: { in: ["regional_director", "area_director"] } },
    });
  });

  it("applies valid type, person and date filters (end date inclusive)", () => {
    const id = "123e4567-e89b-12d3-a456-426614174000";
    const where = buildTeamActivityWhere({ type: "note", userId: id, from: "2026-11-01", to: "2026-11-20" });
    expect(where.type).toBe("note");
    expect(where.createdBy).toBe(id);
    expect(where.date).toEqual({
      gte: new Date("2026-11-01T00:00:00.000Z"),
      lte: new Date("2026-11-20T23:59:59.999Z"),
    });
  });

  it("ignores malformed filter values", () => {
    const where = buildTeamActivityWhere({ type: "bogus", userId: "not-a-uuid", from: "yesterday", to: "2026/11/20" });
    expect(where.type).toBeUndefined();
    expect(where.createdBy).toBeUndefined();
    expect(where.date).toBeUndefined();
  });
});
