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
