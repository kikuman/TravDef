import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function parseBangkokDate(str) {
  return new Date(`${str}+07:00`)
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { defender, attacker, landing, firstSeen, tribe, reporter } = req.body
    try {
      const d1 = parseCoords(defender)
      const d2 = parseCoords(attacker)
      const distance = travianDistance(d1, d2)
      const report = await prisma.attackReport.create({
        data: {
          defenderCoords: defender,
          attackerCoords: attacker,
          landingTime: parseBangkokDate(landing),
          firstSeenTime: parseBangkokDate(firstSeen),
          tribe,
          reporter,
        },
      })
      const times = troopSpeeds[tribe].map(t => ({
        name: t.name,
        time: formatTime(distance / t.speed),
      }))
      res.json({ id: report.id, distance, times })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Failed to save report' })
    }
  } else if (req.method === 'GET') {
    try {
      const reports = await prisma.attackReport.findMany({ orderBy: { createdAt: 'desc' } })
      res.json({ reports })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Failed to load reports' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}

function parseCoords(coords) {
  const m = coords.match(/(-?\d+)\s*[|,\/]\s*(-?\d+)/)
  if (!m) throw new Error('Invalid coords')
  return { x: Number(m[1]), y: Number(m[2]) }
}

function travianDistance(d1, d2) {
  const dx = Math.min(Math.abs(d1.x - d2.x), 200 - Math.abs(d1.x - d2.x))
  const dy = Math.min(Math.abs(d1.y - d2.y), 200 - Math.abs(d1.y - d2.y))
  return Math.sqrt(dx * dx + dy * dy)
}

function formatTime(hours) {
  const totalSeconds = Math.round(hours * 3600)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  return `${h}h ${m}m`
}

const troopSpeeds = {
  Teuton: [
    { name: 'Maceman', speed: 7 },
    { name: 'Spearman', speed: 7 },
    { name: 'Axeman', speed: 6 },
    { name: 'Scout', speed: 9 },
    { name: 'Paladin', speed: 10 },
    { name: 'Teutonic Knight', speed: 9 },
    { name: 'Ram', speed: 4 },
    { name: 'Catapult', speed: 3 },
    { name: 'Chief', speed: 4 },
    { name: 'Settler', speed: 5 },
  ],
  Roman: [
    { name: 'Legionnaire', speed: 6 },
    { name: 'Praetorian', speed: 5 },
    { name: 'Imperian', speed: 7 },
    { name: 'Equites Legati', speed: 16 },
    { name: 'Equites Imperatoris', speed: 14 },
    { name: 'Equites Caesaris', speed: 10 },
    { name: 'Battering ram', speed: 4 },
    { name: 'Fire Catapult', speed: 3 },
    { name: 'Senator', speed: 4 },
    { name: 'Settler', speed: 5 },
  ],
  Gaul: [
    { name: 'Phalanx', speed: 7 },
    { name: 'Swordsman', speed: 6 },
    { name: 'Pathfinder', speed: 17 },
    { name: 'Theutates Thunder', speed: 19 },
    { name: 'Druidrider', speed: 16 },
    { name: 'Haeduan', speed: 13 },
    { name: 'Ram', speed: 4 },
    { name: 'Trebuchet', speed: 3 },
    { name: 'Chieftain', speed: 5 },
    { name: 'Settler', speed: 5 },
  ],
}

