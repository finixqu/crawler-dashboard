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
        const jobs = await jobService.findAllJobs()

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



export default {
    createProjectJob,
    getJobs
}