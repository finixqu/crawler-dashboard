import jobRepository from "../repositories/job.repository.js";
import sessionRepository from "../repositories/session.repository.js";
import crawlerService from "./crawler.service.js"
import tmuxService from "./tmux.service.js";

const startProjectCrawler = async (jobId) => {

    //cek apakah data job ada
    const job = await jobRepository.findById(Number(jobId))

    if (!job) throw new Error("Job tidak ada")

    const sessionName = `crawler-job-${job.id}`
    
    //simpan sesion di database
    const sessionId = await sessionRepository.create(Number(jobId), sessionName)

    try {

        //buat kode untuk menghasilkan command
        const crawlerCommand = await crawlerService.buildTiktokCommand({
            projectId : job.project_id,
            since: job.since,
            until: job.until
        })


        //ambil command untuk proses
        const commandProses = [
            crawlerCommand.command,
            crawlerCommand.args
        ]

        //kirim ke tmux
        await tmuxService.sendCommand(
            sessionName,
            commandProses
        )

        //update sesion di repo menjadi running
        await sessionRepository.updateRunning(sessionId)

        return {
            job,
            sessionId,
            sessionName
        }

    } catch (err) {
        await sessionRepository.updateFinished(
            sessionId,
            'failed'
        )

        throw err
    }

}

export default {
    startProjectCrawler
}