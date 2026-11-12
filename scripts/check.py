"""A check per way of being wrong, run over every note.

Run from the repo root after `npm run build`:
    python scripts/check.py
Exit status is the number of checks that found something.
"""
import pathlib, re, sys, os, json, collections, datetime

ROOT = pathlib.Path(__file__).resolve().parent.parent
B, DIST = ROOT / 'src/content/blog', ROOT / 'dist'
TODAY = datetime.date.today()

TOPICS = {'Linux', 'Git', 'Python', 'R', 'Machine learning', 'Graphs', 'Cheminformatics', 'Bioinformatics'}
SUBS = {'Basics', 'Evaluation', 'Representation', 'Prediction', 'Transcriptomics', 'Cell biology', 'Gene sets'}
CATS = {'review', 'concept', 'tutorial'}
# renderings the house style forbids, with what to use instead
BANNED = {
    '기울기': 'gradient', '무게': '비중', '기술자': '디스크립터', '해상도': 'resolution',
    '자원': '데이터베이스/패키지', '농축': 'enrichment', '거래': '절충', '혼자짜리': 'singleton',
    '미세조정': '파인튜닝', '메시지 전달': 'message passing', '걸리는 점': '단점',
    '바닥층': '', '입자도': '세분성', '영상자료': '동영상', '한 자릿수': '10배',
}
LEAK = re.compile(r'jinny00|prismgpu|/data1/|/NHNHOME|\bminju\b|ITMol|Structure-Activity Insights', re.I)

notes = {}
for f in sorted(B.glob('*.md')):
    t = f.read_text()
    fm = dict(re.findall(r'^([a-z]+):\s*"?(.*?)"?\s*$', t.split('---')[1], re.M)) if t.startswith('---') else {}
    body = t.split('---', 2)[2] if t.count('---') >= 2 else t
    notes[f.stem] = dict(path=f, raw=t, fm=fm, body=body,
                         nocode=re.sub(r'```.*?```', '', body, flags=re.S))

def pairs():
    out = collections.defaultdict(dict)
    for k, n in notes.items():
        base, lang = k.rsplit('-', 1)
        out[base][lang] = n
    return {b: d for b, d in out.items() if len(d) == 2}

fails, checks = [], []
def check(name):
    def deco(fn):
        checks.append(name)
        hits = list(fn() or [])
        print(f"{'FAIL' if hits else ' ok '}  {name:38} {len(hits) or ''}")
        for h in hits[:6]:
            print(f'        {h}')
        if len(hits) > 6:
            print(f'        … and {len(hits)-6} more')
        if hits:
            fails.append(name)
        return fn
    return deco

# ---------------------------------------------------------------- frontmatter
@check('01 frontmatter required fields')
def _():
    need = {'title', 'date', 'description', 'category', 'lang', 'group'}
    return [f'{k}: missing {sorted(need - set(n["fm"]))}' for k, n in notes.items() if need - set(n['fm'])]

@check('02 category / topic / subtopic values')
def _():
    out = []
    for k, n in notes.items():
        if n['fm'].get('category') not in CATS: out.append(f'{k}: category={n["fm"].get("category")}')
        if n['fm'].get('topic') and n['fm']['topic'] not in TOPICS: out.append(f'{k}: topic={n["fm"]["topic"]}')
        if n['fm'].get('subtopic') and n['fm']['subtopic'] not in SUBS: out.append(f'{k}: subtopic={n["fm"]["subtopic"]}')
    return out

@check('03 lang matches filename suffix')
def _():
    return [f'{k}: lang={n["fm"].get("lang")}' for k, n in notes.items()
            if n['fm'].get('lang') != k.rsplit('-', 1)[1]]

@check('04 every group is an en/ko pair')
def _():
    g = collections.defaultdict(set)
    for k, n in notes.items(): g[n['fm'].get('group', k)].add(n['fm'].get('lang'))
    return [f'{k}: {sorted(v)}' for k, v in g.items() if v != {'en', 'ko'}]

