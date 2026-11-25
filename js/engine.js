/*
 * CSCA Mathematics practice engine
 * --------------------------------
 * Generates English-language multiple-choice questions that follow the
 * CSCA Mathematics Examination Syllabus (2025 edition):
 *   60 minutes · 100 points · 48 single-answer multiple-choice questions
 *   Modules: Sets & Inequalities · Functions · Geometry & Algebra ·
 *            Probability & Statistics
 *
 * Every answer is computed by the generator itself, so the answer key always
 * matches the question. Papers are seeded, so "Paper 7" is identical on every
 * device and every visit.
 *
 * Works in the browser (window.CSCA) and in Node (module.exports).
 */
(function (root) {
  'use strict';
  const T = String.raw;
  const BS = '\\';

  /* ------------------------------------------------------------------ */
  /* Random numbers                                                      */
  /* ------------------------------------------------------------------ */
  function hashSeed(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  }

  function makeRng(seed) {
    let a = (typeof seed === 'string' ? hashSeed(seed) : seed) >>> 0;
    const next = () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const r = {
      next,
      int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
      pick: (arr) => arr[Math.floor(next() * arr.length)],
      sign: () => (next() < 0.5 ? -1 : 1),
      chance: (p) => next() < p,
      shuffle: (arr) => {
        const b = arr.slice();
        for (let i = b.length - 1; i > 0; i--) {
          const j = Math.floor(next() * (i + 1));
          [b[i], b[j]] = [b[j], b[i]];
        }
        return b;
      },
      nz: (lo, hi) => {
        let v;
        do v = r.int(lo, hi); while (v === 0);
        return v;
      },
      distinct: (n, lo, hi) => r.shuffle(range(lo, hi)).slice(0, n),
    };
    return r;
  }

  /* ------------------------------------------------------------------ */
  /* Arithmetic and LaTeX helpers                                        */
  /* ------------------------------------------------------------------ */
  function range(lo, hi) {
    const a = [];
    for (let i = lo; i <= hi; i++) a.push(i);
    return a;
  }
  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) [a, b] = [b, a % b];
    return a;
  }
  function C(n, k) {
    if (k < 0 || k > n) return 0;
    let v = 1;
    for (let i = 1; i <= k; i++) v = (v * (n - k + i)) / i;
    return Math.round(v);
  }
  function fr(n, d) {
    if (d === undefined) d = 1;
    if (d === 0) throw new Error('division by zero');
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d) || 1;
    return [n / g, d / g];
  }
  /** fraction n/d as LaTeX */
  function F(n, d) {
    const [a, b] = fr(n, d === undefined ? 1 : d);
    if (b === 1) return String(a);
    return (a < 0 ? '-' : '') + T`\frac{${Math.abs(a)}}{${b}}`;
  }
  /** "\frac{n}{d}=reduced" (or just one fraction when already reduced) */
  function eqf(n, d) {
    const raw = T`\frac{${n}}{${d}}`;
    const red = F(n, d);
    return raw === red ? raw : raw + '=' + red;
  }
  /** neighbouring fractions, used as fallback distractors */
  function fnb(n, d) {
    const [a, b] = fr(n, d === undefined ? 1 : d);
    const out = [F(a + b, b), F(a - b, b), F(-a, b), F(2 * a, b), F(a + 2 * b, b)];
    if (a !== 0) out.splice(2, 0, F(b, a));
    return out;
  }
  function nb(v) {
    return [v + 1, v - 1, -v, 2 * v, v + 2, v - 2, v + 3].map(String);
  }
  function sqrtParts(n) {
    let a = 1, b = n;
    for (let k = 2; k * k <= b; k++) {
      while (b % (k * k) === 0) { b /= k * k; a *= k; }
    }
    return [a, b];
  }
  /** p·√q / r, simplified, as LaTeX */
  function R(p, q, r) {
    if (r === undefined) r = 1;
    if (q === 0 || p === 0) return '0';
    const [a, b] = sqrtParts(q);
    let num = p * a, den = r;
    const g = gcd(num, den) || 1;
    num /= g; den /= g;
    const neg = (num < 0) !== (den < 0);
    num = Math.abs(num); den = Math.abs(den);
    let core;
    if (b === 1) core = String(num);
    else core = (num === 1 ? '' : num) + T`\sqrt{${b}}`;
    const s = neg ? '-' : '';
    return den === 1 ? s + core : s + T`\frac{${core}}{${den}}`;
  }
  /** (n/d)·π as LaTeX */
  function P(n, d) {
    if (d === undefined) d = 1;
    const [a, b] = fr(n, d);
    if (a === 0) return '0';
    const s = a < 0 ? '-' : '';
    const num = (Math.abs(a) === 1 ? '' : Math.abs(a)) + T`\pi`;
    return b === 1 ? s + num : s + T`\frac{${num}}{${b}}`;
  }
  /** linear combination: [[coef, symbol], ...]; symbol '' = constant */
  function lc(terms) {
    let out = '';
    for (const [c, s] of terms) {
      if (c === 0) continue;
      const neg = c < 0, a = Math.abs(c);
      const body = s === '' ? String(a) : a === 1 ? s : a + s;
      if (out === '') out = (neg ? '-' : '') + body;
      else out += (neg ? '-' : '+') + body;
    }
    return out || '0';
  }
  /** like lc but with fractional coefficients: [[num, den, symbol], ...] */
  function lcf(terms) {
    let out = '';
    for (const [n, d, s] of terms) {
      const [a, b] = fr(n, d);
      if (a === 0) continue;
      const A = Math.abs(a);
      const coef = b === 1 ? (A === 1 && s ? '' : String(A)) : T`\frac{${A}}{${b}}`;
      out += (out === '' ? (a < 0 ? '-' : '') : a < 0 ? '-' : '+') + coef + s;
    }
    return out || '0';
  }
  /** "+3" / "-3" / "" for appending a constant */
  function k(c) {
    if (c === 0) return '';
    return c > 0 ? '+' + c : String(c);
  }
  /** x - h  (h may be negative) */
  function lin(v, h) {
    return lc([[1, v], [-h, '']]);
  }
  function sq(v, h) {
    return h === 0 ? v + '^2' : '(' + lin(v, h) + ')^2';
  }
  function iv(lo, hi, lcl, rcl) {
    const L = lo === null ? T`(-\infty` : (lcl ? '[' : '(') + lo;
    const Rr = hi === null ? T`+\infty)` : hi + (rcl ? ']' : ')');
    return L + ',' + Rr;
  }
  function setTex(arr) {
    if (!arr.length) return T`\varnothing`;
    return T`\{` + arr.slice().sort((a, b) => a - b).join(',') + T`\}`;
  }
  function lineTex(a, b, c) {
    let g = gcd(gcd(a, b), c) || 1;
    a /= g; b /= g; c /= g;
    if (a < 0 || (a === 0 && b < 0)) { a = -a; b = -b; c = -c; }
    return lc([[a, 'x'], [b, 'y'], [c, '']]) + '=0';
  }
  function lineY(mn, md, cn, cd) {
    // y = (mn/md) x + (cn/cd)
    const m = F(mn, md);
    let s;
    if (m === '0') s = '';
    else if (m === '1') s = 'x';
    else if (m === '-1') s = '-x';
    else s = m + 'x';
    const c = F(cn, cd);
    if (c === '0') return 'y=' + (s || '0');
    if (!s) return 'y=' + c;
    return 'y=' + s + (c.startsWith('-') ? c : '+' + c);
  }
  function cTex(re, im) {
    return lc([[re, ''], [im, 'i']]);
  }
  function dec(n, scale) {
    // n/scale as a terminating decimal string
    const neg = n < 0;
    n = Math.abs(n);
    const digits = String(scale).length - 1;
    let s = (n / scale).toFixed(digits);
    if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return (neg && s !== '0' ? '-' : '') + s;
  }
  function coefX(n, d, v) {
    // coefficient (n/d) in front of variable v, e.g. 2x, \frac{1}{2}x
    const f = F(n, d);
    if (f === '1') return v;
    if (f === '-1') return '-' + v;
    return f + v;
  }

  /* Worked solutions for the printed answer book (bilingual/Solutions-*.pdf).
     key: the idea or formula used. steps: S2 = one step in English and Khmer
     (math is shared), DM = a displayed formula. */
  const S2 = (en, km) => ({ en, km });
  const DM = (m) => ({ m });
  const pr = (x) => (String(x).startsWith('-') ? `(${x})` : String(x));
  const lst = (arr) => arr.slice().sort((a, b) => a - b).join(',\\ ');
  /** (x-p)(x-q) written nicely: x(x-q) when a root is 0 */
  const fac2 = (p, q) => (p === 0 ? `x(${lin('x', q)})` : q === 0 ? `x(${lin('x', p)})` : `(${lin('x', p)})(${lin('x', q)})`);
  /** "lhs ⇒ rhs", or just lhs when they are the same */
  const imp = (lhs, rhs) => (lhs === rhs ? lhs : lhs + T`\Rightarrow ` + rhs);

  /* ------------------------------------------------------------------ */
  /* Syllabus structure                                                  */
  /* ------------------------------------------------------------------ */
  const MODULES = [
    { id: 1, en: 'Sets and Inequalities', km: 'សំណុំ និង វិសមភាព' },
    { id: 2, en: 'Functions', km: 'អនុគមន៍' },
    { id: 3, en: 'Geometry and Algebra', km: 'ធរណីមាត្រ និង ពីជគណិត' },
    { id: 4, en: 'Probability and Statistics', km: 'ប្រូបាប និង ស្ថិតិ' },
  ];

  // lesson id -> module, and how many questions each 48-question paper takes
  const LESSON_META = [
    { id: 'sets', module: 1, perPaper: 4 },
    { id: 'ineq', module: 1, perPaper: 5 },
    { id: 'func', module: 2, perPaper: 4 },
    { id: 'expolog', module: 2, perPaper: 3 },
    { id: 'trig', module: 2, perPaper: 4 },
    { id: 'seq', module: 2, perPaper: 3 },
    { id: 'deriv', module: 2, perPaper: 3 },
    { id: 'lines', module: 3, perPaper: 3 },
    { id: 'conics', module: 3, perPaper: 3 },
    { id: 'vectors', module: 3, perPaper: 2 },
    { id: 'complex', module: 3, perPaper: 2 },
    { id: 'solid', module: 3, perPaper: 3 },
    { id: 'prob', module: 4, perPaper: 4 },
    { id: 'stats', module: 4, perPaper: 3 },
    { id: 'normal', module: 4, perPaper: 2 },
  ];
  const LESSON_MODULE = {};
  LESSON_META.forEach((l) => (LESSON_MODULE[l.id] = l.module));

  const TPL = [];
  // opts.examOnly: used only by the printable exam sheets (keeps the 40 online papers unchanged)
  function def(id, lesson, gen, opts) {
    TPL.push({ id, lesson, gen, examOnly: !!(opts && opts.examOnly) });
  }

  const COND = [
    'Sufficient but not necessary',
    'Necessary but not sufficient',
    'Necessary and sufficient',
    'Neither sufficient nor necessary',
  ];
  const QUAD = ['First quadrant', 'Second quadrant', 'Third quadrant', 'Fourth quadrant'];

  /* ================================================================== */
  /* MODULE 1 · SETS                                                     */
  /* ================================================================== */
  def('set-ops', 'sets', (r) => {
    const pool = r.shuffle(range(1, 12));
    const kk = r.int(1, 3);
    const na = r.int(kk + 1, kk + 3), nbb = r.int(kk + 1, kk + 3);
    const common = pool.slice(0, kk);
    const aOnly = pool.slice(kk, na);
    const bOnly = pool.slice(na, na + nbb - kk);
    const A = common.concat(aOnly), B = common.concat(bOnly);
    const res = {
      cap: setTex(common),
      cup: setTex(A.concat(bOnly)),
      ab: setTex(aOnly),
      ba: setTex(bOnly),
    };
    const op = r.pick(['cap', 'cup']);
    const sym = op === 'cap' ? T`A\cap B` : T`A\cup B`;
    return {
      q: T`Let \(A=${setTex(A)}\) and \(B=${setTex(B)}\). Then \(${sym}=\)`,
      correct: res[op],
      wrong: [res[op === 'cap' ? 'cup' : 'cap'], res.ab, res.ba, setTex(A), setTex(B)],
      sol:
        op === 'cap'
          ? T`\(A\cap B\) contains the elements that belong to both sets: \(${res.cap}\).`
          : T`\(A\cup B\) contains every element of \(A\) or \(B\) (each listed once): \(${res.cup}\).`,
      key: op === 'cap'
        ? S2(T`\(A\cap B\) (intersection) is the set of elements that are in \(A\) and also in \(B\).`, T`\(A\cap B\) (ប្រសព្វ) ជាសំណុំនៃធាតុដែលស្ថិតនៅក្នុង \(A\) ផង និងក្នុង \(B\) ផង។`)
        : S2(T`\(A\cup B\) (union) is the set of elements that are in \(A\) or in \(B\), each written once.`, T`\(A\cup B\) (ប្រជុំ) ជាសំណុំនៃធាតុដែលស្ថិតនៅក្នុង \(A\) ឬក្នុង \(B\) (ធាតុនីមួយៗសរសេរតែម្តង)។`),
      steps: op === 'cap'
        ? [
            S2(T`Compare \(A=${setTex(A)}\) and \(B=${setTex(B)}\) element by element.`, T`ប្រៀបធៀបធាតុនៃ \(A=${setTex(A)}\) និង \(B=${setTex(B)}\) ម្តងមួយៗ។`),
            S2(T`The elements found in both sets are \(${lst(common)}\).`, T`ធាតុដែលមាននៅក្នុងសំណុំទាំងពីរគឺ \(${lst(common)}\)។`),
            DM(T`A\cap B=${res.cap}`),
          ]
        : [
            S2(T`Write all the elements of \(A=${setTex(A)}\).`, T`សរសេរធាតុទាំងអស់នៃ \(A=${setTex(A)}\)។`),
            S2(T`Add the elements of \(B=${setTex(B)}\) that are not listed yet: \(${lst(bOnly)}\).`, T`បន្ថែមធាតុនៃ \(B=${setTex(B)}\) ដែលមិនទាន់មាន៖ \(${lst(bOnly)}\)។`),
            DM(T`A\cup B=${res.cup}`),
          ],
    };
  });

  def('set-complement', 'sets', (r) => {
    const n = r.int(6, 9);
    const U = range(1, n);
    const A = r.distinct(r.int(2, 4), 1, n);
    const B = r.distinct(r.int(2, 4), 1, n);
    const cA = U.filter((x) => !A.includes(x));
    const cB = U.filter((x) => !B.includes(x));
    const ans = cA.filter((x) => B.includes(x));
    const cUnion = U.filter((x) => !A.includes(x) && !B.includes(x));
    const AB = A.filter((x) => B.includes(x));
    return {
      q: T`Let the universal set be \(U=${setTex(U)}\), \(A=${setTex(A)}\) and \(B=${setTex(B)}\). Then \((\complement_U A)\cap B=\)`,
      correct: setTex(ans),
      wrong: [setTex(cUnion), setTex(AB), setTex(cA), setTex(cB.filter((x) => A.includes(x))), setTex(B)],
      sol: T`\(\complement_U A=${setTex(cA)}\). Intersecting with \(B\) gives \(${setTex(ans)}\).`,
      key: S2(T`\(\complement_U A\) (complement) is the set of elements of \(U\) that are not in \(A\).`, T`\(\complement_U A\) (សំណុំបំពេញ) ជាសំណុំនៃធាតុរបស់ \(U\) ដែលមិនស្ថិតនៅក្នុង \(A\)។`),
      steps: [
        S2(T`Remove the elements of \(A=${setTex(A)}\) from \(U=${setTex(U)}\):`, T`ដកធាតុនៃ \(A=${setTex(A)}\) ចេញពី \(U=${setTex(U)}\)៖`),
        DM(T`\complement_U A=${setTex(cA)}`),
        S2(T`Keep only the elements of \(\complement_U A\) that are also in \(B=${setTex(B)}\):`, T`រក្សាទុកតែធាតុនៃ \(\complement_U A\) ដែលមាននៅក្នុង \(B=${setTex(B)}\) ដែរ៖`),
        DM(T`(\complement_U A)\cap B=${setTex(ans)}`),
      ],
    };
  });

  def('subset-count', 'sets', (r) => {
    const a = r.int(-3, 2);
    const closed = r.chance(0.5);
    const n = r.int(3, 5);
    const b = closed ? a + n - 1 : a + n;
    const elems = range(a, a + n - 1);
    const kind = r.pick(['all', 'proper', 'np']);
    const val = { all: 2 ** n, proper: 2 ** n - 1, np: 2 ** n - 2 };
    const word = {
      all: 'subsets',
      proper: 'proper subsets',
      np: 'non-empty proper subsets',
    }[kind];
    return {
      q: T`Let \(A=\{x\in\mathbb{Z}\mid ${a}\le x${closed ? T`\le` : '<'}${b}\}\). The number of ${word} of \(A\) is`,
      correct: String(val[kind]),
      wrong: [String(val.all), String(val.proper), String(val.np), String(2 ** (n + 1)), String(n * n), String(2 ** (n - 1))],
      sol: T`\(A=${setTex(elems)}\) has \(n=${n}\) elements. A set with \(n\) elements has \(2^n\) subsets, \(2^n-1\) proper subsets and \(2^n-2\) non-empty proper subsets, so the answer is \(${val[kind]}\).`,
      key: S2(T`A set with \(n\) elements has \(2^n\) subsets, \(2^n-1\) proper subsets and \(2^n-2\) non-empty proper subsets.`, T`សំណុំដែលមាន \(n\) ធាតុ មានសំណុំរង \(2^n\), សំណុំរងផ្ទាល់ \(2^n-1\) និងសំណុំរងផ្ទាល់មិនទទេ \(2^n-2\)។`),
      steps: [
        S2(T`List the integers with \(${a}\le x${closed ? T`\le` : '<'}${b}\):`, T`សរសេរចំនួនគត់ដែល \(${a}\le x${closed ? T`\le` : '<'}${b}\)៖`),
        DM(T`A=${setTex(elems)}\quad\Rightarrow\quad n=${n}`),
        S2(T`Number of ${word}:`, T`ចំនួន${{ all: 'សំណុំរង', proper: 'សំណុំរងផ្ទាល់', np: 'សំណុំរងផ្ទាល់មិនទទេ' }[kind]}៖`),
        DM({ all: T`2^{${n}}=${val.all}`, proper: T`2^{${n}}-1=${2 ** n}-1=${val.proper}`, np: T`2^{${n}}-2=${2 ** n}-2=${val.np}` }[kind]),
      ],
    };
  });

  def('set-param', 'sets', (r) => {
    const p = r.int(-3, 2), q = p + r.int(2, 5);
    const v = r.int(1, 3);
    const A = T`A=\{x\mid ${p}\le x\le ${q}\}`;
    if (v === 1) {
      return {
        q: T`Let \(${A}\) and \(B=\{x\mid x<a\}\). If \(A\subseteq B\), the range of \(a\) is`,
        correct: iv(q, null, false),
        wrong: [iv(q, null, true), iv(p, null, false), iv(null, q, false, false), iv(p, null, true)],
        sol: T`Every element of \(A\) must be less than \(a\); the largest element is \(${q}\), so \(a>${q}\).`,
      };
    }
    if (v === 2) {
      return {
        q: T`Let \(${A}\) and \(B=\{x\mid x>a\}\). If \(A\subseteq B\), the range of \(a\) is`,
        correct: iv(null, p, false, false),
        wrong: [iv(null, p, false, true), iv(null, q, false, false), iv(p, null, false), iv(q, null, false)],
        sol: T`Every element of \(A\) must exceed \(a\); the smallest element is \(${p}\), so \(a<${p}\).`,
      };
    }
    return {
      q: T`Let \(${A}\) and \(B=\{x\mid x>a\}\). If \(A\cap B=\varnothing\), the range of \(a\) is`,
      correct: iv(q, null, true),
      wrong: [iv(q, null, false), iv(p, null, true), iv(null, q, false, true), iv(null, p, false, false)],
      sol: T`\(A\cap B=\varnothing\) means no \(x\le ${q}\) satisfies \(x>a\), i.e. \(a\ge ${q}\).`,
    };
  });

  def('logic-cond', 'sets', (r) => {
    const v = r.int(1, 6);
    let Ptex, Qtex, ans, why;
    if (v === 1) {
      let a = r.int(-3, 5), b = r.int(-3, 5);
      while (b === a) b = r.int(-3, 5);
      Ptex = T`x>${a}`; Qtex = T`x>${b}`;
      if (a > b) { ans = 0; why = T`\(x>${a}\Rightarrow x>${b}\), but not conversely.`; }
      else { ans = 1; why = T`\(x>${b}\Rightarrow x>${a}\), but \(x>${a}\) does not force \(x>${b}\).`; }
    } else if (v === 2) {
      const s = r.int(1, 5);
      if (r.chance(0.5)) {
        Ptex = T`x=${s}`; Qtex = T`x^2=${s * s}`; ans = 0;
        why = T`\(x=${s}\Rightarrow x^2=${s * s}\), but \(x^2=${s * s}\) also allows \(x=-${s}\).`;
      } else {
        Ptex = T`x^2=${s * s}`; Qtex = T`x=${s}`; ans = 1;
        why = T`\(x=${s}\Rightarrow x^2=${s * s}\), but \(x^2=${s * s}\) also allows \(x=-${s}\).`;
      }
    } else if (v === 3) {
      const s = r.int(1, 6);
      Ptex = T`0<x<${s}`; Qtex = T`|x|<${s}`; ans = 0;
      why = T`\(0<x<${s}\) implies \(-${s}<x<${s}\), but e.g. \(x=-${s === 1 ? T`\frac{1}{2}` : 1}\) satisfies \(|x|<${s}\) only.`;
    } else if (v === 4) {
      const p = r.int(-3, 3), q = p + r.int(1, 4);
      Ptex = lc([[1, 'x^2'], [-(p + q), 'x'], [p * q, '']]) + '<0'; Qtex = T`x>${p}`; ans = 0;
      why = T`The inequality means \(${p}<x<${q}\), which implies \(x>${p}\); the converse fails.`;
    } else if (v === 5) {
      const s = r.int(1, 5);
      if (r.chance(0.5)) { Ptex = T`2^x>${2 ** s}`; Qtex = T`x>${s}`; why = T`\(2^x\) is increasing, so \(2^x>2^{${s}}\iff x>${s}\).`; }
      else { Ptex = T`x^3>${s ** 3}`; Qtex = T`x>${s}`; why = T`\(x^3\) is increasing, so \(x^3>${s}^3\iff x>${s}\).`; }
      ans = 2;
    } else {
      const a = r.int(-3, 3), b = a + r.int(1, 4);
      Ptex = T`x>${a}`; Qtex = T`x<${b}`; ans = 3;
      why = T`Neither implies the other: \(x=${b + 1}\) satisfies the first only, \(x=${a - 1}\) the second only.`;
    }
    return {
      q: T`For real \(x\), the statement "\(${Ptex}\)" is a ______ condition for "\(${Qtex}\)".`,
      math: false,
      correct: COND[ans],
      wrong: COND.filter((_, i) => i !== ans),
      sol: why,
    };
  });

  def('negation', 'sets', (r) => {
    const f = lc([[1, 'x^2'], [r.nz(-4, 4), 'x'], [r.int(-5, 5), '']]);
    const rels = ['>', T`\ge`, '<', T`\le`];
    const neg = { '>': T`\le`, [T`\ge`]: '<', '<': T`\ge`, [T`\le`]: '>' };
    const rel = r.pick(rels);
    const forall = r.chance(0.5);
    const Q1 = forall ? T`\forall x\in\mathbb{R}` : T`\exists x\in\mathbb{R}`;
    const Q2 = forall ? T`\exists x\in\mathbb{R}` : T`\forall x\in\mathbb{R}`;
    const st = (Q, rl) => T`${Q},\ ${f}${rl}0`;
    const others = rels.filter((x) => x !== neg[rel] && x !== rel);
    return {
      q: T`The negation of the proposition "\(${st(Q1, rel)}\)" is`,
      correct: st(Q2, neg[rel]),
      wrong: [st(Q2, rel), st(Q1, neg[rel]), st(Q2, others[0]), st(Q1, others[1]), st(Q2, others[1])],
      sol: T`Negating swaps the quantifier (\(\forall\leftrightarrow\exists\)) and negates the inequality (\(${rel}\) becomes \(${neg[rel]}\)).`,
    };
  });

  /* ================================================================== */
  /* MODULE 1 · INEQUALITIES                                             */
  /* ================================================================== */
  function quadSolutions(p, q) {
    return {
      '<': iv(p, q, false, false),
      [T`\le`]: iv(p, q, true, true),
      '>': iv(null, p, false, false) + T`\cup` + iv(q, null, false),
      [T`\ge`]: iv(null, p, false, true) + T`\cup` + iv(q, null, true),
    };
  }

  def('quad-ineq', 'ineq', (r) => {
    const [p, q] = r.distinct(2, -6, 7).sort((a, b) => a - b);
    const rels = ['<', T`\le`, '>', T`\ge`];
    const flip = { '<': '>', '>': '<', [T`\le`]: T`\ge`, [T`\ge`]: T`\le` };
    let rel = r.pick(rels);
    const neg = r.chance(0.3);
    const sgn = neg ? -1 : 1;
    const poly = lc([[sgn, 'x^2'], [-sgn * (p + q), 'x'], [sgn * p * q, '']]);
    const actual = neg ? flip[rel] : rel;
    const S = quadSolutions(p, q);
    return {
      q: T`The solution set of \(${poly}${rel}0\) is`,
      correct: S[actual],
      wrong: rels.filter((x) => x !== actual).map((x) => S[x]).concat([iv(-q, -p, false, false)]),
      sol:
        (neg ? T`Multiply by \(-1\) (reversing the sign): \(${lc([[1, 'x^2'], [-(p + q), 'x'], [p * q, '']])}${actual}0\). ` : '') +
        T`Factor: \((${lin('x', p)})(${lin('x', q)})${actual}0\), roots \(${p}\) and \(${q}\). ` +
        (actual === '<' || actual === T`\le` ? 'The product is negative between the roots.' : 'The product is positive outside the roots.') +
        T` Answer: \(${S[actual]}\).`,
      key: S2(T`If \(p<q\), then \((x-p)(x-q)<0\) between the roots (\(p<x<q\)) and \((x-p)(x-q)>0\) outside the roots.`, T`បើ \(p<q\) នោះ \((x-p)(x-q)<0\) នៅចន្លោះឫស (\(p<x<q\)) ហើយ \((x-p)(x-q)>0\) នៅក្រៅឫស។`),
      steps: [
        ...(neg
          ? [
              S2(T`The coefficient of \(x^2\) is negative. Multiply both sides by \(-1\) and reverse the inequality sign:`, T`មេគុណនៃ \(x^2\) អវិជ្ជមាន។ គុណអង្គទាំងពីរនឹង \(-1\) ហើយប្តូរទិសសញ្ញាវិសមភាព៖`),
              DM(T`${lc([[1, 'x^2'], [-(p + q), 'x'], [p * q, '']])}${actual}0`),
            ]
          : []),
        S2(T`Factor the left side. The roots are \(x=${p}\) and \(x=${q}\):`, T`ដាក់អង្គខាងឆ្វេងជាផលគុណកត្តា។ ឫសគឺ \(x=${p}\) និង \(x=${q}\)៖`),
        DM(T`${fac2(p, q)}${actual}0`),
        (actual === '<' || actual === T`\le`)
          ? S2(T`The product must be negative${actual === '<' ? '' : ' or zero'}, so \(x\) lies between the roots${actual === '<' ? '' : ' (roots included)'}.`, T`ផលគុណត្រូវតែអវិជ្ជមាន${actual === '<' ? '' : ' ឬស្មើសូន្យ'} ដូច្នេះ \(x\) ស្ថិតនៅចន្លោះឫសទាំងពីរ${actual === '<' ? '' : ' (រាប់បញ្ចូលឫស)'}។`)
          : S2(T`The product must be positive${actual === '>' ? '' : ' or zero'}, so \(x\) lies outside the roots${actual === '>' ? '' : ' (roots included)'}.`, T`ផលគុណត្រូវតែវិជ្ជមាន${actual === '>' ? '' : ' ឬស្មើសូន្យ'} ដូច្នេះ \(x\) ស្ថិតនៅក្រៅឫសទាំងពីរ${actual === '>' ? '' : ' (រាប់បញ្ចូលឫស)'}។`),
        DM(T`x\in${S[actual]}`),
      ],
    };
  });

  def('rational-ineq', 'ineq', (r) => {
    const [p, q] = r.distinct(2, -5, 6);
    const rel = r.pick(['<', T`\le`, '>', T`\ge`]);
    const strict = rel === '<' || rel === '>';
    const lo = Math.min(p, q), hi = Math.max(p, q);
    const inc = (x) => !strict && x === p;
    const between = rel === '<' || rel === T`\le`;
    const btw = (a, b) => iv(lo, hi, a, b);
    const out = (a, b) => iv(null, lo, false, a) + T`\cup` + iv(hi, null, b);
    const correct = between ? btw(inc(lo), inc(hi)) : out(inc(lo), inc(hi));
    const all = [btw(false, false), btw(true, false), btw(false, true), btw(true, true), out(false, false), out(true, false), out(false, true), out(true, true)];
    return {
      q: T`The solution set of \(\dfrac{${lin('x', p)}}{${lin('x', q)}}${rel}0\) is`,
      correct,
      wrong: r.shuffle(all.filter((x) => x !== correct)),
      sol: T`Critical points: \(x=${p}\) (numerator, ${strict ? 'excluded' : 'included'}) and \(x=${q}\) (denominator, always excluded). The quotient is ${between ? 'negative between' : 'positive outside'} them, so the solution set is \(${correct}\).`,
      key: S2(T`\(\dfrac{${lin('x', p)}}{${lin('x', q)}}\) has the same sign as \((${lin('x', p)})(${lin('x', q)})\), but the denominator can never be \(0\).`, T`\(\dfrac{${lin('x', p)}}{${lin('x', q)}}\) មានសញ្ញាដូច \((${lin('x', p)})(${lin('x', q)})\) ប៉ុន្តែភាគបែងមិនអាចស្មើ \(0\) បានទេ។`),
      steps: [
        S2(T`Critical points: the numerator is \(0\) at \(x=${p}\); the denominator is \(0\) at \(x=${q}\).`, T`ចំណុចសំខាន់៖ ភាគយកស្មើ \(0\) ត្រង់ \(x=${p}\); ភាគបែងស្មើ \(0\) ត្រង់ \(x=${q}\)។`),
        S2(T`The quotient is negative between \(${lo}\) and \(${hi}\), and positive outside them.`, T`ផលចែកអវិជ្ជមាននៅចន្លោះ \(${lo}\) និង \(${hi}\) ហើយវិជ្ជមាននៅក្រៅចន្លោះនោះ។`),
        S2(T`We need ${between ? 'negative' : 'positive'} values${strict ? '' : ' or zero'}: ${between ? 'between' : 'outside'} the critical points. \(x=${p}\) is ${strict ? 'excluded' : 'included (the fraction equals 0)'}; \(x=${q}\) is always excluded (division by zero).`, T`យើងត្រូវការតម្លៃ${between ? 'អវិជ្ជមាន' : 'វិជ្ជមាន'}${strict ? '' : ' ឬស្មើសូន្យ'}៖ ${between ? 'នៅចន្លោះ' : 'នៅក្រៅ'}ចំណុចសំខាន់។ \(x=${p}\) ${strict ? 'មិនរាប់បញ្ចូល' : 'រាប់បញ្ចូល (ប្រភាគស្មើ 0)'}; \(x=${q}\) មិនរាប់បញ្ចូលជានិច្ច (មិនអាចចែកនឹងសូន្យ)។`),
        DM(T`x\in${correct}`),
      ],
    };
  });

  def('abs-ineq', 'ineq', (r) => {
    const kk = r.pick([1, 1, 2, 3]);
    const c = r.int(-6, 6), b = r.int(1, 7);
    const rel = r.pick(['<', T`\le`, '>', T`\ge`]);
    const strict = rel === '<' || rel === '>';
    const lo = F(c - b, kk), hi = F(c + b, kk);
    const inside = rel === '<' || rel === T`\le`;
    const inner = iv(lo, hi, !strict, !strict);
    const outer = iv(null, lo, false, !strict) + T`\cup` + iv(hi, null, !strict);
    const lo2 = F(-c - b, kk), hi2 = F(-c + b, kk);
    const wInner = iv(lo2, hi2, !strict, !strict);
    const wOuter = iv(null, lo2, false, !strict) + T`\cup` + iv(hi2, null, !strict);
    const expr = lc([[kk, 'x'], [-c, '']]);
    return {
      q: T`The solution set of \(|${expr}|${rel}${b}\) is`,
      correct: inside ? inner : outer,
      wrong: inside ? [outer, wInner, iv(lo, hi, strict, strict), wOuter] : [inner, wOuter, wInner, iv(null, lo, false, strict) + T`\cup` + iv(hi, null, strict)],
      sol: inside
        ? T`\(|${expr}|${rel}${b}\iff -${b}${rel}${expr}${rel}${b}\), so \(${lo}${rel}x${rel}${hi}\).`
        : T`\(|${expr}|${rel}${b}\iff ${expr}${rel === '>' ? '<' : T`\le`}-${b}\) or \(${expr}${rel}${b}\), so \(x${rel === '>' ? '<' : T`\le`}${lo}\) or \(x${rel}${hi}\).`,
      key: S2(T`For \(b>0\): \(|u|<b\iff -b<u<b\), and \(|u|>b\iff u<-b\) or \(u>b\) (the same with \(\le,\ \ge\)).`, T`ចំពោះ \(b>0\)៖ \(|u|<b\iff -b<u<b\) ហើយ \(|u|>b\iff u<-b\) ឬ \(u>b\) (ដូចគ្នាចំពោះ \(\le,\ \ge\))។`),
      steps: (() => {
        const kx = kk === 1 ? 'x' : kk + 'x';
        if (inside) {
          const out = [S2('Remove the absolute value (double inequality):', 'ដកសញ្ញាតម្លៃដាច់ខាតចេញ (វិសមភាពទ្វេ)៖'), DM(T`-${b}${rel}${expr}${rel}${b}`)];
          if (c !== 0) out.push(c > 0 ? S2(T`Add \(${c}\) to every part:`, T`បូក \(${c}\) គ្រប់អង្គ៖`) : S2(T`Subtract \(${-c}\) from every part:`, T`ដក \(${-c}\) ពីគ្រប់អង្គ៖`), DM(T`${c - b}${rel}${kx}${rel}${c + b}`));
          if (kk > 1) out.push(S2(T`Divide every part by \(${kk}>0\) (the signs stay the same):`, T`ចែកគ្រប់អង្គនឹង \(${kk}>0\) (សញ្ញានៅដដែល)៖`), DM(T`${lo}${rel}x${rel}${hi}`));
          out.push(DM(T`x\in${inner}`));
          return out;
        }
        const rel2 = rel === '>' ? '<' : T`\le`;
        return [
          S2('Split into two cases:', 'បំបែកជាពីរករណី៖'),
          S2(T`Case 1: \(${expr}${rel2}-${b}\Rightarrow ${kx}${rel2}${c - b}\Rightarrow x${rel2}${lo}\).`, T`ករណីទី ១៖ \(${expr}${rel2}-${b}\Rightarrow ${kx}${rel2}${c - b}\Rightarrow x${rel2}${lo}\)។`),
          S2(T`Case 2: \(${expr}${rel}${b}\Rightarrow ${kx}${rel}${c + b}\Rightarrow x${rel}${hi}\).`, T`ករណីទី ២៖ \(${expr}${rel}${b}\Rightarrow ${kx}${rel}${c + b}\Rightarrow x${rel}${hi}\)។`),
          S2('Combine the two cases (union):', 'ផ្គុំករណីទាំងពីរ (ប្រជុំ)៖'),
          DM(T`x\in${outer}`),
        ];
      })(),
    };
  });

  def('amgm-min', 'ineq', (r) => {
    if (r.chance(0.5)) {
      const a = r.int(1, 4), t = r.int(1, 4);
      const b = a * t * t;
      const m = 2 * a * t;
      return {
        q: T`For \(x>0\), the minimum value of \(y=${a === 1 ? '' : a}x+\dfrac{${b}}{x}\) is`,
        correct: String(m),
        wrong: [String(a * t), String(a + b), String(4 * a * t), String(m + 1), String(m * m)],
        sol: T`By AM–GM, \(${a === 1 ? '' : a}x+\frac{${b}}{x}\ge 2\sqrt{${a}x\cdot\frac{${b}}{x}}=2\sqrt{${a * b}}=${m}\), with equality at \(x=${t}\).`,
      };
    }
    const c = r.int(1, 4), mm = r.int(1, 4);
    const kk = mm * mm;
    const ans = 2 * mm + c;
    return {
      q: T`For \(x>${c}\), the minimum value of \(y=x+\dfrac{${kk}}{x-${c}}\) is`,
      correct: String(ans),
      wrong: [String(2 * mm), String(2 * mm - c), String(mm + c), String(2 * mm + 2 * c), String(ans + 1)],
      sol: T`Write \(y=(x-${c})+\frac{${kk}}{x-${c}}+${c}\ge 2\sqrt{${kk}}+${c}=${ans}\), with equality when \(x-${c}=${mm}\).`,
    };
  });

  def('ineq-roots-param', 'ineq', (r) => {
    const [p, q] = r.distinct(2, -5, 6).sort((a, b) => a - b);
    const a = -(p + q), b = p * q;
    const ask = r.pick(['sum', 'diff', 'prod']);
    const val = { sum: a + b, diff: a - b, prod: a * b }[ask];
    const expr = { sum: 'a+b', diff: 'a-b', prod: 'ab' }[ask];
    const alt = { sum: (x, y) => x + y, diff: (x, y) => x - y, prod: (x, y) => x * y }[ask];
    return {
      q: T`The solution set of \(x^2+ax+b<0\) is \(${iv(p, q, false, false)}\). Then \(${expr}=\)`,
      correct: String(val),
      wrong: [String(alt(-a, b)), String(alt(a, -b)), String(alt(-a, -b))].concat(nb(val)),
      sol: T`\(${p}\) and \(${q}\) are the roots of \(x^2+ax+b=0\), so \(a=-(${p}+${q})=${a}\) and \(b=${p}\cdot${q}=${b}\). Hence \(${expr}=${val}\).`,
    };
  });

  def('ineq-compare', 'ineq', (r) => {
    const TRUE = [T`ac<bc`, T`\dfrac{a}{c}<\dfrac{b}{c}`, T`a^2>b^2`, T`\dfrac{1}{a}<\dfrac{1}{b}`, T`a-c>b-c`, T`ac^2>bc^2`, T`a+c>b+c`, T`\sqrt{a}>\sqrt{b}`];
    const FALSE = [T`ac>bc`, T`\dfrac{a}{c}>\dfrac{b}{c}`, T`\dfrac{1}{a}>\dfrac{1}{b}`, T`a^2<b^2`, T`a-c<b-c`, T`ac^2<bc^2`, T`a+c<b+c`];
    const askTrue = r.chance(0.6);
    const correct = askTrue ? r.pick(TRUE) : r.pick(FALSE);
    const wrong = r.shuffle(askTrue ? FALSE : TRUE);
    return {
      q: T`Given \(a>b>0\) and \(c<0\), which of the following is ${askTrue ? 'necessarily true' : 'false'}?`,
      correct,
      wrong,
      sol: T`Multiplying or dividing by the negative number \(c\) reverses an inequality; adding or subtracting \(c\) or multiplying by \(c^2>0\) keeps it. For \(a>b>0\): \(a^2>b^2\), \(\sqrt a>\sqrt b\) and \(\frac1a<\frac1b\).`,
      key: S2('Multiplying or dividing both sides by a negative number reverses the inequality sign; adding or subtracting any number keeps it.', 'គុណ ឬចែកអង្គទាំងពីរនឹងចំនួនអវិជ្ជមាន ត្រូវប្តូរទិសសញ្ញាវិសមភាព; បូក ឬដកចំនួនណាមួយ សញ្ញានៅដដែល។'),
      steps: [
        S2(T`Since \(c<0\), multiplying or dividing \(a>b\) by \(c\) reverses the sign:`, T`ដោយ \(c<0\) ការគុណ ឬចែក \(a>b\) នឹង \(c\) ត្រូវប្តូរទិសសញ្ញា៖`),
        DM(T`ac<bc,\qquad \frac{a}{c}<\frac{b}{c}`),
        S2(T`Adding or subtracting \(c\) keeps the sign, and \(c^2>0\) keeps it too:`, T`ការបូក ឬដក \(c\) សញ្ញានៅដដែល ហើយ \(c^2>0\) ក៏សញ្ញានៅដដែលដែរ៖`),
        DM(T`a+c>b+c,\qquad a-c>b-c,\qquad ac^2>bc^2`),
        S2(T`Since \(a>b>0\) (both positive):`, T`ដោយ \(a>b>0\) (ទាំងពីរវិជ្ជមាន)៖`),
        DM(T`a^2>b^2,\qquad \sqrt a>\sqrt b,\qquad \frac1a<\frac1b`),
        askTrue
          ? S2(T`So the statement that is necessarily true is \(${correct}\).`, T`ដូច្នេះ សំណើដែលពិតជានិច្ចគឺ \(${correct}\)។`)
          : S2(T`\(${correct}\) contradicts these results, so it is the false statement.`, T`\(${correct}\) ផ្ទុយនឹងលទ្ធផលខាងលើ ដូច្នេះវាជាសំណើមិនពិត។`),
      ],
    };
  });

  def('quad-always', 'ineq', (r) => {
    const m = r.int(1, 5);
    return {
      q: T`If \(x^2+ax+${m * m}>0\) holds for all real \(x\), the range of \(a\) is`,
      correct: iv(-2 * m, 2 * m, false, false),
      wrong: [iv(-2 * m, 2 * m, true, true), iv(-m, m, false, false), iv(null, -2 * m, false, false) + T`\cup` + iv(2 * m, null, false), iv(0, 2 * m, false, false)],
      sol: T`The parabola opens upward, so it stays above the \(x\)-axis iff \(\Delta=a^2-4\cdot${m * m}<0\), i.e. \(-${2 * m}<a<${2 * m}\).`,
    };
  });

  /* ================================================================== */
  /* MODULE 2 · FUNCTION CONCEPTS                                        */
  /* ================================================================== */
  def('domain', 'func', (r) => {
    const v = r.int(1, 3);
    if (v === 1) {
      const a = r.int(-4, 3), b = a + r.int(1, 4);
      return {
        q: T`The domain of \(f(x)=\sqrt{${lin('x', a)}}+\dfrac{1}{${lin('x', b)}}\) is`,
        correct: iv(a, b, true, false) + T`\cup` + iv(b, null, false),
        wrong: [iv(a, null, true), iv(a, b, false, false) + T`\cup` + iv(b, null, false), iv(b, null, false), iv(a, b, true, false)],
        sol: T`Need \(${lin('x', a)}\ge0\) and \(${lin('x', b)}\ne0\): \(x\ge${a}\), \(x\ne${b}\).`,
        key: S2(T`\(\sqrt{u}\) needs \(u\ge0\); a fraction needs its denominator \(\ne0\).`, T`\(\sqrt{u}\) ទាមទារ \(u\ge0\); ប្រភាគទាមទារភាគបែង \(\ne0\)។`),
        steps: [
          S2(T`Square root: \(${imp(T`${lin('x', a)}\ge0`, T`x\ge${a}`)}\).`, T`ឫសការេ៖ \(${imp(T`${lin('x', a)}\ge0`, T`x\ge${a}`)}\)។`),
          S2(T`Fraction: \(${imp(T`${lin('x', b)}\ne0`, T`x\ne${b}`)}\).`, T`ប្រភាគ៖ \(${imp(T`${lin('x', b)}\ne0`, T`x\ne${b}`)}\)។`),
          S2(T`Both conditions together: \(x\ge${a}\) with \(x=${b}\) removed.`, T`ផ្គុំលក្ខខណ្ឌទាំងពីរ៖ \(x\ge${a}\) ដោយដក \(x=${b}\) ចេញ។`),
          DM(T`D=${iv(a, b, true, false) + T`\cup` + iv(b, null, false)}`),
        ],
      };
    }
    if (v === 2) {
      const a = r.int(-4, 3), b = a + r.int(1, 5);
      return {
        q: T`The domain of \(f(x)=\ln(${lin('x', a)})+\sqrt{${lc([[b, ''], [-1, 'x']])}}\) is`,
        correct: iv(a, b, false, true),
        wrong: [iv(a, b, true, true), iv(a, b, false, false), iv(a, b, true, false), iv(a, null, false)],
        sol: T`Need \(${lin('x', a)}>0\) (logarithm) and \(${lc([[b, ''], [-1, 'x']])}\ge0\) (square root): \(${a}<x\le${b}\).`,
        key: S2(T`\(\ln u\) needs \(u>0\); \(\sqrt{u}\) needs \(u\ge0\).`, T`\(\ln u\) ទាមទារ \(u>0\); \(\sqrt{u}\) ទាមទារ \(u\ge0\)។`),
        steps: [
          S2(T`Logarithm: \(${imp(T`${lin('x', a)}>0`, T`x>${a}`)}\).`, T`លោការីត៖ \(${imp(T`${lin('x', a)}>0`, T`x>${a}`)}\)។`),
          S2(T`Square root: \(${lc([[b, ''], [-1, 'x']])}\ge0\Rightarrow x\le${b}\).`, T`ឫសការេ៖ \(${lc([[b, ''], [-1, 'x']])}\ge0\Rightarrow x\le${b}\)។`),
          S2('Both conditions together:', 'ផ្គុំលក្ខខណ្ឌទាំងពីរ៖'),
          DM(T`${a}<x\le${b}\quad\Rightarrow\quad D=${iv(a, b, false, true)}`),
        ],
      };
    }
    const [p, q] = r.distinct(2, -4, 5).sort((x, y) => x - y);
    const poly = lc([[-1, 'x^2'], [p + q, 'x'], [-p * q, '']]);
    return {
      q: T`The domain of \(f(x)=\dfrac{1}{\sqrt{${poly}}}\) is`,
      correct: iv(p, q, false, false),
      wrong: [iv(p, q, true, true), iv(null, p, false, false) + T`\cup` + iv(q, null, false), iv(p, q, true, false), iv(-q, -p, false, false)],
      sol: T`Need \(${poly}>0\iff (${lin('x', p)})(${lin('x', q)})<0\iff ${p}<x<${q}\).`,
      key: S2(T`\(\dfrac{1}{\sqrt{u}}\) needs \(u>0\): the root must exist and must not be \(0\).`, T`\(\dfrac{1}{\sqrt{u}}\) ទាមទារ \(u>0\)៖ ឫសត្រូវមានន័យ ហើយមិនត្រូវស្មើ \(0\)។`),
      steps: [
        S2('The expression under the root must be strictly positive:', 'កន្សោមក្រោមឫសត្រូវតែវិជ្ជមានដាច់ខាត៖'),
        DM(T`${poly}>0`),
        S2(T`Multiply by \(-1\) (reverse the sign) and factor:`, T`គុណនឹង \(-1\) (ប្តូរទិសសញ្ញា) រួចដាក់ជាផលគុណកត្តា៖`),
        DM(T`${lc([[1, 'x^2'], [-(p + q), 'x'], [p * q, '']])}<0\iff ${fac2(p, q)}<0`),
        S2(T`The product is negative between the roots \(${p}\) and \(${q}\):`, T`ផលគុណអវិជ្ជមាននៅចន្លោះឫស \(${p}\) និង \(${q}\)៖`),
        DM(T`${p}<x<${q}\quad\Rightarrow\quad D=${iv(p, q, false, false)}`),
      ],
    };
  });

  def('piecewise', 'func', (r) => {
    if (r.chance(0.55)) {
      const a = r.int(1, 4), b = r.int(1, 3), c = r.int(1, 6), kk = r.int(-3, -1);
      const f1 = kk * kk + a;
      const ans = b * f1 - c;
      return {
        q: T`Let \(f(x)=\begin{cases}x^2+${a}, & x\le 0\\ ${coefX(b, 1, 'x')}-${c}, & x>0\end{cases}\). Then \(f(f(${kk}))=\)`,
        correct: String(ans),
        wrong: [String(f1), String(f1 * f1 + a), String(b * kk - c), String(b * (b * kk - c) - c)].concat(nb(ans)),
        sol: T`\(f(${kk})=(${kk})^2+${a}=${f1}\). Since \(${f1}>0\), \(f(${f1})=${b === 1 ? '' : b + T`\cdot`}${f1}-${c}=${ans}\).`,
      };
    }
    const m = r.int(1, 4), base = r.pick([2, 3]);
    return {
      q: T`Let \(f(x)=\begin{cases}\log_2 x, & x>0\\ ${base}^x, & x\le 0\end{cases}\). Then \(f\!\left(f\!\left(\frac{1}{${2 ** m}}\right)\right)=\)`,
      correct: F(1, base ** m),
      wrong: [String(-m), F(1, 2 ** m), String(base ** m), F(-1, base ** m), F(1, base ** (m + 1))],
      sol: T`\(f\!\left(\frac{1}{${2 ** m}}\right)=\log_2 2^{-${m}}=-${m}\le0\), so \(f(-${m})=${base}^{-${m}}=\frac{1}{${base ** m}}\).`,
    };
  });

  def('parity', 'func', (r) => {
    const ODD = [T`y=x^3`, T`y=x^3-x`, T`y=\sin x`, T`y=x+\frac{1}{x}`, T`y=\frac{1}{x}`, T`y=x|x|`, T`y=\tan x`, T`y=2^x-2^{-x}`, T`y=x^5+x`];
    const EVEN = [T`y=x^2+1`, T`y=|x|`, T`y=\cos x`, T`y=x^4-x^2`, T`y=2^x+2^{-x}`, T`y=\ln|x|`, T`y=x\sin x`, T`y=x^2\cos x`];
    const NEITHER = [T`y=x+1`, T`y=2^x`, T`y=\ln x`, T`y=x^2+x`, T`y=x^3+1`, T`y=\sqrt{x}`, T`y=e^x`, T`y=x^2-2x`];
    const ODD_INC = [T`y=x^3`, T`y=x^3+x`, T`y=2^x-2^{-x}`, T`y=x|x|`, T`y=x^5+x`];
    const ODD_NOT_INC = [T`y=\frac{1}{x}`, T`y=\sin x`, T`y=\tan x`, T`y=x^3-x`, T`y=x+\frac{1}{x}`, T`y=-x`];
    const CHK = {
      [T`y=x^3`]: T`f(-x)=(-x)^3=-x^3=-f(x)`,
      [T`y=x^3-x`]: T`f(-x)=(-x)^3-(-x)=-x^3+x=-(x^3-x)=-f(x)`,
      [T`y=\sin x`]: T`f(-x)=\sin(-x)=-\sin x=-f(x)`,
      [T`y=x+\frac{1}{x}`]: T`f(-x)=-x+\frac{1}{-x}=-\left(x+\frac{1}{x}\right)=-f(x)`,
      [T`y=\frac{1}{x}`]: T`f(-x)=\frac{1}{-x}=-\frac{1}{x}=-f(x)`,
      [T`y=x|x|`]: T`f(-x)=(-x)|-x|=-x|x|=-f(x)`,
      [T`y=\tan x`]: T`f(-x)=\tan(-x)=-\tan x=-f(x)`,
      [T`y=2^x-2^{-x}`]: T`f(-x)=2^{-x}-2^{x}=-(2^x-2^{-x})=-f(x)`,
      [T`y=x^5+x`]: T`f(-x)=(-x)^5+(-x)=-(x^5+x)=-f(x)`,
      [T`y=x^3+x`]: T`f(-x)=(-x)^3+(-x)=-(x^3+x)=-f(x)`,
      [T`y=x^2+1`]: T`f(-x)=(-x)^2+1=x^2+1=f(x)`,
      [T`y=|x|`]: T`f(-x)=|-x|=|x|=f(x)`,
      [T`y=\cos x`]: T`f(-x)=\cos(-x)=\cos x=f(x)`,
      [T`y=x^4-x^2`]: T`f(-x)=(-x)^4-(-x)^2=x^4-x^2=f(x)`,
      [T`y=2^x+2^{-x}`]: T`f(-x)=2^{-x}+2^{x}=f(x)`,
      [T`y=\ln|x|`]: T`f(-x)=\ln|-x|=\ln|x|=f(x)`,
      [T`y=x\sin x`]: T`f(-x)=(-x)\sin(-x)=(-x)(-\sin x)=x\sin x=f(x)`,
      [T`y=x^2\cos x`]: T`f(-x)=(-x)^2\cos(-x)=x^2\cos x=f(x)`,
    };
    const INC = {
      [T`y=x^3`]: [T`\(f'(x)=3x^2\ge0\) (zero only at \(x=0\)), so it is increasing on \(\mathbb R\).`, T`\(f'(x)=3x^2\ge0\) (ស្មើសូន្យតែត្រង់ \(x=0\)) ដូច្នេះវាកើនលើ \(\mathbb R\)។`],
      [T`y=x^3+x`]: [T`\(f'(x)=3x^2+1>0\), so it is increasing on \(\mathbb R\).`, T`\(f'(x)=3x^2+1>0\) ដូច្នេះវាកើនលើ \(\mathbb R\)។`],
      [T`y=2^x-2^{-x}`]: [T`\(2^x\) is increasing and \(-2^{-x}\) is increasing, so their sum is increasing on \(\mathbb R\).`, T`\(2^x\) កើន ហើយ \(-2^{-x}\) ក៏កើន ដូច្នេះផលបូករបស់វាកើនលើ \(\mathbb R\)។`],
      [T`y=x|x|`]: [T`\(f(x)=x^2\) for \(x\ge0\) and \(f(x)=-x^2\) for \(x<0\); both pieces are increasing, so \(f\) is increasing on \(\mathbb R\).`, T`\(f(x)=x^2\) ចំពោះ \(x\ge0\) និង \(f(x)=-x^2\) ចំពោះ \(x<0\); ផ្នែកទាំងពីរកើន ដូច្នេះ \(f\) កើនលើ \(\mathbb R\)។`],
      [T`y=x^5+x`]: [T`\(f'(x)=5x^4+1>0\), so it is increasing on \(\mathbb R\).`, T`\(f'(x)=5x^4+1>0\) ដូច្នេះវាកើនលើ \(\mathbb R\)។`],
    };
    const v = r.pick(['odd', 'even', 'oddinc']);
    if (v === 'odd') {
      const cf = r.pick(ODD);
      return {
        q: T`Which of the following functions is an odd function?`,
        correct: cf,
        wrong: r.shuffle(EVEN.concat(NEITHER)),
        sol: T`A function is odd if \(f(-x)=-f(x)\) for every \(x\) in a domain symmetric about \(0\). Check each option: only the correct one satisfies this; the others are even or neither.`,
        key: S2(T`Odd function: the domain is symmetric about \(0\) and \(f(-x)=-f(x)\); its graph is symmetric about the origin.`, T`អនុគមន៍សេស៖ ដែនកំណត់ឆ្លុះធៀប \(0\) ហើយ \(f(-x)=-f(x)\); ក្រាបរបស់វាឆ្លុះធៀបគល់តម្រុយ។`),
        steps: [
          S2(T`Replace \(x\) by \(-x\) in the correct option \(${cf}\):`, T`ជំនួស \(x\) ដោយ \(-x\) ក្នុងជម្រើសត្រឹមត្រូវ \(${cf}\)៖`),
          DM(CHK[cf]),
          S2(T`So \(${cf}\) is odd. Every other option is even (\(f(-x)=f(x)\)) or neither (for example \(y=x+1\): \(f(-x)=-x+1\), which is neither \(f(x)\) nor \(-f(x)\)).`, T`ដូច្នេះ \(${cf}\) ជាអនុគមន៍សេស។ ជម្រើសផ្សេងទៀតជាអនុគមន៍គូ (\(f(-x)=f(x)\)) ឬមិនគូមិនសេស (ឧ. \(y=x+1\)៖ \(f(-x)=-x+1\) មិនស្មើ \(f(x)\) ហើយក៏មិនស្មើ \(-f(x)\))។`),
        ],
      };
    }
    if (v === 'even') {
      const cf = r.pick(EVEN);
      return {
        q: T`Which of the following functions is an even function?`,
        correct: cf,
        wrong: r.shuffle(ODD.concat(NEITHER)),
        sol: T`A function is even if \(f(-x)=f(x)\) for every \(x\) in a domain symmetric about \(0\). The correct option satisfies this; the others are odd or neither.`,
        key: S2(T`Even function: the domain is symmetric about \(0\) and \(f(-x)=f(x)\); its graph is symmetric about the \(y\)-axis.`, T`អនុគមន៍គូ៖ ដែនកំណត់ឆ្លុះធៀប \(0\) ហើយ \(f(-x)=f(x)\); ក្រាបរបស់វាឆ្លុះធៀបអ័ក្ស \(y\)។`),
        steps: [
          S2(T`Replace \(x\) by \(-x\) in the correct option \(${cf}\):`, T`ជំនួស \(x\) ដោយ \(-x\) ក្នុងជម្រើសត្រឹមត្រូវ \(${cf}\)៖`),
          DM(CHK[cf]),
          S2(T`So \(${cf}\) is even. Every other option is odd (\(f(-x)=-f(x)\)) or neither (for example \(y=x^2+x\): \(f(-x)=x^2-x\), which is neither \(f(x)\) nor \(-f(x)\)).`, T`ដូច្នេះ \(${cf}\) ជាអនុគមន៍គូ។ ជម្រើសផ្សេងទៀតជាអនុគមន៍សេស (\(f(-x)=-f(x)\)) ឬមិនគូមិនសេស (ឧ. \(y=x^2+x\)៖ \(f(-x)=x^2-x\) មិនស្មើ \(f(x)\) ហើយក៏មិនស្មើ \(-f(x)\))។`),
        ],
      };
    }
    const cf = r.pick(ODD_INC);
    return {
      q: T`Which of the following functions is both odd and increasing on its whole domain \(\mathbb{R}\)?`,
      correct: cf,
      wrong: r.shuffle(ODD_NOT_INC.concat([T`y=2^x`, T`y=x^2`, T`y=e^x`])),
      sol: T`Odd: \(f(-x)=-f(x)\). Increasing on \(\mathbb R\): check the derivative or the shape. \(\frac1x,\tan x,\sin x\) are not increasing on all of \(\mathbb R\); \(2^x, e^x\) are not odd; \(x^2\) is even.`,
      key: S2(T`Check two things: odd (\(f(-x)=-f(x)\)) and increasing on all of \(\mathbb R\) (for example \(f'(x)\ge0\)).`, T`ពិនិត្យពីរចំណុច៖ សេស (\(f(-x)=-f(x)\)) និងកើនលើ \(\mathbb R\) ទាំងមូល (ឧ. \(f'(x)\ge0\))។`),
      steps: [
        S2(T`Odd: for \(${cf}\),`, T`ភាពសេស៖ ចំពោះ \(${cf}\)`),
        DM(CHK[cf]),
        S2(T`Increasing: ${INC[cf][0]}`, T`ភាពកើន៖ ${INC[cf][1]}`),
        S2(T`The others fail: \(\frac1x,\ \tan x,\ \sin x,\ x^3-x,\ x+\frac1x\) are odd but not increasing on the whole domain, \(y=-x\) is decreasing, \(2^x\) and \(e^x\) are not odd, \(x^2\) is even.`, T`ជម្រើសផ្សេងទៀតមិនត្រឹមត្រូវ៖ \(\frac1x,\ \tan x,\ \sin x,\ x^3-x,\ x+\frac1x\) ជាអនុគមន៍សេស ប៉ុន្តែមិនកើនលើដែនកំណត់ទាំងមូល; \(y=-x\) ចុះ; \(2^x\) និង \(e^x\) មិនសេស; \(x^2\) ជាអនុគមន៍គូ។`),
      ],
    };
  });

  def('quad-monotone', 'func', (r) => {
    const h = r.nz(-4, 4), c = r.int(-5, 5);
    const up = r.chance(0.6);
    const f = up ? lc([[1, 'x^2'], [-2 * h, 'x'], [c, '']]) : lc([[-1, 'x^2'], [2 * h, 'x'], [c, '']]);
    const askDec = r.chance(0.5);
    const decI = up ? iv(null, h, false, true) : iv(h, null, true);
    const incI = up ? iv(h, null, true) : iv(null, h, false, true);
    const correct = askDec ? decI : incI;
    return {
      q: T`The ${askDec ? 'decreasing' : 'increasing'} interval of \(f(x)=${f}\) is`,
      correct,
      wrong: [askDec ? incI : decI, iv(null, -h, false, true), iv(-h, null, true), iv(null, 2 * h, false, true)],
      sol: T`The axis of symmetry is \(x=${h}\) and the parabola opens ${up ? 'upward' : 'downward'}, so \(f\) ${up ? 'decreases then increases' : 'increases then decreases'}. Answer: \(${correct}\).`,
    };
  });

  def('quad-range', 'func', (r) => {
    const h = r.int(-2, 3), c = r.int(-4, 6);
    const p = h - r.int(1, 3), q = h + r.int(1, 3);
    if (h - p === q - h) throw new Error('symmetric');
    const f = (x) => x * x - 2 * h * x + c;
    const mn = f(h), fp = f(p), fq = f(q);
    const mx = Math.max(fp, fq), other = Math.min(fp, fq);
    return {
      q: T`The range of \(f(x)=${lc([[1, 'x^2'], [-2 * h, 'x'], [c, '']])}\) on \([${p},${q}]\) is`,
      correct: `[${mn},${mx}]`,
      wrong: [`[${other},${mx}]`, `[${mn},${other}]`, iv(mn, null, true), `[${c},${mx}]`, `[${fp},${fq}]`],
      sol: T`Vertex at \(x=${h}\in[${p},${q}]\), so the minimum is \(f(${h})=${mn}\). Endpoints: \(f(${p})=${fp}\), \(f(${q})=${fq}\); the maximum is \(${mx}\).`,
      key: S2(T`For a parabola opening upward on \([p,q]\) with the vertex inside: the minimum is at the vertex, the maximum at an endpoint.`, T`ចំពោះប៉ារ៉ាបូលបើកឡើងលើ លើ \([p,q]\) ដែលកំពូលនៅខាងក្នុង៖ អប្បបរមានៅត្រង់កំពូល អតិបរមានៅត្រង់ចុងណាមួយ។`),
      steps: [
        S2('Complete the square to find the vertex:', 'បំពេញការេ ដើម្បីរកកំពូល៖'),
        DM(T`f(x)=${lc([[1, 'x^2'], [-2 * h, 'x'], [c, '']])}=${sq('x', h)}${k(mn)}`),
        S2(T`The parabola opens upward and its vertex \(x=${h}\) lies in \([${p},${q}]\), so the minimum is \(f(${h})=${mn}\).`, T`ប៉ារ៉ាបូលបើកឡើងលើ ហើយកំពូល \(x=${h}\) ស្ថិតក្នុង \([${p},${q}]\) ដូច្នេះអប្បបរមាគឺ \(f(${h})=${mn}\)។`),
        S2('Compare the values at the endpoints:', 'ប្រៀបធៀបតម្លៃត្រង់ចុងទាំងពីរ៖'),
        DM(T`f(${p})=${fp},\qquad f(${q})=${fq}\quad\Rightarrow\quad \max=${mx}`),
        DM(T`f(x)\in[${mn},${mx}]`),
      ],
    };
  });

  def('quad-param-mono', 'func', (r) => {
    const kk = r.int(-3, 4), c = r.int(-3, 5);
    if (r.chance(0.5)) {
      const dec = r.chance(0.5);
      return {
        q: dec
          ? T`If \(f(x)=x^2-2ax${k(c)}\) is decreasing on \((-\infty,${kk}]\), the range of \(a\) is`
          : T`If \(f(x)=x^2-2ax${k(c)}\) is increasing on \([${kk},+\infty)\), the range of \(a\) is`,
        correct: dec ? iv(kk, null, true) : iv(null, kk, false, true),
        wrong: dec ? [iv(null, kk, false, true), iv(-kk, null, true), iv(kk, null, false), iv(null, -kk, false, true)] : [iv(kk, null, true), iv(null, -kk, false, true), iv(null, kk, false, false), iv(-kk, null, true)],
        sol: dec
          ? T`The axis is \(x=a\); \(f\) decreases on \((-\infty,a]\). We need \((-\infty,${kk}]\subseteq(-\infty,a]\), so \(a\ge${kk}\).`
          : T`The axis is \(x=a\); \(f\) increases on \([a,+\infty)\). We need \([${kk},+\infty)\subseteq[a,+\infty)\), so \(a\le${kk}\).`,
      };
    }
    const m = r.nz(-3, 3);
    const lim = m - kk;
    return {
      q: T`If \(f(x)=x^2+2(a${k(-m)})x${k(c)}\) is decreasing on \((-\infty,${kk}]\), the range of \(a\) is`,
      correct: iv(null, lim, false, true),
      wrong: [iv(lim, null, true), iv(null, m + kk, false, true), iv(m + kk, null, true), iv(null, lim, false, false)],
      sol: T`The axis is \(x=-(a${k(-m)})=${m}-a\). We need \(${m}-a\ge${kk}\), so \(a\le${lim}\).`,
    };
  });

  def('odd-even-value', 'func', (r) => {
    const b = r.nz(-4, 4), kk = r.int(1, 4);
    const odd = r.chance(0.6);
    const g = (x) => x * x + b * x;
    const fx = lc([[1, 'x^2'], [b, 'x']]);
    const val = odd ? -g(kk) : g(kk);
    return {
      q: T`Let \(f(x)\) be ${odd ? 'an odd' : 'an even'} function on \(\mathbb{R}\) with \(f(x)=${fx}\) for \(x>0\). Then \(f(-${kk})=\)`,
      correct: String(val),
      wrong: [String(-val), String(kk * kk - b * kk), String(-(kk * kk - b * kk))].concat(nb(val)),
      sol: odd
        ? T`For an odd function, \(f(-${kk})=-f(${kk})=-(${kk * kk}${k(b * kk)})=${val}\).`
        : T`For an even function, \(f(-${kk})=f(${kk})=${kk * kk}${k(b * kk)}=${val}\).`,
    };
  });

  def('compose', 'func', (r) => {
    if (r.chance(0.5)) {
      const a = r.nz(-3, 3), b = r.int(-4, 4), c = r.int(-3, 3), kk = r.int(-2, 3);
      const gk = kk * kk + c, ans = a * gk + b, fk = a * kk + b;
      return {
        q: T`Let \(f(x)=${lc([[a, 'x'], [b, '']])}\) and \(g(x)=${lc([[1, 'x^2'], [c, '']])}\). Then \(f(g(${kk}))=\)`,
        correct: String(ans),
        wrong: [String(fk * fk + c), String(fk * gk), String(a * kk * kk + c + b)].concat(nb(ans)),
        sol: T`\(g(${kk})=${gk}\), then \(f(${gk})=${a}\cdot${gk < 0 ? `(${gk})` : gk}${k(b)}=${ans}\).`,
      };
    }
    const b = r.int(-4, 4), c = r.int(-4, 4), kk = r.int(-2, 4);
    const f = (x) => (x - 1) * (x - 1) + b * (x - 1) + c;
    const ans = f(kk);
    return {
      q: T`If \(f(x+1)=${lc([[1, 'x^2'], [b, 'x'], [c, '']])}\), then \(f(${kk})=\)`,
      correct: String(ans),
      wrong: [String(kk * kk + b * kk + c), String((kk + 1) ** 2 + b * (kk + 1) + c), String((kk - 1) ** 2 + b * kk + c)].concat(nb(ans)),
      sol: T`Put \(x+1=${kk}\), i.e. \(x=${kk - 1}\): \(f(${kk})=(${kk - 1})^2${b ? k(b) + T`\cdot(${kk - 1})` : ''}${k(c)}=${ans}\).`,
    };
  });

  def('zero-interval', 'func', (r) => {
    const v = r.int(1, 3);
    let f, tex, lo0;
    if (v === 1) { const kk = r.int(3, 9); f = (x) => Math.log(x) + 2 * x - kk; tex = T`f(x)=\ln x+2x-${kk}`; lo0 = 0; }
    else if (v === 2) { const kk = r.int(3, 14); f = (x) => 2 ** x + x - kk; tex = T`f(x)=2^x+x-${kk}`; lo0 = -2; }
    else { const kk = r.int(3, 30); f = (x) => x ** 3 + x - kk; tex = T`f(x)=x^3+x-${kk}`; lo0 = -2; }
    let a = Math.max(lo0, 1e-9), b = 20;
    for (let i = 0; i < 200; i++) { const m = (a + b) / 2; if (f(m) > 0) b = m; else a = m; }
    const root = a;
    const n = Math.floor(root);
    if (Math.abs(root - Math.round(root)) < 1e-6) throw new Error('integer root');
    const cands = [];
    for (let s = n - 2; s <= n + 3; s++) if (s !== n && s >= lo0) cands.push(`(${s},${s + 1})`);
    return {
      q: T`The zero of \(${tex}\) lies in the interval`,
      correct: `(${n},${n + 1})`,
      wrong: r.shuffle(cands),
      sol: T`\(f\) is continuous and increasing; ${v === 1 && n === 0 ? T`\(f(x)\to-\infty\) as \(x\to0^+\)` : T`\(f(${n})\approx${dec(Math.round(f(n) * 100), 100)}<0\)`} and \(f(${n + 1})\approx${dec(Math.round(f(n + 1) * 100), 100)}>0\), so the zero lies in \((${n},${n + 1})\).`,
    };
  });

  /* ================================================================== */
  /* MODULE 2 · EXPONENTS AND LOGARITHMS                                 */
  /* ================================================================== */
  def('exp-eval', 'expolog', (r) => {
    const opts = [[2, 2], [2, 3], [3, 2], [3, 3], [4, 2], [5, 2], [2, 4], [2, 5], [4, 3], [5, 3]];
    const [b, n] = r.pick(opts);
    let m;
    do m = r.int(1, 3); while (m === n || gcd(m, n) !== 1);
    const neg = r.chance(0.35);
    const c = r.pick([2, 3]), kk = r.int(2, 4);
    const An = neg ? 1 : b ** m, Ad = neg ? b ** m : 1;
    const ans = F(An + kk * Ad, Ad);
    const expTex = (neg ? '-' : '') + T`\frac{${m}}{${n}}`;
    return {
      q: T`\(${b ** n}^{${expTex}}+\log_{${c}}${c ** kk}=\)`,
      correct: ans,
      wrong: [F(An - kk * Ad, Ad), F(neg ? b ** m + kk : 1 + kk * b ** m, neg ? 1 : b ** m), F(An * kk, Ad), F(An + (kk + 1) * Ad, Ad)].concat(fnb(An + kk * Ad, Ad)),
      sol: T`\(${b ** n}^{${expTex}}=(${b}^{${n}})^{${expTex}}=${b}^{${neg ? '-' : ''}${m}}=${F(An, Ad)}\) and \(\log_{${c}}${c ** kk}=${kk}\). Sum: \(${ans}\).`,
    };
  });

  def('log-eval', 'expolog', (r) => {
    const v = r.int(1, 3);
    let q, kk, sol;
    if (v === 3) {
      const [p, s] = r.shuffle([2, 3, 5, 7]).slice(0, 2);
      kk = r.int(2, 4);
      q = T`\(\log_{${p}}${s}\cdot\log_{${s}}${p ** kk}=\)`;
      sol = T`Change of base: \(\frac{\lg ${s}}{\lg ${p}}\cdot\frac{\lg ${p}^{${kk}}}{\lg ${s}}=${kk}\).`;
    } else {
      const a = r.pick([2, 3, 6, 10]);
      kk = a === 10 ? r.int(1, 3) : a === 6 ? r.int(1, 2) : r.int(2, 3);
      const N = a ** kk;
      const divs = range(2, N - 1).filter((d) => N % d === 0);
      if (!divs.length) throw new Error('no divisor');
      const x = r.pick(divs), y = N / x;
      const L = (z) => (a === 10 ? T`\lg ${z}` : T`\log_{${a}}${z}`);
      if (v === 1) {
        q = T`\(${L(x)}+${L(y)}=\)`;
        sol = T`\(${L(x)}+${L(y)}=${L(N)}=${kk}\) because \(${a}^{${kk}}=${N}\).`;
      } else {
        const z = r.int(2, 9);
        q = T`\(${L(N * z)}-${L(z)}=\)`;
        sol = T`\(${L(N * z)}-${L(z)}=${L(N)}=${kk}\).`;
      }
    }
    return { q, correct: String(kk), wrong: [String(kk + 1), String(kk - 1), String(2 * kk), String(kk * kk), String(kk + 2)], sol };
  });

  def('exp-eq', 'expolog', (r) => {
    const b = r.pick([2, 3]);
    const p = r.pick(b === 2 ? [1, 2, 3] : [1, 2]);
    const c = r.nz(-3, 3);
    const t = r.int(-3, b === 2 ? 6 : 4);
    if (t === 0) throw new Error('t=0');
    const base = b ** p;
    const rhs = t > 0 ? String(b ** t) : T`\frac{1}{${b ** -t}}`;
    const x = F(t - c * p, p);
    return {
      q: T`The solution of \(${base}^{${lin('x', -c)}}=${rhs}\) is \(x=\)`,
      correct: x,
      wrong: [F(t - c, 1), F(t + c * p, p), F(t - c, p), F(-t - c * p, p)].concat(fnb(t - c * p, p)),
      sol: T`Write both sides as powers of \(${b}\): \(${b}^{${p}(${lin('x', -c)})}=${b}^{${t}}\), so \(${p === 1 ? '' : p}(${lin('x', -c)})=${t}\) and \(x=${x}\).`,
    };
  });

  def('log-eq', 'expolog', (r) => {
    if (r.chance(0.5)) {
      const b = r.pick([2, 3, 5]), kk = r.int(1, b === 5 ? 2 : 3), c = r.nz(-4, 4);
      const ans = b ** kk - c;
      return {
        q: T`The solution of \(\log_{${b}}(${lin('x', -c)})=${kk}\) is \(x=\)`,
        correct: String(ans),
        wrong: [String(b ** kk + c), String(kk * b - c), String(b ** kk), String(kk ** b - c)].concat(nb(ans)),
        sol: T`\(${lin('x', -c)}=${b}^{${kk}}=${b ** kk}\), so \(x=${ans}\) (and \(${lin('x', -c)}>0\) holds).`,
      };
    }
    const sets = [[3, 1, 2, 3], [5, 3, 2, 4], [2, 1, 3, 1], [5, 4, 3, 2], [6, 2, 2, 5], [9, 7, 2, 5], [10, 6, 2, 6], [6, 3, 3, 3], [13, 12, 5, 2], [10, 8, 6, 2]];
    const [x, c, b, kk] = r.pick(sets);
    return {
      q: T`The solution of \(\log_{${b}}(x-${c})+\log_{${b}}(x+${c})=${kk}\) is`,
      correct: T`x=${x}`,
      wrong: [T`x=-${x}`, T`x=\pm ${x}`, T`x=${x * x}`, T`x=${x + 1}`],
      sol: T`\(\log_{${b}}(x^2-${c * c})=${kk}\Rightarrow x^2=${b ** kk}+${c * c}=${x * x}\Rightarrow x=\pm${x}\). The domain needs \(x>${c}\), so \(x=${x}\).`,
    };
  });

  def('compare-abc', 'expolog', (r) => {
    const p = r.pick([2, 3, 5]);
    const qd = r.pick([2, 3, 4, 5, 6, 7, 8]);
    const qs = '0.' + qd;
    const exprs = [
      { tex: T`${p}^{${qs}}`, val: p ** (qd / 10) },
      { tex: T`${qs}^{${p}}`, val: (qd / 10) ** p },
      { tex: T`\log_{${p}}${qs}`, val: Math.log(qd / 10) / Math.log(p) },
    ];
    const letters = r.shuffle(['a', 'b', 'c']);
    exprs.forEach((e, i) => (e.l = letters[i]));
    const assign = exprs.slice().sort((x, y) => x.l.localeCompare(y.l));
    const order = exprs.slice().sort((x, y) => y.val - x.val).map((e) => e.l);
    const perms = [['a', 'b', 'c'], ['a', 'c', 'b'], ['b', 'a', 'c'], ['b', 'c', 'a'], ['c', 'a', 'b'], ['c', 'b', 'a']].map((pp) => pp.join('>'));
    const correct = order.join('>');
    return {
      q: T`Let ${assign.map((e) => T`\(${e.l}=${e.tex}\)`).join(', ')}. Then`,
      correct,
      wrong: r.shuffle(perms.filter((x) => x !== correct)),
      sol: T`\(${exprs[0].tex}>${p}^0=1\); \(0<${exprs[1].tex}<1\); \(${exprs[2].tex}<\log_{${p}}1=0\). So \(${correct}\).`,
    };
  });

  def('fixed-point', 'expolog', (r) => {
    const h = r.nz(-3, 3), kk = r.int(-3, 3);
    if (r.chance(0.5)) {
      return {
        q: T`For \(a>0\) and \(a\ne1\), the graph of \(y=a^{${lin('x', h)}}${k(kk)}\) always passes through the point`,
        correct: `(${h},${kk + 1})`,
        wrong: [`(${h},${kk})`, `(${-h},${kk + 1})`, `(${h + 1},${kk})`, `(0,${kk + 1})`],
        sol: T`\(a^0=1\) for every \(a\). Setting \(${lin('x', h)}=0\) gives \(x=${h}\), \(y=1${k(kk)}=${kk + 1}\).`,
      };
    }
    return {
      q: T`For \(a>0\) and \(a\ne1\), the graph of \(y=\log_a(${lin('x', h)})${k(kk)}\) always passes through the point`,
      correct: `(${h + 1},${kk})`,
      wrong: [`(${h},${kk})`, `(${h + 1},${kk + 1})`, `(${1 - h},${kk})`, `(${h},${kk + 1})`],
      sol: T`\(\log_a1=0\) for every \(a\). Setting \(${lin('x', h)}=1\) gives \(x=${h + 1}\), \(y=${kk}\).`,
    };
  });

  def('exp-ineq', 'expolog', (r) => {
    const b = r.pick([2, 3]), t = r.int(1, b === 2 ? 5 : 3), c = r.int(-3, 3);
    const inv = r.chance(0.5);
    const gt = r.chance(0.5);
    const baseTex = inv ? T`\left(\frac{1}{${b}}\right)` : String(b);
    const ex = lin('x', c);
    let correct;
    if (!inv) correct = gt ? iv(t + c, null, false) : iv(null, t + c, false, false);
    else correct = gt ? iv(null, c - t, false, false) : iv(c - t, null, false);
    const all = [iv(t + c, null, false), iv(null, t + c, false, false), iv(c - t, null, false), iv(null, c - t, false, false)];
    return {
      q: T`The solution set of \(${baseTex}^{${ex}}${gt ? '>' : '<'}${b ** t}\) is`,
      correct,
      wrong: all.filter((x) => x !== correct),
      sol: inv
        ? T`\(\left(\frac1{${b}}\right)^{${ex}}=${b}^{-(${ex})}\), so \(-(${ex})${gt ? '>' : '<'}${t}\), i.e. \(x${gt ? '<' : '>'}${c - t}\).`
        : T`\(${b}^{x}\) is increasing, so \(${ex}${gt ? '>' : '<'}${t}\), i.e. \(x${gt ? '>' : '<'}${t + c}\).`,
    };
  });

  /* ================================================================== */
  /* MODULE 2 · TRIGONOMETRY                                             */
  /* ================================================================== */
  const SPECIAL = {
    s: { 30: T`\frac{1}{2}`, 45: T`\frac{\sqrt{2}}{2}`, 60: T`\frac{\sqrt{3}}{2}` },
    t: { 30: T`\frac{\sqrt{3}}{3}`, 45: '1', 60: T`\sqrt{3}` },
  };
  function trigVal(fn, d) {
    d = ((d % 360) + 360) % 360;
    let ref = d % 180;
    if (ref > 90) ref = 180 - ref;
    const q = Math.floor(d / 90) + 1; // quadrant (d not multiple of 90)
    let mag, pos;
    if (fn === 'sin') { mag = SPECIAL.s[ref]; pos = q <= 2; }
    else if (fn === 'cos') { mag = SPECIAL.s[90 - ref]; pos = q === 1 || q === 4; }
    else { mag = SPECIAL.t[ref]; pos = q === 1 || q === 3; }
    return (pos ? '' : '-') + mag;
  }
  const TRIG_POOL = [T`\frac{1}{2}`, T`\frac{\sqrt{2}}{2}`, T`\frac{\sqrt{3}}{2}`, T`\frac{\sqrt{3}}{3}`, '1', T`\sqrt{3}`];

  def('trig-special', 'trig', (r) => {
    const base = r.pick([30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330]);
    const w = r.pick([0, 0, 0, 1, -1]);
    const A = base + 360 * w;
    const fn = r.pick(['sin', 'cos', 'tan']);
    const angle = r.chance(0.7) ? P(A, 180) : A + T`^\circ`;
    const correct = trigVal(fn, A);
    const flip = (s) => (s.startsWith('-') ? s.slice(1) : '-' + s);
    const other = trigVal(fn === 'sin' ? 'cos' : 'sin', A);
    const pool = r.shuffle(TRIG_POOL.flatMap((x) => [x, '-' + x]));
    return {
      q: T`\(${BS + fn}\left(${angle}\right)=\)`,
      correct,
      wrong: [flip(correct), other, flip(other)].concat(pool),
      sol: T`Reduce the angle: \(${angle}\) is coterminal with \(${base}^\circ\), whose reference angle is \(${base % 180 > 90 ? 180 - (base % 180) : base % 180}^\circ\). With the sign of \(${BS + fn}\) in that quadrant, the value is \(${correct}\).`,
    };
  });

  const OMEGA = [[1, 1], [2, 1], [3, 1], [4, 1], [1, 2], [1, 3], [2, 3]];
  function omegaX([n, d]) {
    if (d === 1) return n === 1 ? 'x' : n + 'x';
    return T`\frac{${n === 1 ? '' : n}x}{${d}}`;
  }
  function trigArg(w, phi) {
    return T`\left(${omegaX(w)}${phi[0] < 0 ? '-' : '+'}${P(Math.abs(phi[0]), phi[1])}\right)`;
  }
  const PHIS = [[1, 6], [1, 4], [1, 3], [-1, 6], [-1, 4], [-1, 3], [2, 3], [-2, 3]];

  def('trig-period', 'trig', (r) => {
    const w = r.pick(OMEGA), phi = r.pick(PHIS);
    const fn = r.pick(['sin', 'cos', 'tan']);
    const A = r.int(1, 4), B = r.int(-2, 3);
    const askMax = fn !== 'tan' && r.chance(0.4);
    const f = T`y=${A === 1 ? '' : A}${BS + fn}${trigArg(w, phi)}${k(B)}`;
    if (askMax) {
      return {
        q: T`The maximum value of \(${f}\) is`,
        correct: String(A + B),
        wrong: [String(A), String(B - A), String(A - B), String(A + B + 1), String(2 * A + B)],
        sol: T`\(${BS + fn}(\cdot)\) has maximum \(1\), so the maximum of \(y\) is \(${A}\cdot1${k(B)}=${A + B}\).`,
      };
    }
    const [n, d] = w;
    const per = fn === 'tan' ? P(d, n) : P(2 * d, n);
    return {
      q: T`The smallest positive period of \(${f}\) is`,
      correct: per,
      wrong: [P(d, n), P(2 * d, n), P(4 * d, n), P(2 * n, d), P(n, d), P(d, 2 * n)],
      sol: fn === 'tan'
        ? T`For \(y=A\tan(\omega x+\varphi)\), \(T=\frac{\pi}{|\omega|}=${per}\).`
        : T`For \(y=A${BS + fn}(\omega x+\varphi)+B\), \(T=\frac{2\pi}{|\omega|}=${per}\).`,
    };
  });

  const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]];
  const QINT = ['', T`\left(0,\frac{\pi}{2}\right)`, T`\left(\frac{\pi}{2},\pi\right)`, T`\left(\pi,\frac{3\pi}{2}\right)`, T`\left(\frac{3\pi}{2},2\pi\right)`];

  def('trig-identity', 'trig', (r) => {
    let [a, b, c] = r.pick(TRIPLES);
    if (r.chance(0.5)) [a, b] = [b, a];
    const quad = r.int(1, 4);
    const ss = quad <= 2 ? 1 : -1, cs = quad === 1 || quad === 4 ? 1 : -1;
    const s = ss * a, co = cs * b; // sin = s/c, cos = co/c
    const givenSin = r.chance(0.5);
    const targets = givenSin ? ['cos', 'tan', 'sin2', 'cos2'] : ['sin', 'tan', 'sin2', 'cos2'];
    const tg = r.pick(targets);
    const comp = (S, Co) => ({ sin: [S, c], cos: [Co, c], tan: [S, Co], sin2: [2 * S * Co, c * c], cos2: [Co * Co - S * S, c * c] });
    const cv = comp(s, co)[tg];
    const correct = F(...cv);
    const names = { sin: T`\sin\alpha`, cos: T`\cos\alpha`, tan: T`\tan\alpha`, sin2: T`\sin2\alpha`, cos2: T`\cos2\alpha` };
    const wrongs = [comp(s, -co)[tg], comp(-s, co)[tg], comp(co, s)[tg], comp(-co, -s)[tg], [co, s], [-co, s]].map((x) => F(...x));
    if (tg === 'cos2') wrongs.push(F(s * s - co * co, c * c), F(2 * s * co, c * c));
    return {
      q: givenSin
        ? T`Given \(\sin\alpha=${F(s, c)}\) and \(\alpha\in${QINT[quad]}\), then \(${names[tg]}=\)`
        : T`Given \(\cos\alpha=${F(co, c)}\) and \(\alpha\in${QINT[quad]}\), then \(${names[tg]}=\)`,
      correct,
      wrong: wrongs.concat(fnb(...cv)),
      sol: T`From \(\sin^2\alpha+\cos^2\alpha=1\) and the quadrant: \(\sin\alpha=${F(s, c)}\), \(\cos\alpha=${F(co, c)}\). ` +
        { sin: '', cos: '', tan: T`\(\tan\alpha=\frac{\sin\alpha}{\cos\alpha}=${correct}\).`, sin2: T`\(\sin2\alpha=2\sin\alpha\cos\alpha=${correct}\).`, cos2: T`\(\cos2\alpha=\cos^2\alpha-\sin^2\alpha=${correct}\).` }[tg],
    };
  });

  def('tan-ratio', 'trig', (r) => {
    const t = r.pick([2, 3, -2, -3, 4, -4]);
    if (r.chance(0.65)) {
      const a = r.nz(-3, 3), b = r.nz(-3, 3), c = r.nz(-3, 3), d = r.nz(-3, 3);
      const N = a * t + b, D = c * t + d;
      if (N === 0 || D === 0) throw new Error('zero');
      const correct = F(N, D);
      return {
        q: T`Given \(\tan\alpha=${t}\), then \(\dfrac{${lc([[a, T`\sin\alpha`], [b, T`\cos\alpha`]])}}{${lc([[c, T`\sin\alpha`], [d, T`\cos\alpha`]])}}=\)`,
        correct,
        wrong: (c + d * t !== 0 ? [F(a + b * t, c + d * t)] : []).concat([F(-N, D), (c * t - d) ? F(a * t - b, c * t - d) : 'x', D ? F(D, N) : 'x']).concat(fnb(N, D)),
        sol: T`Divide numerator and denominator by \(\cos\alpha\): \(\frac{${lc([[a, T`\tan\alpha`], [b, '']])}}{${lc([[c, T`\tan\alpha`], [d, '']])}}=\frac{${N}}{${D}}=${correct}\).`,
      };
    }
    const correct = F(t, 1 + t * t);
    return {
      q: T`Given \(\tan\alpha=${t}\), then \(\sin\alpha\cos\alpha=\)`,
      correct,
      wrong: [F(-t, 1 + t * t), F(1, 1 + t * t), F(t * t, 1 + t * t), F(t, 1 - t * t), F(2 * t, 1 + t * t)],
      sol: T`\(\sin\alpha\cos\alpha=\frac{\sin\alpha\cos\alpha}{\sin^2\alpha+\cos^2\alpha}=\frac{\tan\alpha}{\tan^2\alpha+1}=${correct}\).`,
    };
  });

  def('trig-amplitude', 'trig', (r) => {
    const askMin = r.chance(0.35);
    if (r.chance(0.6)) {
      let [a, b, c] = r.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [1, 1, 0]]);
      if (c === 0) {
        const m = askMin ? T`-\sqrt{2}` : T`\sqrt{2}`;
        return {
          q: T`The ${askMin ? 'minimum' : 'maximum'} value of \(y=\sin x+\cos x\) is`,
          correct: m,
          wrong: [askMin ? T`\sqrt{2}` : T`-\sqrt{2}`, askMin ? '-2' : '2', askMin ? '-1' : '1', askMin ? T`-\frac{\sqrt{2}}{2}` : T`\frac{\sqrt{2}}{2}`],
          sol: T`\(\sin x+\cos x=\sqrt2\sin\left(x+\frac{\pi}{4}\right)\), whose ${askMin ? 'minimum' : 'maximum'} is \(${m}\).`,
        };
      }
      if (r.chance(0.5)) [a, b] = [b, a];
      const sa = r.sign() * a, sb = r.sign() * b;
      const val = askMin ? -c : c;
      return {
        q: T`The ${askMin ? 'minimum' : 'maximum'} value of \(y=${lc([[sa, T`\sin x`], [sb, T`\cos x`]])}\) is`,
        correct: String(val),
        wrong: [String(-val), String(askMin ? -(a + b) : a + b), String(askMin ? -(c * c) : c * c), String(askMin ? -Math.max(a, b) : Math.max(a, b))],
        sol: T`\(a\sin x+b\cos x=\sqrt{a^2+b^2}\sin(x+\varphi)\) with \(\sqrt{${a * a}+${b * b}}=${c}\), so the ${askMin ? 'minimum' : 'maximum'} is \(${val}\).`,
      };
    }
    const m = r.int(1, 3);
    const val = askMin ? -2 * m : 2 * m;
    return {
      q: T`The ${askMin ? 'minimum' : 'maximum'} value of \(y=${m === 1 ? '' : m}\sin x+${m === 1 ? '' : m}\sqrt{3}\cos x\) is`,
      correct: String(val),
      wrong: [String(-val), (askMin ? '-' : '') + R(m, 3), (askMin ? '-' : '') + (m === 1 ? T`1+\sqrt{3}` : m + T`(1+\sqrt{3})`), String(askMin ? -m : m), String(askMin ? -4 * m : 4 * m)],
      sol: T`\(${m === 1 ? T`\sin x+\sqrt3\cos x` : m + T`(\sin x+\sqrt3\cos x)`}=${2 * m}\sin\left(x+\frac{\pi}{3}\right)\), so the ${askMin ? 'minimum' : 'maximum'} is \(${val}\).`,
    };
  });

  def('trig-shift', 'trig', (r) => {
    const w = r.pick([2, 3]);
    const s = r.pick([[1, 6], [1, 12], [1, 4], [1, 3], [1, 8]]);
    const fn = r.pick(['sin', 'cos']);
    const left = r.chance(0.5);
    const ws = P(w * s[0], s[1]), so = P(s[0], s[1]);
    const g = (sign, v) => T`y=${BS + fn}\left(${w}x${sign}${v}\right)`;
    const correct = g(left ? '+' : '-', ws);
    return {
      q: T`Shifting the graph of \(y=${BS + fn}${w}x\) to the ${left ? 'left' : 'right'} by \(${so}\) units gives the graph of`,
      correct,
      wrong: [g(left ? '+' : '-', so), g(left ? '-' : '+', ws), g(left ? '-' : '+', so)],
      sol: T`Shifting ${left ? 'left' : 'right'} by \(${so}\) replaces \(x\) with \(x${left ? '+' : '-'}${so}\): \(${BS + fn}\left(${w}\left(x${left ? '+' : '-'}${so}\right)\right)=${BS + fn}\left(${w}x${left ? '+' : '-'}${ws}\right)\).`,
    };
  });

  def('law-cosines', 'trig', (r) => {
    const [a, b] = r.distinct(2, 2, 8);
    const C = r.pick([60, 120]);
    if (r.chance(0.6)) {
      const c2 = C === 60 ? a * a + b * b - a * b : a * a + b * b + a * b;
      const alt = C === 60 ? a * a + b * b + a * b : a * a + b * b - a * b;
      return {
        q: T`In \(\triangle ABC\), \(a=${a}\), \(b=${b}\) and \(C=${P(C, 180)}\). Then \(c=\)`,
        correct: R(1, c2),
        wrong: [R(1, alt), R(1, a * a + b * b), String(c2), R(1, c2 + 1)],
        sol: T`Law of cosines: \(c^2=a^2+b^2-2ab\cos C=${a * a}+${b * b}${C === 60 ? '-' : '+'}${a * b}=${c2}\), so \(c=${R(1, c2)}\).`,
      };
    }
    return {
      q: T`In \(\triangle ABC\), \(a=${a}\), \(b=${b}\) and \(C=${P(C, 180)}\). The area of \(\triangle ABC\) is`,
      correct: R(a * b, 3, 4),
      wrong: [R(a * b, 3, 2), F(a * b, 4), F(a * b, 2), R(a * b, 1 + 1, 4)],
      sol: T`\(S=\frac12ab\sin C=\frac12\cdot${a}\cdot${b}\cdot\frac{\sqrt3}{2}=${R(a * b, 3, 4)}\).`,
    };
  });

  /* ================================================================== */
  /* MODULE 2 · SEQUENCES                                                */
  /* ================================================================== */
  def('arith-term', 'seq', (r) => {
    const a1 = r.int(-8, 10), d = r.nz(-4, 5), n = r.int(8, 20);
    const an = (i) => a1 + (i - 1) * d;
    if (r.chance(0.5)) {
      return {
        q: T`In the arithmetic sequence \(\{a_n\}\), \(a_1=${a1}\) and the common difference is \(d=${d}\). Then \(a_{${n}}=\)`,
        correct: String(an(n)),
        wrong: [String(a1 + n * d), String(an(n - 1)), String(a1 + (n - 1) * -d)].concat(nb(an(n))),
        sol: T`\(a_n=a_1+(n-1)d\Rightarrow a_{${n}}=${a1}+${n - 1}\cdot${d < 0 ? `(${d})` : d}=${an(n)}\).`,
        key: S2(T`General term of an arithmetic sequence: \(a_n=a_1+(n-1)d\).`, T`តួទូទៅនៃស្វ៊ីតនព្វន្ត៖ \(a_n=a_1+(n-1)d\)។`),
        steps: [
          S2(T`Here \(a_1=${a1}\), \(d=${d}\) and \(n=${n}\).`, T`នៅទីនេះ \(a_1=${a1}\), \(d=${d}\) និង \(n=${n}\)។`),
          DM(T`a_{${n}}=a_1+(${n}-1)d=${a1}+${n - 1}\cdot${pr(d)}=${a1}${k((n - 1) * d)}=${an(n)}`),
        ],
      };
    }
    const p = r.int(2, 4), q = p + r.int(2, 5);
    return {
      q: T`In the arithmetic sequence \(\{a_n\}\), \(a_{${p}}=${an(p)}\) and \(a_{${q}}=${an(q)}\). Then \(a_{${n}}=\)`,
      correct: String(an(n)),
      wrong: [String(an(n + 1)), String(an(n - 1)), String(a1 + n * d), String(an(p) + (n - p) * -d)].concat(nb(an(n))),
      sol: T`\(d=\frac{${an(q)}-${an(p) < 0 ? `(${an(p)})` : an(p)}}{${q}-${p}}=${d}\), so \(a_{${n}}=a_{${p}}+(${n}-${p})d=${an(n)}\).`,
      key: S2(T`In an arithmetic sequence \(a_m=a_k+(m-k)d\), so \(d=\frac{a_m-a_k}{m-k}\).`, T`ក្នុងស្វ៊ីតនព្វន្ត \(a_m=a_k+(m-k)d\) ដូច្នេះ \(d=\frac{a_m-a_k}{m-k}\)។`),
      steps: [
        S2(T`Find the common difference \(d\) from the two given terms:`, T`រកផលសងរួម \(d\) ពីតួទាំងពីរដែលគេឲ្យ៖`),
        DM(T`d=\frac{a_{${q}}-a_{${p}}}{${q}-${p}}=\frac{${an(q)}-${pr(an(p))}}{${q - p}}=${d}`),
        S2(T`Then move from \(a_{${p}}\) to \(a_{${n}}\):`, T`បន្ទាប់មក គណនាពី \(a_{${p}}\) ទៅ \(a_{${n}}\)៖`),
        DM(T`a_{${n}}=a_{${p}}+(${n}-${p})d=${an(p)}+${n - p}\cdot${pr(d)}=${an(n)}`),
      ],
    };
  });

  def('arith-sum', 'seq', (r) => {
    if (r.chance(0.5)) {
      const a1 = r.int(-5, 8), d = r.nz(-3, 4), n = r.int(6, 15);
      const S = n * a1 + (n * (n - 1) / 2) * d;
      return {
        q: T`For the arithmetic sequence with \(a_1=${a1}\) and \(d=${d}\), the sum of the first \(${n}\) terms is \(S_{${n}}=\)`,
        correct: String(S),
        wrong: [String(n * a1 + (n * (n + 1) / 2) * d), String(n * (a1 + n * d)), String(S - (a1 + (n - 1) * d))].concat(nb(S)),
        sol: T`\(S_n=na_1+\frac{n(n-1)}{2}d=${n}\cdot${a1 < 0 ? `(${a1})` : a1}+${(n * (n - 1)) / 2}\cdot${d < 0 ? `(${d})` : d}=${S}\).`,
      };
    }
    const n = r.int(7, 15), s = 2 * r.int(2, 9);
    const m = r.int(2, Math.floor(n / 2));
    const m2 = n + 1 - m;
    return {
      q: T`In the arithmetic sequence \(\{a_n\}\), \(a_{${m}}+a_{${m2}}=${s}\). Then \(S_{${n}}=\)`,
      correct: String((n * s) / 2),
      wrong: [String(n * s), String(((n - 1) * s) / 2), String(((n + 1) * s) / 2), String(s * m)],
      sol: T`Since \(${m}+${m2}=1+${n}\), \(a_1+a_{${n}}=a_{${m}}+a_{${m2}}=${s}\), so \(S_{${n}}=\frac{${n}(a_1+a_{${n}})}{2}=${(n * s) / 2}\).`,
    };
  });

  def('geo-term', 'seq', (r) => {
    const a1 = r.pick([1, 2, 3, -1, -2]), q = r.pick([2, 3, -2, -3]), n = r.int(4, 7);
    const a = (i) => a1 * q ** (i - 1);
    if (Math.abs(a(n)) > 3000) throw new Error('too big');
    if (r.chance(0.5)) {
      return {
        q: T`In the geometric sequence \(\{a_n\}\), \(a_1=${a1}\) and the common ratio is \(q=${q}\). Then \(a_{${n}}=\)`,
        correct: String(a(n)),
        wrong: [String(a(n + 1)), String(a(n - 1)), String(-a(n)), String(a1 * q * (n - 1))],
        sol: T`\(a_n=a_1q^{n-1}=${a1}\cdot(${q})^{${n - 1}}=${a(n)}\).`,
      };
    }
    return {
      q: T`In the geometric sequence \(\{a_n\}\), \(a_2=${a(2)}\) and \(a_5=${a(5)}\). Then the common ratio \(q=\)`,
      correct: String(q),
      wrong: [String(-q), String(q * q), F(1, q), String(q ** 3)],
      sol: T`\(q^3=\frac{a_5}{a_2}=\frac{${a(5)}}{${a(2)}}=${q ** 3}\), so \(q=${q}\).`,
    };
  });

  def('geo-sum', 'seq', (r) => {
    const qq = r.pick([[2, 1], [3, 1], [-2, 1], [1, 2]]);
    const a1 = qq[1] === 2 ? r.pick([8, 16, 32]) : r.pick([1, 2, 3]);
    const n = r.int(4, 6);
    // S_n = a1 (1 - q^n)/(1 - q) with q = qn/qd
    const [qn, qd] = qq;
    const SN = a1 * (qd ** n - qn ** n) * qd, SD = qd ** n * (qd - qn);
    const S = (m) => F(a1 * (qd ** m - qn ** m) * qd, qd ** m * (qd - qn));
    return {
      q: T`For the geometric sequence with \(a_1=${a1}\) and \(q=${F(qn, qd)}\), the sum of the first \(${n}\) terms is`,
      correct: S(n),
      wrong: [S(n + 1), S(n - 1), F(a1 * qn ** (n - 1), qd ** (n - 1)), F(a1 * (qd ** n - qn ** n), qd ** n)].concat(fnb(SN, SD)),
      sol: T`\(S_n=\frac{a_1(1-q^n)}{1-q}=\frac{${a1}\left(1-\left(${F(qn, qd)}\right)^{${n}}\right)}{1-${qn < 0 ? `(${qn})` : F(qn, qd)}}=${S(n)}\).`,
      key: S2(T`Sum of the first \(n\) terms of a geometric sequence: \(S_n=\frac{a_1(1-q^n)}{1-q}\) (\(q\ne1\)).`, T`ផលបូក \(n\) តួដំបូងនៃស្វ៊ីតធរណីមាត្រ៖ \(S_n=\frac{a_1(1-q^n)}{1-q}\) (\(q\ne1\))។`),
      steps: [
        S2(T`Here \(a_1=${a1}\), \(q=${F(qn, qd)}\), \(n=${n}\). First compute \(q^{${n}}\):`, T`នៅទីនេះ \(a_1=${a1}\), \(q=${F(qn, qd)}\), \(n=${n}\)។ ដំបូងគណនា \(q^{${n}}\)៖`),
        DM(T`q^{${n}}=\left(${F(qn, qd)}\right)^{${n}}=${F(qn ** n, qd ** n)}`),
        S2('Substitute into the formula:', 'ជំនួសក្នុងរូបមន្ត៖'),
        DM(T`S_{${n}}=\frac{${a1}\left(1-${pr(F(qn ** n, qd ** n))}\right)}{1-${pr(F(qn, qd))}}=\frac{${a1}\cdot${pr(F(qd ** n - qn ** n, qd ** n))}}{${F(qd - qn, qd)}}=${S(n)}`),
      ],
    };
  });

  def('geo-property', 'seq', (r) => {
    if (r.chance(0.5)) {
      const kk = r.int(4, 6), w = r.int(2, 9), m = r.int(2, kk - 1);
      return {
        q: T`In a geometric sequence with positive terms, \(a_{${m}}a_{${2 * kk - m}}=${w * w}\). Then \(a_{${kk}}=\)`,
        correct: String(w),
        wrong: [T`\pm ${w}`, F(w * w, 2), String(2 * w), String(w * w)],
        sol: T`Since \(${m}+${2 * kk - m}=2\cdot${kk}\), \(a_{${kk}}^2=a_{${m}}a_{${2 * kk - m}}=${w * w}\). The terms are positive, so \(a_{${kk}}=${w}\).`,
      };
    }
    const t = r.int(1, 4);
    return {
      q: T`In a geometric sequence with positive terms, \(a_4a_6=${4 ** t}\). Then \(\log_2a_1+\log_2a_2+\cdots+\log_2a_9=\)`,
      correct: String(9 * t),
      wrong: [String(18 * t), String(8 * t), String(10 * t), String(9 * 2 * t + 1)],
      sol: T`\(a_5^2=a_4a_6=${4 ** t}\Rightarrow a_5=${2 ** t}\). Then \(a_1a_2\cdots a_9=a_5^9\), so the sum is \(9\log_2${2 ** t}=${9 * t}\).`,
    };
  });

  def('sn-an', 'seq', (r) => {
    const b = r.int(-4, 4), c = r.int(-3, 3), kk = r.int(3, 9);
    const S = (n) => n * n + b * n + c;
    const ans = S(kk) - S(kk - 1);
    return {
      q: T`The sum of the first \(n\) terms of \(\{a_n\}\) is \(S_n=${lc([[1, 'n^2'], [b, 'n'], [c, '']])}\). Then \(a_{${kk}}=\)`,
      correct: String(ans),
      wrong: [String(S(kk)), String(ans + 1), String(ans + c === ans ? ans - 1 : ans + c), String(S(kk - 1)), String(ans + 2)],
      sol: T`\(a_{${kk}}=S_{${kk}}-S_{${kk - 1}}=${S(kk)}-${S(kk - 1) < 0 ? `(${S(kk - 1)})` : S(kk - 1)}=${ans}\).`,
    };
  });

  /* ================================================================== */
  /* MODULE 2 · DERIVATIVES AND CALCULUS                                 */
  /* ================================================================== */
  def('deriv-poly', 'deriv', (r) => {
    const a = r.nz(-3, 3), b = r.int(-4, 4), c = r.int(-5, 5), d = r.int(-5, 5), kk = r.int(-2, 3);
    const fp = 3 * a * kk * kk + 2 * b * kk + c;
    const f = a * kk ** 3 + b * kk * kk + c * kk + d;
    return {
      q: T`If \(f(x)=${lc([[a, 'x^3'], [b, 'x^2'], [c, 'x'], [d, '']])}\), then \(f'(${kk})=\)`,
      correct: String(fp),
      wrong: [String(f), String(fp + d), String(a * kk * kk + b * kk + c), String(3 * a * kk + 2 * b + c)].concat(nb(fp)),
      sol: T`\(f'(x)=${lc([[3 * a, 'x^2'], [2 * b, 'x'], [c, '']])}\), so \(f'(${kk})=${fp}\).`,
    };
  });

  def('tangent-line', 'deriv', (r) => {
    let f, fp, tex;
    if (r.chance(0.5)) {
      const b = r.int(-3, 3);
      f = (x) => x ** 3 + b * x; fp = (x) => 3 * x * x + b; tex = lc([[1, 'x^3'], [b, 'x']]);
    } else {
      const a = r.nz(-2, 2), b = r.int(-3, 3), c = r.int(-3, 3);
      f = (x) => a * x * x + b * x + c; fp = (x) => 2 * a * x + b; tex = lc([[a, 'x^2'], [b, 'x'], [c, '']]);
    }
    const x0 = r.int(-2, 2);
    const m = fp(x0), y0 = f(x0);
    if (m === 0) throw new Error('horizontal');
    const correct = lineY(m, 1, y0 - m * x0, 1);
    return {
      q: T`The equation of the tangent line to \(y=${tex}\) at the point \((${x0},${y0})\) is`,
      correct,
      wrong: [lineY(m, 1, y0 + m * x0, 1), lineY(-m, 1, y0 + m * x0, 1), lineY(y0 || 1, 1, y0 - (y0 || 1) * x0, 1), lineY(m + 1, 1, y0 - (m + 1) * x0, 1)],
      sol: T`The slope is \(k=y'\big|_{x=${x0}}=${m}\). Point-slope form: \(y-${y0 < 0 ? `(${y0})` : y0}=${m}(x-${x0 < 0 ? `(${x0})` : x0})\), i.e. \(${correct}\).`,
    };
  });

  def('extremum', 'deriv', (r) => {
    const a = r.int(1, 3), d = r.int(-4, 4);
    const ask = r.pick(['maxv', 'minv', 'maxx', 'minx']);
    const vals = { maxv: 2 * a ** 3 + d, minv: d - 2 * a ** 3, maxx: -a, minx: a };
    const words = { maxv: 'local maximum value', minv: 'local minimum value', maxx: 'point of local maximum', minx: 'point of local minimum' };
    const correct = ask.endsWith('x') ? T`x=${vals[ask]}` : String(vals[ask]);
    const wrong = ask.endsWith('x') ? [T`x=${-vals[ask]}`, T`x=${a * a}`, T`x=${3 * a}`, T`x=0`] : [String(ask === 'maxv' ? vals.minv : vals.maxv), String(-vals[ask]), String(a ** 3 + d), String(vals[ask] + 1)];
    return {
      q: T`The ${words[ask]} of \(f(x)=${lc([[1, 'x^3'], [-3 * a * a, 'x'], [d, '']])}\) is`,
      correct,
      wrong,
      sol: T`\(f'(x)=3x^2-${3 * a * a}=3(x+${a})(x-${a})\). \(f\) increases on \((-\infty,-${a})\), decreases on \((-${a},${a})\), increases on \((${a},+\infty)\). Local max \(f(-${a})=${vals.maxv}\); local min \(f(${a})=${vals.minv}\).`,
    };
  });

  def('monotone-deriv', 'deriv', (r) => {
    const [p, q] = r.distinct(2, -3, 4).sort((x, y) => x - y);
    if (p + q === 0) throw new Error('symmetric');
    const e = r.int(-3, 3);
    const f = lc([[2, 'x^3'], [-3 * (p + q), 'x^2'], [6 * p * q, 'x'], [e, '']]);
    const dec = iv(p, q, false, false);
    const inc = iv(null, p, false, false) + T`\ \text{and}\ ` + iv(q, null, false);
    const dec2 = iv(-q, -p, false, false);
    const inc2 = iv(null, -q, false, false) + T`\ \text{and}\ ` + iv(-p, null, false);
    const askDec = r.chance(0.5);
    return {
      q: T`The ${askDec ? 'decreasing interval' : 'increasing interval(s)'} of \(f(x)=${f}\) ${askDec ? 'is' : 'are'}`,
      correct: askDec ? dec : inc,
      wrong: askDec ? [inc, dec2, inc2] : [dec, dec2, inc2],
      sol: T`\(f'(x)=6x^2${k(-6 * (p + q))}x${k(6 * p * q)}=6(${lin('x', p)})(${lin('x', q)})\). \(f'<0\) on \((${p},${q})\) and \(f'>0\) outside.`,
    };
  });

  def('deriv-elem', 'deriv', (r) => {
    const v = r.int(1, 3);
    if (v === 1) {
      const a = r.nz(-4, 4), b = r.nz(-3, 3), kk = r.int(1, 4);
      const correct = F(a + 2 * b * kk * kk, kk);
      return {
        q: T`If \(f(x)=${lc([[a, T`\ln x`], [b, 'x^2']])}\), then \(f'(${kk})=\)`,
        correct,
        wrong: [F(a * kk + 2 * b * kk, 1), F(a - 2 * b * kk * kk, kk), F(a + b * kk * kk, kk), F(2 * b * kk, 1)].concat(fnb(a + 2 * b * kk * kk, kk)),
        sol: T`\(f'(x)=\frac{${a}}{x}${k(2 * b)}x\), so \(f'(${kk})=${correct}\).`,
      };
    }
    if (v === 2) {
      const m = r.int(1, 4);
      return {
        q: T`If \(f(x)=x\ln x\), then \(f'(e^{${m}})=\)`,
        correct: String(m + 1),
        wrong: [String(m), T`e^{${m}}`, String(m + 2), T`${m}e^{${m}}`],
        sol: T`\(f'(x)=\ln x+x\cdot\frac1x=\ln x+1\), so \(f'(e^{${m}})=${m}+1=${m + 1}\).`,
      };
    }
    const a = r.nz(-4, 4), b = r.nz(-4, 4);
    const pt = r.pick([[0, '0'], [1, T`\frac{\pi}{2}`], [2, T`\pi`]]);
    const val = [a, -b, -a][pt[0]];
    return {
      q: T`If \(f(x)=${lc([[a, T`\sin x`], [b, T`\cos x`]])}\), then \(f'\left(${pt[1]}\right)=\)`,
      correct: String(val),
      wrong: [String(-val), String([b, a, -b][pt[0]]), String([-b, b, a][pt[0]]), String(a + b)].concat(nb(val)),
      sol: T`\(f'(x)=${lc([[a, T`\cos x`], [-b, T`\sin x`]])}\), so \(f'\left(${pt[1]}\right)=${val}\).`,
    };
  });

  def('limit-def', 'deriv', (r) => {
    const b = r.int(-4, 4), c = r.int(-3, 3), x0 = r.int(-2, 3);
    const d = 2 * x0 + b;
    if (d === 0) throw new Error('zero derivative');
    const v = r.int(1, 3);
    const num = [T`f(${x0}+\Delta x)-f(${x0})`, T`f(${x0}+2\Delta x)-f(${x0})`, T`f(${x0}-\Delta x)-f(${x0})`][v - 1];
    const vals = [d, 2 * d, -d];
    const val = vals[v - 1];
    const fx0 = x0 * x0 + b * x0 + c;
    return {
      q: T`Let \(f(x)=${lc([[1, 'x^2'], [b, 'x'], [c, '']])}\). Then \(\displaystyle\lim_{\Delta x\to0}\frac{${num}}{\Delta x}=\)`,
      correct: String(val),
      wrong: vals.filter((x) => x !== val).map(String).concat([F(d, 2), String(fx0), String(-2 * d)]),
      sol: T`By definition this equals ${['', '2', '-'][v - 1]}\(f'(${x0})\). \(f'(x)=2x${k(b)}\), \(f'(${x0})=${d}\), so the limit is \(${val}\).`,
    };
  });

  def('integral', 'deriv', (r) => {
    const v = r.int(1, 3);
    if (v === 1) {
      const a = r.nz(-2, 3), b = r.int(-3, 3), c = r.int(-3, 3), kk = r.int(1, 3);
      const N = 2 * a * kk ** 3 + 3 * b * kk * kk + 6 * c * kk;
      const correct = F(N, 6);
      return {
        q: T`\(\displaystyle\int_0^{${kk}}\left(${lc([[a, 'x^2'], [b, 'x'], [c, '']])}\right)dx=\)`,
        correct,
        wrong: [String(a * kk ** 3 + b * kk * kk + c * kk), String(2 * a * kk + b), F(N + 6 * c, 6), F(2 * a * kk ** 3 + 6 * b * kk * kk + 6 * c * kk, 6)].concat(fnb(N, 6)),
        sol: T`An antiderivative is \(F(x)=${lcf([[a, 3, 'x^3'], [b, 2, 'x^2'], [c, 1, 'x']])}\), so the integral is \(F(${kk})-F(0)=${correct}\).`,
      };
    }
    if (v === 2) {
      const m = r.int(1, 4);
      return {
        q: T`The area of the region enclosed by \(y=x^2\) and \(y=${m === 1 ? '' : m}x\) is`,
        correct: F(m ** 3, 6),
        wrong: [F(m ** 3, 3), F(m * m, 2), F(m ** 3, 2), F(m ** 3, 12)],
        sol: T`They meet at \(x=0\) and \(x=${m}\). Area \(=\int_0^{${m}}(${m === 1 ? '' : m}x-x^2)\,dx=\frac{${m}^3}{2}-\frac{${m}^3}{3}=${F(m ** 3, 6)}\).`,
      };
    }
    const m = r.int(1, 4);
    return {
      q: T`\(\displaystyle\int_1^{e^{${m}}}\frac{1}{x}\,dx=\)`,
      correct: String(m),
      wrong: [T`e^{${m}}-1`, String(m - 1), String(m + 1), F(1, m)],
      sol: T`\(\int\frac1x dx=\ln x\), so the value is \(\ln e^{${m}}-\ln1=${m}\).`,
    };
  });

  def('tangent-param', 'deriv', (r) => {
    if (r.chance(0.5)) {
      const x0 = r.int(1, 2), kk = r.int(-3, 8), c = r.int(-5, 5);
      const a = kk - 3 * x0 * x0;
      return {
        q: T`The tangent line to \(f(x)=x^3+ax\) at \(x=${x0}\) is parallel to the line \(${lineY(kk, 1, c, 1)}\). Then \(a=\)`,
        correct: String(a),
        wrong: [String(kk + 3 * x0 * x0), String(kk - 3 * x0), String(kk), String(kk - x0 ** 3)],
        sol: T`\(f'(x)=3x^2+a\), so \(f'(${x0})=${3 * x0 * x0}+a=${kk}\Rightarrow a=${a}\).`,
      };
    }
    const kk = r.int(-3, 7);
    return {
      q: T`The slope of the tangent line to \(f(x)=ax^2+\ln x\) at \(x=1\) is \(${kk}\). Then \(a=\)`,
      correct: F(kk - 1, 2),
      wrong: [F(kk + 1, 2), String(kk - 1), F(kk, 2), F(1 - kk, 2), String(kk + 1)],
      sol: T`\(f'(x)=2ax+\frac1x\), so \(f'(1)=2a+1=${kk}\Rightarrow a=${F(kk - 1, 2)}\).`,
    };
  });

  /* ================================================================== */
  /* MODULE 3 · LINES AND CIRCLES                                        */
  /* ================================================================== */
  def('inclination', 'lines', (r) => {
    const L = [['x-y', 45], ['x+y', 135], [T`\sqrt{3}x-y`, 60], [T`\sqrt{3}x+y`, 120], [T`x-\sqrt{3}y`, 30], [T`x+\sqrt{3}y`, 150]];
    const [tex, deg] = r.pick(L);
    const c = r.nz(-6, 6);
    const rad = r.chance(0.5);
    const fmt = (dd) => (rad ? P(dd, 180) : dd + T`^\circ`);
    const others = [180 - deg, 90 - deg > 0 ? 90 - deg : deg + 15, 30, 45, 60, 120, 135, 150].filter((x) => x !== deg);
    return {
      q: T`The angle of inclination of the line \(${tex}${k(c)}=0\) is`,
      correct: fmt(deg),
      wrong: others.map(fmt),
      sol: T`The slope is \(k=\tan\alpha=${{ 45: '1', 135: '-1', 60: T`\sqrt3`, 120: T`-\sqrt3`, 30: T`\frac{\sqrt3}{3}`, 150: T`-\frac{\sqrt3}{3}` }[deg]}\), and \(\alpha\in[0,\pi)\), so \(\alpha=${fmt(deg)}\).`,
    };
  });

  def('parallel-perp', 'lines', (r) => {
    const a = r.int(1, 4), b = r.nz(-4, 4), c = r.int(-6, 6);
    const x0 = r.int(-3, 3), y0 = r.int(-3, 3);
    if (gcd(gcd(a, b), c) > 1) throw new Error('reducible');
    if (a * x0 + b * y0 + c === 0) throw new Error('point on line');
    const par = r.chance(0.5);
    const Lpar = lineTex(a, b, -(a * x0 + b * y0));
    const Lper = lineTex(b, -a, a * y0 - b * x0);
    return {
      q: T`The line through \((${x0},${y0})\) that is ${par ? 'parallel' : 'perpendicular'} to \(${lineTex(a, b, c)}\) is`,
      correct: par ? Lpar : Lper,
      wrong: [par ? Lper : Lpar, lineTex(a, b, a * x0 + b * y0), lineTex(b, -a, -(a * y0 - b * x0)), lineTex(a, -b, -(a * x0 - b * y0)), lineTex(b, a, -(b * x0 + a * y0))],
      sol: par
        ? T`A parallel line has the same normal \((${a},${b})\): \(${a}(x-${x0 < 0 ? `(${x0})` : x0})+${b < 0 ? `(${b})` : b}(y-${y0 < 0 ? `(${y0})` : y0})=0\), i.e. \(${Lpar}\).`
        : T`A perpendicular line has direction \((${a},${b})\), so its normal is \((${b},${-a})\): \(${Lper}\).`,
    };
  });

  const NORMALS = [[3, 4], [4, 3], [3, -4], [5, 12], [12, -5], [1, 2], [2, -1], [1, 1], [1, -1], [1, 3], [2, 1]];
  def('point-line-dist', 'lines', (r) => {
    const [a, b] = r.pick(NORMALS);
    const c = r.int(-10, 10), x0 = r.int(-4, 4), y0 = r.int(-4, 4);
    const N = a * x0 + b * y0 + c, S = a * a + b * b;
    if (N === 0) throw new Error('on line');
    const N2 = a * x0 + b * y0 - c;
    return {
      q: T`The distance from the point \((${x0},${y0})\) to the line \(${lc([[a, 'x'], [b, 'y'], [c, '']])}=0\) is`,
      correct: R(Math.abs(N), S, S),
      wrong: [F(Math.abs(N), S), R(Math.abs(N2), S, S), String(Math.abs(N)), R(Math.abs(N) + 1, S, S)],
      sol: T`\(d=\frac{|Ax_0+By_0+C|}{\sqrt{A^2+B^2}}=\frac{|${N}|}{\sqrt{${S}}}=${R(Math.abs(N), S, S)}\).`,
      key: S2(T`Distance from \((x_0,y_0)\) to \(Ax+By+C=0\): \(d=\dfrac{|Ax_0+By_0+C|}{\sqrt{A^2+B^2}}\).`, T`ចម្ងាយពី \((x_0,y_0)\) ទៅបន្ទាត់ \(Ax+By+C=0\)៖ \(d=\dfrac{|Ax_0+By_0+C|}{\sqrt{A^2+B^2}}\)។`),
      steps: [
        S2(T`Here \(A=${a}\), \(B=${b}\), \(C=${c}\), \((x_0,y_0)=(${x0},${y0})\).`, T`នៅទីនេះ \(A=${a}\), \(B=${b}\), \(C=${c}\), \((x_0,y_0)=(${x0},${y0})\)។`),
        DM(T`d=\frac{|${a}\cdot${pr(x0)}+${pr(b)}\cdot${pr(y0)}+${pr(c)}|}{\sqrt{${pr(a)}^2+${pr(b)}^2}}=\frac{|${N}|}{\sqrt{${S}}}=${R(Math.abs(N), S, S)}`),
      ],
    };
  });

  def('parallel-lines-dist', 'lines', (r) => {
    const [a, b] = r.pick(NORMALS);
    const kk = r.pick([1, 2, 2]);
    const c1 = r.int(-8, 8), c2 = r.int(-12, 12);
    const D = Math.abs(kk * c1 - c2), S = a * a + b * b;
    if (D === 0) throw new Error('same line');
    return {
      q: T`The distance between the parallel lines \(${lc([[a, 'x'], [b, 'y'], [c1, '']])}=0\) and \(${lc([[kk * a, 'x'], [kk * b, 'y'], [c2, '']])}=0\) is`,
      correct: R(D, S, kk * S),
      wrong: [R(Math.abs(c1 - c2) || 1, S, S), R(D, S, S), F(D, kk * S), R(D, S, 2 * kk * S)],
      sol: kk === 1
        ? T`\(d=\frac{|C_1-C_2|}{\sqrt{A^2+B^2}}=\frac{${D}}{\sqrt{${S}}}=${R(D, S, S)}\).`
        : T`Rewrite the second line as \(${lc([[a, 'x'], [b, 'y']])}${c2 % 2 === 0 ? k(c2 / 2) : (c2 < 0 ? '-' : '+') + T`\frac{${Math.abs(c2)}}{2}`}=0\). Then \(d=\frac{|${c1}-(${F(c2, 2)})|}{\sqrt{${S}}}=${R(D, S, 2 * S)}\).`,
    };
  });

  def('circle-center', 'lines', (r) => {
    const h = r.int(-4, 4), kk = r.int(-4, 4), rad = r.int(2, 5);
    if (h === 0 && kk === 0) throw new Error('origin');
    const D = -2 * h, E = -2 * kk, Fc = h * h + kk * kk - rad * rad;
    const ch = (x, y, rr) => T`(${x},${y}),\ r=${rr}`;
    return {
      q: T`The centre and radius of the circle \(${lc([[1, 'x^2'], [1, 'y^2'], [D, 'x'], [E, 'y'], [Fc, '']])}=0\) are`,
      correct: ch(h, kk, rad),
      wrong: [ch(-h, -kk, rad), ch(h, kk, rad * rad), ch(-h, -kk, rad * rad), ch(kk, h, rad)],
      sol: T`Complete the squares: \(${sq('x', h)}+${sq('y', kk)}=${rad * rad}\). Centre \((${h},${kk})\), radius \(${rad}\).`,
      key: S2(T`Standard form \((x-a)^2+(y-b)^2=r^2\): centre \((a,b)\), radius \(r\).`, T`ទម្រង់ស្តង់ដារ \((x-a)^2+(y-b)^2=r^2\)៖ ផ្ចិត \((a,b)\) កាំ \(r\)។`),
      steps: [
        S2(T`Group the \(x\)-terms and the \(y\)-terms and complete each square:`, T`ដាក់តួ \(x\) ជាមួយគ្នា និងតួ \(y\) ជាមួយគ្នា រួចបំពេញការេនីមួយៗ៖`),
        ...(h ? [DM(T`${lc([[1, 'x^2'], [D, 'x']])}=${sq('x', h)}-${h * h}`)] : []),
        ...(kk ? [DM(T`${lc([[1, 'y^2'], [E, 'y']])}=${sq('y', kk)}-${kk * kk}`)] : []),
        S2(T`Substitute and move the constants to the right side:`, T`ជំនួស រួចផ្ទេរចំនួនថេរទៅអង្គខាងស្តាំ៖`),
        DM(T`${sq('x', h)}+${sq('y', kk)}=${h * h + kk * kk}${k(-Fc)}=${rad * rad}`),
        S2(T`So the centre is \((${h},${kk})\) and the radius is \(r=\sqrt{${rad * rad}}=${rad}\).`, T`ដូច្នេះ ផ្ចិតគឺ \((${h},${kk})\) ហើយកាំ \(r=\sqrt{${rad * rad}}=${rad}\)។`),
      ],
    };
  });

  def('line-circle', 'lines', (r) => {
    const h = r.int(-3, 3), kk = r.int(-3, 3), rad = r.int(1, 4);
    const [a, b] = r.pick([[3, 4], [4, 3], [3, -4], [4, -3]]);
    const cs = r.int(0, 2); // 0 intersect, 1 tangent, 2 separate
    const dist5 = cs === 1 ? 5 * rad : cs === 0 ? r.int(1, 5 * rad - 1) : 5 * rad + r.int(1, 6);
    const c = r.sign() * dist5 - a * h - b * kk;
    const ANS = ['Intersecting', 'Tangent', 'Separate (no common points)', 'Cannot be determined'];
    return {
      q: T`The positional relationship between the line \(${lc([[a, 'x'], [b, 'y'], [c, '']])}=0\) and the circle \(${sq('x', h)}+${sq('y', kk)}=${rad * rad}\) is`,
      math: false,
      correct: ANS[cs],
      wrong: ANS.filter((_, i) => i !== cs),
      sol: T`Distance from the centre \((${h},${kk})\) to the line: \(d=\frac{|${a * h + b * kk + c}|}{5}=${F(dist5, 5)}\); radius \(r=${rad}\). Since \(d${cs === 0 ? '<' : cs === 1 ? '=' : '>'}r\), the line and the circle are ${['intersecting', 'tangent', 'separate'][cs]}.`,
    };
  });

  def('chord-length', 'lines', (r) => {
    const rad = r.int(2, 6), d = r.int(1, rad - 1);
    const h = r.int(-3, 3), kk = r.int(-3, 3);
    const [a, b] = r.pick([[3, 4], [4, 3], [3, -4], [4, -3]]);
    const c = r.sign() * 5 * d - a * h - b * kk;
    const L = rad * rad - d * d;
    return {
      q: T`The line \(${lc([[a, 'x'], [b, 'y'], [c, '']])}=0\) cuts the circle \(${sq('x', h)}+${sq('y', kk)}=${rad * rad}\). The length of the chord is`,
      correct: R(2, L),
      wrong: [R(1, L), R(2, rad * rad + d * d), String(L), R(2, L + 1)],
      sol: T`\(d=\frac{|${a * h + b * kk + c}|}{5}=${d}\), so the chord length is \(2\sqrt{r^2-d^2}=2\sqrt{${rad * rad}-${d * d}}=${R(2, L)}\).`,
    };
  });

  /* ================================================================== */
  /* MODULE 3 · CONIC SECTIONS                                           */
  /* ================================================================== */
  const ELL = [[25, 16], [25, 9], [16, 12], [4, 3], [9, 5], [169, 144], [100, 64], [9, 8], [8, 4], [16, 7], [2, 1], [6, 2], [36, 20], [49, 40]];
  def('ellipse', 'conics', (r) => {
    const [A, B] = r.pick(ELL);
    const vert = r.chance(0.35);
    const eq = vert ? T`\frac{x^2}{${B}}+\frac{y^2}{${A}}=1` : T`\frac{x^2}{${A}}+\frac{y^2}{${B}}=1`;
    const ask = r.pick(['e', 'foci', 'axis']);
    const c = R(1, A - B), cw = R(1, A + B);
    const foc = (v) => (vert ? T`(0,\pm${v})` : T`(\pm${v},0)`);
    const focw = (v) => (vert ? T`(\pm${v},0)` : T`(0,\pm${v})`);
    if (ask === 'e')
      return {
        q: T`The eccentricity of the ellipse \(${eq}\) is`,
        correct: R(1, (A - B) * A, A),
        wrong: [R(1, B * A, A), R(1, (A - B) * B, B), F(A - B, A), R(1, (A + B) * A, A)],
        sol: T`\(a^2=${A}\), \(b^2=${B}\), \(c^2=a^2-b^2=${A - B}\). \(e=\frac{c}{a}=\frac{${c}}{${R(1, A)}}=${R(1, (A - B) * A, A)}\).`,
      };
    if (ask === 'foci')
      return {
        q: T`The coordinates of the foci of the ellipse \(${eq}\) are`,
        correct: foc(c),
        wrong: [focw(c), foc(cw), foc(R(1, A)), focw(cw)],
        sol: T`The major axis is on the \(${vert ? 'y' : 'x'}\)-axis; \(c^2=${A}-${B}=${A - B}\), so the foci are \(${foc(c)}\).`,
      };
    return {
      q: T`The length of the major axis of the ellipse \(${eq}\) is`,
      correct: R(2, A),
      wrong: [R(2, B), R(1, A), R(2, A - B), String(2 * A)],
      sol: T`\(a^2=${A}\Rightarrow a=${R(1, A)}\); the major axis has length \(2a=${R(2, A)}\).`,
    };
  });

  const HYP = [[4, 9], [9, 16], [16, 9], [1, 3], [3, 1], [4, 12], [9, 7], [1, 1], [16, 20], [4, 5], [2, 2], [5, 4]];
  def('hyperbola', 'conics', (r) => {
    const [A, B] = r.pick(HYP);
    const vert = r.chance(0.35);
    const eq = vert ? T`\frac{y^2}{${A}}-\frac{x^2}{${B}}=1` : T`\frac{x^2}{${A}}-\frac{y^2}{${B}}=1`;
    const slope = vert ? R(1, A * B, B) : R(1, A * B, A);
    const slopeW = vert ? R(1, A * B, A) : R(1, A * B, B);
    const asy = (s) => (s === '1' ? T`y=\pm x` : T`y=\pm${s}x`);
    if (r.chance(0.5) && slope !== slopeW)
      return {
        q: T`The asymptotes of the hyperbola \(${eq}\) are`,
        correct: asy(slope),
        wrong: [asy(slopeW), asy(F(vert ? A : B, vert ? B : A)), asy(R(1, (A + B) * A, A)), asy(F(vert ? B : A, vert ? A : B))],
        sol: vert
          ? T`For \(\frac{y^2}{a^2}-\frac{x^2}{b^2}=1\) the asymptotes are \(y=\pm\frac{a}{b}x\): \(${asy(slope)}\).`
          : T`For \(\frac{x^2}{a^2}-\frac{y^2}{b^2}=1\) the asymptotes are \(y=\pm\frac{b}{a}x\): \(${asy(slope)}\).`,
      };
    const e = R(1, (A + B) * A, A);
    return {
      q: T`The eccentricity of the hyperbola \(${eq}\) is`,
      correct: e,
      wrong: [R(1, (A + B) * B, B), A > B ? R(1, (A - B) * A, A) : R(1, (B - A) * B, B), F(A + B, A), R(1, A * B, A)],
      sol: T`\(a^2=${A}\), \(b^2=${B}\), \(c^2=a^2+b^2=${A + B}\). \(e=\frac{c}{a}=${e}\).`,
    };
  });

  def('parabola', 'conics', (r) => {
    const v = r.int(1, 3);
    const askF = r.chance(0.55);
    if (v === 3) {
      const a = r.pick([[1, 2], [1, 4], [2, 1], [1, 8], [-1, 4], [4, 1], [1, 1]]);
      const [an, ad] = a; // y = (an/ad) x^2  -> x^2 = (ad/an) y, focus (0, ad/(4an))
      const fy = F(ad, 4 * an);
      return {
        q: T`The ${askF ? 'focus' : 'directrix'} of the parabola \(y=${coefX(an, ad, 'x^2')}\) ${askF ? 'is' : 'is the line'}`,
        correct: askF ? T`(0,${fy})` : T`y=${F(-ad, 4 * an)}`,
        wrong: askF ? [T`(${fy},0)`, T`(0,${F(an, 4 * ad)})`, T`(0,${F(ad, 2 * an)})`, T`(0,${F(-ad, 4 * an)})`] : [T`y=${fy}`, T`y=${F(-an, 4 * ad)}`, T`x=${F(-ad, 4 * an)}`, T`y=${F(-ad, 2 * an)}`],
        sol: T`Rewrite as \(x^2=${F(ad, an)}y\). For \(x^2=2py\): \(2p=${F(ad, an)}\), focus \(\left(0,\frac p2\right)=\left(0,${fy}\right)\), directrix \(y=-\frac p2=${F(-ad, 4 * an)}\).`,
      };
    }
    const m = r.pick([2, 4, 6, 8, 12, 16, -4, -8, 1, 3]);
    const onX = v === 1;
    const eq = onX ? T`y^2=${coefX(m, 1, 'x')}` : T`x^2=${coefX(m, 1, 'y')}`;
    const fv = F(m, 4);
    const focus = onX ? T`(${fv},0)` : T`(0,${fv})`;
    const dir = onX ? T`x=${F(-m, 4)}` : T`y=${F(-m, 4)}`;
    return {
      q: T`The ${askF ? 'focus' : 'directrix'} of the parabola \(${eq}\) ${askF ? 'is' : 'is the line'}`,
      correct: askF ? focus : dir,
      wrong: askF
        ? [onX ? T`(0,${fv})` : T`(${fv},0)`, onX ? T`(${F(m, 2)},0)` : T`(0,${F(m, 2)})`, onX ? T`(${F(-m, 4)},0)` : T`(0,${F(-m, 4)})`, onX ? T`(${m},0)` : T`(0,${m})`]
        : [onX ? T`y=${F(-m, 4)}` : T`x=${F(-m, 4)}`, onX ? T`x=${fv}` : T`y=${fv}`, onX ? T`x=${F(-m, 2)}` : T`y=${F(-m, 2)}`, onX ? T`x=${-m}` : T`y=${-m}`],
      sol: T`Compare with \(${onX ? 'y^2=2px' : 'x^2=2py'}\): \(2p=${m}\), \(\frac p2=${fv}\). Focus \(${focus}\), directrix \(${dir}\).`,
    };
  });

  def('parabola-focal', 'conics', (r) => {
    const m = r.pick([4, 8, 12, 16, 2, 6]);
    const t = r.int(1, 8);
    const onX = r.chance(0.6);
    const eq = onX ? T`y^2=${m}x` : T`x^2=${m}y`;
    const ans = F(4 * t + m, 4);
    return {
      q: T`Point \(P\) lies on the parabola \(${eq}\) and its ${onX ? 'x' : 'y'}-coordinate is \(${t}\). The distance from \(P\) to the focus is`,
      correct: ans,
      wrong: [String(t), F(2 * t + m, 2), String(t + m), F(Math.abs(4 * t - m) || 1, 4)],
      sol: T`By the definition of a parabola, \(|PF|\) equals the distance to the directrix: \(|PF|=${t}+\frac{p}{2}=${t}+${F(m, 4)}=${ans}\).`,
    };
  });

  const ELL2 = [[25, 16, 3], [25, 9, 4], [169, 144, 5], [169, 25, 12], [100, 64, 6], [100, 36, 8], [4, 3, 1], [9, 5, 2], [16, 12, 2], [36, 20, 4], [49, 40, 3]];
  def('ellipse-focal', 'conics', (r) => {
    const [A2, B2, c] = r.pick(ELL2);
    const a = Math.round(Math.sqrt(A2));
    const eq = T`\frac{x^2}{${A2}}+\frac{y^2}{${B2}}=1`;
    if (r.chance(0.5)) {
      return {
        q: T`\(F_1,F_2\) are the foci of the ellipse \(${eq}\). A line through \(F_1\) meets the ellipse at \(A\) and \(B\). The perimeter of \(\triangle ABF_2\) is`,
        correct: String(4 * a),
        wrong: [String(2 * a), String(2 * a + 2 * c), String(4 * c), String(4 * a + 2 * c)],
        sol: T`\(|AF_1|+|AF_2|=|BF_1|+|BF_2|=2a=${2 * a}\), so the perimeter is \(4a=${4 * a}\).`,
      };
    }
    return {
      q: T`\(P\) is a point on the ellipse \(${eq}\), and \(F_1,F_2\) are its foci. The perimeter of \(\triangle PF_1F_2\) is`,
      correct: String(2 * a + 2 * c),
      wrong: [String(2 * a), String(4 * a), String(2 * a + c), String(4 * a + 2 * c)],
      sol: T`\(|PF_1|+|PF_2|=2a=${2 * a}\) and \(|F_1F_2|=2c=${2 * c}\) (\(c^2=${A2}-${B2}\)). Perimeter \(=${2 * a + 2 * c}\).`,
    };
  });

  def('ellipse-eq', 'conics', (r) => {
    const [A2, B2, c] = r.pick(ELL2);
    const a = Math.round(Math.sqrt(A2));
    const vert = r.chance(0.35);
    const E = (p, q) => (vert ? T`\frac{x^2}{${q}}+\frac{y^2}{${p}}=1` : T`\frac{x^2}{${p}}+\frac{y^2}{${q}}=1`);
    const Ew = (p, q) => (vert ? T`\frac{x^2}{${p}}+\frac{y^2}{${q}}=1` : T`\frac{x^2}{${q}}+\frac{y^2}{${p}}=1`);
    const foci = vert ? T`(0,\pm${c})` : T`(\pm${c},0)`;
    return {
      q: T`An ellipse has foci \(${foci}\) and major axis of length \(${2 * a}\). Its standard equation is`,
      correct: E(A2, B2),
      wrong: [Ew(A2, B2), E(A2, A2 + c * c), E(4 * A2, 4 * A2 - c * c), Ew(A2, A2 + c * c)],
      sol: T`\(2a=${2 * a}\Rightarrow a^2=${A2}\); \(c=${c}\Rightarrow b^2=a^2-c^2=${B2}\). The foci are on the \(${vert ? 'y' : 'x'}\)-axis, so the equation is \(${E(A2, B2)}\).`,
    };
  });

  /* ================================================================== */
  /* MODULE 3 · VECTORS                                                  */
  /* ================================================================== */
  const vt = (x, y) => `(${x},${y})`;
  def('vec-dot', 'vectors', (r) => {
    const x1 = r.nz(-4, 4), y1 = r.int(-4, 4), x2 = r.int(-4, 4), y2 = r.nz(-4, 4);
    const v = r.int(1, 4);
    const pre = T`Given \(\vec a=${vt(x1, y1)}\) and \(\vec b=${vt(x2, y2)}\), `;
    const VKEY = S2(T`For \(\vec a=(x_1,y_1)\), \(\vec b=(x_2,y_2)\): \(\vec a\cdot\vec b=x_1x_2+y_1y_2\) and \(|\vec a|=\sqrt{x_1^2+y_1^2}\).`, T`ចំពោះ \(\vec a=(x_1,y_1)\), \(\vec b=(x_2,y_2)\)៖ \(\vec a\cdot\vec b=x_1x_2+y_1y_2\) និង \(|\vec a|=\sqrt{x_1^2+y_1^2}\)។`);
    if (v === 1) {
      const d = x1 * x2 + y1 * y2;
      return { q: pre + T`\(\vec a\cdot\vec b=\)`, correct: String(d), wrong: [String(x1 * x2 - y1 * y2), String(x1 * y2 + x2 * y1), String(-d)].concat(nb(d)), sol: T`\(\vec a\cdot\vec b=x_1x_2+y_1y_2=${x1 * x2}${k(y1 * y2)}=${d}\).`, key: VKEY,
        steps: [DM(T`\vec a\cdot\vec b=x_1x_2+y_1y_2=${x1}\cdot${pr(x2)}+${pr(y1)}\cdot${pr(y2)}=${x1 * x2}${k(y1 * y2)}=${d}`)] };
    }
    if (v === 2) {
      const sx = x1 + x2, sy = y1 + y2, d = sx * x1 + sy * y1;
      return { q: pre + T`\((\vec a+\vec b)\cdot\vec a=\)`, correct: String(d), wrong: [String(sx * x2 + sy * y2), String(x1 * x2 + y1 * y2), String(x1 * x1 + y1 * y1)].concat(nb(d)), sol: T`\(\vec a+\vec b=${vt(sx, sy)}\), so \((\vec a+\vec b)\cdot\vec a=${sx * x1}${k(sy * y1)}=${d}\).`, key: VKEY,
        steps: [
          S2(T`First add the vectors:`, T`ដំបូង បូកវ៉ិចទ័រ៖`),
          DM(T`\vec a+\vec b=(${x1}+${pr(x2)},\ ${y1}+${pr(y2)})=${vt(sx, sy)}`),
          S2(T`Then take the dot product with \(\vec a=${vt(x1, y1)}\):`, T`បន្ទាប់មក គណនាផលគុណស្កាលែជាមួយ \(\vec a=${vt(x1, y1)}\)៖`),
          DM(T`(\vec a+\vec b)\cdot\vec a=${sx}\cdot${pr(x1)}+${pr(sy)}\cdot${pr(y1)}=${sx * x1}${k(sy * y1)}=${d}`),
        ] };
    }
    if (v === 3) {
      const ux = 2 * x1 - x2, uy = 2 * y1 - y2, d = ux * x2 + uy * y2;
      return { q: pre + T`\((2\vec a-\vec b)\cdot\vec b=\)`, correct: String(d), wrong: [String(ux * x1 + uy * y1), String((2 * x1 + x2) * x2 + (2 * y1 + y2) * y2), String(2 * (x1 * x2 + y1 * y2))].concat(nb(d)), sol: T`\(2\vec a-\vec b=${vt(ux, uy)}\), so the dot product is \(${ux * x2}${k(uy * y2)}=${d}\).`, key: VKEY,
        steps: [
          S2(T`First compute \(2\vec a-\vec b\):`, T`ដំបូង គណនា \(2\vec a-\vec b\)៖`),
          DM(T`2\vec a-\vec b=(${2 * x1}-${pr(x2)},\ ${2 * y1}-${pr(y2)})=${vt(ux, uy)}`),
          S2(T`Then take the dot product with \(\vec b=${vt(x2, y2)}\):`, T`បន្ទាប់មក គណនាផលគុណស្កាលែជាមួយ \(\vec b=${vt(x2, y2)}\)៖`),
          DM(T`(2\vec a-\vec b)\cdot\vec b=${ux}\cdot${pr(x2)}+${pr(uy)}\cdot${pr(y2)}=${ux * x2}${k(uy * y2)}=${d}`),
        ] };
    }
    const dx = x1 - x2, dy = y1 - y2, S = dx * dx + dy * dy;
    if (S === 0) throw new Error('zero');
    return { q: pre + T`\(|\vec a-\vec b|=\)`, correct: R(1, S), wrong: [String(S), R(1, (x1 + x2) ** 2 + (y1 + y2) ** 2), R(1, S + 2), String(Math.abs(dx) + Math.abs(dy))], sol: T`\(\vec a-\vec b=${vt(dx, dy)}\), \(|\vec a-\vec b|=\sqrt{${dx * dx}+${dy * dy}}=${R(1, S)}\).`, key: VKEY,
      steps: [
        S2(T`First subtract the vectors:`, T`ដំបូង ដកវ៉ិចទ័រ៖`),
        DM(T`\vec a-\vec b=(${x1}-${pr(x2)},\ ${y1}-${pr(y2)})=${vt(dx, dy)}`),
        S2(T`Then use \(|\vec v|=\sqrt{x^2+y^2}\):`, T`បន្ទាប់មក ប្រើ \(|\vec v|=\sqrt{x^2+y^2}\)៖`),
        DM(T`|\vec a-\vec b|=\sqrt{${pr(dx)}^2+${pr(dy)}^2}=\sqrt{${S}}${R(1, S) === T`\sqrt{${S}}` ? '' : '=' + R(1, S)}`),
      ] };
  });

  def('vec-param', 'vectors', (r) => {
    const y1 = r.nz(-4, 4), x2 = r.nz(-4, 4), y2 = r.nz(-4, 4);
    const perp = r.chance(0.5);
    const mPerp = F(-y1 * y2, x2), mPar = F(y1 * x2, y2);
    if (mPerp === mPar) throw new Error('same');
    return {
      q: T`Given \(\vec a=(m,${y1})\) and \(\vec b=${vt(x2, y2)}\). If \(\vec a${perp ? T`\perp` : T`\parallel`}\vec b\), then \(m=\)`,
      correct: perp ? mPerp : mPar,
      wrong: [perp ? mPar : mPerp, F(y1 * y2, x2), F(-y1 * x2, y2), F(x2, y1 * y2)],
      sol: perp
        ? T`\(\vec a\perp\vec b\iff\vec a\cdot\vec b=0\): \(${lc([[x2, 'm'], [y1 * y2, '']])}=0\Rightarrow m=${mPerp}\).`
        : T`\(\vec a\parallel\vec b\iff x_1y_2-x_2y_1=0\): \(${lc([[y2, 'm'], [-x2 * y1, '']])}=0\Rightarrow m=${mPar}\).`,
    };
  });

  const ANG = [[1, 6], [1, 4], [1, 3], [1, 2], [2, 3], [3, 4], [5, 6]];
  def('vec-angle', 'vectors', (r) => {
    const v = r.int(1, 3);
    let q, ans, sol;
    if (v === 1) {
      const m = r.int(1, 5), n = 2 * r.int(1, 3);
      const obtuse = r.chance(0.5);
      ans = obtuse ? [2, 3] : [1, 3];
      q = T`Given \(|\vec a|=${m}\), \(|\vec b|=${n}\) and \(\vec a\cdot\vec b=${obtuse ? -(m * n) / 2 : (m * n) / 2}\), the angle between \(\vec a\) and \(\vec b\) is`;
      sol = T`\(\cos\theta=\frac{\vec a\cdot\vec b}{|\vec a||\vec b|}=${obtuse ? T`-\frac12` : T`\frac12`}\), so \(\theta=${P(...ans)}\).`;
    } else if (v === 2) {
      const m = r.int(1, 4), kk = r.int(1, 3);
      const obtuse = r.chance(0.5);
      ans = obtuse ? [3, 4] : [1, 4];
      q = T`Given \(|\vec a|=${m}\), \(|\vec b|=${R(kk, 2)}\) and \(\vec a\cdot\vec b=${obtuse ? -m * kk : m * kk}\), the angle between \(\vec a\) and \(\vec b\) is`;
      sol = T`\(\cos\theta=\frac{${obtuse ? -m * kk : m * kk}}{${m}\cdot${R(kk, 2)}}=${obtuse ? T`-\frac{\sqrt2}{2}` : T`\frac{\sqrt2}{2}`}\), so \(\theta=${P(...ans)}\).`;
    } else {
      const m = r.int(1, 4);
      const minus = r.chance(0.5);
      ans = minus ? [1, 3] : [2, 3];
      q = T`Given \(|\vec a|=${m}\), \(|\vec b|=${2 * m}\) and \((\vec a${minus ? '-' : '+'}\vec b)\perp\vec a\), the angle between \(\vec a\) and \(\vec b\) is`;
      sol = T`\((\vec a${minus ? '-' : '+'}\vec b)\cdot\vec a=0\Rightarrow\vec a\cdot\vec b=${minus ? '' : '-'}|\vec a|^2=${minus ? m * m : -m * m}\). \(\cos\theta=\frac{${minus ? m * m : -m * m}}{${m}\cdot${2 * m}}=${minus ? T`\frac12` : T`-\frac12`}\), so \(\theta=${P(...ans)}\).`;
    }
    const correct = P(...ans);
    const sup = P(ans[1] - ans[0], ans[1]);
    return { q, correct, wrong: [sup].concat(r.shuffle(ANG.map((a) => P(...a)))), sol };
  });

  def('vec-magnitude', 'vectors', (r) => {
    const m = r.int(1, 5), n = r.int(1, 5);
    const th = r.pick([[1, 3, 1], [2, 3, -1], [1, 2, 0]]); // [num, den, 2cos]
    const plus = r.chance(0.5);
    const S = m * m + n * n + (plus ? 1 : -1) * m * n * th[2];
    const Sw = m * m + n * n - (plus ? 1 : -1) * m * n * th[2];
    if (S <= 0) throw new Error('nonpositive');
    return {
      q: T`Given \(|\vec a|=${m}\), \(|\vec b|=${n}\) and the angle between them is \(${P(th[0], th[1])}\), then \(|\vec a${plus ? '+' : '-'}\vec b|=\)`,
      correct: R(1, S),
      wrong: [R(1, Sw), String(plus ? m + n : Math.abs(m - n) || m + n), R(1, m * m + n * n), String(S), R(1, S + 1)],
      sol: T`\(|\vec a${plus ? '+' : '-'}\vec b|^2=|\vec a|^2${plus ? '+' : '-'}2\vec a\cdot\vec b+|\vec b|^2=${m * m}${plus ? '+' : '-'}${th[2] < 0 ? `(${m * n * th[2]})` : m * n * th[2]}+${n * n}=${S}\), so the answer is \(${R(1, S)}\).`,
    };
  });

  def('vec-coords', 'vectors', (r) => {
    const x1 = r.int(-4, 4), y1 = r.int(-4, 4), x2 = r.int(-4, 4), y2 = r.int(-4, 4);
    const p = r.pick([1, 2, 3]), q = r.pick([1, 2, 3, -1, -2]);
    const res = vt(p * x1 + q * x2, p * y1 + q * y2);
    return {
      q: T`Given \(\vec a=${vt(x1, y1)}\) and \(\vec b=${vt(x2, y2)}\), then \(${lc([[p, T`\vec a`], [q, T`\vec b`]])}=\)`,
      correct: res,
      wrong: [vt(p * x1 - q * x2, p * y1 - q * y2), vt(p * y1 + q * y2, p * x1 + q * x2), vt(p * x1 + q * x2, p * y1 - q * y2), vt(q * x1 + p * x2, q * y1 + p * y2), vt(p * x1 + q * x2 + 1, p * y1 + q * y2)],
      sol: T`Work component by component: \((${p * x1}${k(q * x2)},\ ${p * y1}${k(q * y2)})=${res}\).`,
      key: S2(T`Vectors are added and multiplied by numbers coordinate by coordinate: \(p\vec a+q\vec b=(px_1+qx_2,\ py_1+qy_2)\).`, T`វ៉ិចទ័រត្រូវបូក និងគុណនឹងចំនួន តាមកូអរដោនេនីមួយៗ៖ \(p\vec a+q\vec b=(px_1+qx_2,\ py_1+qy_2)\)។`),
      steps: [
        S2('Multiply each vector by its number:', 'គុណវ៉ិចទ័រនីមួយៗនឹងចំនួនរបស់វា៖'),
        DM(T`${lc([[p, T`\vec a`]])}=${vt(p * x1, p * y1)},\qquad ${lc([[q, T`\vec b`]])}=${vt(q * x2, q * y2)}`),
        S2('Add the coordinates:', 'បូកកូអរដោនេ៖'),
        DM(T`${lc([[p, T`\vec a`], [q, T`\vec b`]])}=(${p * x1}${k(q * x2)},\ ${p * y1}${k(q * y2)})=${res}`),
      ],
    };
  });

  /* ================================================================== */
  /* MODULE 3 · COMPLEX NUMBERS                                          */
  /* ================================================================== */
  def('complex-mult', 'complex', (r) => {
    const a = r.int(-4, 4), b = r.nz(-4, 4), c = r.int(-4, 4), d = r.nz(-4, 4);
    const re = a * c - b * d, im = a * d + b * c;
    return {
      q: T`\((${cTex(a, b)})(${cTex(c, d)})=\)`,
      correct: cTex(re, im),
      wrong: [cTex(a * c + b * d, im), cTex(re, -im), cTex(im, re), cTex(-re, im), cTex(re + 1, im)],
      sol: T`Expand and use \(i^2=-1\): \(${lc([[a * c, ''], [a * d, 'i'], [b * c, 'i'], [-b * d, '']])}=${cTex(re, im)}\).`,
    };
  });

  def('complex-div', 'complex', (r) => {
    const e = r.int(-3, 3), f = r.nz(-3, 3), c = r.nz(-3, 3), d = r.nz(-3, 3);
    const ure = e * c - f * d, uim = e * d + f * c;
    return {
      q: T`\(\dfrac{${cTex(ure, uim)}}{${cTex(c, d)}}=\)`,
      correct: cTex(e, f),
      wrong: [cTex(e, -f), cTex(f, e), cTex(-e, f), cTex(-f, -e), cTex(e + 1, f)],
      sol: T`Multiply numerator and denominator by the conjugate \(${cTex(c, -d)}\): the denominator becomes \(${c * c + d * d}\) and the result is \(${cTex(e, f)}\).`,
    };
  });

  def('complex-mod', 'complex', (r) => {
    const e = r.int(-4, 4), f = r.nz(-4, 4), c = r.nz(-3, 3), d = r.nz(-3, 3);
    const ure = e * c - f * d, uim = e * d + f * c;
    const z2 = e * e + f * f, u2 = ure * ure + uim * uim, w2 = c * c + d * d;
    return {
      q: T`If the complex number \(z\) satisfies \(z(${cTex(c, d)})=${cTex(ure, uim)}\), then \(|z|=\)`,
      correct: R(1, z2),
      wrong: [String(z2), R(1, u2), R(1, w2), R(1, z2 + 1), R(1, u2 * w2)],
      sol: T`\(|z|\cdot|${cTex(c, d)}|=|${cTex(ure, uim)}|\Rightarrow |z|=\frac{\sqrt{${u2}}}{\sqrt{${w2}}}=\sqrt{${z2}}=${R(1, z2)}\).`,
    };
  });

  def('complex-quadrant', 'complex', (r) => {
    const v = r.int(1, 3);
    let q, re, im, work;
    if (v === 1) {
      const a = r.int(-4, 4), b = r.nz(-4, 4), c = r.nz(-3, 3), d = r.nz(-3, 3);
      const D = c * c + d * d;
      re = (a * c + b * d) / D; im = (b * c - a * d) / D;
      q = T`\(z=\dfrac{${cTex(a, b)}}{${cTex(c, d)}}\)`;
      work = T`\(z=\frac{(${cTex(a, b)})(${cTex(c, -d)})}{${D}}=${F(a * c + b * d, D)}${(b * c - a * d) / D < 0 ? '' : '+'}${F(b * c - a * d, D)}i\)`;
    } else if (v === 2) {
      const a = r.nz(-4, 4), b = r.nz(-4, 4);
      re = -b; im = a;
      q = T`\(z=i(${cTex(a, b)})\)`;
      work = T`\(z=${cTex(a, 0)}i+${b < 0 ? `(${b})` : b}i^2=${cTex(-b, a)}\)`;
    } else {
      const a = r.nz(-3, 3), b = r.nz(-3, 3);
      re = a * a - b * b; im = 2 * a * b;
      q = T`\(z=(${cTex(a, b)})^2\)`;
      work = T`\(z=${a * a}${k(2 * a * b)}i${k(-b * b)}=${cTex(re, im)}\)`;
    }
    if (re === 0 || im === 0) throw new Error('on axis');
    const quad = re > 0 ? (im > 0 ? 0 : 3) : im > 0 ? 1 : 2;
    return {
      q: T`In the complex plane, the point corresponding to ${q} lies in the`,
      math: false,
      correct: QUAD[quad],
      wrong: QUAD.filter((_, i) => i !== quad),
      sol: work + T`. Real part ${re > 0 ? 'positive' : 'negative'}, imaginary part ${im > 0 ? 'positive' : 'negative'}: ${QUAD[quad].toLowerCase()}.`,
    };
  });

  def('complex-power', 'complex', (r) => {
    const v = r.int(1, 3);
    const IP = ['1', 'i', '-1', '-i'];
    if (v === 1) {
      const n = r.int(5, 2030);
      return { q: T`\(i^{${n}}=\)`, correct: IP[n % 4], wrong: IP.filter((_, i) => i !== n % 4), sol: T`\(i^4=1\) and \(${n}=4\cdot${Math.floor(n / 4)}+${n % 4}\), so \(i^{${n}}=i^{${n % 4}}=${IP[n % 4]}\).` };
    }
    if (v === 2) {
      const n = r.int(2, 2030);
      return { q: T`\(\left(\dfrac{1+i}{1-i}\right)^{${n}}=\)`, correct: IP[n % 4], wrong: IP.filter((_, i) => i !== n % 4), sol: T`\(\frac{1+i}{1-i}=\frac{(1+i)^2}{2}=i\), so the value is \(i^{${n}}=${IP[n % 4]}\).` };
    }
    const kk = r.int(1, 4);
    const vals = ['2i', '-4', '-8i', '16'];
    const w = ['-2i', '-4', '8i', '16'];
    const neg = ['-2i', '4', '8i', '-16'];
    return {
      q: T`\((1+i)^{${2 * kk}}=\)`,
      correct: vals[kk - 1],
      wrong: [w[kk - 1], neg[kk - 1], String(2 ** kk), String(-(2 ** kk)), cTex(0, 2 ** kk)],
      sol: T`\((1+i)^2=2i\), so \((1+i)^{${2 * kk}}=(2i)^{${kk}}=${vals[kk - 1]}\).`,
    };
  });

  def('complex-pure', 'complex', (r) => {
    if (r.chance(0.5)) {
      const s = r.int(1, 4), q = r.sign() * s;
      return {
        q: T`If \(z=(m^2-${s * s})+(${lin('m', q)})i\) is a purely imaginary number, then the real number \(m=\)`,
        correct: String(-q),
        wrong: [String(q), T`\pm${s}`, '0', String(s * s)],
        sol: T`Purely imaginary: real part \(m^2-${s * s}=0\) and imaginary part \(${lin('m', q)}\ne0\). So \(m=\pm${s}\) but \(m\ne${q}\): \(m=${-q}\).`,
      };
    }
    const kk = r.int(1, 4);
    const den = r.pick(['1+i', '1-i']);
    const real = r.chance(0.4);
    // (a + k i)/(1+i) = ((a+k) + (k-a)i)/2 ; (a+ki)/(1-i) = ((a-k) + (a+k)i)/2
    let ans;
    if (den === '1+i') ans = real ? kk : -kk;
    else ans = real ? -kk : kk;
    return {
      q: T`If \(\dfrac{a+${kk === 1 ? '' : kk}i}{${den}}\) is a ${real ? 'real' : 'purely imaginary'} number, then the real number \(a=\)`,
      correct: String(ans),
      wrong: [String(-ans), '0', String(2 * ans), String(ans + 1)],
      sol: den === '1+i'
        ? T`\(\frac{(a+${kk}i)(1-i)}{2}=\frac{(a+${kk})+(${kk}-a)i}{2}\). ${real ? T`Real: \(${kk}-a=0\)` : T`Purely imaginary: \(a+${kk}=0\)`}, so \(a=${ans}\).`
        : T`\(\frac{(a+${kk}i)(1+i)}{2}=\frac{(a-${kk})+(a+${kk})i}{2}\). ${real ? T`Real: \(a+${kk}=0\)` : T`Purely imaginary: \(a-${kk}=0\)`}, so \(a=${ans}\).`,
    };
  });

  /* ================================================================== */
  /* MODULE 3 · SOLID GEOMETRY                                           */
  /* ================================================================== */
  def('volume', 'solid', (r) => {
    const v = r.int(1, 5);
    if (v === 1) {
      const rr = r.int(1, 5), h = r.int(1, 8);
      return { q: T`A cylinder has base radius \(${rr}\) and height \(${h}\). Its volume is`, correct: P(rr * rr * h), wrong: [P(rr * rr * h, 3), P(2 * rr * h), P(4 * rr * rr * h), P(2 * rr * rr * h)], sol: T`\(V=\pi r^2h=\pi\cdot${rr * rr}\cdot${h}=${P(rr * rr * h)}\).`,
        key: S2(T`Volume of a cylinder: \(V=\pi r^2h\) (base area \(\times\) height).`, T`មាឌស៊ីឡាំង៖ \(V=\pi r^2h\) (ក្រឡាផ្ទៃបាត \(\times\) កម្ពស់)។`),
        steps: [S2(T`Here \(r=${rr}\), \(h=${h}\):`, T`នៅទីនេះ \(r=${rr}\), \(h=${h}\)៖`), DM(T`V=\pi r^2h=\pi\cdot${rr}^2\cdot${h}=\pi\cdot${rr * rr}\cdot${h}=${P(rr * rr * h)}`)] };
    }
    if (v === 2) {
      const rr = r.int(1, 6), h = r.int(1, 9);
      return { q: T`A cone has base radius \(${rr}\) and height \(${h}\). Its volume is`, correct: P(rr * rr * h, 3), wrong: [P(rr * rr * h), P(rr * h, 3), P(4 * rr * rr * h, 3), P(rr * rr * h, 2)], sol: T`\(V=\frac13\pi r^2h=\frac13\pi\cdot${rr * rr}\cdot${h}=${P(rr * rr * h, 3)}\).`,
        key: S2(T`Volume of a cone: \(V=\frac13\pi r^2h\).`, T`មាឌកោណ៖ \(V=\frac13\pi r^2h\)។`),
        steps: [S2(T`Here \(r=${rr}\), \(h=${h}\):`, T`នៅទីនេះ \(r=${rr}\), \(h=${h}\)៖`), DM(T`V=\frac13\pi r^2h=\frac13\pi\cdot${rr}^2\cdot${h}=\frac{${rr * rr * h}\pi}{3}${F(rr * rr * h, 3) === T`\frac{${rr * rr * h}}{3}` ? '' : '=' + P(rr * rr * h, 3)}`)] };
    }
    if (v === 3) {
      const rr = r.int(1, 6);
      return { q: T`The volume of a sphere with radius \(${rr}\) is`, correct: P(4 * rr ** 3, 3), wrong: [P(4 * rr * rr), P(rr ** 3), P(4 * rr ** 3), P(2 * rr ** 3, 3)], sol: T`\(V=\frac43\pi r^3=\frac43\pi\cdot${rr ** 3}=${P(4 * rr ** 3, 3)}\).`,
        key: S2(T`Volume of a sphere: \(V=\frac43\pi r^3\).`, T`មាឌស្វ៊ែ៖ \(V=\frac43\pi r^3\)។`),
        steps: [S2(T`Here \(r=${rr}\), so \(r^3=${rr ** 3}\):`, T`នៅទីនេះ \(r=${rr}\) ដូច្នេះ \(r^3=${rr ** 3}\)៖`), DM(T`V=\frac43\pi r^3=\frac43\pi\cdot${rr ** 3}=${P(4 * rr ** 3, 3)}`)] };
    }
    if (v === 4) {
      const [rr, h, l] = r.pick([[3, 4, 5], [4, 3, 5], [6, 8, 10], [5, 12, 13], [8, 6, 10]]);
      return { q: T`A cone has base radius \(${rr}\) and slant height \(${l}\). Its volume is`, correct: P(rr * rr * h, 3), wrong: [P(rr * rr * l, 3), P(rr * rr * h), P(rr * l), P(rr * rr * l)], sol: T`Height \(h=\sqrt{${l}^2-${rr}^2}=${h}\). \(V=\frac13\pi r^2h=${P(rr * rr * h, 3)}\).`,
        key: S2(T`In a cone, the radius \(r\), height \(h\) and slant height \(l\) form a right triangle: \(l^2=r^2+h^2\). Volume \(V=\frac13\pi r^2h\).`, T`ក្នុងកោណ កាំ \(r\) កម្ពស់ \(h\) និងចំណោត \(l\) បង្កើតបានត្រីកោណកែង៖ \(l^2=r^2+h^2\)។ មាឌ \(V=\frac13\pi r^2h\)។`),
        steps: [
          S2('Find the height with Pythagoras:', 'រកកម្ពស់ដោយប្រើទ្រឹស្តីបទពីតាគ័រ៖'),
          DM(T`h=\sqrt{l^2-r^2}=\sqrt{${l}^2-${rr}^2}=\sqrt{${l * l - rr * rr}}=${h}`),
          S2('Then the volume:', 'បន្ទាប់មក មាឌ៖'),
          DM(T`V=\frac13\pi r^2h=\frac13\pi\cdot${rr * rr}\cdot${h}=${P(rr * rr * h, 3)}`),
        ] };
    }
    const s = r.int(2, 6), h = r.int(2, 9);
    return { q: T`A regular square pyramid has base edge \(${s}\) and height \(${h}\). Its volume is`, correct: F(s * s * h, 3), wrong: [String(s * s * h), F(s * h, 3), F(s * s * h, 2), F(4 * s * h, 3)], sol: T`\(V=\frac13Sh=\frac13\cdot${s * s}\cdot${h}=${F(s * s * h, 3)}\).`,
        key: S2(T`Volume of a pyramid: \(V=\frac13Sh\), where \(S\) is the base area.`, T`មាឌពីរ៉ាមីត៖ \(V=\frac13Sh\) ដែល \(S\) ជាក្រឡាផ្ទៃបាត។`),
        steps: [
          S2(T`The base is a square with edge \(${s}\): \(S=${s}^2=${s * s}\).`, T`បាតជាការេមានជ្រុង \(${s}\)៖ \(S=${s}^2=${s * s}\)។`),
          DM(T`V=\frac13Sh=\frac13\cdot${s * s}\cdot${h}=${F(s * s * h, 3)}`),
        ] };
  });

  def('surface', 'solid', (r) => {
    const v = r.int(1, 4);
    if (v === 1) {
      const rr = r.int(1, 6);
      return { q: T`The surface area of a sphere with radius \(${rr}\) is`, correct: P(4 * rr * rr), wrong: [P(4 * rr ** 3, 3), P(rr * rr), P(2 * rr * rr), P(8 * rr * rr)], sol: T`\(S=4\pi r^2=${P(4 * rr * rr)}\).` };
    }
    if (v === 2) {
      const rr = r.int(1, 5), h = r.int(1, 8);
      return { q: T`A cylinder has base radius \(${rr}\) and height \(${h}\). Its total surface area is`, correct: P(2 * rr * rr + 2 * rr * h), wrong: [P(2 * rr * h), P(rr * rr + 2 * rr * h), P(2 * rr * rr + rr * h), P(rr * rr * h)], sol: T`\(S=2\pi r^2+2\pi rh=${P(2 * rr * rr)}+${P(2 * rr * h)}=${P(2 * rr * rr + 2 * rr * h)}\).` };
    }
    if (v === 3) {
      const [rr, h, l] = r.pick([[3, 4, 5], [4, 3, 5], [6, 8, 10], [5, 12, 13]]);
      return { q: T`A cone has base radius \(${rr}\) and height \(${h}\). Its lateral surface area is`, correct: P(rr * l), wrong: [P(rr * h), P(rr * l + rr * rr), P(2 * rr * l), P(rr * rr * h, 3)], sol: T`Slant height \(l=\sqrt{${rr * rr}+${h * h}}=${l}\). Lateral area \(=\pi rl=${P(rr * l)}\).` };
    }
    const a = r.int(2, 4), b = r.int(2, 5), c = r.int(1, 6);
    return { q: T`A rectangular box has edges \(${a}\), \(${b}\) and \(${c}\). Its surface area is`, correct: String(2 * (a * b + b * c + c * a)), wrong: [String(a * b + b * c + c * a), String(a * b * c), String(4 * (a + b + c)), String(2 * a * b * c)], sol: T`\(S=2(ab+bc+ca)=2(${a * b}+${b * c}+${c * a})=${2 * (a * b + b * c + c * a)}\).` };
  });

  def('circumsphere', 'solid', (r) => {
    if (r.chance(0.5)) {
      const a = r.int(1, 6);
      if (r.chance(0.5))
        return { q: T`All vertices of a cube with edge \(${a}\) lie on a sphere. The radius of the sphere is`, correct: R(a, 3, 2), wrong: [R(a, 2, 2), R(a, 3), F(a, 2), String(a)], sol: T`The sphere's diameter is the space diagonal \(${R(a, 3)}\), so \(R=${R(a, 3, 2)}\).` };
      return { q: T`All vertices of a cube with edge \(${a}\) lie on a sphere. The surface area of the sphere is`, correct: P(3 * a * a), wrong: [P(12 * a * a), P(2 * a * a), P(4 * a * a), P(6 * a * a)], sol: T`\(2R=\sqrt3\cdot${a}\Rightarrow R^2=\frac{${3 * a * a}}{4}\). \(S=4\pi R^2=${P(3 * a * a)}\).` };
    }
    const a = r.int(1, 4), b = r.int(1, 4), c = r.int(2, 5);
    const s = a * a + b * b + c * c;
    return { q: T`All vertices of a rectangular box with edges \(${a}\), \(${b}\), \(${c}\) lie on a sphere. The surface area of the sphere is`, correct: P(s), wrong: [P(4 * s), P(s, 4), P(2 * s), P(2 * (a * b + b * c + c * a))], sol: T`\((2R)^2=${a * a}+${b * b}+${c * c}=${s}\), so \(S=4\pi R^2=\pi(2R)^2=${P(s)}\).` };
  });

  const v3 = (x, y, z) => `(${x},${y},${z})`;
  def('space-dist', 'solid', (r) => {
    const A = [r.int(-3, 3), r.int(-3, 3), r.int(-3, 3)], B = [r.int(-3, 4), r.int(-3, 4), r.int(-3, 4)];
    const d = A.map((x, i) => B[i] - x);
    const S = d.reduce((s, x) => s + x * x, 0);
    if (S === 0) throw new Error('same point');
    if (r.chance(0.6)) {
      const Sw = (B[0] + A[0]) ** 2 + d[1] ** 2 + d[2] ** 2;
      return {
        q: T`In space, \(A${v3(...A)}\) and \(B${v3(...B)}\). Then \(|AB|=\)`,
        correct: R(1, S),
        wrong: [String(S), R(1, Sw === S ? S + 3 : Sw), String(Math.abs(d[0]) + Math.abs(d[1]) + Math.abs(d[2])), R(1, S + 1)],
        sol: T`\(|AB|=\sqrt{${d.map((x) => (x < 0 ? `(${x})^2` : `${x}^2`)).join('+')}}=${R(1, S) === T`\sqrt{${S}}` ? R(1, S) : T`\sqrt{${S}}=${R(1, S)}`}\).`,
        key: S2(T`Distance in space: \(|AB|=\sqrt{(x_2-x_1)^2+(y_2-y_1)^2+(z_2-z_1)^2}\).`, T`ចម្ងាយក្នុងលំហ៖ \(|AB|=\sqrt{(x_2-x_1)^2+(y_2-y_1)^2+(z_2-z_1)^2}\)។`),
        steps: [
          S2(T`Subtract the coordinates of \(A\) from those of \(B\):`, T`ដកកូអរដោនេនៃ \(A\) ពីកូអរដោនេនៃ \(B\)៖`),
          DM(T`(${B[0]}-${pr(A[0])},\ ${B[1]}-${pr(A[1])},\ ${B[2]}-${pr(A[2])})=${v3(...d)}`),
          S2('Apply the distance formula:', 'អនុវត្តរូបមន្តចម្ងាយ៖'),
          DM(T`|AB|=\sqrt{${d.map((x) => `${pr(x)}^2`).join('+')}}=\sqrt{${d.map((x) => x * x).join('+')}}=${R(1, S) === T`\sqrt{${S}}` ? R(1, S) : T`\sqrt{${S}}=${R(1, S)}`}`),
        ],
      };
    }
    const M = A.map((x, i) => F(x + B[i], 2));
    return {
      q: T`In space, \(A${v3(...A)}\) and \(B${v3(...B)}\). The midpoint of \(AB\) is`,
      correct: v3(...M),
      wrong: [v3(...d.map((x) => F(x, 2))), v3(...A.map((x, i) => x + B[i])), v3(...A.map((x, i) => F(B[i] - x, 1))), v3(M[0], M[2], M[1])],
      sol: T`Average the coordinates: \(\left(\frac{${A[0]}+${B[0]}}{2},\frac{${A[1]}+${B[1]}}{2},\frac{${A[2]}+${B[2]}}{2}\right)=${v3(...M)}\).`,
      key: S2(T`Midpoint: \(M=\left(\frac{x_1+x_2}{2},\frac{y_1+y_2}{2},\frac{z_1+z_2}{2}\right)\).`, T`ចំណុចកណ្តាល៖ \(M=\left(\frac{x_1+x_2}{2},\frac{y_1+y_2}{2},\frac{z_1+z_2}{2}\right)\)។`),
      steps: [
        S2(T`Average each coordinate of \(A\) and \(B\):`, T`គណនាមធ្យមភាគនៃកូអរដោនេនីមួយៗរបស់ \(A\) និង \(B\)៖`),
        DM(T`M=\left(\frac{${A[0]}+${pr(B[0])}}{2},\ \frac{${A[1]}+${pr(B[1])}}{2},\ \frac{${A[2]}+${pr(B[2])}}{2}\right)=${v3(...M)}`),
      ],
    };
  });

  def('space-perp', 'solid', (r) => {
    const p = r.nz(-3, 3), q = r.int(-3, 3), rr = r.int(-3, 3), s = r.nz(-3, 3), t = r.int(-3, 3);
    const m = F(-(p * rr + q * t), s);
    return {
      q: T`Given \(\vec a=(${p},m,${q})\) and \(\vec b=${v3(rr, s, t)}\) with \(\vec a\perp\vec b\), then \(m=\)`,
      correct: m,
      wrong: [F(p * rr + q * t, s), F(-(p * rr - q * t), s), F(-(p * rr + q * t) * s, 1), F(-(p * s + q * t), rr || 1)].concat(fnb(-(p * rr + q * t), s)),
      sol: T`\(\vec a\cdot\vec b=${lc([[p * rr, ''], [s, 'm'], [q * t, '']])}=0\Rightarrow m=${m}\).`,
    };
  });

  def('cube-angle', 'solid', (r) => {
    const V = { A: [0, 0, 0], B: [1, 0, 0], C: [1, 1, 0], D: [0, 1, 0], A_1: [0, 0, 1], B_1: [1, 0, 1], C_1: [1, 1, 1], D_1: [0, 1, 1] };
    const names = Object.keys(V);
    const segs = [];
    for (let i = 0; i < names.length; i++)
      for (let j = i + 1; j < names.length; j++) {
        const u = V[names[j]].map((x, t) => x - V[names[i]][t]);
        const len2 = u.reduce((s, x) => s + x * x, 0);
        if (len2 <= 2) segs.push({ n: names[i] + names[j], u, len2 });
      }
    for (let tries = 0; tries < 50; tries++) {
      const [s1, s2] = r.shuffle(segs).slice(0, 2);
      const dot = Math.abs(s1.u.reduce((s, x, t) => s + x * s2.u[t], 0));
      const c2 = (dot * dot) / (s1.len2 * s2.len2); // cos^2
      const map = { 0: 90, 0.25: 60, 0.5: 45, 0.75: 30 };
      const key = Math.round(c2 * 100) / 100;
      if (!(key in map)) continue;
      const deg = map[key];
      const nm = (s) => s.n.replace(/_1/g, '_1');
      return {
        q: T`In the cube \(ABCD\text{-}A_1B_1C_1D_1\), the angle between the lines \(${nm(s1)}\) and \(${nm(s2)}\) is`,
        correct: deg + T`^\circ`,
        wrong: [30, 45, 60, 90].filter((x) => x !== deg).map((x) => x + T`^\circ`),
        sol: T`Put the cube in coordinates with edge 1, \(A\) at the origin. \(\vec{${nm(s1)}}=${v3(...s1.u)}\), \(\vec{${nm(s2)}}=${v3(...s2.u)}\). \(\cos\theta=\frac{|\vec u\cdot\vec v|}{|\vec u||\vec v|}=\frac{${dot}}{${R(1, s1.len2 * s2.len2)}}\), so \(\theta=${deg}^\circ\).`,
      };
    }
    throw new Error('no pair');
  });

  /* ================================================================== */
  /* MODULE 4 · PROBABILITY                                              */
  /* ================================================================== */
  def('balls', 'prob', (r) => {
    const red = r.int(2, 5), white = r.int(2, 5), n = red + white;
    const tot = C(n, 2);
    const ev = r.pick(['bothRed', 'oneEach', 'atLeastWhite', 'bothWhite']);
    const val = { bothRed: [C(red, 2), tot], oneEach: [red * white, tot], atLeastWhite: [tot - C(red, 2), tot], bothWhite: [C(white, 2), tot] };
    const desc = { bothRed: 'both balls are red', oneEach: 'one ball is red and one is white', atLeastWhite: 'at least one ball is white', bothWhite: 'both balls are white' };
    const correct = F(...val[ev]);
    const others = Object.keys(val).filter((x) => x !== ev).map((x) => F(...val[x]));
    return {
      q: T`A bag contains \(${red}\) red balls and \(${white}\) white balls of the same size. Two balls are drawn at random at the same time. The probability that ${desc[ev]} is`,
      correct,
      wrong: others.concat([F(red * red, n * n), F(2 * red * white, n * n), F(white * white, n * n)]).concat(fnb(...val[ev])),
      sol: T`There are \(\binom{${n}}{2}=${tot}\) equally likely pairs. Favourable: \(${val[ev][0]}\). Probability \(=${eqf(val[ev][0], tot)}\).`,
    };
  });

  function countPairs(test) {
    let c = 0;
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (test(a, b)) c++;
    return c;
  }
  def('dice', 'prob', (r) => {
    const preds = [
      () => { const s = r.int(3, 11); return { d: T`the sum of the two numbers is \(${s}\)`, t: (a, b) => a + b === s }; },
      () => { const s = r.int(4, 10); return { d: T`the sum of the two numbers is at most \(${s}\)`, t: (a, b) => a + b <= s }; },
      () => { const m = r.pick([3, 4, 5]); return { d: T`the sum of the two numbers is a multiple of \(${m}\)`, t: (a, b) => (a + b) % m === 0 }; },
      () => ({ d: 'the two numbers are equal', t: (a, b) => a === b }),
      () => { const dd = r.int(1, 4); return { d: T`the two numbers differ by \(${dd}\)`, t: (a, b) => Math.abs(a - b) === dd }; },
      () => ({ d: 'the product of the two numbers is even', t: (a, b) => (a * b) % 2 === 0 }),
    ];
    const p = r.pick(preds)();
    const c = countPairs(p.t);
    const correct = F(c, 36);
    const fav = [], unf = [];
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) (p.t(a, b) ? fav : unf).push(`(${a},${b})`);
    const rows = (arr) => { const out = []; for (let i = 0; i < arr.length; i += 6) out.push(DM(arr.slice(i, i + 6).join(',\\ '))); return out; };
    return {
      q: T`Two fair dice are rolled. The probability that ${p.d} is`,
      correct,
      wrong: [F(36 - c, 36), F(c + 1, 36), F(c - 1, 36), F(c, 21), F(c + 2, 36), F(c, 18)],
      sol: T`There are \(36\) equally likely outcomes; \(${c}\) of them satisfy the condition. Probability \(=${eqf(c, 36)}\).`,
      key: S2(T`Classical probability: \(P=\dfrac{\text{favourable outcomes}}{\text{all equally likely outcomes}}\).`, T`ប្រូបាបបុរាណ៖ \(P=\dfrac{m}{n}\) ដែល \(m\) ជាចំនួនករណីស្រប និង \(n\) ជាចំនួនករណីអាចមានទាំងអស់ (អាចកើតមានស្មើៗគ្នា)។`),
      steps: [
        S2(T`Each die has 6 faces, so there are \(n=6\times6=36\) equally likely ordered pairs \((a,b)\).`, T`គ្រាប់ឡុកឡាក់នីមួយៗមាន 6 មុខ ដូច្នេះមានគូលំដាប់ \((a,b)\) ចំនួន \(n=6\times6=36\) ដែលអាចកើតមានស្មើៗគ្នា។`),
        ...(fav.length <= unf.length
          ? [S2(T`List the pairs where ${p.d} (\(m=${c}\) pairs):`, T`រាយគូដែលស្របនឹងលក្ខខណ្ឌ (\(m=${c}\) គូ)៖`), ...rows(fav)]
          : [
              S2(T`It is quicker to list the pairs that do NOT satisfy the condition (\(${36 - c}\) pairs):`, T`ងាយជាងគឺរាយគូដែលមិនស្របនឹងលក្ខខណ្ឌ (\(${36 - c}\) គូ)៖`),
              ...rows(unf),
              S2(T`So the number of favourable pairs is \(m=36-${36 - c}=${c}\).`, T`ដូច្នេះចំនួនគូស្របគឺ \(m=36-${36 - c}=${c}\)។`),
            ]),
        DM(T`P=\frac{m}{n}=${eqf(c, 36)}`),
      ],
    };
  });

  def('coins', 'prob', (r) => {
    const n = r.pick([3, 4]);
    const tot = 2 ** n;
    const ev = r.pick(['exact', 'atLeastOne', 'atMostOne']);
    const kk = r.int(1, n - 1);
    const vals = { exact: [C(n, kk), tot], atLeastOne: [tot - 1, tot], atMostOne: [1 + n, tot] };
    const desc = { exact: T`exactly \(${kk}\) head${kk > 1 ? 's' : ''} appear${kk > 1 ? '' : 's'}`, atLeastOne: 'at least one head appears', atMostOne: 'at most one head appears' };
    const correct = F(...vals[ev]);
    return {
      q: T`A fair coin is tossed \(${n}\) times. The probability that ${desc[ev]} is`,
      correct,
      wrong: Object.keys(vals).filter((x) => x !== ev).map((x) => F(...vals[x])).concat([F(kk, n), F(1, tot), F(C(n, kk) + 1, tot), F(1, 2)]),
      sol: T`There are \(2^{${n}}=${tot}\) outcomes; \(${vals[ev][0]}\) are favourable${ev === 'exact' ? T` (\(\binom{${n}}{${kk}}\))` : ''}. Probability \(=${correct}\).`,
    };
  });

  def('committee', 'prob', (r) => {
    const m = r.int(2, 5), n = r.int(2, 4), kk = r.pick([2, 3]);
    if (kk > m) throw new Error('k>m');
    const tot = C(m + n, kk);
    const ev = r.pick(['atLeast', 'exactOne', 'allBoys']);
    const vals = { atLeast: [tot - C(m, kk), tot], exactOne: [n * C(m, kk - 1), tot], allBoys: [C(m, kk), tot] };
    const desc = { atLeast: 'at least one girl is chosen', exactOne: 'exactly one girl is chosen', allBoys: 'no girl is chosen' };
    const correct = F(...vals[ev]);
    return {
      q: T`From \(${m}\) boys and \(${n}\) girls, \(${kk}\) students are chosen at random. The probability that ${desc[ev]} is`,
      correct,
      wrong: Object.keys(vals).filter((x) => x !== ev).map((x) => F(...vals[x])).concat([F(n, m + n), F(kk, m + n)]).concat(fnb(...vals[ev])),
      sol: T`Total \(\binom{${m + n}}{${kk}}=${tot}\). Favourable: \(${vals[ev][0]}\)${ev === 'atLeast' ? T` (complement: \(${tot}-\binom{${m}}{${kk}}\))` : ''}. Probability \(=${correct}\).`,
    };
  });

  def('independent', 'prob', (r) => {
    const p = r.int(2, 9), q = r.int(2, 9);
    const ev = r.pick(['both', 'atLeast', 'exactly', 'neither']);
    const vals = { both: p * q, atLeast: 100 - (10 - p) * (10 - q), exactly: p * (10 - q) + q * (10 - p), neither: (10 - p) * (10 - q) };
    const desc = { both: 'both hit the target', atLeast: 'the target is hit (at least one hits)', exactly: 'exactly one of them hits the target', neither: 'neither hits the target' };
    const correct = dec(vals[ev], 100);
    return {
      q: T`Two shooters A and B fire at a target independently. The probabilities that A and B hit are \(${dec(p, 10)}\) and \(${dec(q, 10)}\) respectively. The probability that ${desc[ev]} is`,
      correct,
      wrong: Object.keys(vals).filter((x) => x !== ev).map((x) => dec(vals[x], 100)).concat([dec(Math.min(p + q, 10), 10), dec(vals[ev] + 5, 100)]),
      sol: {
        both: T`\(P(AB)=P(A)P(B)=${dec(p, 10)}\times${dec(q, 10)}=${correct}\).`,
        atLeast: T`\(1-P(\bar A)P(\bar B)=1-${dec(10 - p, 10)}\times${dec(10 - q, 10)}=${correct}\).`,
        exactly: T`\(P(A\bar B)+P(\bar AB)=${dec(p, 10)}\times${dec(10 - q, 10)}+${dec(10 - p, 10)}\times${dec(q, 10)}=${correct}\).`,
        neither: T`\(P(\bar A)P(\bar B)=${dec(10 - p, 10)}\times${dec(10 - q, 10)}=${correct}\).`,
      }[ev],
    };
  });

  def('arrange', 'prob', (r) => {
    const n = r.int(4, 7);
    const ev = r.pick(['adj', 'notAdj', 'end', 'left']);
    const vals = { adj: [2, n], notAdj: [n - 2, n], end: [2, n], left: [1, n] };
    const desc = { adj: 'A and B stand next to each other', notAdj: 'A and B do not stand next to each other', end: 'A stands at one of the two ends', left: 'A stands at the leftmost position' };
    const correct = F(...vals[ev]);
    return {
      q: T`\(${n}\) people, including A and B, stand in a row in random order. The probability that ${desc[ev]} is`,
      correct,
      wrong: [F(1, n), F(2, n), F(n - 2, n), F(1, 2), F(2, n * (n - 1)), F(1, n - 1)],
      sol: {
        adj: T`Treat A, B as one block: \(2\cdot${n - 1}!\) arrangements out of \(${n}!\), probability \(\frac{2}{${n}}\).`,
        notAdj: T`Complement of "adjacent" (probability \(\frac2{${n}}\)): \(1-\frac{2}{${n}}=${correct}\).`,
        end: T`A is equally likely to be in any of the \(${n}\) positions; \(2\) are ends: \(${correct}\).`,
        left: T`A is equally likely to be in any of the \(${n}\) positions: \(${correct}\).`,
      }[ev],
    };
  });

  def('pick-numbers', 'prob', (r) => {
    const n = r.int(5, 9);
    const preds = [
      { d: 'the sum is even', t: (a, b) => (a + b) % 2 === 0 },
      { d: 'the sum is odd', t: (a, b) => (a + b) % 2 === 1 },
      { d: 'the product is even', t: (a, b) => (a * b) % 2 === 0 },
      { d: 'both numbers are odd', t: (a, b) => a % 2 === 1 && b % 2 === 1 },
    ];
    const s = r.int(n, 2 * n - 3);
    preds.push({ d: T`the sum is greater than \(${s}\)`, t: (a, b) => a + b > s });
    const p = r.pick(preds);
    let c = 0;
    const tot = C(n, 2);
    for (let a = 1; a <= n; a++) for (let b = a + 1; b <= n; b++) if (p.t(a, b)) c++;
    if (c === 0 || c === tot) throw new Error('trivial');
    const correct = F(c, tot);
    return {
      q: T`Two different numbers are chosen at random from \(1,2,\ldots,${n}\). The probability that ${p.d} is`,
      correct,
      wrong: [F(tot - c, tot), F(c + 1, tot), F(c - 1, tot), F(c, n * n), F(1, 2)],
      sol: T`There are \(\binom{${n}}{2}=${tot}\) pairs, of which \(${c}\) satisfy the condition. Probability \(=${correct}\).`,
    };
  });

  /* ================================================================== */
  /* MODULE 4 · STATISTICS                                               */
  /* ================================================================== */
  def('mean-median', 'stats', (r) => {
    const n = r.int(7, 9);
    const vals = r.distinct(n - 1, 60, 98);
    const dup = r.pick(vals);
    const data = r.shuffle(vals.concat([dup]));
    const sorted = data.slice().sort((a, b) => a - b);
    const sum = data.reduce((s, x) => s + x, 0);
    const med2 = n % 2 ? 2 * sorted[(n - 1) / 2] : sorted[n / 2 - 1] + sorted[n / 2];
    const stats = { mean: [sum, n], median: [med2, 2], mode: [dup, 1], range: [sorted[n - 1] - sorted[0], 1] };
    const ask = r.pick(['mean', 'median', 'mode', 'range']);
    if (ask === 'mean' && sum % n !== 0) throw new Error('non-integer mean');
    const fmt = ([a, b]) => (b === 2 ? dec(a * 5, 10) : b === 1 ? String(a) : sum % n === 0 ? String(a / b) : dec(Math.round((a / b) * 10), 10));
    const names = { mean: 'mean', median: 'median', mode: 'mode', range: 'range' };
    const correct = fmt(stats[ask]);
    return {
      q: T`The scores of ${n} students are: \(${data.join(',\\ ')}\). The ${names[ask]} of the data is`,
      correct,
      wrong: Object.keys(stats).filter((x) => x !== ask).map((x) => fmt(stats[x])).concat(ask === 'median' ? [String(sorted[Math.floor(n / 2)] + 1), String(data[Math.floor(n / 2)])] : nb(Number(correct))),
      sol: {
        mean: T`Sum \(=${sum}\); mean \(=\frac{${sum}}{${n}}=${correct}\).`,
        median: T`Sorted: \(${sorted.join(',\\ ')}\). ${n % 2 ? T`The middle (${(n + 1) / 2}th) value is \(${correct}\).` : T`Average of the ${n / 2}th and ${n / 2 + 1}th values: \(\frac{${sorted[n / 2 - 1]}+${sorted[n / 2]}}{2}=${correct}\).`}`,
        mode: T`\(${dup}\) appears twice and every other value once, so the mode is \(${dup}\).`,
        range: T`Range \(=\max-\min=${sorted[n - 1]}-${sorted[0]}=${correct}\).`,
      }[ask],
    };
  });

  def('variance', 'stats', (r) => {
    const n = r.pick([4, 5]);
    const mu = r.int(3, 12);
    let d;
    do {
      d = range(1, n - 1).map(() => r.int(-4, 4));
      d.push(-d.reduce((s, x) => s + x, 0));
    } while (Math.abs(d[n - 1]) > 5 || d.every((x) => x === 0));
    const data = d.map((x) => mu + x);
    const ss = d.reduce((s, x) => s + x * x, 0);
    const scale = n === 5 ? 10 : 100;
    const toDec = (num, den) => dec(Math.round((num / den) * scale), scale);
    const v = toDec(ss, n);
    const askSd = Number.isInteger(ss / n) && Number.isInteger(Math.sqrt(ss / n)) && r.chance(0.6);
    if (askSd) {
      const sd = Math.sqrt(ss / n);
      return {
        q: T`The standard deviation of the data \(${data.join(',\\ ')}\) is`,
        correct: String(sd),
        wrong: [String(ss / n), R(1, ss), String(ss), toDec(ss, n - 1) === String(sd) ? String(sd + 1) : R(1, ss * (n - 1), n - 1)],
        sol: T`Mean \(=${mu}\). Deviations \(${d.join(',\\ ')}\); variance \(=\frac{${ss}}{${n}}=${ss / n}\); standard deviation \(=${sd}\).`,
      };
    }
    return {
      q: T`The variance of the data \(${data.join(',\\ ')}\) is`,
      correct: v,
      wrong: [toDec(ss, n - 1), String(ss), R(1, Math.round(ss / n)), toDec(ss + n, n), String(mu)],
      sol: T`Mean \(\bar x=${mu}\). \(s^2=\frac1n\sum(x_i-\bar x)^2=\frac{${d.map((x) => (x < 0 ? `(${x})^2` : `${x}^2`)).join('+')}}{${n}}=\frac{${ss}}{${n}}=${v}\).`,
    };
  });

  def('stat-transform', 'stats', (r) => {
    const mu = r.int(2, 10), v = r.int(1, 6), a = r.pick([2, 3, -2, 4]), b = r.nz(-5, 5);
    const pair = (m, s) => T`${m},\ ${s}`;
    return {
      q: T`The data \(x_1,x_2,\ldots,x_n\) have mean \(${mu}\) and variance \(${v}\). The mean and variance of \(${lc([[a, 'x_1'], [b, '']])},${lc([[a, 'x_2'], [b, '']])},\ldots,${lc([[a, 'x_n'], [b, '']])}\) are respectively`,
      correct: pair(a * mu + b, a * a * v),
      wrong: [pair(a * mu + b, a * v), pair(a * mu, a * a * v), pair(a * mu + b, a * a * v + b), pair(mu + b, a * a * v)],
      sol: T`For \(y=ax+b\): \(\bar y=a\bar x+b=${a * mu + b}\) and \(s_y^2=a^2s_x^2=${a * a}\cdot${v}=${a * a * v}\) (adding \(b\) does not change spread).`,
    };
  });

  def('percentile', 'stats', (r) => {
    const data = r.distinct(10, 1, 40).sort((a, b) => a - b);
    const p = r.pick([20, 25, 30, 40, 60, 70, 75, 80, 90]);
    const i = (10 * p) / 100;
    let ans, how;
    if (Number.isInteger(i)) {
      ans = dec((data[i - 1] + data[i]) * 5, 10);
      how = T`\(10\times${p}\%=${i}\) is an integer, so take the average of the ${i}th and ${i + 1}th values: \(\frac{${data[i - 1]}+${data[i]}}{2}=${ans}\).`;
    } else {
      const j = Math.ceil(i);
      ans = String(data[j - 1]);
      how = T`\(10\times${p}\%=${dec(i * 10, 10)}\) is not an integer, so take the ${j}th value: \(${ans}\).`;
    }
    const shown = r.shuffle(data);
    const ic = Math.ceil(i);
    return {
      q: T`For the data \(${shown.join(',\\ ')}\), the \(${p}\)th percentile is`,
      correct: ans,
      wrong: [String(data[ic - 1]), String(data[Math.min(ic, 9)]), String(data[Math.max(ic - 2, 0)]), dec((data[ic - 1] + data[Math.min(ic, 9)]) * 5, 10), String(shown[ic - 1])],
      sol: T`Sort: \(${data.join(',\\ ')}\). ` + how,
    };
  });

  def('combined-mean', 'stats', (r) => {
    const n1 = r.pick([10, 20, 30, 40]), n2 = r.pick([10, 20, 30, 50]), m1 = r.int(60, 90), m2 = r.int(60, 90);
    if (m1 === m2) throw new Error('same');
    const tot = n1 * m1 + n2 * m2, N = n1 + n2;
    if ((tot * 10) % N !== 0) throw new Error('not 1dp');
    const ans = dec((tot * 10) / N, 10);
    return {
      q: T`Class A has \(${n1}\) students with mean score \(${m1}\); class B has \(${n2}\) students with mean score \(${m2}\). The mean score of all \(${N}\) students is`,
      correct: ans,
      wrong: [dec((m1 + m2) * 5, 10), (n2 * m1 + n1 * m2) * 10 % N === 0 ? dec(((n2 * m1 + n1 * m2) * 10) / N, 10) : String(m1), String(Math.max(m1, m2)), String(Math.min(m1, m2))],
      sol: T`\(\bar x=\frac{${n1}\times${m1}+${n2}\times${m2}}{${N}}=\frac{${tot}}{${N}}=${ans}\).`,
    };
  });

  /* ================================================================== */
  /* MODULE 4 · NORMAL DISTRIBUTION                                      */
  /* ================================================================== */
  def('normal-sym', 'normal', (r) => {
    const mu = r.pick([1, 2, 3, 4, 10, 80, 90, 100]), c = r.int(1, mu >= 10 ? 10 : 3);
    const p = r.pick([5, 10, 12, 15, 16, 20, 25, 30, 35]);
    const evs = [
      { d: T`P(X<${mu - c})`, v: p },
      { d: T`P(${mu - c}<X<${mu + c})`, v: 100 - 2 * p },
      { d: T`P(${mu}<X<${mu + c})`, v: 50 - p },
      { d: T`P(X<${mu + c})`, v: 100 - p },
      { d: T`P(${mu - c}<X<${mu})`, v: 50 - p },
    ];
    const e = r.pick(evs);
    const pool = [p, 100 - 2 * p, 50 - p, 100 - p, 2 * p, 50 + p].filter((x) => x !== e.v);
    return {
      q: T`The random variable \(X\sim N(${mu},\sigma^2)\) and \(P(X>${mu + c})=${dec(p, 100)}\). Then \(${e.d}=\)`,
      correct: dec(e.v, 100),
      wrong: pool.map((x) => dec(x, 100)),
      sol: T`The normal curve is symmetric about \(x=${mu}\), so \(P(X<${mu - c})=P(X>${mu + c})=${dec(p, 100)}\) and \(P(X<${mu})=0.5\). Hence \(${e.d}=${dec(e.v, 100)}\).`,
    };
  });

  def('normal-3sigma', 'normal', (r) => {
    const mu = r.pick([70, 75, 80, 90, 100, 110]), s = r.pick([5, 10, 15]);
    const E = [
      { d: [mu - s, mu + s], v: 6826 },
      { d: [mu - 2 * s, mu + 2 * s], v: 9544 },
      { d: [mu, mu + s], v: 3413 },
      { d: [mu, mu + 2 * s], v: 4772 },
      { d: [mu + s, mu + 2 * s], v: 1359 },
      { d: [mu + s, null], v: 1587 },
      { d: [mu + 2 * s, null], v: 228 },
      { d: [mu - s, mu + 2 * s], v: 8185 },
      { d: [null, mu + s], v: 8413 },
      { d: [mu - 2 * s, mu - s], v: 1359 },
    ];
    const e = r.pick(E);
    const txt = e.d[1] === null ? T`X>${e.d[0]}` : e.d[0] === null ? T`X\le ${e.d[1]}` : T`${e.d[0]}<X\le ${e.d[1]}`;
    const count = r.chance(0.35);
    const pool = [...new Set(E.map((x) => x.v).filter((x) => x !== e.v))];
    const ref = T`(Reference: \(P(\mu-\sigma<X\le\mu+\sigma)\approx0.6826\), \(P(\mu-2\sigma<X\le\mu+2\sigma)\approx0.9544\).)`;
    if (count)
      return {
        prob: false,
        q: T`The scores of \(10000\) students follow \(N(${mu},${s}^2)\). Approximately how many students satisfy \(${txt}\)? ${ref}`,
        correct: String(e.v),
        wrong: r.shuffle(pool).map(String),
        sol: T`\(\mu=${mu}\), \(\sigma=${s}\). By symmetry and the reference values, \(P(${txt})\approx${dec(e.v, 10000)}\), so about \(10000\times${dec(e.v, 10000)}=${e.v}\) students.`,
      };
    return {
      q: T`\(X\sim N(${mu},${s}^2)\). Then \(P(${txt})\approx\) ${ref}`,
      correct: dec(e.v, 10000),
      wrong: r.shuffle(pool).map((x) => dec(x, 10000)),
      sol: T`\(\mu=${mu}\), \(\sigma=${s}\). Express the interval in terms of \(\mu\pm\sigma,\mu\pm2\sigma\) and use symmetry: the probability is \(${dec(e.v, 10000)}\).`,
    };
  });

  def('normal-param', 'normal', (r) => {
    const a = r.int(-4, 6), b = a + 2 * r.int(1, 5);
    const mu = (a + b) / 2;
    if (r.chance(0.6))
      return {
        prob: false,
        q: T`\(X\sim N(\mu,\sigma^2)\) and \(P(X<${a})=P(X>${b})\). Then \(\mu=\)`,
        correct: String(mu),
        wrong: [String((b - a) / 2), String(a + b), String(mu + 1), String(mu - 1)],
        sol: T`Equal tail probabilities mean \(${a}\) and \(${b}\) are symmetric about \(\mu\): \(\mu=\frac{${a}+${b}}{2}=${mu}\).`,
      };
    const p = r.pick([10, 20, 25, 30, 35, 40]);
    return {
      q: T`\(X\sim N(${mu},\sigma^2)\) and \(P(X<${a})=${dec(p, 100)}\). Then \(P(X<${b})=\)`,
      correct: dec(100 - p, 100),
      wrong: [dec(p, 100), dec(100 - 2 * p, 100), dec(50 - p, 100), dec(50 + p, 100) === dec(100 - p, 100) ? '0.5' : dec(50 + p, 100)],
      sol: T`\(${a}\) and \(${b}\) are symmetric about \(\mu=${mu}\), so \(P(X>${b})=P(X<${a})=${dec(p, 100)}\) and \(P(X<${b})=1-${dec(p, 100)}=${dec(100 - p, 100)}\).`,
    };
  });

  /* ================================================================== */
  /* EXAM-SHEET CHALLENGE TEMPLATES (complex roots, summation, recursion) */
  /* ================================================================== */
  function pmTex(p, q) {
    // p ± q i
    const qi = (q === 1 ? '' : q) + 'i';
    return p === 0 ? T`\pm ${qi}` : T`${p}\pm ${qi}`;
  }
  def('complex-roots', 'complex', (r) => {
    const p = r.int(-3, 3), q = r.int(1, 4);
    const b = -2 * p, c = p * p + q * q;
    const eq = lc([[1, 'x^2'], [b, 'x'], [c, '']]) + '=0';
    const v = r.int(1, 3);
    if (v === 1)
      return {
        q: T`In the set of complex numbers, the roots of \(${eq}\) are`,
        correct: T`x=${pmTex(p, q)}`,
        wrong: [T`x=${pmTex(-p, q)}`, T`x=${pmTex(p, 2 * q)}`, T`x=${pmTex(q, p === 0 ? 1 : Math.abs(p))}`, T`x=${pmTex(p, q * q)}`, T`x=${pmTex(2 * p || 1, q)}`],
        sol: T`\(\Delta=${b * b}-4\cdot${c}=${b * b - 4 * c}<0\). \(x=\frac{${-b}\pm\sqrt{${b * b - 4 * c}}}{2}=\frac{${-b}\pm${2 * q}i}{2}=${pmTex(p, q)}\).`,
      };
    if (v === 2) {
      const ans = b + c;
      return {
        q: T`The equation \(x^2+bx+c=0\) with real coefficients \(b,c\) has a root \(${cTex(p, q)}\). Then \(b+c=\)`,
        correct: String(ans),
        wrong: [String(-b + c), String(b - c), String(p * p - q * q + b), String(c)].concat(nb(ans)),
        sol: T`Complex roots come in conjugate pairs: the roots are \(${pmTex(p, q)}\). Sum \(=${2 * p}=-b\Rightarrow b=${b}\); product \(=${p}^2+${q}^2=${c}=c\). So \(b+c=${ans}\).`,
      };
    }
    return {
      q: T`\(z\) is a root of \(${eq}\). Then \(|z|=\)`,
      correct: R(1, c),
      wrong: [String(c), R(1, c + 2 * q), R(1, Math.abs(p * p - q * q) || 2), String(Math.abs(p) + q)],
      sol: T`The roots are \(${pmTex(p, q)}\), so \(|z|=\sqrt{${p * p}+${q * q}}=${R(1, c)}\) (also \(|z|^2=z\bar z=c=${c}\)).`,
    };
  }, { examOnly: true });

  def('telescoping', 'seq', (r) => {
    const n = r.int(5, 30);
    const v = r.int(1, 3);
    if (v === 1)
      return {
        q: T`\(\dfrac{1}{1\times2}+\dfrac{1}{2\times3}+\dfrac{1}{3\times4}+\cdots+\dfrac{1}{${n}\times${n + 1}}=\)`,
        correct: F(n, n + 1),
        wrong: [F(n - 1, n), F(n + 1, n + 2), F(1, n + 1), F(n, n + 2), F(2 * n, n + 1)],
        sol: T`\(\frac{1}{k(k+1)}=\frac1k-\frac1{k+1}\), so the sum telescopes to \(1-\frac{1}{${n + 1}}=${F(n, n + 1)}\).`,
      };
    if (v === 2)
      return {
        q: T`\(\dfrac{1}{1\times3}+\dfrac{1}{3\times5}+\cdots+\dfrac{1}{${2 * n - 1}\times${2 * n + 1}}=\)`,
        correct: F(n, 2 * n + 1),
        wrong: [F(2 * n, 2 * n + 1), F(n, 2 * n - 1), F(n - 1, 2 * n - 1), F(n + 1, 2 * n + 1), F(1, 2 * n + 1)],
        sol: T`\(\frac{1}{(2k-1)(2k+1)}=\frac12\left(\frac1{2k-1}-\frac1{2k+1}\right)\), so the sum is \(\frac12\left(1-\frac1{${2 * n + 1}}\right)=${F(n, 2 * n + 1)}\).`,
      };
    return {
      q: T`For \(a_n=\dfrac{1}{n(n+1)}\), let \(S_n\) be the sum of the first \(n\) terms. Then \(S_{${n}}=\)`,
      correct: F(n, n + 1),
      wrong: [F(n - 1, n), F(n + 1, n + 2), F(1, n * (n + 1)), F(n, n + 2)],
      sol: T`\(a_k=\frac1k-\frac1{k+1}\), so \(S_{${n}}=1-\frac1{${n + 1}}=${F(n, n + 1)}\).`,
    };
  }, { examOnly: true });

  def('recurrence', 'seq', (r) => {
    const kk = r.int(4, 6);
    if (r.chance(0.6)) {
      const q = r.pick([2, 3]), d = r.int(-2, 3), a1 = r.int(1, 3);
      const seq = [a1];
      for (let i = 1; i < kk + 1; i++) seq.push(q * seq[i - 1] + d);
      const ans = seq[kk - 1];
      if (seq[1] === seq[0]) throw new Error('constant sequence: too easy for a challenge question');
      if (Math.abs(ans) > 2000) throw new Error('too big');
      return {
        q: T`In the sequence \(\{a_n\}\), \(a_1=${a1}\) and \(a_{n+1}=${q}a_n${k(d)}\). Then \(a_{${kk}}=\)`,
        correct: String(ans),
        wrong: [String(seq[kk]), String(seq[kk - 2]), String(a1 * q ** (kk - 1)), String(ans + d || ans + 1)].concat(nb(ans)),
        sol: T`Compute term by term: \(${seq.slice(0, kk).map((x, i) => T`a_{${i + 1}}=${x}`).join(',\ ')}\).`,
      };
    }
    const a1 = r.int(1, 4), m = r.pick([1, 2]);
    const seq = [a1];
    for (let i = 1; i < kk + 1; i++) seq.push(seq[i - 1] + m * i);
    const ans = seq[kk - 1];
    return {
      q: T`In the sequence \(\{a_n\}\), \(a_1=${a1}\) and \(a_{n+1}=a_n+${m === 1 ? 'n' : '2n'}\). Then \(a_{${kk}}=\)`,
      correct: String(ans),
      wrong: [String(seq[kk]), String(seq[kk - 2]), String(a1 + m * kk), String(a1 + m * (kk - 1))].concat(nb(ans)),
      sol: T`\(a_{${kk}}=a_1+${m === 1 ? '' : '2('}1+2+\cdots+${kk - 1}${m === 1 ? '' : ')'}=${a1}+${m}\cdot${(kk * (kk - 1)) / 2}=${ans}\).`,
    };
  }, { examOnly: true });

  /* ================================================================== */
  /* REAL-PAPER STYLE TEMPLATES (modelled on the CSCA math paper)        */
  /* ================================================================== */
  const XO = { examOnly: true };

  def('interval-notation', 'sets', (r) => {
    const a = r.int(-5, 3), b = a + r.int(1, 6);
    const kinds = [[true, false], [false, true], [false, false], [true, true]];
    const [lc_, rc_] = r.pick(kinds);
    const cond = T`${a}${lc_ ? T`\le` : '<'} x${rc_ ? T`\le` : '<'}${b}`;
    const all = kinds.map(([p, q]) => iv(a, b, p, q));
    const correct = iv(a, b, lc_, rc_);
    return {
      q: T`Which of the following represents the set of all real numbers \(x\) such that \(${cond}\)?`,
      correct,
      wrong: all.filter((x) => x !== correct).concat([setTex(range(a, b - 1))]),
      sol: T`A square bracket includes the endpoint and a round bracket excludes it, so \(${cond}\) is written \(${correct}\).`,
      key: S2(T`Square bracket \([\ ]\): the endpoint is included (\(\le,\ \ge\)). Round bracket \((\ )\): the endpoint is excluded (\(<,\ >\)).`, T`តង្កៀបជ្រុង \([\ ]\)៖ រាប់បញ្ចូលចុង (\(\le,\ \ge\))។ តង្កៀបមូល \((\ )\)៖ មិនរាប់បញ្ចូលចុង (\(<,\ >\))។`),
      steps: [
        S2(T`Left end \(${a}\): the sign is \(${lc_ ? T`\le` : '<'}\), so \(${a}\) is ${lc_ ? 'included: use "["' : 'excluded: use "("'}.`, T`ចុងខាងឆ្វេង \(${a}\)៖ សញ្ញាគឺ \(${lc_ ? T`\le` : '<'}\) ដូច្នេះ \(${a}\) ${lc_ ? 'ត្រូវរាប់បញ្ចូល៖ ប្រើ "["' : 'មិនរាប់បញ្ចូល៖ ប្រើ "("'}។`),
        S2(T`Right end \(${b}\): the sign is \(${rc_ ? T`\le` : '<'}\), so \(${b}\) is ${rc_ ? 'included: use "]"' : 'excluded: use ")"'}.`, T`ចុងខាងស្តាំ \(${b}\)៖ សញ្ញាគឺ \(${rc_ ? T`\le` : '<'}\) ដូច្នេះ \(${b}\) ${rc_ ? 'ត្រូវរាប់បញ្ចូល៖ ប្រើ "]"' : 'មិនរាប់បញ្ចូល៖ ប្រើ ")"'}។`),
        DM(T`${cond}\iff x\in${correct}`),
      ],
    };
  }, XO);

  def('set-relation', 'sets', (r) => {
    const v = r.int(1, 4);
    const k = r.int(1, 5);
    let A, B, ans, why, st;
    if (v === 1) {
      A = T`\{x\mid x^2-${k * k}=0\}`; B = T`\{x\mid ${lin('x', k)}=0\}`; ans = 2;
      why = T`\(A=\{-${k},${k}\}\) and \(B=\{${k}\}\), so \(B\subsetneq A\).`;
      st = [
        S2(T`Solve \(x^2-${k * k}=0\): \(x^2=${k * k}\), so \(x=\pm${k}\).`, T`ដោះស្រាយ \(x^2-${k * k}=0\)៖ \(x^2=${k * k}\) ដូច្នេះ \(x=\pm${k}\)។`),
        DM(T`A=\{-${k},${k}\},\qquad B=\{${k}\}`),
        S2(T`Every element of \(B\) is in \(A\), but \(-${k}\in A\) is not in \(B\). So \(B\) is a proper subset of \(A\).`, T`គ្រប់ធាតុនៃ \(B\) ស្ថិតនៅក្នុង \(A\) ប៉ុន្តែ \(-${k}\in A\) មិននៅក្នុង \(B\)។ ដូច្នេះ \(B\) ជាសំណុំរងផ្ទាល់នៃ \(A\)។`),
        DM(T`B\subsetneq A`),
      ];
    } else if (v === 2) {
      const [p, q] = r.distinct(2, -4, 5).sort((x, y) => x - y);
      const extra = r.pick(range(-6, 7).filter((x) => x !== p && x !== q));
      A = T`\{x\mid ${lc([[1, 'x^2'], [-(p + q), 'x'], [p * q, '']])}=0\}`; B = setTex([p, q, extra]); ans = 1;
      why = T`\(A=${setTex([p, q])}\) and every element of \(A\) is in \(B=${setTex([p, q, extra])}\), but not conversely, so \(A\subsetneq B\).`;
      st = [
        S2(T`Factor: \(${fac2(p, q)}=0\), so \(x=${p}\) or \(x=${q}\).`, T`ដាក់ជាផលគុណកត្តា៖ \(${fac2(p, q)}=0\) ដូច្នេះ \(x=${p}\) ឬ \(x=${q}\)។`),
        DM(T`A=${setTex([p, q])},\qquad B=${setTex([p, q, extra])}`),
        S2(T`Every element of \(A\) is in \(B\), but \(${extra}\in B\) is not in \(A\). So \(A\) is a proper subset of \(B\).`, T`គ្រប់ធាតុនៃ \(A\) ស្ថិតនៅក្នុង \(B\) ប៉ុន្តែ \(${extra}\in B\) មិននៅក្នុង \(A\)។ ដូច្នេះ \(A\) ជាសំណុំរងផ្ទាល់នៃ \(B\)។`),
        DM(T`A\subsetneq B`),
      ];
    } else if (v === 3) {
      const [p, q] = r.distinct(2, -4, 5).sort((x, y) => x - y);
      A = T`\{x\mid ${lc([[1, 'x^2'], [-(p + q), 'x'], [p * q, '']])}=0\}`; B = setTex([p, q]); ans = 0;
      why = T`Solving gives \(A=${setTex([p, q])}\), which is exactly \(B\), so \(A=B\).`;
      st = [
        S2(T`Factor: \(${fac2(p, q)}=0\), so \(x=${p}\) or \(x=${q}\).`, T`ដាក់ជាផលគុណកត្តា៖ \(${fac2(p, q)}=0\) ដូច្នេះ \(x=${p}\) ឬ \(x=${q}\)។`),
        DM(T`A=${setTex([p, q])},\qquad B=${setTex([p, q])}`),
        S2(T`The two sets have exactly the same elements.`, T`សំណុំទាំងពីរមានធាតុដូចគ្នាទាំងស្រុង។`),
        DM(T`A=B`),
      ];
    } else {
      const m = r.pick(range(-6, 6).filter((x) => x !== k && x !== -k));
      A = T`\{x\mid x^2-${k * k}=0\}`; B = T`\{x\mid ${lin('x', m)}=0\}`; ans = 3;
      why = T`\(A=\{-${k},${k}\}\) and \(B=\{${m}\}\) have no common element, so \(A\cap B=\varnothing\).`;
      st = [
        S2(T`Solve \(x^2-${k * k}=0\): \(x=\pm${k}\). Solve \(${lin('x', m)}=0\): \(x=${m}\).`, T`ដោះស្រាយ \(x^2-${k * k}=0\)៖ \(x=\pm${k}\)។ ដោះស្រាយ \(${lin('x', m)}=0\)៖ \(x=${m}\)។`),
        DM(T`A=\{-${k},${k}\},\qquad B=\{${m}\}`),
        S2(T`Since \(${m}\ne\pm${k}\), the two sets have no common element.`, T`ដោយ \(${m}\ne\pm${k}\) សំណុំទាំងពីរគ្មានធាតុរួមទេ។`),
        DM(T`A\cap B=\varnothing`),
      ];
    }
    const opts = ['A=B', T`A\subsetneq B`, T`B\subsetneq A`, T`A\cap B=\varnothing`];
    return {
      q: T`Let \(A=${A}\) and \(B=${B}\). Then the relationship between \(A\) and \(B\) is`,
      correct: opts[ans],
      wrong: opts.filter((_, i) => i !== ans),
      sol: why,
      key: S2('First find the elements of each set, then compare them.', 'ដំបូងរកធាតុនៃសំណុំនីមួយៗ រួចប្រៀបធៀបពួកវា។'),
      steps: st,
    };
  }, XO);

  def('set-interval', 'sets', (r) => {
    const p = r.int(-4, 1), q = p + r.int(2, 5), c = r.int(p + 1, q - 1);
    const gt = r.chance(0.5);
    const B = gt ? T`\{x\mid x>${c}\}` : T`\{x\mid x<${c}\}`;
    const cap = r.chance(0.5);
    const S = (cond) => T`\{x\mid ${cond}\}`;
    const res = gt
      ? { cap: S(T`${c}<x\le ${q}`), cup: S(T`x\ge ${p}`) }
      : { cap: S(T`${p}\le x<${c}`), cup: S(T`x\le ${q}`) };
    const correct = cap ? res.cap : res.cup;
    return {
      q: T`Let \(A=\{x\mid ${p}\le x\le ${q}\}\) and \(B=${B}\). Then \(${cap ? T`A\cap B` : T`A\cup B`}=\)`,
      correct,
      wrong: [cap ? res.cup : res.cap, gt ? S(T`${p}\le x<${c}`) : S(T`${c}<x\le ${q}`), gt ? S(T`x>${c}`) : S(T`x<${c}`), S(T`${p}\le x\le ${q}`)],
      sol: cap
        ? T`\(A\cap B\) keeps the numbers in both sets: \(${correct}\).`
        : T`\(A\cup B\) keeps the numbers in either set. Together they cover \(${correct}\).`,
      key: cap
        ? S2('Draw both sets on a number line. The intersection is the part covered by both sets.', 'គូសសំណុំទាំងពីរលើអ័ក្សចំនួន។ ប្រសព្វ ជាផ្នែកដែលសំណុំទាំងពីរគ្របដណ្តប់រួមគ្នា។')
        : S2('Draw both sets on a number line. The union is the part covered by at least one of the sets.', 'គូសសំណុំទាំងពីរលើអ័ក្សចំនួន។ ប្រជុំ ជាផ្នែកដែលសំណុំយ៉ាងហោចណាស់មួយគ្របដណ្តប់។'),
      steps: [
        S2(T`\(A\) is the closed interval \([${p},${q}]\); \(B\) is all \(x${gt ? '>' : '<'}${c}\), and \(${p}<${c}<${q}\).`, T`\(A\) ជាចន្លោះបិទ \([${p},${q}]\); \(B\) ជាគ្រប់ \(x${gt ? '>' : '<'}${c}\) ហើយ \(${p}<${c}<${q}\)។`),
        cap
          ? S2(T`\(x\) must satisfy both \(${p}\le x\le ${q}\) and \(x${gt ? '>' : '<'}${c}\). The overlap is:`, T`\(x\) ត្រូវផ្ទៀងផ្ទាត់ទាំង \(${p}\le x\le ${q}\) និង \(x${gt ? '>' : '<'}${c}\)។ ផ្នែករួមគឺ៖`)
          : gt
            ? S2(T`\(A\) starts at \(${p}\) and \(B\) continues to \(+\infty\); there is no gap since \(${c}<${q}\).`, T`\(A\) ចាប់ផ្តើមពី \(${p}\) ហើយ \(B\) បន្តទៅ \(+\infty\); គ្មានចន្លោះប្រហោងទេ ព្រោះ \(${c}<${q}\)។`)
            : S2(T`\(B\) comes from \(-\infty\) and \(A\) ends at \(${q}\); there is no gap since \(${p}<${c}\).`, T`\(B\) មកពី \(-\infty\) ហើយ \(A\) បញ្ចប់ត្រឹម \(${q}\); គ្មានចន្លោះប្រហោងទេ ព្រោះ \(${p}<${c}\)។`),
        DM(T`${cap ? T`A\cap B` : T`A\cup B`}=${correct}`),
      ],
    };
  }, XO);

  def('condition-choice', 'ineq', (r) => {
    const kk = r.int(1, 3);
    const nec = r.chance(0.6);
    const yes = nec ? T`a+${kk}>b` : T`a-${kk}>b`;
    const other = nec ? T`a-${kk}>b` : T`a+${kk}>b`;
    return {
      q: T`Which of the following is a ${nec ? 'necessary' : 'sufficient'} condition for \(a>b\)?`,
      correct: yes,
      wrong: [other, T`a^2>b^2`, T`\dfrac{1}{a}<\dfrac{1}{b}`, T`|a|>|b|`],
      sol: nec
        ? T`A necessary condition must follow from \(a>b\). If \(a>b\) then \(a+${kk}>b\). The others can fail (e.g. \(a=1,b=-3\)).`
        : T`A sufficient condition must guarantee \(a>b\). If \(a-${kk}>b\) then \(a>b+${kk}>b\). The others do not guarantee it (e.g. \(a=-3,b=1\) gives \(a^2>b^2\)).`,
      key: nec
        ? S2(T`\(q\) is a necessary condition for \(p\) when \(p\Rightarrow q\) (whenever \(p\) is true, \(q\) is true). Here \(p\) is \(a>b\).`, T`\(q\) ជាលក្ខខណ្ឌចាំបាច់សម្រាប់ \(p\) កាលណា \(p\Rightarrow q\) (រាល់ពេល \(p\) ពិត នោះ \(q\) ក៏ពិត)។ នៅទីនេះ \(p\) គឺ \(a>b\)។`)
        : S2(T`\(q\) is a sufficient condition for \(p\) when \(q\Rightarrow p\) (\(q\) true guarantees \(p\) true). Here \(p\) is \(a>b\).`, T`\(q\) ជាលក្ខខណ្ឌគ្រប់គ្រាន់សម្រាប់ \(p\) កាលណា \(q\Rightarrow p\) (\(q\) ពិត ធានាថា \(p\) ពិត)។ នៅទីនេះ \(p\) គឺ \(a>b\)។`),
      steps: nec
        ? [
            S2(T`Assume \(a>b\). Since \(${kk}>0\), adding \(${kk}\) to the bigger side keeps it bigger:`, T`ឧបមាថា \(a>b\)។ ដោយ \(${kk}>0\) ការបូក \(${kk}\) ទៅអង្គធំ វានៅតែធំជាង៖`),
            DM(T`a>b\Rightarrow a+${kk}>a>b\Rightarrow a+${kk}>b`),
            S2(T`So \(a+${kk}>b\) always follows from \(a>b\): it is a necessary condition.`, T`ដូច្នេះ \(a+${kk}>b\) ពិតជានិច្ចកាលណា \(a>b\)៖ វាជាលក្ខខណ្ឌចាំបាច់។`),
            S2(T`The other options can fail while \(a>b\): with \(a=1,\ b=0\) we get \(a-${kk}>b\) false; with \(a=1,\ b=-3\) we get \(a^2>b^2\), \(|a|>|b|\) and \(\frac1a<\frac1b\) false.`, T`ជម្រើសផ្សេងទៀតអាចមិនពិត ទោះ \(a>b\)៖ យក \(a=1,\ b=0\) នោះ \(a-${kk}>b\) មិនពិត; យក \(a=1,\ b=-3\) នោះ \(a^2>b^2\), \(|a|>|b|\) និង \(\frac1a<\frac1b\) មិនពិត។`),
          ]
        : [
            S2(T`Assume \(a-${kk}>b\). Then:`, T`ឧបមាថា \(a-${kk}>b\)។ គេបាន៖`),
            DM(T`a>b+${kk}>b\Rightarrow a>b`),
            S2(T`So \(a-${kk}>b\) guarantees \(a>b\): it is a sufficient condition.`, T`ដូច្នេះ \(a-${kk}>b\) ធានាថា \(a>b\)៖ វាជាលក្ខខណ្ឌគ្រប់គ្រាន់។`),
            S2(T`The other options do not guarantee \(a>b\): \(a=-3,\ b=1\) gives \(a^2>b^2\) and \(|a|>|b|\) but \(a<b\); \(a=b=0\) gives \(a+${kk}>b\); \(a=-1,\ b=1\) gives \(\frac1a<\frac1b\).`, T`ជម្រើសផ្សេងទៀតមិនធានាថា \(a>b\) ទេ៖ \(a=-3,\ b=1\) ផ្តល់ \(a^2>b^2\) និង \(|a|>|b|\) ប៉ុន្តែ \(a<b\); \(a=b=0\) ផ្តល់ \(a+${kk}>b\); \(a=-1,\ b=1\) ផ្តល់ \(\frac1a<\frac1b\)។`),
          ],
    };
  }, XO);

  def('ineq-lead-param', 'ineq', (r) => {
    const a = r.pick([-1, -2, -3]);
    const [p, q] = r.shuffle(range(-3, 4).filter((x) => x !== 0)).slice(0, 2).sort((x, y) => x - y);
    const b = -a * (p + q), c = a * p * q;
    if (c === 0) throw new Error('c=0');
    const askA = r.chance(0.6);
    const val = askA ? a : b;
    return {
      q: T`If the inequality \(ax^2+bx${k(c)}>0\) has the solution set \(${iv(p, q, false, false)}\), then \(${askA ? 'a' : 'b'}=\)`,
      correct: String(val),
      wrong: [String(-val), String(askA ? b : a), String(val + 1), String(val - 1), String(2 * val)],
      sol: T`The solution set lies between the roots, so \(a<0\) and \(${p},${q}\) are the roots of \(ax^2+bx${k(c)}=0\). Product of roots \(\frac{${c}}{a}=${p * q}\Rightarrow a=${a}\); sum \(-\frac{b}{a}=${p + q}\Rightarrow b=${b}\).`,
      key: S2(T`If \(ax^2+bx+c>0\) has solution set \((x_1,x_2)\), the parabola opens downward (\(a<0\)) and \(x_1,x_2\) are the roots, so \(x_1+x_2=-\frac ba\), \(x_1x_2=\frac ca\) (Vieta).`, T`បើ \(ax^2+bx+c>0\) មានសំណុំចម្លើយ \((x_1,x_2)\) នោះប៉ារ៉ាបូលបើកចុះក្រោម (\(a<0\)) ហើយ \(x_1,x_2\) ជាឫស ដូច្នេះ \(x_1+x_2=-\frac ba\), \(x_1x_2=\frac ca\) (ទ្រឹស្តីបទវីយែត)។`),
      steps: [
        S2(T`The solution set \(${iv(p, q, false, false)}\) is between the roots, so \(a<0\) and the roots are \(x_1=${p}\), \(x_2=${q}\).`, T`សំណុំចម្លើយ \(${iv(p, q, false, false)}\) ស្ថិតនៅចន្លោះឫស ដូច្នេះ \(a<0\) ហើយឫសគឺ \(x_1=${p}\), \(x_2=${q}\)។`),
        S2('Product of the roots:', 'ផលគុណឫស៖'),
        DM(T`x_1x_2=\frac{${c}}{a}\ \Rightarrow\ ${p}\cdot${pr(q)}=\frac{${c}}{a}\ \Rightarrow\ a=\frac{${c}}{${p * q}}=${a}`),
        S2('Sum of the roots:', 'ផលបូកឫស៖'),
        DM(T`x_1+x_2=-\frac{b}{a}\ \Rightarrow\ ${p}+${pr(q)}=-\frac{b}{${a}}\ \Rightarrow\ b=${b}`),
        S2(T`Check: \(a=${a}<0\) ✓. So \(${askA ? 'a' : 'b'}=${val}\).`, T`ផ្ទៀងផ្ទាត់៖ \(a=${a}<0\) ✓។ ដូច្នេះ \(${askA ? 'a' : 'b'}=${val}\)។`),
      ],
    };
  }, XO);

  def('quad-min-param', 'func', (r) => {
    const h = r.nz(-3, 3), m = r.int(-3, 5);
    const b = -2 * h, c = m + h * h;
    return {
      q: T`If \(f(x)=x^2+bx+c\) has a minimum value of \(${m}\) at \(x=${h}\), then \(b+c=\)`,
      correct: String(b + c),
      wrong: [String(-b + c), String(b + m), String(-b + m - h * h), String(b + c + 1)].concat(nb(b + c)),
      sol: T`\(f(x)=(x-${h < 0 ? `(${h})` : h})^2+${m < 0 ? `(${m})` : m}=x^2${k(b)}x${k(c)}\), so \(b=${b}\), \(c=${c}\) and \(b+c=${b + c}\).`,
      key: S2(T`Vertex form: \(f(x)=(x-h)^2+k\) has its minimum value \(k\) at \(x=h\).`, T`ទម្រង់កំពូល៖ \(f(x)=(x-h)^2+k\) មានតម្លៃអប្បបរមា \(k\) ត្រង់ \(x=h\)។`),
      steps: [
        S2(T`The minimum is \(${m}\) at \(x=${h}\), so:`, T`អប្បបរមាគឺ \(${m}\) ត្រង់ \(x=${h}\) ដូច្នេះ៖`),
        DM(T`f(x)=${sq('x', h)}${k(m)}`),
        S2('Expand:', 'ពន្លាត៖'),
        DM(T`f(x)=x^2${k(-2 * h)}x+${h * h}${k(m)}=x^2${k(b)}x${k(c)}`),
        S2(T`Compare with \(x^2+bx+c\): \(b=${b}\), \(c=${c}\).`, T`ប្រៀបធៀបជាមួយ \(x^2+bx+c\)៖ \(b=${b}\), \(c=${c}\)។`),
        DM(T`b+c=${b}+${pr(c)}=${b + c}`),
      ],
    };
  }, XO);

  def('exp-monotone', 'expolog', (r) => {
    const a = r.pick([2, 3, 5]), c = r.int(-3, 3);
    const v = r.int(1, 3);
    const R = T`\mathbb{R}`;
    if (v === 3) {
      const opts = [T`Increasing on \((0,+\infty)\)`, T`Decreasing on \((0,+\infty)\)`, T`Increasing on \(${R}\)`, 'A constant function'];
      return { q: T`The function \(f(x)=\log_{${a}}x${k(c)}\) is`, math: false, correct: opts[0], wrong: opts.slice(1), sol: T`The domain is \((0,+\infty)\), and \(\log_{${a}}x\) with base \(${a}>1\) is increasing there; adding \(${c}\) does not change this.`,
        key: S2(T`\(y=\log_a x\) is increasing on \((0,+\infty)\) when \(a>1\), and decreasing when \(0<a<1\).`, T`\(y=\log_a x\) កើនលើ \((0,+\infty)\) កាលណា \(a>1\) ហើយចុះកាលណា \(0<a<1\)។`),
        steps: [
          S2(T`Domain: \(x>0\), that is \((0,+\infty)\).`, T`ដែនកំណត់៖ \(x>0\) គឺ \((0,+\infty)\)។`),
          S2(T`The base is \(${a}>1\), so \(\log_{${a}}x\) is increasing on \((0,+\infty)\).`, T`គោលគឺ \(${a}>1\) ដូច្នេះ \(\log_{${a}}x\) កើនលើ \((0,+\infty)\)។`),
          ...(c ? [S2(T`Adding \(${c}\) only moves the graph ${c > 0 ? 'up' : 'down'}; it does not change where the function increases.`, T`ការបូក \(${c}\) គ្រាន់តែរំកិលក្រាប${c > 0 ? 'ឡើងលើ' : 'ចុះក្រោម'} មិនប្តូរភាពកើនរបស់អនុគមន៍ទេ។`)] : []),
        ] };
    }
    const inc = v === 1;
    const base = inc ? String(a) : T`\left(\frac{1}{${a}}\right)`;
    const opts = [T`Increasing on \(${R}\)`, T`Decreasing on \(${R}\)`, 'A constant function', T`Increasing only on \((0,+\infty)\)`];
    return {
      q: T`The function \(f(x)=${base}^x${k(c)}\) is`,
      math: false,
      correct: opts[inc ? 0 : 1],
      wrong: opts.filter((_, i) => i !== (inc ? 0 : 1)),
      sol: inc ? T`The base \(${a}>1\), so \(${a}^x\) is increasing on \(${R}\); adding a constant keeps it increasing.` : T`The base \(\frac1{${a}}\) is between 0 and 1, so the function is decreasing on \(${R}\).`,
      key: S2(T`\(y=a^x\) (domain \(\mathbb R\)) is increasing when \(a>1\) and decreasing when \(0<a<1\).`, T`\(y=a^x\) (ដែនកំណត់ \(\mathbb R\)) កើនកាលណា \(a>1\) ហើយចុះកាលណា \(0<a<1\)។`),
      steps: [
        S2(T`The domain of an exponential function is \(\mathbb R\).`, T`ដែនកំណត់នៃអនុគមន៍អិចស្ប៉ូណង់ស្យែលគឺ \(\mathbb R\)។`),
        inc
          ? S2(T`The base is \(${a}>1\), so \(${a}^x\) is increasing on \(\mathbb R\).`, T`គោលគឺ \(${a}>1\) ដូច្នេះ \(${a}^x\) កើនលើ \(\mathbb R\)។`)
          : S2(T`The base is \(\frac{1}{${a}}\) and \(0<\frac{1}{${a}}<1\), so \(\left(\frac{1}{${a}}\right)^x\) is decreasing on \(\mathbb R\).`, T`គោលគឺ \(\frac{1}{${a}}\) ហើយ \(0<\frac{1}{${a}}<1\) ដូច្នេះ \(\left(\frac{1}{${a}}\right)^x\) ចុះលើ \(\mathbb R\)។`),
        ...(c ? [S2(T`Adding \(${c}\) only moves the graph ${c > 0 ? 'up' : 'down'}; it does not change whether it increases or decreases.`, T`ការបូក \(${c}\) គ្រាន់តែរំកិលក្រាប${c > 0 ? 'ឡើងលើ' : 'ចុះក្រោម'} មិនប្តូរភាពកើន ឬចុះទេ។`)] : []),
      ],
    };
  }, XO);

  def('log-value', 'expolog', (r) => {
    const b = r.pick([2, 3, 4, 5]), kk = r.pick([2, 3, -1]);
    if (b ** Math.abs(kk) > 125) throw new Error('big');
    const ans = kk > 0 ? String(b ** kk) : F(1, b);
    return {
      q: T`Let \(f(x)=\log_{${b}}x\). If \(f(a)=${kk}\), then \(a=\)`,
      correct: ans,
      wrong: [String(b * kk), String(kk ** b), String(b + kk), kk > 0 ? F(1, b ** kk) : String(-b), String(kk)],
      sol: T`\(\log_{${b}}a=${kk}\iff a=${b}^{${kk}}=${ans}\).`,
      key: S2(T`\(\log_b a=k\iff a=b^k\) (\(b>0,\ b\ne1,\ a>0\)).`, T`\(\log_b a=k\iff a=b^k\) (\(b>0,\ b\ne1,\ a>0\))។`),
      steps: [
        S2(T`\(f(a)=${kk}\) means \(\log_{${b}}a=${kk}\).`, T`\(f(a)=${kk}\) មានន័យថា \(\log_{${b}}a=${kk}\)។`),
        S2('Rewrite it in exponential form:', 'សរសេរជាទម្រង់ស្វ័យគុណ៖'),
        DM(T`a=${b}^{${kk}}=${ans}`),
      ],
    };
  }, XO);

  def('power-func', 'expolog', (r) => {
    const yes = [T`f(x)=x^{-2}`, T`f(x)=x^{3}`, T`f(x)=x^{\frac{1}{2}}`, T`f(x)=x^{-1}`, T`f(x)=x^{\frac{2}{3}}`];
    const no = [T`f(x)=2x^{2}`, T`f(x)=x^{2}+1`, T`f(x)=2^{x}`, T`f(x)=\log_{2}x`, T`f(x)=3x^{-1}`, T`f(x)=(x+1)^{2}`];
    const ALPHA = { [T`f(x)=x^{-2}`]: '-2', [T`f(x)=x^{3}`]: '3', [T`f(x)=x^{\frac{1}{2}}`]: T`\frac{1}{2}`, [T`f(x)=x^{-1}`]: '-1', [T`f(x)=x^{\frac{2}{3}}`]: T`\frac{2}{3}` };
    const cf = r.pick(yes);
    return {
      q: T`Which of the following functions is a power function?`,
      correct: cf,
      wrong: r.shuffle(no),
      sol: T`A power function has the form \(f(x)=x^{\alpha}\) exactly: coefficient 1, variable in the base, constant exponent, nothing added.`,
      key: S2(T`A power function has the form \(y=x^{\alpha}\) (\(\alpha\) a constant): coefficient exactly \(1\), the variable in the base, nothing added.`, T`អនុគមន៍ស្វ័យគុណមានទម្រង់ \(y=x^{\alpha}\) (\(\alpha\) ជាចំនួនថេរ)៖ មេគុណស្មើ \(1\) អថេរនៅគោល ហើយគ្មានតួបន្ថែម។`),
      steps: [
        S2(T`\(${cf}\) has exactly this form, with \(\alpha=${ALPHA[cf]}\).`, T`\(${cf}\) មានទម្រង់នេះពិតប្រាកដ ដោយ \(\alpha=${ALPHA[cf]}\)។`),
        S2(T`The others are not power functions: \(2x^2\) and \(3x^{-1}\) have a coefficient \(\ne1\); \(x^2+1\) and \((x+1)^2\) are not a single \(x^{\alpha}\); \(2^x\) is exponential (the variable is in the exponent); \(\log_2x\) is logarithmic.`, T`ជម្រើសផ្សេងទៀតមិនមែនជាអនុគមន៍ស្វ័យគុណទេ៖ \(2x^2\) និង \(3x^{-1}\) មានមេគុណ \(\ne1\); \(x^2+1\) និង \((x+1)^2\) មិនមែនជា \(x^{\alpha}\) តែមួយ; \(2^x\) ជាអនុគមន៍អិចស្ប៉ូណង់ស្យែល (អថេរនៅនិទស្សន្ត); \(\log_2x\) ជាអនុគមន៍លោការីត។`),
      ],
    };
  }, XO);

  def('deriv-formula', 'deriv', (r) => {
    const a = r.nz(-2, 3), b = r.int(-3, 3), c = r.nz(-4, 4), d = r.int(-5, 5);
    const f = lc([[a, 'x^3'], [b, 'x^2'], [c, 'x'], [d, '']]);
    const D = (p, q, s, t) => T`f'(x)=` + lc([[p, 'x^2'], [q, 'x'], [s, ''], [t || 0, '']]);
    return {
      q: T`The derivative of the function \(f(x)=${f}\) is`,
      correct: D(3 * a, 2 * b, c),
      wrong: [D(3 * a, 2 * b, c, d), D(a, b, c), D(3 * a, b, c), D(3 * a, 2 * b, 0), D(3 * a, 2 * b + c, 0)],
      sol: T`Differentiate term by term with \((x^n)'=nx^{n-1}\) and \((C)'=0\): \(f'(x)=${lc([[3 * a, 'x^2'], [2 * b, 'x'], [c, '']])}\).`,
      key: S2(T`\((x^n)'=nx^{n-1}\), \((kx^n)'=k\,nx^{n-1}\), \((C)'=0\); the derivative of a sum is the sum of the derivatives.`, T`\((x^n)'=nx^{n-1}\), \((kx^n)'=k\,nx^{n-1}\), \((C)'=0\); ដេរីវេនៃផលបូក ស្មើផលបូកនៃដេរីវេ។`),
      steps: [
        S2('Differentiate each term:', 'គណនាដេរីវេនៃតួនីមួយៗ៖'),
        DM([T`(${lc([[a, 'x^3']])})'=${lc([[3 * a, 'x^2']])}`, b ? T`(${lc([[b, 'x^2']])})'=${lc([[2 * b, 'x']])}` : '', T`(${lc([[c, 'x']])})'=${c}`, d ? T`(${d})'=0` : ''].filter(Boolean).join(T`,\qquad `)),
        S2('Add the results:', 'បូកលទ្ធផលទាំងនោះ៖'),
        DM(T`f'(x)=${lc([[3 * a, 'x^2'], [2 * b, 'x'], [c, '']])}`),
      ],
    };
  }, XO);

  def('deriv-meaning', 'deriv', (r) => {
    if (r.chance(0.5)) {
      const opts = [
        T`The slope of the tangent line to the graph of \(y=f(x)\) at \(x=x_0\)`,
        T`The slope of a secant line of the graph of \(y=f(x)\)`,
        T`The value of the function \(f(x)\) at \(x=x_0\)`,
        T`The average rate of change of \(f(x)\) on \([x_0,x_0+\Delta x]\)`,
      ];
      return { q: T`The geometric meaning of the derivative \(f'(x_0)\) of the function \(f(x)\) at \(x=x_0\) is`, math: false, correct: opts[0], wrong: opts.slice(1), sol: T`By definition \(f'(x_0)=\lim_{\Delta x\to0}\frac{f(x_0+\Delta x)-f(x_0)}{\Delta x}\): the limit of secant slopes, which is the slope of the tangent line at \(x=x_0\).`,
        key: S2(T`Definition: \(f'(x_0)=\lim\limits_{\Delta x\to0}\dfrac{f(x_0+\Delta x)-f(x_0)}{\Delta x}\).`, T`និយមន័យ៖ \(f'(x_0)=\lim\limits_{\Delta x\to0}\dfrac{f(x_0+\Delta x)-f(x_0)}{\Delta x}\)។`),
        steps: [
          S2(T`\(\dfrac{f(x_0+\Delta x)-f(x_0)}{\Delta x}\) is the slope of the secant line through \((x_0,f(x_0))\) and \((x_0+\Delta x,f(x_0+\Delta x))\).`, T`\(\dfrac{f(x_0+\Delta x)-f(x_0)}{\Delta x}\) ជាមេគុណប្រាប់ទិសនៃបន្ទាត់កាត់ (secant) ដែលកាត់តាម \((x_0,f(x_0))\) និង \((x_0+\Delta x,f(x_0+\Delta x))\)។`),
          S2(T`When \(\Delta x\to0\), the secant line turns into the tangent line at \(x=x_0\).`, T`កាលណា \(\Delta x\to0\) បន្ទាត់កាត់ក្លាយជាបន្ទាត់ប៉ះត្រង់ \(x=x_0\)។`),
          S2(T`So \(f'(x_0)\) is the slope of the tangent line to \(y=f(x)\) at \(x=x_0\).`, T`ដូច្នេះ \(f'(x_0)\) ជាមេគុណប្រាប់ទិសនៃបន្ទាត់ប៉ះនឹងក្រាប \(y=f(x)\) ត្រង់ \(x=x_0\)។`),
        ] };
    }
    const pos = r.chance(0.5);
    const [a, b] = r.distinct(2, -3, 4).sort((x, y) => x - y);
    const opts = ['Increasing', 'Decreasing', 'Constant', 'Cannot be determined'];
    return {
      q: T`If \(f'(x)${pos ? '>' : '<'}0\) for all \(x\) in \((${a},${b})\), then on \((${a},${b})\) the function \(f(x)\) is`,
      math: false,
      correct: opts[pos ? 0 : 1],
      wrong: opts.filter((_, i) => i !== (pos ? 0 : 1)),
      sol: pos ? T`\(f'(x)>0\) on an interval means \(f\) is increasing there.` : T`\(f'(x)<0\) on an interval means \(f\) is decreasing there.`,
      key: S2(T`On an interval: \(f'(x)>0\Rightarrow f\) is increasing; \(f'(x)<0\Rightarrow f\) is decreasing.`, T`លើចន្លោះមួយ៖ \(f'(x)>0\Rightarrow f\) កើន; \(f'(x)<0\Rightarrow f\) ចុះ។`),
      steps: [
        S2(T`\(f'(x)\) is the slope of the tangent line at each point of the graph.`, T`\(f'(x)\) ជាមេគុណប្រាប់ទិសនៃបន្ទាត់ប៉ះត្រង់ចំណុចនីមួយៗនៃក្រាប។`),
        pos
          ? S2(T`On \((${a},${b})\) every tangent slope is positive, so the graph goes up from left to right: \(f\) is increasing.`, T`លើ \((${a},${b})\) មេគុណប្រាប់ទិសនៃបន្ទាត់ប៉ះទាំងអស់វិជ្ជមាន ដូច្នេះក្រាបឡើងពីឆ្វេងទៅស្តាំ៖ \(f\) កើន។`)
          : S2(T`On \((${a},${b})\) every tangent slope is negative, so the graph goes down from left to right: \(f\) is decreasing.`, T`លើ \((${a},${b})\) មេគុណប្រាប់ទិសនៃបន្ទាត់ប៉ះទាំងអស់អវិជ្ជមាន ដូច្នេះក្រាបចុះពីឆ្វេងទៅស្តាំ៖ \(f\) ចុះ។`),
      ],
    };
  }, XO);

  const TRIG_FACTS = {
    sin: {
      t: ['It is an odd function', T`Its smallest positive period is \(2\pi\)`, T`It is increasing on \(\left[-\frac{\pi}{2},\frac{\pi}{2}\right]\)`, T`Its range is \([-1,1]\)`, 'Its graph is symmetric about the origin'],
      f: ['It is an even function', T`Its smallest positive period is \(\pi\)`, T`It is decreasing on \(\left[0,\frac{\pi}{2}\right]\)`, T`Its range is \((0,1)\)`, T`Its maximum value is \(2\)`],
    },
    cos: {
      t: ['It is an even function', T`Its smallest positive period is \(2\pi\)`, T`It is decreasing on \([0,\pi]\)`, T`Its range is \([-1,1]\)`, T`Its graph is symmetric about the \(y\)-axis`],
      f: ['It is an odd function', T`Its smallest positive period is \(\pi\)`, T`It is increasing on \([0,\pi]\)`, T`Its range is \((0,1)\)`, T`Its minimum value is \(0\)`],
    },
    tan: {
      t: [T`Its smallest positive period is \(\pi\)`, 'It is an odd function'],
      f: [T`Its range is \([-1,1]\)`, 'It is an even function', T`Its smallest positive period is \(2\pi\)`, T`Its maximum value is \(1\)`],
    },
  };
  def('trig-props', 'trig', (r) => {
    const fn = r.pick(['sin', 'sin', 'cos', 'cos', 'tan']);
    const F_ = TRIG_FACTS[fn];
    return {
      q: T`For the function \(f(x)=${BS + fn} x\), which of the following statements is correct?`,
      math: false,
      correct: r.pick(F_.t),
      wrong: r.shuffle(F_.f),
      sol: { sin: T`\(\sin x\) is odd, has period \(2\pi\), range \([-1,1]\), and increases on \(\left[-\frac\pi2,\frac\pi2\right]\).`, cos: T`\(\cos x\) is even, has period \(2\pi\), range \([-1,1]\), and decreases on \([0,\pi]\).`, tan: T`\(\tan x\) is odd, has period \(\pi\) and range \(\mathbb{R}\).` }[fn],
      key: S2(T`Know the basic properties of \(y=${BS + fn} x\): parity, period, range and where it increases or decreases.`, T`ត្រូវចាំលក្ខណៈមូលដ្ឋាននៃ \(y=${BS + fn} x\)៖ ភាពគូ/សេស ខួប សំណុំតម្លៃ និងចន្លោះកើន/ចុះ។`),
      steps: {
        sin: [
          S2(T`Odd: \(\sin(-x)=-\sin x\); the graph is symmetric about the origin.`, T`សេស៖ \(\sin(-x)=-\sin x\); ក្រាបឆ្លុះធៀបគល់តម្រុយ។`),
          S2(T`Smallest positive period: \(T=2\pi\).`, T`ខួបវិជ្ជមានតូចបំផុត៖ \(T=2\pi\)។`),
          S2(T`Range: \([-1,1]\) (maximum \(1\), minimum \(-1\)).`, T`សំណុំតម្លៃ៖ \([-1,1]\) (អតិបរមា \(1\) អប្បបរមា \(-1\))។`),
          S2(T`Increasing on \(\left[-\frac{\pi}{2},\frac{\pi}{2}\right]\), decreasing on \(\left[\frac{\pi}{2},\frac{3\pi}{2}\right]\).`, T`កើនលើ \(\left[-\frac{\pi}{2},\frac{\pi}{2}\right]\) ចុះលើ \(\left[\frac{\pi}{2},\frac{3\pi}{2}\right]\)។`),
        ],
        cos: [
          S2(T`Even: \(\cos(-x)=\cos x\); the graph is symmetric about the \(y\)-axis.`, T`គូ៖ \(\cos(-x)=\cos x\); ក្រាបឆ្លុះធៀបអ័ក្ស \(y\)។`),
          S2(T`Smallest positive period: \(T=2\pi\).`, T`ខួបវិជ្ជមានតូចបំផុត៖ \(T=2\pi\)។`),
          S2(T`Range: \([-1,1]\) (maximum \(1\), minimum \(-1\)).`, T`សំណុំតម្លៃ៖ \([-1,1]\) (អតិបរមា \(1\) អប្បបរមា \(-1\))។`),
          S2(T`Decreasing on \([0,\pi]\), increasing on \([\pi,2\pi]\).`, T`ចុះលើ \([0,\pi]\) កើនលើ \([\pi,2\pi]\)។`),
        ],
        tan: [
          S2(T`Odd: \(\tan(-x)=-\tan x\).`, T`សេស៖ \(\tan(-x)=-\tan x\)។`),
          S2(T`Smallest positive period: \(T=\pi\).`, T`ខួបវិជ្ជមានតូចបំផុត៖ \(T=\pi\)។`),
          S2(T`Domain: \(x\ne\frac{\pi}{2}+k\pi\); range: \(\mathbb R\) (no maximum or minimum).`, T`ដែនកំណត់៖ \(x\ne\frac{\pi}{2}+k\pi\); សំណុំតម្លៃ៖ \(\mathbb R\) (គ្មានអតិបរមា ឬអប្បបរមា)។`),
        ],
      }[fn].concat([S2('Compare each statement with these facts: only the correct option agrees with them.', 'ប្រៀបធៀបសំណើនីមួយៗជាមួយលក្ខណៈខាងលើ៖ មានតែជម្រើសត្រឹមត្រូវប៉ុណ្ណោះដែលស្របគ្នា។')]),
    };
  }, XO);

  def('line-point-slope', 'lines', (r) => {
    const x0 = r.nz(-4, 4), y0 = r.nz(-4, 4), kk = r.pick([2, 3, -2, -3, 4, -4]);
    if (Math.abs(x0) === Math.abs(y0)) throw new Error('ambiguous');
    const L = (a, b) => T`${lin('y', a)}=${kk}(${lin('x', b)})`;
    return {
      q: T`The equation of the line passing through the point \((${x0},${y0})\) with slope \(${kk}\) is`,
      correct: L(y0, x0),
      wrong: [L(-y0, -x0), L(x0, y0), L(-x0, -y0), L(y0, -x0)],
      sol: T`Point–slope form \(y-y_0=k(x-x_0)\) with \((x_0,y_0)=(${x0},${y0})\), \(k=${kk}\): \(${L(y0, x0)}\).`,
      key: S2(T`Point–slope form: the line through \((x_0,y_0)\) with slope \(k\) is \(y-y_0=k(x-x_0)\).`, T`ទម្រង់ចំណុច–មេគុណប្រាប់ទិស៖ បន្ទាត់កាត់តាម \((x_0,y_0)\) ហើយមានមេគុណប្រាប់ទិស \(k\) គឺ \(y-y_0=k(x-x_0)\)។`),
      steps: [
        S2(T`Here \(x_0=${x0}\), \(y_0=${y0}\), \(k=${kk}\). Substitute:`, T`នៅទីនេះ \(x_0=${x0}\), \(y_0=${y0}\), \(k=${kk}\)។ ជំនួស៖`),
        DM(T`y-${pr(y0)}=${kk}\left(x-${pr(x0)}\right)`),
        S2('Simplify the signs:', 'សម្រួលសញ្ញា៖'),
        DM(L(y0, x0)),
      ],
    };
  }, XO);


  /* ---- real-paper style: Part 3 additions ---- */
  def('ellipse-from-axes', 'conics', (r) => {
    const [b, a] = r.distinct(2, 2, 6).sort((x, y) => x - y);
    const vert = r.chance(0.35);
    const E = (p, q) => T`\frac{x^2}{${p}}+\frac{y^2}{${q}}=1`;
    const correct = vert ? E(b * b, a * a) : E(a * a, b * b);
    return {
      q: T`The equation of the ellipse with vertices at \(${vert ? T`(0,\pm${a})` : T`(\pm${a},0)`}\) and minor axis length \(${2 * b}\) is`,
      correct,
      wrong: [vert ? E(a * a, b * b) : E(b * b, a * a), vert ? E(b * b, a * a + b * b) : E(a * a, a * a + b * b), vert ? E(a * a + b * b, a * a) : E(a * a + b * b, b * b), vert ? E(2 * b, 2 * a) : E(2 * a, 2 * b)],
      sol: T`The vertices on the \(${vert ? 'y' : 'x'}\)-axis give \(a=${a}\); the minor axis \(2b=${2 * b}\) gives \(b=${b}\). So \(${correct}\).`,
      key: S2(T`Ellipse (\(a>b>0\)): major axis on the \(x\)-axis \(\Rightarrow \frac{x^2}{a^2}+\frac{y^2}{b^2}=1\); on the \(y\)-axis \(\Rightarrow \frac{x^2}{b^2}+\frac{y^2}{a^2}=1\). Minor axis length \(=2b\).`, T`អេលីប (\(a>b>0\))៖ អ័ក្សធំលើអ័ក្ស \(x\) \(\Rightarrow \frac{x^2}{a^2}+\frac{y^2}{b^2}=1\); លើអ័ក្ស \(y\) \(\Rightarrow \frac{x^2}{b^2}+\frac{y^2}{a^2}=1\)។ ប្រវែងអ័ក្សតូច \(=2b\)។`),
      steps: [
        S2(T`The vertices \(${vert ? T`(0,\pm${a})` : T`(\pm${a},0)`}\) are on the \(${vert ? 'y' : 'x'}\)-axis, so the major axis is on the \(${vert ? 'y' : 'x'}\)-axis and \(a=${a}\), \(a^2=${a * a}\).`, T`កំពូល \(${vert ? T`(0,\pm${a})` : T`(\pm${a},0)`}\) ស្ថិតលើអ័ក្ស \(${vert ? 'y' : 'x'}\) ដូច្នេះអ័ក្សធំនៅលើអ័ក្ស \(${vert ? 'y' : 'x'}\) ហើយ \(a=${a}\), \(a^2=${a * a}\)។`),
        S2(T`Minor axis length: \(2b=${2 * b}\Rightarrow b=${b}\), \(b^2=${b * b}\).`, T`ប្រវែងអ័ក្សតូច៖ \(2b=${2 * b}\Rightarrow b=${b}\), \(b^2=${b * b}\)។`),
        DM(correct),
      ],
    };
  }, XO);

  def('parabola-from-focus', 'conics', (r) => {
    const c = r.int(1, 4), sg = r.sign(), onY = r.chance(0.6);
    const m = 4 * c * sg; // x^2 = m y  or y^2 = m x
    const focus = onY ? `(0,${sg * c})` : `(${sg * c},0)`;
    const dir = onY ? T`y=${-sg * c}` : T`x=${-sg * c}`;
    const P = (axisY, coef) => (axisY ? T`x^2=${coefX(coef, 1, 'y')}` : T`y^2=${coefX(coef, 1, 'x')}`);
    return {
      q: T`The equation of the parabola with focus at \(${focus}\) and directrix \(${dir}\) is`,
      correct: P(onY, m),
      wrong: [P(onY, -m), P(!onY, m), P(!onY, -m), P(onY, 2 * m)],
      sol: T`The vertex is midway between focus and directrix, at the origin, with \(\frac p2=${c}\), so \(2p=${4 * c}\). The parabola opens ${onY ? (sg > 0 ? 'upward' : 'downward') : sg > 0 ? 'to the right' : 'to the left'}: \(${P(onY, m)}\).`,
      key: S2(T`\(x^2=2py\): focus \(\left(0,\frac p2\right)\), directrix \(y=-\frac p2\). \(y^2=2px\): focus \(\left(\frac p2,0\right)\), directrix \(x=-\frac p2\).`, T`\(x^2=2py\)៖ កំណុំ \(\left(0,\frac p2\right)\) បន្ទាត់ប្រាប់ទិស \(y=-\frac p2\)។ \(y^2=2px\)៖ កំណុំ \(\left(\frac p2,0\right)\) បន្ទាត់ប្រាប់ទិស \(x=-\frac p2\)។`),
      steps: [
        S2(T`The vertex is halfway between the focus \(${focus}\) and the directrix \(${dir}\): it is the origin \((0,0)\).`, T`កំពូលស្ថិតនៅពាក់កណ្តាលរវាងកំណុំ \(${focus}\) និងបន្ទាត់ប្រាប់ទិស \(${dir}\)៖ គឺគល់តម្រុយ \((0,0)\)។`),
        S2(T`The focus is on the \(${onY ? 'y' : 'x'}\)-axis, so the equation has the form \(${onY ? 'x^2=2py' : 'y^2=2px'}\).`, T`កំណុំស្ថិតលើអ័ក្ស \(${onY ? 'y' : 'x'}\) ដូច្នេះសមីការមានទម្រង់ \(${onY ? 'x^2=2py' : 'y^2=2px'}\)។`),
        DM(T`\frac p2=${sg * c}\ \Rightarrow\ p=${2 * sg * c}\ \Rightarrow\ 2p=${m}`),
        DM(P(onY, m)),
      ],
    };
  }, XO);

  def('complex-conj-product', 'complex', (r) => {
    const a = r.nz(-4, 4), b = r.nz(-4, 4);
    const v = r.int(1, 2);
    if (v === 1)
      return {
        q: T`Let the complex number \(z=${cTex(a, b)}\). Then \(z\cdot\bar z=\)`,
        correct: String(a * a + b * b),
        wrong: [String(a * a - b * b), cTex(0, 2 * a * b), cTex(a, -b), String(-(a * a + b * b)), R(1, a * a + b * b)],
        sol: T`\(\bar z=${cTex(a, -b)}\), and \(z\bar z=a^2+b^2=${a * a}+${b * b}=${a * a + b * b}\).`,
        key: S2(T`If \(z=a+bi\), its conjugate is \(\bar z=a-bi\), and \(z\bar z=a^2+b^2\) (because \(i^2=-1\)).`, T`បើ \(z=a+bi\) ចំនួនកុំផ្លិចឆ្លាស់គឺ \(\bar z=a-bi\) ហើយ \(z\bar z=a^2+b^2\) (ព្រោះ \(i^2=-1\))។`),
        steps: [
          S2('Change the sign of the imaginary part:', 'ប្តូរសញ្ញានៃផ្នែកនិម្មិត៖'),
          DM(T`\bar z=${cTex(a, -b)}`),
          S2(T`Multiply, using \(i^2=-1\):`, T`គុណ ដោយប្រើ \(i^2=-1\)៖`),
          DM(T`z\bar z=(${cTex(a, b)})(${cTex(a, -b)})=${pr(a)}^2-(${b}i)^2=${a * a}+${b * b}=${a * a + b * b}`),
        ],
      };
    return {
      q: T`Let the complex number \(z=${cTex(a, b)}\). Then \(z+\bar z=\)`,
      correct: String(2 * a),
      wrong: [cTex(0, 2 * b), cTex(2 * a, 2 * b), String(a * a + b * b), cTex(0, -2 * b)],
      sol: T`\(\bar z=${cTex(a, -b)}\), so \(z+\bar z=${2 * a}\) (the imaginary parts cancel).`,
      key: S2(T`If \(z=a+bi\), then \(\bar z=a-bi\) and \(z+\bar z=2a\).`, T`បើ \(z=a+bi\) នោះ \(\bar z=a-bi\) ហើយ \(z+\bar z=2a\)។`),
      steps: [
        S2('Change the sign of the imaginary part:', 'ប្តូរសញ្ញានៃផ្នែកនិម្មិត៖'),
        DM(T`\bar z=${cTex(a, -b)}`),
        S2('Add: the imaginary parts cancel.', 'បូក៖ ផ្នែកនិម្មិតលុបគ្នា។'),
        DM(T`z+\bar z=(${cTex(a, b)})+(${cTex(a, -b)})=${2 * a}`),
      ],
    };
  }, XO);

  def('hyperbola-from-ecc', 'conics', (r) => {
    const opt = r.pick([['2', 3, 1], [T`\sqrt{2}`, 1, 1], [T`\frac{5}{4}`, 9, 16], [T`\frac{5}{3}`, 16, 9]]);
    const [e, bn, bd] = opt; // b^2 = a^2 * bn / bd
    const a = opt[2] === 1 ? r.int(1, 4) : opt[2] === 16 ? 4 : 3;
    const A2 = a * a, B2 = (A2 * bn) / bd;
    const vert = r.chance(0.35);
    const H = (p, q, yFirst) => (yFirst ? T`\frac{y^2}{${p}}-\frac{x^2}{${q}}=1` : T`\frac{x^2}{${p}}-\frac{y^2}{${q}}=1`);
    if (A2 === B2 && false) throw new Error('x');
    const correct = H(A2, B2, vert);
    return {
      q: T`The equation of the hyperbola with vertices at \(${vert ? T`(0,\pm${a})` : T`(\pm${a},0)`}\) and eccentricity \(e=${e}\) is`,
      correct,
      wrong: [H(B2, A2, vert), H(A2, B2, !vert), H(B2, A2, !vert), H(A2, A2 + B2, vert), H(A2, B2 + 1, vert)],
      sol: T`\(a=${a}\), \(c=ea\), so \(c^2=${A2 + B2}\) and \(b^2=c^2-a^2=${B2}\). The vertices are on the \(${vert ? 'y' : 'x'}\)-axis: \(${correct}\).`,
      key: S2(T`Hyperbola: \(e=\frac ca\), \(c^2=a^2+b^2\). Vertices on the \(x\)-axis \(\Rightarrow\frac{x^2}{a^2}-\frac{y^2}{b^2}=1\); on the \(y\)-axis \(\Rightarrow\frac{y^2}{a^2}-\frac{x^2}{b^2}=1\).`, T`អ៊ីពែបូល៖ \(e=\frac ca\), \(c^2=a^2+b^2\)។ កំពូលលើអ័ក្ស \(x\) \(\Rightarrow\frac{x^2}{a^2}-\frac{y^2}{b^2}=1\); លើអ័ក្ស \(y\) \(\Rightarrow\frac{y^2}{a^2}-\frac{x^2}{b^2}=1\)។`),
      steps: [
        S2(T`The vertices \(${vert ? T`(0,\pm${a})` : T`(\pm${a},0)`}\) give \(a=${a}\), \(a^2=${A2}\), on the \(${vert ? 'y' : 'x'}\)-axis.`, T`កំពូល \(${vert ? T`(0,\pm${a})` : T`(\pm${a},0)`}\) ផ្តល់ \(a=${a}\), \(a^2=${A2}\) នៅលើអ័ក្ស \(${vert ? 'y' : 'x'}\)។`),
        S2(T`From \(e=\frac ca\): \(c=ea\), so`, T`ពី \(e=\frac ca\)៖ \(c=ea\) ដូច្នេះ`),
        DM(T`c^2=e^2a^2=\left(${e}\right)^2\cdot${A2}=${A2 + B2}`),
        DM(T`b^2=c^2-a^2=${A2 + B2}-${A2}=${B2}`),
        DM(correct),
      ],
    };
  }, XO);

  def('line-parallel-k', 'lines', (r) => {
    const [A, B] = r.pick([[2, -1], [1, -2], [3, -1], [1, 3], [2, 1], [4, -2], [1, -1], [3, 2]]);
    const C = r.int(-5, 5), c = r.nz(-4, 4);
    const par = r.chance(0.6);
    const slope = F(-A, B);
    const val = par ? slope : F(B, A);
    const all = [F(-A, B), F(A, B), F(B, A), F(-B, A)];
    return {
      q: T`If the line \(y=kx${k(c)}\) is ${par ? 'parallel' : 'perpendicular'} to the line \(${lc([[A, 'x'], [B, 'y'], [C, '']])}=0\), then \(k=\)`,
      correct: val,
      wrong: all.filter((x) => x !== val).concat([F(2 * A, B)]),
      sol: par
        ? T`The line \(${lc([[A, 'x'], [B, 'y'], [C, '']])}=0\) has slope \(-\frac{A}{B}=${slope}\). Parallel lines have equal slopes: \(k=${val}\).`
        : T`The given line has slope \(${slope}\). Perpendicular slopes multiply to \(-1\): \(k=${val}\).`,
      key: par
        ? S2(T`The line \(Ax+By+C=0\) has slope \(-\frac AB\). Parallel lines have equal slopes: \(k_1=k_2\).`, T`បន្ទាត់ \(Ax+By+C=0\) មានមេគុណប្រាប់ទិស \(-\frac AB\)។ បន្ទាត់ស្របគ្នាមានមេគុណប្រាប់ទិសស្មើគ្នា៖ \(k_1=k_2\)។`)
        : S2(T`The line \(Ax+By+C=0\) has slope \(-\frac AB\). Perpendicular lines: \(k_1\cdot k_2=-1\).`, T`បន្ទាត់ \(Ax+By+C=0\) មានមេគុណប្រាប់ទិស \(-\frac AB\)។ បន្ទាត់កែងគ្នា៖ \(k_1\cdot k_2=-1\)។`),
      steps: [
        S2(T`Slope of \(${lc([[A, 'x'], [B, 'y'], [C, '']])}=0\):`, T`មេគុណប្រាប់ទិសនៃ \(${lc([[A, 'x'], [B, 'y'], [C, '']])}=0\)៖`),
        DM(T`k_1=-\frac{A}{B}=-\frac{${A}}{${B}}=${slope}`),
        par
          ? S2(T`The line \(y=kx${k(c)}\) has slope \(k\). Parallel \(\Rightarrow k=k_1\):`, T`បន្ទាត់ \(y=kx${k(c)}\) មានមេគុណប្រាប់ទិស \(k\)។ ស្របគ្នា \(\Rightarrow k=k_1\)៖`)
          : S2(T`The line \(y=kx${k(c)}\) has slope \(k\). Perpendicular \(\Rightarrow k\cdot k_1=-1\):`, T`បន្ទាត់ \(y=kx${k(c)}\) មានមេគុណប្រាប់ទិស \(k\)។ កែងគ្នា \(\Rightarrow k\cdot k_1=-1\)៖`),
        DM(par ? T`k=${val}` : T`k=-\frac{1}{k_1}=-\frac{1}{${slope}}=${val}`),
      ],
    };
  }, XO);

  /* ---- real-paper style: Part 4 additions ---- */
  def('die-once', 'prob', (r) => {
    const evs = [
      { e: 'an even number', n: 3, set: [2, 4, 6], km: 'ចំនួនគូ' },
      { e: 'an odd number', n: 3, set: [1, 3, 5], km: 'ចំនួនសេស' },
      { e: 'a multiple of 3', n: 2, set: [3, 6], km: 'ពហុគុណនៃ 3' },
      { e: 'a prime number', n: 3, set: [2, 3, 5], km: 'ចំនួនបឋម' },
    ];
    const m = r.int(1, 4);
    evs.push({ e: T`a number greater than \(${m}\)`, n: 6 - m, set: range(m + 1, 6), km: T`ចំនួនធំជាង \(${m}\)` });
    const ev = r.pick(evs);
    const correct = F(ev.n, 6);
    return {
      q: T`A fair die is rolled once. The probability of getting ${ev.e} is`,
      correct,
      wrong: [F(1, 6), F(1, 3), F(1, 2), F(2, 3), F(5, 6)],
      sol: T`There are 6 equally likely outcomes, and ${ev.n} of them are favourable: \(\frac{${ev.n}}{6}=${correct}\).`,
      key: S2(T`Classical probability: \(P=\dfrac{\text{favourable outcomes}}{\text{all equally likely outcomes}}\).`, T`ប្រូបាបបុរាណ៖ \(P=\dfrac{m}{n}\) ដែល \(m\) ជាចំនួនករណីស្រប និង \(n\) ជាចំនួនករណីអាចមានទាំងអស់ (អាចកើតមានស្មើៗគ្នា)។`),
      steps: [
        S2(T`All outcomes: \(\{1,2,3,4,5,6\}\), so \(n=6\) equally likely outcomes.`, T`ករណីអាចមានទាំងអស់៖ \(\{1,2,3,4,5,6\}\) ដូច្នេះ \(n=6\) ករណីស្មើៗគ្នា។`),
        S2(T`Favourable outcomes (${ev.e}): \(\{${ev.set.join(',')}\}\), so \(m=${ev.n}\).`, T`ករណីស្រប (${ev.km})៖ \(\{${ev.set.join(',')}\}\) ដូច្នេះ \(m=${ev.n}\)។`),
        DM(T`P=\frac{m}{n}=${eqf(ev.n, 6)}`),
      ],
    };
  }, XO);

  function pickOne(r, forced) {
    const x = r.int(2, 7), y = r.int(2, 7);
    if (x === y) throw new Error('equal');
    if (forced ? forced === 'ball' : r.chance(0.5)) {
      const red = r.chance(0.5);
      const val = F(red ? x : y, x + y);
      return {
        q: T`A bag contains \(${x}\) red balls and \(${y}\) white balls. One ball is drawn at random. The probability that it is ${red ? 'red' : 'white'} is`,
        correct: val,
        wrong: [F(red ? y : x, x + y), F(red ? x : y, red ? y : x), F(1, 2), F(1, x + y)],
        sol: T`${x + y} balls in total, ${red ? x : y} of them ${red ? 'red' : 'white'}: \(P=${val}\).`,
        key: S2(T`Classical probability: \(P=\dfrac{\text{favourable outcomes}}{\text{all equally likely outcomes}}\).`, T`ប្រូបាបបុរាណ៖ \(P=\dfrac{m}{n}\) ដែល \(m\) ជាចំនួនករណីស្រប និង \(n\) ជាចំនួនករណីអាចមានទាំងអស់ (អាចកើតមានស្មើៗគ្នា)។`),
        steps: [
          S2(T`Total number of balls: \(n=${x}+${y}=${x + y}\).`, T`ចំនួនបាល់សរុប៖ \(n=${x}+${y}=${x + y}\)។`),
          S2(T`Favourable (${red ? 'red' : 'white'} balls): \(m=${red ? x : y}\).`, T`ករណីស្រប (បាល់ពណ៌${red ? 'ក្រហម' : 'ស'})៖ \(m=${red ? x : y}\)។`),
          DM(T`P=\frac{m}{n}=${eqf(red ? x : y, x + y)}`),
        ],
      };
    }
    const girl = r.chance(0.6);
    const val = F(girl ? y : x, x + y);
    return {
      q: T`A group has \(${x}\) boys and \(${y}\) girls. One person is selected at random. The probability that the person is a ${girl ? 'girl' : 'boy'} is`,
      correct: val,
      wrong: [F(girl ? x : y, x + y), F(girl ? y : x, girl ? x : y), F(1, 2), F(1, x + y)],
      sol: T`${x + y} people in total, ${girl ? y : x} of them ${girl ? 'girls' : 'boys'}: \(P=${val}\).`,
      key: S2(T`Classical probability: \(P=\dfrac{\text{favourable outcomes}}{\text{all equally likely outcomes}}\).`, T`ប្រូបាបបុរាណ៖ \(P=\dfrac{m}{n}\) ដែល \(m\) ជាចំនួនករណីស្រប និង \(n\) ជាចំនួនករណីអាចមានទាំងអស់ (អាចកើតមានស្មើៗគ្នា)។`),
      steps: [
        S2(T`Total number of people: \(n=${x}+${y}=${x + y}\).`, T`ចំនួនមនុស្សសរុប៖ \(n=${x}+${y}=${x + y}\)។`),
        S2(T`Favourable (${girl ? 'girls' : 'boys'}): \(m=${girl ? y : x}\).`, T`ករណីស្រប (សិស្ស${girl ? 'ស្រី' : 'ប្រុស'})៖ \(m=${girl ? y : x}\)។`),
        DM(T`P=\frac{m}{n}=${eqf(girl ? y : x, x + y)}`),
      ],
    };
  }
  def('pick-one', 'prob', (r) => pickOne(r), XO);
  def('pick-one-ball', 'prob', (r) => pickOne(r, 'ball'), XO);
  def('pick-one-person', 'prob', (r) => pickOne(r, 'person'), XO);

  function eventsRule(r, forced) {
    const p = r.int(1, 5), q = r.int(1, 4);
    if (p + q > 9) throw new Error('sum');
    const excl = forced ? forced === 'exclusive' : r.chance(0.5);
    const P = (x) => dec(x, 10);
    if (excl)
      return {
        q: T`Events \(A\) and \(B\) are mutually exclusive, \(P(A)=${P(p)}\) and \(P(B)=${P(q)}\). Then \(P(A\cup B)=\)`,
        correct: P(p + q),
        wrong: [dec(p * q, 100), P(Math.abs(p - q) || 1), P(Math.max(p, q)), dec(10 * (p + q) - p * q, 100)],
        sol: T`Mutually exclusive events cannot happen together, so \(P(A\cup B)=P(A)+P(B)=${P(p + q)}\).`,
        key: S2(T`Mutually exclusive events (\(A\cap B=\varnothing\)): \(P(A\cup B)=P(A)+P(B)\).`, T`ព្រឹត្តិការណ៍មិនចុះសម្រុងគ្នា (\(A\cap B=\varnothing\))៖ \(P(A\cup B)=P(A)+P(B)\)។`),
        steps: [
          S2(T`\(A\) and \(B\) cannot happen at the same time, so add the probabilities:`, T`\(A\) និង \(B\) មិនអាចកើតឡើងព្រមគ្នាបានទេ ដូច្នេះបូកប្រូបាប៖`),
          DM(T`P(A\cup B)=P(A)+P(B)=${P(p)}+${P(q)}=${P(p + q)}`),
        ],
      };
    return {
      q: T`Events \(A\) and \(B\) are independent, \(P(A)=${P(p)}\) and \(P(B)=${P(q)}\). Then \(P(A\cap B)=\)`,
      correct: dec(p * q, 100),
      wrong: [P(p + q), P(Math.abs(p - q) || 1), P(Math.max(p, q)), dec(10 * (p + q) - p * q, 100)],
      sol: T`For independent events \(P(A\cap B)=P(A)P(B)=${P(p)}\times${P(q)}=${dec(p * q, 100)}\).`,
      key: S2(T`Independent events: \(P(A\cap B)=P(A)\cdot P(B)\).`, T`ព្រឹត្តិការណ៍ឯករាជ្យ៖ \(P(A\cap B)=P(A)\cdot P(B)\)។`),
      steps: [
        S2(T`\(A\) and \(B\) are independent, so multiply the probabilities:`, T`\(A\) និង \(B\) ឯករាជ្យពីគ្នា ដូច្នេះគុណប្រូបាប៖`),
        DM(T`P(A\cap B)=P(A)\cdot P(B)=${P(p)}\times${P(q)}=${dec(p * q, 100)}`),
      ],
    };
  }
  def('events-rule', 'prob', (r) => eventsRule(r), XO);
  def('events-exclusive', 'prob', (r) => eventsRule(r, 'exclusive'), XO);
  def('events-independent', 'prob', (r) => eventsRule(r, 'independent'), XO);

  function statsSimple(r, forced) {
    const v = forced || r.pick(['mean', 'median', 'variance', 'sd']);
    if (v === 'mean') {
      const vals = r.distinct(4, 1, 12);
      const total = vals.reduce((a, b) => a + b, 0);
      const last = 5 * r.int(Math.ceil((total + 1) / 5), Math.floor((total + 12) / 5)) - total;
      if (last < 1 || last > 12 || vals.includes(last)) throw new Error('mean');
      const data = r.shuffle(vals.concat([last]));
      const mean = (total + last) / 5;
      const sorted = data.slice().sort((a, b) => a - b);
      return {
        q: T`For the data set \(${data.join(',\\ ')}\), the mean is`,
        correct: String(mean),
        wrong: [String(sorted[2]), String(mean + 1), String(mean - 1), String(total + last), dec((total + last) * 10 / 4, 10)],
        sol: T`Mean \(=\frac{${data.join('+')}}{5}=\frac{${total + last}}{5}=${mean}\).`,
        key: S2(T`Mean: \(\bar x=\dfrac{x_1+x_2+\cdots+x_n}{n}\) (sum of the values divided by how many there are).`, T`មធ្យមភាគ៖ \(\bar x=\dfrac{x_1+x_2+\cdots+x_n}{n}\) (ផលបូកតម្លៃ ចែកនឹងចំនួនតម្លៃ)។`),
        steps: [
          S2(T`There are \(n=5\) values. Add them:`, T`មានតម្លៃ \(n=5\)។ បូកវា៖`),
          DM(T`${data.join('+')}=${total + last}`),
          S2('Divide by the number of values:', 'ចែកនឹងចំនួនតម្លៃ៖'),
          DM(T`\bar x=\frac{${total + last}}{5}=${mean}`),
        ],
      };
    }
    if (v === 'median') {
      const n = r.pick([5, 7]);
      const data = r.shuffle(r.distinct(n, 1, 15));
      const sorted = data.slice().sort((a, b) => a - b);
      const med = sorted[(n - 1) / 2];
      return {
        q: T`For the data set \(${data.join(',\\ ')}\), the median is`,
        correct: String(med),
        wrong: [String(data[(n - 1) / 2]), String(sorted[(n - 1) / 2 + 1]), String(sorted[(n - 1) / 2 - 1]), String(sorted[n - 1])],
        sol: T`Sort first: \(${sorted.join(',\\ ')}\). The middle value is \(${med}\).`,
        key: S2(T`Median: sort the data; if \(n\) is odd, the median is the middle value, in position \(\frac{n+1}{2}\).`, T`មេដ្យាន៖ តម្រៀបទិន្នន័យ; បើ \(n\) សេស មេដ្យានជាតម្លៃកណ្តាល នៅទីតាំង \(\frac{n+1}{2}\)។`),
        steps: [
          S2('Sort the data from smallest to largest:', 'តម្រៀបទិន្នន័យពីតូចទៅធំ៖'),
          DM(sorted.map((x, i) => (i === (n - 1) / 2 ? T`\boxed{${x}}` : x)).join(',\\ ')),
          S2(T`\(n=${n}\) is odd, so the median is in position \(\frac{${n}+1}{2}=${(n + 1) / 2}\).`, T`\(n=${n}\) ជាចំនួនសេស ដូច្នេះមេដ្យាននៅទីតាំង \(\frac{${n}+1}{2}=${(n + 1) / 2}\)។`),
          DM(T`\text{Me}=${med}`),
        ],
      };
    }
    if (v === 'variance') {
      const a = r.int(1, 6), t = r.pick([1, 2]);
      const data = [0, 1, 2, 3, 4].map((i) => a + i * t);
      const varv = 2 * t * t;
      return {
        q: T`For the data set \(${data.join(',\\ ')}\), the variance is`,
        correct: String(varv),
        wrong: [R(1, varv), String(varv + 1), R(1, varv + 1), String(5 * varv / 2), String(t * t)],
        sol: T`Mean \(=${a + 2 * t}\); deviations \(${[-2, -1, 0, 1, 2].map((d) => d * t).join(',\\ ')}\). \(s^2=\frac{${4 * t * t}+${t * t}+0+${t * t}+${4 * t * t}}{5}=${varv}\).`,
        key: S2(T`Variance: \(s^2=\dfrac{(x_1-\bar x)^2+(x_2-\bar x)^2+\cdots+(x_n-\bar x)^2}{n}\).`, T`វ៉ារ្យង់៖ \(s^2=\dfrac{(x_1-\bar x)^2+(x_2-\bar x)^2+\cdots+(x_n-\bar x)^2}{n}\)។`),
        steps: [
          S2('Step 1: the mean.', 'ជំហានទី ១៖ មធ្យមភាគ។'),
          DM(T`\bar x=\frac{${data.join('+')}}{5}=\frac{${5 * (a + 2 * t)}}{5}=${a + 2 * t}`),
          S2(T`Step 2: the deviations \(x_i-\bar x\).`, T`ជំហានទី ២៖ គម្លាត \(x_i-\bar x\)។`),
          DM([-2, -1, 0, 1, 2].map((d) => d * t).join(',\\ ')),
          S2('Step 3: average of the squared deviations.', 'ជំហានទី ៣៖ មធ្យមភាគនៃការេគម្លាត។'),
          DM(T`s^2=\frac{${pr(-2 * t)}^2+${pr(-t)}^2+0^2+${t}^2+${2 * t}^2}{5}=\frac{${10 * t * t}}{5}=${varv}`),
        ],
      };
    }
    if (r.chance(0.4)) {
      const c = r.int(2, 9);
      return {
        q: T`For the data set \(${[c, c, c, c, c].join(',\\ ')}\), the standard deviation is`,
        correct: '0',
        wrong: ['1', String(c), String(c * c), String(5 * c)],
        sol: T`Every value equals the mean \(${c}\), so every deviation is 0 and the standard deviation is \(0\).`,
        key: S2(T`Standard deviation \(s=\sqrt{s^2}\) measures how far the data are from the mean.`, T`គម្លាតគំរូ \(s=\sqrt{s^2}\) វាស់ថាទិន្នន័យនៅឆ្ងាយពីមធ្យមភាគប៉ុណ្ណា។`),
        steps: [
          S2(T`All values are equal, so \(\bar x=${c}\).`, T`តម្លៃទាំងអស់ស្មើគ្នា ដូច្នេះ \(\bar x=${c}\)។`),
          S2(T`Every deviation \(x_i-\bar x=0\):`, T`គម្លាតទាំងអស់ \(x_i-\bar x=0\)៖`),
          DM(T`s^2=\frac{0+0+0+0+0}{5}=0\ \Rightarrow\ s=0`),
        ],
      };
    }
    const a = r.int(4, 10), t = r.int(1, 3);
    const data = r.shuffle([a - t, a - t, a + t, a + t]);
    return {
      q: T`For the data set \(${data.join(',\\ ')}\), the standard deviation is`,
      correct: String(t),
      wrong: [String(t * t), String(2 * t), '0', String(a)],
      sol: T`Mean \(=${a}\); every deviation is \(\pm${t}\), so the variance is \(${t * t}\) and the standard deviation is \(${t}\).`,
      key: S2(T`Standard deviation: \(s=\sqrt{s^2}\), where \(s^2=\dfrac{\sum(x_i-\bar x)^2}{n}\).`, T`គម្លាតគំរូ៖ \(s=\sqrt{s^2}\) ដែល \(s^2=\dfrac{\sum(x_i-\bar x)^2}{n}\)។`),
      steps: [
        S2('Step 1: the mean.', 'ជំហានទី ១៖ មធ្យមភាគ។'),
        DM(T`\bar x=\frac{${data.join('+')}}{4}=\frac{${4 * a}}{4}=${a}`),
        S2(T`Step 2: every deviation is \(\pm${t}\), so every squared deviation is \(${t * t}\).`, T`ជំហានទី ២៖ គម្លាតនីមួយៗគឺ \(\pm${t}\) ដូច្នេះការេគម្លាតនីមួយៗគឺ \(${t * t}\)។`),
        DM(T`s^2=\frac{${t * t}+${t * t}+${t * t}+${t * t}}{4}=${t * t}`),
        S2('Step 3: take the square root.', 'ជំហានទី ៣៖ យកឫសការេ។'),
        DM(T`s=\sqrt{${t * t}}=${t}`),
      ],
    };
  }
  def('stats-simple', 'stats', (r) => statsSimple(r), XO);
  ['mean', 'median', 'variance', 'sd'].forEach((v) => def('stats-' + v, 'stats', (r) => statsSimple(r, v), XO));

  function normalFeatures(r, forced) {
    if (forced ? forced === 'feature' : r.chance(0.5)) {
      const yes = [T`It is symmetric about the line \(x=\mu\)`, 'The total area under the curve is 1', T`It has a single peak, at \(x=\mu\)`];
      const no = [T`It is not symmetric about the mean \(\mu\)`, 'It has two peaks', 'It is bounded on both sides', 'The total area under the curve is 2', T`It is lowest at \(x=\mu\)`];
      return { q: 'Which of the following is a characteristic of the normal distribution curve?', math: false, correct: r.pick(yes), wrong: r.shuffle(no), sol: T`A normal curve is bell-shaped with one peak at \(x=\mu\), symmetric about \(x=\mu\), never touches the \(x\)-axis, and the total area under it is 1.`,
        key: S2(T`The normal curve \(N(\mu,\sigma^2)\) is a bell shape centred at \(x=\mu\).`, T`ខ្សែកោងណរម៉ាល់ \(N(\mu,\sigma^2)\) មានរាងកណ្តឹង ដែលមានផ្ចិតនៅ \(x=\mu\)។`),
        steps: [
          S2(T`It has a single peak, at \(x=\mu\) (the highest point).`, T`វាមានកំពូលតែមួយ នៅត្រង់ \(x=\mu\) (ចំណុចខ្ពស់បំផុត)។`),
          S2(T`It is symmetric about the line \(x=\mu\).`, T`វាឆ្លុះធៀបបន្ទាត់ \(x=\mu\)។`),
          S2(T`It gets closer and closer to the \(x\)-axis on both sides but never touches it (it is not bounded).`, T`វាខិតជិតអ័ក្ស \(x\) កាន់តែខ្លាំងទាំងសងខាង ប៉ុន្តែមិនប៉ះវាទេ (គ្មានព្រំដែនកំណត់)។`),
          S2(T`The total area under the curve is \(1\) (total probability).`, T`ក្រឡាផ្ទៃសរុបនៅក្រោមខ្សែកោងស្មើ \(1\) (ប្រូបាបសរុប)។`),
          S2(T`Options such as "two peaks", "not symmetric", "area 2", "lowest at \(x=\mu\)" or "bounded" contradict these facts.`, T`ជម្រើសដូចជា "មានកំពូលពីរ", "មិនឆ្លុះ", "ក្រឡាផ្ទៃ 2", "ទាបបំផុតត្រង់ \(x=\mu\)" ឬ "មានព្រំដែន" ផ្ទុយនឹងលក្ខណៈខាងលើ។`),
        ] };
    }
    const opts = ['Shift to the right', 'Shift to the left', 'Become flatter (lower and wider)', 'Become steeper (taller and narrower)'];
    const which = r.pick(['sig+', 'sig-', 'mu+', 'mu-']);
    const ans = { 'sig+': 2, 'sig-': 3, 'mu+': 0, 'mu-': 1 }[which];
    const isSig = which.startsWith('sig');
    const up = which.endsWith('+');
    return {
      q: T`For the normal distribution \(N(\mu,\sigma^2)\), if \(${isSig ? T`\sigma` : T`\mu`}\) ${up ? 'increases' : 'decreases'} while \(${isSig ? T`\mu` : T`\sigma`}\) stays the same, the curve will`,
      math: false,
      correct: opts[ans],
      wrong: opts.filter((_, i) => i !== ans),
      sol: isSig ? T`\(\sigma\) controls the spread: a larger \(\sigma\) gives a lower, wider curve; a smaller \(\sigma\) gives a taller, narrower one. The centre \(x=\mu\) does not move.` : T`\(\mu\) is the centre of the curve: changing \(\mu\) moves the curve left or right without changing its shape.`,
      key: S2(T`In \(N(\mu,\sigma^2)\): \(\mu\) fixes the position (centre) of the curve; \(\sigma\) fixes its shape (spread).`, T`ក្នុង \(N(\mu,\sigma^2)\)៖ \(\mu\) កំណត់ទីតាំង (ផ្ចិត) នៃខ្សែកោង; \(\sigma\) កំណត់រាង (ការលាតសន្ធឹង)។`),
      steps: {
        'sig+': [
          S2(T`\(\mu\) does not change, so the centre \(x=\mu\) stays in place.`, T`\(\mu\) មិនប្រែប្រួល ដូច្នេះផ្ចិត \(x=\mu\) នៅនឹងកន្លែង។`),
          S2(T`A larger \(\sigma\) means the data are more spread out. The total area must stay \(1\), so the curve becomes lower and wider (flatter).`, T`\(\sigma\) ធំជាងមុន មានន័យថាទិន្នន័យលាតសន្ធឹងច្រើនជាងមុន។ ក្រឡាផ្ទៃសរុបត្រូវតែស្មើ \(1\) ដូច្នេះខ្សែកោងទាប និងរាលជាងមុន។`),
        ],
        'sig-': [
          S2(T`\(\mu\) does not change, so the centre \(x=\mu\) stays in place.`, T`\(\mu\) មិនប្រែប្រួល ដូច្នេះផ្ចិត \(x=\mu\) នៅនឹងកន្លែង។`),
          S2(T`A smaller \(\sigma\) means the data are more concentrated near \(\mu\). The total area stays \(1\), so the curve becomes taller and narrower (steeper).`, T`\(\sigma\) តូចជាងមុន មានន័យថាទិន្នន័យប្រមូលផ្តុំជិត \(\mu\) ជាងមុន។ ក្រឡាផ្ទៃសរុបនៅតែ \(1\) ដូច្នេះខ្សែកោងខ្ពស់ និងស្រួចជាងមុន។`),
        ],
        'mu+': [
          S2(T`\(\sigma\) does not change, so the shape of the curve stays the same.`, T`\(\sigma\) មិនប្រែប្រួល ដូច្នេះរាងខ្សែកោងនៅដដែល។`),
          S2(T`The centre \(x=\mu\) moves to a larger value, so the whole curve shifts to the right.`, T`ផ្ចិត \(x=\mu\) រំកិលទៅតម្លៃធំជាងមុន ដូច្នេះខ្សែកោងទាំងមូលរំកិលទៅខាងស្តាំ។`),
        ],
        'mu-': [
          S2(T`\(\sigma\) does not change, so the shape of the curve stays the same.`, T`\(\sigma\) មិនប្រែប្រួល ដូច្នេះរាងខ្សែកោងនៅដដែល។`),
          S2(T`The centre \(x=\mu\) moves to a smaller value, so the whole curve shifts to the left.`, T`ផ្ចិត \(x=\mu\) រំកិលទៅតម្លៃតូចជាងមុន ដូច្នេះខ្សែកោងទាំងមូលរំកិលទៅខាងឆ្វេង។`),
        ],
      }[which],
    };
  }
  def('normal-features', 'normal', (r) => normalFeatures(r), XO);
  def('normal-feature', 'normal', (r) => normalFeatures(r, 'feature'), XO);
  def('normal-shape', 'normal', (r) => normalFeatures(r, 'shape'), XO);


  /* ------------------------------------------------------------------ */
  /* Assembly                                                            */
  /* ------------------------------------------------------------------ */
  const stats = { fail: {} };

  /** numeric value of a plain number or \frac{a}{b}; null if not that shape */
  function texValue(s) {
    let m = /^(-)?\\frac\{(\d+)\}\{(\d+)\}$/.exec(s);
    if (m) return (m[1] ? -1 : 1) * (Number(m[2]) / Number(m[3]));
    if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
    return null;
  }

  function build(tpl, r) {
    let lastErr;
    for (let attempt = 0; attempt < 80; attempt++) {
      try {
        const o = tpl.gen(r);
        const correct = o.correct;
        const seen = new Set([correct]);
        const wrong = [];
        const isProb = (tpl.lesson === 'prob' || tpl.lesson === 'normal') && o.prob !== false;
        for (const w of o.wrong) {
          if (w == null || typeof w !== 'string' || w === '' || w === 'x' || w.includes('NaN') || w.includes('undefined') || w.includes('Infinity')) continue;
          if (isProb) {
            const v = texValue(w);
            if (v !== null && (v <= 0 || v >= 1)) continue; // a probability distractor must look plausible
          }
          if (seen.has(w)) continue;
          seen.add(w);
          wrong.push(w);
          if (wrong.length === 3) break;
        }
        if (wrong.length < 3) throw new Error('not enough distinct distractors');
        if (/NaN|undefined|Infinity/.test(o.q + correct + o.sol + JSON.stringify(o.steps || '') + JSON.stringify(o.key || ''))) throw new Error('bad value in text');
        const choices = r.shuffle([correct].concat(wrong));
        return {
          tpl: tpl.id,
          lesson: tpl.lesson,
          module: LESSON_MODULE[tpl.lesson],
          q: o.q,
          choices,
          answer: choices.indexOf(correct),
          sol: o.sol,
          key: o.key,
          steps: o.steps,
          math: o.math !== false,
        };
      } catch (e) {
        lastErr = e;
        stats.fail[tpl.id] = (stats.fail[tpl.id] || 0) + 1;
      }
    }
    throw new Error(`template ${tpl.id} failed: ${lastErr && lastErr.message}`);
  }

  function byLesson(lesson, includeExamOnly) {
    return TPL.filter((t) => t.lesson === lesson && (includeExamOnly || !t.examOnly));
  }

  const PAPER_COUNT = 40;

  function makePaper(n) {
    const r = makeRng('csca-math-paper-' + n);
    const qs = [];
    for (const meta of LESSON_META) {
      const pool = r.shuffle(byLesson(meta.id));
      for (let i = 0; i < meta.perPaper; i++) qs.push(build(pool[i % pool.length], r));
    }
    qs.forEach((q, i) => (q.no = i + 1));
    return { n, questions: qs };
  }

  /*
   * Printable exam sheets, modelled question by question on the CSCA
   * mathematics paper: four parts of 12 questions in syllabus order
   * (Sets and Inequalities · Functions · Geometry and Algebra · Probability
   * and Statistics). Each slot lists the question types that may fill it.
   */
  const EXAM_SHEET_COUNT = 20;
  const SHEET_SLOTS = [
    // Part 1 · Sets and Inequalities (Q1–12)
    ['set-ops'], ['interval-notation'], ['set-complement'], ['quad-ineq'], ['condition-choice'], ['rational-ineq'],
    ['set-relation'], ['ineq-compare'], ['subset-count'], ['abs-ineq'], ['set-interval'], ['ineq-lead-param'],
    // Part 2 · Functions (Q13–24)
    ['domain'], ['parity'], ['exp-monotone'], ['arith-term'], ['deriv-formula'], ['log-value'],
    ['geo-sum'], ['deriv-meaning'], ['quad-range'], ['power-func'], ['trig-props'], ['quad-min-param'],
    // Part 3 · Geometry and Algebra (Q25–36)
    ['line-point-slope'], ['circle-center'], ['vec-coords'], ['ellipse-from-axes'], ['vec-dot'], ['parabola-from-focus'],
    ['complex-conj-product'], ['point-line-dist'], ['hyperbola-from-ecc'], ['space-dist'], ['line-parallel-k'], ['volume'],
    // Part 4 · Probability and Statistics (Q37–48)
    ['die-once'], ['stats-mean'], ['events-exclusive'], ['normal-feature'], ['pick-one-ball'], ['stats-variance'],
    ['events-independent'], ['stats-sd'], ['dice'], ['normal-shape'], ['stats-median'], ['pick-one-person'],
  ];
  function makeExamSheet(n) {
    const r = makeRng('csca-exam-sheet-v2-' + n);
    const byId = {};
    TPL.forEach((t) => (byId[t.id] = t));
    const qs = SHEET_SLOTS.map((ids) => build(byId[r.pick(ids)], r));
    qs.forEach((q, i) => (q.no = i + 1));
    return { n, questions: qs };
  }

  function practice(lesson, count, seed) {
    const r = makeRng(seed === undefined ? Math.floor(Math.random() * 2 ** 31) : seed);
    const pool = byLesson(lesson, true);
    const out = [];
    let order = r.shuffle(pool);
    for (let i = 0; i < count; i++) {
      if (i > 0 && i % order.length === 0) order = r.shuffle(pool);
      out.push(build(order[i % order.length], r));
    }
    out.forEach((q, i) => (q.no = i + 1));
    return out;
  }

  const API = {
    MODULES,
    LESSON_META,
    PAPER_COUNT,
    QUESTIONS_PER_PAPER: LESSON_META.reduce((s, l) => s + l.perPaper, 0),
    templates: TPL,
    makePaper,
    makeExamSheet,
    EXAM_SHEET_COUNT,
    practice,
    makeRng,
    _stats: stats,
    _build: build,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.CSCA = API;
})(typeof window !== 'undefined' ? window : globalThis);
