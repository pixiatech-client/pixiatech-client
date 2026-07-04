'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import FontFamily from '@tiptap/extension-font-family';
import Youtube from '@tiptap/extension-youtube';
import Bold from '@tiptap/extension-bold';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';

interface TipTapEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const FontSizeTextStyle = TextStyle.extend({
  addAttributes() {
    return {
      fontSize: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.fontSize,
        renderHTML: (attrs: Record<string, any>) => {
          if (!attrs.fontSize) return {};
          return { style: `font-size: ${attrs.fontSize}` };
        },
      },
    };
  },
});

const CustomBold = Bold.extend({
  renderHTML({ HTMLAttributes }) {
    const { style, ...rest } = HTMLAttributes;
    const newStyle = 'font-weight: bold;' + (style ? ' ' + style : '');
    return ['span', { ...rest, style: newStyle.trim() }, 0] as any;
  },
});

function useClickOutside(handler: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handler();
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [handler]);
  return ref;
}

function ToolbarBtn({ active, title, onClick, children }: { active?: boolean; title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onClick={(e) => { e.preventDefault(); onClick(); }}
      className={`p-1.5 rounded-sm transition-colors ${active ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
    >
      {children}
    </button>
  );
}

function DropdownBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); onClick(); }}
      className="flex items-center justify-center text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 font-medium leading-5 rounded-lg text-xs px-3 py-1.5 transition-colors"
    >
      {children}
    </button>
  );
}

function MenuBar({ editor }: { editor: Editor | null }) {
  const { t } = useI18n();
  const [typographyOpen, setTypographyOpen] = useState(false);
  const [textSizeOpen, setTextSizeOpen] = useState(false);
  const [textColorOpen, setTextColorOpen] = useState(false);
  const [fontFamilyOpen, setFontFamilyOpen] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);

  const typoRef = useClickOutside(useCallback(() => setTypographyOpen(false), []));
  const tsRef = useClickOutside(useCallback(() => setTextSizeOpen(false), []));
  const tcRef = useClickOutside(useCallback(() => setTextColorOpen(false), []));
  const ffRef = useClickOutside(useCallback(() => setFontFamilyOpen(false), []));
  // tableRef removed: table panel is now an inline accordion, not a floating dropdown

  if (!editor) return null;

  const promptImage = () => {
    const url = window.prompt('URL de l\u2019image :', 'https://placehold.co/600x400');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const promptVideo = () => {
    const url = window.prompt('URL YouTube :', 'https://www.youtube.com/watch?v=KaLxCiilHns');
    if (url) editor.commands.setYoutubeVideo({ src: url, width: 640, height: 480 });
  };

  const promptLink = () => {
    const url = window.prompt('URL du lien :', 'https://');
    if (url) editor.chain().focus().toggleLink({ href: url }).run();
  };

  return (
    <div className="border-b border-slate-200">
      <div className="p-2 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-0.5">
          <ToolbarBtn title="Gras" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}>
            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5h4.5a3.5 3.5 0 1 1 0 7H8m0-7v7m0-7H6m2 7h6.5a3.5 3.5 0 1 1 0 7H8m0-7v7m0 0H6"/></svg>
          </ToolbarBtn>
          <ToolbarBtn title="Italique" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}>
            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m8.874 19 6.143-14M6 19h6.33m-.66-14H18"/></svg>
          </ToolbarBtn>
          <ToolbarBtn title="Soulign\u00E9" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')}>
            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeWidth={2} d="M6 19h12M8 5v9a4 4 0 0 0 8 0V5M6 5h4m4 0h4"/></svg>
          </ToolbarBtn>
          <ToolbarBtn title="Barr\u00E9" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')}>
            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 6.2V5h12v1.2M7 19h6m.2-14-1.677 6.523M9.6 19l1.029-4M5 5l6.523 6.523M19 19l-7.477-7.477"/></svg>
          </ToolbarBtn>
          <ToolbarBtn title="Surbrillance" onClick={() => editor.chain().focus().toggleHighlight({ color: editor.isActive('highlight') ? undefined : '#ffc078' }).run()} active={editor.isActive('highlight')}>
            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeWidth={2} d="M9 20H5.5c-.27614 0-.5-.2239-.5-.5v-3c0-.2761.22386-.5.5-.5h13c.2761 0 .5.2239.5.5v3c0 .2761-.2239.5-.5.5H18m-6-1 1.42 1.8933c.04.0534.12.0534.16 0L15 19m-7-6 3.9072-9.76789c.0335-.08381.1521-.08381.1856 0L16 13m-8 0H7m1 0h1.5m6.5 0h-1.5m1.5 0h1m-7-3.00001h4"/></svg>
          </ToolbarBtn>
          <ToolbarBtn title="Code" onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')}>
            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m8 8-4 4 4 4m8 0 4-4-4-4m-2-3-4 14"/></svg>
          </ToolbarBtn>
          <ToolbarBtn title="Lien" onClick={promptLink} active={editor.isActive('link')}>
            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.213 9.787a3.391 3.391 0 0 0-4.795 0l-3.425 3.426a3.39 3.39 0 0 0 4.795 4.794l.321-.304m-.321-4.49a3.39 3.39 0 0 0 4.795 0l3.424-3.426a3.39 3.39 0 0 0-4.794-4.795l-1.028.961"/></svg>
          </ToolbarBtn>
          <ToolbarBtn title="Retirer lien" onClick={() => editor.chain().focus().unsetLink().run()}>
            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeWidth={2} d="M13.2131 9.78732c-.6359-.63557-1.4983-.99259-2.3974-.99259-.89911 0-1.76143.35702-2.39741.99259l-3.4253 3.42528C4.35719 13.8485 4 14.7108 4 15.61c0 .8992.35719 1.7616.99299 2.3974.63598.6356 1.4983.9926 2.39742.9926.89912 0 1.76144-.357 2.39742-.9926l.32157-.3043m-.32157-4.4905c.63587.6358 1.49827.993 2.39747.993.8991 0 1.7615-.3572 2.3974-.993l3.4243-3.42528c.6358-.63585.993-1.49822.993-2.39741 0-.89919-.3572-1.76156-.993-2.39741C17.3712 4.357 16.509 4 15.6101 4c-.899 0-1.7612.357-2.397.9925l-1.0278.96062m7.3873 14.04678"/></svg>
          </ToolbarBtn>
        </div>
      </div>

      <div className="flex items-center gap-2 p-2 flex-wrap">
        <div ref={typoRef} className="relative">
          <DropdownBtn onClick={() => setTypographyOpen(!typographyOpen)}>
            Format
            <svg className="w-3.5 h-3.5 ms-1.5 -me-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7"/></svg>
          </DropdownBtn>
          {typographyOpen && (
            <div className="absolute z-50 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg w-64 p-2 space-y-1">
              <button type="button" onClick={() => { editor.chain().focus().setParagraph().run(); setTypographyOpen(false); }} className="flex items-center justify-between w-full p-2 hover:bg-slate-50 hover:text-slate-900 rounded-lg text-sm font-medium text-slate-600">Paragraph <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded">Ctrl+Alt+0</kbd></button>
              {[1,2,3,4,5,6].map(l => (
                <button key={l} type="button" onClick={() => { editor.chain().focus().toggleHeading({ level: l as any }).run(); setTypographyOpen(false); }} className="flex items-center justify-between w-full p-2 hover:bg-slate-50 hover:text-slate-900 rounded-lg text-sm font-medium text-slate-600">
                  Heading {l} <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded">Ctrl+Alt+{l}</kbd>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-slate-200" />

        <ToolbarBtn title="Image" onClick={promptImage}>
          <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m3 16 5-7 6 6.5m6.5 2.5L16 13l-4.286 6M14 10h.01M4 19h16a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Z"/></svg>
        </ToolbarBtn>
        <ToolbarBtn title="Vid\u00E9o" onClick={promptVideo}>
          <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinejoin="round" strokeWidth={2} d="M10 3v4a1 1 0 0 1-1 1H5m14-4v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7.914a1 1 0 0 1 .293-.707l3.914-3.914A1 1 0 0 1 9.914 3H18a1 1 0 0 1 1 1ZM9 12h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Zm5.697 2.395v-.733l1.269-1.219v2.984l-1.268-1.032Z"/></svg>
        </ToolbarBtn>
        <ToolbarBtn title="Liste \u00E0 puces" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}>
          <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeWidth={2} d="M9 8h10M9 12h10M9 16h10M4.99 8H5m-.02 4h.01m0 4H5"/></svg>
        </ToolbarBtn>
        <ToolbarBtn title="Liste num\u00E9rot\u00E9e" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}>
          <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6h8m-8 6h8m-8 6h8M4 16a2 2 0 1 1 3.321 1.5L4 20h5M4 5l2-1v6m-2 0h4"/></svg>
        </ToolbarBtn>
        <ToolbarBtn title="Citation" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')}>
          <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 11V8a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1Zm0 0v2a4 4 0 0 1-4 4H5m14-6V8a1 1 0 0 0-1-1h-3a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1Zm0 0v2a4 4 0 0 1-4 4h-1"/></svg>
        </ToolbarBtn>
        <ToolbarBtn title="S\u00E9parateur" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeWidth={2} d="M5 12h14"/><path stroke="currentColor" strokeLinecap="round" d="M6 9.5h12m-12-2h12m-12-2h12m-12 13h12m-12-2h12m-12-2h12"/></svg>
        </ToolbarBtn>

        <div className="w-px h-4 bg-slate-200" />

        <ToolbarBtn title="Aligner \u00E0 gauche" onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })}>
          <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6h8m-8 4h12M6 14h8m-8 4h12"/></svg>
        </ToolbarBtn>
        <ToolbarBtn title="Centrer" onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })}>
          <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h8M6 10h12M8 14h8M6 18h12"/></svg>
        </ToolbarBtn>
        <ToolbarBtn title="Aligner \u00E0 droite" onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })}>
          <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 6h-8m8 4H6m12 4h-8m8 4H6"/></svg>
        </ToolbarBtn>

        <div className="w-px h-4 bg-slate-200" />

        <div ref={tsRef} className="relative">
          <ToolbarBtn title="Taille du texte" onClick={() => setTextSizeOpen(!textSizeOpen)}>
            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6.2V5h11v1.2M8 5v14m-3 0h6m2-6.8V11h8v1.2M17 11v8m-1.5 0h3"/></svg>
          </ToolbarBtn>
          {textSizeOpen && (
            <div className="absolute z-50 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg w-64 p-2 space-y-1">
              {[
                { label: '12px (Tiny)', val: '12px' },
                { label: '14px (Small)', val: '14px' },
                { label: '16px (Default)', val: '16px' },
                { label: '18px (Lead)', val: '18px' },
                { label: '24px (Large)', val: '24px' },
                { label: '36px (Huge)', val: '36px' },
              ].map(s => (
                <button key={s.val} type="button" onClick={() => { editor.chain().focus().setMark('textStyle', { fontSize: s.val }).run(); setTextSizeOpen(false); }} className="flex items-center w-full p-2 hover:bg-slate-50 hover:text-slate-900 rounded-lg text-sm font-medium text-slate-600">{s.label}</button>
              ))}
            </div>
          )}
        </div>

        <div ref={tcRef} className="relative">
          <ToolbarBtn title="Couleur du texte" onClick={() => setTextColorOpen(!textColorOpen)}>
            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeWidth={2} d="m6.08169 15.9817 1.57292-4m-1.57292 4h-1.1m1.1 0h1.65m-.07708-4 2.72499-6.92967c.0368-.09379.1673-.09379.2042 0l2.725 6.92967m-5.65419 0h-.00607m.00607 0h5.65419m0 0 .6169 1.569m5.1104 4.453c0 1.1025-.8543 1.9963-1.908 1.9963s-1.908-.8938-1.908-1.9963c0-1.1026 1.908-4.1275 1.908-4.1275s1.908 3.0249 1.908 4.1275Z"/></svg>
          </ToolbarBtn>
          {textColorOpen && (
            <div className="absolute z-50 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg w-56 p-3">
              <div className="flex items-center gap-2 mb-3 p-1.5 rounded-lg hover:bg-slate-50">
                <input type="color" defaultValue="#e66465" onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()} className="border border-slate-200 rounded p-px w-full h-8" />
              </div>
              <div className="grid grid-cols-6 gap-1 mb-3">
                {['#1A56DB','#0E9F6E','#FACA15','#F05252','#FF8A4C','#0694A2','#B4C6FC','#8DA2FB','#5145CD','#771D1D','#FCD9BD','#99154B','#7E3AF2','#CABFFD','#D61F69','#F8B4D9','#F6C196','#A4CAFE','#5145CD','#B43403','#FCE96A','#1E429F','#768FFD','#BCF0DA','#EBF5FF','#16BDCA','#E74694','#83B0ED','#03543F','#111928','#4B5563','#6B7280','#D1D5DB','#F3F4F6','#F3F4F6','#F9FAFB'].map(c => (
                  <button key={c} type="button" onClick={() => editor.chain().focus().setColor(c).run()} style={{ backgroundColor: c }} className="w-6 h-6 rounded-md border border-slate-100"><span className="sr-only">Color</span></button>
                ))}
              </div>
              <button type="button" onClick={() => { editor.commands.unsetColor(); setTextColorOpen(false); }} className="w-full text-center text-xs font-medium text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded-lg px-3 py-1.5">Reset color</button>
            </div>
          )}
        </div>

        <div ref={ffRef} className="relative">
          <ToolbarBtn title="Police" onClick={() => setFontFamilyOpen(!fontFamilyOpen)}>
            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m10.5785 19 4.2979-10.92966c.0369-.09379.1674-.09379.2042 0L19.3785 19m-8.8 0H9.47851m1.09999 0h1.65m7.15 0h-1.65m1.65 0h1.1m-7.7-3.9846h4.4M3 16l1.56685-3.9846m0 0 2.73102-6.94506c.03688-.09379.16738-.09379.20426 0l2.50367 6.94506H4.56685Z"/></svg>
          </ToolbarBtn>
          {fontFamilyOpen && (
            <div className="absolute z-50 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg w-48 p-2 space-y-1">
              {[
                { label: 'Default', val: 'Inter, ui-sans-serif' },
                { label: 'Arial', val: 'Arial, sans-serif' },
                { label: 'Courier New', val: "'Courier New', monospace" },
                { label: 'Georgia', val: 'Georgia, serif' },
                { label: 'Tahoma', val: 'Tahoma, sans-serif' },
                { label: 'Times New Roman', val: "'Times New Roman', serif" },
                { label: 'Trebuchet MS', val: "'Trebuchet MS', sans-serif" },
                { label: 'Verdana', val: 'Verdana, sans-serif' },
              ].map(f => (
                <button key={f.label} type="button" onClick={() => { editor.chain().focus().setFontFamily(f.val).run(); setFontFamilyOpen(false); }} className="flex items-center w-full p-2 hover:bg-slate-50 hover:text-slate-900 rounded-lg text-sm font-medium text-slate-600" style={{ fontFamily: f.val }}>{f.label}</button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-slate-200" />

        <button
          type="button"
          onClick={() => setTableOpen(!tableOpen)}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors border ${
            tableOpen
              ? 'bg-slate-200 text-slate-900 border-slate-300'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <svg className="w-3.5 h-3.5 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15v3c0 .5523.44772 1 1 1h16c.5523 0 1-.4477 1-1v-3M3 15V6c0-.55228.44772-1 1-1h16c.5523 0 1 .44772 1 1v9M3 15h18M8 4v16m8-16v16"/><path stroke="currentColor" strokeLinecap="round" strokeWidth={2} d="M3 10h18"/></svg>
          Tableau
          <svg className={`w-3 h-3 transition-transform ${tableOpen ? 'rotate-180' : ''}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7"/></svg>
        </button>
      </div>

      {/* Table accordion — inline panel, stays open while editing */}
      {tableOpen && (
        <div className="border-t border-slate-200 bg-slate-50 px-3 py-2">
          {!editor.isActive('table') ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wide mr-1">Insérer</span>
              <button
                type="button"
                title={t('admin.productManagement.insertTable') || 'Insérer un tableau (3×3)'}
                onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15v3c0 .5523.44772 1 1 1h16c.5523 0 1-.4477 1-1v-3M3 15V6c0-.55228.44772-1 1-1h16c.5523 0 1 .44772 1 1v9M3 15h18M8 4v16m8-16v16"/><path stroke="currentColor" strokeLinecap="round" strokeWidth={2} d="M3 10h18"/></svg>
              </button>
              <span className="text-xs text-slate-500">Tableau 3 × 3</span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1">
              {/* ── Columns ── */}
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide px-1">Col.</span>
              <button type="button" title={t('admin.productManagement.addColumnBefore') || 'Colonne avant'}
                onClick={() => editor.chain().focus().addColumnBefore().run()}
                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="7" height="14" rx="1" stroke="currentColor" strokeWidth="2"/><path d="M17 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M21 9h-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M17 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M17 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M14 12h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
              <button type="button" title={t('admin.productManagement.addColumnAfter') || 'Colonne après'}
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="14" y="5" width="7" height="14" rx="1" stroke="currentColor" strokeWidth="2"/><path d="M7 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M3 9h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M3 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M3 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M10 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
              <button type="button" title={t('admin.productManagement.deleteColumn') || 'Supprimer colonne'}
                onClick={() => editor.chain().focus().deleteColumn().run()}
                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="7" height="14" rx="1" stroke="currentColor" strokeWidth="2"/><rect x="14" y="5" width="7" height="14" rx="1" stroke="currentColor" strokeWidth="2"/><path d="M10 9l4 6M14 9l-4 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>

              <div className="w-px h-5 bg-slate-300 mx-0.5" />

              {/* ── Rows ── */}
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide px-1">Lig.</span>
              <button type="button" title={t('admin.productManagement.addRowBefore') || 'Ligne avant'}
                onClick={() => editor.chain().focus().addRowBefore().run()}
                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="7" rx="1" stroke="currentColor" strokeWidth="2"/><path d="M12 14v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M9 17h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M5 14h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
              <button type="button" title={t('admin.productManagement.addRowAfter') || 'Ligne après'}
                onClick={() => editor.chain().focus().addRowAfter().run()}
                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="14" width="18" height="7" rx="1" stroke="currentColor" strokeWidth="2"/><path d="M12 10V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M9 7h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M5 14h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
              <button type="button" title={t('admin.productManagement.deleteRow') || 'Supprimer ligne'}
                onClick={() => editor.chain().focus().deleteRow().run()}
                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="7" rx="1" stroke="currentColor" strokeWidth="2"/><rect x="3" y="14" width="18" height="7" rx="1" stroke="currentColor" strokeWidth="2"/><path d="M9 9.5l6 5M15 9.5l-6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>

              <div className="w-px h-5 bg-slate-300 mx-0.5" />

              {/* ── Cells ── */}
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide px-1">Cell.</span>
              <button type="button" title={t('admin.productManagement.mergeCells') || 'Fusionner cellules'}
                onClick={() => editor.chain().focus().mergeCells().run()}
                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="18" height="14" rx="1" stroke="currentColor" strokeWidth="2"/><path d="M12 5v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/><path d="M9 12l3-3 3 3M9 12l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button type="button" title={t('admin.productManagement.splitCell') || 'Diviser cellule'}
                onClick={() => editor.chain().focus().splitCell().run()}
                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="18" height="14" rx="1" stroke="currentColor" strokeWidth="2"/><path d="M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M15 9l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 9l-3 3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>

              <div className="w-px h-5 bg-slate-300 mx-0.5" />

              {/* ── Header ── */}
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide px-1">En-tête</span>
              <button type="button" title={t('admin.productManagement.toggleHeaderRow') || 'Basculer en-tête ligne'}
                onClick={() => editor.chain().focus().toggleHeaderRow().run()}
                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="18" height="6" rx="1" fill="currentColor" fillOpacity=".2" stroke="currentColor" strokeWidth="2"/><path d="M3 14h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
              <button type="button" title={t('admin.productManagement.toggleHeaderColumn') || 'Basculer en-tête colonne'}
                onClick={() => editor.chain().focus().toggleHeaderColumn().run()}
                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="6" height="14" rx="1" fill="currentColor" fillOpacity=".2" stroke="currentColor" strokeWidth="2"/><path d="M12 5v14M16 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>

              <div className="w-px h-5 bg-slate-300 mx-0.5" />

              {/* ── Delete table ── */}
              <button type="button" title={t('admin.productManagement.deleteTable') || 'Supprimer le tableau'}
                onClick={() => { editor.chain().focus().deleteTable().run(); setTableOpen(false); }}
                className="p-1.5 rounded-md border border-red-200 bg-white text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TipTapEditor({ value, onChange }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        bold: false,
      }),
      CustomBold,
      Underline,
      FontSizeTextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontFamily,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        HTMLAttributes: { class: 'text-blue-600 underline hover:text-blue-800' },
      }),
      Image.configure({ inline: false, allowBase64: true }),
      Youtube.configure({
        width: 640,
        height: 480,
      }),
      Table.configure({
        resizable: true,
        allowTableNodeSelection: true,
        HTMLAttributes: { class: 'min-w-full border-collapse table-fixed' },
      }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[200px] px-4 py-3 text-sm text-slate-900 outline-none',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:border-slate-300 transition-colors">
      <MenuBar editor={editor} />
      <div className="px-4 py-2 bg-white rounded-b-xl">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
