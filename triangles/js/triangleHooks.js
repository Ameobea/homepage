const svg = document.getElementById('svg');
let renderIx = 0;

export const render_triangle = (x1, y1, x2, y2, x3, y3, color, borderColor) => {
  renderIx += 1;
  const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  poly.setAttribute('points', `${x1},${y1} ${x2},${y2} ${x3},${y3}`);
  poly.setAttribute('style', `fill:${color};stroke:${borderColor};stroke-width:1`);
  poly.setAttribute('id', `poly-${renderIx}`);
  svg.appendChild(poly);
  return renderIx;
};

export const delete_elem = (id) => document.getElementById(`poly-${id}`)?.remove();
