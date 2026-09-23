import { describe, it, expect } from "vitest";
import { buildStoragePath, sanitizeStorageBasename } from "@/lib/estate";

describe("buildStoragePath (upload/delete safety)", () => {
  it("builds a path under uploads/ for a safe image", () => {
    const p = buildStoragePath("my-photo.jpg", "image/jpeg", "abc123");
    expect(p).toBe("uploads/abc123-my-photo.jpg");
  });

  it("builds a path for a safe video", () => {
    const p = buildStoragePath("harvest.mp4", "video/mp4", "abc123");
    expect(p).toMatch(/^uploads\/abc123-harvest\.mp4$/);
  });

  it("rejects executable / script extensions", () => {
    expect(buildStoragePath("evil.html", "text/html", "x")).toBeNull();
    expect(buildStoragePath("evil.js", "text/javascript", "x")).toBeNull();
    expect(buildStoragePath("evil.exe", "application/octet-stream", "x")).toBeNull();
    expect(buildStoragePath("evil.php", "application/x-php", "x")).toBeNull();
  });

  it("rejects extension/type mismatch (defense in depth)", () => {
    expect(buildStoragePath("photo.jpg", "video/mp4", "x")).toBeNull();
  });

  it("sanitises traversal / unsafe characters in the basename", () => {
    const p = buildStoragePath("../../etc/passwd.png", "image/png", "abc123");
    expect(p).not.toContain("..");
    expect(p).toBe("uploads/abc123-etc-passwd.png");
  });

  it("sanitises names with spaces and special chars", () => {
    const p = buildStoragePath("Hi there !!!.png", "image/png", "abc123");
    expect(p?.includes(" ")).toBe(false);
    expect(p?.includes("!")).toBe(false);
  });

  it("handles missing extension", () => {
    expect(buildStoragePath("noextension", "image/jpeg", "x")).toBeNull();
  });
});

describe("sanitizeStorageBasename", () => {
  it("keeps a safe name and lowercases the extension", () => {
    expect(sanitizeStorageBasename("Sunset.JPG")).toBe("Sunset.jpg");
  });
  it("collapses separators and trims edges", () => {
    expect(sanitizeStorageBasename("..--foo--.png")).toMatch(/^foo\.png$/);
  });
  it("never produces path separators or backslashes", () => {
    const out = sanitizeStorageBasename("a//b\\c.png");
    expect(out).not.toContain("/");
    expect(out).not.toContain("\\");
  });
});