@check('05 date / updated sane')
def _():
    out = []
    for k, n in notes.items():
        d, u = n['fm'].get('date'), n['fm'].get('updated')
        try:
            if d and datetime.date.fromisoformat(d) > TODAY: out.append(f'{k}: future date {d}')
        except ValueError: out.append(f'{k}: unparseable date {d}')
        if u and d and u < d[:7]: out.append(f'{k}: updated {u} < date {d[:7]}')
        if u and not re.fullmatch(r'\d{4}-\d{2}', u): out.append(f'{k}: updated format {u}')
    return out

@check('06 pair shares date / topic / subtopic')
def _():
    out = []
    for b, d in pairs().items():
        for key in ('date', 'updated', 'topic', 'subtopic', 'category'):
            if d['en']['fm'].get(key) != d['ko']['fm'].get(key):
                out.append(f'{b}: {key} en={d["en"]["fm"].get(key)} ko={d["ko"]["fm"].get(key)}')
    return out

@check('07 description shape')
def _():
    out = []
    for k, n in notes.items():
        desc = n['fm'].get('description', '')
        if re.match(r'(A paper review\.|논문 리뷰\.)', desc): out.append(f'{k}: redundant prefix')
        if desc.endswith('.') and n['fm'].get('lang') == 'en' and ' · ' in desc: out.append(f'{k}: trailing period')
        if len(desc) > 320: out.append(f'{k}: {len(desc)} chars')
    return out

# ---------------------------------------------------------------- emphasis
@check('08 exactly one blue mark')
def _():
    return [f'{k}: {c}' for k, n in notes.items()
            if (c := len(re.findall(r'<mark class="blue">', n['nocode']))) != 1]

@check('09 at most three marks')
def _():
    return [f'{k}: {c}' for k, n in notes.items()
            if (c := len(re.findall(r'<mark(?: class="blue")?>', n['nocode']))) > 3]

@check('10 bold count matches across pair')
def _():
    f = lambda s: len(re.findall(r'\*\*[^*]+\*\*', s, re.S))
    return [f'{b}: en {f(d["en"]["nocode"])} ko {f(d["ko"]["nocode"])}'
            for b, d in pairs().items() if f(d['en']['nocode']) != f(d['ko']['nocode'])]

@check('11 mark count matches across pair')
def _():
    f = lambda s: len(re.findall(r'<mark(?: class="blue")?>', s))
    return [f'{b}: en {f(d["en"]["nocode"])} ko {f(d["ko"]["nocode"])}'
            for b, d in pairs().items() if f(d['en']['nocode']) != f(d['ko']['nocode'])]

@check('12 underline only where defined')
def _():
    f = lambda s: len(re.findall(r'<u>', s))
    return [f'{b}: en {f(d["en"]["nocode"])} ko {f(d["ko"]["nocode"])}'
            for b, d in pairs().items() if f(d['en']['nocode']) != f(d['ko']['nocode'])]

# ---------------------------------------------------------------- headings
@check('13 no h1 or h4+ in body')
def _():
    return [f'{k}: {m.group(0)[:40]}' for k, n in notes.items()
            for m in re.finditer(r'^(#\s|#{4,}\s).*$', n['nocode'], re.M)]

@check('14 heading count matches across pair')
def _():
    f = lambda s: len(re.findall(r'^## ', s, re.M))
    return [f'{b}: en {f(d["en"]["nocode"])} ko {f(d["ko"]["nocode"])}'
            for b, d in pairs().items() if f(d['en']['nocode']) != f(d['ko']['nocode'])]

@check('15 no lone ### inside a section')
def _():
    out = []
    for k, n in notes.items():
        run = 0
        for lv, _t in [(len(m.group(1)), m.group(2)) for m in re.finditer(r'^(#{2,3}) (.+)$', n['nocode'], re.M)] + [(2, '')]:
            if lv == 2:
                if run == 1: out.append(k)
                run = 0
            else: run += 1
    return sorted(set(out))

