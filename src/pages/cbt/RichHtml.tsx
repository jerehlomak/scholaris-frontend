import { memo, useEffect, useMemo, useRef } from 'react';
import { cn } from '../../lib/utils';
import { renderMathIn } from './MathExtension';

/**
 * Shows sanitised question / instruction HTML, drawing any formulas with KaTeX.
 *
 * The `{ __html }` object is memoised on purpose: React 19 re-applies `innerHTML` whenever that object is a new
 * one, which would wipe the drawn formulas on every re-render (the exam timer re-renders the page each second).
 */
function RichHtmlBase({ html, className, inline = false }: { html: string; className?: string; inline?: boolean }) {
    const ref = useRef<HTMLDivElement>(null);
    // option text is a single <p>; show it inline next to its letter
    const content = inline ? html.replace(/^\s*<p>([\s\S]*)<\/p>\s*$/i, '$1') : html;
    const markup = useMemo(() => ({ __html: content }), [content]);
    useEffect(() => { if (ref.current) renderMathIn(ref.current); }, [markup]);
    return <div ref={ref} className={cn('lesson-doc', inline && 'inline!', className)} dangerouslySetInnerHTML={markup} />;
}

export const RichHtml = memo(RichHtmlBase);
