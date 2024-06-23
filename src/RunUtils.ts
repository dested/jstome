import {getImagePath, Notebook} from '@/kernel.tsx';

export class RunUtils {
  static instance = new RunUtils();
  notebook: Notebook | undefined;
  setNotebook(notebook: Notebook | undefined) {
    this.notebook = notebook;
    return this;
  }
  private constructor() {
    return;
  }
  loadImage(url: string) {
    return new RunUtilsImage(this, url);
  }
  newVideo() {
    return new RunUtilsVideo(this);
  }
}
export class RunUtilsVideo {
  constructor(public runUtils: RunUtils) {}

  images: {url: string; durationMS: number}[] = [];
  addImage(url: string, durationMS: number) {
    this.images.push({url, durationMS});
    return this;
  }
  finish() {
    return this;
  }
  async process() {
    return createVideoFromImages(
      this.images.map((image) => ({url: getImagePath(image.url, this.runUtils.notebook), durationMS: image.durationMS}))
    );
  }
}
type RunUtilsImageEffect = {
  type: 'memeText';
  topText: string;
  bottomText: string;
};
export class RunUtilsImage {
  constructor(public runUtils: RunUtils, public url: string) {}
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

async function createVideoFromImages(frames: {url: string; durationMS: number}[]): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const stream = canvas.captureStream();
  const recorder = new MediaRecorder(stream, {mimeType: 'video/webm'});

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => chunks.push(e.data);

  recorder.start();

  for (const frame of frames) {
    const img = await loadImage(frame.url);
    canvas.width = img.width;
    canvas.height = img.height;
    ctx?.drawImage(img, 0, 0);
    await wait(frame.durationMS);
  }

  recorder.stop();

  return new Promise((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, {type: 'video/webm'});
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    };
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
