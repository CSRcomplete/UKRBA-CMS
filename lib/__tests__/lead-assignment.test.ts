import { canAssignLeadTo, leadAssigneeWhere } from "../lead-assignment";

const rd = { id: "rd1", role: "regional_director" };

describe("canAssignLeadTo", () => {
  it("lets an RD assign to themselves", () => {
    expect(canAssignLeadTo(rd, { id: "rd1", role: "regional_director", parentId: null })).toBe(true);
  });

  it("lets an RD assign to an AD who reports to them", () => {
    expect(canAssignLeadTo(rd, { id: "ad1", role: "area_director", parentId: "rd1" })).toBe(true);
  });

  it("blocks an RD assigning to an AD under another RD", () => {
    expect(canAssignLeadTo(rd, { id: "ad2", role: "area_director", parentId: "rd2" })).toBe(false);
  });

  it("blocks an RD assigning to another RD", () => {
    expect(canAssignLeadTo(rd, { id: "rd2", role: "regional_director", parentId: null })).toBe(false);
  });

  it("blocks an RD assigning to their own salesperson or a non-AD report", () => {
    expect(canAssignLeadTo(rd, { id: "u1", role: "user", parentId: "rd1" })).toBe(false);
  });

  it("does not restrict other roles", () => {
    const target = { id: "rd2", role: "regional_director", parentId: null };
    expect(canAssignLeadTo({ id: "p", role: "coo" }, target)).toBe(true);
    expect(canAssignLeadTo({ id: "k", role: "ceo" }, target)).toBe(true);
    expect(canAssignLeadTo({ id: "a", role: "admin" }, target)).toBe(true);
  });
});

describe("leadAssigneeWhere", () => {
  it("scopes the picker for an RD to themselves and their ADs", () => {
    expect(leadAssigneeWhere(rd)).toEqual({
      OR: [{ id: "rd1" }, { role: "area_director", parentId: "rd1" }],
    });
  });

  it("is unrestricted for other roles", () => {
    expect(leadAssigneeWhere({ id: "p", role: "coo" })).toBeNull();
  });
});