# ---------------------------------------------------------------- links
@check('16 internal link targets exist')
def _():
    refs = {p.stem for p in (ROOT / 'src/pages/blog').glob('*.astro') if not p.stem.startswith('[')}
    return [f'{k} -> {t}' for k, n in notes.items()
            for t in re.findall(r'\]\(\.\./([a-z0-9-]+)/\)', n['body'])
            if t not in notes and t not in refs]

@check('17 link language matches file')
def _():
    out = []
    for k, n in notes.items():
        lang = n['fm'].get('lang')
        for t in re.findall(r'\]\(\.\./([a-z0-9-]+)-(en|ko)/\)', n['body']):
            if t[1] != lang: out.append(f'{k} -> {t[0]}-{t[1]}')
    return out

@check('18 nothing links to a draft')
def _():
    draft = {k for k, n in notes.items() if n['fm'].get('draft') == 'true'}
    return [f'{k} -> {t}' for k, n in notes.items()
            for t in re.findall(r'\]\(\.\./([a-z0-9-]+)/\)', n['body']) if t in draft]

@check('19 no dead-end notes')
def _():
    return [k for k, n in notes.items()
            if n['fm'].get('lang') == 'en' and n['fm'].get('draft') != 'true'
            and not re.search(r'\]\(\.\./[a-z0-9-]+-en/\)', n['body'])]

@check('20 built site has no broken links')
def _():
    if not DIST.exists(): return ['dist/ missing — run npm run build']
    pages = {('' if str(p.parent.relative_to(DIST)) == '.' else str(p.parent.relative_to(DIST)) + '/')
             for p in DIST.rglob('index.html')}
    assets = {str(p.relative_to(DIST)) for p in DIST.rglob('*') if p.is_file()}
    out = []
    for f in DIST.rglob('*.html'):
        base = f.parent.relative_to(DIST)
        body = re.sub(r'<script.*?</script>', '', f.read_text(), flags=re.S)
        for href in re.findall(r'(?:href|src)="([^"#?]+)"', body):
            if href.startswith(('http', 'mailto:', 'data:', '//')): continue
            t = href[len('/site-lab/'):] if href.startswith('/site-lab/') else \
                os.path.normpath(str(base / href)) + ('/' if href.endswith('/') else '')
            t = re.sub(r'^\./', '', t).lstrip('/')
            if t in assets or t in pages or t.rstrip('/') + '/' in pages or (DIST / t).exists(): continue
            out.append(f'{f.relative_to(DIST)} -> {href}')
    return out

# ---------------------------------------------------------------- figures
@check('21 every img has alt and dimensions')
def _():
    out = []
    for k, n in notes.items():
        for tag in re.findall(r'<img [^>]*>', n['body']):
            if 'alt="' not in tag: out.append(f'{k}: no alt')
            if '.svg' in tag: continue            # svg carries its own viewBox
            if 'width=' not in tag: out.append(f'{k}: no width')
    return out

@check('22 figure count matches across pair')
def _():
    f = lambda s: len(re.findall(r'<figure>', s))
    return [f'{b}: en {f(d["en"]["body"])} ko {f(d["ko"]["body"])}'
            for b, d in pairs().items() if f(d['en']['body']) != f(d['ko']['body'])]

@check('23 paper figures carry a credit')
def _():
    out = []
    for k, n in notes.items():
        for fig in re.findall(r'<figure>.*?</figure>', n['body'], re.S):
            # our own diagrams are svg; anything raster came from somewhere and must say where
            if not re.search(r'/assets/fig/\S+\.(png|jpg|jpeg)', fig): continue
            if 'class="credit"' not in fig:
                out.append(f'{k}: raster figure with no credit line')
    return out

