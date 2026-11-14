// The small figures that walk the bottom of the margins. Each faces right and stands on y = 0,
// about 30px tall, drawn in its own natural colours. `rim` is a hairline outline that keeps a
// dark animal visible on the dark theme (and a pale one on the light theme).

const P = (ctx, f) => { ctx.beginPath(); f(); }
const ell = (ctx, x, y, rx, ry, rot = 0) => ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2)
const fill = (ctx, c) => { ctx.fillStyle = c; ctx.fill() }

// real coats: a base, and optionally tabby stripes, a white bib and paws, or calico patches
export const COATS = [
  { name: 'black', base: '#2A2A2E', eye: '#E3C14B' },
  { name: 'grey tabby', base: '#8B9097', stripe: '#5F646B', eye: '#9BC36B', bib: '#D9DCDF' },
  { name: 'orange tabby', base: '#E19A55', stripe: '#BE6F2C', eye: '#C9A53A', bib: '#F3D9B5' },
  { name: 'cream', base: '#E9D3AE', stripe: '#D2B17F', eye: '#C9A53A' },
  { name: 'white', base: '#F6F3EC', eye: '#7FB2D8', pale: true },
  { name: 'tuxedo', base: '#26272B', bib: '#F4F2EC', paws: '#F4F2EC', eye: '#9BC36B' },
  { name: 'calico', base: '#F4F1E9', patches: ['#D9883E', '#2D2B2B'], eye: '#C9A53A', pale: true },
]
export const pickCoat = () => COATS[Math.floor(Math.random() * COATS.length)]

// the cat's outline, used to fill it and to keep stripes and patches inside it
function catBody(ctx) {
  ctx.moveTo(-13, -8)
  ctx.bezierCurveTo(-15, -16.5, -5, -18.6, 3, -16.6)
  ctx.bezierCurveTo(6, -15.9, 7.5, -17, 8.5, -19)
  ctx.bezierCurveTo(8.8, -23.2, 11, -24.6, 13, -24.7)
  ctx.lineTo(13.5, -29.8); ctx.lineTo(16.1, -25.5)
  ctx.lineTo(18.9, -29.5); ctx.lineTo(19.5, -24.1)
  ctx.bezierCurveTo(21.7, -22.7, 22.5, -19.7, 20.9, -17.7)
  ctx.bezierCurveTo(19.3, -15.9, 15.9, -15.5, 13.3, -14.7)
  ctx.bezierCurveTo(11.1, -13.7, 10.1, -9.6, 8.1, -7.5)
  ctx.bezierCurveTo(2, -6.3, -6, -6.3, -10, -6.9)
  ctx.bezierCurveTo(-12, -7.1, -13, -7.4, -13, -8)
  ctx.closePath()
}

export function cat(ctx, t, coat, rim, jump = 0) {
  const ph = t * 8, swing = Math.sin(ph) * 2.2, bob = Math.abs(Math.sin(ph)) * 0.6
  ctx.translate(0, -Math.sin(Math.PI * jump) * 10 - bob)
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  const shade = coat.stripe ?? (coat.pale ? '#DCD6CB' : coat.base)
  const leg = (x, sw, w, c, paw) => {
    const path = () => { ctx.moveTo(x, -8); ctx.quadraticCurveTo(x + sw * 0.3, -3.5, x + sw, -0.8) }
    const foot = () => ell(ctx, x + sw + 0.9, -0.5, 2, 1.25)
    // an outline first, a little wider, so pale legs show on a pale page
    ctx.strokeStyle = rim; ctx.lineWidth = w + 1.2; P(ctx, path); ctx.stroke(); ctx.lineWidth = 1.2; P(ctx, foot); ctx.stroke()
    ctx.strokeStyle = c; ctx.lineWidth = w; P(ctx, path); ctx.stroke()
    P(ctx, foot); fill(ctx, paw ?? c)
  }
  leg(-7, -swing, 2.6, shade, coat.paws); leg(3.6, swing, 2.6, shade, coat.paws)       // far legs, a shade darker
  // the tail, with a stripe or two on a tabby
  ctx.strokeStyle = rim; ctx.lineWidth = 3.6
  const tail = () => { ctx.moveTo(-12.5, -11); ctx.bezierCurveTo(-19, -11, -21, -17, -18 + swing * 0.25, -22); ctx.quadraticCurveTo(-16.5 + swing * 0.3, -24.5, -14.6 + swing * 0.35, -23.4) }
  P(ctx, tail); ctx.stroke()
  ctx.strokeStyle = coat.base; ctx.lineWidth = 2.7; P(ctx, tail); ctx.stroke()
  if (coat.stripe) { ctx.strokeStyle = coat.stripe; ctx.lineWidth = 2.8; ctx.setLineDash([1.6, 2.6]); P(ctx, tail); ctx.stroke(); ctx.setLineDash([]) }
  // body: rim, fill, then markings clipped to the body
  ctx.strokeStyle = rim; ctx.lineWidth = 1.2; P(ctx, () => catBody(ctx)); ctx.stroke(); fill(ctx, coat.base)
  ctx.save(); P(ctx, () => catBody(ctx)); ctx.clip()
  if (coat.stripe) {
    ctx.strokeStyle = coat.stripe; ctx.lineWidth = 1.5
    for (const x of [-9, -5, -1, 3]) { P(ctx, () => { ctx.moveTo(x, -17.5); ctx.quadraticCurveTo(x - 1.6, -13, x + 0.4, -9) }); ctx.stroke() }
    P(ctx, () => { ctx.moveTo(14, -24); ctx.lineTo(14.6, -21.5) }); ctx.stroke()          // the M on the brow
    P(ctx, () => { ctx.moveTo(16.4, -24.4); ctx.lineTo(16.2, -21.8) }); ctx.stroke()
  }
  if (coat.patches) {
    P(ctx, () => ell(ctx, -6, -15, 6, 4, -0.2)); fill(ctx, coat.patches[0])
    P(ctx, () => ell(ctx, 1, -12, 3.6, 3)); fill(ctx, coat.patches[1])
    P(ctx, () => ell(ctx, 16, -25, 3.6, 3.4)); fill(ctx, coat.patches[0])
    P(ctx, () => ell(ctx, -12, -12, 2.6, 2.4)); fill(ctx, coat.patches[1])
  }
  if (coat.bib) { P(ctx, () => ell(ctx, 11, -11.5, 3.8, 5, -0.4)); fill(ctx, coat.bib) }    // a pale chest
  ctx.restore()
  // inner ears, eye, nose
  ctx.fillStyle = '#E7A6A6'
  P(ctx, () => { ctx.moveTo(14, -27.6); ctx.lineTo(15.3, -25.4); ctx.lineTo(14.3, -25.1); ctx.closePath() }); ctx.fill()
  P(ctx, () => { ctx.moveTo(18.8, -27.4); ctx.lineTo(19.1, -24.6); ctx.lineTo(18, -25); ctx.closePath() }); ctx.fill()
  P(ctx, () => ell(ctx, 17.3, -20.6, 1.25, 1.45)); fill(ctx, coat.eye)
  P(ctx, () => ell(ctx, 17.5, -20.6, 0.45, 1.1)); fill(ctx, '#1A1A1A')                     // a slit pupil
  P(ctx, () => { ctx.arc(17, -21.2, 0.35, 0, Math.PI * 2) }); fill(ctx, '#FFFFFF')
  P(ctx, () => { ctx.moveTo(21, -18.6); ctx.lineTo(21.6, -17.8); ctx.lineTo(20.6, -17.6); ctx.closePath() }); fill(ctx, '#D98C8C')
  leg(-9.6, swing, 3, coat.base, coat.paws); leg(6, -swing, 3, coat.base, coat.paws)      // near legs
}

