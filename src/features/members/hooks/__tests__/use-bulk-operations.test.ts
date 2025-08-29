import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createQueryWrapper } from "@/test/query-test-utils";
import type { Member, MemberStatus } from "@/features/database/lib/types";
import type { BulkOperationProgress } from "../use-bulk-operations";

// Mock the database utils
const mockMemberUtils = {
  updateMember: vi.fn(),
  deleteMember: vi.fn(),
  updateMemberStatus: vi.fn(),
  getMemberById: vi.fn(),
  getMembers: vi.fn(),
  bulkUpdateStatus: vi.fn(),
};

vi.mock("@/features/database/lib/utils", () => ({
  memberUtils: mockMemberUtils,
}));

// Mock the CSV export utility
vi.mock("@/features/members/lib/csv-utils", () => ({
  exportMembersToCSV: vi.fn(),
  downloadCSV: vi.fn(),
}));

// Mock console.error
const consoleErrorMock = vi
  .spyOn(console, "error")
  .mockImplementation(() => {});

// Mock URL.createObjectURL for browser APIs used in export
// Preserve the original URL constructor but add our mock methods
Object.assign(global.URL, {
  createObjectURL: vi.fn(() => "blob:http://localhost/mock-url"),
  revokeObjectURL: vi.fn(),
});

// Mock Blob for file creation
Object.defineProperty(global, "Blob", {
  value: class MockBlob {
    constructor(
      content: (string | Buffer | ArrayBuffer | ArrayBufferView)[],
      options?: BlobPropertyBag
    ) {
      this.content = content;
      this.options = options;
    }
  },
  writable: true,
});

// Sample test data
const mockMembers: Member[] = [
  {
    id: "member-1",
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    phone: "+1234567890",
    date_of_birth: "1990-01-01",
    gender: "male",
    address: {
      street: "123 Main St",
      city: "Anytown",
      state: "CA",
      postal_code: "12345",
      country: "USA",
    },
    profile_picture_url: null,
    status: "active",
    join_date: "2024-01-15",
    notes: "Test member 1",
    medical_conditions: null,
    fitness_goals: "Weight loss",
    preferred_contact_method: "email",
    marketing_consent: true,
    waiver_signed: true,
    waiver_signed_date: "2024-01-15",
    created_by: null,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "member-2",
    first_name: "Jane",
    last_name: "Smith",
    email: "jane.smith@example.com",
    phone: "+1234567891",
    date_of_birth: "1985-05-20",
    gender: "female",
    address: {
      street: "456 Oak Ave",
      city: "Another City",
      state: "NY",
      postal_code: "67890",
      country: "USA",
    },
    profile_picture_url: null,
    status: "active",
    join_date: "2024-02-01",
    notes: "Test member 2",
    medical_conditions: null,
    fitness_goals: "Muscle building",
    preferred_contact_method: "phone",
    marketing_consent: false,
    waiver_signed: true,
    waiver_signed_date: "2024-02-01",
    created_by: null,
    created_at: "2024-02-01T10:00:00Z",
    updated_at: "2024-02-01T10:00:00Z",
  },
];