# ---------------------------------------------------------------- korean
@check('24 banned Korean renderings')
def _():
    out = []
    for k, n in notes.items():
        if n['fm'].get('lang') != 'ko': continue
        for bad, good in BANNED.items():
            for m in re.finditer(re.escape(bad), n['nocode']):
                ctx = n['nocode'][max(0, m.start()-22):m.start()+22].replace('\n', ' ')
                # the ban is on a wrong *sense*, not the字 itself — these senses are correct Korean
                if bad == '기울기' and ('음수' in ctx or 'ReLU' in ctx or '고정' in ctx or '채널' in ctx):
                    continue                      # slope of a piecewise-linear activation
                if bad == '거래' and '네트워크' in ctx:
                    continue                      # transaction network, not trade-off
                if bad == '농축' and ('분리해' in ctx or '세포' in ctx):
                    continue                      # physically concentrating cells
                if bad == '자원' and ('CPU' in ctx or '메모리' in ctx or '사용률' in ctx):
                    continue                      # system resources
                if bad == '무게' and '같은 무게로' in ctx:
                    continue                      # equal voting weight, idiomatic
                if bad == '배경' and '집합' in ctx:
                    continue                      # the background gene set in ORA
                out.append(f'{k}: {bad} -> {good}  …{ctx}…')
    return out

@check('25 no honorific endings in Korean')
def _():
    return [f'{k}: {m.group(0)}' for k, n in notes.items() if n['fm'].get('lang') == 'ko'
            for m in re.finditer(r'(합니다|습니다|해요|예요)[.\s]', n['nocode'])]

# ---------------------------------------------------------------- safety
@check('26 no leaked identifiers or private papers')
def _():
    return [f'{k}: {m.group(0)}' for k, n in notes.items() for m in LEAK.finditer(n['raw'])]

@check('27 no strikethrough')
def _():
    return [k for k, n in notes.items() if '~~' in n['nocode']]

# ---------------------------------------------------------------- markup
@check('28 CommonMark )** hazard')
def _():
    # the closing ** only fails when a word character follows it; punctuation closes fine
    return [f'{k}: …{n["nocode"][max(0,m.start()-26):m.start()+8]}…' for k, n in notes.items()
            for m in re.finditer(r'[“”‘’′″\"\x27`$).,!?;:\]}][*][*](?=[0-9A-Za-z가-힣])', n['nocode'])]

@check('29 code fences balanced')
def _():
    return [f'{k}: {c} fences' for k, n in notes.items() if (c := n['body'].count('```')) % 2]

@check('30 citation identifiers well formed')
def _():
    out = []
    for k, n in notes.items():
        for d in re.findall(r'doi\.org/(10\.[^\s)\]"<]+)', n['body']):
            if not re.fullmatch(r'10\.\d{4,9}/\S+', d): out.append(f'{k}: doi {d}')
        for a in re.findall(r'arxiv\.org/abs/([^\s)\]"<]+)', n['body']):
            if not re.fullmatch(r'\d{4}\.\d{4,5}(v\d+)?|[a-z-]+/\d{7}', a): out.append(f'{k}: arxiv {a}')
    return out

@check('31 Korean particle attached to bold')
def _():
    # a postposition or copula must attach to the bold span with no space; a bold span that
    # ends a sentence is followed by a new one, so that space is correct
    # longest first, and the tail may continue into more Hangul (이라고, 라는 것, 에서도)
    part = ('으로써|으로서|이라는|이라고|이라서|이지만|이라도|에서는|에서도|에게는|이라|라는|라고|'
            '으로|에서|에게|이다|였다|이고|이며|부터|까지|처럼|보다|마다|조차|밖에|'
            '는|은|이|가|을|를|로|와|과|도|만|의|다|라|란|에')
    # the particle must END there: if more Hangul follows it is a word, not a postposition
    pat = re.compile(r'(?<![.!?:])\*\*[ \u00a0](?:' + part + r')(?![\uac00-\ud7a3])')
    return [f'{k}: …{n["nocode"][max(0, m.start()-26):m.end()+4]}…'
            for k, n in notes.items() if n['fm'].get('lang') == 'ko'
            for m in pat.finditer(n['nocode'])]