// a red squirrel, bounding, an acorn held to its chest
export function squirrel(ctx, t, rim) {
  const hop = Math.abs(Math.sin(t * 7)), lift = hop * 5.5
  ctx.translate(0, -lift); ctx.rotate((hop - 0.5) * 0.12)
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  const fur = '#B8642B', light = '#D98A4A', cream = '#F1DFC2', dark = '#7A3E18'
  // the tail: a big plume curling up and over, lighter along its inner edge, with a few strands
  const tail = () => { ctx.moveTo(-5, -6); ctx.bezierCurveTo(-21, -4, -24, -24, -12, -29); ctx.bezierCurveTo(-5, -32, 0, -27, -4, -23); ctx.bezierCurveTo(-8, -20, -9, -16, -5, -12); ctx.closePath() }
  ctx.strokeStyle = rim; ctx.lineWidth = 1.2; P(ctx, tail); ctx.stroke(); fill(ctx, fur)
  ctx.save(); P(ctx, tail); ctx.clip()
  P(ctx, () => { ctx.moveTo(-7, -9); ctx.bezierCurveTo(-17, -9, -19, -24, -11, -27); ctx.bezierCurveTo(-5, -29, -3, -26, -5, -23) }); ctx.strokeStyle = light; ctx.lineWidth = 3.4; ctx.stroke()
  ctx.strokeStyle = dark; ctx.lineWidth = 0.7
  for (const [a, b, c, d] of [[-16, -12, -19, -16], [-18, -18, -20, -22], [-14, -26, -16, -29], [-8, -29, -9, -31]]) { P(ctx, () => { ctx.moveTo(a, b); ctx.lineTo(c, d) }); ctx.stroke() }
  ctx.restore()
  // hind leg, body, belly
  P(ctx, () => ell(ctx, -3, -4.5, 4.6, 3.6, -0.3)); fill(ctx, dark)
  const body = () => ell(ctx, 1, -8.5, 7, 5.6, -0.45)
  ctx.strokeStyle = rim; ctx.lineWidth = 1.2; P(ctx, body); ctx.stroke(); fill(ctx, fur)
  P(ctx, () => ell(ctx, 4.2, -7.4, 3.2, 4.2, -0.45)); fill(ctx, cream)
  // head, ear with its tuft, eye, nose
  const head = () => ell(ctx, 7.6, -15.2, 4.4, 3.8, 0.2)
  ctx.strokeStyle = rim; P(ctx, head); ctx.stroke(); fill(ctx, fur)
  P(ctx, () => ell(ctx, 9.4, -13.6, 2.4, 1.8, 0.3)); fill(ctx, cream)
  P(ctx, () => { ctx.moveTo(5.4, -18); ctx.lineTo(5.8, -22.4); ctx.lineTo(7.8, -18.6); ctx.closePath() }); fill(ctx, fur)
  P(ctx, () => { ctx.moveTo(5.8, -22.2); ctx.quadraticCurveTo(5.6, -23.4, 6.3, -24) }); ctx.strokeStyle = dark; ctx.lineWidth = 0.9; ctx.stroke()   // the ear tuft
  P(ctx, () => ell(ctx, 8.8, -16, 1.1, 1.2)); fill(ctx, '#1C1410')
  P(ctx, () => ctx.arc(8.5, -16.4, 0.35, 0, Math.PI * 2)); fill(ctx, '#FFFFFF')
  P(ctx, () => ctx.arc(11.9, -14.4, 0.6, 0, Math.PI * 2)); fill(ctx, '#3A2418')
  // an acorn in its forepaws
  P(ctx, () => ell(ctx, 8.6, -9.6, 1.8, 2.2)); fill(ctx, '#A87A3E')
  P(ctx, () => { ctx.ellipse(8.6, -11.2, 2.2, 1.2, 0, Math.PI, 0) }); fill(ctx, '#6B4A24')
  P(ctx, () => ell(ctx, 6.8, -9.6, 1.4, 1, 0.4)); fill(ctx, fur)
  // front foot
  ctx.strokeStyle = fur; ctx.lineWidth = 1.8; P(ctx, () => { ctx.moveTo(4, -4); ctx.lineTo(6 + hop, -0.8) }); ctx.stroke()
}

