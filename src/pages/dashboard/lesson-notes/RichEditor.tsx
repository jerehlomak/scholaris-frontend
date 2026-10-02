import { useEffect, useRef } from 'react';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import { TextStyle, Color } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import {
    AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Eraser, Highlighter, ImagePlus, Italic, List, ListOrdered, Minus, Redo2, Strikethrough,
    Table2, Underline as UnderlineIcon, Undo2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';
import { prepareFileForUpload, fileToDataUrl } from '../../../utils/imageUpload';

// Lets the page replace the whole document (after AI writes or revises it) without remounting the editor.
export interface EditorHandle { setHtml: (html: string) => void; getHtml: () => string }

const Btn = ({ on, active, title, children, disabled }: { on: () => void; active?: boolean; title: string; children: React.ReactNode; disabled?: boolean }) => (
    <button type="button" title={title} aria-label={title} disabled={disabled} onMouseDown={e => e.preventDefault()} onClick={on}
        className={cn('flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 text-slate-600 transition hover:bg-slate-100 disabled:opacity-30', active && 'bg-[#1E4DA6]/10 text-[#173F8C]')}>
        {children}
    </button>
);
const Sep = () => <span className="mx-1 h-5 w-px bg-slate-200" />;

function Toolbar({ editor }: { editor: Editor }) {
    const s = useEditorState({
        editor,
        selector: ({ editor: e }) => ({
            bold: e.isActive('bold'), italic: e.isActive('italic'), underline: e.isActive('underline'), strike: e.isActive('strike'), highlight: e.isActive('highlight'),
            bullet: e.isActive('bulletList'), ordered: e.isActive('orderedList'), inTable: e.isActive('table'),
            left: e.isActive({ textAlign: 'left' }), center: e.isActive({ textAlign: 'center' }), right: e.isActive({ textAlign: 'right' }), justify: e.isActive({ textAlign: 'justify' }),
            heading: e.isActive('heading', { level: 1 }) ? '1' : e.isActive('heading', { level: 2 }) ? '2' : e.isActive('heading', { level: 3 }) ? '3' : e.isActive('heading', { level: 4 }) ? '4' : '0',
            color: (e.getAttributes('textStyle').color as string) || '#000000',
            canUndo: e.can().undo(), canRedo: e.can().redo(),
        }),
    });
    const fileRef = useRef<HTMLInputElement>(null);
    const c = () => editor.chain().focus();

    const addImage = async (file: File) => {
        try {
            const small = await prepareFileForUpload(file, { maxMB: 1, maxDimension: 1200 });
            editor.chain().focus().setImage({ src: await fileToDataUrl(small), alt: file.name.replace(/\.[^.]+$/, '') }).run();
        } catch (err: any) { toast.error(err?.message || 'Could not add that image.'); }
    };

    return (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 rounded-t-xl border-b border-slate-200 bg-white/95 px-2 py-1.5 backdrop-blur">
            <Btn title="Undo" on={() => c().undo().run()} disabled={!s.canUndo}><Undo2 className="h-4 w-4" /></Btn>
            <Btn title="Redo" on={() => c().redo().run()} disabled={!s.canRedo}><Redo2 className="h-4 w-4" /></Btn>
            <Sep />
            <select value={s.heading} title="Text style" onChange={e => { const v = e.target.value; v === '0' ? c().setParagraph().run() : c().toggleHeading({ level: Number(v) as 1 | 2 | 3 | 4 }).run(); }}
                className="h-8 rounded-md border border-slate-200 bg-white px-1.5 text-xs text-slate-700 outline-none">
                <option value="0">Normal text</option><option value="1">Title</option><option value="2">Heading 1</option><option value="3">Heading 2</option><option value="4">Heading 3</option>
            </select>
            <Sep />
            <Btn title="Bold" active={s.bold} on={() => c().toggleBold().run()}><Bold className="h-4 w-4" /></Btn>
            <Btn title="Italic" active={s.italic} on={() => c().toggleItalic().run()}><Italic className="h-4 w-4" /></Btn>
            <Btn title="Underline" active={s.underline} on={() => c().toggleUnderline().run()}><UnderlineIcon className="h-4 w-4" /></Btn>
            <Btn title="Strikethrough" active={s.strike} on={() => c().toggleStrike().run()}><Strikethrough className="h-4 w-4" /></Btn>
            <label title="Text colour" className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md hover:bg-slate-100">
                <span className="flex flex-col items-center text-xs font-bold leading-none text-slate-700">A<span className="mt-0.5 h-1 w-4 rounded" style={{ background: s.color }} /></span>
                <input type="color" value={s.color} onChange={e => editor.chain().focus().setColor(e.target.value).run()} className="sr-only" />
            </label>
            <Btn title="Highlight" active={s.highlight} on={() => c().toggleHighlight({ color: '#fef08a' }).run()}><Highlighter className="h-4 w-4" /></Btn>
            <Sep />
            <Btn title="Align left" active={s.left} on={() => c().setTextAlign('left').run()}><AlignLeft className="h-4 w-4" /></Btn>
            <Btn title="Centre" active={s.center} on={() => c().setTextAlign('center').run()}><AlignCenter className="h-4 w-4" /></Btn>
            <Btn title="Align right" active={s.right} on={() => c().setTextAlign('right').run()}><AlignRight className="h-4 w-4" /></Btn>
            <Btn title="Justify" active={s.justify} on={() => c().setTextAlign('justify').run()}><AlignJustify className="h-4 w-4" /></Btn>
            <Sep />
            <Btn title="Bullet list" active={s.bullet} on={() => c().toggleBulletList().run()}><List className="h-4 w-4" /></Btn>
            <Btn title="Numbered list" active={s.ordered} on={() => c().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></Btn>
            <Btn title="Divider line" on={() => c().setHorizontalRule().run()}><Minus className="h-4 w-4" /></Btn>
            <Sep />
            <Btn title="Insert table" on={() => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Table2 className="h-4 w-4" /></Btn>
            <Btn title="Insert picture" on={() => fileRef.current?.click()}><ImagePlus className="h-4 w-4" /></Btn>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={e => { const f = e.target.files?.[0]; if (f) addImage(f); e.target.value = ''; }} />
            <Btn title="Clear formatting" on={() => c().unsetAllMarks().clearNodes().run()}><Eraser className="h-4 w-4" /></Btn>
            {s.inTable && (
                <div className="ml-1 flex items-center gap-0.5 rounded-md bg-slate-50 px-1 text-[11px] font-semibold text-slate-600">
                    <button type="button" className="rounded px-1.5 py-1 hover:bg-slate-200" onMouseDown={e => e.preventDefault()} onClick={() => c().addRowAfter().run()}>+ Row</button>
                    <button type="button" className="rounded px-1.5 py-1 hover:bg-slate-200" onMouseDown={e => e.preventDefault()} onClick={() => c().addColumnAfter().run()}>+ Col</button>
                    <button type="button" className="rounded px-1.5 py-1 hover:bg-slate-200" onMouseDown={e => e.preventDefault()} onClick={() => c().deleteRow().run()}>− Row</button>
                    <button type="button" className="rounded px-1.5 py-1 hover:bg-slate-200" onMouseDown={e => e.preventDefault()} onClick={() => c().deleteColumn().run()}>− Col</button>
                    <button type="button" className="rounded px-1.5 py-1 hover:bg-slate-200" onMouseDown={e => e.preventDefault()} onClick={() => c().mergeOrSplit().run()}>Merge</button>
                    <button type="button" className="rounded px-1.5 py-1 text-red-600 hover:bg-red-50" onMouseDown={e => e.preventDefault()} onClick={() => c().deleteTable().run()}>Delete table</button>
                </div>
            )}
        </div>
    );
}

export function RichEditor({ initialHtml, onChange, handleRef, placeholder }: {
    initialHtml: string; onChange: (html: string) => void; handleRef?: React.MutableRefObject<EditorHandle | null>; placeholder?: string;
}) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            TextStyle, Color, Highlight.configure({ multicolor: true }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Table.configure({ resizable: true }), TableRow, TableHeader, TableCell,
            Image.configure({ allowBase64: true, inline: false }),
            Placeholder.configure({ placeholder: placeholder || 'Start typing, or generate with AI…' }),
        ],
        content: initialHtml,
        onUpdate: ({ editor: e }) => onChange(e.getHTML()),
        editorProps: { attributes: { class: 'lesson-doc focus:outline-none' } },
    });

    useEffect(() => {
        if (!handleRef || !editor) return;
        handleRef.current = {
            setHtml: (html) => { editor.commands.setContent(html, { emitUpdate: true }); },
            getHtml: () => editor.getHTML(),
        };
        return () => { handleRef.current = null; };
    }, [editor, handleRef]);

    if (!editor) return null;
    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <Toolbar editor={editor} />
            <div className="bg-slate-100/60 p-3 sm:p-6">
                <div className="mx-auto min-h-[60vh] max-w-[820px] rounded-md bg-white px-6 py-8 shadow-sm sm:px-12">
                    <EditorContent editor={editor} />
                </div>
            </div>
        </div>
    );
}
