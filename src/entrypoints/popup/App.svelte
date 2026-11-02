<script lang="ts">
  import { onMount } from "svelte";
  import * as v from "valibot";
  import { browser } from "wxt/browser";

  import { DEFAULT_VOLUME, State } from "@/lib/volume";

  let volume = $state(DEFAULT_VOLUME);
  let tabId = $state<number | null>(null);
  let domain = $state("ESTA ABA");
  let ready = $state(false);
  let note = $state("");
  let revision = 0;

  function playbackNote(state: State) {
    if (!state.available) {
      return "Recarregue a aba para ativar o Vol. Páginas internas do navegador não permitem o controle.";
    }

    if (state.blocked) {
      return "Clique na página para liberar a amplificação.";
    }

    if (state.limited) {
      return "Este player não permite amplificação acima de 100%.";
    }

    return "";
  }

  onMount(() => {
    async function load() {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

      if (tab?.id === undefined) {
        note = "Nenhuma aba disponível.";
        return;
      }

      tabId = tab.id;

      if (tab.url) {
        const url = new URL(tab.url);
        domain = url.hostname || url.protocol.replace(":", "");
      }

      const raw: unknown = await browser.runtime.sendMessage({ type: "volume:read", tabId });
      const state = v.parse(State, raw);
      volume = state.volume;
      note = playbackNote(state);
      ready = state.available;
    }

    void load().catch((error) => {
      console.error("vol:", error);
      note = "Não foi possível carregar o volume. Abra o Vol novamente.";
    });
  });

  async function changeVolume(event: Event) {
    if (!(event.currentTarget instanceof HTMLInputElement) || tabId === null) {
      return;
    }

    volume = Number(event.currentTarget.value);
    const current = ++revision;

    try {
      const raw: unknown = await browser.runtime.sendMessage({ type: "volume:write", tabId, volume });
      const state = v.parse(State, raw);

      if (current === revision) {
        note = playbackNote(state);
      }
    } catch (error) {
      console.error("vol:", error);

      if (current === revision) {
        note = "Não foi possível salvar o volume. Tente novamente.";
      }
    }
  }
</script>

<main>
  <section class="display" aria-label="Volume da aba atual">
    <header>
      <span class="identity">
        <img src="/mark.svg" width="25" height="25" alt="" />
        <span class="wordmark">VOL.</span>
      </span>
      <span class="domain">{domain}</span>
    </header>

    <output for="volume" aria-live="polite">
      <span class="number">{volume}</span>
      <span class="percent">%</span>
    </output>
  </section>

  <section class="controls">
    <label for="volume">Volume desta aba</label>
    <input
      id="volume"
      type="range"
      min="0"
      max="200"
      step="1"
      value={volume}
      disabled={!ready}
      aria-valuetext={`${volume} por cento`}
      style={`--position: ${volume / 2}%`}
      oninput={changeVolume}
    />
    <div class="scale" aria-hidden="true"><span>0</span><span>100</span><span>200</span></div>
    {#if note}
      <p class="note" role="status">{note}</p>
    {/if}
  </section>
</main>
