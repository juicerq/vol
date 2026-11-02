import * as v from "valibot";

export const Volume = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(200));
export const TabId = v.pipe(v.number(), v.integer(), v.minValue(0));
export const Request = v.variant("type", [
  v.object({ type: v.literal("volume:read"), tabId: v.optional(TabId) }),
  v.object({ type: v.literal("volume:write"), tabId: TabId, volume: Volume }),
  v.object({ type: v.literal("volume:apply"), volume: Volume }),
]);
export const Playback = v.object({ limited: v.boolean(), blocked: v.boolean() });
export const State = v.object({ volume: Volume, available: v.boolean(), limited: v.boolean(), blocked: v.boolean() });
export const Bridge = v.variant("type", [
  v.object({ type: v.literal("vol:ping") }),
  v.object({ type: v.literal("vol:ready") }),
  v.object({ type: v.literal("vol:apply"), volume: Volume }),
  v.object({ type: v.literal("vol:status"), limited: v.boolean(), blocked: v.boolean() }),
]);

export type State = v.InferOutput<typeof State>;

export const DEFAULT_VOLUME = 100;
export const SESSION_KEY = "volume";
