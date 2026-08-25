import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
vi.mock("../../src/server/auth/session", () => ({ getCurrentSession }));

describe("Phase 9 admin endpoint authorization", () => {
  beforeEach(() => getCurrentSession.mockReset());

  it("denies an authenticated non-platform user before querying admin data", async () => {
    getCurrentSession.mockResolvedValue({ id: "session-test", userId: "user-test", activeOrganizationId: null, user: { id: "user-test", name: "Member", email: "member@example.test", platformRole: null } });
    const { GET } = await import("../../src/app/api/v1/admin/users/route");
    const response = await GET(new Request("http://localhost/api/v1/admin/users"));
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "FORBIDDEN" } });
  });
});