// Santa, walking, a sack over his shoulder
export function santa(ctx, t, rim) {
  const step = Math.sin(t * 8) * 2.4, bob = Math.abs(Math.sin(t * 8)) * 0.6
  ctx.translate(0, -bob); ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  const red = '#C62F2A', redDark = '#9E2320', white = '#FBFAF6', fur = '#EDEAE2', black = '#1E1B1A', skin = '#F0C9A6', gold = '#E2B33C'
  // the sack, behind him
  P(ctx, () => { ctx.moveTo(-6, -24); ctx.bezierCurveTo(-15, -25, -16, -10, -9, -9); ctx.bezierCurveTo(-3, -9, -2, -18, -6, -24) }); ctx.strokeStyle = rim; ctx.lineWidth = 1.2; ctx.stroke(); fill(ctx, '#8C5A31')
  P(ctx, () => { ctx.moveTo(-6, -24); ctx.lineTo(-3, -26) }); ctx.strokeStyle = '#5E3A1D'; ctx.lineWidth = 1.2; ctx.stroke()
  // boots and legs
  const boot = (x, sw) => {
    ctx.strokeStyle = redDark; ctx.lineWidth = 3; P(ctx, () => { ctx.moveTo(x, -8); ctx.lineTo(x + sw, -2.5) }); ctx.stroke()
    P(ctx, () => { ell(ctx, x + sw + 1.2, -1.3, 2.8, 1.5) }); fill(ctx, black)
  }
  boot(-2, -step); boot(2.4, step)
  // the coat: round, with a white hem, a belt and buckle
  const coat = () => { ctx.moveTo(-6.5, -8); ctx.bezierCurveTo(-8.5, -14, -7.5, -21, 0, -21.5); ctx.bezierCurveTo(7.5, -21, 8.5, -14, 6.5, -8); ctx.closePath() }
  ctx.strokeStyle = rim; ctx.lineWidth = 1.2; P(ctx, coat); ctx.stroke(); fill(ctx, red)
  P(ctx, () => { ctx.roundRect(-7, -9.6, 14, 2.6, 1.3) }); fill(ctx, fur)
  ctx.fillStyle = black; ctx.fillRect(-7.2, -15.4, 14.4, 2.2)
  ctx.strokeStyle = gold; ctx.lineWidth = 0.9; ctx.strokeRect(-1.6, -15.8, 3.2, 3)
  P(ctx, () => { ctx.moveTo(0, -21); ctx.lineTo(0, -9.6) }); ctx.strokeStyle = fur; ctx.lineWidth = 1.6; ctx.stroke()   // the coat's white seam
  // arm, mitten on the sack's neck
  ctx.strokeStyle = red; ctx.lineWidth = 3; P(ctx, () => { ctx.moveTo(-3, -19); ctx.lineTo(-5.6, -23) }); ctx.stroke()
  P(ctx, () => ell(ctx, -5.8, -23.8, 1.8, 1.6)); fill(ctx, black)
  // face, cheeks, beard, moustache
  P(ctx, () => ell(ctx, 1.2, -25, 3.8, 3.6)); fill(ctx, skin)
  P(ctx, () => ell(ctx, 3.2, -24, 1.1, 0.8)); fill(ctx, '#E9978A')
  ctx.fillStyle = white
  for (const [x, y, r] of [[-1.8, -21.8, 2.2], [0.8, -20.6, 2.4], [3.4, -21.4, 2.1], [-0.4, -19, 1.9], [2.2, -18.8, 1.8]]) { P(ctx, () => ctx.arc(x, y, r, 0, Math.PI * 2)); ctx.fill() }
  P(ctx, () => ell(ctx, 3, -23, 2.2, 1, -0.1)); ctx.fill()
  P(ctx, () => ell(ctx, 2.6, -25.8, 0.55, 0.65)); fill(ctx, black)
  // the hat: red, flopping back, a white brim and bobble
  P(ctx, () => { ctx.moveTo(-3.2, -27.6); ctx.bezierCurveTo(-2, -33, 4, -33.5, 5.2, -28); ctx.closePath() }); fill(ctx, red)
  P(ctx, () => { ctx.moveTo(-2.4, -31); ctx.quadraticCurveTo(-6.4, -32.4, -8.2, -29.6) }); ctx.strokeStyle = red; ctx.lineWidth = 2.6; ctx.stroke()
  P(ctx, () => ctx.roundRect(-3.8, -28.8, 9.6, 2.4, 1.2)); fill(ctx, fur)
  P(ctx, () => ctx.arc(-8.6, -29.2, 1.7, 0, Math.PI * 2)); fill(ctx, white)
}

// an Adélie penguin: waddling, or flat on its belly and sliding, beak first
export function penguin(ctx, t, rim, sliding) {
  const black = '#1F2328', white = '#FAFAF7', orange = '#E8823A', pink = '#E8A28C'
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  if (sliding) {
    // lying along the ground, head to the right, flippers swept back, feet trailing
    ctx.translate(0, -5.5)
    P(ctx, () => { ell(ctx, -12.5, 1.5, 2.6, 1.2, 0.3); ell(ctx, -12, 3.6, 2.6, 1.2, -0.2) }); fill(ctx, pink)
    const body = () => ell(ctx, 0, 0, 12.5, 5.6)
    ctx.strokeStyle = rim; ctx.lineWidth = 1.2; P(ctx, body); ctx.stroke(); fill(ctx, black)
    P(ctx, () => ell(ctx, -0.5, 2.4, 10.5, 3.2)); fill(ctx, white)
    P(ctx, () => { ctx.moveTo(-2, -2); ctx.quadraticCurveTo(-8, -4, -12, -2.2); ctx.quadraticCurveTo(-7, -1.2, -2, -0.6); ctx.closePath() }); fill(ctx, black)
    P(ctx, () => ctx.arc(9.2, -1.8, 1.4, 0, Math.PI * 2)); fill(ctx, white)
    P(ctx, () => ctx.arc(9.4, -1.8, 0.7, 0, Math.PI * 2)); fill(ctx, black)
    P(ctx, () => { ctx.moveTo(12.2, -1); ctx.lineTo(16, 0); ctx.lineTo(12.2, 1.2); ctx.closePath() }); fill(ctx, orange)
    // a little spray of snow kicked up behind
    ctx.fillStyle = white; for (let k = 0; k < 4; k++) { P(ctx, () => ctx.arc(-16 - k * 2.4, 3 - Math.abs(Math.sin(t * 20 + k)) * 3, 0.9, 0, Math.PI * 2)); ctx.fill() }
    return
  }
  const sway = Math.sin(t * 8) * 0.13
  ctx.rotate(sway)
  P(ctx, () => { ell(ctx, -3, -0.7, 3.2, 1.3); ell(ctx, 3.6, -0.7, 3.2, 1.3) }); fill(ctx, pink)       // feet
  const body = () => { ctx.moveTo(0, -27); ctx.bezierCurveTo(7.6, -27, 9, -17, 8.2, -9); ctx.bezierCurveTo(7.6, -3, 4, -1.4, 0, -1.4); ctx.bezierCurveTo(-4.6, -1.4, -8, -3.4, -8.4, -9); ctx.bezierCurveTo(-9, -18, -6.6, -27, 0, -27) }
  ctx.strokeStyle = rim; ctx.lineWidth = 1.2; P(ctx, body); ctx.stroke(); fill(ctx, black)
  P(ctx, () => { ctx.moveTo(2.6, -18.5); ctx.bezierCurveTo(7.4, -17, 7.4, -6, 4.4, -3); ctx.bezierCurveTo(1, -1.8, -3.6, -2.2, -4.4, -6.6); ctx.bezierCurveTo(-5, -12, -2, -18.5, 2.6, -18.5) }); fill(ctx, white)
  ctx.save(); ctx.translate(-6.6, -15); ctx.rotate(0.35 + Math.sin(t * 8) * 0.25)        // flipper
  P(ctx, () => { ctx.moveTo(0, 0); ctx.quadraticCurveTo(-2.6, 6, -0.6, 10.5); ctx.quadraticCurveTo(1.6, 6, 1.4, 0) }); fill(ctx, black); ctx.restore()
  P(ctx, () => ctx.arc(3.8, -21.2, 1.7, 0, Math.PI * 2)); fill(ctx, white)              // the white eye ring
  P(ctx, () => ctx.arc(4.1, -21.2, 0.85, 0, Math.PI * 2)); fill(ctx, black)
  P(ctx, () => { ctx.moveTo(6.8, -20.4); ctx.lineTo(10.6, -19.4); ctx.lineTo(6.8, -18.4); ctx.closePath() }); fill(ctx, orange)
}

