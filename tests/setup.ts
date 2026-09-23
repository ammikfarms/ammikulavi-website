import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Guarantee each test starts with a clean DOM, even when auto-cleanup is not
// detected (auto-cleanup depends on a global `afterEach` being visible to RTL).
afterEach(() => {
  cleanup();
});

// jsdom does not implement matchMedia; provide a controllable stub so
// responsive/mobile components can be exercised.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// IntersectionObserver is not implemented in jsdom; the Reveal component
// falls back gracefully when it is undefined, so delete it to match that path.
if (!window.IntersectionObserver) {
  class IntersectionObserverStub {
    readonly root: Element | null = null;
    readonly rootMargin: string = "";
    readonly thresholds: ReadonlyArray<number> = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  // @ts-expect-error - provide a minimal stub for jsdom
  window.IntersectionObserver = IntersectionObserverStub;
}

// scrollTo is present in jsdom but throws "Not implemented"; stub it out so
// router scroll restorations and caret helpers don't explode during tests.
// @ts-expect-error - minimal stub
window.scrollTo = () => {};
if (!window.scrollBy) {
  // @ts-expect-error - minimal stub
  window.scrollBy = () => {};
}