describe("Bulk Operations Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorMock.mockClear();
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe("useBulkUpdateMembers", () => {
    it("should successfully update multiple members in batches", async () => {
      const updates = [
        { id: "member-1", data: { first_name: "John Updated" } },
        { id: "member-2", data: { first_name: "Jane Updated" } },
      ];

      const updatedMembers = [
        { ...mockMembers[0], first_name: "John Updated" },
        { ...mockMembers[1], first_name: "Jane Updated" },
      ];

      mockMemberUtils.updateMember
        .mockResolvedValueOnce(updatedMembers[0])
        .mockResolvedValueOnce(updatedMembers[1]);

      const { useBulkUpdateMembers } = await import("../use-bulk-operations");

      const { result } = renderHook(() => useBulkUpdateMembers(), {
        wrapper: createQueryWrapper(),
      });

      const mutationResult = await result.current.mutateAsync({
        updates,
        batchSize: 2,
      });

      expect(mutationResult.totalProcessed).toBe(2);
      expect(mutationResult.totalSuccessful).toBe(2);
      expect(mutationResult.totalFailed).toBe(0);
      expect(mutationResult.successful).toEqual(["member-1", "member-2"]);
      expect(mutationResult.failed).toHaveLength(0);

      expect(mockMemberUtils.updateMember).toHaveBeenCalledTimes(2);
      expect(mockMemberUtils.updateMember).toHaveBeenCalledWith("member-1", {
        first_name: "John Updated",
      });
      expect(mockMemberUtils.updateMember).toHaveBeenCalledWith("member-2", {
        first_name: "Jane Updated",
      });
    });

    it("should handle partial failures during batch updates", async () => {
      const updates = [
        { id: "member-1", data: { first_name: "John Updated" } },
        { id: "member-2", data: { first_name: "Jane Updated" } },
        { id: "member-3", data: { first_name: "Bob Updated" } },
      ];

      mockMemberUtils.updateMember
        .mockResolvedValueOnce({
          ...mockMembers[0],
          first_name: "John Updated",
        })
        .mockRejectedValueOnce(new Error("Update failed for member-2"))
        .mockResolvedValueOnce({
          ...mockMembers[1],
          first_name: "Bob Updated",
        });

      const { useBulkUpdateMembers } = await import("../use-bulk-operations");

      const { result } = renderHook(() => useBulkUpdateMembers(), {
        wrapper: createQueryWrapper(),
      });

      const mutationResult = await result.current.mutateAsync({
        updates,
        batchSize: 3,
      });

      expect(mutationResult.totalProcessed).toBe(3);
      expect(mutationResult.totalSuccessful).toBe(2);
      expect(mutationResult.totalFailed).toBe(1);
      expect(mutationResult.successful).toEqual(["member-1", "member-3"]);
      expect(mutationResult.failed).toEqual([
        { id: "member-2", error: "Update failed for member-2" },
      ]);
    });

    it("should call progress callback with correct progress information", async () => {
      const updates = Array.from({ length: 10 }, (_, i) => ({
        id: `member-${i + 1}`,
        data: { first_name: `Updated ${i + 1}` },
      }));

      mockMemberUtils.updateMember.mockImplementation((id) =>
        Promise.resolve({ ...mockMembers[0], id, first_name: `Updated ${id}` })
      );

      const progressCallback = vi.fn();

      const { useBulkUpdateMembers } = await import("../use-bulk-operations");

      const { result } = renderHook(() => useBulkUpdateMembers(), {
        wrapper: createQueryWrapper(),
      });

      await result.current.mutateAsync({
        updates,
        batchSize: 3,
        onProgress: progressCallback,
      });

      expect(progressCallback).toHaveBeenCalled();

      // Verify progress tracking
      const progressCalls = progressCallback.mock.calls;
      expect(progressCalls.length).toBeGreaterThan(0);

      // Check that progress percentage increases
      const firstCall = progressCalls[0][0] as BulkOperationProgress;
      const lastCall = progressCalls[
        progressCalls.length - 1
      ][0] as BulkOperationProgress;

      expect(firstCall.percentage).toBeLessThan(lastCall.percentage);
      expect(lastCall.percentage).toBe(100);
      expect(lastCall.current).toBe(10);
      expect(lastCall.total).toBe(10);
    });

    it("should handle empty updates array", async () => {
      const { useBulkUpdateMembers } = await import("../use-bulk-operations");

      const { result } = renderHook(() => useBulkUpdateMembers(), {
        wrapper: createQueryWrapper(),
      });

      const mutationResult = await result.current.mutateAsync({
        updates: [],
        batchSize: 10,
      });

      expect(mutationResult.totalProcessed).toBe(0);
      expect(mutationResult.totalSuccessful).toBe(0);
      expect(mutationResult.totalFailed).toBe(0);
      expect(mutationResult.successful).toEqual([]);
      expect(mutationResult.failed).toEqual([]);
      expect(mockMemberUtils.updateMember).not.toHaveBeenCalled();
    });
  });

  describe("useBulkDeleteMembers", () => {
    it("should successfully delete multiple members", async () => {
      const memberIds = ["member-1", "member-2"];

      // Mock getMemberById for the pre-deletion fetch
      mockMemberUtils.getMemberById
        .mockResolvedValueOnce(mockMembers[0])
        .mockResolvedValueOnce(mockMembers[1]);

      mockMemberUtils.deleteMember
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      const { useBulkDeleteMembers } = await import("../use-bulk-operations");

      const { result } = renderHook(() => useBulkDeleteMembers(), {
        wrapper: createQueryWrapper(),
      });

      const mutationResult = await result.current.mutateAsync({
        memberIds,
        softDelete: false,
        batchSize: 2,
      });

      expect(mutationResult.totalProcessed).toBe(2);
      expect(mutationResult.totalSuccessful).toBe(2);
      expect(mutationResult.totalFailed).toBe(0);
      expect(mutationResult.successful).toEqual(["member-1", "member-2"]);

      expect(mockMemberUtils.deleteMember).toHaveBeenCalledTimes(2);
      expect(mockMemberUtils.deleteMember).toHaveBeenCalledWith("member-1");
      expect(mockMemberUtils.deleteMember).toHaveBeenCalledWith("member-2");
    });

    it("should handle deletion failures gracefully", async () => {
      const memberIds = ["member-1", "member-2", "member-3"];

      // Mock getMemberById for the pre-deletion fetch
      mockMemberUtils.getMemberById
        .mockResolvedValueOnce(mockMembers[0])
        .mockResolvedValueOnce(mockMembers[1])
        .mockResolvedValueOnce({ ...mockMembers[0], id: "member-3" });

      mockMemberUtils.deleteMember
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("Member not found"))
        .mockResolvedValueOnce(undefined);

      const { useBulkDeleteMembers } = await import("../use-bulk-operations");

      const { result } = renderHook(() => useBulkDeleteMembers(), {
        wrapper: createQueryWrapper(),
      });

      const mutationResult = await result.current.mutateAsync({
        memberIds,
        softDelete: false,
        batchSize: 3,
      });

      expect(mutationResult.totalProcessed).toBe(3);
      expect(mutationResult.totalSuccessful).toBe(2);
      expect(mutationResult.totalFailed).toBe(1);
      expect(mutationResult.successful).toEqual(["member-1", "member-3"]);
      expect(mutationResult.failed).toEqual([
        { id: "member-2", error: "Member not found" },
      ]);
    });

    it("should respect batch size for large deletions", async () => {
      const memberIds = Array.from(
        { length: 100 },
        (_, i) => `member-${i + 1}`
      );

      // Mock getMemberById for the pre-deletion fetch
      mockMemberUtils.getMemberById.mockImplementation((id) =>
        Promise.resolve({ ...mockMembers[0], id })
      );

      mockMemberUtils.deleteMember.mockResolvedValue(undefined);

      const progressCallback = vi.fn();

      const { useBulkDeleteMembers } = await import("../use-bulk-operations");

      const { result } = renderHook(() => useBulkDeleteMembers(), {
        wrapper: createQueryWrapper(),
      });

      await result.current.mutateAsync({
        memberIds,
        softDelete: false,
        batchSize: 10,
        onProgress: progressCallback,
      });

      expect(mockMemberUtils.deleteMember).toHaveBeenCalledTimes(100);
      expect(progressCallback).toHaveBeenCalled();

      // Check that progress tracking worked correctly
      const finalProgressCall =
        progressCallback.mock.calls[progressCallback.mock.calls.length - 1];
      const finalProgress = finalProgressCall[0] as BulkOperationProgress;
      expect(finalProgress.percentage).toBe(100);
      expect(finalProgress.current).toBe(100);
      expect(finalProgress.total).toBe(100);
    });
  });

  describe("useBulkExportMembers", () => {
    it("should export members to CSV successfully", async () => {
      const memberIds = ["member-1", "member-2"];

      // Mock getMemberById for fetching member data
      mockMemberUtils.getMemberById
        .mockResolvedValueOnce(mockMembers[0])
        .mockResolvedValueOnce(mockMembers[1]);

      const { useBulkExportMembers } = await import("../use-bulk-operations");

      const { result } = renderHook(() => useBulkExportMembers(), {
        wrapper: createQueryWrapper(),
      });

      const mutationResult = await result.current.mutateAsync({
        memberIds,
        format: "csv",
      });

      expect(mutationResult.url).toBeDefined();
      expect(mutationResult.filename).toBeDefined();

      expect(mockMemberUtils.getMemberById).toHaveBeenCalledTimes(2);
      expect(mockMemberUtils.getMemberById).toHaveBeenCalledWith("member-1");
      expect(mockMemberUtils.getMemberById).toHaveBeenCalledWith("member-2");
    });

    it("should handle export errors gracefully", async () => {
      const memberIds = ["member-1", "member-2"];

      mockMemberUtils.getMemberById.mockRejectedValue(
        new Error("Database connection failed")
      );

      const { useBulkExportMembers } = await import("../use-bulk-operations");

      const { result } = renderHook(() => useBulkExportMembers(), {
        wrapper: createQueryWrapper(),
      });

      await expect(
        result.current.mutateAsync({
          memberIds,
          format: "csv",
        })
      ).rejects.toThrow("Database connection failed");

      expect(mockMemberUtils.getMemberById).toHaveBeenCalledWith("member-1");
    });

    it("should call progress callback during export process", async () => {
      const memberIds = Array.from({ length: 50 }, (_, i) => `member-${i + 1}`);
      const progressCallback = vi.fn();

      // Mock getMemberById for all members
      mockMemberUtils.getMemberById.mockImplementation((id) =>
        Promise.resolve({ ...mockMembers[0], id })
      );

      const { useBulkExportMembers } = await import("../use-bulk-operations");

      const { result } = renderHook(() => useBulkExportMembers(), {
        wrapper: createQueryWrapper(),
      });

      await result.current.mutateAsync({
        memberIds,
        format: "csv",
        onProgress: progressCallback,
      });

      expect(progressCallback).toHaveBeenCalled();

      // Verify final progress state
      const finalCall =
        progressCallback.mock.calls[progressCallback.mock.calls.length - 1];
      const finalProgress = finalCall[0] as BulkOperationProgress;
      expect(finalProgress.percentage).toBe(100);
      expect(finalProgress.total).toBe(50);
    });
  });

  describe("useBulkUpdateMemberStatusEnhanced", () => {
    it("should update member status for multiple members", async () => {
      const memberIds = ["member-1", "member-2"];
      const newStatus: MemberStatus = "suspended";

      const updatedMembers = mockMembers.map((member) => ({
        ...member,
        status: newStatus,
      }));

      mockMemberUtils.updateMemberStatus
        .mockResolvedValueOnce(updatedMembers[0])
        .mockResolvedValueOnce(updatedMembers[1]);

      const { useBulkUpdateMemberStatusEnhanced } = await import(
        "../use-bulk-operations"
      );

      const { result } = renderHook(() => useBulkUpdateMemberStatusEnhanced(), {
        wrapper: createQueryWrapper(),
      });

      const mutationResult = await result.current.mutateAsync({
        memberIds,
        status: newStatus,
        batchSize: 2,
      });

      expect(mutationResult.totalProcessed).toBe(2);
      expect(mutationResult.totalSuccessful).toBe(2);
      expect(mutationResult.totalFailed).toBe(0);
      expect(mutationResult.successful).toEqual(["member-1", "member-2"]);

      expect(mockMemberUtils.updateMemberStatus).toHaveBeenCalledTimes(2);
      expect(mockMemberUtils.updateMemberStatus).toHaveBeenCalledWith(
        "member-1",
        newStatus
      );
      expect(mockMemberUtils.updateMemberStatus).toHaveBeenCalledWith(
        "member-2",
        newStatus
      );
    });

    it("should handle status update failures", async () => {
      const memberIds = ["member-1", "member-2", "member-3"];
      const newStatus: MemberStatus = "inactive";

      mockMemberUtils.updateMemberStatus
        .mockResolvedValueOnce({ ...mockMembers[0], status: newStatus })
        .mockRejectedValueOnce(new Error("Status update failed"))
        .mockResolvedValueOnce({ ...mockMembers[1], status: newStatus });

      const { useBulkUpdateMemberStatusEnhanced } = await import(
        "../use-bulk-operations"
      );

      const { result } = renderHook(() => useBulkUpdateMemberStatusEnhanced(), {
        wrapper: createQueryWrapper(),
      });

      const mutationResult = await result.current.mutateAsync({
        memberIds,
        status: newStatus,
        batchSize: 3,
      });

      expect(mutationResult.totalProcessed).toBe(3);
      expect(mutationResult.totalSuccessful).toBe(2);
      expect(mutationResult.totalFailed).toBe(1);
      expect(mutationResult.successful).toEqual(["member-1", "member-3"]);
      expect(mutationResult.failed).toEqual([
        { id: "member-2", error: "Status update failed" },
      ]);
    });

    it("should track progress correctly for large batch updates", async () => {
      const memberIds = Array.from({ length: 50 }, (_, i) => `member-${i + 1}`);
      const newStatus: MemberStatus = "active";
      const progressCallback = vi.fn();

      mockMemberUtils.updateMemberStatus.mockImplementation((id) =>
        Promise.resolve({ ...mockMembers[0], id, status: newStatus })
      );

      const { useBulkUpdateMemberStatusEnhanced } = await import(
        "../use-bulk-operations"
      );

      const { result } = renderHook(() => useBulkUpdateMemberStatusEnhanced(), {
        wrapper: createQueryWrapper(),
      });

      await result.current.mutateAsync({
        memberIds,
        status: newStatus,
        batchSize: 10,
        onProgress: progressCallback,
      });

      expect(progressCallback).toHaveBeenCalled();
      expect(mockMemberUtils.updateMemberStatus).toHaveBeenCalledTimes(50);

      // Verify progress tracking
      const progressCalls = progressCallback.mock.calls;
      expect(progressCalls.length).toBeGreaterThan(0);

      const finalProgress = progressCalls[
        progressCalls.length - 1
      ][0] as BulkOperationProgress;
      expect(finalProgress.percentage).toBe(100);
      expect(finalProgress.current).toBe(50);
      expect(finalProgress.total).toBe(50);
    });

    it("should handle empty member IDs array", async () => {
      const { useBulkUpdateMemberStatusEnhanced } = await import(
        "../use-bulk-operations"
      );

      const { result } = renderHook(() => useBulkUpdateMemberStatusEnhanced(), {
        wrapper: createQueryWrapper(),
      });

      const mutationResult = await result.current.mutateAsync({
        memberIds: [],
        status: "active",
        batchSize: 10,
      });

      expect(mutationResult.totalProcessed).toBe(0);
      expect(mutationResult.totalSuccessful).toBe(0);
      expect(mutationResult.totalFailed).toBe(0);
      expect(mutationResult.successful).toEqual([]);
      expect(mutationResult.failed).toEqual([]);
      expect(mockMemberUtils.updateMemberStatus).not.toHaveBeenCalled();
    });
  });

  describe("Error handling and edge cases", () => {
    it("should handle network timeouts gracefully", async () => {
      const updates = [{ id: "member-1", data: { first_name: "Updated" } }];

      mockMemberUtils.updateMember.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Network timeout")), 100)
          )
      );

      const { useBulkUpdateMembers } = await import("../use-bulk-operations");

      const { result } = renderHook(() => useBulkUpdateMembers(), {
        wrapper: createQueryWrapper(),
      });

      const mutationResult = await result.current.mutateAsync({
        updates,
        batchSize: 1,
      });

      expect(mutationResult.totalFailed).toBe(1);
      expect(mutationResult.failed[0].error).toBe("Network timeout");
    });

    it("should handle very large batch sizes appropriately", async () => {
      const updates = Array.from({ length: 1000 }, (_, i) => ({
        id: `member-${i + 1}`,
        data: { first_name: `Updated ${i + 1}` },
      }));

      mockMemberUtils.updateMember.mockImplementation((id, data) =>
        Promise.resolve({ ...mockMembers[0], id, ...data })
      );

      const { useBulkUpdateMembers } = await import("../use-bulk-operations");

      const { result } = renderHook(() => useBulkUpdateMembers(), {
        wrapper: createQueryWrapper(),
      });

      const startTime = Date.now();

      const mutationResult = await result.current.mutateAsync({
        updates,
        batchSize: 100, // Large batch size
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(mutationResult.totalProcessed).toBe(1000);
      expect(mutationResult.totalSuccessful).toBe(1000);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });
});
