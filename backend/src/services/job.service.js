import platformRepository from '../repositories/platform.repository.js'
import jobRepository from '../repositories/job.repository.js'
import tmuxService from './tmux.service.js'
import logService from './log.service.js'

const createProjectJob = async ({ platformId, projectId, since, until}) => {
    //verifikasi platform
    if(!platformId) throw new Error('Platform wajib dipilih')

    //verifikasi project
    if(!projectId) throw new Error('Project harus di isi')
    
    if (!since) throw new Error('Since wajib diisi.')

    if (!until) throw new Error('Until wajib diisi.')


    const startDate = new Date(since)

    const endDate = new Date(until)

    //verifikasi tanggal
    if (
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime())
    ) {
        throw new Error('Format tanggal tidak valid.')
    }


    if (startDate > endDate) throw new Error('Until harus lebih besar dari Since.')

        //cari pilihan platform yg ada
    const platform = await platformRepository.findById(platformId)

    if (!platform) throw new Error('Platform tidak ditemukan.')


    const jobId = await jobRepository.createProjectJob({
            platformId,
            projectId,
            since,
            until
        })

    return jobRepository.findById(jobId)

}

//disertai filtering
const findAllJobs = async (filters = {}) => {
    return jobRepository.findAll(filters)
}

const stopJobCrawler = async (jobId) => {
    const id = Number(jobId)

    if(!Number.isInteger(id) || id <= 0) throw new Error("Job id Tidak Valid");
    
    const job = await jobRepository.findByid(id)

    if(!job) throw new Error("Job Tidak Ada");

    //validasi untuk status job
    if(!["starting", "running"].includes(job.status)){
        throw new Error("Hanya job yang sedang berjalan yang bisa dihentikan");
    }

    const sessionName = job.tmux_session || `crawler-job-${job.id}`

    const sessionExist = await tmuxService.hasSession(sessionName)

    if(sessionExist){
        await tmuxService.killSession(sessionName)
    }

    await jobRepository.updateFinished(
        job.id,
        'failed',
        'Crawler Di Hentikan'
    )

    return {
        jobId: job.id,
        status: 'failed',
        message: 'Crawler Berhasil Dihentikan'
    }

}


//untuk mengambil log project
const getJobLog = async (jobId) => {
    const id = Number(jobId)

    if(!Number.isInteger(id) || id <= 0) throw new Error("Job Id Tidak Valid");
    
    const job = await jobRepository.findById(id)

    if(!job) throw new Error("Job Tidak ditemukan");

    const log = await logService.getJobLog(job.log_path)
    
    return {
        jobId: job.id,
        projectId: job.project_id,
        status: job.status,
        errorMessage: job.error_message,
        content: log.content,
        truncated: log.truncated
    }
}

export default {
    createProjectJob,
    findAllJobs,
    getJobLog
}