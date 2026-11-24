# Test for CSCA — Mathematics

Practice material for the **CSCA Mathematics** exam (China Scholastic Competency Assessment, English paper), written to the official **CSCA Mathematics Examination Syllabus (2025 edition)**.

| Exam format (from the syllabus) | |
|---|---|
| Duration | 60 minutes |
| Total score | 100 points |
| Language | Chinese or English |
| Question type | Multiple choice, single answer |
| Number of questions | 48 |
| Modules | Sets and Inequalities · Functions · Geometry and Algebra · Probability and Statistics |

> These are **mock papers**, not official papers from the China Scholarship Council. Check official information at csca.cn.

## What is included

- **15 lessons** (`js/lessons.js`), one per syllabus topic: key formulas, a worked example, exam tips, vocabulary, and unlimited practice questions.
- **40 mock papers × 48 questions = 1,920 questions**, each with an answer key and a worked solution. Questions per paper by module: 9 · 17 · 13 · 9.
- **Timed exam mode**: 60-minute countdown, answer-sheet bubbles, auto-submit, score out of 100, breakdown by module, and full review.
- **Printable PDFs** in `pdf/` (`paper-01.pdf` … `paper-40.pdf`): the paper with Name/Class/Score fields, then the answer key and all solutions.

## Bilingual PDFs: lessons and 20 exam sheets (English + Khmer)

`bilingual/` holds the printable material, in English with the Khmer translation:

- `Lessons-Module-1..4-*.pdf`: the 15 lessons grouped by syllabus module. Each lesson has key ideas in English with the Khmer translation, a worked example, exam tips, a vocabulary table (English, meaning, Khmer), and 10 exercises with answers and worked solutions.
- `Exam-Sheet-01.pdf` … `Exam-Sheet-20.pdf`: 48-question sheets modelled question by question on the real CSCA mathematics paper. There are four parts of 12 in syllabus order, and every question is shown as "English: …" then "ខ្មែរ: …". Each sheet ends with a bubble answer sheet, the answer key and a solution for every question.

Each file is under 0.5 MB. These sheets are not on the website, so students have not seen them. Rebuild with `node tools/build-bilingual.js` (needs `mathjax@3` and Playwright). Question translations live in `js/khmer.js` and the lesson translations in `js/lessons-km.js`. `node tools/validate.js` checks that every question has a Khmer translation.

## Collect students' results

**No setup needed:** after each paper the student sees a result summary (name, class, score, correct/wrong/blank, missed questions, score by module) with **Copy result**, **Send on Telegram** and **Share** buttons, and sends it to the teacher.

**Optional, automatic (Google Sheet):**

Students type their name and class before a paper. When `resultsUrl` in `js/config.js` is set, every submitted paper is sent to the teacher's Google Sheet as one row: name, class, paper, score, correct/wrong/blank, time used, missed questions, score by module, and a ✓ / ✗ / – column for each of the 48 questions.

Setup takes about 5 minutes: paste `teacher/Code.gs` into the sheet's Apps Script, deploy it as a Web app (Execute as: Me, Who has access: Anyone), and put the `/exec` URL into `js/config.js`. Step-by-step guide in Khmer: `teacher/SETUP-KM.md`.

## Syllabus coverage

| Module | Lessons (topics) |
|---|---|
| 1 Sets and Inequalities | sets, set operations and representation; logic conditions; quadratic, rational and absolute-value inequalities; AM–GM |
| 2 Functions | domain, range, monotonicity, parity; power, exponential, logarithmic and trigonometric functions; arithmetic and geometric sequences; derivatives and basic calculus |
| 3 Geometry and Algebra | lines and circles; ellipses, hyperbolas, parabolas; vectors; complex numbers; solid geometry and space coordinates |
| 4 Probability and Statistics | classical probability; mean, median, variance, percentiles; normal distribution |

## How it works

`js/engine.js` holds 95 question templates. Every template computes its own answer, so the answer key always matches the question, and wrong choices are built from typical mistakes (sign errors, wrong formula, forgetting a factor). Papers are seeded, so Paper 7 is the same on every device.

## Run it

**Easiest:** download `CSCA-Math.html` and double-click it. It opens in Chrome (or any browser) and works offline; everything is inside that one file.

Or open `index.html` in a browser (it needs internet only for MathJax from cdnjs), or serve the folder:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Maintain it

```bash
node tools/validate.js           # structural checks on all 40 papers + stress test of every template
node tools/validate.js --dump    # print one sample question from each template
npm i mathjax@3 && node tools/validate.js --tex    # also parse every formula with MathJax
node tools/build-pdfs.js         # regenerate pdf/ (needs mathjax@3 and Playwright)
python3 tools/build-standalone.py   # regenerate CSCA-Math.html (needs mathjax@3)
```

Fonts (IBM Plex Sans, IBM Plex Sans Condensed, IBM Plex Mono; SIL Open Font License) are embedded in `css/fonts.css`.
