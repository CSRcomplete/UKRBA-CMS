import { resolveLeadDirectors } from "@/lib/lead-directors";

const none = { areaDirectorId: null, regionalDirectorId: null };
const parentOf = (map: Record<string, string | null>) => async (id: string) => map[id] ?? null;

describe("resolveLeadDirectors", () => {
  it("RD gives a lead to their Area Director: AD is the new owner and the RD is kept", async () => {
    const result = await resolveLeadDirectors(
      { id: "ad1", role: "area_director", parentId: "rd1" },
      { areaDirectorId: null, regionalDirectorId: "rd1" },
      parentOf({}),
    );
    expect(result).toEqual({ areaDirectorId: "ad1", regionalDirectorId: "rd1" });
  });

  it("uses the AD's own RD even if the lead had a different one", async () => {
    const result = await resolveLeadDirectors(
      { id: "ad1", role: "area_director", parentId: "rdA" },
      { areaDirectorId: null, regionalDirectorId: "rdB" },
      parentOf({}),
    );
    expect(result).toEqual({ areaDirectorId: "ad1", regionalDirectorId: "rdA" });
  });

  it("keeps the lead's existing RD when the AD has no RD linked yet", async () => {
    const result = await resolveLeadDirectors(
      { id: "ad1", role: "area_director", parentId: null },
      { areaDirectorId: null, regionalDirectorId: "rd1" },
      parentOf({}),
    );
    expect(result).toEqual({ areaDirectorId: "ad1", regionalDirectorId: "rd1" });
  });

  it("assigning to an AD with no RD and no existing RD leaves the RD empty", async () => {
    const result = await resolveLeadDirectors(
      { id: "ad1", role: "area_director", parentId: null },
      none,
      parentOf({}),
    );
    expect(result).toEqual({ areaDirectorId: "ad1", regionalDirectorId: null });
  });

  it("assigning to an RD makes them the RD with no AD", async () => {
    const result = await resolveLeadDirectors(
      { id: "rd1", role: "regional_director", parentId: null },
      { areaDirectorId: "ad1", regionalDirectorId: "rd9" },
      parentOf({}),
    );
    expect(result).toEqual({ areaDirectorId: null, regionalDirectorId: "rd1" });
  });

  it("assigning to a salesperson resolves AD from their parent and RD from the AD's parent", async () => {
    const result = await resolveLeadDirectors(
      { id: "u1", role: "user", parentId: "ad1" },
      none,
      parentOf({ ad1: "rd1" }),
    );
    expect(result).toEqual({ areaDirectorId: "ad1", regionalDirectorId: "rd1" });
  });

  it("assigning to a salesperson with no AD clears both", async () => {
    const result = await resolveLeadDirectors({ id: "u1", role: "user", parentId: null }, none, parentOf({}));
    expect(result).toEqual(none);
  });

  it("legacy manager role: the manager is the AD and their parent the RD", async () => {
    const result = await resolveLeadDirectors(
      { id: "m1", role: "manager", parentId: "rd1" },
      none,
      parentOf({}),
    );
    expect(result).toEqual({ areaDirectorId: "m1", regionalDirectorId: "rd1" });
  });

  it("roles outside the field hierarchy keep the previous behaviour (cleared)", async () => {
    const result = await resolveLeadDirectors(
      { id: "x1", role: "admin", parentId: null },
      { areaDirectorId: "ad1", regionalDirectorId: "rd1" },
      parentOf({}),
    );
    expect(result).toEqual(none);
  });
});
