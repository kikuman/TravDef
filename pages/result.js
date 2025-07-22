import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

const allowedTroops = [
  { name: 'Spearman', speed: 7 },
  { name: 'Paladin', speed: 10 },
  { name: 'Praetorian', speed: 5 },
  { name: 'Equites Caesaris', speed: 10 },
  { name: 'Phalanx', speed: 7 },
  { name: 'Druidrider', speed: 16 },
]

export default function Result() {
  const router = useRouter()
  const { defender, attacker, landing, tribe } = router.query

  const [mapData, setMapData] = useState([])
  const [supportVillages, setSupportVillages] = useState([])
  const [times, setTimes] = useState([])
  const [distance, setDistance] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!defender || !attacker || !landing || !tribe) return

    const d1 = parseCoords(defender)
    const d2 = parseCoords(attacker)
    const dist = travianDistance(d1, d2)
    setDistance(dist)
    setTimes(troopSpeeds[tribe].map(t => ({ name: t.name, time: formatTime(dist / t.speed) })))

    async function load() {
      try {
        const res = await fetch('/api/map')
        const data = await res.json()
        if (res.ok) {
          setMapData(data.villages)
          computeSupport(data.villages, d1)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [defender, attacker, landing, tribe])

  function computeSupport(villages, defCoords) {
    const defenderVillage = villages.find(v => v.x === defCoords.x && v.y === defCoords.y)
    if (!defenderVillage) return
    const alliance = defenderVillage.alliance
    const landingDate = new Date(landing)
    const nowThai = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
    const remainingHours = (landingDate - nowThai) / 3600000
    const allied = villages.filter(v => v.alliance === alliance && !(v.x === defCoords.x && v.y === defCoords.y))
    const res = allied.map(v => {
      const dist = travianDistance(defCoords, { x: v.x, y: v.y })
      const fastest = Math.min(...allowedTroops.map(t => dist / t.speed))
      return { ...v, fastest }
    }).filter(v => v.fastest <= remainingHours)
    res.sort((a, b) => a.fastest - b.fastest)
    setSupportVillages(res)
  }

  if (loading) return <p className="p-4">Loading...</p>

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="font-bold text-lg mb-2">Attack Report</h1>
        <table className="min-w-full text-sm border">
          <thead>
            <tr>
              <th className="border px-2 py-1">Troop</th>
              <th className="border px-2 py-1">Time</th>
            </tr>
          </thead>
          <tbody>
            {times.map(t => (
              <tr key={t.name}>
                <td className="border px-2 py-1">{t.name}</td>
                <td className="border px-2 py-1">{t.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <h2 className="font-bold text-lg mb-2">Allied Villages (arrive in time)</h2>
        <div className="overflow-auto max-h-96 border">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="border px-2 py-1">Village</th>
                <th className="border px-2 py-1">Player</th>
                <th className="border px-2 py-1">Alliance</th>
                <th className="border px-2 py-1">Coords</th>
                <th className="border px-2 py-1">Fastest Arrival</th>
              </tr>
            </thead>
            <tbody>
              {supportVillages.map((v, idx) => (
                <tr key={idx}>
                  <td className="border px-2 py-1">{v.villageName}</td>
                  <td className="border px-2 py-1">{v.playerName}</td>
                  <td className="border px-2 py-1">{v.alliance}</td>
                  <td className="border px-2 py-1">({v.x}|{v.y})</td>
                  <td className="border px-2 py-1">{formatTime(v.fastest)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function parseCoords(str) {
  const m = str.match(/(-?\d+)\s*[|,\/]\s*(-?\d+)/)
  return m ? { x: Number(m[1]), y: Number(m[2]) } : null
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

