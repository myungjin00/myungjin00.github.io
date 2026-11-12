import pathlib
OUT = pathlib.Path("/data1/project/myungjin/site-lab/public/assets/fig")
G,B,A,L,M,I,P = "#1E4A39","#2E5878","#C2703C","#D3D8CE","#6E7873","#1C2421","#F7F7F3"
MONO="ui-monospace,monospace"
def t(x,y,s,sz=10,fl=M,an="start",w="normal"):
    return f'<text x="{x}" y="{y}" text-anchor="{an}" font-family="{MONO}" font-size="{sz}" fill="{fl}" font-weight="{w}">{s}</text>'
def box(x,y,w,h,st=L,fi="#FFFFFF",r=5,sw=1.4):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fi}" stroke="{st}" stroke-width="{sw}"/>'
def arr(x1,y1,x2,y2,c=L,sw=1.3,m=0):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{c}" stroke-width="{sw}" marker-end="url(#ar{m})"/>'
d=['<defs>']
for i,c in enumerate([L,G,A]):
    d.append(f'<marker id="ar{i}" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="{c}"/></marker>')
d.append('</defs>')

# --- GEO hierarchy ---
b = list(d)
b += [t(18,22,"what a GEO accession actually points at",11,M)]
ROWS=[("GSE123456",G,"series &#8212; one study","the number in a paper"),
      ("GSM...  GSM...  GSM...",B,"samples &#8212; one per library","metadata lives here"),
      ("GPL...",M,"platform &#8212; the instrument",""),
      ("SRP / SRR...",A,"the raw reads, in SRA","FASTQ is downloaded from here")]
for i,(lab,col,sub,note) in enumerate(ROWS):
    y=48+i*62
    b += [box(40,y,260,42,st=col,fi=P), t(170,y+20,lab,11,I,"middle","500"), t(170,y+34,sub,8.5,M,"middle")]
    if note: b.append(t(320,y+26,note,9.5,col))
    if i<3: b.append(arr(170,y+42,170,y+58,L))
b += [t(18,322,"A GSE often also carries a processed count matrix as a supplementary file.",10,M),
      t(18,338,"Convenient, and produced by someone else's pipeline &#8212; different aligner, different annotation version.",10,A)]
(OUT/"geo-structure.svg").write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 660 352" role="img" aria-label="GEO accession hierarchy">\n'+"\n".join(b)+"\n</svg>\n")

# --- RNA-seq pipeline ---
b = list(d)
b += [t(18,22,"from FASTQ to a count matrix",11,M)]
STEPS=[("FASTQ", "raw reads + quality", G),
       ("QC", "FastQC &#8594; MultiQC", L),
       ("trim", "fastp / Trim Galore", L),
       ("align or\nquantify", "STAR / salmon", B),
       ("counts", "gene &#215; sample", A)]
x=30
for i,(lab,sub,col) in enumerate(STEPS):
    w=112
    b += [box(x,56,w,54,st=col,fi=P if col!=L else "#FFFFFF")]
    if "\n" in lab:
        b += [t(x+w/2,78,lab.split("\n")[0],10.5,I,"middle","500"), t(x+w/2,92,lab.split("\n")[1],10.5,I,"middle","500")]
    else:
        b.append(t(x+w/2,84,lab,11,I,"middle","500"))
    b.append(t(x+w/2,126,sub,9,M,"middle"))
    if i<len(STEPS)-1: b.append(arr(x+w+2,83,x+w+22,83,L))
    x += w+24
b += [box(30,152,600,34,st=A,fi=P), t(44,174,"reference genome + annotation &#8212; GENCODE / Ensembl, and the VERSION is part of your method",10,A)]
b += [arr(336,148,336,120,A,1.3,2)]
b += [t(30,214,"Then: counts &#8594; DESeq2. Everything above this line is engineering; everything below is statistics.",10,M)]
(OUT/"rnaseq-pipeline.svg").write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 660 230" role="img" aria-label="RNA-seq preprocessing pipeline">\n'+"\n".join(b)+"\n</svg>\n")
print("ok")
