import jobRepository from "../repositories/job.repository.js";
import crawlerService from "./crawler.service.js"
import tmuxService from "./tmux.service.js";
import logService from "./log.service.js";

const startProjectCrawler = async (jobId) => {

    //cek apakah data job ada
    const job = await jobRepository.findById(Number(jobId))

    if (!job) throw new Error("Job tidak ada")

    const sessionName = `crawler-job-${job.id}`

    const sessionExist = await tmuxService.hasSession(sessionName)

    if (sessionExist) throw new Error(`Tmux session ${sessionName} masih aktif`)
    


    try {

        //buat kode untuk menghasilkan command
        const crawlerCommand = await crawlerService.buildTiktokCommand({
            projectId : job.project_id,
            since: job.since,
            until: job.until
        })


        //buat log
        const log = await logService.createJobLog(job.project_id)


        //ambil command untuk proses
        const commandProses = [
            crawlerCommand.command,
            ...crawlerCommand.args
        ].join(' ')


        //tandai job berjalan
        await jobRepository.updateStarting(
            job.id,
            null,
            null,
            commandProses
        )


        //buat sesi tmux
        await tmuxService.createSession(sessionName)

        //kirim ke tmux
        await tmuxService.sendCommand(
            sessionName,
            commandProses
        )

        //update sesion di repo menjadi running
        await jobRepository.updateRunning(job.id)

        return {
            jobId: job.id,
            sessionName,
            command: commandProses
        }

    } catch (err) {
        await jobRepository.updateFinished(
            job.id,
            'failed',
            err.message
        )

        throw err
    }

}

export default {
    startProjectCrawler
}