export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const response = await fetch('https://ts5.x1.asia.travian.com/map.sql')
    if (!response.ok) throw new Error('download failed')
    const text = await response.text()
    const villages = []
    text.split('\n').forEach(line => {
      if (!line.startsWith('INSERT INTO')) return
      const m = line.match(/\((.*)\)/)
      if (!m) return
      const vals = m[1].match(/('[^']*'|NULL|[^,]+)/g)
      if (!vals || vals.length < 10) return
      const x = Number(vals[1])
      const y = Number(vals[2])
      const villageName = vals[5].replace(/^'(.*)'$/, '$1')
      const playerName = vals[7].replace(/^'(.*)'$/, '$1')
      const alliance = vals[9].replace(/^'(.*)'$/, '$1')
      villages.push({ x, y, villageName, playerName, alliance })
    })
    res.status(200).json({ villages })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to load map data' })
  }
}