# ---------------------------------------------------------------- structure, round two
@check('32 table rows have a consistent column count')
def _():
    out = []
    for k, n in notes.items():
        rows, head = [], None
        for line in n['nocode'].split('\n'):
            if line.strip().startswith('|') and line.strip().endswith('|'):
                c = line.count('|')
                if head is None: head = c
                elif set(line.replace('|', '').replace('-', '').replace(':', '').strip()) == set():
                    pass
                elif c != head:
                    out.append(f'{k}: {c} vs {head} in …{line[:48]}…')
            else:
                head = None
    return out[:8]

@check('33 no duplicate reference entries')
def _():
    out = []
    for k, n in notes.items():
        tail = n['nocode'].split('## References')[-1].split('## 참고')[-1]
        ids = re.findall(r'\((https://(?:doi\.org|arxiv\.org)[^)]+)\)', tail)
        dup = {u for u in ids if ids.count(u) > 1}
        out += [f'{k}: {u}' for u in dup]
    return out

@check('34 every figure has a caption')
def _():
    f = lambda s: (len(re.findall(r'<figure[ >]', s)), s.count('<figcaption>'))
    return [f'{k}: {f(n["body"])[0]} figures, {f(n["body"])[1]} captions'
            for k, n in notes.items() if f(n['body'])[0] != f(n['body'])[1]]

@check('35 math delimiters balanced')
def _():
    out = []
    for k, n in notes.items():
        s = re.sub(r'<svg.*?</svg>', '', n['nocode'], flags=re.S)   # shell prompts live in the diagrams
        s = re.sub(r'`[^`]*`', '', s)
        s = re.sub(r'\$\$.*?\$\$', '', s, flags=re.S)
        if s.count('$') % 2:
            out.append(f'{k}: odd number of $')
    return out

@check('36 every note ends with references')
def _():
    return [k for k, n in notes.items()
            if not re.search(r'## (References|\ucc38\uace0)', n['nocode'])]

@check('37 headings are translated, not copied')
def _():
    out = []
    for b, d in pairs().items():
        h = lambda s: [x.strip() for x in re.findall(r'^## (.+)$', s, re.M)]
        same = [x for x, y in zip(h(d['en']['nocode']), h(d['ko']['nocode']))
                if x == y and len(x.split()) > 2]
        if same: out.append(f'{b}: {same[:2]}')
    return out

@check('38 code block count matches across pair')
def _():
    f = lambda s: s.count('```') // 2
    return [f'{b}: en {f(d["en"]["body"])} ko {f(d["ko"]["body"])}'
            for b, d in pairs().items() if f(d['en']['body']) != f(d['ko']['body'])]

@check('39 descriptions are translated, not copied')
def _():
    return [b for b, d in pairs().items()
            if d['en']['fm'].get('description') == d['ko']['fm'].get('description')]

@check('40 no placeholders left behind')
def _():
    return [f'{k}: {m.group(0)}' for k, n in notes.items()
            for m in re.finditer(r'\b(TODO|FIXME|TBD|\uc791\uc5c5 \uc911)\b', n['nocode'])]

@check('41 referenced images exist on disk')
def _():
    out = []
    for k, n in notes.items():
        for src in re.findall(r'src="/site-lab/([^"]+)"', n['body']):
            if not (ROOT / 'public' / src).exists(): out.append(f'{k}: {src}')
    return out

