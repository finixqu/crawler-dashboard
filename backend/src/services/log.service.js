import fs from 'node:fs/promises'
import path from 'node:path'

import logRepository from '../repositories/log.repository'

const LOG_BASE_PATH = '/home/ivohaki/backdate/dashboard-logs'

const createJobLog = async (jobId) => {

    const jobDirectory = path.join(JOB_BASE_PATH, `job-${jobId}`)

    await fs.mkdir(
        jobDirectory,
        {
            recursive: true
        }
    )

    const logPath = path.join(
        jobDirectory,
        'crawler.log'
    )
    
    await fs.writeFile(
        logPath,
        '',
        {
            flag: 'a'
        }
    )

    const logId = await logRepository.create({
        jobId,
        logPath,
    })

    return {
        logId,
        logPath
    }
}


export default {
    createJobLog,
}