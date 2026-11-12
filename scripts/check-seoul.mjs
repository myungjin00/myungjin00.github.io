// node scripts/check-seoul.mjs — the footer clock's day/night and the ripple's season
import assert from 'node:assert/strict'
import { isDay, season, seoulNow } from '../src/scripts/seoul.js'
const at = iso => seoulNow(new Date(iso))
assert.equal(isDay(at('2026-11-12T03:00:00Z')), true)    // 12:00 KST
assert.equal(isDay(at('2026-11-12T12:00:00Z')), false)   // 21:00 KST
assert.equal(isDay(at('2026-06-20T20:30:00Z')), true)    // 05:30 KST, June
assert.equal(isDay(at('2026-01-15T22:00:00Z')), false)   // 07:00 KST, January
assert.equal(season(at('2026-12-31T16:00:00Z')), 'winter') // 1 Jan KST
assert.equal(season(at('2026-04-01T03:00:00Z')), 'spring')
assert.equal(season(at('2026-07-01T03:00:00Z')), 'summer')
assert.equal(season(at('2026-11-12T03:00:00Z')), 'autumn')
console.log('ok')