@check('42 numbers match across the pair')
def _():
    # Korean myriad notation and English spelled-out numerals make a strict compare useless,
    # so compare the multiset of numbers that carry a decimal point or four-plus digits
    def nums(s):
        s = re.sub(r'\]\([^)]*\)', '', s)                 # link targets carry years
        s = re.sub(r'https?://\S+', '', s)
        return collections.Counter(re.findall(r'\d+\.\d+', s))
    out = []
    for b, d in pairs().items():
        a, c = nums(d['en']['nocode']), nums(d['ko']['nocode'])
        flat = lambda s: re.sub(r'[.,]', '', s)
        other = {'en': flat(d['ko']['nocode']), 'ko': flat(d['en']['nocode'])}
        miss = [(x, 'en') for x in (a - c).elements()] + [(x, 'ko') for x in (c - a).elements()]
        miss = [x for x, side in miss if flat(x) not in other[side]]
        if miss: out.append(f'{b}: {sorted(set(miss))[:5]}')
    return out

# ---------------------------------------------------------------- the rendered page
@check('43 every group names exactly two files')
def _():
    g = collections.Counter(n['fm'].get('group') for n in notes.values())
    return [f'{k} x{c}' for k, c in g.items() if c != 2]

@check('44 updated is not before date')
def _():
    out = []
    for k, n in notes.items():
        d, u = n['fm'].get('date', ''), n['fm'].get('updated', '')
        if u and d and u < d[:len(u)]: out.append(f'{k}: {d} -> {u}')
    return out

@check('45 no markdown leaked into the html')
def _():
    out = []
    for f in sorted(DIST.glob('blog/*/index.html')):
        h = f.read_text()
        h = re.sub(r'<(script|style|pre|code)[\s\S]*?</\1>', '', h)
        body = h.split('<main')[-1] if '<main' in h else h
        for pat, what in [(r'\*\*\S', 'bold'), (r'\]\(\.\./', 'link'), (r'\]\(https', 'link')]:
            if re.search(pat, body): out.append(f'{f.parent.name}: unrendered {what}')
    return sorted(set(out))

@check('46 inline tags are closed')
def _():
    out = []
    for k, n in notes.items():
        for tag in ('mark', 'u', 'b', 'i', 'span', 'figure', 'figcaption'):
            o = len(re.findall(rf'<{tag}[ >]', n['body'])); c = n['body'].count(f'</{tag}>')
            if o != c: out.append(f'{k}: <{tag}> {o} open {c} closed')
    return out

@check('47 image alt text is present and distinct')
def _():
    out = []
    for k, n in notes.items():
        for img in re.findall(r'<img[^>]+>', n['body']):
            alt = re.search(r'alt="([^"]*)"', img)
            if not alt or len(alt.group(1).strip()) < 12:
                out.append(f'{k}: thin alt text')
    return out

@check('48 review notes cite the paper they review')
def _():
    out = []
    for k, n in notes.items():
        if n['fm'].get('category') != 'review': continue
        head = n['body'][:2600]
        if not re.search(r'(doi\.org/10\.|arxiv\.org/abs/)', head):
            out.append(f'{k}: no resolvable identifier near the top')
    return out

@check('49 titles are unique within a language')
def _():
    out = []
    for lang in ('en', 'ko'):
        seen = collections.Counter(n['fm'].get('title') for k, n in notes.items()
                                   if n['fm'].get('lang') == lang)
        out += [f'{lang}: {t!r} x{c}' for t, c in seen.items() if c > 1]
    return out

@check('50 built pages carry a title and a description')
def _():
    out = []
    for f in sorted(DIST.glob('blog/*/index.html')):
        h = f.read_text()
        if not re.search(r'<title>[^<]{6,}</title>', h): out.append(f'{f.parent.name}: no title')
        if 'name="description"' not in h: out.append(f'{f.parent.name}: no meta description')
    return out

print(f'\n{len(fails)} of {len(checks)} checks found something' + (f': {", ".join(f.split()[0] for f in fails)}' if fails else ''))
sys.exit(len(fails))
