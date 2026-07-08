// Helper function to draw rounded rectangles on older browsers compatibly
export const drawRoundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
};

// Helper function to draw a beautiful open book icon
export const drawBookIcon = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, isHighlighted: boolean) => {
  const w = size * 2.2;
  const h = size * 1.5;
  const pad = Math.max(1.8, size * 0.12);
  
  if (isHighlighted) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
  }
  
  // 1. Draw Cover (outer outline)
  ctx.fillStyle = color;
  ctx.beginPath();
  drawRoundRect(ctx, x - w/2 - pad, y - h/2 - pad, w/2, h + pad*2, 2.5);
  drawRoundRect(ctx, x + pad, y - h/2 - pad, w/2, h + pad*2, 2.5);
  ctx.fill();
  
  ctx.shadowBlur = 0;
  
  // 2. Draw Paper Pages (base white/cream)
  ctx.fillStyle = '#fefefe';
  ctx.beginPath();
  drawRoundRect(ctx, x - w/2, y - h/2, w/2 - 0.5, h, 1.2);
  drawRoundRect(ctx, x + 0.5, y - h/2, w/2 - 0.5, h, 1.2);
  ctx.fill();

  // Apply subtle color-coded tint to pages (18% opacity of the book theme color)
  ctx.fillStyle = `${color}2e`; // 2e hex = 46 dec = ~18% opacity
  ctx.beginPath();
  drawRoundRect(ctx, x - w/2, y - h/2, w/2 - 0.5, h, 1.2);
  drawRoundRect(ctx, x + 0.5, y - h/2, w/2 - 0.5, h, 1.2);
  ctx.fill();
  
  // 3. Draw Page Lines (indicating text)
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  
  // Left page text lines
  ctx.moveTo(x - w/2 + 3, y - h/4); ctx.lineTo(x - 3, y - h/4);
  ctx.moveTo(x - w/2 + 3, y);       ctx.lineTo(x - 3, y);
  ctx.moveTo(x - w/2 + 3, y + h/4); ctx.lineTo(x - 3, y + h/4);
  
  // Right page text lines
  ctx.moveTo(x + 3, y - h/4);       ctx.lineTo(x + w/2 - 3, y - h/4);
  ctx.moveTo(x + 3, y);             ctx.lineTo(x + w/2 - 3, y);
  ctx.moveTo(x + 3, y + h/4);       ctx.lineTo(x + w/2 - 3, y + h/4);
  ctx.stroke();
  
  // 4. Draw Center Spine
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, y - h/2);
  ctx.lineTo(x, y + h/2);
  ctx.stroke();
 
  // 5. Draw Gold Ribbon Bookmark
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y - h/2 + 1);
  ctx.lineTo(x, y + h/2 + size * 0.45);
  ctx.stroke();
};
