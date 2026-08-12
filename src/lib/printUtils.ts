/**
 * Safely prints a specific DOM element using a hidden iframe.
 * This approach is extremely robust on mobile browsers (like Chrome for Android),
 * bypassing issues with `window.open` blocking and preventing the mobile print
 * spooler from crashing when the parent window or component unmounts early.
 *
 * @param elementId The ID of the DOM element to print.
 */
export const mobileSafePrint = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (!el) {
        console.error(`Element with id ${elementId} not found for printing.`);
        return;
    }

    // 1. Clone the element
    const clone = el.cloneNode(true) as HTMLElement;

    // 2. Recursively remove problematic inline styles (like `zoom`) that crash Android print spoolers
    const elementsWithZoom = clone.querySelectorAll('[style*="zoom"]');
    elementsWithZoom.forEach((node: any) => {
        node.style.zoom = '1';
        node.style.transform = 'none'; // Fallback removal just in case
    });
    // Also remove from the root clone if it has it
    if (clone.style.zoom) {
        clone.style.zoom = '1';
        clone.style.transform = 'none';
    }

    // 3. Gather all stylesheets from the parent document
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map(s => s.outerHTML)
        .join('');

    // 4. Create or reuse a hidden iframe
    let iframe = document.getElementById('mobile-safe-print-iframe') as HTMLIFrameElement;
    if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'mobile-safe-print-iframe';
        // Hide the iframe completely from the viewport
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document;
    if (doc) {
        doc.open();
        doc.write(`
            <html>
            <head>
                <title>Print Document</title>
                ${styles}
                <style>
                    /* Print-specific resets for mobile reliability */
                    body { 
                        margin: 0; 
                        background: white; 
                    }
                    @media print { 
                        @page { 
                            size: A4 portrait; 
                            margin: 10mm; 
                        } 
                        body { width: 100%; }
                        /* Strip rigid min-widths that cause mobile pagination to crash */
                        .min-w-\\[794px\\] { min-width: 0 !important; }
                        /* Ensure shadows and unnecessary UI elements are hidden */
                        .shadow-lg { box-shadow: none !important; }
                    }
                </style>
            </head>
            <body class="bg-white">
                ${clone.outerHTML}
            </body>
            </html>
        `);
        doc.close();

        // 5. Trigger print once the iframe has processed the DOM
        setTimeout(() => {
            if (iframe.contentWindow) {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
            }
        }, 800); // Give the browser engine a moment to parse the CSS
    }
};
