import {
  canAssignLeadTo,
  canBulkAssign,
  canBulkAssignToAreaDirector,
  leadAssigneeWhere,
} from "../lead-assignment";

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

describe("canBulkAssignToAreaDirector", () => {
  it("allows an RD to bulk assign to their own AD", () => {
    expect(canBulkAssignToAreaDirector(rd, { id: "ad1", role: "area_director", parentId: "rd1" })).toBe(true);
  });

  it("blocks an AD under another RD, another RD, or themselves", () => {
    expect(canBulkAssignToAreaDirector(rd, { id: "ad2", role: "area_director", parentId: "rd2" })).toBe(false);
    expect(canBulkAssignToAreaDirector(rd, { id: "rd2", role: "regional_director", parentId: null })).toBe(false);
    expect(canBulkAssignToAreaDirector(rd, { id: "rd1", role: "regional_director", parentId: null })).toBe(false);
  });

  it("is only for Regional Directors", () => {
    const ad = { id: "ad1", role: "area_director", parentId: "rd1" };
    expect(canBulkAssignToAreaDirector({ id: "p", role: "coo" }, ad)).toBe(false);
    expect(canBulkAssignToAreaDirector({ id: "ad1", role: "area_director" }, ad)).toBe(false);
  });
});

describe("canBulkAssign", () => {
  const ad = { id: "ad1", role: "area_director", parentId: "rd1" };
  const otherRd = { id: "rd2", role: "regional_director", parentId: null };

  it("keeps the RD rule: only their own ADs", () => {
    expect(canBulkAssign(rd, ad)).toBe(true);
    expect(canBulkAssign(rd, otherRd)).toBe(false);
    expect(canBulkAssign(rd, { ...ad, parentId: "rd2" })).toBe(false);
  });

  it("lets admin, CEO and COO assign to any RD or AD", () => {
    for (const role of ["admin", "ceo", "coo"]) {
      expect(canBulkAssign({ id: "x", role }, ad)).toBe(true);
      expect(canBulkAssign({ id: "x", role }, otherRd)).toBe(true);
    }
  });

  it("does not let admin roles assign to salespeople or placeholder users", () => {
    expect(canBulkAssign({ id: "x", role: "coo" }, { id: "u1", role: "user", parentId: "ad1" })).toBe(false);
  });

  it("blocks every other role", () => {
    for (const role of ["area_director", "user", "manager", null]) {
      expect(canBulkAssign({ id: "x", role }, ad)).toBe(false);
    }
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
