import platformRepository from '../repositories/platform.repository.js'
import jobRepository from '../repositories/job.repository.js'
import tmuxService from './tmux.service.js'
import logService from './log.service.js'
import groupRepository from '../repositories/group.repository.js'

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


//untuk group job
const createGroupJob = async ({ platformId, groupId, since, until }) => {
    // Validasi platform
    const parsedPlatformId = Number(platformId)

    if (!Number.isInteger(parsedPlatformId) || parsedPlatformId <= 0) {
        throw new Error('Platform wajib dipilih')
    }

    const platform = await platformRepository.findById(parsedPlatformId)

    if (!platform) {
        throw new Error('Platform tidak ditemukan')
    }

    // Validasi group
    const parsedGroupId = Number(groupId)

    if (!Number.isInteger(parsedGroupId) || parsedGroupId <= 0) {
        throw new Error('Group wajib dipilih')
    }

    const group = await groupRepository.findById(parsedGroupId)

    if (!group || !group.is_active) {
        throw new Error('Group tidak ditemukan atau tidak aktif')
    }

    // Validasi tanggal
    if (!since) throw new Error('Since wajib diisi')

    if (!until) throw new Error('Until wajib diisi')

    const startDate = new Date(since)
    const endDate = new Date(until)

    if (
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime())
    ) {
        throw new Error('Format tanggal tidak valid')
    }

    if (startDate > endDate) {
        throw new Error('Until harus lebih besar dari Since')
    }

    // Simpan Group Job
    const jobId = await jobRepository.createGroupJob({
        platformId: parsedPlatformId,
        groupId: parsedGroupId,
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

    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("Job id Tidak Valid")
    }

    const job = await jobRepository.findById(id)

    if (!job) {
        throw new Error("Job Tidak Ada")
    }

    if (!["starting", "running"].includes(job.status)) {
        throw new Error(
            "Hanya job yang sedang berjalan yang bisa dihentikan"
        )
    }

    const sessionName = job.tmux_session || `crawler-job-${job.id}`

    // Tandai bahwa job diminta berhenti.
    const stopRequested = await jobRepository.updateStopRequested(job.id)

    if (!stopRequested) {
        throw new Error("Permintaan penghentian job gagal diproses")
    }

    const sessionExist = await tmuxService.hasSession(sessionName)

    if (job.mode === "group") {

        // Group Job: kirim Ctrl+C agar GNU Parallel
        // menerima sinyal penghentian.
        if (sessionExist) {
            await tmuxService.sendInterrupt(sessionName)
        } else {
            await jobRepository.updateFinished(
                job.id,
                "stopped",
                "Crawler Di Hentikan"
            )
        }

        return {
            jobId: job.id,
            status: sessionExist ? "running" : "stopped",
            message: sessionExist
                ? "Permintaan penghentian Group Job berhasil dikirim"
                : "Group Job sudah dihentikan"
        }
    }

    // Project Job: pertahankan mekanisme lama.
    if (sessionExist) {
        await tmuxService.killSession(sessionName)
    }

    await jobRepository.updateFinished(
        job.id,
        "failed",
        "Crawler Di Hentikan"
    )

    return {
        jobId: job.id,
        status: "failed",
        message: "Crawler Berhasil Dihentikan"
    }
}

//untuk mengambil log project
const getJobLog = async (jobId) => {
    const id = Number(jobId)

    if(!Number.isInteger(id) || id <= 0) throw new Error("Job Id Tidak Valid");
    
    const job = await jobRepository.findById(id)

    if(!job) throw new Error("Job Tidak ditemukan");

    const log = await logService.readJobLog(job.log_path)
    
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
    createGroupJob,
    findAllJobs,
    stopJobCrawler,
    getJobLog
}