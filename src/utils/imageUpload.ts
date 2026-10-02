// Prepares a user-picked file for upload.
//
// Phone cameras produce 3-12MB photos (and iPhones HEIC), which used to be rejected by
// the size limits on the server ("fail to submit"). Images are therefore decoded in the
// browser, scaled down and re-encoded as JPEG (or PNG for signatures/logos that need
// transparency) so they always land well under the limit. Non-image files (PDF/Word)
// are passed through untouched but still size-checked.
//
// The limits below mirror backend/utils/uploadLimits.js - see UPLOAD_LIMITS.md.

export const UPLOAD_LIMITS_MB = {
    /** Passport / profile photos: students, staff, application "Image" fields. */
    photo: 5,
    /** Application documents (birth certificate, other certificates, PDFs, Word). */
    document: 5,
    /** Logo and signature images saved in school settings. */
    brandImage: 2,
} as const;

export interface PrepareImageOptions {
    /** Largest accepted size of the *final* file, in MB. */
    maxMB: number;
    /** Longest edge in px after scaling. */
    maxDimension?: number;
    /** Keep transparency (PNG) instead of flattening to JPEG. */
    keepTransparency?: boolean;
}

const mb = (n: number) => n * 1024 * 1024;

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close?: () => void }> {
    if (typeof createImageBitmap === 'function') {
        try {
            const bmp = await createImageBitmap(file);
            return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
        } catch { /* fall through to <img> */ }
    }
    const url = URL.createObjectURL(file);
    try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const el = new Image();
            el.onload = () => resolve(el);
            el.onerror = () => reject(new Error('decode failed'));
            el.src = url;
        });
        return { source: img, width: img.naturalWidth, height: img.naturalHeight };
    } finally {
        URL.revokeObjectURL(url);
    }
}

const toBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) =>
    new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, quality));

/**
 * Returns a File that is safe to upload, or throws an Error with a message that can be
 * shown to the user as-is.
 */
export async function prepareFileForUpload(file: File, { maxMB, maxDimension = 1280, keepTransparency = false }: PrepareImageOptions): Promise<File> {
    const limit = mb(maxMB);
    const isImage = file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name);

    if (!isImage) {
        if (file.size > limit) throw new Error(`"${file.name}" is too large. Maximum size is ${maxMB}MB.`);
        return file;
    }

    // Already small enough and a web-friendly format: keep the original bytes.
    const webFriendly = /^image\/(jpeg|png|webp)$/.test(file.type);
    if (webFriendly && file.size <= Math.min(limit, mb(1))) return file;

    try {
        const { source, width, height, close } = await decode(file);
        const scale = Math.min(1, maxDimension / Math.max(width, height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('no canvas');
        if (!keepTransparency) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
        ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
        close?.();

        const outType = keepTransparency ? 'image/png' : 'image/jpeg';
        const ext = keepTransparency ? 'png' : 'jpg';
        let blob: Blob | null = null;
        for (const q of keepTransparency ? [undefined] : [0.85, 0.72, 0.6, 0.45]) {
            blob = await toBlob(canvas, outType, q);
            if (blob && blob.size <= limit) break;
        }
        if (!blob || blob.size > limit) throw new Error(`"${file.name}" is too large even after resizing. Maximum size is ${maxMB}MB - please choose a smaller image.`);
        const base = file.name.replace(/\.[^.]+$/, '') || 'image';
        return new File([blob], `${base}.${ext}`, { type: outType, lastModified: Date.now() });
    } catch (err: any) {
        // Browser couldn't decode it (e.g. HEIC on Chrome). Fall back to the original if it fits.
        if (err?.message?.includes('too large')) throw err;
        if (file.size <= limit && webFriendly) return file;
        throw new Error(`Could not read "${file.name}". Please use a JPG or PNG image (max ${maxMB}MB).`);
    }
}

export function fileToDataUrl(file: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Could not read the file.'));
        reader.readAsDataURL(file);
    });
}
