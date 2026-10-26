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
        res.json({
            success: false,
            message: "data tidak ditemukan",
            data: []
        })
    }
}



export default {
    createProjectJob
}