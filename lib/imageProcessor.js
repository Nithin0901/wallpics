/**
 * lib/imageProcessor.js
 * Utility for dynamic image manipulation (watermarking, optimization).
 */
import sharp from 'sharp';

/**
 * Applies a text-based SVG watermark to an image buffer.
 * @param {Buffer} buffer - Original image buffer
 * @param {string} text - Watermark text (default: 'AUROVOID')
 * @returns {Promise<Buffer>} - Watermarked WebP buffer
 */
export async function applyWatermark(buffer, text = 'AUROVOID') {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (!metadata || !metadata.width || !metadata.height) {
      throw new Error("Invalid image format");
    }

    // Dynamic sizing: 4% of image width
    const fontSize = Math.max(16, Math.floor(metadata.width * 0.04)); 
    const padding = fontSize * 0.6;
    const rectHeight = fontSize + padding * 2;
    // Rough estimation of text width
    const textWidth = text.length * fontSize * 0.6;
    const rectWidth = textWidth + padding * 2;
    
    const svgBuffer = Buffer.from(`
      <svg width="${metadata.width}" height="${metadata.height}" xmlns="http://www.w3.org/2000/svg">
        <style>
          .bg { fill: rgba(0,0,0,0.6); }
          .txt { fill: rgba(255, 255, 255, 0.85); font-weight: 900; font-family: 'Inter', sans-serif, Arial; text-anchor: middle; }
        </style>
        <rect 
          x="${metadata.width - rectWidth - 40}" 
          y="${metadata.height - rectHeight - 40}" 
          width="${rectWidth}" 
          height="${rectHeight}" 
          class="bg" rx="12" 
        />
        <text 
          x="${metadata.width - (rectWidth / 2) - 40}" 
          y="${metadata.height - 40 - padding - (fontSize * 0.05)}" 
          font-size="${fontSize}" 
          class="txt">
          ${text}
        </text>
      </svg>
    `);

    return await image
      .composite([{ input: svgBuffer, top: 0, left: 0 }])
      .webp({ quality: 90 })
      .toBuffer();
  } catch (error) {
    console.error('Watermarking error:', error);
    return buffer; // Fallback to original if processing fails
  }
}