// A present that sits in the right margin through December until its lid goes, drawn from its
// base at the origin. `lid` is how far the lid has risen, 0 while the box is still shut, and
// null once it is gone — the open box is what the nutcracker then climbs out of.
export function present(ctx, lid, rim) {
  const red = '#C62F2A', gold = '#E2B33C', paper = '#2E5878'
  ctx.lineCap = 'butt'; ctx.lineJoin = 'round'
  ctx.strokeStyle = rim; ctx.lineWidth = 1.2
  P(ctx, () => ctx.roundRect(-9.5, -16, 19, 16, 1.4)); ctx.stroke(); fill(ctx, paper)
  ctx.strokeStyle = gold; ctx.lineWidth = 2.2                       // the ribbon, down and across
  P(ctx, () => { ctx.moveTo(0, -16); ctx.lineTo(0, 0); ctx.moveTo(-9.5, -9); ctx.lineTo(9.5, -9) }); ctx.stroke()
  if (lid === null) return
  ctx.save()                                                        // the lid, and the bow riding on it
  ctx.translate(0, -16 - lid); ctx.rotate(lid * 0.05)
  ctx.lineCap = 'round'
  ctx.strokeStyle = rim; ctx.lineWidth = 1.2
  P(ctx, () => ctx.roundRect(-11.4, -5, 22.8, 5.4, 1.4)); ctx.stroke(); fill(ctx, red)
  ctx.strokeStyle = gold; ctx.lineWidth = 2
  P(ctx, () => { ctx.moveTo(0, -5); ctx.lineTo(0, 0.4) }); ctx.stroke()
  P(ctx, () => { ell(ctx, -3.2, -7, 3.2, 2.3, -0.5); ell(ctx, 3.2, -7, 3.2, 2.3, 0.5) }); ctx.strokeStyle = rim; ctx.lineWidth = 1; ctx.stroke(); fill(ctx, gold)
  P(ctx, () => ctx.arc(0, -6.4, 1.3, 0, Math.PI * 2)); fill(ctx, '#C9972A')
  ctx.restore()
}

// The nutcracker who marches out of it: stiff legs, a sword arm, and a jaw that works as he goes.
export function nutcracker(ctx, t, rim) {
  const red = '#C62F2A', black = '#1E1B1A', white = '#FBFAF6', gold = '#E2B33C', skin = '#F0C9A6', blue = '#2E5878'
  const step = Math.sin(t * 7) * 2.6, bob = Math.abs(Math.sin(t * 7)) * 0.5
  const jaw = Math.max(0, Math.sin(t * 3.5)) * 1.4
  ctx.translate(0, -bob); ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  // legs, knees locked, and black boots
  const leg = (x, sw) => {
    ctx.strokeStyle = white; ctx.lineWidth = 2.6
    P(ctx, () => { ctx.moveTo(x, -11); ctx.lineTo(x + sw * 0.6, -3.4) }); ctx.stroke()
    P(ctx, () => ctx.roundRect(x + sw * 0.6 - 2, -3.6, 4.4, 3.6, 1)); fill(ctx, black)
  }
  leg(-2.4, -step); leg(2.4, step)
  // the tunic, with a gold belt and a row of buttons
  ctx.strokeStyle = rim; ctx.lineWidth = 1.1
  P(ctx, () => ctx.roundRect(-6, -24, 12, 13.4, 1.4)); ctx.stroke(); fill(ctx, red)
  ctx.fillStyle = gold; ctx.fillRect(-6.2, -15.6, 12.4, 1.8)
  ctx.fillStyle = gold
  for (const y of [-22, -19.4, -16.8]) { P(ctx, () => ctx.arc(0, y, 0.75, 0, Math.PI * 2)); ctx.fill() }
  // epaulettes, the free arm, and a sword held upright
  P(ctx, () => { ell(ctx, -6.4, -22.6, 2.2, 1.3); ell(ctx, 6.4, -22.6, 2.2, 1.3) }); fill(ctx, gold)
  ctx.strokeStyle = red; ctx.lineWidth = 2.4
  P(ctx, () => { ctx.moveTo(-5.4, -21.4); ctx.lineTo(-6.6 + step * 0.3, -14.4) }); ctx.stroke()
  P(ctx, () => { ctx.moveTo(5.4, -21.4); ctx.lineTo(7.4, -16.6) }); ctx.stroke()
  ctx.strokeStyle = '#B9BEC4'; ctx.lineWidth = 1.3
  P(ctx, () => { ctx.moveTo(7.6, -17.4); ctx.lineTo(7.6, -30) }); ctx.stroke()
  ctx.strokeStyle = gold; ctx.lineWidth = 1.6
  P(ctx, () => { ctx.moveTo(6.2, -17.6); ctx.lineTo(9, -17.6) }); ctx.stroke()
  // head, beard, and the working jaw
  ctx.strokeStyle = rim; ctx.lineWidth = 1.1
  P(ctx, () => ctx.roundRect(-4.4, -33.4, 8.8, 9.6, 1.2)); ctx.stroke(); fill(ctx, skin)
  ctx.fillStyle = black
  for (const x of [-1.9, 1.9]) { P(ctx, () => ctx.arc(x, -30.6, 0.8, 0, Math.PI * 2)); ctx.fill() }
  ctx.strokeStyle = black; ctx.lineWidth = 1; P(ctx, () => { ctx.moveTo(-3.4, -32.2); ctx.lineTo(-0.8, -32.6) }); ctx.stroke()
  P(ctx, () => { ctx.moveTo(3.4, -32.2); ctx.lineTo(0.8, -32.6) }); ctx.stroke()
  P(ctx, () => ctx.roundRect(-3.6, -26.4 + jaw, 7.2, 2.6, 0.8)); fill(ctx, white)   // the jaw drops as he walks
  P(ctx, () => { ell(ctx, -4.6, -27.4, 1.6, 2.4); ell(ctx, 4.6, -27.4, 1.6, 2.4) }); fill(ctx, white)
  // the shako: tall, black, a gold band and a plume
  P(ctx, () => ctx.roundRect(-4.6, -43, 9.2, 9.8, 1)); ctx.strokeStyle = rim; ctx.lineWidth = 1.1; ctx.stroke(); fill(ctx, black)
  ctx.fillStyle = gold; ctx.fillRect(-4.8, -35.4, 9.6, 1.8)
  P(ctx, () => ctx.arc(0, -38.4, 1.5, 0, Math.PI * 2)); fill(ctx, gold)
  ctx.strokeStyle = blue; ctx.lineWidth = 2
  P(ctx, () => { ctx.moveTo(0, -43); ctx.quadraticCurveTo(1.6, -47.4, -1, -49.4) }); ctx.stroke()
}

// --- the rest of the year's visitors ------------------------------------------------------
// All of them stand on the origin and are drawn upward in -y, like the cat above, so the
// margin sweeper can place them without knowing which one it has.

const legs = (ctx, t, col, w = 2.2, y = 0, spread = 2.6) => {
  const step = Math.sin(t * 9) * spread
  ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'
  P(ctx, () => { ctx.moveTo(-1.6, y - 7); ctx.lineTo(-1.6 - step, y - 0.6) }); ctx.stroke()
  P(ctx, () => { ctx.moveTo(1.6, y - 7); ctx.lineTo(1.6 + step, y - 0.6) }); ctx.stroke()
}

