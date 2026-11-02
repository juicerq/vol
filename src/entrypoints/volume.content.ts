import * as v from "valibot";
import { browser } from "wxt/browser";

import { Bridge, DEFAULT_VOLUME, Request, State } from "@/lib/volume";

export default defineContentScript({
  matches: ["<all_urls>"],
  allFrames: true,
  matchAboutBlank: true,
  runAt: "document_start",
  main(ctx) {
    let volume = DEFAULT_VOLUME;
    let status = { limited: false, blocked: false };
    const waiters = new Set<(status: { limited: boolean; blocked: boolean }) => void>();

    function apply() {
      window.postMessage({ type: "vol:apply", volume }, "*");
    }

    ctx.addEventListener(window, "message", (event: MessageEvent<unknown>) => {
      if (event.source !== window) {
        return;
      }

      const parsed = v.safeParse(Bridge, event.data);

      if (!parsed.success) {
        return;
      }

      if (parsed.output.type === "vol:ready") {
        apply();
      }

      if (parsed.output.type === "vol:status") {
        status = { limited: parsed.output.limited, blocked: parsed.output.blocked };

        for (const resolve of waiters) {
          resolve(status);
        }

        waiters.clear();
      }
    });

    browser.runtime.onMessage.addListener((raw: unknown) => {
      const request = v.safeParse(Request, raw);

      if (!request.success || request.output.type !== "volume:apply") {
        return;
      }

      volume = request.output.volume;

      return new Promise<typeof status>((resolve) => {
        waiters.add(resolve);
        apply();
        ctx.setTimeout(() => {
          if (waiters.delete(resolve)) {
            resolve({ limited: true, blocked: true });
          }
        }, 1500);
      });
    });

    async function restore() {
      const raw: unknown = await browser.runtime.sendMessage({ type: "volume:read" });
      volume = v.parse(State, raw).volume;
      apply();
    }

    ctx.addEventListener(window, "pageshow", () => {
      void restore().catch((error) => console.error("vol:", error));
    });

    window.postMessage({ type: "vol:ping" }, "*");
    void restore().catch((error) => console.error("vol:", error));
  },
});
