import * as v from "valibot";
import { browser } from "wxt/browser";

import { DEFAULT_VOLUME, Playback, Request, SESSION_KEY, Volume } from "@/lib/volume";

const sessions = browser.sessions as typeof browser.sessions & {
  getTabValue(tabId: number, key: string): Promise<unknown>;
  setTabValue(tabId: number, key: string, value: number): Promise<void>;
};

export default defineBackground({
  type: "module",
  main() {
    let pending: Promise<unknown> = Promise.resolve();
    browser.runtime.onMessage.addListener((raw: unknown, sender) => {
      const request = v.safeParse(Request, raw);

      if (!request.success || request.output.type === "volume:apply") {
        return;
      }

      const message = request.output;
      const tabId = sender.tab?.id ?? message.tabId;

      if (tabId === undefined) {
        return;
      }

      const run = pending.then(async () => {
        const saved: unknown = await sessions.getTabValue(tabId, SESSION_KEY);
        const parsed = v.safeParse(Volume, saved);
        const previous = parsed.success ? parsed.output : DEFAULT_VOLUME;
        const volume = message.type === "volume:write" ? message.volume : previous;

        if (message.type === "volume:write") {
          await sessions.setTabValue(tabId, SESSION_KEY, volume);
        }

        if (sender.tab) {
          return { volume, available: true, limited: false, blocked: false };
        }

        const frames = await browser.webNavigation.getAllFrames({ tabId });
        const targets = frames?.map((frame) => frame.frameId) ?? [0];
        const results = await Promise.all(targets.map(async (frameId) => {
          const response: unknown = await browser.tabs.sendMessage(tabId, { type: "volume:apply", volume }, { frameId }).catch(() => null);
          const playback = v.safeParse(Playback, response);

          return playback.success ? playback.output : null;
        }));

        return {
          volume,
          available: results.some((result) => result !== null),
          limited: results.some((result) => result?.limited),
          blocked: results.some((result) => result?.blocked),
        };
      });

      pending = run.catch((error) => {
        console.error("vol:", error);
      });

      return run;
    });
  },
});
