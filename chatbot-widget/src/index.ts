// src/index.ts
import styles from './style.css?inline';

interface ChatWidgetConfig {
  position?: 'left' | 'right';
  iframeUrl?: string;
  avatarUrl?: string;
  posterUrl?: string;
  videoUrl?: string;
  entranceAnimation?: boolean;
  tooltipText?: string;
  lang?: string;
}

// Configuration par défaut du Widget pointant directement vers votre vrai chatbot Lumi en production
const DEFAULT_CONFIG: Required<ChatWidgetConfig> = {
  position: 'right',
  iframeUrl: 'https://studio--studio-9205859220-a6440.us-central1.hosted.app/chat-widget',
  avatarUrl: 'https://studio--studio-9205859220-a6440.us-central1.hosted.app/bot-avatars/pixia_robot.webm',
  posterUrl: 'https://studio--studio-9205859220-a6440.us-central1.hosted.app/bot-avatars/010.webp',
  entranceAnimation: true,
  tooltipText: 'Besoin d\'aide ? Discutons !',
  lang: ''
};

class PixiatechChatWidget {
  private config: Required<ChatWidgetConfig>;
  private container: HTMLDivElement | null = null;
  private shadow: ShadowRoot | null = null;
  private isLoaded = false;
  private isOpen = false;
  private hasIframeLoaded = false;