// A skier, knees bent, poles trailing, leaving a thin track
export function skier(ctx, t, rim) {
  const lean = Math.sin(t * 2.2) * 0.12
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  const red = '#C62F2A', dark = '#2E3A44', skin = '#F0C9A6', ski = '#E2B33C'
  ctx.rotate(lean)
  ctx.strokeStyle = ski; ctx.lineWidth = 2
  P(ctx, () => { ctx.moveTo(-13, -1); ctx.lineTo(11, -1); ctx.moveTo(-12, -3.4); ctx.lineTo(12, -3.4) }); ctx.stroke()
  ctx.strokeStyle = dark; ctx.lineWidth = 3
  P(ctx, () => { ctx.moveTo(-1, -12); ctx.lineTo(-3.4, -4) }); ctx.stroke()
  P(ctx, () => { ctx.moveTo(2, -12); ctx.lineTo(1.2, -4) }); ctx.stroke()
  ctx.strokeStyle = rim; ctx.lineWidth = 1.1
  P(ctx, () => ctx.roundRect(-5, -24, 10, 12.4, 2)); ctx.stroke(); fill(ctx, red)
  ctx.strokeStyle = red; ctx.lineWidth = 2.6
  P(ctx, () => { ctx.moveTo(-3.6, -21); ctx.lineTo(-9, -17) }); ctx.stroke()
  ctx.strokeStyle = '#9AA3AC'; ctx.lineWidth = 1.1
  P(ctx, () => { ctx.moveTo(-9, -17); ctx.lineTo(-16, -2) }); ctx.stroke()
  P(ctx, () => ell(ctx, 0.6, -28, 4, 3.8)); ctx.strokeStyle = rim; ctx.lineWidth = 1; ctx.stroke(); fill(ctx, skin)
  P(ctx, () => { ctx.moveTo(-4, -29.6); ctx.quadraticCurveTo(0.6, -34, 5, -29.6); ctx.closePath() }); fill(ctx, dark)
  P(ctx, () => { ctx.moveTo(-1.4, -27.4); ctx.lineTo(5.6, -27.4); ctx.lineTo(5, -29.4); ctx.lineTo(-1.4, -29.2); ctx.closePath() }); fill(ctx, '#7CC4F5')
}

// A snowboarder, sideways on the board, arms out for balance
export function boarder(ctx, t, rim) {
  const sway = Math.sin(t * 1.8) * 0.16
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  const blue = '#2E5878', dark = '#2E3A44', skin = '#F0C9A6'
  ctx.rotate(sway)
  ctx.strokeStyle = rim; ctx.lineWidth = 1
  P(ctx, () => ctx.roundRect(-14, -3.2, 28, 3.2, 1.6)); ctx.stroke(); fill(ctx, '#C2703C')
  ctx.strokeStyle = dark; ctx.lineWidth = 3.2
  P(ctx, () => { ctx.moveTo(-5, -12); ctx.lineTo(-7.5, -3.6) }); ctx.stroke()
  P(ctx, () => { ctx.moveTo(4, -12); ctx.lineTo(7, -3.6) }); ctx.stroke()
  ctx.strokeStyle = rim; ctx.lineWidth = 1.1
  P(ctx, () => ctx.roundRect(-5.4, -23, 10.8, 11.6, 2)); ctx.stroke(); fill(ctx, blue)
  ctx.strokeStyle = blue; ctx.lineWidth = 2.6
  P(ctx, () => { ctx.moveTo(-4.4, -20.4); ctx.lineTo(-11.4, -23.4 + Math.sin(t * 1.8) * 2) }); ctx.stroke()
  P(ctx, () => { ctx.moveTo(4.4, -20.4); ctx.lineTo(11.4, -17.4 - Math.sin(t * 1.8) * 2) }); ctx.stroke()
  P(ctx, () => ell(ctx, 0, -27, 4, 3.8)); ctx.strokeStyle = rim; ctx.lineWidth = 1; ctx.stroke(); fill(ctx, skin)
  P(ctx, () => { ctx.moveTo(-4.4, -28.6); ctx.quadraticCurveTo(0, -33.4, 4.4, -28.6); ctx.closePath() }); fill(ctx, '#C62F2A')
  P(ctx, () => ctx.arc(0, -33.4, 1.5, 0, Math.PI * 2)); fill(ctx, '#FBFAF6')
}

// A dog, nose down, ploughing through whatever has piled up
export function dog(ctx, t, rim) {
  const coat = '#C98A4B', dark = '#8C5A31', tongue = '#E8827E'
  const step = Math.sin(t * 10) * 2.4, bob = Math.abs(Math.sin(t * 10)) * 0.8
  ctx.translate(0, -bob); ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.strokeStyle = dark; ctx.lineWidth = 2.4
  P(ctx, () => { ctx.moveTo(-5, -8); ctx.lineTo(-5 - step, -0.8); ctx.moveTo(5, -8); ctx.lineTo(5 + step, -0.8) }); ctx.stroke()
  P(ctx, () => { ctx.moveTo(-3, -8); ctx.lineTo(-3 + step, -0.8); ctx.moveTo(7, -8); ctx.lineTo(7 - step, -0.8) }); ctx.stroke()
  ctx.strokeStyle = coat; ctx.lineWidth = 2.6                                  // a tail that never stops
  P(ctx, () => { ctx.moveTo(7.4, -12); ctx.quadraticCurveTo(12.6, -14 + Math.sin(t * 16) * 4, 13.4, -19 + Math.sin(t * 16) * 3) }); ctx.stroke()
  ctx.strokeStyle = rim; ctx.lineWidth = 1.1
  P(ctx, () => ell(ctx, 1, -11.4, 8.4, 4.6)); ctx.stroke(); fill(ctx, coat)
  ctx.save(); ctx.translate(-8.4, -12.6); ctx.rotate(0.5)                      // head down, into the leaves
  P(ctx, () => ell(ctx, 0, 0, 5, 4.2)); ctx.strokeStyle = rim; ctx.lineWidth = 1.1; ctx.stroke(); fill(ctx, coat)
  P(ctx, () => { ctx.moveTo(-4.6, -1.6); ctx.lineTo(-8.4, 0.6); ctx.lineTo(-4.4, 2) ; ctx.closePath() }); fill(ctx, coat)
  P(ctx, () => ctx.arc(-7.4, 0.9, 1.2, 0, Math.PI * 2)); fill(ctx, '#1E1B1A')
  P(ctx, () => ctx.arc(-2.4, -1.4, 0.8, 0, Math.PI * 2)); fill(ctx, '#1E1B1A')
  P(ctx, () => { ctx.moveTo(2.4, -3.4); ctx.quadraticCurveTo(6.4, -1, 3.4, 3.4); ctx.closePath() }); fill(ctx, dark)
  P(ctx, () => { ctx.moveTo(-5.4, 2.2); ctx.quadraticCurveTo(-7, 4.4, -4.2, 4.2); ctx.closePath() }); fill(ctx, tongue)
  ctx.restore()
}

