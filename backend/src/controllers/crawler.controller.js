import crawlerRunService from "../services/crawler-run.service.js"

async function startCrawler (req, res){

    try {
        const jobId  = Number(req.body.jobId)
        
        if (!jobId) {
            return res.json({
                success: false,
                message: "job id wajib di isi"
            })
        }

        const result = await crawlerRunService.startProjectCrawler(jobId)

        if(!result) throw new Error('process gagal')
        
        return res.json({
            success: true,
            message: "data berhasil di process",
            pid: result
        })
    } catch (err) {
        console.error(err)

        return res.json({
            success: false,
            message: err.message
        })
    }
}

export { startCrawler }