  constructor() {
    const globalConfig = (window as any).ChatWidgetConfig || {};
    this.config = { ...DEFAULT_CONFIG, ...globalConfig };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  private init() {
    if (this.isLoaded) return;
    this.isLoaded = true;

    // 1. Créer le conteneur principal du widget dans le DOM WordPress
    this.container = document.createElement('div');
    this.container.id = 'pixiatech-chatbot-widget';
    if (this.config.position === 'left') {
      this.container.classList.add('left-positioned');
    }
    document.body.appendChild(this.container);

    // 2. Attacher le Shadow Root en mode 'open' pour encapsuler les styles
    this.shadow = this.container.attachShadow({ mode: 'open' });

    // 3. Injecter les styles CSS du widget dans le Shadow DOM
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    this.shadow.appendChild(styleElement);

    // 4. Générer le contenu HTML du widget
    this.render();

    // 5. Mettre en place les écouteurs d'événements
    this.bindEvents();

    // 6. Animation d'entrée du bouton flottant (Lumi)
    if (this.config.entranceAnimation) {
      setTimeout(() => {
        const button = this.shadow?.querySelector('.chat-widget-button');
        button?.classList.add('visible');
      }, 600);

      // Afficher le tooltip après 3 secondes, et le masquer après 10 secondes
      setTimeout(() => {
        if (!this.isOpen) {
          const tooltip = this.shadow?.querySelector('.chat-widget-tooltip');
          tooltip?.classList.add('visible');
        }
      }, 3000);

      setTimeout(() => {
        const tooltip = this.shadow?.querySelector('.chat-widget-tooltip');
        tooltip?.classList.remove('visible');
      }, 10000);
    } else {
      const button = this.shadow?.querySelector('.chat-widget-button');
      button?.classList.add('visible');
    }
  }

  private render() {
    if (!this.shadow) return;

    this.shadow.innerHTML += `
      <!-- Bulle d'aide / Tooltip -->
      <div class="chat-widget-tooltip">${this.config.tooltipText}</div>

      <!-- Bouton Flottant (Robot Lumi) -->
      <button class="chat-widget-button" aria-label="Discuter avec Lumi">
        <div class="chat-widget-avatar-container">
          <video id="lumi-video" class="chat-widget-avatar" src="${this.config.avatarUrl}" poster="${this.config.posterUrl}" muted playsinline loop></video>
        </div>
        <div class="chat-widget-close-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </div>
      </button>

      <!-- Modal Popup (Iframe uniquement) -->
      <div class="chat-widget-modal">
        <!-- Bouton fermer discret pour mobile (fallback) -->
        <button class="chat-widget-close-fallback" aria-label="Fermer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="chat-widget-iframe-container">
          <div class="chat-widget-spinner"></div>
          <!-- L'iframe chargeant votre vrai chatbot Next.js -->
        </div>
      </div>
    `;

    // Lancer la vidéo manuellement après l'injection dans le Shadow DOM
    this.initVideo();
  }

  private initVideo() {
    if (!this.shadow) return;
    const video = this.shadow.getElementById('lumi-video') as HTMLVideoElement | null;
    if (!video) return;

    const startPlayback = () => {
      video.play().catch(() => {
        // Autoplay bloqué — on reste sur le poster, c'est le fallback naturel
      });
    };

    // Si la vidéo est déjà chargée, on lance tout de suite
    if (video.readyState >= 2) {
      startPlayback();
    } else {
      video.addEventListener('canplay', startPlayback, { once: true });
      // Timeout de sécurité : si la vidéo ne charge pas en 5s, on abandonne
      setTimeout(() => {
        if (video.paused && video.readyState < 2) {
          // La vidéo ne charge pas — le poster reste affiché
        }
      }, 5000);
    }
  }

  private bindEvents() {
    if (!this.shadow) return;

    const button = this.shadow.querySelector('.chat-widget-button');
    const closeFallback = this.shadow.querySelector('.chat-widget-close-fallback');
    const tooltip = this.shadow.querySelector('.chat-widget-tooltip');

    // Clic sur le robot flottant : bascule ouvrir/fermer le chatbot
    button?.addEventListener('click', () => {
      tooltip?.classList.remove('visible');
      this.toggleWidget();
    });

    // Clic sur le bouton de fermeture de secours (mobile)
    closeFallback?.addEventListener('click', () => {
      this.closeWidget();
    });

    // Fermer le widget si on presse la touche Échap
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeWidget();
      }
    });

    // Écouter le message 'close-chatbot' venant de votre vrai chatbot (Next.js) dans l'iframe
    window.addEventListener('message', (event) => {
      // Sécurité : On vérifie l'origine
      if (event.origin !== new URL(this.config.iframeUrl).origin) return;

      // Si l'application principale Next.js envoie { type: 'close-chatbot' }
      if (event.data && event.data.type === 'close-chatbot') {
        this.closeWidget();
      }
    });
  }

  private toggleWidget() {
    if (this.isOpen) {
      this.closeWidget();
    } else {
      this.openWidget();
    }
  }

  private openWidget() {
    if (this.isOpen) return;
    this.isOpen = true;

    const modal = this.shadow?.querySelector('.chat-widget-modal');
    const button = this.shadow?.querySelector('.chat-widget-button');

    modal?.classList.add('open');
    button?.classList.add('open');

    // Lazy loading de l'iframe pour économiser de la performance
    if (!this.hasIframeLoaded) {
      this.loadIframe();
    }
  }

  private closeWidget() {
    if (!this.isOpen) return;
    this.isOpen = false;

    const modal = this.shadow?.querySelector('.chat-widget-modal');
    const button = this.shadow?.querySelector('.chat-widget-button');

    modal?.classList.remove('open');
    button?.classList.remove('open');
  }

  private getLanguage(): 'en' | 'fr' {
    if (this.config.lang === 'en' || this.config.lang === 'fr') {
      return this.config.lang;
    }
    const htmlLang = document.documentElement.lang || '';
    if (htmlLang.toLowerCase().startsWith('en')) {
      return 'en';
    }
    return 'fr';
  }

  private loadIframe() {
    const container = this.shadow?.querySelector('.chat-widget-iframe-container');
    const spinner = this.shadow?.querySelector('.chat-widget-spinner') as HTMLElement;
    if (!container) return;

    this.hasIframeLoaded = true;

    // Detect language and append as search param
    const detectedLang = this.getLanguage();
    let iframeSrc = this.config.iframeUrl;
    try {
      const url = new URL(this.config.iframeUrl);
      url.searchParams.set('lang', detectedLang);
      iframeSrc = url.toString();
    } catch (e) {
      // Fallback in case of invalid URL
      iframeSrc = this.config.iframeUrl + (this.config.iframeUrl.includes('?') ? '&' : '?') + 'lang=' + detectedLang;
    }

    const iframe = document.createElement('iframe');
    iframe.className = 'chat-widget-iframe';
    iframe.src = iframeSrc;
    // Autoriser les APIs courantes
    iframe.allow = 'camera; microphone; clipboard-read; clipboard-write; geolocation';
    iframe.title = 'Assistant Bot Lumi';

    iframe.onload = () => {
      if (spinner) {
        spinner.style.opacity = '0';
        setTimeout(() => spinner.remove(), 300);
      }
    };

    container.appendChild(iframe);
  }
}

// Auto-instanciation globale pour distribution directe
new PixiatechChatWidget();
