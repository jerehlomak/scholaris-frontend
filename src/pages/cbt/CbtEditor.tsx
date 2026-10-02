import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Placeholder from '@tiptap/extension-placeholder';
import { AlignCenter, AlignLeft, AlignRight, Bold, ImagePlus, Italic, List, ListOrdered, Redo2, Sigma, Subscript as SubIcon, Superscript as SupIcon, Table2, Underline as UnderlineIcon, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { prepareFileForUpload, fileToDataUrl } from '../../utils/imageUpload';
import { MathNode, renderLatexToHtml, type MathEditInfo } from './MathExtension';

// A compact rich-text editor for questions: text styling, formulas (LaTeX), pictures and tables.
// `mini` is the small version used for answer options.

const SNIPPETS: [string, string][] = [
    ['a/b', '\\frac{a}{b}'], ['x²', 'x^{2}'], ['xₙ', 'x_{n}'], ['√', '\\sqrt{x}'], ['ⁿ√', '\\sqrt[n]{x}'], ['±', '\\pm'], ['×', '\\times'], ['÷', '\\div'],
    ['≤', '\\le'], ['≥', '\\ge'], ['≠', '\\ne'], ['≈', '\\approx'], ['π', '\\pi'], ['θ', '\\theta'], ['α', '\\alpha'], ['β', '\\beta'], ['Δ', '\\Delta'], ['λ', '\\lambda'],
    ['∞', '\\infty'], ['°', '^{\\circ}'], ['→', '\\rightarrow'], ['Σ', '\\sum_{i=1}^{n}'], ['∫', '\\int_{a}^{b}'], ['lim', '\\lim_{x \\to 0}'], ['sin', '\\sin\\theta'], ['log', '\\log_{a}'],
    ['vec', '\\vec{F}'], ['H₂O', '\\ce{H2O}'], ['rxn', '\\ce{2H2 + O2 -> 2H2O}'], ['∠', '\\angle ABC'], ['△', '\\triangle ABC'],
];

function MathDialog({ info, onClose, onDone }: { info: { pos: number | null; latex: string; display: boolean }; onClose: () => void; onDone: (latex: string, display: boolean) => void }) {
    const [latex, setLatex] = useState(info.latex);
    const [display, setDisplay] = useState(info.display);
    const ta = useRef<HTMLTextAreaElement>(null);
    const add = (snippet: string) => {
        const el = ta.current;
        const s = el?.selectionStart ?? latex.length;
        const e = el?.selectionEnd ?? latex.length;
        setLatex(latex.slice(0, s) + snippet + latex.slice(e));
        setTimeout(() => { el?.focus(); el?.setSelectionRange(s + snippet.length, s + snippet.length); }, 0);
    };
    return (
        <Dialog open onOpenChange={o => !o && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle className="flex items-center gap-2"><Sigma className="h-5 w-5 text-[#1E4DA6]" /> Formula</DialogTitle><DialogDescription>Type LaTeX, or tap a symbol. Chemistry works too, for example \ce{'{H2O}'}.</DialogDescription></DialogHeader>
                <div className="flex flex-wrap gap-1">
                    {SNIPPETS.map(([label, s]) => <button key={s} type="button" onClick={() => add(s)} title={s} className="min-w-9 rounded-md border border-slate-200 px-2 py-1 text-sm hover:border-[#1E4DA6]/50 hover:bg-[#1E4DA6]/5">{label}</button>)}
                </div>
                <textarea ref={ta} autoFocus value={latex} onChange={e => setLatex(e.target.value)} rows={3} spellCheck={false}
                    className="w-full rounded-lg border border-slate-200 p-3 font-mono text-sm outline-none focus:border-[#1E4DA6] focus:ring-2 focus:ring-[#1E4DA6]/20" placeholder="e.g. x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}" />
                <div className="min-h-16 overflow-x-auto rounded-lg bg-slate-50 p-3 text-center" dangerouslySetInnerHTML={{ __html: latex.trim() ? renderLatexToHtml(latex, display) : '<span style="color:#94a3b8;font-size:13px">Preview appears here</span>' }} />
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600"><input type="checkbox" className="accent-[#1E4DA6]" checked={display} onChange={e => setDisplay(e.target.checked)} /> Show on its own line (large)</label>
                <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={!latex.trim()} onClick={() => onDone(latex.trim(), display)}>{info.pos === null ? 'Insert' : 'Update'}</Button></div>
            </DialogContent>
        </Dialog>
    );
}

const Btn = ({ on, active, title, children, disabled }: { on: () => void; active?: boolean; title: string; children: React.ReactNode; disabled?: boolean }) => (
    <button type="button" title={title} aria-label={title} disabled={disabled} onMouseDown={e => e.preventDefault()} onClick={on}
        className={cn('flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 text-slate-600 transition hover:bg-slate-100 disabled:opacity-30', active && 'bg-[#1E4DA6]/10 text-[#173F8C]')}>{children}</button>
);
const Sep = () => <span className="mx-0.5 h-5 w-px bg-slate-200" />;

function Toolbar({ editor, mini, openMath }: { editor: Editor; mini: boolean; openMath: () => void }) {
    const s = useEditorState({
        editor,
        selector: ({ editor: e }) => ({
            bold: e.isActive('bold'), italic: e.isActive('italic'), underline: e.isActive('underline'), sub: e.isActive('subscript'), sup: e.isActive('superscript'),
            bullet: e.isActive('bulletList'), ordered: e.isActive('orderedList'), inTable: e.isActive('table'),
            left: e.isActive({ textAlign: 'left' }), center: e.isActive({ textAlign: 'center' }), right: e.isActive({ textAlign: 'right' }),
            canUndo: e.can().undo(), canRedo: e.can().redo(),
        }),
    });
    const fileRef = useRef<HTMLInputElement>(null);
    const c = () => editor.chain().focus();
    const addImage = async (file: File) => {
        try {
            const small = await prepareFileForUpload(file, { maxMB: 1, maxDimension: mini ? 600 : 1200 });
            editor.chain().focus().setImage({ src: await fileToDataUrl(small), alt: file.name.replace(/\.[^.]+$/, '') }).run();
        } catch (err: any) { toast.error(err?.message || 'Could not add that image.'); }
    };
    return (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-white px-1.5 py-1">
            {!mini && <><Btn title="Undo" on={() => c().undo().run()} disabled={!s.canUndo}><Undo2 className="h-4 w-4" /></Btn><Btn title="Redo" on={() => c().redo().run()} disabled={!s.canRedo}><Redo2 className="h-4 w-4" /></Btn><Sep /></>}
            <Btn title="Bold" active={s.bold} on={() => c().toggleBold().run()}><Bold className="h-4 w-4" /></Btn>
            <Btn title="Italic" active={s.italic} on={() => c().toggleItalic().run()}><Italic className="h-4 w-4" /></Btn>
            <Btn title="Underline" active={s.underline} on={() => c().toggleUnderline().run()}><UnderlineIcon className="h-4 w-4" /></Btn>
            <Btn title="Subscript (H₂O)" active={s.sub} on={() => c().toggleSubscript().run()}><SubIcon className="h-4 w-4" /></Btn>
            <Btn title="Superscript (x²)" active={s.sup} on={() => c().toggleSuperscript().run()}><SupIcon className="h-4 w-4" /></Btn>
            <Sep />
            <Btn title="Insert formula" on={openMath}><Sigma className="h-4 w-4" /></Btn>
            <Btn title="Insert picture or diagram" on={() => fileRef.current?.click()}><ImagePlus className="h-4 w-4" /></Btn>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" hidden onChange={e => { const f = e.target.files?.[0]; if (f) addImage(f); e.target.value = ''; }} />
            {!mini && (<>
                <Sep />
                <Btn title="Bullet list" active={s.bullet} on={() => c().toggleBulletList().run()}><List className="h-4 w-4" /></Btn>
                <Btn title="Numbered list" active={s.ordered} on={() => c().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></Btn>
                <Btn title="Align left" active={s.left} on={() => c().setTextAlign('left').run()}><AlignLeft className="h-4 w-4" /></Btn>
                <Btn title="Centre" active={s.center} on={() => c().setTextAlign('center').run()}><AlignCenter className="h-4 w-4" /></Btn>
                <Btn title="Align right" active={s.right} on={() => c().setTextAlign('right').run()}><AlignRight className="h-4 w-4" /></Btn>
                <Sep />
                <Btn title="Insert table" on={() => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Table2 className="h-4 w-4" /></Btn>
                {s.inTable && <span className="ml-1 flex items-center gap-0.5 rounded-md bg-slate-50 px-1 text-[11px] font-semibold text-slate-600">
                    {([['+ Row', () => c().addRowAfter().run()], ['+ Col', () => c().addColumnAfter().run()], ['− Row', () => c().deleteRow().run()], ['− Col', () => c().deleteColumn().run()], ['Delete table', () => c().deleteTable().run()]] as [string, () => void][]).map(([l, f]) => (
                        <button key={l} type="button" className="rounded px-1.5 py-1 hover:bg-slate-200" onMouseDown={e => e.preventDefault()} onClick={f}>{l}</button>))}
                </span>}
            </>)}
        </div>
    );
}

export function CbtEditor({ value, onChange, mini = false, placeholder, minHeight }: { value: string; onChange: (html: string) => void; mini?: boolean; placeholder?: string; minHeight?: number }) {
    const [mathInfo, setMathInfo] = useState<{ pos: number | null; latex: string; display: boolean } | null>(null);
    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: mini ? false : { levels: [2, 3] }, codeBlock: false, code: false, blockquote: mini ? false : undefined, horizontalRule: false }),
            Subscript, Superscript,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Table.configure({ resizable: true }), TableRow, TableHeader, TableCell,
            Image.configure({ allowBase64: true, inline: false }),
            MathNode.configure({ onEdit: (info: MathEditInfo) => setMathInfo({ pos: info.pos, latex: info.latex, display: info.display }) }),
            Placeholder.configure({ placeholder: placeholder || '' }),
        ],
        content: value,
        onUpdate: ({ editor: e }) => onChange(e.isEmpty && !/<img|data-type="math"/.test(e.getHTML()) ? '' : e.getHTML()),
        editorProps: { attributes: { class: cn('lesson-doc focus:outline-none', mini ? 'px-2 py-1.5 text-sm' : 'px-4 py-3') } },
    });

    // keep in step when the parent replaces the content (e.g. loading a different question)
    useEffect(() => { if (editor && value !== editor.getHTML() && !(value === '' && editor.isEmpty)) editor.commands.setContent(value || '', { emitUpdate: false }); }, [value, editor]);

    if (!editor) return null;
    const apply = (latex: string, display: boolean) => {
        if (mathInfo?.pos === null || mathInfo === null) editor.chain().focus().insertContent({ type: 'math', attrs: { latex, display } }).run();
        else editor.chain().focus().setNodeSelection(mathInfo.pos).updateAttributes('math', { latex, display }).run();
        setMathInfo(null);
    };
    return (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white focus-within:border-[#1E4DA6] focus-within:ring-2 focus-within:ring-[#1E4DA6]/20">
            <Toolbar editor={editor} mini={mini} openMath={() => setMathInfo({ pos: null, latex: '', display: false })} />
            <div style={{ minHeight: minHeight ?? (mini ? 44 : 120) }}><EditorContent editor={editor} /></div>
            {mathInfo && <MathDialog info={mathInfo} onClose={() => setMathInfo(null)} onDone={apply} />}
        </div>
    );
}
