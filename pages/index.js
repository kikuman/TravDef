import { useState } from 'react'

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

function parseCoords(coords) {
  const [x, y] = coords.split('|').map(Number)
  return { x, y }
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

export default function Home() {
  const [form, setForm] = useState({
    defender: '',
    attacker: '',
    landing: '',
    firstSeen: '',
    tribe: 'Teuton',
    reporter: '',
  })
  const [result, setResult] = useState(null)

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const res = await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (res.ok) {
      setResult(data)
    } else {
      alert(data.error || 'Error')
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Travian Defense Reporter</h1>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input name="defender" placeholder="Defender coords 123|456" className="border p-2 w-full" value={form.defender} onChange={handleChange} required />
        <input name="attacker" placeholder="Attacker coords 234|567" className="border p-2 w-full" value={form.attacker} onChange={handleChange} required />
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
    </div>
  )
}
