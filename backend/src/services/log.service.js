import fs from 'node:fs/promises'
import path from 'node:path'

// import logRepository from '../repositories/log.repository.js'

const LOG_BASE_PATH = '/home/ivohaki/backdate/crawler-dashboard/dashboard-logs'
const MAX_LOG_SIZE = 100 * 1024
const createJobLog = async (projectId, jobId) => {

    if(!projectId) throw new Error('Project ID Wajib Diisi')

    await fs.mkdir(
        LOG_BASE_PATH,
        {
            recursive: true
        }
    )

    const logPath = path.join(
        LOG_BASE_PATH,
        `job-${jobId}-project-${projectId}.log`
    )
    
    await fs.writeFile(
        logPath,
        '',
        {
            flag: 'a'
        }
    )

    return {
        logPath
    }
}

const readJobLog = async (logPath) => {
    if(!logPath) throw new Error('Log belum tersedia saat ini !')

    const basePath = path.resolve(LOG_BASE_PATH)
    const resolvedPath = path.resolve(logPath)

    if(!resolvedPath.startsWIth(basePath + path.sep)){
        throw new Error('Lokasi Log Tidak Valid')
    }

    const fileHandle = await fs.open(resolvedPath, 'r')

    try {
        const stats = await fileHandle.stat()
        const start = Math.max(0, stats.size - MAX_LOG_SIZE)
        const length = stats.size - start

        const buffer = Buffer.alloc(length)

        await fileHandle.read(buffer, 0, length, start)

        let content = buffer.toString('utf8')
         // Jika file dipotong dari tengah, buang baris pertama yang tidak utuh.
        if (start > 0) {
            const firstNewLine = content.indexOf('\n')
            content = firstNewLine >= 0
                ? content.slice(firstNewLine + 1)
                : content
        }

        return {
            content,
            truncated: start > 0
        }


    } catch (err) {
        console.log(err.message)
        throw err
    } finally {
        await fileHandle.close()
    }
}


export default {
    createJobLog,
    readJobLog
}