import { Node, mergeAttributes } from '@tiptap/core';
import katex from 'katex';
import 'katex/contrib/mhchem';
import 'katex/dist/katex.min.css';

export interface MathEditInfo { pos: number; latex: string; display: boolean }

// An inline formula. Stored in HTML as <span data-type="math" data-latex="..."></span>, drawn by KaTeX.
export const MathNode = Node.create<{ onEdit?: (info: MathEditInfo) => void }>({
    name: 'math',
    group: 'inline',
    inline: true,
    atom: true,
    selectable: true,

    addOptions() { return { onEdit: undefined }; },

    addAttributes() {
        return {
            latex: { default: '', parseHTML: el => el.getAttribute('data-latex') || '', renderHTML: a => ({ 'data-latex': a.latex }) },
            display: { default: false, parseHTML: el => el.getAttribute('data-display') === 'true', renderHTML: a => (a.display ? { 'data-display': 'true' } : {}) },
        };
    },

    parseHTML() { return [{ tag: 'span[data-type="math"]' }]; },
    renderHTML({ HTMLAttributes }) { return ['span', mergeAttributes({ 'data-type': 'math' }, HTMLAttributes)]; },

    addNodeView() {
        const opts = this.options;
        return ({ node: initial, getPos }) => {
            let node = initial;
            const dom = document.createElement('span');
            dom.className = 'math-node';
            dom.contentEditable = 'false';
            const paint = () => {
                dom.style.display = node.attrs.display ? 'block' : 'inline-block';
                dom.style.textAlign = node.attrs.display ? 'center' : 'inherit';
                try { katex.render(String(node.attrs.latex || '\\square'), dom, { throwOnError: false, displayMode: !!node.attrs.display, trust: false }); }
                catch { dom.textContent = String(node.attrs.latex || ''); }
            };
            paint();
            dom.addEventListener('click', () => {
                const pos = typeof getPos === 'function' ? getPos() : undefined;
                if (typeof pos === 'number') opts.onEdit?.({ pos, latex: node.attrs.latex, display: !!node.attrs.display });
            });
            return {
                dom,
                update: (n) => { if (n.type.name !== 'math') return false; node = n; paint(); return true; },
            };
        };
    },
});

export const renderMathIn = (root: HTMLElement) => {
    root.querySelectorAll<HTMLElement>('span[data-type="math"]').forEach(el => {
        const latex = el.getAttribute('data-latex') || '';
        const display = el.getAttribute('data-display') === 'true';
        try { katex.render(latex, el, { throwOnError: false, displayMode: display, trust: false }); } catch { el.textContent = latex; }
        if (display) { el.style.display = 'block'; el.style.textAlign = 'center'; }
    });
};

export const renderLatexToHtml = (latex: string, display = false) => {
    try { return katex.renderToString(latex || '\\square', { throwOnError: false, displayMode: display, trust: false }); }
    catch { return ''; }
};
