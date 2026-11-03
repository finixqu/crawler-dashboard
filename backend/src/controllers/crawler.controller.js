import crawlerRunService from "../services/crawler-run.service.js"

async function startCrawler(req, res) {
    try {
        const jobId = Number(req.body.jobId)
        const concurrency = req.body.concurrency ?? 10

        if (!Number.isInteger(jobId) || jobId <= 0) {
            return res.status(400).json({
                success: false,
                message: "jobId wajib di isi"
            })
        }

        const result = await crawlerRunService.startCrawler(
            jobId,
            concurrency
        )

        if (!result) {
            throw new Error("process gagal")
        }

        return res.status(202).json({
            success: true,
            message: "data berhasil di process",
            data: result
        })

    } catch (err) {
        console.error(err)

        return res.status(500).json({
            success: false,
            message: err.message || "Gagal Memulai Crawler"
        })
    }
}

export { startCrawler }