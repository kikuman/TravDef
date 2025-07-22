import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

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

const allowedUnits = ['Spearman','Paladin','Praetorian','Equites Caesaris','Phalanx','Druidrider']

function parseCoordsInput(input) {
  const match = input.match(/(-?\d+)\s*[|,\/]\s*(-?\d+)/)
  if (!match) return null
  return { x: Number(match[1]), y: Number(match[2]) }
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

function speedForUnit(name) {
  for (const tribe of Object.values(troopSpeeds)) {
    const t = tribe.find(u => u.name === name)
    if (t) return t.speed
  }
  return Infinity
}

export default function Result() {
  const router = useRouter()
  const [payload, setPayload] = useState(null)
  const [villages, setVillages] = useState([])

  useEffect(() => {
    if (!router.isReady) return
    const { data } = router.query
    if (data) {
      try {
        setPayload(JSON.parse(data))
      } catch (e) {
        console.error('Invalid data param')
      }
    }
  }, [router.isReady, router.query])

  useEffect(() => {
    if (!payload) return
    const fetchMap = async () => {
      try {
        const res = await fetch('/api/map')
        const map = await res.json()
        if (!res.ok) throw new Error('map failed')
        const defCoords = parseCoordsInput(payload.form.defender)
        if (!defCoords) return
        const defVillage = map.villages.find(v => v.x === defCoords.x && v.y === defCoords.y)
        if (!defVillage) return
        const alliance = defVillage.alliance
        const nowThailand = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
        const landing = new Date(payload.form.landing)
        const hoursLeft = (landing - nowThailand) / 3600000
        const candidates = map.villages.filter(v => v.alliance === alliance)
        const result = []
        for (const v of candidates) {
          const dist = travianDistance(defCoords, { x: v.x, y: v.y })
          const times = allowedUnits.map(u => {
            const h = dist / speedForUnit(u)
            return { unit: u, time: formatTime(h), hours: h }
          })
          if (times.some(t => t.hours <= hoursLeft)) {
            result.push({ ...v, times })
          }
        }
        setVillages(result)
      } catch (e) {
        console.error(e)
      }
    }
    fetchMap()
  }, [payload])

  if (!payload) return <p className="p-4">Loading...</p>

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold mb-2">Report Result</h1>
      <table className="min-w-full text-sm border">
        <thead>
          <tr>
            <th className="border px-2 py-1">Unit</th>
            <th className="border px-2 py-1">Time</th>
          </tr>
        </thead>
        <tbody>
          {payload.result.times.map(t => (
            <tr key={t.name}>
              <td className="border px-2 py-1">{t.name}</td>
              <td className="border px-2 py-1">{t.time}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-lg font-semibold mt-4">Allied Villages Able to Reinforce</h2>
      <div className="overflow-auto max-h-96 border">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="border px-2 py-1">Village</th>
              <th className="border px-2 py-1">Player</th>
              <th className="border px-2 py-1">Coords</th>
              {allowedUnits.map(u => (
                <th key={u} className="border px-2 py-1">{u}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {villages.map((v, idx) => (
              <tr key={idx}>
                <td className="border px-2 py-1">{v.villageName}</td>
                <td className="border px-2 py-1">{v.playerName}</td>
                <td className="border px-2 py-1">({v.x}|{v.y})</td>
                {allowedUnits.map(u => {
                  const t = v.times.find(tt => tt.unit === u)
                  return <td key={u} className="border px-2 py-1">{t ? t.time : '-'}</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
