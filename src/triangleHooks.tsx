/**
 * Exposes functions that are called by WebAssembly code to render the triangles
 */

const SVG: HTMLElement = document.getElementById('svg') as any;
let renderIx: number = 0;

export const render_triangle = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  color: string,
  border_color: string
) => {
  renderIx += 1;
  const poly = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'polygon'
  );
  poly.setAttribute('points', `${x1},${y1} ${x2},${y2} ${x3},${y3}`);
  poly.setAttribute(
    'style',
    `fill:${color};stroke:${border_color};stroke-width:1`
  );
  poly.setAttribute('id', `poly-${renderIx}`);
  SVG.appendChild(poly);
  return renderIx;
};

export const delete_elem = (id: number) =>
  document.getElementById(`poly-${id}`)!.remove();
