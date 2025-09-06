#!/usr/bin/env node
/*
  One-Click Demo Reset & Setup Script

  Cleans old demo data, seeds player pool if needed, recreates the 10 demo users,
  creates a fresh 10-team league, auto-drafts teams (with a strong but not-obvious
  roster for Nicholas), syncs projections, and can optionally enable the live window.

  Usage examples:
    node scripts/one-click-setup.js \
      --base https://astral-field-platform.vercel.app \
      --admin-key YOUR_ADMIN_SETUP_KEY \
      --enable-live --minutes 240 --ppr 0.5

    # Defaults: base=http://localhost:3000, teams seeded if players < 150
*/

(async () => {
  const args = process.argv.slice(2)
  const getFlag = (name, def) => {
    const i = args.findIndex(a => a === `--${name}` || a.startsWith(`--${name}=`))
    if (i === -1) return def
    const a = args[i]
    if (a.includes('=')) return a.split('=')[1]
    return args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : def
  }

  const getBool = (name) => {
    const i = args.findIndex(a => a === `--${name}`)
    return i !== -1
  }

  const BASE = getFlag('base', process.env.BASE_URL || 'http://localhost:3000')
  const ADMIN_KEY = getFlag('admin-key', process.env.ADMIN_SETUP_KEY || 'astral2025')
  const ENABLE_LIVE = getBool('enable-live')
  const MINUTES = parseInt(getFlag('minutes', '240'), 10) || 240
  const PPR = parseFloat(getFlag('ppr', '0.5'))
  const SEED_TEAMS = (getFlag('seed-teams', 'KC,BUF,SF,DAL,PHI,MIA') || '').split(',').map(s => s.trim()).filter(Boolean)

  const authHeaders = { 'Authorization': `Bearer ${ADMIN_KEY}` }
  const jsonHeaders = { 'Content-Type': 'application/json', ...authHeaders }

  const log = (...m) => console.log(`[setup]`, ...m)
  const fetchJson = async (path, init = {}, timeoutMs = 60000) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(`${BASE}${path}`, { ...init, signal: controller.signal }).catch((e) => {
      clearTimeout(timer)
      throw e
    })
    clearTimeout(timer)
    let body = null
    try { body = await res.json() } catch {}
    if (!res.ok) {
      const msg = (body && (body.error || body.message)) || `${res.status} ${res.statusText}`
      throw new Error(`${path} failed: ${msg}`)
    }
    return body
  }

  try {
    log(`Target: ${BASE}`)

    // Check player pool
    log('Checking player pool size...')
    let playerCount = 0
    try {
      const s = await fetchJson(`/api/players/search?limit=5`)
      playerCount = Number(s?.count || 0)
    } catch { playerCount = 0 }
    log(`Players detected: ${playerCount}`)

    // Seed a few teams if pool looks small
    if (playerCount < 150) {
      log('Player pool is small; syncing a few NFL teams...')
      for (const t of SEED_TEAMS) {
        log(`Sync team ${t}...`)
        try {
          await fetchJson(`/api/sync-sportsdata`, {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ action: 'sync-team-players', team: t })
          }, 45000)
        } catch (e) {
          log(`Warning: team ${t} sync failed or timed out: ${e.message}. Continuing...`)
        }
      }
    } else {
      log('Player pool sufficient; skipping seeding')
    }

    // Reset and setup demo league
    log('Resetting and setting up demo league...')
    const reset = await fetchJson(`/api/demo/reset-setup`, {
      method: 'POST', headers: jsonHeaders
    })
    const leagueId = reset?.leagueId
    if (!leagueId) {
      log('Warning: reset did not return leagueId; continuing...')
    } else {
      log(`League created: ${leagueId}`)
    }

    // Sync weekly projections
    log('Syncing weekly projections...')
    await fetchJson(`/api/sync-week`, {
      method: 'POST', headers: jsonHeaders,
      body: JSON.stringify({ action: 'sync-projections' })
    })

    // Optionally enable live window and set PPR
    if (leagueId) {
      if (!Number.isNaN(PPR)) {
        log(`Setting scoring PPR=${PPR}...`)
        await fetchJson(`/api/league/settings`, {
          method: 'POST', headers: jsonHeaders,
          body: JSON.stringify({ leagueId, scoring_ppr: PPR })
        })
      }
      if (ENABLE_LIVE) {
        log(`Enabling live window for ${MINUTES} minutes...`)
        await fetchJson(`/api/league/settings`, {
          method: 'POST', headers: jsonHeaders,
          body: JSON.stringify({ leagueId, enable: true, minutes: MINUTES })
        })
      }
    }

    log('All done! Next steps:')
    log(`- Visit ${BASE}/dashboard and log in as Nicholas`) 
    log('- Open Admin → Setup for SportsData checks and live controls')
  } catch (err) {
    console.error('[setup] Error:', err?.message || err)
    process.exitCode = 1
  }
})()
