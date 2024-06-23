export class RunUtils {
  static instance = new RunUtils();
  private constructor() {
    return;
  }
  loadImage(url: string) {
    return new RunUtilsImage(url);
  }
}
type RunUtilsImageEffect = {
  type: 'memeText';
  topText: string;
  bottomText: string;
};
export class RunUtilsImage {
  constructor(public url: string) {}
  effects: RunUtilsImageEffect[] = [];
  addMemeText(topText: string, bottomText: string) {
    this.effects.push({
      type: 'memeText',
      topText: topText,
      bottomText: bottomText,
    });
  }
  finish() {
    return this;
  }

  async process() {
    const image = new Image();
    image.src = this.url;
    await new Promise((resolve) => {
      image.onload = resolve;
    });
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0);
    for (const effect of this.effects) {
      if (effect.type === 'memeText') {
        drawMemeText(ctx, effect.topText, 'top');
        drawMemeText(ctx, effect.bottomText, 'bottom');
      }
    }
    return canvas.toDataURL('image/jpeg');
  }
}

function drawMemeText(ctx: CanvasRenderingContext2D, text: string, position: 'top' | 'bottom') {
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  const padding = canvasWidth * 0.05; // 5% padding
  const maxWidth = canvasWidth - padding * 2;
  const maxHeight = canvasHeight * 0.4; // Max 25% of canvas height for text

  let fontSize = canvasWidth * 0.06; // Start with 6% of canvas width
  let lines: string[] = [];

  // Reduce font size until text fits within maxHeight
  do {
    ctx.font = `bold ${fontSize}px sans-serif`;
    lines = wrapText(ctx, text, maxWidth);
    const totalTextHeight = fontSize * 1.2 * lines.length;
    if (totalTextHeight <= maxHeight) break;
    fontSize *= 0.9; // Reduce font size by 10%
  } while (fontSize > 12); // Minimum font size

  const lineHeight = fontSize * 1.2;
  const totalTextHeight = lineHeight * lines.length;

  ctx.save();
  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = fontSize * 0.2; // Adjust stroke width based on font size
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  let y;
  if (position === 'top') {
    y = padding;
  } else {
    y = canvasHeight - padding - totalTextHeight;
  }

  lines.forEach((line, index) => {
    const lineY = y + lineHeight * index;
    ctx.strokeText(line, canvasWidth / 2, lineY);
    ctx.fillText(line, canvasWidth / 2, lineY);
  });

  ctx.restore();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

/*
function run(){
  for (let i = 0; i < processedImages.length; i++) {
    const processedImage = processedImages[i];
    const processedImageData =pImagesOutput[i];
    debugger;

  }

}
*/
