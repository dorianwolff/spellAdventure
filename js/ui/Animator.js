'use strict';
window.SA = window.SA || {};

// ─── SPRITE ANIMATOR ──────────────────────────────────────────────────────────
// Draws animated sprites from sprite sheets onto a <canvas> element.
// All sprites use 64×64px frame size, 4 directional rows.
// Scale factor enlarges for display.

SA.Animator = class Animator {
  constructor(canvas, scale = 3) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.scale   = scale;
    this.frameW  = 64;
    this.frameH  = 64;

    this.currentAnim = null;
    this.currentFrame = 0;
    this.intervalId  = null;
    this.onComplete  = null;

    // Preloaded image cache: { url: HTMLImageElement }
    this._imgCache = {};

    // Size the canvas
    this.canvas.width  = this.frameW  * this.scale;
    this.canvas.height = this.frameH  * this.scale;
    this.ctx.imageSmoothingEnabled = false;
  }

  _loadImage(url) {
    if (this._imgCache[url]) return Promise.resolve(this._imgCache[url]);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => { this._imgCache[url] = img; resolve(img); };
      img.onerror = () => { console.warn('Failed to load sprite:', url); reject(); };
      img.src = url;
    });
  }

  play(animDef, onComplete) {
    this._stop();
    this.onComplete = onComplete || null;
    this.currentFrame = 0;
    this.currentAnim = animDef;

    this._loadImage(animDef.sheet).then(img => {
      // If play was cancelled before load
      if (this.currentAnim !== animDef) return;

      const { cols, row, fps, loop } = animDef;
      const drawFrame = () => {
        if (this.currentAnim !== animDef) return;
        const col = this.currentFrame % cols;
        const sx  = col * this.frameW;
        const sy  = row * this.frameH;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(
          img,
          sx, sy, this.frameW, this.frameH,
          0, 0, this.frameW * this.scale, this.frameH * this.scale
        );

        this.currentFrame++;
        if (this.currentFrame >= cols) {
          if (loop) {
            this.currentFrame = 0;
          } else {
            this._stop();
            if (this.onComplete) this.onComplete();
            return;
          }
        }
      };

      drawFrame();
      this.intervalId = setInterval(drawFrame, 1000 / fps);
    }).catch(() => {
      // Draw placeholder on load error
      this._drawPlaceholder();
    });
  }

  _stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  _drawPlaceholder() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(100,80,160,0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#a78bfa';
    ctx.font = `${Math.floor(canvas.width * 0.4)}px serif`;
    ctx.textAlign = 'center';
    ctx.fillText('?', canvas.width / 2, canvas.height * 0.7);
  }

  destroy() {
    this._stop();
    this.currentAnim = null;
    this._imgCache = {};
  }
};

// ─── BOOK ANIMATOR ────────────────────────────────────────────────────────────
// Renders the spell book animation using a non-square grid of frames.

SA.BookAnimator = class BookAnimator {
  constructor(canvas, displaySize = 340) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.canvas.width  = displaySize;
    this.canvas.height = displaySize;
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this._imgCache = {};
    this.intervalId = null;
  }

  _loadImage(url) {
    if (this._imgCache[url]) return Promise.resolve(this._imgCache[url]);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload  = () => { this._imgCache[url] = img; resolve(img); };
      img.onerror = reject;
      img.src     = url;
    });
  }

  play(animKey, onComplete) {
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
    const def = SA.BOOK_ANIMS[animKey];
    if (!def) return;

    const totalFrames = def.cols * def.rows;
    let frame = 0;
    const fps  = 10;

    this._loadImage(def.sheet).then(img => {
      const draw = () => {
        const col = frame % def.cols;
        const row = Math.floor(frame / def.cols);
        const sx  = col * def.frameW;
        const sy  = row * def.frameH;

        const { ctx, canvas } = this;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, sx, sy, def.frameW, def.frameH, 0, 0, canvas.width, canvas.height);

        frame++;
        if (frame >= totalFrames) {
          clearInterval(this.intervalId);
          this.intervalId = null;
          if (onComplete) onComplete();
        }
      };

      draw();
      this.intervalId = setInterval(draw, 1000 / fps);
    });
  }

  showFrame(animKey, frameIndex) {
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
    const def = SA.BOOK_ANIMS[animKey];
    if (!def) return;
    this._loadImage(def.sheet).then(img => {
      const col = frameIndex % def.cols;
      const row = Math.floor(frameIndex / def.cols);
      const { ctx, canvas } = this;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, col * def.frameW, row * def.frameH, def.frameW, def.frameH, 0, 0, canvas.width, canvas.height);
    });
  }

  destroy() {
    if (this.intervalId) clearInterval(this.intervalId);
    this._imgCache = {};
  }
};
