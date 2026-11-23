/*
 * CSCA Mathematics — lesson notes.
 * Each lesson maps to one topic of the CSCA Mathematics Examination
 * Syllabus (2025). Math is written in LaTeX: \( inline \) and \[ display \].
 */
(function (root) {
  'use strict';
  const L = [
    /* ------------------------------------------------------------- */
    {
      id: 'sets',
      module: 1,
      title: 'Sets and Logic',
      summary: 'Definition, representation and operations of sets; sufficient and necessary conditions; negating quantified statements.',
      blocks: [
        {
          h: 'Key ideas',
          html: String.raw`<ul>
<li>A <b>set</b> is a well-defined collection of objects called <b>elements</b>. \(a\in A\) means \(a\) is an element of \(A\).</li>
<li>Two ways to describe a set: list the elements, \(\{1,2,3\}\), or state a property, \(\{x\mid x^2-3x+2=0\}\).</li>
<li>Number sets: \(\mathbb{N}\) natural numbers, \(\mathbb{Z}\) integers, \(\mathbb{Q}\) rational numbers, \(\mathbb{R}\) real numbers.</li>
<li>\(\varnothing\) is the <b>empty set</b>; it is a subset of every set.</li>
</ul>`,
        },
        {
          h: 'Set operations',
          html: String.raw`<ul>
<li><b>Intersection</b> \(A\cap B=\{x\mid x\in A\text{ and }x\in B\}\)</li>
<li><b>Union</b> \(A\cup B=\{x\mid x\in A\text{ or }x\in B\}\)</li>
<li><b>Complement</b> \(\complement_U A=\{x\in U\mid x\notin A\}\), where \(U\) is the universal set</li>
<li>A set with \(n\) elements has \(2^n\) subsets, \(2^n-1\) proper subsets and \(2^n-2\) non-empty proper subsets.</li>
</ul>
<p>When the sets are intervals, draw a number line and watch the endpoints: closed \([\ ]\) includes the endpoint, open \((\ )\) excludes it.</p>`,
        },
        {
          h: 'Sufficient and necessary conditions',
          html: String.raw`<p>If \(p\Rightarrow q\), then \(p\) is a <b>sufficient</b> condition for \(q\), and \(q\) is a <b>necessary</b> condition for \(p\).</p>
<div class="scroll"><table class="mini"><tr><th>Situation</th><th>Answer wording</th></tr>
<tr><td>\(p\Rightarrow q\) but \(q\not\Rightarrow p\)</td><td>Sufficient but not necessary</td></tr>
<tr><td>\(q\Rightarrow p\) but \(p\not\Rightarrow q\)</td><td>Necessary but not sufficient</td></tr>
<tr><td>\(p\Leftrightarrow q\)</td><td>Necessary and sufficient</td></tr>
<tr><td>Neither implies the other</td><td>Neither sufficient nor necessary</td></tr></table></div>
<p>Shortcut: the smaller set implies the larger one. \(\{x\mid x>3\}\subseteq\{x\mid x>1\}\), so "\(x>3\)" is sufficient for "\(x>1\)".</p>
<p><b>Negation</b>: swap \(\forall\leftrightarrow\exists\) and negate the condition (\(>\) becomes \(\le\), \(\ge\) becomes \(<\)). The negation of "\(\forall x\in\mathbb{R},\ x^2+1>0\)" is "\(\exists x\in\mathbb{R},\ x^2+1\le0\)".</p>`,
        },
      ],
      example: {
        q: String.raw`Let \(U=\{1,2,3,4,5,6\}\), \(A=\{1,2,3\}\), \(B=\{2,4,6\}\). Find \((\complement_U A)\cap B\).`,
        steps: [String.raw`\(\complement_U A=\{4,5,6\}\): the elements of \(U\) that are not in \(A\).`, String.raw`Intersect with \(B=\{2,4,6\}\): the common elements are \(4\) and \(6\).`, String.raw`Answer: \(\{4,6\}\).`],
      },
      tips: ['For "the range of a" questions, test the endpoint value directly to decide whether it is included.', 'A proper subset excludes the set itself but does include \\(\\varnothing\\).'],
      terms: [['set / element', 'a collection / one of its members'], ['subset, proper subset', '\\(A\\subseteq B\\); proper means \\(A\\ne B\\)'], ['intersection / union', '\\(\\cap\\) both / \\(\\cup\\) either'], ['complement', 'what is left in \\(U\\)'], ['universal set', 'the set of everything considered'], ['sufficient condition', 'enough to guarantee'], ['necessary condition', 'must hold'], ['negation', 'the opposite statement']],
    },
    /* ------------------------------------------------------------- */
    {
      id: 'ineq',
      module: 1,
      title: 'Inequalities',
      summary: 'Properties of inequalities; quadratic, rational and absolute-value inequalities; the AM–GM inequality.',
      blocks: [
        {
          h: 'Basic properties',
          html: String.raw`<ul>
<li>Adding or subtracting the same number on both sides keeps the direction.</li>
<li>Multiplying or dividing by a <b>positive</b> number keeps the direction; by a <b>negative</b> number it <b>reverses</b> the direction.</li>
<li>If \(a>b>0\), then \(a^2>b^2\), \(\sqrt a>\sqrt b\) and \(\dfrac1a<\dfrac1b\).</li>
</ul>`,
        },
        {
          h: 'Quadratic inequalities',
          html: String.raw`<p>For \(ax^2+bx+c\) with \(a>0\) and roots \(x_1<x_2\):</p>
<div class="scroll"><table class="mini"><tr><th>Inequality</th><th>Solution set</th></tr>
<tr><td>\(ax^2+bx+c<0\)</td><td>\((x_1,x_2)\) — "less than: between the roots"</td></tr>
<tr><td>\(ax^2+bx+c>0\)</td><td>\((-\infty,x_1)\cup(x_2,+\infty)\) — "greater than: outside the roots"</td></tr></table></div>
<p>If \(a<0\), multiply by \(-1\) first and reverse the sign. \(ax^2+bx+c>0\) for all real \(x\) \(\iff a>0\) and \(\Delta=b^2-4ac<0\).</p>
<p><b>Vieta's formulas</b>: \(x_1+x_2=-\dfrac ba\), \(x_1x_2=\dfrac ca\). Use them when the solution set is given and a coefficient is asked for.</p>`,
        },
        {
          h: 'Rational and absolute-value inequalities',
          html: String.raw`<ul>
<li>\(\dfrac{x-a}{x-b}\le 0 \iff (x-a)(x-b)\le0\) and \(x\ne b\) (a denominator can never be 0).</li>
<li>\(|x-a|<b \iff a-b<x<a+b\)</li>
<li>\(|x-a|>b \iff x<a-b\) or \(x>a+b\)</li>
</ul>`,
        },
        {
          h: 'The AM–GM inequality',
          html: String.raw`<p>For \(a,b>0\): \[a+b\ge 2\sqrt{ab}\] with equality when \(a=b\). Checklist: <b>positive — product constant — equality reachable</b>.</p>
<p>Example: for \(x>0\), \(x+\dfrac{9}{x}\ge2\sqrt9=6\); the minimum 6 occurs at \(x=3\).</p>`,
        },
      ],
      example: {
        q: String.raw`Solve \(x^2-x-6\le 0\).`,
        steps: [String.raw`Factor: \((x-3)(x+2)\le0\), roots \(-2\) and \(3\).`, String.raw`"Less than or equal" means between the roots, endpoints included.`, String.raw`Answer: \([-2,3]\).`],
      },
      tips: ['Always check whether endpoints are included (≤, ≥) or excluded (<, >). A value that makes a denominator 0 is never included.', 'Use \\(\\cup\\) when the answer is two separate intervals.'],
      terms: [['solution set', 'all values that satisfy it'], ['interval', 'e.g. \\((1,3]\\)'], ['root', 'solution of \\(f(x)=0\\)'], ['discriminant', '\\(\\Delta=b^2-4ac\\)'], ['absolute value', '\\(|x|\\), distance from 0'], ['minimum value', 'the smallest value attained'], ['holds for all real x', 'true for every \\(x\\in\\mathbb R\\)']],
    },
    /* ------------------------------------------------------------- */
    {
      id: 'func',
      module: 2,
      title: 'Concepts and Properties of Functions',
      summary: 'Domain, range, monotonicity, parity (odd/even), quadratic functions, composite functions and zeros.',
      blocks: [
        {
          h: 'Domain',
          html: String.raw`<ul>
<li>\(\sqrt{u}\): need \(u\ge0\)</li>
<li>\(\dfrac{1}{u}\): need \(u\ne0\)</li>
<li>\(\log_a u\), \(\ln u\): need \(u>0\)</li>
<li>\(\dfrac{1}{\sqrt u}\): need \(u>0\)</li>
</ul><p>With several conditions, take the intersection of all of them.</p>`,
        },
        {
          h: 'Monotonicity and parity',
          html: String.raw`<ul>
<li><b>Increasing</b>: \(x_1<x_2\Rightarrow f(x_1)<f(x_2)\). <b>Decreasing</b>: \(x_1<x_2\Rightarrow f(x_1)>f(x_2)\).</li>
<li><b>Even</b>: \(f(-x)=f(x)\); the graph is symmetric about the \(y\)-axis. Examples: \(x^2,\ |x|,\ \cos x\).</li>
<li><b>Odd</b>: \(f(-x)=-f(x)\); the graph is symmetric about the origin. Examples: \(x^3,\ \dfrac1x,\ \sin x\).</li>
<li>The domain must be symmetric about 0, so \(\ln x\) and \(\sqrt x\) are neither odd nor even.</li>
<li>If \(f\) is odd and \(f(x)\) is given for \(x>0\), then \(f(-a)=-f(a)\).</li>
</ul>`,
        },
        {
          h: 'Quadratic functions',
          html: String.raw`<p>\(f(x)=ax^2+bx+c=a(x-h)^2+k\), with axis of symmetry \(x=h=-\dfrac{b}{2a}\).</p>
<ul><li>\(a>0\): decreasing on \((-\infty,h]\), increasing on \([h,+\infty)\), minimum value \(k\).</li>
<li>Max/min on \([p,q]\): evaluate \(f(p)\), \(f(q)\) and \(f(h)\) (if \(h\in[p,q]\)), then compare.</li></ul>`,
        },
        {
          h: 'Composite functions and zeros',
          html: String.raw`<ul><li>\(f(g(x))\): evaluate \(g\) first, then apply \(f\). If \(f(x+1)=\dots\) and you need \(f(k)\), put \(x=k-1\).</li>
<li>Piecewise functions: first decide which piece the input falls into.</li>
<li><b>Zero existence theorem</b>: if \(f\) is continuous on \([a,b]\) and \(f(a)f(b)<0\), then \(f\) has a zero in \((a,b)\).</li></ul>`,
        },
      ],
      example: {
        q: String.raw`Find the range of \(f(x)=x^2-4x+3\) on \([0,3]\).`,
        steps: [String.raw`\(f(x)=(x-2)^2-1\); the axis \(x=2\) lies in \([0,3]\), so the minimum is \(f(2)=-1\).`, String.raw`Endpoints: \(f(0)=3\), \(f(3)=0\), so the maximum is \(3\).`, String.raw`Range: \([-1,3]\).`],
      },
      tips: ['For "which function is odd", test \\(x=1\\) and \\(x=-1\\) to eliminate options quickly.', 'Monotonic intervals may be written open or closed; pick the option that matches.'],
      terms: [['domain / range', 'allowed inputs / resulting outputs'], ['monotonicity', 'increasing or decreasing behaviour'], ['even / odd function', '\\(f(-x)=f(x)\\) / \\(f(-x)=-f(x)\\)'], ['axis of symmetry', '\\(x=-\\frac{b}{2a}\\) for a parabola'], ['vertex', 'turning point of a parabola'], ['piecewise function', 'defined by different rules on different intervals'], ['zero of a function', 'an \\(x\\) with \\(f(x)=0\\)']],
    },
    /* ------------------------------------------------------------- */
    {
      id: 'expolog',
      module: 2,
      title: 'Power, Exponential and Logarithmic Functions',
      summary: 'Laws of exponents and logarithms; graphs and monotonicity of \\(a^x\\) and \\(\\log_a x\\); equations, inequalities and comparing values.',
      blocks: [
        {
          h: 'Laws of exponents',
          html: String.raw`<p>\(a^m\cdot a^n=a^{m+n}\), \((a^m)^n=a^{mn}\), \((ab)^n=a^nb^n\), \(a^{-n}=\dfrac1{a^n}\), \(a^{\frac mn}=\sqrt[n]{a^m}\), \(a^0=1\).</p>
<p>Example: \(8^{\frac23}=(2^3)^{\frac23}=2^2=4\).</p>`,
        },
        {
          h: 'Laws of logarithms',
          html: String.raw`<p>\(a^b=N\iff \log_aN=b\) (\(a>0,\ a\ne1,\ N>0\)). \(\lg=\log_{10}\), \(\ln=\log_e\).</p>
<ul><li>\(\log_a(MN)=\log_aM+\log_aN\)</li><li>\(\log_a\dfrac MN=\log_aM-\log_aN\)</li><li>\(\log_aM^n=n\log_aM\)</li>
<li>Change of base: \(\log_ab=\dfrac{\lg b}{\lg a}\), so \(\log_ab\cdot\log_bc=\log_ac\)</li><li>\(\log_a1=0\), \(\log_aa=1\)</li></ul>`,
        },
        {
          h: 'Graphs and monotonicity',
          html: String.raw`<div class="scroll"><table class="mini"><tr><th></th><th>\(y=a^x\)</th><th>\(y=\log_ax\)</th></tr>
<tr><td>Domain</td><td>\(\mathbb R\)</td><td>\((0,+\infty)\)</td></tr>
<tr><td>Fixed point</td><td>\((0,1)\)</td><td>\((1,0)\)</td></tr>
<tr><td>\(a>1\)</td><td>increasing</td><td>increasing</td></tr>
<tr><td>\(0<a<1\)</td><td>decreasing</td><td>decreasing</td></tr></table></div>
<p>\(y=a^{x-h}+k\) always passes through \((h,1+k)\); \(y=\log_a(x-h)+k\) always passes through \((h+1,k)\).</p>
<p><b>Comparing values</b>: use 0 and 1 as stepping stones. \(2^{0.3}>1\), \(0<0.3^2<1\), \(\log_20.3<0\).</p>`,
        },
      ],
      example: {
        q: String.raw`Solve \(4^{x-1}=32\).`,
        steps: [String.raw`Write both sides in base 2: \(2^{2(x-1)}=2^5\).`, String.raw`Equate exponents: \(2x-2=5\).`, String.raw`\(x=\dfrac72\).`],
      },
      tips: ['For log equations, check the domain (the argument must be positive) and reject extraneous roots.', 'In \\((\\tfrac12)^x>4\\) the base is below 1, so the inequality reverses when you compare exponents.'],
      terms: [['exponent / power', 'the \\(n\\) in \\(a^n\\)'], ['base', 'the \\(a\\) in \\(a^n\\) or \\(\\log_a\\)'], ['common logarithm', '\\(\\lg x=\\log_{10}x\\)'], ['natural logarithm', '\\(\\ln x=\\log_e x\\)'], ['change of base', '\\(\\log_ab=\\frac{\\lg b}{\\lg a}\\)'], ['passes through', 'the graph contains the point']],
    },
    /* ------------------------------------------------------------- */
    {
      id: 'trig',
      module: 2,
      title: 'Trigonometric Functions',
      summary: 'Radians, special values, signs by quadrant, key identities, period and maximum, graph shifts, and the laws of sines and cosines.',
      blocks: [
        {
          h: 'Special values',
          html: String.raw`<p>\(180^\circ=\pi\) rad, so \(30^\circ=\frac\pi6\), \(45^\circ=\frac\pi4\), \(60^\circ=\frac\pi3\), \(90^\circ=\frac\pi2\).</p>
<div class="scroll"><table class="mini"><tr><th>\(\alpha\)</th><th>\(0\)</th><th>\(\frac\pi6\)</th><th>\(\frac\pi4\)</th><th>\(\frac\pi3\)</th><th>\(\frac\pi2\)</th></tr>
<tr><td>\(\sin\)</td><td>\(0\)</td><td>\(\frac12\)</td><td>\(\frac{\sqrt2}2\)</td><td>\(\frac{\sqrt3}2\)</td><td>\(1\)</td></tr>
<tr><td>\(\cos\)</td><td>\(1\)</td><td>\(\frac{\sqrt3}2\)</td><td>\(\frac{\sqrt2}2\)</td><td>\(\frac12\)</td><td>\(0\)</td></tr>
<tr><td>\(\tan\)</td><td>\(0\)</td><td>\(\frac{\sqrt3}3\)</td><td>\(1\)</td><td>\(\sqrt3\)</td><td>—</td></tr></table></div>
<p>Signs by quadrant: I all positive, II \(\sin>0\), III \(\tan>0\), IV \(\cos>0\). For \(\sin\frac{7\pi}6\): reference angle \(\frac\pi6\), quadrant III, so \(-\frac12\).</p>`,
        },
        {
          h: 'Key identities',
          html: String.raw`<ul><li>\(\sin^2\alpha+\cos^2\alpha=1\), \(\tan\alpha=\dfrac{\sin\alpha}{\cos\alpha}\)</li>
<li>\(\sin2\alpha=2\sin\alpha\cos\alpha\)</li>
<li>\(\cos2\alpha=\cos^2\alpha-\sin^2\alpha\)</li>
<li>\(\cos2\alpha=1-2\sin^2\alpha=2\cos^2\alpha-1\)</li>
<li>\(\sin(\alpha\pm\beta)=\sin\alpha\cos\beta\pm\cos\alpha\sin\beta\)</li>
<li>\(\cos(\alpha\pm\beta)=\cos\alpha\cos\beta\mp\sin\alpha\sin\beta\)</li>
<li>\(a\sin x+b\cos x=\sqrt{a^2+b^2}\,\sin(x+\varphi)\), so the maximum is \(\sqrt{a^2+b^2}\)</li>
<li>Given \(\tan\alpha\): divide numerator and denominator by \(\cos\alpha\), or use \(\sin\alpha\cos\alpha=\dfrac{\tan\alpha}{1+\tan^2\alpha}\)</li></ul>`,
        },
        {
          h: 'The graph of \\(y=A\\sin(\\omega x+\\varphi)+B\\)',
          html: String.raw`<ul><li>Smallest positive period \(T=\dfrac{2\pi}{|\omega|}\) (for \(\tan\): \(T=\dfrac{\pi}{|\omega|}\))</li>
<li>Maximum \(|A|+B\), minimum \(-|A|+B\)</li>
<li>Shift <b>left</b> by \(h\): replace \(x\) with \(x+h\) ("left add, right subtract"). Shifting \(y=\sin2x\) left by \(\frac\pi6\) gives \(y=\sin\left(2x+\frac\pi3\right)\) — remember to multiply by \(\omega\).</li></ul>`,
        },
        {
          h: 'Solving triangles',
          html: String.raw`<ul><li>Law of cosines: \(c^2=a^2+b^2-2ab\cos C\)</li><li>Law of sines: \(\dfrac a{\sin A}=\dfrac b{\sin B}=\dfrac c{\sin C}=2R\)</li><li>Area: \(S=\frac12ab\sin C\)</li></ul>`,
        },
      ],
      example: {
        q: String.raw`Given \(\sin\alpha=\frac35\) and \(\alpha\in\left(\frac\pi2,\pi\right)\), find \(\sin2\alpha\).`,
        steps: [String.raw`Quadrant II, so \(\cos\alpha<0\): \(\cos\alpha=-\sqrt{1-\frac9{25}}=-\frac45\).`, String.raw`\(\sin2\alpha=2\cdot\frac35\cdot\left(-\frac45\right)=-\frac{24}{25}\).`],
      },
      tips: ['Memorise the Pythagorean triples 3-4-5, 5-12-13, 8-15-17 and 7-24-25; they appear often.', 'Fix the quadrant before choosing a ± sign.'],
      terms: [['radian', '\\(\\pi\\) rad \\(=180^\\circ\\)'], ['quadrant', 'one of the four regions of the plane'], ['period', 'the length after which the graph repeats'], ['amplitude', '\\(|A|\\)'], ['shift left / right', 'translate the graph horizontally'], ['law of sines / cosines', 'relations between sides and angles']],
    },
    /* ------------------------------------------------------------- */
    {
      id: 'seq',
      module: 2,
      title: 'Sequences',
      summary: 'Arithmetic and geometric sequences: general term, sum of the first n terms, key properties, and \\(a_n=S_n-S_{n-1}\\).',
      blocks: [
        {
          h: 'Arithmetic sequences',
          html: String.raw`<ul><li>General term: \(a_n=a_1+(n-1)d\) (\(d\) is the common difference)</li>
<li>Sum: \(S_n=\dfrac{n(a_1+a_n)}2=na_1+\dfrac{n(n-1)}2d\)</li>
<li>Property: if \(m+n=p+q\), then \(a_m+a_n=a_p+a_q\). For example \(S_9=\dfrac{9(a_1+a_9)}2=\dfrac{9(a_4+a_6)}2\)</li>
<li>\(d=\dfrac{a_q-a_p}{q-p}\)</li></ul>`,
        },
        {
          h: 'Geometric sequences',
          html: String.raw`<ul><li>General term: \(a_n=a_1q^{n-1}\) (\(q\) is the common ratio)</li>
<li>Sum: \(S_n=\dfrac{a_1(1-q^n)}{1-q}\) (\(q\ne1\)); \(S_n=na_1\) when \(q=1\)</li>
<li>Property: if \(m+n=p+q\), then \(a_ma_n=a_pa_q\). For example \(a_5^2=a_2a_8\)</li></ul>`,
        },
        {
          h: 'From \\(S_n\\) to \\(a_n\\)',
          html: String.raw`<p>\(a_1=S_1\), and for \(n\ge2\): \(a_n=S_n-S_{n-1}\).</p>`,
        },
      ],
      example: {
        q: String.raw`In an arithmetic sequence, \(a_3=7\) and \(a_7=19\). Find \(a_{10}\).`,
        steps: [String.raw`\(d=\dfrac{19-7}{7-3}=3\).`, String.raw`\(a_{10}=a_7+3d=19+9=28\).`],
      },
      tips: ['"Positive terms" in a geometric sequence means take only the positive root.', 'Watch the exponent \\(n-1\\): \\(a_5=a_1q^4\\).'],
      terms: [['arithmetic sequence', 'constant difference'], ['geometric sequence', 'constant ratio'], ['common difference', '\\(d=a_{n+1}-a_n\\)'], ['common ratio', '\\(q=a_{n+1}/a_n\\)'], ['general term', 'formula for \\(a_n\\)'], ['sum of the first n terms', '\\(S_n\\)']],
    },
    /* ------------------------------------------------------------- */
    {
      id: 'deriv',
      module: 2,
      title: 'Derivatives and Basic Calculus',
      summary: 'Definition and geometric meaning of the derivative, derivative rules, tangent lines, monotonicity, extrema and definite integrals.',
      blocks: [
        {
          h: 'Definition and geometric meaning',
          html: String.raw`<p>\[f'(x_0)=\lim_{\Delta x\to0}\frac{f(x_0+\Delta x)-f(x_0)}{\Delta x}\]</p>
<p>\(f'(x_0)\) is the slope of the tangent line to the graph at \((x_0,f(x_0))\). Note: \(\displaystyle\lim_{\Delta x\to0}\frac{f(x_0+2\Delta x)-f(x_0)}{\Delta x}=2f'(x_0)\).</p>`,
        },
        {
          h: 'Derivative rules',
          html: String.raw`<div class="scroll"><table class="mini"><tr><th>\(f(x)\)</th><th>\(f'(x)\)</th><th>\(f(x)\)</th><th>\(f'(x)\)</th></tr>
<tr><td>\(C\)</td><td>\(0\)</td><td>\(x^n\)</td><td>\(nx^{n-1}\)</td></tr>
<tr><td>\(\sin x\)</td><td>\(\cos x\)</td><td>\(\cos x\)</td><td>\(-\sin x\)</td></tr>
<tr><td>\(e^x\)</td><td>\(e^x\)</td><td>\(a^x\)</td><td>\(a^x\ln a\)</td></tr>
<tr><td>\(\ln x\)</td><td>\(\frac1x\)</td><td>\(\log_ax\)</td><td>\(\frac1{x\ln a}\)</td></tr></table></div>
<p>\((u\pm v)'=u'\pm v'\), \((uv)'=u'v+uv'\), \(\left(\dfrac uv\right)'=\dfrac{u'v-uv'}{v^2}\)</p>`,
        },
        {
          h: 'Applications',
          html: String.raw`<ul><li><b>Tangent line</b>: \(y-f(x_0)=f'(x_0)(x-x_0)\)</li>
<li>\(f'(x)>0\): increasing; \(f'(x)<0\): decreasing</li>
<li><b>Local extremum</b>: \(f'\) changes from + to − gives a local maximum; from − to + gives a local minimum</li>
<li>Tangent parallel to \(y=kx+b\) means \(f'(x_0)=k\)</li></ul>`,
        },
        {
          h: 'Definite integrals',
          html: String.raw`<p>Newton–Leibniz: \(\displaystyle\int_a^bf(x)\,dx=F(b)-F(a)\), where \(F'=f\). Area between curves \(=\displaystyle\int_a^b(\text{upper}-\text{lower})\,dx\).</p>`,
        },
      ],
      example: {
        q: String.raw`Find the tangent line to \(y=x^3-2x\) at \((1,-1)\).`,
        steps: [String.raw`\(y'=3x^2-2\), so \(k=y'(1)=1\).`, String.raw`\(y-(-1)=1\cdot(x-1)\), i.e. \(y=x-2\).`],
      },
      tips: ['Distinguish "local maximum value" (a \\(y\\)-value) from "point of local maximum" (an \\(x\\)-value).', 'A point where \\(f\\prime=0\\) is not always an extremum; check that the sign changes.'],
      terms: [['derivative', '\\(f\\prime(x)\\), instantaneous rate of change'], ['tangent line', 'the line touching the curve at a point'], ['slope', 'steepness \\(k\\)'], ['local maximum / minimum', 'peak / valley of the graph'], ['definite integral', '\\(\\int_a^b f(x)\\,dx\\)'], ['antiderivative', '\\(F\\) with \\(F\\prime=f\\)'], ['enclosed area', 'the region between curves']],
    },
    /* ------------------------------------------------------------- */
    {
      id: 'lines',
      module: 3,
      title: 'Lines and Circles',
      summary: 'Slope and angle of inclination, equations of lines, parallel and perpendicular lines, distances, circles and line–circle position.',
      blocks: [
        {
          h: 'Lines',
          html: String.raw`<ul><li>Slope \(k=\tan\alpha=\dfrac{y_2-y_1}{x_2-x_1}\), angle of inclination \(\alpha\in[0,\pi)\). The line \(Ax+By+C=0\) has \(k=-\dfrac AB\).</li>
<li>Forms: \(y=kx+b\), \(y-y_0=k(x-x_0)\), \(Ax+By+C=0\)</li>
<li><b>Parallel</b>: \(k_1=k_2\); a line parallel to \(Ax+By+C=0\) has the form \(Ax+By+m=0\)</li>
<li><b>Perpendicular</b>: \(k_1k_2=-1\), or \(A_1A_2+B_1B_2=0\); a perpendicular line has the form \(Bx-Ay+m=0\)</li></ul>`,
        },
        {
          h: 'Distances',
          html: String.raw`<p>From the point \((x_0,y_0)\) to the line \(Ax+By+C=0\): \[d=\frac{|Ax_0+By_0+C|}{\sqrt{A^2+B^2}}\]</p>
<p>Between parallel lines \(Ax+By+C_1=0\) and \(Ax+By+C_2=0\): \(d=\dfrac{|C_1-C_2|}{\sqrt{A^2+B^2}}\). Make the \(A,B\) coefficients identical first.</p>`,
        },
        {
          h: 'Circles',
          html: String.raw`<ul><li>Standard form: \((x-a)^2+(y-b)^2=r^2\), centre \((a,b)\), radius \(r\)</li>
<li>General form: \(x^2+y^2+Dx+Ey+F=0\), centre \(\left(-\frac D2,-\frac E2\right)\), \(r=\frac12\sqrt{D^2+E^2-4F}\)</li>
<li>Line vs circle (\(d\) = distance from centre to line): \(d<r\) intersecting, \(d=r\) tangent, \(d>r\) separate</li>
<li>Chord length: \(L=2\sqrt{r^2-d^2}\)</li></ul>`,
        },
      ],
      example: {
        q: String.raw`Find the distance from \((1,2)\) to the line \(3x+4y-1=0\).`,
        steps: [String.raw`\(d=\dfrac{|3\cdot1+4\cdot2-1|}{\sqrt{9+16}}=\dfrac{10}{5}=2\).`],
      },
      tips: ['When completing the square, keep track of signs: \\(x^2-6x=(x-3)^2-9\\).', 'In the general form of a circle, the centre has the opposite sign of \\(D\\) and \\(E\\) (halved).'],
      terms: [['slope', '\\(k=\\tan\\alpha\\)'], ['angle of inclination', 'angle from the positive \\(x\\)-axis'], ['parallel / perpendicular', 'same slope / slopes multiply to \\(-1\\)'], ['centre / radius', '\\((a,b)\\) / \\(r\\)'], ['chord', 'segment cut from the circle by a line'], ['tangent / intersecting / separate', 'one / two / no common points']],
    },
    /* ------------------------------------------------------------- */
    {
      id: 'conics',
      module: 3,
      title: 'Ellipses, Hyperbolas and Parabolas',
      summary: 'Standard equations, foci, eccentricity, asymptotes, directrix, and using the definition of each conic.',
      blocks: [
        {
          h: 'Ellipse',
          html: String.raw`<p>Definition: \(|PF_1|+|PF_2|=2a\). Equation \(\dfrac{x^2}{a^2}+\dfrac{y^2}{b^2}=1\ (a>b>0)\)</p>
<ul><li>\(c^2=a^2-b^2\), foci \((\pm c,0)\), eccentricity \(e=\dfrac ca\in(0,1)\)</li>
<li>Major axis length \(2a\), minor axis \(2b\), focal distance \(2c\)</li>
<li>The foci lie on the axis with the <b>larger</b> denominator.</li>
<li>Perimeter of \(\triangle PF_1F_2=2a+2c\); a chord through \(F_1\) meeting the ellipse at \(A,B\) gives perimeter of \(\triangle ABF_2=4a\)</li></ul>`,
        },
        {
          h: 'Hyperbola',
          html: String.raw`<p>Definition: \(\big||PF_1|-|PF_2|\big|=2a\). Equation \(\dfrac{x^2}{a^2}-\dfrac{y^2}{b^2}=1\)</p>
<ul><li>\(c^2=a^2+b^2\), \(e=\dfrac ca>1\)</li>
<li>Asymptotes \(y=\pm\dfrac bax\). For \(\dfrac{y^2}{a^2}-\dfrac{x^2}{b^2}=1\): \(y=\pm\dfrac abx\)</li>
<li>The foci lie on the axis of the variable with the <b>positive</b> sign.</li></ul>`,
        },
        {
          h: 'Parabola',
          html: String.raw`<p>Definition: distance to the focus = distance to the directrix.</p>
<div class="scroll"><table class="mini"><tr><th>Equation</th><th>Focus</th><th>Directrix</th></tr>
<tr><td>\(y^2=2px\)</td><td>\(\left(\frac p2,0\right)\)</td><td>\(x=-\frac p2\)</td></tr>
<tr><td>\(x^2=2py\)</td><td>\(\left(0,\frac p2\right)\)</td><td>\(y=-\frac p2\)</td></tr></table></div>
<p>For \(P(x_0,y_0)\) on \(y^2=2px\): \(|PF|=x_0+\dfrac p2\). <b>Careful</b>: rewrite \(y=ax^2\) as \(x^2=\dfrac1ay\) first.</p>`,
        },
      ],
      example: {
        q: String.raw`Find the eccentricity of \(\dfrac{x^2}{25}+\dfrac{y^2}{16}=1\).`,
        steps: [String.raw`\(a^2=25,\ b^2=16\), so \(c^2=9\) and \(c=3\).`, String.raw`\(e=\dfrac ca=\dfrac35\).`],
      },
      tips: ['Ellipse: \\(c^2=a^2-b^2\\) (minus). Hyperbola: \\(c^2=a^2+b^2\\) (plus). This is the most common mix-up.', 'If a denominator is not a perfect square, expect a radical answer such as \\(\\frac{\\sqrt5}{5}\\).'],
      terms: [['focus (pl. foci)', 'the fixed point(s) defining the conic'], ['eccentricity', '\\(e=c/a\\)'], ['major / minor axis', 'longer / shorter axis of an ellipse'], ['asymptote', 'line the hyperbola approaches'], ['directrix', 'fixed line defining a parabola'], ['standard equation', 'canonical form of the curve']],
    },
    /* ------------------------------------------------------------- */
    {
      id: 'vectors',
      module: 3,
      title: 'Vectors',
      summary: 'Coordinate operations, the dot product, magnitude, angle, and the conditions for parallel and perpendicular vectors.',
      blocks: [
        {
          h: 'Coordinates and operations',
          html: String.raw`<p>\(\vec a=(x_1,y_1)\), \(\vec b=(x_2,y_2)\): \(\vec a\pm\vec b=(x_1\pm x_2,\ y_1\pm y_2)\), \(\lambda\vec a=(\lambda x_1,\lambda y_1)\), \(|\vec a|=\sqrt{x_1^2+y_1^2}\).</p>`,
        },
        {
          h: 'Dot product',
          html: String.raw`<ul><li>\(\vec a\cdot\vec b=|\vec a||\vec b|\cos\theta=x_1x_2+y_1y_2\)</li>
<li>\(\cos\theta=\dfrac{\vec a\cdot\vec b}{|\vec a||\vec b|}\), \(\theta\in[0,\pi]\)</li>
<li>\(|\vec a\pm\vec b|^2=|\vec a|^2\pm2\vec a\cdot\vec b+|\vec b|^2\)</li></ul>`,
        },
        {
          h: 'Parallel and perpendicular',
          html: String.raw`<ul><li>\(\vec a\perp\vec b\iff\vec a\cdot\vec b=0\iff x_1x_2+y_1y_2=0\)</li>
<li>\(\vec a\parallel\vec b\iff x_1y_2-x_2y_1=0\)</li></ul>`,
        },
      ],
      example: {
        q: String.raw`\(|\vec a|=2\), \(|\vec b|=3\), angle \(\frac\pi3\). Find \(|\vec a+\vec b|\).`,
        steps: [String.raw`\(\vec a\cdot\vec b=2\cdot3\cdot\frac12=3\).`, String.raw`\(|\vec a+\vec b|^2=4+2\cdot3+9=19\), so \(|\vec a+\vec b|=\sqrt{19}\).`],
      },
      tips: ['Square first when finding \\(|\\vec a\\pm\\vec b|\\); never just add the lengths.', 'Perpendicular uses a sum (\\(x_1x_2+y_1y_2\\)); parallel uses a cross difference (\\(x_1y_2-x_2y_1\\)).'],
      terms: [['dot product', '\\(\\vec a\\cdot\\vec b\\)'], ['magnitude', 'length \\(|\\vec a|\\)'], ['angle between', '\\(\\theta\\in[0,\\pi]\\)'], ['parallel / perpendicular', '\\(\\parallel\\) / \\(\\perp\\)']],
    },
    /* ------------------------------------------------------------- */
    {
      id: 'complex',
      module: 3,
      title: 'Complex Numbers',
      summary: 'The form \\(a+bi\\); addition, multiplication and division; modulus, conjugate and points in the complex plane.',
      blocks: [
        {
          h: 'Definitions',
          html: String.raw`<ul><li>\(z=a+bi\) (\(a,b\in\mathbb R\), \(i^2=-1\)); real part \(a\), imaginary part \(b\)</li>
<li><b>Real</b>: \(b=0\). <b>Purely imaginary</b>: \(a=0\) and \(b\ne0\)</li>
<li>Conjugate \(\bar z=a-bi\), modulus \(|z|=\sqrt{a^2+b^2}\), \(z\bar z=|z|^2\)</li>
<li>The point \(Z(a,b)\) in the complex plane: read the quadrant from the signs of \(a\) and \(b\)</li></ul>`,
        },
        {
          h: 'Operations',
          html: String.raw`<ul><li>Multiplication: \((a+bi)(c+di)=(ac-bd)+(ad+bc)i\)</li>
<li>Division: multiply top and bottom by the conjugate of the denominator \[\frac{a+bi}{c+di}=\frac{(a+bi)(c-di)}{c^2+d^2}\]</li>
<li>\(|z_1z_2|=|z_1||z_2|\), \(\left|\dfrac{z_1}{z_2}\right|=\dfrac{|z_1|}{|z_2|}\)</li>
<li>\(i^{4k}=1,\ i^{4k+1}=i,\ i^{4k+2}=-1,\ i^{4k+3}=-i\)</li>
<li>\((1+i)^2=2i\), \((1-i)^2=-2i\), \(\dfrac{1+i}{1-i}=i\)</li></ul>`,
        },
      ],
      example: {
        q: String.raw`Compute \(\dfrac{5}{2-i}\).`,
        steps: [String.raw`\(\dfrac{5(2+i)}{(2-i)(2+i)}=\dfrac{5(2+i)}{5}\).`, String.raw`\(=2+i\).`],
      },
      tips: ['To find \\(|z|\\) from \\(z\\cdot w=u\\), skip the division: \\(|z|=|u|/|w|\\).', 'Purely imaginary needs \\(b\\ne0\\); reject values that make \\(b=0\\).'],
      terms: [['real / imaginary part', '\\(a\\) / \\(b\\) in \\(a+bi\\)'], ['purely imaginary', '\\(a=0,\\ b\\ne0\\)'], ['conjugate', '\\(\\bar z=a-bi\\)'], ['modulus', '\\(|z|=\\sqrt{a^2+b^2}\\)'], ['complex plane', 'point \\((a,b)\\) for \\(a+bi\\)']],
    },
    /* ------------------------------------------------------------- */
    {
      id: 'solid',
      module: 3,
      title: 'Solid Geometry',
      summary: 'Volume and surface area of simple solids, circumscribed spheres, the space coordinate system, distances and angles between lines.',
      blocks: [
        {
          h: 'Volume and surface area',
          html: String.raw`<div class="scroll"><table class="mini"><tr><th>Solid</th><th>Volume \(V\)</th><th>Surface area</th></tr>
<tr><td>Prism / cylinder</td><td>\(Sh\) / \(\pi r^2h\)</td><td>cylinder: \(2\pi r^2+2\pi rh\)</td></tr>
<tr><td>Pyramid / cone</td><td>\(\frac13Sh\) / \(\frac13\pi r^2h\)</td><td>cone (lateral): \(\pi rl\)</td></tr>
<tr><td>Sphere</td><td>\(\frac43\pi r^3\)</td><td>\(4\pi r^2\)</td></tr></table></div>
<p>Cone: \(l^2=r^2+h^2\), where \(l\) is the slant height.</p>`,
        },
        {
          h: 'Circumscribed sphere',
          html: String.raw`<ul><li>Cube with edge \(a\): the sphere's diameter is the space diagonal \(\sqrt3a\), so \(R=\dfrac{\sqrt3}2a\) and \(S=3\pi a^2\)</li>
<li>Box \(a\times b\times c\): \((2R)^2=a^2+b^2+c^2\)</li></ul>`,
        },
        {
          h: 'Space coordinates',
          html: String.raw`<ul><li>\(|AB|=\sqrt{(x_2-x_1)^2+(y_2-y_1)^2+(z_2-z_1)^2}\)</li>
<li>Midpoint \(\left(\frac{x_1+x_2}2,\frac{y_1+y_2}2,\frac{z_1+z_2}2\right)\)</li>
<li>\(\vec a\cdot\vec b=x_1x_2+y_1y_2+z_1z_2\); \(\vec a\perp\vec b\iff\vec a\cdot\vec b=0\)</li>
<li>Angle between two lines: \(\cos\theta=\dfrac{|\vec u\cdot\vec v|}{|\vec u||\vec v|}\), \(\theta\in\left(0,\frac\pi2\right]\). Place a cube in coordinates with \(A\) at the origin.</li></ul>`,
        },
      ],
      example: {
        q: String.raw`A cone has radius 3 and slant height 5. Find its volume.`,
        steps: [String.raw`\(h=\sqrt{5^2-3^2}=4\).`, String.raw`\(V=\frac13\pi\cdot9\cdot4=12\pi\).`],
      },
      tips: ['Do not forget the \\(\\frac13\\) for cones and pyramids.', 'In a cube the face diagonal is \\(\\sqrt2a\\) and the space diagonal is \\(\\sqrt3a\\).'],
      terms: [['volume / surface area', '\\(V\\) / \\(S\\)'], ['lateral surface', 'the side surface only'], ['slant height', '\\(l\\), from apex to base edge'], ['space diagonal', 'corner to opposite corner through the solid'], ['circumscribed sphere', 'passes through all vertices']],
    },
    /* ------------------------------------------------------------- */
    {
      id: 'prob',
      module: 4,
      title: 'Classical Probability',
      summary: 'The classical model, counting with combinations and permutations, complementary events and independent events.',
      blocks: [
        {
          h: 'The classical model',
          html: String.raw`<p>When all outcomes are equally likely: \[P(A)=\frac{\text{number of favourable outcomes}}{\text{total number of outcomes}}=\frac mn\]</p>
<ul><li>Combinations: \(\binom nk=C_n^k=\dfrac{n!}{k!(n-k)!}\) (order does not matter), e.g. drawing 2 balls at once</li>
<li>Permutations: \(A_n^k=\dfrac{n!}{(n-k)!}\) (order matters), e.g. people standing in a row</li>
<li>Two dice: 36 outcomes; \(n\) coin tosses: \(2^n\) outcomes</li></ul>`,
        },
        {
          h: 'Complementary and independent events',
          html: String.raw`<ul><li>\(P(\bar A)=1-P(A)\); use it for "at least one"</li>
<li>Independent: \(P(AB)=P(A)P(B)\)</li>
<li>At least one happens: \(1-P(\bar A)P(\bar B)\); exactly one: \(P(A)P(\bar B)+P(\bar A)P(B)\)</li>
<li>\(n\) people in a row: A and B adjacent with probability \(\dfrac2n\)</li></ul>`,
        },
      ],
      example: {
        q: String.raw`A bag has 3 red and 2 white balls. Two are drawn at once. Find P(at least one white).`,
        steps: [String.raw`Total \(\binom52=10\); both red \(\binom32=3\).`, String.raw`\(P=1-\dfrac3{10}=\dfrac7{10}\).`],
      },
      tips: ['"Drawn at the same time" means without replacement and unordered, so use combinations.', 'A probability lies between 0 and 1; use that to eliminate options.'],
      terms: [['event', 'a set of outcomes'], ['equally likely', 'every outcome has the same chance'], ['at least one / at most one', '≥ 1 / ≤ 1'], ['independent', 'one does not affect the other'], ['complementary event', '\\(\\bar A\\), "not A"'], ['fair die / coin', 'every face equally likely']],
    },
    /* ------------------------------------------------------------- */
    {
      id: 'stats',
      module: 4,
      title: 'Statistics',
      summary: 'Numerical characteristics of data: mean, median, mode, range, variance, standard deviation and percentiles.',
      blocks: [
        {
          h: 'Measures of position',
          html: String.raw`<ul><li><b>Mean</b>: \(\bar x=\dfrac{x_1+\cdots+x_n}n\)</li>
<li><b>Median</b>: sort the data, take the middle value (for even \(n\), the average of the two middle values)</li>
<li><b>Mode</b>: the most frequent value</li>
<li><b>\(p\)th percentile</b>: compute \(i=n\times p\%\). If \(i\) is not an integer, take the \(\lceil i\rceil\)th value; if it is, average the \(i\)th and \((i+1)\)th values</li>
<li>Combined mean of two groups: \(\bar x=\dfrac{n_1\bar x_1+n_2\bar x_2}{n_1+n_2}\)</li></ul>`,
        },
        {
          h: 'Measures of spread',
          html: String.raw`<ul><li><b>Range</b>: \(\max-\min\)</li>
<li><b>Variance</b>: \(s^2=\dfrac1n\sum_{i=1}^n(x_i-\bar x)^2\); <b>standard deviation</b>: \(s=\sqrt{s^2}\)</li>
<li>If \(y_i=ax_i+b\): \(\bar y=a\bar x+b\) and \(s_y^2=a^2s_x^2\) (adding \(b\) does not change the variance)</li></ul>`,
        },
      ],
      example: {
        q: String.raw`Find the variance of \(2,4,6,8,10\).`,
        steps: [String.raw`\(\bar x=6\); deviations \(-4,-2,0,2,4\).`, String.raw`\(s^2=\dfrac{16+4+0+4+16}5=8\).`],
      },
      tips: ['Always sort the data before finding the median or a percentile.', 'In these papers the variance divides by \\(n\\), not \\(n-1\\).'],
      terms: [['mean', 'average'], ['median', 'middle value of sorted data'], ['mode', 'most frequent value'], ['range', 'max − min'], ['variance', '\\(s^2\\)'], ['standard deviation', '\\(s\\)'], ['percentile', 'value below which p% of data lie']],
    },
    /* ------------------------------------------------------------- */
    {
      id: 'normal',
      module: 4,
      title: 'Normal Distribution',
      summary: 'The normal curve, its symmetry, computing probabilities, and the \\(3\\sigma\\) rule.',
      blocks: [
        {
          h: 'Properties of the curve',
          html: String.raw`<ul><li>\(X\sim N(\mu,\sigma^2)\): a bell-shaped curve, symmetric about \(x=\mu\), highest at \(x=\mu\)</li>
<li>Larger \(\sigma\): lower and wider; smaller \(\sigma\): taller and narrower</li>
<li>\(P(X<\mu)=P(X>\mu)=0.5\)</li>
<li>Symmetry: \(P(X>\mu+c)=P(X<\mu-c)\)</li>
<li>If \(P(X<a)=P(X>b)\), then \(\mu=\dfrac{a+b}2\)</li></ul>`,
        },
        {
          h: 'The \\(3\\sigma\\) rule',
          html: String.raw`<ul><li>\(P(\mu-\sigma<X\le\mu+\sigma)\approx0.6826\)</li><li>\(P(\mu-2\sigma<X\le\mu+2\sigma)\approx0.9544\)</li><li>\(P(\mu-3\sigma<X\le\mu+3\sigma)\approx0.9974\)</li></ul>
<p>So \(P(X>\mu+\sigma)\approx\dfrac{1-0.6826}2=0.1587\) and \(P(\mu+\sigma<X\le\mu+2\sigma)\approx\dfrac{0.9544-0.6826}2=0.1359\).</p>`,
        },
      ],
      example: {
        q: String.raw`\(X\sim N(2,\sigma^2)\), \(P(X>4)=0.2\). Find \(P(0<X<2)\).`,
        steps: [String.raw`Symmetry about \(x=2\): \(P(X<0)=P(X>4)=0.2\).`, String.raw`\(P(0<X<2)=0.5-0.2=0.3\).`],
      },
      tips: ['Sketch the curve and shade the region asked for; it prevents sign mistakes.', 'Papers usually give 0.6826 and 0.9544, so there is no need to memorise every digit.'],
      terms: [['mean μ', 'centre of the curve'], ['standard deviation σ', 'spread of the curve'], ['symmetric about', 'mirror image across a line'], ['bell-shaped curve', 'the normal density curve'], ['approximately', '≈']],
    },
  ];

  const API = { LESSONS: L };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.CSCA_LESSONS = L;
})(typeof window !== 'undefined' ? window : globalThis);
