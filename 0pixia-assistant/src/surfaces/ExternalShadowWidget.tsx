import { useEffect, useRef } from 'react';
import type { Language } from '../core/types.ts';

interface ExternalShadowWidgetProps {
  lang: Language;
  position: 'bottom-right' | 'bottom-left';
  tooltipText: string;
}

export function ExternalShadowWidget({
  lang,
  position,
  tooltipText,
}: ExternalShadowWidgetProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
    shadow.innerHTML = '';

    const style = document.createElement('style');
    style.textContent = `
      .pixia-ext-wrap {
        display: flex;
        flex-direction: column;
        align-items: ${position === 'bottom-right' ? 'flex-end' : 'flex-start'};
        gap: 12px;
        font-family: system-ui, sans-serif;
      }
      .pixia-ext-trigger {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        background: #17171A;
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 9999px;
        padding: 12px 18px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 14px 35px rgba(0, 0, 0, 0.45);
      }
      .pixia-ext-frame {
        width: min(380px, 100%);
        aspect-ratio: 9 / 16;
        max-height: 676px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 28px;
        background: #17171A;
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
        display: none;
      }
      .pixia-ext-frame[data-open="true"] {
        display: block;
      }
    `;

    const wrap = document.createElement('div');
    wrap.className = 'pixia-ext-wrap';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pixia-ext-trigger';
    btn.textContent = tooltipText;

    const iframe = document.createElement('iframe');
    iframe.className = 'pixia-ext-frame';
    iframe.title = 'PIXIA External Widget';

    let loaded = false;
    let open = false;

    const syncState = () => {
      iframe.setAttribute('data-open', open ? 'true' : 'false');
      btn.style.display = open ? 'none' : 'inline-flex';
    };

    btn.addEventListener('click', () => {
      if (!loaded) {
        iframe.src = `/chat-widget?lang=${encodeURIComponent(lang)}`;
        loaded = true;
      }
      open = true;
      syncState();
    });

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'close-chatbot') {
        open = false;
        syncState();
      }
    };

    window.addEventListener('message', handleMessage);

    wrap.appendChild(iframe);
    wrap.appendChild(btn);
    shadow.appendChild(style);
    shadow.appendChild(wrap);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [lang, position, tooltipText]);

  return <div ref={hostRef} />;
}
