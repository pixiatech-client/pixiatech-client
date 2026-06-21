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
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { useEffect } from 'react';

interface TipTapEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const Divider = () => <div className="w-px h-5 bg-slate-200 mx-0.5" />;

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) return null;

  const tb = (label: string, icon: string, action: () => void, active?: boolean) => (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); action(); }}
      title={label}
      className={`w-7 h-7 flex items-center justify-center text-xs rounded transition-colors ${
        active ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      {icon}
    </button>
  );

  const addImage = () => {
    const url = prompt('URL de l\u2019image :');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const addLink = () => {
    const url = prompt('URL du lien :');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-slate-200 bg-slate-50/80 rounded-t-xl">
      {tb('Annuler', '\u21A9', () => editor.chain().focus().undo().run())}
      {tb('R\u00E9tablir', '\u21AA', () => editor.chain().focus().redo().run())}

      <Divider />

      {tb('Gras', 'B', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
      {tb('Italique', 'I', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
      {tb('Soulign\u00E9', 'U', () => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'))}
      {tb('Barr\u00E9', 'S', () => editor.chain().focus().toggleStrike().run(), editor.isActive('strike'))}

      <Divider />

      {tb('Titre 1', 'H1', () => editor.chain().focus().toggleHeading({ level: 1 }).run(), editor.isActive('heading', { level: 1 }))}
      {tb('Titre 2', 'H2', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }))}
      {tb('Titre 3', 'H3', () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }))}
      {tb('Titre 4', 'H4', () => editor.chain().focus().toggleHeading({ level: 4 }).run(), editor.isActive('heading', { level: 4 }))}

      <Divider />

      {tb('Liste \u00E0 puces', '\u2022', () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
      {tb('Liste num\u00E9rot\u00E9e', '1.', () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}

      <Divider />

      {tb('Aligner \u00E0 gauche', '\u25C0', () => editor.chain().focus().setTextAlign('left').run(), editor.isActive({ textAlign: 'left' }))}
      {tb('Centrer', '\u2261', () => editor.chain().focus().setTextAlign('center').run(), editor.isActive({ textAlign: 'center' }))}
      {tb('Aligner \u00E0 droite', '\u25B6', () => editor.chain().focus().setTextAlign('right').run(), editor.isActive({ textAlign: 'right' }))}

      <Divider />

      {tb('Citation', '\u275D', () => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'))}
      {tb('S\u00E9parateur', '\u2014', () => editor.chain().focus().setHorizontalRule().run())}

      <Divider />

      {tb('Tableau', '\u229E', () => addTable())}
      {tb('Lien', '\uD83D\uDD17', () => addLink(), editor.isActive('link'))}
      {tb('Image', '\uD83D\uDDBC', () => addImage())}

      <Divider />

      <input
        type="color"
        onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
        value={(editor.getAttributes('textStyle').color as string) || '#000000'}
        className="w-6 h-6 p-0 border-0 cursor-pointer"
        title="Couleur du texte"
      />
      <input
        type="color"
        onInput={(e) => editor.chain().focus().toggleHighlight({ color: (e.target as HTMLInputElement).value }).run()}
        value={(editor.getAttributes('highlight').color as string) || '#ffff00'}
        className="w-6 h-6 p-0 border-0 cursor-pointer"
        title="Couleur de fond"
      />
    </div>
  );
};

export default function TipTapEditor({ value, onChange }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-blue-600 underline hover:text-blue-800' },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Table.configure({ resizable: false }),
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
    <div className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden focus-within:border-slate-300 transition-colors">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
