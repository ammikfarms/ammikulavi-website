import { describe, it, expect, vi, beforeEach } from "vitest";
import { describeError, consumeLastCapturedError } from "@/lib/error-capture";
import { reportLovableError } from "@/lib/lovable-error-reporting";

describe("describeError", () => {
  it("expands a plain Error into its stack", () => {
    const err = new Error("Everything is on fire");
    const out = describeError(err);
    expect(out).toContain("Everything is on fire");
    expect(out).toContain("at");
  });

  it("annotates HTTP-ish errors with their status", () => {
    const err = new Error("HTTPError");
    (err as Error & { status: number }).status = 500;
    expect(describeError(err)).toContain("(status 500)");
  });

  it("keeps the full cause chain", () => {
    const cause = new Error("root cause");
    const outer = new Error("wrapped", { cause });
    const out = describeError(outer);
    expect(out).toContain("wrapped");
    expect(out).toContain("caused by: Error: root cause");
  });

  it("stringifies non-Error values safely", () => {
    expect(describeError("plain string")).toBe("plain string");
    expect(describeError({ code: 42 })).toContain("42");
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(() => describeError(cyclic)).not.toThrow();
  });

  it("truncates extremely long descriptions", () => {
    const big = new Error("x".repeat(20_000));
    expect(describeError(big).length).toBeLessThanOrEqual(8_000);
  });
});

describe("consumeLastCapturedError", () => {
  beforeEach(() => {
    consumeLastCapturedError();
  });

  it("captures errors that reach console.error and consumes them once", () => {
    const err = new Error("capture me");
    const originalError = globalThis.console.error;
    try {
      // error-capture rewrites console.error; call it to record the error.
      (globalThis.console.error as (args: unknown[]) => void)(err);
    } finally {
      originalError("err");
    }
    expect((consumeLastCapturedError() as Error).message).toBe("capture me");
    expect(consumeLastCapturedError()).toBeUndefined();
  });
});

describe("reportLovableError", () => {
  beforeEach(() => {
    // @ts-expect-error test hook
    delete globalThis.window?.__lovableEvents;
    // @ts-expect-error test hook
    delete globalThis.window?.__lovableReportRuntimeError;
  });

  it("is a no-op when no reporting hooks are installed", () => {
    expect(() => reportLovableError(new Error("boom"))).not.toThrow();
  });

  it("forwards boundary context and mechanism to the capture hook", () => {
    const captureException = vi.fn();
    // @ts-expect-error test hook
    globalThis.window.__lovableEvents = { captureException };

    reportLovableError(new Error("boom"), { boundary: "tanstack_root_error_component" });

    expect(captureException).toHaveBeenCalledTimes(1);
    const [error, context, options] = captureException.mock.calls[0] as [
      unknown,
      Record<string, unknown>,
      Record<string, unknown>,
    ];
    expect(error).toBeInstanceOf(Error);
    expect(context).toMatchObject({
      source: "react_error_boundary",
      boundary: "tanstack_root_error_component",
    });
    expect(context.route).toBe(window.location.pathname);
    expect(options).toMatchObject({ mechanism: "react_error_boundary", handled: false });
  });

  it("reports a human-readable message for Errors and Responses", () => {
    const hook = vi.fn();
    // @ts-expect-error test hook
    globalThis.window.__lovableReportRuntimeError = hook;

    reportLovableError(new Error("kaput"));
    expect(hook).toHaveBeenCalledWith(
      expect.objectContaining({ message: "kaput", stack: expect.any(String) }),
    );

    const res = new Response("nope", { status: 404, statusText: "Nope" });
    reportLovableError(res);
    expect(hook).toHaveBeenLastCalledWith(expect.objectContaining({ message: "Response 404" }));

    reportLovableError("opaque string");
    expect(hook).toHaveBeenLastCalledWith(expect.objectContaining({ message: "opaque string" }));
  });

  it("always includes the current route as the reporting filename", () => {
    const hook = vi.fn();
    // @ts-expect-error test hook
    globalThis.window.__lovableReportRuntimeError = hook;

    reportLovableError(new Error("x"));
    expect(hook).toHaveBeenCalledWith(
      expect.objectContaining({ filename: window.location.pathname }),
    );
  });
});
