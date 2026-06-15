(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  var __accessCheck = (obj, member, msg) => {
    if (!member.has(obj))
      throw TypeError("Cannot " + msg);
  };
  var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
  var __privateAdd = (obj, member, value) => {
    if (member.has(obj))
      throw TypeError("Cannot add the same private member more than once");
    member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
  };
  var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
  var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);

  // src/index.ts
  var styles = `:host {
  --transition-speed: 0.4s;
  --transition-bezier: cubic-bezier(0.16, 1, 0.3, 1);
  --button-size-closed: 120px;
  --button-size-open: 56px;
  --button-size: var(--button-size-closed);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  box-sizing: border-box;
}
.chat-widget-button {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: var(--button-size);
  height: var(--button-size);
  background: transparent;
  border: none;
  outline: none;
  cursor: pointer;
  z-index: 999999;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #fff;
  transition: transform .4s var(--transition-bezier),opacity .4s var(--transition-bezier),width .4s var(--transition-bezier),height .4s var(--transition-bezier),background-color .4s var(--transition-bezier),box-shadow .4s var(--transition-bezier);
  transform: scale(0);
  opacity: 0;
  pointer-events: none;
  padding: 0;
  box-shadow: 0 0 0 transparent;
}
.chat-widget-button.visible {
  transform: scale(1);
  opacity: 1;
  pointer-events: auto;
}
.chat-widget-button.visible.open {
  width: var(--button-size-open);
  height: var(--button-size-open);
  background-color: #1a1d21;
  box-shadow: 0 10px 30px rgba(0,0,0,.25);
  transform: scale(1) rotate(90deg);
}
.chat-widget-button:hover:not(.open) {
  transform: scale(1.08);
}
.chat-widget-button:active:not(.open) {
  transform: scale(.95);
}
.chat-widget-button.open:hover {
  transform: scale(1.1) rotate(90deg);
}
.chat-widget-button.open:active {
  transform: scale(.9) rotate(90deg);
}
.chat-widget-avatar-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform .4s var(--transition-bezier),opacity .3s var(--transition-bezier);
  opacity: 1;
  transform: scale(1);
}
.chat-widget-button.open .chat-widget-avatar-container {
  opacity: 0;
  transform: scale(0);
  pointer-events: none;
}
.chat-widget-avatar {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 10px 15px rgba(0,0,0,.15));
  user-select: none;
  -webkit-user-drag: none;
  display: block;
  background: transparent !important;
}
.chat-widget-avatar::-webkit-media-controls, .chat-widget-avatar::-webkit-media-controls-enclosure {
  display: none !important;
}
.chat-widget-close-icon {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform .4s var(--transition-bezier),opacity .3s var(--transition-bezier);
  opacity: 0;
  transform: scale(0) rotate(-90deg);
  color: #fff;
}
.chat-widget-button.open .chat-widget-close-icon {
  opacity: 1;
  transform: scale(1) rotate(0deg);
}
.chat-widget-button.visible:not(.open) .chat-widget-avatar-container {
  animation: float-lumi 4s ease-in-out infinite;
}
@keyframes float-lumi {
  0%,100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}
.chat-widget-tooltip {
  position: fixed;
  bottom: calc(var(--button-size) + 36px);
  right: 24px;
  background: #fff;
  color: #0f172a;
  padding: 12px 18px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 10px 25px rgba(0,0,0,.08);
  border: 1px solid rgba(226,232,240,.8);
  white-space: nowrap;
  transform: translateY(10px) scale(.95);
  opacity: 0;
  pointer-events: none;
  transition: transform .4s var(--transition-bezier),opacity .4s var(--transition-bezier);
  z-index: 999998;
}
.chat-widget-tooltip.visible {
  transform: translateY(0) scale(1);
  opacity: 1;
}
.chat-widget-tooltip::after {
  content: "";
  position: absolute;
  bottom: -6px;
  right: 32px;
  width: 12px;
  height: 12px;
  background: #fff;
  border-right: 1px solid rgba(226,232,240,.8);
  border-bottom: 1px solid rgba(226,232,240,.8);
  transform: rotate(45deg);
}
.chat-widget-modal {
  position: fixed;
  bottom: 96px;
  right: 24px;
  width: 420px;
  height: 640px;
  max-height: calc(100vh - 120px);
  background-color: #fff;
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(0,0,0,.18);
  border: 1px solid rgba(226,232,240,.6);
  overflow: hidden;
  z-index: 999999;
  display: flex;
  flex-direction: column;
  transform: translateY(40px) scale(.85);
  transform-origin: bottom right;
  opacity: 0;
  pointer-events: none;
  transition: transform var(--transition-speed) var(--transition-bezier),opacity var(--transition-speed) var(--transition-bezier);
}
.chat-widget-modal.open {
  transform: translateY(0) scale(1);
  opacity: 1;
  pointer-events: auto;
}
.chat-widget-close-fallback {
  display: none;
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  background: rgba(15,23,42,.6);
  backdrop-filter: blur(8px);
  border: none;
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  z-index: 1000000;
  transition: background-color .2s;
}
.chat-widget-close-fallback:hover {
  background: rgba(15,23,42,.8);
}
.chat-widget-iframe-container {
  flex: 1;
  width: 100%;
  height: 100%;
  position: relative;
  background-color: transparent;
}
.chat-widget-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}
.chat-widget-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%,-50%);
  width: 36px;
  height: 36px;
  border: 3px solid rgba(79,70,229,.08);
  border-radius: 50%;
  border-top-color: #4f46e5;
  animation: spin 1s ease-in-out infinite;
  pointer-events: none;
  transition: opacity .3s;
}
@keyframes spin {
  to {
    transform: translate(-50%,-50%) rotate(360deg);
  }
}
.left-positioned .chat-widget-button {
  left: 24px;
  right: auto;
}
.left-positioned .chat-widget-tooltip {
  left: 24px;
  right: auto;
}
.left-positioned .chat-widget-tooltip::after {
  left: 32px;
  right: auto;
}
.left-positioned .chat-widget-modal {
  left: 24px;
  right: auto;
  transform-origin: bottom left;
}
@media (max-width: 480px) {
  :host {
    --button-size-closed: 96px;
    --button-size: var(--button-size-closed);
  }
  .chat-widget-button {
    bottom: 16px;
    right: 16px;
  }
  .chat-widget-button.open {
    display: none;
  }
  .left-positioned .chat-widget-button {
    left: 16px;
    right: auto;
  }
  .chat-widget-tooltip {
    bottom: calc(var(--button-size) + 16px);
    right: 16px;
  }
  .left-positioned .chat-widget-tooltip {
    left: 16px;
    right: auto;
  }
  .chat-widget-modal {
    bottom: 0;
    right: 0;
    width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
    border: none;
    transform: translateY(100%);
    transform-origin: bottom center;
  }
  .chat-widget-modal.open {
    transform: translateY(0);
  }
  .chat-widget-close-fallback {
    display: flex;
  }
}`;
  var PixiatechChatWidget = class {
    constructor() {
      __publicField(this, "container", null);
      __publicField(this, "shadow", null);
      __publicField(this, "isLoaded", false);
      __publicField(this, "isOpen", false);
      __publicField(this, "hasIframeLoaded", false);
      const globalConfig = window.ChatWidgetConfig || {};
      this.config = { ...DEFAULT_CONFIG, ...globalConfig };
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => this.init());
      } else {
        this.init();
      }
    }
    init() {
      if (this.isLoaded) return;
      this.isLoaded = true;
      this.container = document.createElement("div");
      this.container.id = "pixiatech-chatbot-widget";
      if (this.config.position === "left") {
        this.container.classList.add("left-positioned");
      }
      document.body.appendChild(this.container);
      this.shadow = this.container.attachShadow({ mode: "open" });
      const styleElement = document.createElement("style");
      styleElement.textContent = styles;
      this.shadow.appendChild(styleElement);
      this.render();
      this.bindEvents();
      if (this.config.entranceAnimation) {
        setTimeout(() => {
          var _a;
          const button = (_a = this.shadow) == null ? void 0 : _a.querySelector(".chat-widget-button");
          button == null ? void 0 : button.classList.add("visible");
        }, 600);
        setTimeout(() => {
          if (!this.isOpen) {
            var _a2;
            const tooltip = (_a2 = this.shadow) == null ? void 0 : _a2.querySelector(".chat-widget-tooltip");
            tooltip == null ? void 0 : tooltip.classList.add("visible");
          }
        }, 3e3);
        setTimeout(() => {
          var _a3;
          const tooltip = (_a3 = this.shadow) == null ? void 0 : _a3.querySelector(".chat-widget-tooltip");
          tooltip == null ? void 0 : tooltip.classList.remove("visible");
        }, 1e4);
      } else {
        var _a4;
        const button = (_a4 = this.shadow) == null ? void 0 : _a4.querySelector(".chat-widget-button");
        button == null ? void 0 : button.classList.add("visible");
      }
    }
    render() {
      if (!this.shadow) return;
      this.shadow.innerHTML += `
        <div class="chat-widget-tooltip">${this.config.tooltipText}</div>
        <button class="chat-widget-button" aria-label="Discuter avec Lumi">
          <div class="chat-widget-avatar-container">
            <video id="pixia-video" class="chat-widget-avatar" src="${this.config.avatarUrl}" poster="${this.config.posterUrl}" muted playsinline loop></video>
          </div>
          <div class="chat-widget-close-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
        </button>
        <div class="chat-widget-modal">
          <button class="chat-widget-close-fallback" aria-label="Fermer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <div class="chat-widget-iframe-container">
            <div class="chat-widget-spinner"></div>
          </div>
        </div>`;
      this.initVideo();
    }
    initVideo() {
      if (!this.shadow) return;
      const video = this.shadow.getElementById("pixia-video");
      if (!video) return;
      const startPlayback = () => {
        video.play().catch(() => {
        });
      };
      if (video.readyState >= 2) {
        startPlayback();
      } else {
        video.addEventListener("canplay", startPlayback, { once: true });
        setTimeout(() => {
        }, 5e3);
      }
    }
    bindEvents() {
      if (!this.shadow) return;
      const button = this.shadow.querySelector(".chat-widget-button");
      const closeFallback = this.shadow.querySelector(".chat-widget-close-fallback");
      const tooltip = this.shadow.querySelector(".chat-widget-tooltip");
      button == null ? void 0 : button.addEventListener("click", () => {
        tooltip == null ? void 0 : tooltip.classList.remove("visible");
        this.toggleWidget();
      });
      closeFallback == null ? void 0 : closeFallback.addEventListener("click", () => {
        this.closeWidget();
      });
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && this.isOpen) {
          this.closeWidget();
        }
      });
      window.addEventListener("message", (event) => {
        if (event.origin !== new URL(this.config.iframeUrl).origin) return;
        if (event.data && event.data.type === "close-chatbot") {
          this.closeWidget();
        }
      });
    }
    toggleWidget() {
      if (this.isOpen) {
        this.closeWidget();
      } else {
        this.openWidget();
      }
    }
    openWidget() {
      if (this.isOpen) return;
      this.isOpen = true;
      var _a, _a2;
      const modal = (_a = this.shadow) == null ? void 0 : _a.querySelector(".chat-widget-modal");
      const button = (_a2 = this.shadow) == null ? void 0 : _a2.querySelector(".chat-widget-button");
      modal == null ? void 0 : modal.classList.add("open");
      button == null ? void 0 : button.classList.add("open");
      if (!this.hasIframeLoaded) {
        this.loadIframe();
      }
    }
    closeWidget() {
      if (!this.isOpen) return;
      this.isOpen = false;
      var _a, _a2;
      const modal = (_a = this.shadow) == null ? void 0 : _a.querySelector(".chat-widget-modal");
      const button = (_a2 = this.shadow) == null ? void 0 : _a2.querySelector(".chat-widget-button");
      modal == null ? void 0 : modal.classList.remove("open");
      button == null ? void 0 : button.classList.remove("open");
    }
    getLanguage() {
      if (this.config.lang === "en" || this.config.lang === "fr") {
        return this.config.lang;
      }
      const htmlLang = document.documentElement.lang || "";
      if (htmlLang.toLowerCase().startsWith("en")) {
        return "en";
      }
      return "fr";
    }
    loadIframe() {
      var _a;
      const container = (_a = this.shadow) == null ? void 0 : _a.querySelector(".chat-widget-iframe-container");
      const spinner = this.shadow.querySelector(".chat-widget-spinner");
      if (!container) return;
      this.hasIframeLoaded = true;
      const detectedLang = this.getLanguage();
      let iframeSrc = this.config.iframeUrl;
      try {
        const url = new URL(this.config.iframeUrl);
        url.searchParams.set("lang", detectedLang);
        iframeSrc = url.toString();
      } catch (e) {
        iframeSrc = this.config.iframeUrl + (this.config.iframeUrl.includes("?") ? "&" : "?") + "lang=" + detectedLang;
      }
      const iframe = document.createElement("iframe");
      iframe.className = "chat-widget-iframe";
      iframe.src = iframeSrc;
      iframe.allow = "camera; microphone; clipboard-read; clipboard-write; geolocation";
      iframe.title = "Assistant Bot Lumi";
      iframe.onload = () => {
        if (spinner) {
          spinner.style.opacity = "0";
          setTimeout(() => spinner.remove(), 300);
        }
      };
      container.appendChild(iframe);
    }
  };
  var DEFAULT_CONFIG = {
    position: "right",
    iframeUrl: "https://studio--studio-9205859220-a6440.us-central1.hosted.app/chat-widget",
    avatarUrl: "https://studio--studio-9205859220-a6440.us-central1.hosted.app/bot-avatars/pixia_robot.webm",
    posterUrl: "https://studio--studio-9205859220-a6440.us-central1.hosted.app/bot-avatars/010.webp",
    entranceAnimation: true,
    tooltipText: "Besoin d'aide ? Discutons !",
    lang: ""
  };
  new PixiatechChatWidget();
})();
