import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CARD_SIZE, IdCardView } from './IdCardView';
import type { CardItem, IdCardConfig, SchoolInfo } from './types';

export interface PrintGroup { title: string; items: CardItem[] }
export type PrintSides = 'front' | 'back' | 'both';

const PAGE_W = 794; // A4 @96dpi
const PAGE_H = 1123;
const MARGIN = 28;
const GAP = 10;
const CAPTION = 22;

const layoutFor = (orientation: 'vertical' | 'horizontal') => {
    const { w, h } = CARD_SIZE[orientation];
    const cols = Math.max(1, Math.floor((PAGE_W - MARGIN * 2 + GAP) / (w + GAP)));
    const rows = Math.max(1, Math.floor((PAGE_H - MARGIN * 2 - CAPTION + GAP) / (h + GAP)));
    return { cols, rows, perPage: cols * rows, w, h };
};

type Cell = CardItem | null;

// Backs are mirrored within each row so each back lands behind its front when the sheet
// is flipped on the long edge (standard duplex printing).
const mirrorRows = (cells: Cell[], cols: number): Cell[] => {
    const out: Cell[] = [];
    for (let i = 0; i < cells.length; i += cols) {
        const row = cells.slice(i, i + cols);
        while (row.length < cols) row.push(null);
        out.push(...row.reverse());
    }
    return out;
};

const PRINT_CSS = `
#id-card-print-root { display: none; }
@media print {
  @page { size: A4 portrait; margin: 0; }
  html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
  body > *:not(#id-card-print-root) { display: none !important; }
  #id-card-print-root { display: block !important; }
  #id-card-print-root .id-page { page-break-after: always; break-after: page; }
  #id-card-print-root .id-page:last-child { page-break-after: auto; break-after: auto; }
  #id-card-print-root, #id-card-print-root * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

/**
 * Renders print-ready A4 sheets into <body> and opens the print dialog once images have
 * loaded ("Save as PDF" in the dialog gives a downloadable PDF). Calls onDone afterwards.
 */
export function PrintSheets({ groups, sides, config, school, onDone }: {
    groups: PrintGroup[]; sides: PrintSides; config: IdCardConfig; school: SchoolInfo; onDone: () => void;
}) {
    const { cols, perPage, w, h } = layoutFor(config.orientation);

    useEffect(() => {
        let cancelled = false;
        const root = document.getElementById('id-card-print-root');
        const finish = () => { if (!cancelled) onDone(); };
        const run = async () => {
            const imgs = Array.from(root?.querySelectorAll('img') || []);
            await Promise.all(imgs.map(img => (img.complete ? Promise.resolve() : new Promise<void>(res => { img.onload = img.onerror = () => res(); }))));
            await new Promise(r => setTimeout(r, 150));
            if (cancelled) return;
            window.addEventListener('afterprint', finish, { once: true });
            window.print();
        };
        run();
        return () => { cancelled = true; window.removeEventListener('afterprint', finish); };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const pages: { key: string; caption: string; cells: Cell[]; side: 'front' | 'back' }[] = [];
    for (const g of groups) {
        const printable = g.items.filter(i => i.card && i.card.status === 'ACTIVE');
        const chunks = Math.max(1, Math.ceil(printable.length / perPage));
        for (let p = 0; p < chunks; p++) {
            const slice = printable.slice(p * perPage, (p + 1) * perPage);
            const label = `${g.title} · page ${p + 1} of ${chunks}`;
            if (sides !== 'back') pages.push({ key: `${g.title}-f-${p}`, caption: `${label} · Fronts`, cells: slice, side: 'front' });
            if (sides !== 'front') pages.push({ key: `${g.title}-b-${p}`, caption: `${label} · Backs`, cells: mirrorRows(slice, cols), side: 'back' });
        }
    }

    return createPortal(
        <div id="id-card-print-root">
            <style>{PRINT_CSS}</style>
            {pages.map(page => (
                <div key={page.key} className="id-page" style={{ width: PAGE_W, height: PAGE_H, padding: MARGIN, boxSizing: 'border-box', background: '#fff', overflow: 'hidden' }}>
                    <div style={{ height: CAPTION, fontSize: 9, color: '#64748B', fontFamily: 'Arial,sans-serif' }}>{page.caption}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${w}px)`, gridAutoRows: h, gap: GAP }}>
                        {page.cells.map((cell, i) => cell
                            ? <IdCardView key={cell.person.id} config={config} school={school} person={cell.person} card={cell.card} qr={cell.qr} side={page.side} style={{ border: '1px dashed #94A3B8', borderRadius: 8 }} />
                            : <div key={`blank-${i}`} />)}
                    </div>
                </div>
            ))}
        </div>,
        document.body,
    );
}
