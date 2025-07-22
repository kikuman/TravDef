import { useState, useEffect } from 'react'

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


function parseBangkokDate(str) {
  // treat the given local datetime string as being in the Asia/Bangkok timezone
  return new Date(`${str}+07:00`)
}

function gatherEligibleVillages(mapData, defenderCoords, landing) {
  const defVillage = mapData.find(v => v.x === defenderCoords.x && v.y === defenderCoords.y)
  if (!defVillage) return { alliance: '', villages: [] }
  const alliance = defVillage.alliance
  const selectedUnits = ['Spearman', 'Paladin', 'Praetorian', 'Equites Caesaris', 'Phalanx', 'Druidrider']
  const speedLookup = {}
  Object.values(troopSpeeds).flat().forEach(t => {
    speedLookup[t.name] = t.speed
  })
  // use current time in Thailand regardless of the user's timezone
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
  const landingTime = typeof landing === 'string' ? parseBangkokDate(landing) : landing
  const villages = []
  mapData.forEach(v => {
    if (v.alliance !== alliance) return
    const dist = travianDistance(defenderCoords, { x: v.x, y: v.y })
    let best = null
    selectedUnits.forEach(u => {
      const hours = dist / speedLookup[u]
      const arrive = now.getTime() + hours * 3600 * 1000
      if (arrive <= landingTime.getTime()) {
        if (!best || hours < best.hours) best = { unit: u, hours }
      }
    })
    if (best) {
      villages.push({ ...v, unit: best.unit, time: formatTime(best.hours) })
    }
  })
  return { alliance, villages }
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('report')
  const [form, setForm] = useState({
    defender: '',
    attacker: '',
    landing: '',
    firstSeen: '',
    tribe: 'Teuton',
    reporter: '',
  })
  const [result, setResult] = useState(null)
  const [mapData, setMapData] = useState([])
  const [loadingMap, setLoadingMap] = useState(false)
  const [attackerVillage, setAttackerVillage] = useState('')
  const [defenderVillage, setDefenderVillage] = useState('')
  const [defenderAlliance, setDefenderAlliance] = useState('')
  const [eligibleVillages, setEligibleVillages] = useState([])
  const [reports, setReports] = useState([])
  const [defenseReportId, setDefenseReportId] = useState(null)

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (mapData.length && (e.target.name === 'attacker' || e.target.name === 'defender')) {
      const coords = parseCoordsInput(e.target.value)
      const village = coords ? mapData.find(v => v.x === coords.x && v.y === coords.y) : null
      if (e.target.name === 'attacker') setAttackerVillage(village ? village.villageName : '')
      if (e.target.name === 'defender') {
        setDefenderVillage(village ? village.villageName : '')
        setDefenderAlliance(village ? village.alliance : '')
      }
    }
  }

  const loadMapData = async () => {
    setLoadingMap(true)
    try {
      const res = await fetch('/api/map')
      const data = await res.json()
      if (res.ok) {
        setMapData(data.villages)
      } else {
        alert(data.error || 'Failed to load map data')
      }
    } catch (e) {
      alert('Failed to load map data')
    } finally {
      setLoadingMap(false)
    }
  }

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/report')
      const data = await res.json()
      if (res.ok) {
        const formatted = data.reports.map(r => {
          const d1 = parseCoordsInput(r.defenderCoords)
          const d2 = parseCoordsInput(r.attackerCoords)
          const distance = travianDistance(d1, d2)
          const times = troopSpeeds[r.tribe].map(t => ({
            name: t.name,
            time: formatTime(distance / t.speed),
          }))
          return {
            id: r.id,
            defender: r.defenderCoords,
            attacker: r.attackerCoords,
            landing: r.landingTime,
            firstSeen: r.firstSeenTime,
            tribe: r.tribe,
            reporter: r.reporter,
            distance,
            times,
          }
        })
        setReports(formatted)
      } else {
        alert(data.error || 'Failed to load reports')
      }
    } catch (e) {
      alert('Failed to load reports')
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const handleFindDefense = report => {
    if (!mapData.length) {
      alert('Please load map data first')
      return
    }
    const coords = parseCoordsInput(report.defender)
    const { alliance, villages } = gatherEligibleVillages(mapData, coords, report.landing)
    setDefenderAlliance(alliance)
    setEligibleVillages(villages)
    setDefenseReportId(report.id)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    let currentMap = mapData
    if (!currentMap.length) {
      setLoadingMap(true)
      try {
        const mres = await fetch('/api/map')
        const mdata = await mres.json()
        if (mres.ok) {
          setMapData(mdata.villages)
          currentMap = mdata.villages
        } else {
          alert(mdata.error || 'Failed to load map data')
        }
      } catch (err) {
        alert('Failed to load map data')
      } finally {
        setLoadingMap(false)
      }
    }
    const res = await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (res.ok) {
      const newReport = {
        id: data.id,
        defender: form.defender,
        attacker: form.attacker,
        landing: form.landing,
        firstSeen: form.firstSeen,
        tribe: form.tribe,
        reporter: form.reporter,
        distance: data.distance,
        times: data.times,
      }
      setReports([newReport, ...reports])
      setResult(data)
      const coords = parseCoordsInput(form.defender)
      if (coords && currentMap.length) {
        const { alliance, villages } = gatherEligibleVillages(currentMap, coords, form.landing)
        setDefenderAlliance(alliance)
        setEligibleVillages(villages)
        setDefenseReportId(newReport.id)
      } else {
        setDefenderAlliance('')
        setEligibleVillages([])
        setDefenseReportId(null)
      }
      setActiveTab('reports')
    } else {
      alert(data.error || 'Error')
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="space-x-2">
          <button onClick={() => setActiveTab('report')} className={activeTab === 'report' ? 'font-bold' : ''}>Report</button>
          <button onClick={() => setActiveTab('map')} className={activeTab === 'map' ? 'font-bold' : ''}>Map Data</button>
          <button onClick={() => setActiveTab('reports')} className={activeTab === 'reports' ? 'font-bold' : ''}>Attack Reports</button>
        </div>
        <button onClick={loadMapData} className="bg-green-500 text-white px-2 py-1">
          {loadingMap ? 'Loading...' : 'Load Map Data'}
        </button>
      </div>
      {activeTab === 'report' && (
        <>
          <form onSubmit={handleSubmit} className="space-y-2">
            <div>
              <input name="defender" placeholder="Defender coords 123|456" className="border p-2 w-full" value={form.defender} onChange={handleChange} required />
              {defenderVillage && <p className="text-sm text-gray-600">{defenderVillage}</p>}
            </div>
            <div>
              <input name="attacker" placeholder="Attacker coords 234|567" className="border p-2 w-full" value={form.attacker} onChange={handleChange} required />
              {attackerVillage && <p className="text-sm text-gray-600">{attackerVillage}</p>}
            </div>
            <input type="datetime-local" name="landing" className="border p-2 w-full" value={form.landing} onChange={handleChange} required />
            <input type="datetime-local" name="firstSeen" className="border p-2 w-full" value={form.firstSeen} onChange={handleChange} required />
            <select name="tribe" className="border p-2 w-full" value={form.tribe} onChange={handleChange}>
              <option>Teuton</option>
              <option>Roman</option>
              <option>Gaul</option>
            </select>
            <input name="reporter" placeholder="Reporter name (optional)" className="border p-2 w-full" value={form.reporter} onChange={handleChange} />
            <button type="submit" className="bg-blue-500 text-white px-4 py-2">Submit</button>
          </form>
          {result && (
            <div className="mt-4 border p-2">
              <h2 className="font-bold">Report Saved</h2>
              <p>Distance: {result.distance.toFixed(2)}</p>
              <ul className="list-disc ml-4">
                {result.times.map(t => (
                  <li key={t.name}>{t.name}: {t.time}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
      {activeTab === 'map' && (
        <div>
          <p className="mb-2">Villages loaded: {mapData.length}</p>
          <div className="overflow-auto max-h-96 border">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-1 border">Village</th>
                  <th className="px-2 py-1 border">Player</th>
                  <th className="px-2 py-1 border">Alliance</th>
                  <th className="px-2 py-1 border">Coords</th>
                </tr>
              </thead>
              <tbody>
                {mapData.map((v, idx) => (
                  <tr key={idx}>
                    <td className="border px-2 py-1">{v.villageName}</td>
                    <td className="border px-2 py-1">{v.playerName}</td>
                    <td className="border px-2 py-1">{v.alliance}</td>
                    <td className="border px-2 py-1">({v.x}|{v.y})</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {activeTab === 'reports' && (
        <div>
          <p className="mb-2">Reports saved: {reports.length}</p>
          <div className="overflow-auto max-h-96 border mb-4">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-1 border">Defender</th>
                  <th className="px-2 py-1 border">Attacker</th>
                  <th className="px-2 py-1 border">Landing</th>
                  <th className="px-2 py-1 border">Distance</th>
                  <th className="px-2 py-1 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id} className="hover:bg-gray-100">
                    <td className="border px-2 py-1">{r.defender}</td>
                    <td className="border px-2 py-1">{r.attacker}</td>
                    <td className="border px-2 py-1">{new Date(r.landing).toLocaleString('en-US', { timeZone: 'Asia/Bangkok' })}</td>
                    <td className="border px-2 py-1">{r.distance.toFixed(2)}</td>
                    <td className="border px-2 py-1 text-center">
                      <button className="underline text-blue-600" onClick={() => handleFindDefense(r)}>Find Defense</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {eligibleVillages.length > 0 && defenseReportId && (
            <div>
              <p className="mb-2">Villages in alliance {defenderAlliance} that can arrive in time: {eligibleVillages.length}</p>
              <div className="overflow-auto max-h-96 border">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      <th className="px-2 py-1 border">Village</th>
                      <th className="px-2 py-1 border">Player</th>
                      <th className="px-2 py-1 border">Coords</th>
                      <th className="px-2 py-1 border">Unit</th>
                      <th className="px-2 py-1 border">Travel Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eligibleVillages.map((v, idx) => (
                      <tr key={idx}>
                        <td className="border px-2 py-1">{v.villageName}</td>
                        <td className="border px-2 py-1">{v.playerName}</td>
                        <td className="border px-2 py-1">({v.x}|{v.y})</td>
                        <td className="border px-2 py-1">{v.unit}</td>
                        <td className="border px-2 py-1">{v.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