// A duck, with ducklings strung out behind her
export function duck(ctx, t, rim) {
  const body = '#8C7A5E', head = '#1E4A39', bill = '#E2B33C'
  const one = (x, k, wob) => {
    ctx.save(); ctx.translate(x, -wob)
    ctx.strokeStyle = bill; ctx.lineWidth = 1.6 * k; ctx.lineCap = 'round'
    const st = Math.sin(t * 11 + x) * 1.6 * k
    P(ctx, () => { ctx.moveTo(-1 * k, -5 * k); ctx.lineTo(-1 * k - st, -0.6) }); ctx.stroke()
    P(ctx, () => { ctx.moveTo(1.4 * k, -5 * k); ctx.lineTo(1.4 * k + st, -0.6) }); ctx.stroke()
    ctx.strokeStyle = rim; ctx.lineWidth = 1
    P(ctx, () => ell(ctx, 0, -8.4 * k, 7 * k, 4.6 * k)); ctx.stroke(); fill(ctx, k > 0.7 ? body : bill)
    P(ctx, () => { ctx.moveTo(5.6 * k, -10 * k); ctx.quadraticCurveTo(9.4 * k, -7 * k, 6.6 * k, -5.6 * k); ctx.closePath() }); fill(ctx, k > 0.7 ? body : bill)
    P(ctx, () => ell(ctx, -5.4 * k, -14.4 * k, 3.4 * k, 3.2 * k)); ctx.strokeStyle = rim; ctx.stroke(); fill(ctx, k > 0.7 ? head : bill)
    P(ctx, () => { ctx.moveTo(-8.4 * k, -14.4 * k); ctx.lineTo(-12.4 * k, -13.4 * k); ctx.lineTo(-8.4 * k, -12.4 * k); ctx.closePath() }); fill(ctx, bill)
    P(ctx, () => ctx.arc(-6.2 * k, -15.2 * k, 0.7 * k, 0, Math.PI * 2)); fill(ctx, '#1E1B1A')
    ctx.restore()
  }
  one(0, 1, Math.abs(Math.sin(t * 11)) * 0.5)
  for (let i = 1; i <= 3; i++) one(i * 11.5, 0.52, Math.abs(Math.sin(t * 11 - i * 0.7)) * 0.4)
}

// A swallow, skimming the margin rather than walking it
export function swallow(ctx, t, rim) {
  const blue = '#2E3A58', cream = '#F0DFC4', rust = '#C2703C'
  ctx.translate(0, -26 - Math.sin(t * 2.4) * 9)
  ctx.rotate(Math.sin(t * 2.4) * 0.22)
  const beat = Math.sin(t * 13)
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  P(ctx, () => { ctx.moveTo(-1, 0); ctx.quadraticCurveTo(-9, 4 * beat - 3, -15, 7 * beat); ctx.quadraticCurveTo(-8, 2 * beat, -1, 2) }); fill(ctx, blue)
  P(ctx, () => { ctx.moveTo(1, 0); ctx.quadraticCurveTo(9, -4 * beat - 3, 15, -7 * beat); ctx.quadraticCurveTo(8, -2 * beat, 1, 2) }); fill(ctx, blue)
  P(ctx, () => ell(ctx, 0, 1, 5.4, 2.8)); ctx.strokeStyle = rim; ctx.lineWidth = 0.9; ctx.stroke(); fill(ctx, blue)
  P(ctx, () => { ctx.moveTo(-4.6, 1.6); ctx.lineTo(-11, -1.4); ctx.lineTo(-7.4, 2.2); ctx.lineTo(-11, 4.6); ctx.closePath() }); fill(ctx, blue)
  P(ctx, () => ell(ctx, 3.4, 0.2, 2.6, 2.2)); fill(ctx, blue)
  P(ctx, () => ell(ctx, 3.4, 2.2, 2, 1.3)); fill(ctx, rust)
  P(ctx, () => ell(ctx, 1, 2.6, 3, 1.6)); fill(ctx, cream)
  P(ctx, () => { ctx.moveTo(5.8, 0.4); ctx.lineTo(8.6, 1.2); ctx.lineTo(5.8, 1.8); ctx.closePath() }); fill(ctx, '#1E1B1A')
  P(ctx, () => ctx.arc(4.4, -0.6, 0.6, 0, Math.PI * 2)); fill(ctx, '#1E1B1A')
}

// A sparrow, hopping rather than walking
export function sparrow(ctx, t, rim) {
  const brown = '#A3764A', dark = '#5E4428', cream = '#EDE3D2'
  const hop = Math.max(0, Math.sin(t * 5)) * 7
  ctx.translate(0, -hop)
  ctx.strokeStyle = '#C9A06A'; ctx.lineWidth = 1.4; ctx.lineCap = 'round'
  P(ctx, () => { ctx.moveTo(-1.4, -5); ctx.lineTo(-1.4, -0.6); ctx.moveTo(1.6, -5); ctx.lineTo(1.6, -0.6) }); ctx.stroke()
  P(ctx, () => ell(ctx, 0, -9.6, 6.2, 5.2)); ctx.strokeStyle = rim; ctx.lineWidth = 1; ctx.stroke(); fill(ctx, brown)
  P(ctx, () => ell(ctx, 0.6, -8, 4.4, 3.2)); fill(ctx, cream)
  P(ctx, () => { ctx.moveTo(-4.4, -11.4); ctx.quadraticCurveTo(-9, -9.4, -4.6, -7.6); ctx.closePath() }); fill(ctx, dark)
  P(ctx, () => { ctx.moveTo(-5.6, -11); ctx.lineTo(-11.4, -13.4); ctx.lineTo(-5.6, -8.6); ctx.closePath() }); fill(ctx, dark)
  P(ctx, () => ell(ctx, 4.6, -14, 3.6, 3.4)); ctx.strokeStyle = rim; ctx.stroke(); fill(ctx, brown)
  P(ctx, () => { ctx.moveTo(7.6, -14.4); ctx.lineTo(11, -13.2); ctx.lineTo(7.6, -12.2); ctx.closePath() }); fill(ctx, '#3A3027')
  P(ctx, () => ctx.arc(5.4, -15, 0.75, 0, Math.PI * 2)); fill(ctx, '#1E1B1A')
}

// A whale, surfacing in the August margin, with a spout that comes and goes
export function whale(ctx, t, rim) {
  const slate = '#3C5A72', belly = '#CFE0EA'
  const rise = Math.sin(t * 0.9) * 3
  ctx.translate(0, -8 + rise); ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  P(ctx, () => { ctx.moveTo(-17, 0); ctx.bezierCurveTo(-14, -9, 10, -11, 17, -2)
    ctx.bezierCurveTo(10, 3, -8, 4, -17, 0) }); ctx.strokeStyle = rim; ctx.lineWidth = 1.1; ctx.stroke(); fill(ctx, slate)
  P(ctx, () => { ctx.moveTo(-6, 1.6); ctx.bezierCurveTo(0, 3.6, 8, 2.6, 13, -0.6)
    ctx.bezierCurveTo(6, 1.6, 0, 2.6, -6, 1.6) }); fill(ctx, belly)
  P(ctx, () => { ctx.moveTo(-16, -0.6); ctx.lineTo(-24, -7); ctx.lineTo(-22, -0.2); ctx.lineTo(-24, 4); ctx.closePath() }); fill(ctx, slate)
  P(ctx, () => ctx.arc(11.5, -3.4, 0.9, 0, Math.PI * 2)); fill(ctx, '#17202A')
  const blow = (Math.sin(t * 0.9) + 1) / 2                    // the spout breathes with the rise
  if (blow > 0.55) {
    ctx.strokeStyle = belly; ctx.lineWidth = 1.6; ctx.globalAlpha = (blow - 0.55) / 0.45
    for (const a of [-0.45, 0, 0.45])
      P(ctx, () => { ctx.moveTo(4, -9); ctx.quadraticCurveTo(4 + a * 10, -17, 4 + a * 19, -22) }), ctx.stroke()
    ctx.globalAlpha = 1
  }
}

