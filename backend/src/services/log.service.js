import fs from 'node:fs/promises'
import path from 'node:path'

// import logRepository from '../repositories/log.repository.js'

const LOG_BASE_PATH = '/home/ivohaki/backdate/crawler-dashboard/dashboard-logs'

const createJobLog = async (projectId) => {

    if(!projectId) throw new Error('Project ID Wajib Diisi')

    await fs.mkdir(
        LOG_BASE_PATH,
        {
            recursive: true
        }
    )

    const logPath = path.join(
        LOG_BASE_PATH,
        `${projectId}.log`
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


export default {
    createJobLog,
}