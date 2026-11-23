/* CSCA Mathematics practice app — UI layer (English interface and questions). */
(function () {
  'use strict';
  const E = window.CSCA;
  const LESSONS = window.CSCA_LESSONS;
  const LETTERS = 'ABCD';
  const EXAM_SECONDS = 60 * 60;
  const pad2 = (n) => String(n).padStart(2, '0');
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const mathSafe = (html) =>
    String(html).replace(/\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g, (m) => m.replace(/&(?![a-z]+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
  const choiceHtml = (q, c) => (q.math ? esc('\\(' + c + '\\)') : esc(c));
  const lessonById = {};
  LESSONS.forEach((l, i) => ((lessonById[l.id] = l), (l.index = i)));

  /* ---------------- storage (per-viewer convenience only) ---------------- */
  const KEY = 'csca-math-v1';
  let store = {};
  try { store = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { store = {}; }
  store.best = store.best || {};
  store.student = store.student || { name: '', cls: '' };
  const RESULTS_URL = ((window.CSCA_CONFIG || {}).resultsUrl || '').trim();
  store.runs = store.runs || {};
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* storage unavailable */ }
  }

  /* ---------------- MathJax ---------------- */
  let pending = [];
  function typeset(el) {
    if (!el) return;
    if (window.MathJax && window.MathJax.typesetPromise && window.__mjReady) {
      window.MathJax.typesetPromise([el]).catch(() => {});
    } else pending.push(el);
  }
  document.addEventListener('mj-ready', () => {
    const els = pending;
    pending = [];
    els.forEach((el) => document.body.contains(el) && typeset(el));
  });
  function clearMath(el) {
    try { if (window.__mjReady && window.MathJax.typesetClear) window.MathJax.typesetClear([el]); } catch (e) { /* ignore */ }
  }

  /* ---------------- data helpers ---------------- */
  const paperCache = {};
  function paper(n) {
    if (!paperCache[n]) paperCache[n] = E.makePaper(n);
    return paperCache[n];
  }
  const score100 = (correct) => Math.round((correct / 48) * 1000) / 10;
  function grade(p, answers) {
    const byModule = {};
    E.MODULES.forEach((m) => (byModule[m.id] = { right: 0, total: 0 }));
    let right = 0;
    p.questions.forEach((q, i) => {
      byModule[q.module].total++;
      if (answers[i] === q.answer) { right++; byModule[q.module].right++; }
    });
    return { right, score: score100(right), byModule };
  }
  function fmtTime(sec) {
    sec = Math.max(0, Math.round(sec));
    return pad2(Math.floor(sec / 60)) + ':' + pad2(sec % 60);
  }

  /* ---------------- shared fragments ---------------- */
  function bubbleRow(qi, selected, opts) {
    opts = opts || {};
    return LETTERS.split('')
      .map((L, ci) => {
        const cls = ['bubble'];
        if (selected === ci) cls.push('on');
        if (opts.answer === ci) cls.push('key');
        if (opts.answer !== undefined && selected === ci && selected !== opts.answer) cls.push('miss');
        return opts.static
          ? `<span class="${cls.join(' ')}">${L}</span>`
          : `<button type="button" class="${cls.join(' ')}" data-pick="${qi}:${ci}" aria-label="Question ${qi + 1} choice ${L}">${L}</button>`;
      })
      .join('');
  }
  function moduleTag(id) {
    const m = E.MODULES[id - 1];
    return `<span class="tag m${id}">${esc(m.en)}</span>`;
  }
  function questionCard(q, i, state) {
    // state: {selected, reveal, mode:'exam'|'review'|'practice'|'key', lesson}
    const short = q.choices.every((c) => c.length < 34);
    const choices = q.choices
      .map((c, ci) => {
        const cls = ['choice'];
        if (state.selected === ci) cls.push('picked');
        if (state.reveal) {
          if (ci === q.answer) cls.push('right');
          else if (state.selected === ci) cls.push('wrong');
        }
        const attr = state.mode === 'exam' ? `data-pick="${i}:${ci}"` : state.mode === 'practice' && !state.reveal ? `data-ppick="${state.lesson}:${i}:${ci}"` : 'disabled';
        return `<li><button type="button" class="${cls.join(' ')}" ${attr}><span class="bubble sm${state.selected === ci ? ' on' : ''}">${LETTERS[ci]}</span><span class="ctext">${choiceHtml(q, c)}</span></button></li>`;
      })
      .join('');
    let verdict = '';
    if (state.reveal && state.mode !== 'key') {
      verdict =
        state.selected === q.answer
          ? '<span class="verdict ok">Correct</span>'
          : state.selected === -1 || state.selected === undefined
            ? `<span class="verdict skip">Not answered · Answer ${LETTERS[q.answer]}</span>`
            : `<span class="verdict bad">Wrong · Answer ${LETTERS[q.answer]}</span>`;
    }
    const sol = state.reveal
      ? `<details class="sol"${state.openSol ? ' open' : ''}><summary>Solution</summary><div>${esc(q.sol)}</div></details>`
      : '';
    return `<article class="q" id="q${i + 1}" data-qi="${i}">
      <header class="qhead"><span class="qno">${q.no}</span>${moduleTag(q.module)}<span class="lesson-ref">${esc(lessonById[q.lesson].title)}</span>${verdict}</header>
      <p class="stem">${esc(q.q)}</p>
      <ol class="choices${short ? ' two' : ''}">${choices}</ol>
      ${sol}
    </article>`;
  }

  const wide = () => window.matchMedia('(min-width: 961px)').matches;

  /* ---------------- views ---------------- */
  function viewHome() {
    const done = Object.keys(store.best).length;
    const avg = done ? Math.round((Object.values(store.best).reduce((s, x) => s + x, 0) / done) * 10) / 10 : null;
    const modules = E.MODULES.map((m) => {
      const ls = LESSONS.filter((l) => l.module === m.id);
      const per = E.LESSON_META.filter((l) => l.module === m.id).reduce((s, l) => s + l.perPaper, 0);
      return `<div class="module m${m.id}">
        <div class="module-top"><span class="mnum">${m.id}</span><span class="mcount">${per} questions per paper</span></div>
        <h3>${esc(m.en)}</h3>
        <ul>${ls.map((l) => `<li><a href="#lesson-${l.id}">${esc(l.title)}</a></li>`).join('')}</ul>
      </div>`;
    }).join('');
    return `
    <section class="hero"><div class="wrap hero-grid">
      <div class="hero-copy">
        <p class="eyebrow">CSCA · Mathematics · English paper</p>
        <h1 class="display">Test for CSCA<br>Mathematics</h1>
        <p class="lede">${LESSONS.length} lessons that follow the CSCA Mathematics syllabus (2025 edition) and ${E.PAPER_COUNT} full mock papers in English. Each paper has 48 questions and a 60-minute timer, like the real exam, with an answer key and a worked solution for every question.</p>
        <div class="cta"><a class="btn primary" href="#paper-1">Start Paper 1</a><a class="btn" href="#lessons">Read the lessons</a></div>
      </div>
      <aside class="sheet-card" aria-label="Exam format">
        <div class="sheet-title"><span>CSCA Mathematics</span><span>2025 Syllabus</span></div>
        <dl>
          <div><dt>Duration</dt><dd>60 <small>min</small></dd></div>
          <div><dt>Total score</dt><dd>100 <small>pts</small></dd></div>
          <div><dt>Questions</dt><dd>48</dd></div>
          <div><dt>Type</dt><dd>MCQ <small>1 answer</small></dd></div>
          <div><dt>Language</dt><dd>EN <small>or Chinese</small></dd></div>
          <div><dt>Content</dt><dd>4 <small>modules</small></dd></div>
        </dl>
        <div class="sheet-bubbles" aria-hidden="true">${[0, 2, 1, 3, 0, 1].map((a, i) => `<span class="sb-no">${i + 1}</span>${bubbleRow(i, a, { static: true })}`).join('')}</div>
      </aside>
    </div></section>

    <section class="wrap section">
      <div class="section-head"><h2>Four content modules</h2><p>Each mock paper splits its 48 questions across the modules as 9 · 17 · 13 · 9.</p></div>
      <div class="modules">${modules}</div>
    </section>

    <section class="wrap section two-col">
      <div class="panel">
        <h2>How to use this site</h2>
        <ol class="steps">
          <li><b>Read a lesson</b>: key formulas, a worked example, exam tips and vocabulary.</li>
          <li><b>Practise by topic</b>: new questions every time, checked instantly.</li>
          <li><b>Sit a full paper</b>: 48 questions in 60 minutes, then review your score by module and every solution.</li>
        </ol>
      </div>
      <div class="panel">
        <h2>Your progress</h2>
        ${done
          ? `<div class="stats"><div><span class="big">${done}<small>/${E.PAPER_COUNT}</small></span><span>papers completed</span></div><div><span class="big">${avg}</span><span>average best score</span></div></div><a class="btn" href="#papers">See all papers</a>`
          : '<p class="muted">No results yet. Your scores are saved in this browser after you submit a paper.</p><a class="btn" href="#papers">See all papers</a>'}
      </div>
    </section>
    <p class="wrap disclaimer">Note: these are <b>mock papers</b> written to the official CSCA Mathematics syllabus (2025 edition). They are not official papers from the China Scholarship Council. Check official information at csca.cn.</p>`;
  }

  function viewLessons() {
    return `<section class="wrap section">
      <div class="section-head"><p class="eyebrow">Syllabus III · Content and Scope</p><h1 class="h1">All ${LESSONS.length} lessons</h1><p>Each lesson has the key formulas, a worked example, exam tips, vocabulary and practice questions.</p></div>
      ${E.MODULES.map(
        (m) => `<div class="lesson-group"><h2 class="group-title"><span class="mnum m${m.id}">${m.id}</span>${esc(m.en)}</h2>
        <div class="lesson-list">${LESSONS.filter((l) => l.module === m.id)
          .map((l) => `<a class="lesson-row" href="#lesson-${l.id}"><span class="lnum">${l.index + 1}</span><span class="lbody"><b>${esc(l.title)}</b><span class="lsum">${mathSafe(l.summary)}</span></span><span class="arrow" aria-hidden="true">→</span></a>`)
          .join('')}</div></div>`
      ).join('')}
    </section>`;
  }

  const practice = {};
  function practiceSet(id, fresh) {
    if (!practice[id] || fresh) practice[id] = { qs: E.practice(id, 6), picked: {} };
    return practice[id];
  }
  function practiceHtml(id) {
    const ps = practiceSet(id);
    return ps.qs.map((q, i) => questionCard(q, i, { mode: 'practice', lesson: id, selected: ps.picked[i], reveal: ps.picked[i] !== undefined, openSol: true })).join('');
  }

  function viewLesson(id) {
    const l = lessonById[id];
    if (!l) return viewLessons();
    const prev = LESSONS[l.index - 1], next = LESSONS[l.index + 1];
    return `<section class="wrap section lesson">
      <nav class="crumbs"><a href="#lessons">Lessons</a> / ${esc(E.MODULES[l.module - 1].en)}</nav>
      <header class="lesson-head"><span class="lnum big m${l.module}">${l.index + 1}</span><div><h1 class="h1">${esc(l.title)}</h1></div></header>
      <p class="lede">${mathSafe(l.summary)}</p>
      <div class="lesson-grid">
        <div class="lesson-main">
          ${l.blocks.map((b) => `<section class="block"><h2>${mathSafe(b.h)}</h2>${mathSafe(b.html)}</section>`).join('')}
          <section class="block example"><h2>Worked example</h2><p class="stem">${mathSafe(esc(l.example.q))}</p><ol class="steps">${l.example.steps.map((s) => `<li>${mathSafe(s)}</li>`).join('')}</ol></section>
          <section class="block tips"><h2>Exam tips</h2><ul>${l.tips.map((t) => `<li>${mathSafe(t)}</li>`).join('')}</ul></section>
        </div>
        <aside class="lesson-side"><section class="block glossary"><h2>Vocabulary</h2><table><tbody>${l.terms.map(([t, d]) => `<tr><td>${esc(t)}</td><td>${esc(d)}</td></tr>`).join('')}</tbody></table></section></aside>
      </div>
      <section class="practice">
        <div class="section-head row"><div><h2>Practice questions</h2><p>Choose an answer to check it straight away.</p></div><button type="button" class="btn" data-action="new-practice" data-lesson="${l.id}">New questions ↻</button></div>
        <div class="qlist" id="practice-list">${practiceHtml(l.id)}</div>
      </section>
      <nav class="pager">${prev ? `<a class="btn" href="#lesson-${prev.id}">← ${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a class="btn" href="#lesson-${next.id}">${esc(next.title)} →</a>` : `<a class="btn primary" href="#papers">Go to the papers →</a>`}</nav>
    </section>`;
  }

  function viewPapers() {
    const cards = [];
    for (let n = 1; n <= E.PAPER_COUNT; n++) {
      const best = store.best[n];
      const run = store.runs[n];
      const status = run && !run.done ? '<span class="pill warn">In progress</span>' : best !== undefined ? `<span class="pill ok">${best} / 100</span>` : '<span class="pill">Not started</span>';
      cards.push(`<div class="paper-card"><div class="pc-top"><span class="pc-no">${pad2(n)}</span>${status}</div><p class="pc-name">Mock Paper ${n}</p><div class="pc-actions"><a class="btn primary sm" href="#paper-${n}">Take paper</a><a class="btn sm" href="#key-${n}">Answer key</a></div></div>`);
    }
    return `<section class="wrap section">
      <div class="section-head"><p class="eyebrow">Mock papers · 48 questions · 60 minutes</p><h1 class="h1">${E.PAPER_COUNT} mock papers</h1><p>Every paper covers all four modules. "Answer key" shows the answers and full solutions, for teachers or for checking afterwards.</p></div>
      <div class="paper-grid">${cards.join('')}</div>
    </section>`;
  }

  /* ---- exam ---- */
  let exam = null; // {n, p, run}
  function viewPaper(n) {
    if (!(n >= 1 && n <= E.PAPER_COUNT)) return viewPapers();
    const p = paper(n);
    const run = store.runs[n];
    exam = { n, p, run };
    if (!run) return examIntro(n);
    if (!run.done) {
      if (remaining(run) <= 0) { finish(n, true); return viewPaper(n); }
      return examRunning(n);
    }
    return examResult(n);
  }
  function remaining(run) {
    return EXAM_SECONDS - (Date.now() - run.startedAt) / 1000;
  }
  function examIntro(n) {
    return `<section class="wrap section exam-intro">
      <nav class="crumbs"><a href="#papers">Papers</a> / Paper ${n}</nav>
      <h1 class="h1">Mock Paper ${n} <span class="en">CSCA Mathematics</span></h1>
      <div class="panel rules">
        <h2>Instructions</h2>
        <ul>
          <li>There are <b>48</b> multiple-choice questions. Each has exactly <b>one</b> correct answer.</li>
          <li>You have <b>60 minutes</b>. The timer starts when you press Start, and the paper is submitted automatically when time runs out.</li>
          <li>The paper is marked out of <b>100</b>. Wrong answers lose no marks, so answer every question.</li>
          <li>Mark an answer by clicking a choice or a bubble on the answer sheet. Your answers are saved in this browser.</li>
          ${RESULTS_URL ? '<li>When you submit, your name and result are <b>sent to your teacher</b>.</li>' : ''}
        </ul>
        <div class="student-form">
          <div class="field"><label for="st-name">Your name${RESULTS_URL ? ' (required)' : ''}</label><input id="st-name" type="text" maxlength="60" autocomplete="name" value="${esc(store.student.name)}"></div>
          <div class="field"><label for="st-class">Class</label><input id="st-class" type="text" maxlength="30" value="${esc(store.student.cls)}"></div>
        </div>
        <p class="form-error" id="st-error" hidden>Please type your name before you start, so your teacher knows whose result it is.</p>
        <button type="button" class="btn primary lg" data-action="start" data-n="${n}">Start · 60:00</button>
      </div>
    </section>`;
  }
  function sheetHtml(n, answers, opts) {
    opts = opts || {};
    const p = paper(n);
    return `<div class="answer-sheet${opts.review ? ' review' : ''}" role="group" aria-label="Answer sheet">
      ${p.questions
        .map((q, i) => `<div class="sheet-row"><a class="sheet-no" href="#paper-${n}" data-jump="${i + 1}">${i + 1}</a>${bubbleRow(i, answers[i], opts.review ? { static: true, answer: q.answer } : {})}</div>`)
        .join('')}
    </div>`;
  }
  function examRunning(n) {
    const { p, run } = exam;
    const answered = run.answers.filter((a) => a >= 0).length;
    let lastModule = 0;
    const qs = p.questions
      .map((q, i) => {
        let head = '';
        if (q.module !== lastModule) {
          lastModule = q.module;
          head = `<h2 class="module-divider m${q.module}"><span class="mnum">${q.module}</span>${esc(E.MODULES[q.module - 1].en)}</h2>`;
        }
        return head + questionCard(q, i, { mode: 'exam', selected: run.answers[i] });
      })
      .join('');
    return `<div class="exam-bar"><div class="wrap exam-bar-in">
        <span class="eb-title">Paper ${n}</span>
        <span class="eb-timer" id="timer" aria-live="off">${fmtTime(remaining(run))}</span>
        <span class="eb-count"><b id="answered">${answered}</b>/48</span>
        <button type="button" class="btn primary sm" data-action="submit">Submit</button>
      </div>
      <div class="wrap confirm" id="confirm" hidden></div>
    </div>
    <section class="wrap exam-grid">
      <div class="qlist" id="exam-list">${qs}
        <div class="end-submit"><button type="button" class="btn primary lg" data-action="submit">Submit paper</button></div>
      </div>
      <aside class="sheet-col"><details class="sheet-wrap"${wide() ? ' open' : ''}><summary>Answer sheet</summary>${sheetHtml(n, run.answers)}</details></aside>
    </section>`;
  }
  function examResult(n) {
    const { p, run } = exam;
    const g = grade(p, run.answers);
    const used = Math.min(EXAM_SECONDS, (run.submittedAt - run.startedAt) / 1000);
    const bars = E.MODULES.map((m) => {
      const b = g.byModule[m.id];
      const pct = b.total ? Math.round((b.right / b.total) * 100) : 0;
      return `<div class="bar-row"><span class="bar-label">${esc(m.en)}</span><span class="bar"><span class="bar-fill m${m.id}" style="width:${pct}%"></span></span><span class="bar-val">${b.right}/${b.total}</span></div>`;
    }).join('');
    const wrongOnly = !!run.wrongOnly;
    const list = p.questions
      .map((q, i) => (wrongOnly && run.answers[i] === q.answer ? '' : questionCard(q, i, { mode: 'review', selected: run.answers[i], reveal: true, openSol: run.answers[i] !== q.answer })))
      .join('');
    return `<section class="wrap section">
      <nav class="crumbs"><a href="#papers">Papers</a> / Paper ${n}</nav>
      <div class="result">
        <div class="score-card">
          <p class="eyebrow">Result · Paper ${n}${run.student && run.student.name ? ' · ' + esc(run.student.name) : ''}</p>
          <p class="score"><span>${g.score}</span><small>/ 100</small></p>
          <p class="muted">${g.right} of 48 correct · time used ${fmtTime(used)}${run.timeout ? ' · time ran out' : ''}${store.best[n] !== undefined ? ` · best ${store.best[n]}` : ''}</p>
          ${RESULTS_URL ? `<div id="sent-status">${sentHtml(n)}</div>` : ''}
          <div class="cta"><button type="button" class="btn" data-action="retake" data-n="${n}">Retake</button>${n < E.PAPER_COUNT ? `<a class="btn primary" href="#paper-${n + 1}">Next paper →</a>` : ''}</div>
        </div>
        <div class="panel"><h2>By module</h2>${bars}</div>
      </div>
      <div class="section-head row"><h2>Review</h2><label class="toggle"><input type="checkbox" id="wrong-only" data-action="wrong-only" data-n="${n}"${wrongOnly ? ' checked' : ''}> Show only questions I missed</label></div>
      <div class="exam-grid">
        <div class="qlist">${list || '<p class="muted">Every answer was correct.</p>'}</div>
        <aside class="sheet-col"><details class="sheet-wrap"${wide() ? ' open' : ''}><summary>Answer sheet</summary>${sheetHtml(n, run.answers, { review: true })}</details></aside>
      </div>
    </section>`;
  }
  function viewKey(n) {
    if (!(n >= 1 && n <= E.PAPER_COUNT)) return viewPapers();
    const p = paper(n);
    const grid = p.questions.map((q, i) => `<div class="key-cell"><span>${i + 1}</span><b>${LETTERS[q.answer]}</b></div>`).join('');
    return `<section class="wrap section">
      <nav class="crumbs"><a href="#papers">Papers</a> / Paper ${n} / Answer key</nav>
      <div class="section-head row"><div><p class="eyebrow">Answer key · Teacher view</p><h1 class="h1">Paper ${n} answers</h1></div><a class="btn primary" href="#paper-${n}">Take this paper</a></div>
      <div class="key-grid">${grid}</div>
      <div class="qlist">${p.questions.map((q, i) => questionCard(q, i, { mode: 'key', selected: undefined, reveal: true })).join('')}</div>
    </section>`;
  }

  /* ---------------- actions ---------------- */
  function start(n) {
    const nameEl = document.getElementById('st-name'), clsEl = document.getElementById('st-class');
    const name = nameEl ? nameEl.value.trim() : '';
    const cls = clsEl ? clsEl.value.trim() : '';
    if (RESULTS_URL && !name) {
      const err = document.getElementById('st-error');
      if (err) err.hidden = false;
      if (nameEl) nameEl.focus();
      return;
    }
    store.student = { name, cls };
    store.runs[n] = { answers: Array(48).fill(-1), startedAt: Date.now(), done: false, student: { name, cls } };
    save();
    render();
    window.scrollTo(0, 0);
  }
  function finish(n, timeout) {
    const run = store.runs[n];
    if (!run || run.done) return;
    run.done = true;
    run.submittedAt = timeout ? run.startedAt + EXAM_SECONDS * 1000 : Date.now();
    run.timeout = !!timeout;
    const g = grade(paper(n), run.answers);
    run.score = g.score;
    if (store.best[n] === undefined || g.score > store.best[n]) store.best[n] = g.score;
    if (RESULTS_URL) run.sent = 'pending';
    save();
    if (RESULTS_URL) sendResult(n);
  }

  /* ---------------- send results to the teacher's Google Sheet ---------------- */
  function sentHtml(n) {
    const run = store.runs[n];
    const st = run && run.sent;
    if (st === 'sent') return '<p class="sent ok">✓ Your result was sent to your teacher.</p>';
    if (st === 'pending') return '<p class="sent">Sending your result to your teacher…</p>';
    return `<p class="sent bad">Your result has not reached your teacher yet. Check your internet connection, then press Send again.</p><button type="button" class="btn sm" data-action="resend" data-n="${n}">Send again</button>`;
  }
  function showSent(n) {
    const box = document.getElementById('sent-status');
    if (box && exam && exam.n === n) box.innerHTML = sentHtml(n);
  }
  function sendResult(n) {
    const run = store.runs[n];
    if (!RESULTS_URL || !run || !run.done) return;
    const p = paper(n);
    const g = grade(p, run.answers);
    const wrongList = [], letters = [];
    let blank = 0;
    p.questions.forEach((q, i) => {
      const a = run.answers[i];
      letters.push(a >= 0 ? LETTERS[a] : '-');
      if (a < 0) blank++;
      if (a !== q.answer) wrongList.push(i + 1);
    });
    const payload = {
      name: (run.student && run.student.name) || '',
      cls: (run.student && run.student.cls) || '',
      paper: n,
      score: g.score,
      correct: g.right,
      wrong: 48 - g.right - blank,
      blank,
      timeUsed: fmtTime(Math.min(EXAM_SECONDS, (run.submittedAt - run.startedAt) / 1000)),
      timeout: !!run.timeout,
      wrongList: wrongList.join(', '),
      modules: E.MODULES.map((m) => g.byModule[m.id].right + '/' + g.byModule[m.id].total).join(' '),
      answers: letters.join(''),
      key: p.questions.map((q) => LETTERS[q.answer]).join(''),
    };
    run.sent = 'pending';
    save();
    showSent(n);
    // text/plain + no-cors avoids a CORS preflight, which Apps Script does not answer.
    fetch(RESULTS_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })
      .then(() => { run.sent = 'sent'; save(); showSent(n); })
      .catch(() => { run.sent = 'failed'; save(); showSent(n); });
  }
  function pick(qi, ci) {
    if (!exam || !exam.run || exam.run.done) return;
    const run = exam.run;
    run.answers[qi] = run.answers[qi] === ci ? -1 : ci;
    save();
    const sel = run.answers[qi];
    const card = document.getElementById('q' + (qi + 1));
    if (card)
      card.querySelectorAll('.choice').forEach((b, k) => {
        b.classList.toggle('picked', k === sel);
        b.querySelector('.bubble').classList.toggle('on', k === sel);
      });
    document.querySelectorAll(`.answer-sheet [data-pick^="${qi}:"]`).forEach((b) => b.classList.toggle('on', Number(b.dataset.pick.split(':')[1]) === sel));
    const a = document.getElementById('answered');
    if (a) a.textContent = run.answers.filter((x) => x >= 0).length;
  }
  function askSubmit() {
    const box = document.getElementById('confirm');
    if (!box || !exam) return;
    const left = exam.run.answers.filter((a) => a < 0).length;
    box.innerHTML = `<p>${left ? `<b>${left}</b> question${left > 1 ? 's are' : ' is'} still unanswered. ` : 'You have answered every question. '}Submit now?</p><div class="cta"><button type="button" class="btn primary sm" data-action="confirm-submit">Submit</button><button type="button" class="btn sm" data-action="cancel-submit">Keep working</button></div>`;
    box.hidden = false;
  }

  /* ---------------- router / render ---------------- */
  const main = document.getElementById('main');
  let current = '';
  function parseHash() {
    const h = (location.hash || '').replace(/^#/, '');
    let m;
    if (!h || h === 'home') return { v: 'home' };
    if (h === 'lessons') return { v: 'lessons' };
    if (h === 'papers') return { v: 'papers' };
    if ((m = /^lesson-([a-z]+)$/.exec(h))) return { v: 'lesson', id: m[1] };
    if ((m = /^paper-(\d+)$/.exec(h))) return { v: 'paper', n: Number(m[1]) };
    if ((m = /^key-(\d+)$/.exec(h))) return { v: 'key', n: Number(m[1]) };
    return { v: 'home' };
  }
  function render(keepScroll) {
    const r = parseHash();
    exam = null;
    let html;
    if (r.v === 'lessons') html = viewLessons();
    else if (r.v === 'lesson') html = viewLesson(r.id);
    else if (r.v === 'papers') html = viewPapers();
    else if (r.v === 'paper') html = viewPaper(r.n);
    else if (r.v === 'key') html = viewKey(r.n);
    else html = viewHome();
    clearMath(main);
    main.innerHTML = html;
    document.querySelectorAll('.nav a').forEach((a) => {
      const t = a.getAttribute('href').slice(1);
      a.classList.toggle('active', t === r.v || (t === 'lessons' && r.v === 'lesson') || (t === 'papers' && (r.v === 'paper' || r.v === 'key')) || (t === 'home' && r.v === 'home'));
    });
    document.body.classList.toggle('in-exam', !!(exam && exam.run && !exam.run.done));
    typeset(main);
    const key = location.hash;
    if (!keepScroll && key !== current) window.scrollTo(0, 0);
    current = key;
  }
  window.addEventListener('hashchange', () => render());

  main.addEventListener('click', (ev) => {
    const t = ev.target.closest('[data-pick],[data-ppick],[data-action],[data-jump]');
    if (!t) return;
    if (t.dataset.jump) {
      ev.preventDefault();
      const el = document.getElementById('q' + t.dataset.jump);
      if (el) el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      return;
    }
    if (t.dataset.pick) {
      const [qi, ci] = t.dataset.pick.split(':').map(Number);
      pick(qi, ci);
      return;
    }
    if (t.dataset.ppick) {
      const [id, qi, ci] = t.dataset.ppick.split(':');
      const ps = practiceSet(id);
      ps.picked[qi] = Number(ci);
      const card = t.closest('.q');
      const q = ps.qs[qi];
      clearMath(card);
      card.outerHTML = questionCard(q, Number(qi), { mode: 'practice', lesson: id, selected: Number(ci), reveal: true, openSol: true });
      typeset(document.getElementById('q' + (Number(qi) + 1)));
      return;
    }
    const a = t.dataset.action;
    if (a === 'start') start(Number(t.dataset.n));
    else if (a === 'submit') askSubmit();
    else if (a === 'cancel-submit') { const b = document.getElementById('confirm'); if (b) b.hidden = true; }
    else if (a === 'confirm-submit') { if (exam) { finish(exam.n, false); render(); window.scrollTo(0, 0); } }
    else if (a === 'resend') sendResult(Number(t.dataset.n));
    else if (a === 'retake') { delete store.runs[Number(t.dataset.n)]; save(); render(); }
    else if (a === 'new-practice') {
      const id = t.dataset.lesson;
      practiceSet(id, true);
      const list = document.getElementById('practice-list');
      clearMath(list);
      list.innerHTML = practiceHtml(id);
      typeset(list);
    }
  });
  main.addEventListener('change', (ev) => {
    const t = ev.target;
    if (t.dataset && t.dataset.action === 'wrong-only') {
      const run = store.runs[Number(t.dataset.n)];
      if (run) { run.wrongOnly = t.checked; save(); render(true); }
    }
  });

  setInterval(() => {
    if (!exam || !exam.run || exam.run.done) return;
    const left = remaining(exam.run);
    const el = document.getElementById('timer');
    if (el) {
      el.textContent = fmtTime(left);
      el.classList.toggle('low', left <= 300);
    }
    if (left <= 0) { finish(exam.n, true); render(); }
  }, 1000);

  render();
})();
