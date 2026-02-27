/* eslint-disable */
// @ts-nocheck

/**
 * @customElement
 * @cardType ipixel-matrix-card
 * @summary Fully enhanced UI-ready Lovelace card for iPixel Matrix (ES module)
 */

/**
 * iPixel Matrix Card – Ultimate UI Wizard Edition (Module versie)
 * - MQTT-based control for iPixel matrix
 * - Alle secties in code aanwezig
 * - Zichtbaarheid per sectie instelbaar in de UI-editor
 * - Power-knoppen volgen HA entity-state
 */

export const IPixelMatrixCardVersion = "0.1.0";

class IPixelMatrixCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this.config = null;
    this._selectedColorKey = null; // 'preset-0'..'preset-7' of 'picker'
    this._selectedAnimation = null;
    this._selectedRainbow = null;
    this._selectedSaveSlot = null;
  }

  static getConfigElement() {
    return document.createElement("ipixel-matrix-card-editor");
  }

  static getStubConfig() {
    return {
      title: "iPixel Matrix",
      base_topic: "ipixel/matrix1",
      entity: "",
      show_power: true,
      show_text: true,
      show_animation: true,
      show_rainbow: true,
      show_save_slots: true,
      show_height: true,
      show_color_presets: true,
      show_color_picker: true,
      show_brightness: true,
      show_clock: true,
      show_apply: true,
    };
  }

  setConfig(config) {
    if (!config.base_topic) {
      throw new Error("base_topic is required (bijv. 'ipixel/matrix1')");
    }

    this.config = {
      title: config.title || "iPixel Matrix",
      base_topic: (config.base_topic || "").replace(/\/$/, ""),
      entity: config.entity || null,

      // zichtbaarheid per blok
      show_power: config.show_power !== false,
      show_text: config.show_text !== false,
      show_animation: config.show_animation !== false,
      show_rainbow: config.show_rainbow !== false,
      show_save_slots: config.show_save_slots !== false,
      show_height: config.show_height !== false,
      show_color_presets: config.show_color_presets !== false,
      show_color_picker: config.show_color_picker !== false,
      show_brightness: config.show_brightness !== false,
      show_clock: config.show_clock !== false,
      show_apply: config.show_apply !== false,
    };

    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.shadowRoot || !this.config) return;

    if (this.config.entity) {
      const entity = hass.states[this.config.entity];
      const stateEl = this.shadowRoot.querySelector(".entity-state");
      if (entity && stateEl) {
        stateEl.textContent = `Status: ${entity.state}`;
      }
      this._updatePowerStateFromEntity(entity);
    }
  }

  getCardSize() {
    return 5;
  }

  // ---------- Rendering ----------

  _render() {
    const cfg = this.config;
    const showPower = cfg.show_power !== false;
    const showText = cfg.show_text !== false;
    const showAnimation = cfg.show_animation !== false;
    const showRainbow = cfg.show_rainbow !== false;
    const showSaveSlots = cfg.show_save_slots !== false;
    const showHeight = cfg.show_height !== false;
    const showColorPresets = cfg.show_color_presets !== false;
    const showColorPicker = cfg.show_color_picker !== false;
    const showBrightness = cfg.show_brightness !== false;
    const showClock = cfg.show_clock !== false;
    const showApply = cfg.show_apply !== false;

    const card = document.createElement("ha-card");

    card.innerHTML = `
      <style>
        :host {
          --ipixel-chip-bg: rgba(255, 255, 255, 0.04);
          --ipixel-chip-border: rgba(255, 255, 255, 0.10);
          --ipixel-chip-radius: 999px;
          --ipixel-gap: 8px;
          --ipixel-section-gap: 16px;
          --ipixel-input-bg: rgba(0,0,0,0.1);
          --ipixel-border-strong: var(--primary-color);
        }

        ha-card {
          padding: 16px;
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 12px;
        }

        .title-block {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .title {
          font-size: 1.2rem;
          font-weight: 600;
        }

        .entity-state {
          font-size: 0.85rem;
          opacity: 0.7;
        }

        .power-buttons {
          display: flex;
          gap: 6px;
        }

        .section {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(128,128,128,0.3);
        }

        .section:first-of-type {
          border-top: none;
          padding-top: 0;
        }

        .section-title {
          font-size: 0.95rem;
          font-weight: 600;
          opacity: 0.9;
        }

        .row {
          display: flex;
          align-items: center;
          gap: var(--ipixel-gap);
          flex-wrap: wrap;
        }

        .row label {
          font-size: 0.85rem;
          opacity: 0.8;
          min-width: 70px;
        }

        .row .grow {
          flex: 1;
        }

        input[type="text"],
        input[type="number"] {
          flex: 1;
          min-width: 0;
          padding: 6px 8px;
          border-radius: 8px;
          border: 1px solid rgba(128,128,128,0.6);
          background: var(--card-background-color, #111);
          color: var(--primary-text-color);
          box-sizing: border-box;
        }

        input[type="range"] {
          flex: 1;
        }

        button {
          cursor: pointer;
          border-radius: 999px;
          border: 1px solid var(--ipixel-chip-border);
          background: var(--ipixel-chip-bg);
          color: var(--primary-text-color);
          font: inherit;
          padding: 6px 12px;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        button.primary {
          background: var(--primary-color);
          color: var(--text-primary-color, #fff);
          border-color: var(--primary-color);
        }

        button.chip {
          font-size: 0.80rem;
        }

        button.selected {
          border: 2px solid var(--ipixel-border-strong);
          box-shadow: 0 0 0 1px rgba(0,0,0,0.4);
        }

        button:active {
          transform: scale(0.97);
        }

        .button-row {
          display: flex;
          flex-wrap: wrap;
          gap: var(--ipixel-gap);
        }

        .color-row {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: var(--ipixel-gap);
        }

        .color-button {
          position: relative;
          width: 100%;
          padding: 0;
          border-radius: 12px;
          border-width: 2px;
          border-style: solid;
          border-color: transparent;
          box-sizing: border-box;
          overflow: hidden;
        }

        .color-button-inner {
          width: 100%;
          height: 28px;
          border-radius: 10px;
        }

        .color-button-label {
          position: absolute;
          bottom: 2px;
          right: 6px;
          font-size: 0.65rem;
          text-shadow: 0 0 3px rgba(0,0,0,0.7);
        }

        .color-button.selected {
          border-color: var(--ipixel-border-strong);
          box-shadow: 0 0 0 1px rgba(0,0,0,0.5);
        }

        .color-picker-row {
          display: flex;
          align-items: center;
          gap: var(--ipixel-gap);
          flex-wrap: wrap;
        }

        .color-picker-row input[type="color"] {
          -webkit-appearance: none;
          border: none;
          width: 40px;
          height: 24px;
          border-radius: 999px;
          padding: 0;
          overflow: hidden;
        }

        .color-picker-row input[type="color"]::-webkit-color-swatch {
          border: none;
        }

        .speed-value,
        .brightness-value {
          min-width: 2.5rem;
          text-align: right;
          font-size: 0.8rem;
          opacity: 0.85;
        }

        .small-note {
          font-size: 0.75rem;
          opacity: 0.65;
        }

        @media (max-width: 500px) {
          .color-row {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
      </style>

      <div class="header">
        <div class="title-block">
          <div class="title">${cfg.title}</div>
          <div class="entity-state"></div>
        </div>
        ${
          showPower
            ? `
        <div class="power-buttons">
          <button class="chip" data-power="ON">Aan</button>
          <button class="chip" data-power="OFF">Uit</button>
        </div>
        `
            : ""
        }
      </div>

      ${
        showText
          ? `
      <!-- Tekst sectie -->
      <div class="section section-text">
        <div class="section-title">Tekst</div>
        <div class="row">
          <input id="ipixel-text-input" type="text" placeholder="Tekst voor de matrix..." />
          <button id="ipixel-send-text" class="primary">Verstuur</button>
        </div>

        ${
          showAnimation
            ? `
        <div class="row">
          <label>Animatie</label>
          <div class="button-row" id="ipixel-animation-row">
            <button class="chip" data-animation="0">0 · Statisch</button>
            <button class="chip" data-animation="1">1 · Scroll L</button>
            <button class="chip" data-animation="2">2 · Scroll R</button>
            <button class="chip" data-animation="5">5 · Fade</button>
            <button class="chip" data-animation="6">6 · Bounce</button>
            <button class="chip" data-animation="7">7 · Slide</button>
          </div>
        </div>
        `
            : ""
        }

        <div class="row">
          <label>Snelheid</label>
          <input id="ipixel-speed" type="range" min="0" max="100" value="60" />
          <span id="ipixel-speed-value" class="speed-value">60</span>
        </div>

        ${
          showRainbow
            ? `
        <div class="row">
          <label>Rainbow</label>
          <div class="button-row" id="ipixel-rainbow-row">
            <button class="chip" data-rainbow="0">0 · Uit</button>
            <button class="chip" data-rainbow="1">1</button>
            <button class="chip" data-rainbow="2">2</button>
            <button class="chip" data-rainbow="3">3</button>
            <button class="chip" data-rainbow="4">4</button>
            <button class="chip" data-rainbow="5">5</button>
            <button class="chip" data-rainbow="6">6</button>
            <button class="chip" data-rainbow="7">7</button>
            <button class="chip" data-rainbow="8">8</button>
            <button class="chip" data-rainbow="9">9</button>
          </div>
        </div>
        `
            : ""
        }

        ${
          showSaveSlots
            ? `
        <div class="row">
          <label>Save-slot</label>
          <div class="button-row" id="ipixel-save-row">
            <button class="chip" data-slot="1">1</button>
            <button class="chip" data-slot="2">2</button>
            <button class="chip" data-slot="3">3</button>
            <button class="chip" data-slot="4">4</button>
            <button class="chip" data-slot="5">5</button>
            <button class="chip" data-slot="6">6</button>
            <button class="chip" data-slot="7">7</button>
            <button class="chip" data-slot="8">8</button>
            <button class="chip" data-slot="9">9</button>
            <button class="chip" data-slot="10">10</button>
          </div>
        </div>
        `
            : ""
        }

        ${
          showHeight
            ? `
        <div class="row">
          <label>Hoogte</label>
          <input id="ipixel-height" type="number" min="1" max="255" value="16" style="max-width: 80px;" />
          <button id="ipixel-set-height" class="chip">Set</button>
          <span class="small-note">Meestal 16</span>
        </div>
        `
            : ""
        }

        ${
          showApply
            ? `
        <div class="row">
          <button id="ipixel-apply" class="primary">Opnieuw toepassen (apply)</button>
        </div>
        `
            : ""
        }
      </div>
      `
          : ""
      }

      ${
        showColorPresets || showColorPicker
          ? `
      <!-- Kleur sectie -->
      <div class="section section-color">
        <div class="section-title">Kleur</div>

        ${
          showColorPresets
            ? `
        <div class="color-row" id="ipixel-color-row">
          <button class="color-button" data-color-key="preset-0" data-rgb="255,0,0">
            <div class="color-button-inner" style="background: rgb(255,0,0);"></div>
            <span class="color-button-label">Rood</span>
          </button>
          <button class="color-button" data-color-key="preset-1" data-rgb="0,255,0">
            <div class="color-button-inner" style="background: rgb(0,255,0);"></div>
            <span class="color-button-label">Groen</span>
          </button>
          <button class="color-button" data-color-key="preset-2" data-rgb="0,0,255">
            <div class="color-button-inner" style="background: rgb(0,0,255);"></div>
            <span class="color-button-label">Blauw</span>
          </button>
          <button class="color-button" data-color-key="preset-3" data-rgb="255,255,0">
            <div class="color-button-inner" style="background: rgb(255,255,0);"></div>
            <span class="color-button-label">Geel</span>
          </button>
          <button class="color-button" data-color-key="preset-4" data-rgb="255,0,255">
            <div class="color-button-inner" style="background: rgb(255,0,255);"></div>
            <span class="color-button-label">Magenta</span>
          </button>
          <button class="color-button" data-color-key="preset-5" data-rgb="0,255,255">
            <div class="color-button-inner" style="background: rgb(0,255,255);"></div>
            <span class="color-button-label">Cyaan</span>
          </button>
          <button class="color-button" data-color-key="preset-6" data-rgb="255,255,255">
            <div class="color-button-inner" style="background: rgb(255,255,255);"></div>
            <span class="color-button-label">Wit</span>
          </button>
          <button class="color-button" data-color-key="preset-7" data-rgb="255,128,0">
            <div class="color-button-inner" style="background: rgb(255,128,0);"></div>
            <span class="color-button-label">Oranje</span>
          </button>
        </div>
        `
            : ""
        }

        ${
          showColorPicker
            ? `
        <div class="color-picker-row">
          <label>Picker</label>
          <input id="ipixel-color-picker" type="color" value="#ff0000" />
          <button id="ipixel-color-apply" class="chip">Zet kleur</button>
        </div>
        `
            : ""
        }

        <div class="small-note">
          Alle kleuracties sturen naar <code>.../text/color</code> met <code>R,G,B</code>.
        </div>
      </div>
      `
          : ""
      }

      ${
        showBrightness
          ? `
      <!-- Helderheid sectie -->
      <div class="section section-brightness">
        <div class="section-title">Helderheid</div>
        <div class="row">
          <label>Niveau</label>
          <input id="ipixel-brightness" type="range" min="0" max="100" value="80" />
          <span id="ipixel-brightness-value" class="brightness-value">80</span>
        </div>
        <div class="button-row" id="ipixel-brightness-presets">
          <button class="chip" data-brightness="20">20%</button>
          <button class="chip" data-brightness="50">50%</button>
          <button class="chip" data-brightness="80">80%</button>
          <button class="chip" data-brightness="100">100%</button>
        </div>
      </div>
      `
          : ""
      }

      ${
        showClock
          ? `
      <!-- Klok sectie -->
      <div class="section section-clock">
        <div class="section-title">Klok</div>
        <div class="row">
          <button id="ipixel-clock-sync" class="chip">Sync tijd (clock_sync)</button>
        </div>
      </div>
      `
          : ""
      }
    `;

    this.shadowRoot.innerHTML = "";
    this.shadowRoot.appendChild(card);

    this._attachEventListeners();
  }

  // ---------- Helpers ----------

  _topic(path) {
    return `${this.config.base_topic}/${path}`;
  }

  _publish(path, payload = "") {
    if (!this._hass) return;
    const topic = this._topic(path);
    this._hass.callService("mqtt", "publish", {
      topic,
      payload: payload != null ? String(payload) : "",
    });
  }

  _updateSelectedButtons(containerSelector, attribute, selectedValue) {
    const container = this.shadowRoot.querySelector(containerSelector);
    if (!container) return;
    const buttons = container.querySelectorAll("button");
    buttons.forEach((btn) => {
      if (btn.dataset[attribute] === String(selectedValue)) {
        btn.classList.add("selected");
      } else {
        btn.classList.remove("selected");
      }
    });
  }

  _updateColorSelection(selectedKey) {
    const buttons = this.shadowRoot.querySelectorAll(
      "#ipixel-color-row .color-button"
    );
    buttons.forEach((btn) => {
      if (btn.dataset.colorKey === selectedKey) {
        btn.classList.add("selected");
      } else {
        btn.classList.remove("selected");
      }
    });
  }

  _updatePowerStateFromEntity(entity) {
    const powerButtons = this.shadowRoot.querySelectorAll(
      ".power-buttons button[data-power]"
    );
    powerButtons.forEach((btn) => btn.classList.remove("selected"));
    if (!entity) return;

    const state = String(entity.state || "").toLowerCase();
    let active = null;
    if (state === "on" || state === "open" || state === "playing" || state === "heat") {
      active = "ON";
    } else if (state === "off" || state === "closed" || state === "idle") {
      active = "OFF";
    }

    if (active) {
      powerButtons.forEach((btn) => {
        if (btn.dataset.power === active) {
          btn.classList.add("selected");
        }
      });
    }
  }

  // ---------- Event binding ----------

  _attachEventListeners() {
    const root = this.shadowRoot;

    // Power
    const powerButtons = root.querySelectorAll(".power-buttons button[data-power]");
    powerButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const val = btn.dataset.power || "OFF";
        // géén lokale selected toggle meer; we wachten op echte entity-state
        this._publish("power/set", val);
      });
    });

    // Tekst
    const textInput = root.querySelector("#ipixel-text-input");
    const sendTextBtn = root.querySelector("#ipixel-send-text");
    if (sendTextBtn) {
      sendTextBtn.addEventListener("click", () => {
        const text = textInput.value || "";
        this._publish("text/set", text);
      });
    }
    if (textInput) {
      textInput.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") {
          const text = textInput.value || "";
          this._publish("text/set", text);
        }
      });
    }

    // Animatie
    const animRow = root.querySelector("#ipixel-animation-row");
    if (animRow) {
      animRow.querySelectorAll("button[data-animation]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const val = btn.dataset.animation;
          this._selectedAnimation = val;
          this._updateSelectedButtons("#ipixel-animation-row", "animation", val);
          this._publish("text/animation", val);
        });
      });
    }

    // Snelheid
    const speedSlider = root.querySelector("#ipixel-speed");
    const speedValue = root.querySelector("#ipixel-speed-value");
    if (speedSlider && speedValue) {
      const updateSpeed = () => {
        const val = speedSlider.value;
        speedValue.textContent = val;
        this._publish("text/speed", val);
      };
      speedSlider.addEventListener("change", updateSpeed);
      speedSlider.addEventListener("mouseup", updateSpeed);
      speedSlider.addEventListener("touchend", updateSpeed);
      speedSlider.addEventListener("input", () => {
        speedValue.textContent = speedSlider.value;
      });
    }

    // Rainbow
    const rainbowRow = root.querySelector("#ipixel-rainbow-row");
    if (rainbowRow) {
      rainbowRow.querySelectorAll("button[data-rainbow]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const val = btn.dataset.rainbow;
          this._selectedRainbow = val;
          this._updateSelectedButtons("#ipixel-rainbow-row", "rainbow", val);
          this._publish("text/rainbow", val);
        });
      });
    }

    // Save-slot
    const saveRow = root.querySelector("#ipixel-save-row");
    if (saveRow) {
      saveRow.querySelectorAll("button[data-slot]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const val = btn.dataset.slot;
          this._selectedSaveSlot = val;
          this._updateSelectedButtons("#ipixel-save-row", "slot", val);
          this._publish("text/save_slot", val);
        });
      });
    }

    // Height
    const heightInput = root.querySelector("#ipixel-height");
    const heightBtn = root.querySelector("#ipixel-set-height");
    if (heightInput && heightBtn) {
      heightBtn.addEventListener("click", () => {
        const val = heightInput.value || "16";
        this._publish("text/height", val);
      });
    }

    // Apply
    const applyBtn = root.querySelector("#ipixel-apply");
    if (applyBtn) {
      applyBtn.addEventListener("click", () => {
        this._publish("text/apply", "");
      });
    }

    // Kleur presets
    const colorButtons = root.querySelectorAll("#ipixel-color-row .color-button");
    colorButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.colorKey;
        const rgb = btn.dataset.rgb || "255,255,255";
        this._selectedColorKey = key;
        this._updateColorSelection(key);
        this._publish("text/color", rgb);
      });
    });

    // Color picker
    const colorPicker = root.querySelector("#ipixel-color-picker");
    const colorApply = root.querySelector("#ipixel-color-apply");
    if (colorPicker && colorApply) {
      const applyPicker = () => {
        const hex = colorPicker.value || "#ffffff";
        const rgb = this._hexToRgbString(hex);
        this._selectedColorKey = "picker";
        this._updateColorSelection(null); // deselect presets
        this._publish("text/color", rgb);
      };
      colorApply.addEventListener("click", applyPicker);
    }

    // Brightness
    const briSlider = root.querySelector("#ipixel-brightness");
    const briValue = root.querySelector("#ipixel-brightness-value");
    if (briSlider && briValue) {
      const updateBrightness = () => {
        const val = briSlider.value;
        briValue.textContent = val;
        this._publish("brightness/set", val);
      };
      briSlider.addEventListener("change", updateBrightness);
      briSlider.addEventListener("mouseup", updateBrightness);
      briSlider.addEventListener("touchend", updateBrightness);
      briSlider.addEventListener("input", () => {
        briValue.textContent = briSlider.value;
      });
    }

    const briPresets = root
      .querySelector("#ipixel-brightness-presets")
      ?.querySelectorAll("button[data-brightness]");
    if (briPresets) {
      briPresets.forEach((btn) => {
        btn.addEventListener("click", () => {
          const val = btn.dataset.brightness;
          if (!val || !briSlider || !briValue) return;
          briSlider.value = val;
          briValue.textContent = val;
          this._publish("brightness/set", val);
        });
      });
    }

    // Clock sync
    const clockBtn = root.querySelector("#ipixel-clock-sync");
    if (clockBtn) {
      clockBtn.addEventListener("click", () => {
        this._publish("clock_sync/set", "");
      });
    }
  }

  _hexToRgbString(hex) {
    let c = hex.replace("#", "");
    if (c.length === 3) {
      c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    }
    const r = parseInt(c.substring(0, 2), 16) || 0;
    const g = parseInt(c.substring(2, 4), 16) || 0;
    const b = parseInt(c.substring(4, 6), 16) || 0;
    return `${r},${g},${b}`;
  }
}

