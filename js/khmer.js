/*
 * Khmer translations of the English exam questions.
 *
 * Every question stem is reduced to its "shape" (math replaced by ⟨M⟩) and
 * matched against the rules below. The math segments are put back unchanged,
 * so formulas in the Khmer line are identical to the English line.
 * tools/validate.js checks that every template has a translation.
 */
(function (root) {
  'use strict';
  const MATH = /\\\([\s\S]*?\\\)/g;

  // English sub-phrases used inside longer sentences
  const PHRASE = {
    // arrangements
    'A and B stand next to each other': 'A និង B ឈរជាប់គ្នា',
    'A stands at the leftmost position': 'A ឈរនៅខាងឆ្វេងបំផុត',
    'A and B do not stand next to each other': 'A និង B មិនឈរជាប់គ្នា',
    'A stands at one of the two ends': 'A ឈរនៅចុងម្ខាងនៃជួរ',
    // balls
    'both balls are white': 'បាល់ទាំងពីរពណ៌ស',
    'one ball is red and one is white': 'បាល់មួយពណ៌ក្រហម និងមួយទៀតពណ៌ស',
    'both balls are red': 'បាល់ទាំងពីរពណ៌ក្រហម',
    'at least one ball is white': 'មានបាល់ពណ៌សយ៉ាងហោចណាស់មួយ',
    // coins
    'at most one head appears': 'ចេញមុខក្បាល (head) យ៉ាងច្រើនមួយដង',
    'at least one head appears': 'ចេញមុខក្បាល (head) យ៉ាងហោចណាស់មួយដង',
    // committee
    'at least one girl is chosen': 'មានសិស្សស្រីយ៉ាងហោចណាស់ម្នាក់',
    'no girl is chosen': 'គ្មានសិស្សស្រីសោះ',
    'exactly one girl is chosen': 'មានសិស្សស្រីម្នាក់គត់',
    // dice
    'the product of the two numbers is even': 'ផលគុណនៃលេខទាំងពីរជាចំនួនគូ',
    'the two numbers are equal': 'លេខទាំងពីរស្មើគ្នា',
    // shooters
    'exactly one of them hits the target': 'មានតែម្នាក់គត់បាញ់ត្រូវគោលដៅ',
    'the target is hit (at least one hits)': 'គោលដៅត្រូវបានបាញ់ត្រូវ (យ៉ាងហោចណាស់ម្នាក់បាញ់ត្រូវ)',
    'both hit the target': 'អ្នកទាំងពីរបាញ់ត្រូវគោលដៅ',
    'neither hits the target': 'គ្មាននរណាម្នាក់បាញ់ត្រូវគោលដៅ',
    // picking numbers
    'the sum is even': 'ផលបូកជាចំនួនគូ',
    'the sum is odd': 'ផលបូកជាចំនួនសេស',
    'both numbers are odd': 'លេខទាំងពីរជាចំនួនសេស',
    'the product is even': 'ផលគុណជាចំនួនគូ',
    // statistics words
    median: 'មេដ្យាន',
    mean: 'មធ្យមភាគ',
    mode: 'ម៉ូត',
    range: 'វិសាលភាព',
  };

  // Text answer choices
  const CHOICE = {
    'Sufficient but not necessary': 'គ្រប់គ្រាន់ តែមិនចាំបាច់',
    'Necessary but not sufficient': 'ចាំបាច់ តែមិនគ្រប់គ្រាន់',
    'Necessary and sufficient': 'ចាំបាច់ និងគ្រប់គ្រាន់',
    'Neither sufficient nor necessary': 'មិនគ្រប់គ្រាន់ ហើយក៏មិនចាំបាច់',
    Intersecting: 'កាត់គ្នា',
    Tangent: 'ប៉ះគ្នា',
    'Separate (no common points)': 'ដាច់ពីគ្នា (គ្មានចំណុចរួម)',
    'Cannot be determined': 'មិនអាចកំណត់បាន',
    'First quadrant': 'កាដ្រង់ទី ១',
    'Second quadrant': 'កាដ្រង់ទី ២',
    'Third quadrant': 'កាដ្រង់ទី ៣',
    'Fourth quadrant': 'កាដ្រង់ទី ៤',
    // exp-monotone
    [String.raw`Increasing on \(\mathbb{R}\)`]: String.raw`កើនលើ \(\mathbb{R}\)`,
    [String.raw`Decreasing on \(\mathbb{R}\)`]: String.raw`ចុះលើ \(\mathbb{R}\)`,
    'A constant function': 'ជាអនុគមន៍ថេរ',
    [String.raw`Increasing only on \((0,+\infty)\)`]: String.raw`កើនតែលើ \((0,+\infty)\) ប៉ុណ្ណោះ`,
    [String.raw`Increasing on \((0,+\infty)\)`]: String.raw`កើនលើ \((0,+\infty)\)`,
    [String.raw`Decreasing on \((0,+\infty)\)`]: String.raw`ចុះលើ \((0,+\infty)\)`,
    // deriv-meaning
    [String.raw`The slope of the tangent line to the graph of \(y=f(x)\) at \(x=x_0\)`]: String.raw`មេគុណប្រាប់ទិសនៃបន្ទាត់ប៉ះនឹងក្រាប \(y=f(x)\) ត្រង់ \(x=x_0\)`,
    [String.raw`The slope of a secant line of the graph of \(y=f(x)\)`]: String.raw`មេគុណប្រាប់ទិសនៃបន្ទាត់កាត់ (secant) មួយនៃក្រាប \(y=f(x)\)`,
    [String.raw`The value of the function \(f(x)\) at \(x=x_0\)`]: String.raw`តម្លៃនៃអនុគមន៍ \(f(x)\) ត្រង់ \(x=x_0\)`,
    [String.raw`The average rate of change of \(f(x)\) on \([x_0,x_0+\Delta x]\)`]: String.raw`អត្រាបម្រែបម្រួលមធ្យមនៃ \(f(x)\) លើ \([x_0,x_0+\Delta x]\)`,
    Increasing: 'អនុគមន៍កើន',
    Decreasing: 'អនុគមន៍ចុះ',
    Constant: 'អនុគមន៍ថេរ',
    // trig-props
    'It is an odd function': 'វាជាអនុគមន៍សេស',
    'It is an even function': 'វាជាអនុគមន៍គូ',
    [String.raw`Its smallest positive period is \(2\pi\)`]: String.raw`ខួបវិជ្ជមានតូចបំផុតរបស់វាគឺ \(2\pi\)`,
    [String.raw`Its smallest positive period is \(\pi\)`]: String.raw`ខួបវិជ្ជមានតូចបំផុតរបស់វាគឺ \(\pi\)`,
    [String.raw`It is increasing on \(\left[-\frac{\pi}{2},\frac{\pi}{2}\right]\)`]: String.raw`វាកើនលើ \(\left[-\frac{\pi}{2},\frac{\pi}{2}\right]\)`,
    [String.raw`It is decreasing on \(\left[0,\frac{\pi}{2}\right]\)`]: String.raw`វាចុះលើ \(\left[0,\frac{\pi}{2}\right]\)`,
    [String.raw`Its range is \([-1,1]\)`]: String.raw`សំណុំតម្លៃរបស់វាគឺ \([-1,1]\)`,
    [String.raw`Its range is \((0,1)\)`]: String.raw`សំណុំតម្លៃរបស់វាគឺ \((0,1)\)`,
    'Its graph is symmetric about the origin': 'ក្រាបរបស់វាឆ្លុះធៀបគល់តម្រុយ',
    [String.raw`Its maximum value is \(2\)`]: String.raw`តម្លៃអតិបរមារបស់វាគឺ \(2\)`,
    [String.raw`Its maximum value is \(1\)`]: String.raw`តម្លៃអតិបរមារបស់វាគឺ \(1\)`,
    [String.raw`It is decreasing on \([0,\pi]\)`]: String.raw`វាចុះលើ \([0,\pi]\)`,
    [String.raw`It is increasing on \([0,\pi]\)`]: String.raw`វាកើនលើ \([0,\pi]\)`,
    [String.raw`Its graph is symmetric about the \(y\)-axis`]: String.raw`ក្រាបរបស់វាឆ្លុះធៀបអ័ក្ស \(y\)`,
    [String.raw`Its minimum value is \(0\)`]: String.raw`តម្លៃអប្បបរមារបស់វាគឺ \(0\)`,
    // normal-features
    [String.raw`It is symmetric about the line \(x=\mu\)`]: String.raw`វាឆ្លុះធៀបបន្ទាត់ \(x=\mu\)`,
    'The total area under the curve is 1': 'ក្រឡាផ្ទៃសរុបនៅក្រោមខ្សែកោងស្មើ 1',
    [String.raw`It has a single peak, at \(x=\mu\)`]: String.raw`វាមានកំពូលតែមួយ នៅត្រង់ \(x=\mu\)`,
    [String.raw`It is not symmetric about the mean \(\mu\)`]: String.raw`វាមិនឆ្លុះធៀបមធ្យមភាគ \(\mu\) ទេ`,
    'It has two peaks': 'វាមានកំពូលពីរ',
    'It is bounded on both sides': 'វាមានព្រំដែនកំណត់ទាំងសងខាង',
    'The total area under the curve is 2': 'ក្រឡាផ្ទៃសរុបនៅក្រោមខ្សែកោងស្មើ 2',
    [String.raw`It is lowest at \(x=\mu\)`]: String.raw`វាទាបបំផុតនៅត្រង់ \(x=\mu\)`,
    'Shift to the right': 'រំកិលទៅខាងស្តាំ',
    'Shift to the left': 'រំកិលទៅខាងឆ្វេង',
    'Become flatter (lower and wider)': 'ទាប និងរាលជាងមុន',
    'Become steeper (taller and narrower)': 'ខ្ពស់ និងស្រួចជាងមុន',
  };

  const P = (s) => {
    if (!(s in PHRASE)) throw new Error('no Khmer phrase for: ' + s);
    return PHRASE[s];
  };
  const M = '⟨M⟩';
  const m = '⟨M⟩'.replace(/[⟨⟩]/g, '\\$&'); // escaped for RegExp
  const R = (src) => new RegExp('^' + src.replace(/⟨M⟩/g, '(⟨M⟩)') + '$');

  // [pattern, (math[], groups[]) => Khmer]. ⟨M⟩ in a pattern is a math segment.
  // Groups are numbered across the whole pattern; math groups appear as the literal ⟨M⟩.
  const RULES = [
    // ---- sets and logic
    [/^Let the universal set be ⟨M⟩, ⟨M⟩ and ⟨M⟩\. Then ⟨M⟩$/, (x) => `គេឲ្យសំណុំសកល ${x[0]}, ${x[1]} និង ${x[2]}។ គេបាន ${x[3]}`],
    [/^Let ⟨M⟩\. The number of (non-empty proper subsets|proper subsets|subsets) of ⟨M⟩ is$/, (x, g) => `គេឲ្យ ${x[0]}។ ចំនួន${{ 'non-empty proper subsets': 'សំណុំរងផ្ទាល់មិនទទេ', 'proper subsets': 'សំណុំរងផ្ទាល់', subsets: 'សំណុំរង' }[g[0]]}នៃ ${x[1]} គឺ`],
    [/^Let ⟨M⟩ and ⟨M⟩\. If ⟨M⟩, the range of ⟨M⟩ is$/, (x) => `គេឲ្យ ${x[0]} និង ${x[1]}។ បើ ${x[2]} នោះដែនតម្លៃនៃ ${x[3]} គឺ`],
    [/^For real ⟨M⟩, the statement "⟨M⟩" is a ______ condition for "⟨M⟩"\.$/, (x) => `ចំពោះចំនួនពិត ${x[0]} សំណើ "${x[1]}" ជាលក្ខខណ្ឌ ______ សម្រាប់ "${x[2]}"។`],
    [/^The negation of the proposition "⟨M⟩" is$/, (x) => `ការបដិសេធនៃសំណើ "${x[0]}" គឺ`],
    // ---- inequalities
    [/^The solution set of ⟨M⟩ is ⟨M⟩\. Then ⟨M⟩$/, (x) => `សំណុំចម្លើយនៃ ${x[0]} គឺ ${x[1]}។ គេបាន ${x[2]}`],
    [/^The solution set of ⟨M⟩ is$/, (x) => `សំណុំចម្លើយនៃ ${x[0]} គឺ`],
    [/^For ⟨M⟩, the minimum value of ⟨M⟩ is$/, (x) => `ចំពោះ ${x[0]} តម្លៃអប្បបរមានៃ ${x[1]} គឺ`],
    [/^Given ⟨M⟩ and ⟨M⟩, which of the following is necessarily true\?$/, (x) => `គេឲ្យ ${x[0]} និង ${x[1]}។ តើសំណើខាងក្រោមមួយណាពិតជានិច្ច?`],
    [/^Given ⟨M⟩ and ⟨M⟩, which of the following is false\?$/, (x) => `គេឲ្យ ${x[0]} និង ${x[1]}។ តើសំណើខាងក្រោមមួយណាមិនពិត?`],
    [/^If ⟨M⟩ holds for all real ⟨M⟩, the range of ⟨M⟩ is$/, (x) => `បើ ${x[0]} ពិតចំពោះគ្រប់ចំនួនពិត ${x[1]} នោះដែនតម្លៃនៃ ${x[2]} គឺ`],
    // ---- functions
    [/^The domain of ⟨M⟩ is$/, (x) => `ដែនកំណត់នៃ ${x[0]} គឺ`],
    [/^The range of ⟨M⟩ on ⟨M⟩ is$/, (x) => `សំណុំតម្លៃនៃ ${x[0]} លើ ${x[1]} គឺ`],
    [/^The (increasing|decreasing) interval of ⟨M⟩ is$/, (x, g) => `ចន្លោះដែល ${x[0]} ${g[0] === 'increasing' ? 'កើន' : 'ចុះ'} គឺ`],
    [/^The increasing interval\(s\) of ⟨M⟩ are$/, (x) => `ចន្លោះដែល ${x[0]} កើន គឺ`],
    [/^If ⟨M⟩ is (increasing|decreasing) on ⟨M⟩, the range of ⟨M⟩ is$/, (x, g) => `បើ ${x[0]} ជាអនុគមន៍${g[0] === 'increasing' ? 'កើន' : 'ចុះ'}លើ ${x[1]} នោះដែនតម្លៃនៃ ${x[2]} គឺ`],
    [/^Let ⟨M⟩ be an (odd|even) function on ⟨M⟩ with ⟨M⟩ for ⟨M⟩\. Then ⟨M⟩$/, (x, g) => `គេឲ្យ ${x[0]} ជាអនុគមន៍${g[0] === 'odd' ? 'សេស' : 'គូ'}លើ ${x[1]} ដែល ${x[2]} ចំពោះ ${x[3]}។ គេបាន ${x[4]}`],
    [/^Which of the following functions is an even function\?$/, () => 'តើអនុគមន៍ខាងក្រោមមួយណាជាអនុគមន៍គូ?'],
    [/^Which of the following functions is an odd function\?$/, () => 'តើអនុគមន៍ខាងក្រោមមួយណាជាអនុគមន៍សេស?'],
    [/^Which of the following functions is both odd and increasing on its whole domain ⟨M⟩\?$/, (x) => `តើអនុគមន៍ខាងក្រោមមួយណាជាអនុគមន៍សេស ហើយកើនលើដែនកំណត់ទាំងមូល ${x[0]}?`],
    [/^The zero of ⟨M⟩ lies in the interval$/, (x) => `ឫសនៃ ${x[0]} ស្ថិតនៅក្នុងចន្លោះ`],
    [/^For ⟨M⟩ and ⟨M⟩, the graph of ⟨M⟩ always passes through the point$/, (x) => `ចំពោះ ${x[0]} និង ${x[1]} ក្រាបនៃ ${x[2]} តែងតែកាត់តាមចំណុច`],
    [/^The solution of ⟨M⟩ is ⟨M⟩$/, (x) => `ចម្លើយនៃសមីការ ${x[0]} គឺ ${x[1]}`],
    [/^The solution of ⟨M⟩ is$/, (x) => `ចម្លើយនៃសមីការ ${x[0]} គឺ`],
    [/^Let ⟨M⟩, ⟨M⟩, ⟨M⟩\. Then$/, (x) => `គេឲ្យ ${x[0]}, ${x[1]}, ${x[2]}។ គេបាន`],
    // ---- trigonometry
    [/^The smallest positive period of ⟨M⟩ is$/, (x) => `ខួបវិជ្ជមានតូចបំផុតនៃ ${x[0]} គឺ`],
    [/^The (maximum|minimum) value of ⟨M⟩ is$/, (x, g) => `តម្លៃ${g[0] === 'maximum' ? 'អតិបរមា' : 'អប្បបរមា'}នៃ ${x[0]} គឺ`],
    [/^Shifting the graph of ⟨M⟩ to the (left|right) by ⟨M⟩ units gives the graph of$/, (x, g) => `ការរំកិលក្រាបនៃ ${x[0]} ទៅខាង${g[0] === 'left' ? 'ឆ្វេង' : 'ស្តាំ'} ${x[1]} ឯកតា ផ្តល់ក្រាបនៃ`],
    [/^In ⟨M⟩, ⟨M⟩, ⟨M⟩ and ⟨M⟩\. Then ⟨M⟩$/, (x) => `ក្នុង ${x[0]} គេមាន ${x[1]}, ${x[2]} និង ${x[3]}។ គេបាន ${x[4]}`],
    [/^In ⟨M⟩, ⟨M⟩, ⟨M⟩ and ⟨M⟩\. The area of ⟨M⟩ is$/, (x) => `ក្នុង ${x[0]} គេមាន ${x[1]}, ${x[2]} និង ${x[3]}។ ក្រឡាផ្ទៃនៃ ${x[4]} គឺ`],
    // ---- sequences
    [/^In the arithmetic sequence ⟨M⟩, ⟨M⟩ and the common difference is ⟨M⟩\. Then ⟨M⟩$/, (x) => `ក្នុងស្វ៊ីតនព្វន្ត ${x[0]} គេមាន ${x[1]} និងផលសងរួម ${x[2]}។ គេបាន ${x[3]}`],
    [/^In the arithmetic sequence ⟨M⟩, ⟨M⟩ and ⟨M⟩\. Then ⟨M⟩$/, (x) => `ក្នុងស្វ៊ីតនព្វន្ត ${x[0]} គេមាន ${x[1]} និង ${x[2]}។ គេបាន ${x[3]}`],
    [/^In the arithmetic sequence ⟨M⟩, ⟨M⟩\. Then ⟨M⟩$/, (x) => `ក្នុងស្វ៊ីតនព្វន្ត ${x[0]} គេមាន ${x[1]}។ គេបាន ${x[2]}`],
    [/^For the arithmetic sequence with ⟨M⟩ and ⟨M⟩, the sum of the first ⟨M⟩ terms is ⟨M⟩$/, (x) => `ចំពោះស្វ៊ីតនព្វន្តដែល ${x[0]} និង ${x[1]} ផលបូក ${x[2]} តួដំបូងគឺ ${x[3]}`],
    [/^In the geometric sequence ⟨M⟩, ⟨M⟩ and the common ratio is ⟨M⟩\. Then ⟨M⟩$/, (x) => `ក្នុងស្វ៊ីតធរណីមាត្រ ${x[0]} គេមាន ${x[1]} និងផលធៀបរួម ${x[2]}។ គេបាន ${x[3]}`],
    [/^In the geometric sequence ⟨M⟩, ⟨M⟩ and ⟨M⟩\. Then the common ratio ⟨M⟩$/, (x) => `ក្នុងស្វ៊ីតធរណីមាត្រ ${x[0]} គេមាន ${x[1]} និង ${x[2]}។ ផលធៀបរួម ${x[3]}`],
    [/^For the geometric sequence with ⟨M⟩ and ⟨M⟩, the sum of the first ⟨M⟩ terms is$/, (x) => `ចំពោះស្វ៊ីតធរណីមាត្រដែល ${x[0]} និង ${x[1]} ផលបូក ${x[2]} តួដំបូងគឺ`],
    [/^In a geometric sequence with positive terms, ⟨M⟩\. Then ⟨M⟩$/, (x) => `ក្នុងស្វ៊ីតធរណីមាត្រដែលមានតួសុទ្ធតែវិជ្ជមាន គេមាន ${x[0]}។ គេបាន ${x[1]}`],
    [/^The sum of the first ⟨M⟩ terms of ⟨M⟩ is ⟨M⟩\. Then ⟨M⟩$/, (x) => `ផលបូក ${x[0]} តួដំបូងនៃ ${x[1]} គឺ ${x[2]}។ គេបាន ${x[3]}`],
    [/^In the sequence ⟨M⟩, ⟨M⟩ and ⟨M⟩\. Then ⟨M⟩$/, (x) => `ក្នុងស្វ៊ីត ${x[0]} គេមាន ${x[1]} និង ${x[2]}។ គេបាន ${x[3]}`],
    [/^For ⟨M⟩, let ⟨M⟩ be the sum of the first ⟨M⟩ terms\. Then ⟨M⟩$/, (x) => `ចំពោះ ${x[0]} តាង ${x[1]} ជាផលបូក ${x[2]} តួដំបូង។ គេបាន ${x[3]}`],
    // ---- derivatives
    [/^The equation of the tangent line to ⟨M⟩ at the point ⟨M⟩ is$/, (x) => `សមីការបន្ទាត់ប៉ះនឹង ${x[0]} ត្រង់ចំណុច ${x[1]} គឺ`],
    [/^The (local maximum|local minimum) value of ⟨M⟩ is$/, (x, g) => `តម្លៃ${g[0] === 'local maximum' ? 'អតិបរមាធៀប' : 'អប្បបរមាធៀប'}នៃ ${x[0]} គឺ`],
    [/^The point of (local maximum|local minimum) of ⟨M⟩ is$/, (x, g) => `ចំណុច (តម្លៃ x) ដែល ${x[0]} មាន${g[0] === 'local maximum' ? 'អតិបរមាធៀប' : 'អប្បបរមាធៀប'} គឺ`],
    [/^The area of the region enclosed by ⟨M⟩ and ⟨M⟩ is$/, (x) => `ក្រឡាផ្ទៃនៃតំបន់ដែលខណ្ឌដោយ ${x[0]} និង ${x[1]} គឺ`],
    [/^The slope of the tangent line to ⟨M⟩ at ⟨M⟩ is ⟨M⟩\. Then ⟨M⟩$/, (x) => `មេគុណប្រាប់ទិសនៃបន្ទាត់ប៉ះនឹង ${x[0]} ត្រង់ ${x[1]} គឺ ${x[2]}។ គេបាន ${x[3]}`],
    [/^The tangent line to ⟨M⟩ at ⟨M⟩ is parallel to the line ⟨M⟩\. Then ⟨M⟩$/, (x) => `បន្ទាត់ប៉ះនឹង ${x[0]} ត្រង់ ${x[1]} ស្របនឹងបន្ទាត់ ${x[2]}។ គេបាន ${x[3]}`],
    // ---- lines and circles
    [/^The angle of inclination of the line ⟨M⟩ is$/, (x) => `មុំទេរនៃបន្ទាត់ ${x[0]} គឺ`],
    [/^The line through ⟨M⟩ that is (parallel|perpendicular) to ⟨M⟩ is$/, (x, g) => `បន្ទាត់ដែលកាត់តាម ${x[0]} ហើយ${g[0] === 'parallel' ? 'ស្រប' : 'កែង'}នឹង ${x[1]} គឺ`],
    [/^The distance from the point ⟨M⟩ to the line ⟨M⟩ is$/, (x) => `ចម្ងាយពីចំណុច ${x[0]} ទៅបន្ទាត់ ${x[1]} គឺ`],
    [/^The distance between the parallel lines ⟨M⟩ and ⟨M⟩ is$/, (x) => `ចម្ងាយរវាងបន្ទាត់ស្របពីរ ${x[0]} និង ${x[1]} គឺ`],
    [/^The centre and radius of the circle ⟨M⟩ are$/, (x) => `ផ្ចិត និងកាំនៃរង្វង់ ${x[0]} គឺ`],
    [/^The positional relationship between the line ⟨M⟩ and the circle ⟨M⟩ is$/, (x) => `ទីតាំងធៀបរវាងបន្ទាត់ ${x[0]} និងរង្វង់ ${x[1]} គឺ`],
    [/^The line ⟨M⟩ cuts the circle ⟨M⟩\. The length of the chord is$/, (x) => `បន្ទាត់ ${x[0]} កាត់រង្វង់ ${x[1]}។ ប្រវែងខ្សែធ្នូគឺ`],
    // ---- conics
    [/^The eccentricity of the (ellipse|hyperbola) ⟨M⟩ is$/, (x, g) => `ចំណាកផ្ចិតនៃ${g[0] === 'ellipse' ? 'អេលីប' : 'អ៊ីពែបូល'} ${x[0]} គឺ`],
    [/^The coordinates of the foci of the ellipse ⟨M⟩ are$/, (x) => `កូអរដោនេនៃកំណុំរបស់អេលីប ${x[0]} គឺ`],
    [/^The length of the major axis of the ellipse ⟨M⟩ is$/, (x) => `ប្រវែងអ័ក្សធំនៃអេលីប ${x[0]} គឺ`],
    [/^The asymptotes of the hyperbola ⟨M⟩ are$/, (x) => `អាស៊ីមតូតនៃអ៊ីពែបូល ${x[0]} គឺ`],
    [/^The focus of the parabola ⟨M⟩ is$/, (x) => `កំណុំនៃប៉ារ៉ាបូល ${x[0]} គឺ`],
    [/^The directrix of the parabola ⟨M⟩ is the line$/, (x) => `បន្ទាត់ប្រាប់ទិសនៃប៉ារ៉ាបូល ${x[0]} គឺបន្ទាត់`],
    [/^Point ⟨M⟩ lies on the parabola ⟨M⟩ and its (x|y)-coordinate is ⟨M⟩\. The distance from ⟨M⟩ to the focus is$/, (x, g) => `ចំណុច ${x[0]} ស្ថិតនៅលើប៉ារ៉ាបូល ${x[1]} ហើយ${g[0] === 'x' ? 'អាប់ស៊ីស (x)' : 'អរដោនេ (y)'}របស់វាគឺ ${x[2]}។ ចម្ងាយពី ${x[3]} ទៅកំណុំគឺ`],
    [/^⟨M⟩ is a point on the ellipse ⟨M⟩, and ⟨M⟩ are its foci\. The perimeter of ⟨M⟩ is$/, (x) => `${x[0]} ជាចំណុចមួយនៅលើអេលីប ${x[1]} ហើយ ${x[2]} ជាកំណុំរបស់វា។ បរិមាត្រនៃ ${x[3]} គឺ`],
    [/^⟨M⟩ are the foci of the ellipse ⟨M⟩\. A line through ⟨M⟩ meets the ellipse at ⟨M⟩ and ⟨M⟩\. The perimeter of ⟨M⟩ is$/, (x) => `${x[0]} ជាកំណុំនៃអេលីប ${x[1]}។ បន្ទាត់មួយកាត់តាម ${x[2]} កាត់អេលីបត្រង់ ${x[3]} និង ${x[4]}។ បរិមាត្រនៃ ${x[5]} គឺ`],
    [/^An ellipse has foci ⟨M⟩ and major axis of length ⟨M⟩\. Its standard equation is$/, (x) => `អេលីបមួយមានកំណុំ ${x[0]} និងអ័ក្សធំប្រវែង ${x[1]}។ សមីការស្តង់ដាររបស់វាគឺ`],
    // ---- vectors
    [/^Given ⟨M⟩, ⟨M⟩ and the angle between them is ⟨M⟩, then ⟨M⟩$/, (x) => `គេឲ្យ ${x[0]}, ${x[1]} ហើយមុំរវាងវ៉ិចទ័រទាំងពីរគឺ ${x[2]}។ គេបាន ${x[3]}`],
    [/^Given ⟨M⟩, ⟨M⟩ and ⟨M⟩, the angle between ⟨M⟩ and ⟨M⟩ is$/, (x) => `គេឲ្យ ${x[0]}, ${x[1]} និង ${x[2]}។ មុំរវាង ${x[3]} និង ${x[4]} គឺ`],
    [/^Given ⟨M⟩ and ⟨M⟩\. If ⟨M⟩, then ⟨M⟩$/, (x) => `គេឲ្យ ${x[0]} និង ${x[1]}។ បើ ${x[2]} នោះ ${x[3]}`],
    [/^Given ⟨M⟩ and ⟨M⟩ with ⟨M⟩, then ⟨M⟩$/, (x) => `គេឲ្យ ${x[0]} និង ${x[1]} ដែល ${x[2]}។ គេបាន ${x[3]}`],
    [/^Given ⟨M⟩ and ⟨M⟩, then ⟨M⟩$/, (x) => `គេឲ្យ ${x[0]} និង ${x[1]}។ គេបាន ${x[2]}`],
    [/^Given ⟨M⟩ and ⟨M⟩, ⟨M⟩$/, (x) => `គេឲ្យ ${x[0]} និង ${x[1]}។ គណនា ${x[2]}`],
    [/^Given ⟨M⟩, then ⟨M⟩$/, (x) => `គេឲ្យ ${x[0]}។ គេបាន ${x[1]}`],
    // ---- complex numbers
    [/^If the complex number ⟨M⟩ satisfies ⟨M⟩, then ⟨M⟩$/, (x) => `បើចំនួនកុំផ្លិច ${x[0]} ផ្ទៀងផ្ទាត់ ${x[1]} នោះ ${x[2]}`],
    [/^If ⟨M⟩ is a (purely imaginary|real) number, then the real number ⟨M⟩$/, (x, g) => `បើ ${x[0]} ជា${g[0] === 'real' ? 'ចំនួនពិត' : 'ចំនួននិម្មិតសុទ្ធ'} នោះចំនួនពិត ${x[1]}`],
    [/^In the complex plane, the point corresponding to ⟨M⟩ lies in the$/, (x) => `ក្នុងប្លង់កុំផ្លិច ចំណុចដែលតាងឲ្យ ${x[0]} ស្ថិតនៅក្នុង`],
    [/^In the set of complex numbers, the roots of ⟨M⟩ are$/, (x) => `ក្នុងសំណុំចំនួនកុំផ្លិច ឫសនៃ ${x[0]} គឺ`],
    [/^The equation ⟨M⟩ with real coefficients ⟨M⟩ has a root ⟨M⟩\. Then ⟨M⟩$/, (x) => `សមីការ ${x[0]} ដែលមានមេគុណពិត ${x[1]} មានឫសមួយគឺ ${x[2]}។ គេបាន ${x[3]}`],
    [/^⟨M⟩ is a root of ⟨M⟩\. Then ⟨M⟩$/, (x) => `${x[0]} ជាឫសមួយនៃ ${x[1]}។ គេបាន ${x[2]}`],
    // ---- solid geometry
    [/^The volume of a sphere with radius ⟨M⟩ is$/, (x) => `មាឌនៃស្វ៊ែដែលមានកាំ ${x[0]} គឺ`],
    [/^The surface area of a sphere with radius ⟨M⟩ is$/, (x) => `ក្រឡាផ្ទៃនៃស្វ៊ែដែលមានកាំ ${x[0]} គឺ`],
    [/^A cylinder has base radius ⟨M⟩ and height ⟨M⟩\. Its (volume|total surface area) is$/, (x, g) => `ស៊ីឡាំងមួយមានកាំបាត ${x[0]} និងកម្ពស់ ${x[1]}។ ${g[0] === 'volume' ? 'មាឌ' : 'ក្រឡាផ្ទៃសរុប'}របស់វាគឺ`],
    [/^A cone has base radius ⟨M⟩ and (height|slant height) ⟨M⟩\. Its (volume|lateral surface area) is$/, (x, g) => `កោណមួយមានកាំបាត ${x[0]} និង${g[0] === 'height' ? 'កម្ពស់' : 'ចំណោតខ្សែ'} ${x[1]}។ ${g[1] === 'volume' ? 'មាឌ' : 'ក្រឡាផ្ទៃចំហៀង'}របស់វាគឺ`],
    [/^A regular square pyramid has base edge ⟨M⟩ and height ⟨M⟩\. Its volume is$/, (x) => `ពីរ៉ាមីតនិយ័តបាតការេមួយមានជ្រុងបាត ${x[0]} និងកម្ពស់ ${x[1]}។ មាឌរបស់វាគឺ`],
    [/^A rectangular box has edges ⟨M⟩, ⟨M⟩ and ⟨M⟩\. Its surface area is$/, (x) => `ប្រអប់ចតុកោណកែងមួយមានជ្រុង ${x[0]}, ${x[1]} និង ${x[2]}។ ក្រឡាផ្ទៃរបស់វាគឺ`],
    [/^All vertices of a cube with edge ⟨M⟩ lie on a sphere\. The (radius|surface area) of the sphere is$/, (x, g) => `កំពូលទាំងអស់នៃគូបដែលមានជ្រុង ${x[0]} ស្ថិតនៅលើស្វ៊ែមួយ។ ${g[0] === 'radius' ? 'កាំ' : 'ក្រឡាផ្ទៃ'}នៃស្វ៊ែគឺ`],
    [/^All vertices of a rectangular box with edges ⟨M⟩, ⟨M⟩, ⟨M⟩ lie on a sphere\. The surface area of the sphere is$/, (x) => `កំពូលទាំងអស់នៃប្រអប់ចតុកោណកែងដែលមានជ្រុង ${x[0]}, ${x[1]}, ${x[2]} ស្ថិតនៅលើស្វ៊ែមួយ។ ក្រឡាផ្ទៃនៃស្វ៊ែគឺ`],
    [/^In space, ⟨M⟩ and ⟨M⟩\. The midpoint of ⟨M⟩ is$/, (x) => `ក្នុងលំហ គេឲ្យ ${x[0]} និង ${x[1]}។ ចំណុចកណ្តាលនៃ ${x[2]} គឺ`],
    [/^In space, ⟨M⟩ and ⟨M⟩\. Then ⟨M⟩$/, (x) => `ក្នុងលំហ គេឲ្យ ${x[0]} និង ${x[1]}។ គេបាន ${x[2]}`],
    [/^In the cube ⟨M⟩, the angle between the lines ⟨M⟩ and ⟨M⟩ is$/, (x) => `ក្នុងគូប ${x[0]} មុំរវាងបន្ទាត់ ${x[1]} និង ${x[2]} គឺ`],
    // ---- probability
    [/^⟨M⟩ people, including A and B, stand in a row in random order\. The probability that (.+) is$/, (x, g) => `មនុស្ស ${x[0]} នាក់ ក្នុងនោះមាន A និង B ឈរតម្រៀបជាជួរដោយចៃដន្យ។ ប្រូបាបដែល${P(g[0])} គឺ`],
    [/^A bag contains ⟨M⟩ red balls and ⟨M⟩ white balls of the same size\. Two balls are drawn at random at the same time\. The probability that (.+) is$/, (x, g) => `ថង់មួយមានបាល់ពណ៌ក្រហម ${x[0]} និងបាល់ពណ៌ស ${x[1]} ដែលមានទំហំដូចគ្នា។ គេចាប់បាល់ពីរព្រមគ្នាដោយចៃដន្យ។ ប្រូបាបដែល${P(g[0])} គឺ`],
    [/^A fair coin is tossed ⟨M⟩ times\. The probability that exactly ⟨M⟩ heads? appears? is$/, (x) => `គេបោះកាក់ស្មើភាពមួយ ${x[0]} ដង។ ប្រូបាបដែលចេញមុខក្បាល (head) ចំនួន ${x[1]} ដងគត់ គឺ`],
    [/^A fair coin is tossed ⟨M⟩ times\. The probability that (.+) is$/, (x, g) => `គេបោះកាក់ស្មើភាពមួយ ${x[0]} ដង។ ប្រូបាបដែល${P(g[0])} គឺ`],
    [/^From ⟨M⟩ boys and ⟨M⟩ girls, ⟨M⟩ students are chosen at random\. The probability that (.+) is$/, (x, g) => `ពីសិស្សប្រុស ${x[0]} នាក់ និងសិស្សស្រី ${x[1]} នាក់ គេជ្រើសសិស្ស ${x[2]} នាក់ដោយចៃដន្យ។ ប្រូបាបដែល${P(g[0])} គឺ`],
    [/^Two fair dice are rolled\. The probability that the sum of the two numbers is a multiple of ⟨M⟩ is$/, (x) => `គេបោះគ្រាប់ឡុកឡាក់ស្មើភាពពីរគ្រាប់។ ប្រូបាបដែលផលបូកនៃលេខទាំងពីរជាពហុគុណនៃ ${x[0]} គឺ`],
    [/^Two fair dice are rolled\. The probability that the sum of the two numbers is at most ⟨M⟩ is$/, (x) => `គេបោះគ្រាប់ឡុកឡាក់ស្មើភាពពីរគ្រាប់។ ប្រូបាបដែលផលបូកនៃលេខទាំងពីរមិនលើស ${x[0]} គឺ`],
    [/^Two fair dice are rolled\. The probability that the sum of the two numbers is ⟨M⟩ is$/, (x) => `គេបោះគ្រាប់ឡុកឡាក់ស្មើភាពពីរគ្រាប់។ ប្រូបាបដែលផលបូកនៃលេខទាំងពីរស្មើ ${x[0]} គឺ`],
    [/^Two fair dice are rolled\. The probability that the two numbers differ by ⟨M⟩ is$/, (x) => `គេបោះគ្រាប់ឡុកឡាក់ស្មើភាពពីរគ្រាប់។ ប្រូបាបដែលផលសងនៃលេខទាំងពីរស្មើ ${x[0]} គឺ`],
    [/^Two fair dice are rolled\. The probability that (.+) is$/, (x, g) => `គេបោះគ្រាប់ឡុកឡាក់ស្មើភាពពីរគ្រាប់។ ប្រូបាបដែល${P(g[0])} គឺ`],
    [/^Two shooters A and B fire at a target independently\. The probabilities that A and B hit are ⟨M⟩ and ⟨M⟩ respectively\. The probability that (.+) is$/, (x, g) => `អ្នកបាញ់ពីរនាក់ A និង B បាញ់ទៅគោលដៅមួយដោយឯករាជ្យពីគ្នា។ ប្រូបាបដែល A និង B បាញ់ត្រូវគឺ ${x[0]} និង ${x[1]} រៀងគ្នា។ ប្រូបាបដែល${P(g[0])} គឺ`],
    [/^Two different numbers are chosen at random from ⟨M⟩\. The probability that the sum is greater than ⟨M⟩ is$/, (x) => `គេជ្រើសលេខពីរខុសគ្នាដោយចៃដន្យពី ${x[0]}។ ប្រូបាបដែលផលបូកធំជាង ${x[1]} គឺ`],
    [/^Two different numbers are chosen at random from ⟨M⟩\. The probability that (.+) is$/, (x, g) => `គេជ្រើសលេខពីរខុសគ្នាដោយចៃដន្យពី ${x[0]}។ ប្រូបាបដែល${P(g[0])} គឺ`],
    // ---- statistics
    [/^The scores of (\d+) students are: ⟨M⟩\. The (median|mean|mode|range) of the data is$/, (x, g) => `ពិន្ទុរបស់សិស្ស ${g[0]} នាក់គឺ៖ ${x[0]}។ ${P(g[1])}នៃទិន្នន័យនេះគឺ`],
    [/^The (variance|standard deviation) of the data ⟨M⟩ is$/, (x, g) => `${g[0] === 'variance' ? 'វ៉ារ្យង់' : 'គម្លាតគំរូ'}នៃទិន្នន័យ ${x[0]} គឺ`],
    [/^The data ⟨M⟩ have mean ⟨M⟩ and variance ⟨M⟩\. The mean and variance of ⟨M⟩ are respectively$/, (x) => `ទិន្នន័យ ${x[0]} មានមធ្យមភាគ ${x[1]} និងវ៉ារ្យង់ ${x[2]}។ មធ្យមភាគ និងវ៉ារ្យង់នៃ ${x[3]} គឺរៀងគ្នា`],
    [/^For the data ⟨M⟩, the ⟨M⟩th percentile is$/, (x) => `ចំពោះទិន្នន័យ ${x[0]} ភាគរយទី ${x[1]} (percentile) គឺ`],
    [/^Class A has ⟨M⟩ students with mean score ⟨M⟩; class B has ⟨M⟩ students with mean score ⟨M⟩\. The mean score of all ⟨M⟩ students is$/, (x) => `ថ្នាក់ A មានសិស្ស ${x[0]} នាក់ ពិន្ទុមធ្យម ${x[1]}។ ថ្នាក់ B មានសិស្ស ${x[2]} នាក់ ពិន្ទុមធ្យម ${x[3]}។ ពិន្ទុមធ្យមនៃសិស្សទាំង ${x[4]} នាក់គឺ`],
    // ---- normal distribution
    [/^The random variable ⟨M⟩ and ⟨M⟩\. Then ⟨M⟩$/, (x) => `អថេរចៃដន្យ ${x[0]} ហើយ ${x[1]}។ គេបាន ${x[2]}`],
    [/^The scores of ⟨M⟩ students follow ⟨M⟩\. Approximately how many students satisfy ⟨M⟩\? \(Reference: ⟨M⟩, ⟨M⟩\.\)$/, (x) => `ពិន្ទុរបស់សិស្ស ${x[0]} នាក់ គោរពតាមច្បាប់ ${x[1]}។ តើមានសិស្សប្រហែលប៉ុន្មាននាក់ដែល ${x[2]}? (ព័ត៌មានជំនួយ៖ ${x[3]}, ${x[4]}។)`],
    [/^⟨M⟩\. Then ⟨M⟩ \(Reference: ⟨M⟩, ⟨M⟩\.\)$/, (x) => `${x[0]}។ គេបាន ${x[1]} (ព័ត៌មានជំនួយ៖ ${x[2]}, ${x[3]}។)`],
    [/^⟨M⟩ and ⟨M⟩\. Then ⟨M⟩$/, (x) => `${x[0]} ហើយ ${x[1]}។ គេបាន ${x[2]}`],
    // ---- real-paper style questions
    [/^Which of the following represents the set of all real numbers ⟨M⟩ such that ⟨M⟩\?$/, (x) => `តើកន្សោមខាងក្រោមមួយណាតាងសំណុំនៃចំនួនពិត ${x[0]} ទាំងអស់ដែល ${x[1]}?`],
    [/^Let ⟨M⟩ and ⟨M⟩\. Then the relationship between ⟨M⟩ and ⟨M⟩ is$/, (x) => `គេឲ្យ ${x[0]} និង ${x[1]}។ ទំនាក់ទំនងរវាង ${x[2]} និង ${x[3]} គឺ`],
    [/^Which of the following is a (necessary|sufficient) condition for ⟨M⟩\?$/, (x, g) => `តើលក្ខខណ្ឌខាងក្រោមមួយណាជាលក្ខខណ្ឌ${g[0] === 'necessary' ? 'ចាំបាច់' : 'គ្រប់គ្រាន់'}សម្រាប់ ${x[0]}?`],
    [/^If the inequality ⟨M⟩ has the solution set ⟨M⟩, then ⟨M⟩$/, (x) => `បើវិសមភាព ${x[0]} មានសំណុំចម្លើយ ${x[1]} នោះ ${x[2]}`],
    [/^If ⟨M⟩ has a minimum value of ⟨M⟩ at ⟨M⟩, then ⟨M⟩$/, (x) => `បើ ${x[0]} មានតម្លៃអប្បបរមា ${x[1]} ត្រង់ ${x[2]} នោះ ${x[3]}`],
    [/^The function ⟨M⟩ is$/, (x) => `អនុគមន៍ ${x[0]} គឺ`],
    [/^Let ⟨M⟩\. If ⟨M⟩, then ⟨M⟩$/, (x) => `គេឲ្យ ${x[0]}។ បើ ${x[1]} នោះ ${x[2]}`],
    [/^Which of the following functions is a power function\?$/, () => 'តើអនុគមន៍ខាងក្រោមមួយណាជាអនុគមន៍ស្វ័យគុណ?'],
    [/^The derivative of the function ⟨M⟩ is$/, (x) => `ដេរីវេនៃអនុគមន៍ ${x[0]} គឺ`],
    [/^The geometric meaning of the derivative ⟨M⟩ of the function ⟨M⟩ at ⟨M⟩ is$/, (x) => `អត្ថន័យធរណីមាត្រនៃដេរីវេ ${x[0]} របស់អនុគមន៍ ${x[1]} ត្រង់ ${x[2]} គឺ`],
    [/^If ⟨M⟩ for all ⟨M⟩ in ⟨M⟩, then on ⟨M⟩ the function ⟨M⟩ is$/, (x) => `បើ ${x[0]} ចំពោះគ្រប់ ${x[1]} ក្នុង ${x[2]} នោះលើ ${x[3]} អនុគមន៍ ${x[4]} ជាអនុគមន៍`],
    [/^For the function ⟨M⟩, which of the following statements is correct\?$/, (x) => `ចំពោះអនុគមន៍ ${x[0]} តើសំណើខាងក្រោមមួយណាត្រឹមត្រូវ?`],
    [/^The equation of the line passing through the point ⟨M⟩ with slope ⟨M⟩ is$/, (x) => `សមីការបន្ទាត់ដែលកាត់តាមចំណុច ${x[0]} និងមានមេគុណប្រាប់ទិស ${x[1]} គឺ`],
    [/^The equation of the ellipse with vertices at ⟨M⟩ and minor axis length ⟨M⟩ is$/, (x) => `សមីការអេលីបដែលមានកំពូល ${x[0]} និងអ័ក្សតូចប្រវែង ${x[1]} គឺ`],
    [/^The equation of the parabola with focus at ⟨M⟩ and directrix ⟨M⟩ is$/, (x) => `សមីការប៉ារ៉ាបូលដែលមានកំណុំ ${x[0]} និងបន្ទាត់ប្រាប់ទិស ${x[1]} គឺ`],
    [/^The equation of the hyperbola with vertices at ⟨M⟩ and eccentricity ⟨M⟩ is$/, (x) => `សមីការអ៊ីពែបូលដែលមានកំពូល ${x[0]} និងចំណាកផ្ចិត ${x[1]} គឺ`],
    [/^Let the complex number ⟨M⟩\. Then ⟨M⟩$/, (x) => `គេឲ្យចំនួនកុំផ្លិច ${x[0]}។ គេបាន ${x[1]}`],
    [/^If the line ⟨M⟩ is (parallel|perpendicular) to the line ⟨M⟩, then ⟨M⟩$/, (x, g) => `បើបន្ទាត់ ${x[0]} ${g[0] === 'parallel' ? 'ស្រប' : 'កែង'}នឹងបន្ទាត់ ${x[1]} នោះ ${x[2]}`],
    [/^A fair die is rolled once\. The probability of getting a number greater than ⟨M⟩ is$/, (x) => `គេបោះគ្រាប់ឡុកឡាក់ស្មើភាពមួយគ្រាប់ម្តង។ ប្រូបាបដែលចេញលេខធំជាង ${x[0]} គឺ`],
    [/^A fair die is rolled once\. The probability of getting (an even number|an odd number|a multiple of 3|a prime number) is$/, (x, g) => `គេបោះគ្រាប់ឡុកឡាក់ស្មើភាពមួយគ្រាប់ម្តង។ ប្រូបាបដែលចេញ${{ 'an even number': 'ចំនួនគូ', 'an odd number': 'ចំនួនសេស', 'a multiple of 3': 'ពហុគុណនៃ 3', 'a prime number': 'ចំនួនបឋម' }[g[0]]} គឺ`],
    [/^A bag contains ⟨M⟩ red balls and ⟨M⟩ white balls\. One ball is drawn at random\. The probability that it is (red|white) is$/, (x, g) => `ថង់មួយមានបាល់ពណ៌ក្រហម ${x[0]} និងបាល់ពណ៌ស ${x[1]}។ គេចាប់បាល់មួយដោយចៃដន្យ។ ប្រូបាបដែលបានបាល់ពណ៌${g[0] === 'red' ? 'ក្រហម' : 'ស'} គឺ`],
    [/^A group has ⟨M⟩ boys and ⟨M⟩ girls\. One person is selected at random\. The probability that the person is a (girl|boy) is$/, (x, g) => `ក្រុមមួយមានសិស្សប្រុស ${x[0]} នាក់ និងសិស្សស្រី ${x[1]} នាក់។ គេជ្រើសសិស្សម្នាក់ដោយចៃដន្យ។ ប្រូបាបដែលសិស្សនោះជាសិស្ស${g[0] === 'girl' ? 'ស្រី' : 'ប្រុស'} គឺ`],
    [/^Events ⟨M⟩ and ⟨M⟩ are mutually exclusive, ⟨M⟩ and ⟨M⟩\. Then ⟨M⟩$/, (x) => `ព្រឹត្តិការណ៍ ${x[0]} និង ${x[1]} មិនចុះសម្រុងគ្នា (មិនអាចកើតឡើងព្រមគ្នា) ដែល ${x[2]} និង ${x[3]}។ គេបាន ${x[4]}`],
    [/^Events ⟨M⟩ and ⟨M⟩ are independent, ⟨M⟩ and ⟨M⟩\. Then ⟨M⟩$/, (x) => `ព្រឹត្តិការណ៍ ${x[0]} និង ${x[1]} ឯករាជ្យពីគ្នា ដែល ${x[2]} និង ${x[3]}។ គេបាន ${x[4]}`],
    [/^For the data set ⟨M⟩, the (mean|median|variance|standard deviation) is$/, (x, g) => `ចំពោះទិន្នន័យ ${x[0]} ${{ mean: 'មធ្យមភាគ', median: 'មេដ្យាន', variance: 'វ៉ារ្យង់', 'standard deviation': 'គម្លាតគំរូ' }[g[0]]}គឺ`],
    [/^Which of the following is a characteristic of the normal distribution curve\?$/, () => 'តើលក្ខណៈខាងក្រោមមួយណាជាលក្ខណៈនៃខ្សែកោងច្បាប់ណរម៉ាល់?'],
    [/^For the normal distribution ⟨M⟩, if ⟨M⟩ (increases|decreases) while ⟨M⟩ stays the same, the curve will$/, (x, g) => `ចំពោះច្បាប់ណរម៉ាល់ ${x[0]} បើ ${x[1]} ${g[0] === 'increases' ? 'កើនឡើង' : 'ថយចុះ'} ហើយ ${x[2]} នៅដដែល នោះខ្សែកោងនឹង`],
    // ---- generic shapes (keep last)
    [/^Let ⟨M⟩ and ⟨M⟩\. Then ⟨M⟩$/, (x) => `គេឲ្យ ${x[0]} និង ${x[1]}។ គេបាន ${x[2]}`],
    [/^Let ⟨M⟩\. Then ⟨M⟩$/, (x) => `គេឲ្យ ${x[0]}។ គេបាន ${x[1]}`],
    [/^If ⟨M⟩, then ⟨M⟩$/, (x) => `បើ ${x[0]} នោះ ${x[1]}`],
    [/^⟨M⟩$/, (x) => `គណនា៖ ${x[0]}`],
  ];

  /** Khmer translation of a question stem (math kept as \( … \)), or null if no rule matches. */
  function translate(stem) {
    const math = stem.match(MATH) || [];
    const shape = stem.replace(MATH, M);
    for (const [re, fn] of RULES) {
      const hit = re.exec(shape);
      if (!hit) continue;
      const groups = hit.slice(1).filter((g) => g !== M);
      return fn(math, groups);
    }
    return null;
  }
  function translateChoice(text) {
    return CHOICE[text] || null;
  }

  const API = { translate, translateChoice, CHOICE };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.CSCA_KM = API;
})(typeof window !== 'undefined' ? window : globalThis);
