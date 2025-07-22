export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const response = await fetch('https://ts5.x1.asia.travian.com/map.sql')
    if (!response.ok) throw new Error('Failed to fetch map data')
    const text = await response.text()
    const villages = parseMap(text)
    res.status(200).json({ villages })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to load map data' })
  }
}

function parseMap(text) {
  const regex = /INSERT INTO `x_world` VALUES \(([^)]+)\);/g
  const villages = []
  const clean = s => s.replace(/^'(.*)'$/, '$1').replace(/''/g, "'")
  for (const m of text.matchAll(regex)) {
    const values = m[1].split(/,(?=(?:[^']*'[^']*')*[^']*$)/)
    const [, x, y, , , name, , player, , alliance] = values
    villages.push({
      name: clean(name),
      player: clean(player),
      x: parseInt(x, 10),
      y: parseInt(y, 10),
      alliance: clean(alliance),
    })
  }
  return villages
}
