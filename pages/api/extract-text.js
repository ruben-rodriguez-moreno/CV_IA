import pdfParse from 'pdf-parse'
import fs from 'fs/promises'
import path from 'path'
import { updateJobStatus } from '../../../lib/jobs'     // tu helper para actualizar el estado
// opcionalmente: import db from '../../../lib/db'      // si guardas en BD

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { fileUrl, jobId } = req.body
  if (!fileUrl || !jobId) {
    return res.status(400).json({ error: 'Missing fileUrl or jobId' })
  }

  try {
    // 1) Extraes el texto
    const response = await fetch(fileUrl)
    if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`)
    const buffer = Buffer.from(await response.arrayBuffer())
    const data = await pdfParse(buffer)

    // 2) Guardas el resultado en disco (o en BD)
    const outDir = path.join(process.cwd(), 'data', 'analisis')
    await fs.mkdir(outDir, { recursive: true })
    const outFile = path.join(outDir, `${jobId}.json`)
    await fs.writeFile(outFile, JSON.stringify(data, null, 2), 'utf8')

    // 3) Sólo ahora marcas el job como COMPLETED
    await updateJobStatus(jobId, 'completed')

    // 4) Devuelves al front el texto (o un ok)
    return res.status(200).json({ text: data.text })
  } catch (error) {
    console.error('Error extracting text:', error)
    // Si falla, podrías marcar el job como “failed”
    await updateJobStatus(jobId, 'failed')
    return res.status(500).json({ error: 'Failed to extract text', details: error.message })
  }
}
