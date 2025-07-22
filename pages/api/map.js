export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const response = await fetch('https://ts5.x1.asia.travian.com/map.sql')
    const sql = await response.text()
    const villages = parseMapSql(sql)
    res.status(200).json({ villages })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to load map data' })
  }
}

function parseMapSql(sql) {
  const lines = sql.split('\n')
  const villages = []
  const regex = /INSERT INTO `x_world` VALUES \(\d+,(-?\d+),(-?\d+),\d+,\d+,'([^']*)',\d+,'([^']*)',\d+,'([^']*)'/
  for (const line of lines) {
    const m = regex.exec(line)
    if (m) {
      villages.push({
        x: Number(m[1]),
        y: Number(m[2]),
        village: m[3],
        player: m[4],
        alliance: m[5] === 'NULL' ? '' : m[5],
      })
    }
  }
  return villages
}