// A dolphin, clear of the water at the top of its arc
export function dolphin(ctx, t, rim) {
  const grey = '#6E8CA3', belly = '#E6EEF3'
  const k = (Math.sin(t * 1.6) + 1) / 2
  ctx.translate(0, -10 - k * 26); ctx.rotate(Math.cos(t * 1.6) * 0.5)
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  P(ctx, () => { ctx.moveTo(-13, 0); ctx.bezierCurveTo(-9, -6, 8, -7, 15, -1)
    ctx.bezierCurveTo(8, 3, -8, 4, -13, 0) }); ctx.strokeStyle = rim; ctx.lineWidth = 1; ctx.stroke(); fill(ctx, grey)
  P(ctx, () => { ctx.moveTo(-5, 1.6); ctx.bezierCurveTo(1, 3, 7, 2, 11, 0); ctx.bezierCurveTo(5, 1.4, 0, 2.4, -5, 1.6) }); fill(ctx, belly)
  P(ctx, () => { ctx.moveTo(-1, -5.4); ctx.lineTo(3, -12); ctx.lineTo(4, -4.8); ctx.closePath() }); fill(ctx, grey)
  P(ctx, () => { ctx.moveTo(-12.4, -0.4); ctx.lineTo(-19, -5); ctx.lineTo(-17.4, 0); ctx.lineTo(-19, 4.4); ctx.closePath() }); fill(ctx, grey)
  P(ctx, () => { ctx.moveTo(13.6, -1.4); ctx.lineTo(18.4, -0.4); ctx.lineTo(13.6, 0.8); ctx.closePath() }); fill(ctx, grey)
  P(ctx, () => ctx.arc(10, -2.6, 0.8, 0, Math.PI * 2)); fill(ctx, '#17202A')
}

// Geese crossing the September sky in a V, small and high up
export function geese(ctx, t, x, y, col, a) {
  ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.lineCap = 'round'
  const beat = Math.sin(t * 6)
  const one = (gx, gy, k) => {
    ctx.beginPath()
    ctx.moveTo(gx - 4 * k, gy - beat * 1.6 * k)
    ctx.lineTo(gx, gy + 1.2 * k)
    ctx.lineTo(gx + 4 * k, gy - beat * 1.6 * k)
    ctx.stroke()
  }
  one(x, y, 1.1)
  for (let i = 1; i <= 3; i++) { one(x - i * 11, y + i * 7, 1 - i * 0.12); one(x + i * 11, y + i * 7, 1 - i * 0.12) }
  ctx.globalAlpha = 1
}

// A snowman, built out of what has settled, and dressed one click at a time
export function snowman(ctx, rim, bits) {
  const snow = '#F6F9FB', coal = '#23282C', carrot = '#E07A2F', wool = '#C62F2A', stick = '#8C5A31'
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.strokeStyle = rim; ctx.lineWidth = 1.1
  P(ctx, () => ctx.arc(0, -9, 9.4, 0, Math.PI * 2)); ctx.stroke(); fill(ctx, snow)
  P(ctx, () => ctx.arc(0, -22.5, 6.8, 0, Math.PI * 2)); ctx.stroke(); fill(ctx, snow)
  ctx.fillStyle = coal
  for (const [x, y] of [[-2.4, -24.2], [2.4, -24.2]]) { P(ctx, () => ctx.arc(x, y, 0.95, 0, Math.PI * 2)); ctx.fill() }
  for (const [x, y] of [[-3, -19.6], [0, -18.8], [3, -19.6]]) { P(ctx, () => ctx.arc(x, y, 0.7, 0, Math.PI * 2)); ctx.fill() }
  if (bits > 3) {                                                  // arms of bare twig
    ctx.strokeStyle = stick; ctx.lineWidth = 1.5
    P(ctx, () => { ctx.moveTo(-8.6, -12); ctx.lineTo(-17, -17); ctx.moveTo(-13.4, -14.6); ctx.lineTo(-14.6, -18.4) }); ctx.stroke()
    P(ctx, () => { ctx.moveTo(8.6, -12); ctx.lineTo(17, -17); ctx.moveTo(13.4, -14.6); ctx.lineTo(14.6, -18.4) }); ctx.stroke()
  }
  if (bits > 0) {                                                  // a scarf, first of all
    P(ctx, () => ctx.roundRect(-7.2, -17.4, 14.4, 3, 1.4)); fill(ctx, wool)
    P(ctx, () => { ctx.moveTo(4.4, -15.2); ctx.lineTo(7.8, -8.4); ctx.lineTo(4, -8.8); ctx.closePath() }); fill(ctx, wool)
  }
  if (bits > 1) {                                                  // then a hat
    P(ctx, () => ctx.roundRect(-8, -29.4, 16, 2.4, 1.2)); ctx.strokeStyle = rim; ctx.lineWidth = 1; ctx.stroke(); fill(ctx, coal)
    P(ctx, () => ctx.roundRect(-5.2, -37.4, 10.4, 8.4, 1)); ctx.stroke(); fill(ctx, coal)
    ctx.fillStyle = wool; ctx.fillRect(-5.4, -31.2, 10.8, 1.8)
  }
  if (bits > 2) {                                                  // and last the nose
    P(ctx, () => { ctx.moveTo(0, -23.2); ctx.lineTo(8.6, -21.6); ctx.lineTo(0, -20.8); ctx.closePath() }); fill(ctx, carrot)
  }
}

// --- things that stand in a margin all month ----------------------------------------------
// Drawn from the floor at the origin, like the visitors, but they do not go anywhere.

// A hydrangea: a bush of four-petalled florets, blue where the soil is sour
export function hydrangea(ctx, rim, seed) {
  const leaf = '#3E6B45', blues = ['#6E8FC9', '#8E7FC2', '#7FA7D4', '#A58CC6']
  const r = (n) => { let s = seed * 9301 + n * 49297; return ((s % 233280) / 233280) }
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.strokeStyle = leaf; ctx.lineWidth = 2
  for (const dx of [-7, 0, 7]) { P(ctx, () => { ctx.moveTo(dx * 0.4, 0); ctx.lineTo(dx, -17) }); ctx.stroke() }
  for (const [x, y, a] of [[-11, -8, -0.6], [11, -9, 0.6], [-4, -5, -0.3], [6, -4, 0.4]]) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a)
    P(ctx, () => { ctx.moveTo(0, 0); ctx.quadraticCurveTo(-5, -4, 0, -9); ctx.quadraticCurveTo(5, -4, 0, 0) }); fill(ctx, leaf)
    ctx.restore()
  }
  // three heads, each a cluster of small crosses
  for (const [hx, hy, k, i0] of [[-7, -20, 1, 0], [7, -22, 0.95, 7], [0, -27, 1.05, 14]]) {
    const col = blues[Math.floor(r(i0) * blues.length)]
    for (let i = 0; i < 11; i++) {
      const a = i * 1.9, rad = 1.6 + r(i0 + i) * 4.6
      const fx = hx + Math.cos(a) * rad * k, fy = hy + Math.sin(a) * rad * 0.8 * k
      ctx.fillStyle = col
      for (let q = 0; q < 4; q++) {
        const b = q * 1.5708
        P(ctx, () => ell(ctx, fx + Math.cos(b) * 1.5 * k, fy + Math.sin(b) * 1.5 * k, 1.5 * k, 1.2 * k, b))
        ctx.fill()
      }
      ctx.fillStyle = '#F2E9C8'
      P(ctx, () => ctx.arc(fx, fy, 0.55 * k, 0, Math.PI * 2)); ctx.fill()
    }
  }
}

