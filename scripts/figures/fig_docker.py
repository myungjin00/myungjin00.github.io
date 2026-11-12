import pathlib
OUT = pathlib.Path("/data1/project/myungjin/site-lab/public/assets/fig")
G,B,A,L,M,I,P = "#1E4A39","#2E5878","#C2703C","#D3D8CE","#6E7873","#1C2421","#F7F7F3"
MONO="ui-monospace,monospace"
def t(x,y,s,sz=10,fl=M,an="start",w="normal"):
    return f'<text x="{x}" y="{y}" text-anchor="{an}" font-family="{MONO}" font-size="{sz}" fill="{fl}" font-weight="{w}">{s}</text>'
def box(x,y,w,h,st=L,fi="#FFFFFF",r=5,sw=1.4,dash=None):
    d=f' stroke-dasharray="{dash}"' if dash else ""
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fi}" stroke="{st}" stroke-width="{sw}"{d}/>'
def arr(x1,y1,x2,y2,c=L,sw=1.3,m=0,lab=None,sz=9):
    o=[f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{c}" stroke-width="{sw}" marker-end="url(#ar{m})"/>']
    if lab: o.append(t((x1+x2)/2,(y1+y2)/2-6,lab,sz,c,"middle"))
    return o
def defs(*cols):
    o=['<defs>']
    for i,c in enumerate(cols):
        o.append(f'<marker id="ar{i}" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="{c}"/></marker>')
    o.append('</defs>'); return o
def svg(name,w,h,body):
    (OUT/f"{name}.svg").write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" aria-label="{name}">\n'+"\n".join(body)+"\n</svg>\n")
    print("wrote",name)

# ---- 1. Dockerfile -> image -> container ----
b = defs(L,G,A,B)
b += [t(18,22,"three different things, often confused",11,M)]
STAGES=[("Dockerfile",60,G,"a recipe, in text", "you write it"),
        ("image",270,A,"a built, frozen filesystem","immutable, shareable"),
        ("container",480,B,"a running process on it","throw away, start again")]
for lab,x,col,sub,note in STAGES:
    b += [box(x,50,150,66,st=col,fi=P),
          t(x+75,76,lab,11.5,I,"middle","500"),
          t(x+75,96,sub,9,M,"middle"),
          t(x+75,132,note,9,col,"middle")]
b += arr(214,83,264,83,M,1.3,0,"docker build")
b += arr(424,83,474,83,M,1.3,0,"docker run")
b += [t(60,176,"The image is the unit you share. A container is just one execution of it, and nothing you",10,M),
      t(60,192,"write inside a container survives unless it was on a mounted volume.",10,A)]
# layers
b += [t(18,232,"an image is a stack of layers, and only the changed ones rebuild",11,M)]
LAY=[("FROM  mambaorg/micromamba:1.5",G),("COPY  environment.yml .",L),
     ("RUN   micromamba install -y -f environment.yml",A),("COPY  src/ /app/src",B)]
for i,(lab,col) in enumerate(LAY):
    y=252+i*32
    b += [box(60,y,420,26,st=col,fi="#FFFFFF"),
          t(72,y+18,lab,9.5,I),
          t(496,y+18,["cached","cached","the slow one","changes every commit"][i],9,M)]
b += [t(60,396,"Put what changes least at the top. Copying src/ before installing means every edit",10,M),
      t(60,412,"re-runs the install.",10,A)]
svg("docker-layers",660,428,b)

# ---- 2. what is shared with the host ----
b = defs(L,G,A,B)
b += [t(18,22,"what the container shares with the machine, and what it does not",11,M)]
b += [box(26,46,236,210,st=L,fi=P), t(144,68,"the machine (host)",10.5,M,"middle","500")]
b += [box(42,86,204,28,st=L), t(144,105,"Linux kernel",10,I,"middle")]
b += [box(42,122,204,28,st=L), t(144,141,"NVIDIA driver",10,I,"middle")]
b += [box(42,158,204,28,st=L), t(144,177,"/data on disk",10,I,"middle")]
b += [box(42,194,204,28,st=L), t(144,213,"port 8888",10,I,"middle")]
b += [box(396,46,238,210,st=B, fi="#FFFFFF"), t(515,68,"the container",10.5,B,"middle","500")]
CONT=[("its own filesystem", G),("its own python, libs, CUDA runtime", G),("its own process tree", G),("its own network namespace", G)]
for i,(lab,col) in enumerate(CONT):
    b += [box(414,86+i*36,202,28,st=col), t(515,105+i*36,lab,8.5,I,"middle")]
b += arr(266,100,392,100,M,1.2,0,"shared")
b += arr(266,136,392,136,A,1.4,0,"--gpus all")
b += arr(266,172,392,172,A,1.4,0,"-v /data:/data")
b += arr(266,208,392,208,A,1.4,0,"-p 8888:8888")
b += [t(26,286,"The kernel is always shared &#8212; that is why a container is light and a VM is not.",10,M),
      t(26,302,"Everything else has to be handed in on purpose, with a flag.",10,A)]
svg("docker-host",660,318,b)
