export function normalizeText(s?: string | null): string {
  return (s ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\u200e\u200f\u202A-\u202E]/g, '');
}

export function normalizeSize(raw?: string | null): string {
  if (!raw) return '';
  const cleaned = String(raw)
    .replace(/[×✕*X]/g, 'x')
    .replace(/[\s\u200e\u200f\u202A-\u202E]/g, '');
  const nums = cleaned.split(/[^\d.]+/).filter(Boolean);
  if (nums.length >= 2) {
    return nums
      .slice(0, 3)
      .map(Number)
      .sort((a, b) => a - b)
      .map(String)
      .join('x');
  }
  return cleaned.toLowerCase();
}

export function normalizeKey(productName: string, sizeLabel: string): string {
  return `${normalizeText(productName)}__${normalizeSize(sizeLabel)}`;
}

// Try to extract size from a variant JSON (string or object)
export function extractSizeFromVariant(variant: any): string {
  try {
    const meta = typeof variant === 'string' ? JSON.parse(variant) : variant;
    if (meta && typeof meta === 'object') {
      if (typeof (meta as any).size === 'string') {
        return normalizeSize((meta as any).size);
      }
      if ((meta as any).product_size) {
        const ps = (meta as any).product_size;
        return normalizeSize([ps.width, ps.height, ps.length].join('x'));
      }
      const w = (meta as any).width ?? (meta as any).w ?? (meta as any).Width;
      const h = (meta as any).height ?? (meta as any).h ?? (meta as any).Height;
      const l = (meta as any).length ?? (meta as any).depth ?? (meta as any).d ?? (meta as any).Length;
      if (w || h || l) {
        return normalizeSize([w, h, l].filter((x: any) => x != null).join('x'));
      }
      if (Array.isArray((meta as any).dimensions) && (meta as any).dimensions.length > 0) {
        const d0 = (meta as any).dimensions[0];
        const w0 = d0.width ?? d0.w;
        const h0 = d0.height ?? d0.h;
        const l0 = d0.length ?? d0.depth ?? d0.d;
        return normalizeSize([w0, h0, l0].filter((x: any) => x != null).join('x'));
      }
    }
  } catch {}
  return normalizeSize(String(variant || ''));
}
