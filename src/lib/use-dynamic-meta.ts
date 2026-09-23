import { useEffect, useMemo, useRef } from "react";

/**
 * Sets Open Graph and Twitter meta tags dynamically.
 * Useful for pages where metadata depends on fetched data (e.g. blog posts).
 */
export function useDynamicMeta(tags: Record<string, string>) {
  const tagString = useMemo(() => Object.values(tags).join("\0"), [tags]);
  const prevRef = useRef<Array<{ el: HTMLMetaElement; content: string }>>([]);

  useEffect(() => {
    // Clean up previous tags
    for (const { el, content } of prevRef.current) {
      if (content) {
        el.content = content;
      } else {
        el.remove();
      }
    }
    prevRef.current = [];

    for (const [key, value] of Object.entries(tags)) {
      if (!value) continue;

      const isProperty = key.startsWith("og:") || key.startsWith("article:");
      const selector = isProperty ? `meta[property="${key}"]` : `meta[name="${key}"]`;

      const existing = document.querySelector<HTMLMetaElement>(selector);
      if (existing) {
        prevRef.current.push({ el: existing, content: existing.content });
        existing.content = value;
      } else {
        const meta = document.createElement("meta");
        if (isProperty) {
          meta.setAttribute("property", key);
        } else {
          meta.setAttribute("name", key);
        }
        meta.content = value;
        document.head.appendChild(meta);
        prevRef.current.push({ el: meta, content: "" });
      }
    }

    return () => {
      for (const { el, content } of prevRef.current) {
        if (content) {
          el.content = content;
        } else {
          el.remove();
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagString]);
}
