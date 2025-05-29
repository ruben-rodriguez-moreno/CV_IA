import pdfParse from 'pdf-parse'
import fs from 'fs/promises'
import path from 'path'
import { updateJobStatus } from '../../services/jobService'  // Asegúrate de tener esta función

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { fileUrl, jobId } = req.body
  if (!fileUrl || !jobId) {
    return res.status(400).json({ error: 'Missing fileUrl or jobId' })
  }

  try {
    // 1) Extrae el PDF
    const response = await fetch(fileUrl)
    if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`)
    const buffer = Buffer.from(await response.arrayBuffer())
    const data = await pdfParse(buffer)

    // 2) Guarda resultado
    const outDir = path.join(process.cwd(), 'data', 'analisis')
    await fs.mkdir(outDir, { recursive: true })
    const outFile = path.join(outDir, `${jobId}.json`)
    await fs.writeFile(outFile, JSON.stringify(data, null, 2), 'utf8')

    // 3) Marca como COMPLETED
    await updateJobStatus(jobId, 'completed', data.text)

    // 4) Devuelve el texto extraído
    return res.status(200).json({ text: data.text })

  } catch (error) {
    console.error('Error extracting text:', error)

    // Marca como FAILED
    try {
      await updateJobStatus(jobId, 'failed')
    } catch (e) {
      console.error('Error updating job status to failed:', e)
    }

    return res.status(500).json({ error: 'Failed to extract text', details: error.message })
  }
}
