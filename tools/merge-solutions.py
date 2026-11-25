"""Merge bilingual/Solutions-Sheet-01..20.pdf into All-Solutions-1-20.pdf with
one bookmark per exam sheet. Needs: pip install pypdf"""
import os
from pypdf import PdfReader, PdfWriter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "bilingual")

def merge(first, last, name):
    w = PdfWriter()
    for n in range(first, last + 1):
        start = len(w.pages)
        for page in PdfReader(os.path.join(OUT, f"Solutions-Sheet-{n:02d}.pdf")).pages:
            w.add_page(page)
        w.add_outline_item(f"Exam Sheet {n} - Solutions", start)
    w.compress_identical_objects()
    path = os.path.join(OUT, name)
    with open(path, "wb") as f:
        w.write(f)
    print("wrote", os.path.relpath(path, ROOT), len(w.pages), "pages", os.path.getsize(path) // 1024, "KB")

merge(1, 20, "All-Solutions-1-20.pdf")
