import fs from 'node:fs/promises'

import jobRepository from "../repositories/job.repository.js";
import crawlerService from "./crawler.service.js"
import tmuxService from "./tmux.service.js";
import logService from "./log.service.js";

//gunakan untuk memantau job yang ada
const monitorJob = async (jobId, sessionName, exitFile) => {
    while (true) {
        try {
            const exitCodeText = await fs.readFile(exitFile, 'utf8')
            const exitCode = Number(exitCodeText.trim())

            if (!Number.isInteger(exitCode)) {
                throw new Error(`Exit code tidak valid: ${exitCodeText}`)
            }

            if (exitCode === 0) {
                await jobRepository.updateFinished(jobId, 'success')
            } else {
                await jobRepository.updateFinished(
                    jobId,
                    'failed',
                    `Crawler berhenti dengan exit code ${exitCode}`
                )
            }

            await fs.rm(exitFile, { force: true })
            return
        } catch (err) {
            if (err.code !== 'ENOENT') {
                throw err
            }
        }

        const sessionExist = await tmuxService.hasSession(sessionName)

        if (!sessionExist) {
            const job = await jobRepository.findById(jobId)

            // Jika job dihentikan secara manual, jangan timpa pesannya.
            if (job?.error_message === 'Crawler Di Hentikan') {
                await jobRepository.updateFinished(
                    jobId,
                    'failed',
                    'Crawler Di Hentikan'
                )
                return
            }

            await jobRepository.updateFinished(
                jobId,
                'failed',
                'Sesi tmux berakhir sebelum exit code tercatat'
            )

            return
        }

        await new Promise(resolve => setTimeout(resolve, 2000))
    }
}

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
        const log = await logService.createJobLog(job.project_id, job.id)


        //ambil command untuk proses
        const commandProses = [
            crawlerCommand.command,
            ...crawlerCommand.args
        ].join(' ')

        //buat log gagal atau stop
        const exitFile = `${log.logPath}.exit.log`

        //agar output masuk ke file project.log
        const commandDenganLog = [
            'set -o pipefail',
            `${commandProses} 2>&1 | tee -a "${log.logPath}"`,
            'exit_code=$?',
            `printf '%s\\n' "$exit_code" > "${exitFile}"`,
            'exit "$exit_code"' 
        ].join('; ')


        //tandai job berjalan
        await jobRepository.updateStarting(
            job.id,
            sessionName,
            log.logPath,
            commandDenganLog
        )

        await fs.rm(exitFile, { force: true })


        //buat sesi tmux
        await tmuxService.createSession(sessionName)

        //kirim ke tmux
        await tmuxService.sendCommand(
            sessionName,
            commandDenganLog
        )

        //update sesion di repo menjadi running
        await jobRepository.updateRunning(job.id)

        //digunakan untuk mengecek status tmux yg aktif, apakah akan berhasil atau gagal
        void monitorJob(job.id, sessionName, exitFile).catch(async err => {
            console.error('Gagal memonitor job:', err)

            try {
                await jobRepository.updateFinished(
                    job.id,
                    'failed',
                    err.message
                )
            } catch (updateError) {
                console.error('Gagal memperbarui status job:', updateError)
            }
        })


        return {
            jobId: job.id,
            sessionName,
            command: commandDenganLog
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