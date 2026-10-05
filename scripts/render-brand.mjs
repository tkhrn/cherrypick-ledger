// designs/brand/*.svg 마크로 앱 아이콘·스플래시 PNG를 만든다. 마크를 고치면 `pnpm render:brand`.
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'apps/mobile/assets/images');
const CREAM = '#FBF3EC';
const SIZE = 1024;
// 마크 내용의 실제 범위 (100 박스 기준)
const MARK = { x: 4, y: 1, w: 94, h: 89 };

const inner = (file) => readFileSync(join(root, 'designs/brand', file), 'utf8').replace(/<!--[\s\S]*?-->/g, '').replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

/** 마크를 캔버스 가운데에 contentPx 크기로 놓는다 */
function compose(markFile, contentPx, background) {
  const scale = contentPx / Math.max(MARK.w, MARK.h);
  const tx = (SIZE - MARK.w * scale) / 2 - MARK.x * scale;
  const ty = (SIZE - MARK.h * scale) / 2 - MARK.y * scale;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">${
    background ? `<rect width="${SIZE}" height="${SIZE}" fill="${background}"/>` : ''
  }<g transform="translate(${tx} ${ty}) scale(${scale})">${inner(markFile)}</g></svg>`;
}

function render(name, svg) {
  writeFileSync(join(OUT, name), new Resvg(svg, { fitTo: { mode: 'width', value: SIZE } }).render().asPng());
  console.log('wrote', name);
}

// 적응형 아이콘은 108dp 중 지름 66dp 원이 안전 영역이다. 마크(거의 정사각)의 대각선이 그 원 안에 들어가도록 한다.
const SAFE_DIAMETER = SIZE * (66 / 108);
const ADAPTIVE_CONTENT = Math.round((SAFE_DIAMETER / Math.SQRT2) * 1.05);
render('android-icon-foreground.png', compose('cherry-mark.svg', ADAPTIVE_CONTENT));
render('android-icon-monochrome.png', compose('cherry-mark-mono.svg', ADAPTIVE_CONTENT));
render('android-icon-background.png', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}"><rect width="${SIZE}" height="${SIZE}" fill="${CREAM}"/></svg>`);
render('icon.png', compose('cherry-mark.svg', Math.round(SIZE * 0.7), CREAM));
render('splash-icon.png', compose('cherry-mark.svg', Math.round(SIZE * 0.9)));