/* -------------------------------
 * CARD EDITOR (UI wizard)
 * --------------------------------
*/
class IPixelMatrixCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
  }

  setConfig(config) {
    this._config = config || {};
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
  }

  _render() {
    const c = this._config;
    const bool = (key, def = true) =>
      c[key] === undefined ? def : c[key] !== false;

    this.shadowRoot.innerHTML = `
      <style>
        .wrap {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 10px;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        label {
          font-weight: 600;
          font-size: 0.9rem;
        }
        input[type="text"] {
          width: 100%;
          padding: 6px 8px;
          border-radius: 6px;
          border: 1px solid rgba(128,128,128,0.6);
          box-sizing: border-box;
        }
        .toggles {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 6px;
          margin-top: 4px;
        }
        .toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
        }
      </style>

      <div class="wrap">
        <div class="field">
          <label>Titel</label>
          <input
            type="text"
            data-config-key="title"
            value="${c.title || "iPixel Matrix"}"
          />
        </div>

        <div class="field">
          <label>MQTT base_topic</label>
          <input
            type="text"
            data-config-key="base_topic"
            placeholder="ipixel/matrix1"
            value="${c.base_topic || ""}"
          />
        </div>

        <div class="field">
          <label>Entity voor power/state (optioneel)</label>
          <input
            type="text"
            data-config-key="entity"
            placeholder="light.ipixel_matrix"
            value="${c.entity || ""}"
          />
        </div>

        <div class="field">
          <label>Zichtbare onderdelen</label>
          <div class="toggles">
            <label class="toggle">
              <input type="checkbox" data-config-key="show_power" ${
                bool("show_power") ? "checked" : ""
              } />
              Power-knoppen
            </label>
            <label class="toggle">
              <input type="checkbox" data-config-key="show_text" ${
                bool("show_text") ? "checked" : ""
              } />
              Tekst-sectie
            </label>
            <label class="toggle">
              <input type="checkbox" data-config-key="show_animation" ${
                bool("show_animation") ? "checked" : ""
              } />
              Animatie-knoppen
            </label>
            <label class="toggle">
              <input type="checkbox" data-config-key="show_rainbow" ${
                bool("show_rainbow") ? "checked" : ""
              } />
              Rainbow-modus
            </label>
            <label class="toggle">
              <input type="checkbox" data-config-key="show_save_slots" ${
                bool("show_save_slots") ? "checked" : ""
              } />
              Save-slots
            </label>
            <label class="toggle">
              <input type="checkbox" data-config-key="show_height" ${
                bool("show_height") ? "checked" : ""
              } />
              Hoogte (height)
            </label>
            <label class="toggle">
              <input type="checkbox" data-config-key="show_apply" ${
                bool("show_apply") ? "checked" : ""
              } />
              Apply-knop
            </label>
            <label class="toggle">
              <input type="checkbox" data-config-key="show_color_presets" ${
                bool("show_color_presets") ? "checked" : ""
              } />
              Kleur-presets
            </label>
            <label class="toggle">
              <input type="checkbox" data-config-key="show_color_picker" ${
                bool("show_color_picker") ? "checked" : ""
              } />
              Color picker
            </label>
            <label class="toggle">
              <input type="checkbox" data-config-key="show_brightness" ${
                bool("show_brightness") ? "checked" : ""
              } />
              Helderheid
            </label>
            <label class="toggle">
              <input type="checkbox" data-config-key="show_clock" ${
                bool("show_clock") ? "checked" : ""
              } />
              Klok sync
            </label>
          </div>
        </div>
      </div>
    `;

    this._attachEditorEvents();
  }

  _attachEditorEvents() {
    const root = this.shadowRoot;
    const inputs = root.querySelectorAll("[data-config-key]");

    inputs.forEach((el) => {
      el.addEventListener("change", (e) => this._valueChanged(e));
    });
  }

  _valueChanged(ev) {
    const target = ev.target;
    const key = target.dataset.configKey;
    if (!key) return;

    const isCheckbox = target.type === "checkbox";
    const value = isCheckbox ? target.checked : target.value;

    const newConfig = {
      ...this._config,
      [key]: value,
    };

    this._config = newConfig;

    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: newConfig },
      })
    );
  }
}

/* Register card + editor + metadata */
if (!customElements.get("ipixel-matrix-card")) {
  customElements.define("ipixel-matrix-card", IPixelMatrixCard);
}
if (!customElements.get("ipixel-matrix-card-editor")) {
  customElements.define("ipixel-matrix-card-editor", IPixelMatrixCardEditor);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ipixel-matrix-card",
  name: "iPixel Matrix (Ultimate UI Wizard)",
  description:
    "MQTT-based iPixel matrix controller, met per sectie aan/uit te zetten UI-onderdelen.",
});
