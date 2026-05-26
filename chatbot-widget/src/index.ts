// src/index.ts
import styles from './style.css?inline';

interface ChatWidgetConfig {
  position?: 'left' | 'right';
  primaryColor?: string;
  iframeUrl?: string;
  avatarUrl?: string;
  entranceAnimation?: boolean;
  tooltipText?: string;
  title?: string;
}

// Configuration par défaut du Widget
const DEFAULT_CONFIG: Required<ChatWidgetConfig> = {
  position: 'right',
  primaryColor: '#0f172a',
  iframeUrl: 'https://studio-9205859220-a6440.web.app', // URL par défaut de l'app client
  avatarUrl: '',
  entranceAnimation: true,
  tooltipText: 'Besoin d\'aide ? Discutons !',
  title: 'Assistant Pixiatech'
};

class PixiatechChatWidget {
  private config: Required<ChatWidgetConfig>;
  private container: HTMLDivElement | null = null;
  private shadow: ShadowRoot | null = null;
  private isLoaded = false;
  private isOpen = false;
  private hasIframeLoaded = false;

  constructor() {
    // Fusionner la configuration globale window.ChatWidgetConfig avec les valeurs par défaut
    const globalConfig = (window as any).ChatWidgetConfig || {};
    this.config = { ...DEFAULT_CONFIG, ...globalConfig };

    // S'assurer que le DOM est complètement chargé avant d'initialiser
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

    // 6. Animation d'entrée du bouton flottant (avec un léger délai pour faire pro)
    if (this.config.entranceAnimation) {
      setTimeout(() => {
        const button = this.shadow?.querySelector('.chat-widget-button');
        button?.classList.add('visible');
      }, 800);

      // Afficher la bulle d'aide / tooltip après 3 secondes, et la masquer après 8 secondes
      setTimeout(() => {
        if (!this.isOpen) {
          const tooltip = this.shadow?.querySelector('.chat-widget-tooltip');
          tooltip?.classList.add('visible');
        }
      }, 3500);

      setTimeout(() => {
        const tooltip = this.shadow?.querySelector('.chat-widget-tooltip');
        tooltip?.classList.remove('visible');
      }, 10500);
    } else {
      const button = this.shadow?.querySelector('.chat-widget-button');
      button?.classList.add('visible');
    }
  }

  private render() {
    if (!this.shadow) return;

    // Bulle de chat SVG par défaut ou Avatar Image si spécifié
    const buttonContent = this.config.avatarUrl
      ? `<img src="${this.config.avatarUrl}" alt="Chat Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`
      : `<svg class="chat-widget-icon" viewBox="0 0 24 24">
           <path fill="currentColor" d="M12 2C6.477 2 2 6.14 2 11.25c0 2.48 1.077 4.717 2.825 6.363l-.865 2.89a.75.75 0 0 0 1.01.884l3.35-1.674A11.082 11.082 0 0 0 12 20.5c5.523 0 10-4.14 10-9.25S17.523 2 12 2Zm0 13.5a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Zm0-4.5a1 1 0 0 1-1-1V8a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1Z"/>
         </svg>`;

    // Rendu de la structure HTML
    this.shadow.innerHTML += `
      <!-- Bulle d'aide -->
      <div class="chat-widget-tooltip">${this.config.tooltipText}</div>

      <!-- Bouton Flottant -->
      <button class="chat-widget-button" style="--primary-color: ${this.config.primaryColor};" aria-label="Ouvrir le chatbot">
        ${buttonContent}
      </button>

      <!-- Modal Popup -->
      <div class="chat-widget-modal" style="--primary-color: ${this.config.primaryColor};">
        <div class="chat-widget-header">
          <div class="chat-widget-title-container">
            <div class="chat-widget-status"></div>
            <span class="chat-widget-title">${this.config.title}</span>
          </div>
          <button class="chat-widget-close" aria-label="Fermer le chatbot">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="chat-widget-iframe-container">
          <div class="chat-widget-spinner"></div>
          <!-- L'iframe sera injectée de façon paresseuse (lazy load) ici -->
        </div>
      </div>
    `;
  }

  private bindEvents() {
    if (!this.shadow) return;

    const button = this.shadow.querySelector('.chat-widget-button');
    const closeBtn = this.shadow.querySelector('.chat-widget-close');
    const tooltip = this.shadow.querySelector('.chat-widget-tooltip');

    // Clic sur le bouton flottant
    button?.addEventListener('click', () => {
      tooltip?.classList.remove('visible');
      this.toggleWidget();
    });

    // Clic sur le bouton de fermeture du header
    closeBtn?.addEventListener('click', () => {
      this.closeWidget();
    });

    // Fermer le widget si on presse la touche Échap
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeWidget();
      }
    });

    // Écouter les messages inter-fenêtres (postMessage) venant de l'iframe du chatbot
    window.addEventListener('message', (event) => {
      // Pour des raisons de sécurité, nous acceptons le message s'il correspond à l'URL configurée
      if (event.origin !== new URL(this.config.iframeUrl).origin) return;

      // Si l'iframe envoie { type: 'close-chatbot' }, on ferme le widget
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

    // Charger l'iframe uniquement au premier clic (Lazy Loading)
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

  private loadIframe() {
    const container = this.shadow?.querySelector('.chat-widget-iframe-container');
    const spinner = this.shadow?.querySelector('.chat-widget-spinner') as HTMLElement;
    if (!container) return;

    this.hasIframeLoaded = true;

    const iframe = document.createElement('iframe');
    iframe.className = 'chat-widget-iframe';
    iframe.src = this.config.iframeUrl;
    iframe.allow = 'camera; microphone; clipboard-read; clipboard-write; geolocation';
    iframe.title = this.config.title;

    // Cacher le spinner dès que l'iframe a fini de charger
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
