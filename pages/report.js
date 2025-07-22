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

function parseCoordsInput(input) {
  const match = input?.toString().match(/(-?\d+)\s*[|,\/]\s*(-?\d+)/)
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

export default function ReportPage() {
  const router = useRouter()
  const { defender, attacker, landing, tribe } = router.query
  const [mapData, setMapData] = useState([])
  const [eligible, setEligible] = useState([])

  useEffect(() => {
    if (!router.isReady) return
    const loadMap = async () => {
      try {
        const res = await fetch('/api/map')
        const data = await res.json()
        if (res.ok) {
          setMapData(data.villages)
          calcEligible(data.villages)
        }
      } catch (e) {
        console.error(e)
      }
    }
    loadMap()
  }, [router.isReady])

  const calcEligible = villages => {
    const dCoords = parseCoordsInput(defender)
    if (!dCoords) return
    const defVillage = villages.find(v => v.x === dCoords.x && v.y === dCoords.y)
    if (!defVillage) return
    const nowThai = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
    const landingTime = new Date(landing)
    const diffHours = (landingTime - nowThai) / 3600000
    if (diffHours <= 0) return
    const allowed = ['Spearman','Paladin','Praetorian','Equites Caesaris','Phalanx','Druidrider']
    const speedMap = {}
    Object.values(troopSpeeds).flat().forEach(t => { speedMap[t.name] = t.speed })
    const allies = villages.filter(v => v.alliance && v.alliance === defVillage.alliance)
    const result = allies.map(v => {
      const dist = travianDistance({ x: v.x, y: v.y }, dCoords)
      const can = allowed.some(t => (dist / speedMap[t]) <= diffHours)
      return { ...v, distance: dist, can }
    }).filter(v => v.can)
    setEligible(result)
  }

  if (!router.isReady) return <p>Loading...</p>
  const dCoords = parseCoordsInput(defender)
  const aCoords = parseCoordsInput(attacker)
  if (!dCoords || !aCoords) return <p>Invalid coordinates</p>
  const distance = travianDistance(dCoords, aCoords)
  const times = troopSpeeds[tribe] ? troopSpeeds[tribe].map(t => ({ name: t.name, time: formatTime(distance / t.speed) })) : []

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-2">Attack Report</h1>
      <table className="border mb-4 text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">Troop</th>
            <th className="border px-2 py-1">Travel Time</th>
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
      <h2 className="font-bold mb-1">Villages able to reinforce in time</h2>
      <ul className="list-disc ml-4 text-sm">
        {eligible.map((v, idx) => (
          <li key={idx}>{v.villageName} ({v.x}|{v.y}) - {v.playerName}</li>
        ))}
        {!eligible.length && <li>No villages can arrive in time</li>}
      </ul>
    </div>
  )
}
