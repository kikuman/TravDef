import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const reports = await prisma.attackReport.findMany({
      orderBy: { createdAt: 'desc' },
    })
    res.status(200).json({ reports })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to fetch reports' })
  }
}
