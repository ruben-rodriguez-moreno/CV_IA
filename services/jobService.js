
import fs from 'fs/promises'
import path from 'path'

/**
 * Actualiza el estado de un job escribiendo un JSON en disco.
 * @param {string} jobId 
 * @param {'pending'|'completed'|'failed'} status 
 */
export async function updateJobStatus(jobId, status) {
  const statusDir = path.join(process.cwd(), 'data', 'jobStatus')
  await fs.mkdir(statusDir, { recursive: true })
  const statusFile = path.join(statusDir, `${jobId}.json`)
  const payload = {
    jobId,
    status,
    updatedAt: new Date().toISOString()
  }
  await fs.writeFile(statusFile, JSON.stringify(payload, null, 2), 'utf8')
}
