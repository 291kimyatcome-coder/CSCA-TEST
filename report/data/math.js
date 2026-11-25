// Tiny MathML helpers for report data files.
// M(...) wraps one formula; inside it use n (number), v (variable), o (operator),
// sqrt(...) for a square root and root(x, k) for a k-th root.
const n = (x) => `<mn>${x}</mn>`;
const v = (x) => `<mi>${x}</mi>`;
const o = (x) => `<mo>${x === '-' ? '−' : x}</mo>`;
const sqrt = (...xs) => `<msqrt>${xs.join('')}</msqrt>`;
const root = (x, k) => `<mroot><mrow>${x}</mrow><mn>${k}</mn></mroot>`;
const sup = (x, e) => `<msup><mrow>${x}</mrow><mn>${e}</mn></msup>`;
const M = (...xs) => `<math>${xs.join('')}</math>`;
module.exports = { n, v, o, sqrt, root, sup, M };
