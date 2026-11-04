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


const createGroupJob = async (req, res) => {
    const {
        platformId,
        groupId,
        since,
        until
    } = req.body

    try {
        const job = await jobService.createGroupJob({
            platformId,
            groupId,
            since,
            until
        })

        return res.json({
            success: true,
            message: "Group Job berhasil dibuat",
            data: job
        })
    } catch (err) {
        console.error(err)

        return res.status(400).json({
            success: false,
            message: err.message || "Gagal membuat Group Job",
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
            message: err.message,
            data: null
        })
    }
}


const getJobLog = async (req, res) => {
    const id = Number(req.params.id)
    try {
        const log = await jobService.getJobLog(id)
        if(!log) throw new Error("Job Id Tidak Valid");
        
        return res.json({
            success: true,
            message: "log berhasil diambil",
            data: log
        })

    } catch (err) {
        console.error(err)

        const statusCode = err.code === "ENOENT" ? 404 : 400

        return res.status(statusCode).json({
            success: false,
            message: err.code === "ENOENT" ? "File Log Belum Tersedia" : err.message,
            data: null
        })
    }
}


// Mengambil daftar Project ID yang memiliki log individual.
const getGroupProjectLogs = async (req, res) => {
    try {
        const result = await jobService.getGroupProjectLogs(
            req.params.id
        )

        return res.json({
            success: true,
            message: 'Daftar log project berhasil diambil',
            data: result
        })

    } catch (err) {
        console.error(err)

        const statusCode = err.code === 'ENOENT' ? 404 : 400

        return res.status(statusCode).json({
            success: false,
            message: err.code === 'ENOENT'
                ? 'Folder log project belum tersedia'
                : err.message,
            data: null
        })
    }
}


// Mengambil isi log berdasarkan Project ID.
const getGroupProjectLog = async (req, res) => {
    try {
        const result = await jobService.getGroupProjectLog(
            req.params.id,
            req.params.projectId
        )

        return res.json({
            success: true,
            message: 'Log project berhasil diambil',
            data: result
        })

    } catch (err) {
        console.error(err)

        const statusCode = err.code === 'ENOENT' ? 404 : 400

        return res.status(statusCode).json({
            success: false,
            message: err.code === 'ENOENT'
                ? 'File log project belum tersedia'
                : err.message,
            data: null
        })
    }
}


export default {
    createProjectJob,
    createGroupJob,
    getJobs,
    stopJobCrawler,
    getJobLog,
    getGroupProjectLogs,
    getGroupProjectLog
}
    