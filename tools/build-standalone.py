#!/usr/bin/env python3
"""Build CSCA-Math.html: one self-contained file (scripts, fonts and MathJax inlined)
that opens in Chrome by double-click and works offline.

    npm i mathjax@3          # provides node_modules/mathjax/es5/tex-svg.js
    python3 tools/build-standalone.py [path/to/tex-svg.js]
"""
import os, sys

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
mj_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(root, 'node_modules', 'mathjax', 'es5', 'tex-svg.js')

def read(p):
    with open(os.path.join(root, p), encoding='utf-8') as f:
        return f.read()

def script(code):
    return '<script>\n' + code.replace('</script', '<\\/script') + '\n</script>'

s = read('index.html')
s = s.replace('<link rel="stylesheet" href="css/fonts.css">', '<style>\n' + read('css/fonts.css') + '</style>')
for name in ('config', 'engine', 'lessons', 'app'):
    s = s.replace('<script src="js/%s.js"></script>' % name, script(read('js/%s.js' % name)))
cdn = '<script src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-svg.min.js" async></script>'
with open(mj_path, encoding='utf-8') as f:
    s = s.replace(cdn, script('/* MathJax 3.2.2 (Apache License 2.0), bundled for offline use */\n' + f.read()))
with open(os.path.join(root, 'CSCA-Math.html'), 'w', encoding='utf-8') as f:
    f.write(s)
print('wrote CSCA-Math.html')
