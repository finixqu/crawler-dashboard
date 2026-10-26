import { startTiktokCrawler } from "../services/crawler.service.js";

async function startCrawler (req, res){
    try {
        const { projectId, since, until } = req.body 

        const process = await startTiktokCrawler({ projectId, since, until })

        if(!process) throw new Error('process gagal')
        
        return res.json({
            success: true,
            message: "data berhasil di process",
            pid: process.spawnargs
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