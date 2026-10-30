import jobService from '../services/job.service.js'

const createProjectJob = async (req, res) => {
    const {
        platformId,
        projectId,
        since,
        until
    } = req.body
    try {
        const job = await jobService.createProjectJob({
            platformId,
            projectId,
            since,
            until
        })

        return res.json({
            success: true,
            message: "Data Ditampilkan",
            data: job
        })
    } catch (err) {
        console.error(err)
        res.status(400).json({
            success: false,
            message: err.message || "gagal membuat job",
            data: null
        })
    }
}


const getJobs = async (req, res) => {
    try {

        const { projectId, status} = req.query

        const jobs = await jobService.findAllJobs({
            projectId: projectId || null,
            status: status || null
        })

        if(!jobs) throw new Error('gagal mencari data')
        
        return res.json({
            success: true,
            message: "Data Ditemukan",
            data: jobs
        })
    } catch (err) {
        console.error(err)

        return res.status(500).json({
            success: false,
            message: "data error",
            data: []
        })
    }
}


const stopJobCrawler = async (req, res) => {
    const id = Number(req.params.id)
    try {
        const result = await jobService.stopJobCrawler(id)

        if(!result) throw new Error("Job Id Tidak Valid");

        return res.json({
            success: true,
            message: result.message,
            data: result
        })
        
    } catch (err) {
        console.log(err.message)

        return res.status(500).json({
            success: false,
            message: "err.message",
            data: null
        })
    }
}


const getJobLog = async (req, res) => {
    const id = Number(req.params.id)
    try {
        const log = await logService.getJobLog(id)
        if(!log) throw new Error("Job Id Tidak Valid");
        
        return res.json({
            success: true,
            message: "log berhasil diambil",
            data: log
        })

    } catch (err) {
        console.error(err)

        const statusCde = err.message === "ENOENT" ? 404 : 400

        return res.status(statusCode).json({
            success: false,
            message: err.code === "ENOENT" ? "File Log Belum Tersedia" : err.message,
            data: null
        })
    }
}



export default {
    createProjectJob,
    getJobs,
    stopJobCrawler,
    getJobLog
}