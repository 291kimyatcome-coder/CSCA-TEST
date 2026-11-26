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

**Conic sections, the Feynman way:** `Lesson-Conics-Feynman.pdf` (7 pages) explains ellipses, hyperbolas and parabolas in simple words first, then with a picture, then the formula, in English and Khmer. It shows why \(c^2=a^2-b^2\) and \(c^2=a^2+b^2\) from the pictures, how to name a conic in 3 seconds, the four parabola positions, worked CSCA-style examples, common mistakes, a one-page summary and 8 practice questions with answers. Rebuild with `node tools/build-bilingual.js conics`.

**Answers and detailed solutions (new):** `Solutions-Sheet-01.pdf` … `Solutions-Sheet-20.pdf` give, for every question of the 20 exam sheets, a card with the question (English + Khmer), the four choices (ក ខ គ ឃ = A B C D) with the correct one marked, the key idea, a step-by-step solution where every step is written in English and in Khmer, and the final answer. Each file starts with the answer key. `All-Solutions-1-20.pdf` (500 pages) puts all 20 in one file with a bookmark per sheet. Rebuild with `node tools/build-bilingual.js solutions` then `python3 tools/merge-solutions.py` (needs `pypdf`). The steps come from the question templates in `js/engine.js` (`key` and `steps`), so they always match the numbers in the question.

`All-Lessons-Modules-1-4.pdf` (68 pages) puts all 15 lessons in one file. `All-Exam-Sheets-1-20.pdf` (240 pages) puts all 20 sheets in one file with bookmarks, and `All-Exam-Sheets-1-10.pdf` / `All-Exam-Sheets-11-20.pdf` are half-size versions. Each single file is under 0.5 MB. These sheets are not on the website, so students have not seen them. Rebuild with `node tools/build-bilingual.js` (needs `mathjax@3` and Playwright). Question translations live in `js/khmer.js` and the lesson translations in `js/lessons-km.js`. `node tools/validate.js` checks that every question has a Khmer translation.

## Logo

`logo/` holds the CSCA 2026 logo, in the site's own colours and IBM Plex type, with the text converted to outlines so it looks the same everywhere:

- `csca-2026-logo.svg` / `.png`: horizontal logo for light backgrounds (transparent PNG)
- `csca-2026-logo-dark.svg` / `.png`: version for dark backgrounds
- `csca-2026-logo-circle.svg` / `.png`: round badge (512 × 512, transparent corners) with the full name around the rim
- `csca-2026-icon.svg` / `.png`: square icon (512 × 512) for a favicon, profile picture or Telegram group

The mark is an answer-sheet grid of four bubbles (the four syllabus modules, or choices A–D), with one bubble filled in. This is not the official CSCA logo. Rebuild with `pip install fonttools brotli uharfbuzz && python3 tools/build-logo.py`.

## 50-hour study plan poster

`plan/CSCA-50-hour-plan.png` (for phones and Telegram) and `plan/CSCA-50-hour-plan.pdf` (to print on A3 or A2) show a plan to finish the 20 exam sheets in 50 hours: 2 hours a day, Monday to Sunday, over 4 weeks. Days 1–4 cover one syllabus part each (lesson, then that part of Sheets 1–3). Days 5–21 are one timed sheet a day (Sheets 4–20). Days 22–25 are for review, a retake and a final mock, and three buffer days follow. The poster also has the daily 2-hour routine, a score tracker for the 20 sheets, and tips, in English and Khmer. Edit `plan/csca-50-hour-plan.html` and rebuild with `node tools/build-plan.js`.

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