// A persimmon branch: the leaves gone, the fruit left for the magpies
export function persimmon(ctx, rim) {
  const wood = '#6B4A32', fruit = '#D9661E', cap = '#4E6B3C'
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.strokeStyle = wood; ctx.lineWidth = 2.6
  P(ctx, () => { ctx.moveTo(0, 0); ctx.quadraticCurveTo(-2, -22, 3, -40) }); ctx.stroke()
  ctx.lineWidth = 1.6
  for (const [x1, y1, x2, y2] of [[1, -16, -11, -24], [2, -26, 13, -31], [3, -34, -7, -41]])
    { P(ctx, () => { ctx.moveTo(x1, y1); ctx.quadraticCurveTo((x1 + x2) / 2, y1 - 3, x2, y2) }); ctx.stroke() }
  for (const [x, y, k] of [[-11, -24, 1], [13, -31, 0.92], [-7, -41, 0.86], [3, -41, 0.7]]) {
    ctx.strokeStyle = rim; ctx.lineWidth = 1
    P(ctx, () => ell(ctx, x, y + 4.4 * k, 4.6 * k, 4.2 * k)); ctx.stroke(); fill(ctx, fruit)
    ctx.fillStyle = cap
    for (let q = 0; q < 4; q++) {
      const b = q * 1.5708 + 0.78
      P(ctx, () => ell(ctx, x + Math.cos(b) * 2 * k, y + 0.6 * k + Math.sin(b) * 1.2 * k, 2.1 * k, 1.1 * k, b))
      ctx.fill()
    }
  }
}

// Silver grass, leaning all one way and catching what light there is
export function silverGrass(ctx, t, rim, seed) {
  const stalk = '#8A8468', plume = '#E4E0D2'
  const r = (n) => { let s = seed * 7919 + n * 104729; return ((s % 233280) / 233280) }
  ctx.lineCap = 'round'
  for (let i = 0; i < 9; i++) {
    const x = (r(i) - 0.5) * 34, h = 30 + r(i + 40) * 22
    const lean = Math.sin(t * 0.8 + i) * 5 + 7
    ctx.strokeStyle = stalk; ctx.lineWidth = 1.2
    P(ctx, () => { ctx.moveTo(x, 0); ctx.quadraticCurveTo(x + lean * 0.4, -h * 0.6, x + lean, -h) }); ctx.stroke()
    ctx.strokeStyle = plume; ctx.lineWidth = 1
    ctx.globalAlpha = 0.75
    for (let j = 0; j < 5; j++) {
      const a = -1.1 + j * 0.34
      P(ctx, () => { ctx.moveTo(x + lean, -h); ctx.lineTo(x + lean + Math.cos(a) * 9, -h + Math.sin(a) * 9 - 3) })
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }
}

// The shoreline: two or three lines of foam sliding up the margin and back
export function surf(ctx, t, W, floorY, dark) {
  const deep = dark ? 'rgba(90,150,185,.30)' : 'rgba(80,150,190,.26)'
  const foam = dark ? 'rgba(226,240,248,.55)' : 'rgba(255,255,255,.75)'
  for (let i = 0; i < 3; i++) {
    const reach = 16 + i * 11, ph = t * 0.55 + i * 1.1
    const y = floorY - (0.5 + 0.5 * Math.sin(ph)) * reach
    ctx.fillStyle = deep
    ctx.beginPath(); ctx.moveTo(0, floorY + 4)
    for (let x = 0; x <= W; x += 16) ctx.lineTo(x, y + Math.sin(x / 55 + ph * 1.6) * 3)
    ctx.lineTo(W, floorY + 4); ctx.closePath(); ctx.fill()
    ctx.strokeStyle = foam; ctx.lineWidth = 1.3
    ctx.beginPath()
    for (let x = 0; x <= W; x += 16) ctx[x ? 'lineTo' : 'moveTo'](x, y + Math.sin(x / 55 + ph * 1.6) * 3)
    ctx.stroke()
  }
}

// A carved pumpkin, lit from inside, for the last week of October
export function pumpkin(ctx, t, rim) {
  const skin = '#D9661E', dark = '#A84911', stalk = '#4E6B3C'
  const flicker = 0.72 + Math.sin(t * 7) * 0.12 + Math.sin(t * 11.3) * 0.08
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.globalAlpha = flicker * 0.5                         // the light it throws on the ground
  const g = ctx.createRadialGradient(0, -11, 4, 0, -11, 54)
  g.addColorStop(0, 'rgba(255,176,70,.85)'); g.addColorStop(1, 'rgba(255,150,50,0)')
  ctx.fillStyle = g; P(ctx, () => ctx.arc(0, -11, 54, 0, Math.PI * 2)); ctx.fill()
  ctx.globalAlpha = 1
  ctx.strokeStyle = stalk; ctx.lineWidth = 2.6
  P(ctx, () => { ctx.moveTo(0, -20); ctx.quadraticCurveTo(2, -26, -2, -29) }); ctx.stroke()
  ctx.strokeStyle = rim; ctx.lineWidth = 1.1
  P(ctx, () => ell(ctx, 0, -11, 13, 10.5)); ctx.stroke(); fill(ctx, skin)
  ctx.strokeStyle = dark; ctx.lineWidth = 1
  for (const dx of [-6.5, 0, 6.5]) { P(ctx, () => ell(ctx, dx, -11, 3.4, 10.2)); ctx.stroke() }
  ctx.globalAlpha = flicker                               // the face, burning
  ctx.fillStyle = '#FFD27A'
  P(ctx, () => { ctx.moveTo(-7, -15); ctx.lineTo(-3, -15); ctx.lineTo(-5, -11); ctx.closePath() }); ctx.fill()
  P(ctx, () => { ctx.moveTo(7, -15); ctx.lineTo(3, -15); ctx.lineTo(5, -11); ctx.closePath() }); ctx.fill()
  P(ctx, () => { ctx.moveTo(-7, -7); ctx.lineTo(-4, -4.4); ctx.lineTo(-1.4, -6.6); ctx.lineTo(1.4, -4.4)
    ctx.lineTo(4, -6.6); ctx.lineTo(7, -4.4); ctx.lineTo(4.4, -2.6); ctx.lineTo(-4.4, -2.6); ctx.closePath() }); ctx.fill()
  ctx.globalAlpha = 1
}
