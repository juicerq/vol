import * as v from "valibot";

import { Bridge, DEFAULT_VOLUME } from "@/lib/volume";

interface MediaRoute {
  baseVolume: number;
  appliedVolume: number;
  gain: GainNode | null;
  failed: boolean;
}

export default defineContentScript({
  matches: ["<all_urls>"],
  allFrames: true,
  matchAboutBlank: true,
  runAt: "document_start",
  world: "MAIN",
  main() {
    let volume = DEFAULT_VOLUME;
    let context: AudioContext | null = null;
    let resuming = false;
    const routes = new Map<HTMLMediaElement, MediaRoute>();

    function canAmplify(media: HTMLMediaElement) {
      if (media.mediaKeys || media.srcObject) {
        return false;
      }

      const source = media.currentSrc || media.src;

      if (!source) {
        return false;
      }

      const url = new URL(source, location.href);

      return media.crossOrigin !== null || url.origin === location.origin || url.protocol === "data:";
    }

    function report() {
      const active = [...routes].filter(([media]) => !media.paused && !media.ended);
      const limited = volume > DEFAULT_VOLUME && active.some(([, route]) => !route.gain);
      const blocked = limited && context?.state === "suspended";

      window.postMessage({ type: "vol:status", limited, blocked }, "*");
    }

    function ensureContext() {
      if (!context) {
        context = new AudioContext();
        context.addEventListener("statechange", applyAll);
      }

      if (context.state === "suspended" && !resuming) {
        resuming = true;
        void context.resume().catch((error) => {
          console.error("vol: não foi possível ativar o áudio", error);
        }).finally(() => {
          resuming = false;
        });
      }

      return context;
    }

    function applyMedia(media: HTMLMediaElement, route: MediaRoute) {
      if (!route.gain && volume !== DEFAULT_VOLUME && !route.failed && canAmplify(media)) {
        const audio = ensureContext();

        if (audio.state === "running") {
          const gain = audio.createGain();

          try {
            const source = audio.createMediaElementSource(media);
            gain.gain.value = volume / DEFAULT_VOLUME;
            source.connect(gain);
            gain.connect(audio.destination);
            route.gain = gain;
          } catch {
            gain.disconnect();
            route.failed = true;
          }
        }
      }

      if (route.gain) {
        const now = route.gain.context.currentTime;
        route.gain.gain.cancelScheduledValues(now);
        route.gain.gain.setValueAtTime(route.gain.gain.value, now);
        route.gain.gain.linearRampToValueAtTime(volume / DEFAULT_VOLUME, now + 0.015);
        route.appliedVolume = route.baseVolume;
      } else {
        route.appliedVolume = route.baseVolume * Math.min(volume / DEFAULT_VOLUME, 1);
      }

      if (media.volume !== route.appliedVolume) {
        media.volume = route.appliedVolume;
      }
    }

    function track(media: HTMLMediaElement) {
      let route = routes.get(media);

      if (!route) {
        route = { baseVolume: media.volume, appliedVolume: media.volume, gain: null, failed: false };
        routes.set(media, route);

        media.addEventListener("volumechange", () => {
          const current = routes.get(media);

          if (!current || media.volume === current.appliedVolume) {
            return;
          }

          current.baseVolume = media.volume;
          applyMedia(media, current);
        });

        for (const event of ["play", "playing", "loadedmetadata", "emptied"]) {
          media.addEventListener(event, () => {
            const current = routes.get(media);

            if (current) {
              applyMedia(media, current);
              report();
            }
          });
        }
      }

      applyMedia(media, route);
    }

    function scan(node: Node) {
      if (node instanceof HTMLMediaElement) {
        track(node);
      }

      if (node instanceof Element || node instanceof Document || node instanceof ShadowRoot) {
        node.querySelectorAll("audio, video").forEach((media) => {
          if (media instanceof HTMLMediaElement) {
            track(media);
          }
        });

        node.querySelectorAll("*").forEach((element) => {
          if (element.shadowRoot && !observed.has(element.shadowRoot)) {
            observe(element.shadowRoot);
          }
        });
      }
    }

    function applyAll() {
      for (const [media, route] of routes) {
        applyMedia(media, route);
      }

      report();
    }

    const observed = new WeakSet<Node>();

    function observe(node: Node) {
      observed.add(node);
      const observer = new MutationObserver((changes) => {
        for (const change of changes) {
          change.addedNodes.forEach(scan);
        }

        report();
      });

      observer.observe(node, { childList: true, subtree: true });
      scan(node);
    }

    const originalPlay = HTMLMediaElement.prototype.play;

    HTMLMediaElement.prototype.play = function () {
      track(this);
      return originalPlay.call(this);
    };

    window.addEventListener("message", (event: MessageEvent<unknown>) => {
      if (event.source !== window) {
        return;
      }

      const parsed = v.safeParse(Bridge, event.data);

      if (!parsed.success) {
        return;
      }

      if (parsed.output.type === "vol:ping") {
        window.postMessage({ type: "vol:ready" }, "*");
      }

      if (parsed.output.type === "vol:apply") {
        volume = parsed.output.volume;
        applyAll();
      }
    });

    document.addEventListener("play", (event) => {
      if (event.target instanceof HTMLMediaElement) {
        track(event.target);
      }
    }, true);

    document.addEventListener("pointerdown", applyAll, true);
    document.addEventListener("keydown", applyAll, true);
    observe(document);
    window.postMessage({ type: "vol:ready" }, "*");
  },
});
