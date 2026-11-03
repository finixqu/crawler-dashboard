import fs from "node:fs/promises"
import path from "node:path"

import jobRepository from "../repositories/job.repository.js"
import crawlerService from "./crawler.service.js"
import groupService from "./group.service.js"
import tmuxService from "./tmux.service.js"
import logService from "./log.service.js"

// Memantau status job.
const monitorJob = async (jobId, sessionName, exitFile) => {
    while (true) {
        try {
            const exitCodeText = await fs.readFile(exitFile, "utf8")
            const exitCode = Number(exitCodeText.trim())

            if (!Number.isInteger(exitCode)) {
                throw new Error(`Exit code tidak valid: ${exitCodeText}`)
            }

            if (exitCode === 0) {
                await jobRepository.updateFinished(jobId, "success")
            } else {
                await jobRepository.updateFinished(
                    jobId,
                    "failed",
                    `Crawler berhenti dengan exit code ${exitCode}`
                )
            }

            await fs.rm(exitFile, { force: true })
            return

        } catch (err) {
            if (err.code !== "ENOENT") {
                throw err
            }
        }

        const sessionExist = await tmuxService.hasSession(sessionName)

        if (!sessionExist) {
            const job = await jobRepository.findById(jobId)

            if (job?.error_message === "Crawler Di Hentikan") {
                await jobRepository.updateFinished(
                    jobId,
                    "failed",
                    "Crawler Di Hentikan"
                )
                return
            }

            await jobRepository.updateFinished(
                jobId,
                "failed",
                "Sesi tmux berakhir sebelum exit code tercatat"
            )

            return
        }

        await new Promise(resolve => setTimeout(resolve, 2000))
    }
}


// Menjalankan Project Job.
const startProjectCrawler = async (jobId) => {
    const job = await jobRepository.findById(Number(jobId))

    if (!job) {
        throw new Error("Job tidak ada")
    }

    const sessionName = `crawler-job-${job.id}`
    const sessionExist = await tmuxService.hasSession(sessionName)

    if (sessionExist) {
        throw new Error(`Tmux session ${sessionName} masih aktif`)
    }

    try {
        const crawlerCommand = crawlerService.buildCrawlerCommand({
            platform: job.platform,
            projectId: job.project_id,
            since: job.since,
            until: job.until
        })

        const log = await logService.createJobLog(job.project_id, job.id)

        const commandProses = [
            crawlerCommand.command,
            ...crawlerCommand.args
        ]
            .map(crawlerService.shellQuote)
            .join(" ")

        const exitFile = `${log.logPath}.exit.log`

        const commandDenganLog = [
            "set -o pipefail",
            `${commandProses} 2>&1 | tee -a ${crawlerService.shellQuote(log.logPath)}`,
            "exit_code=$?",
            `printf '%s\\n' "$exit_code" > ${crawlerService.shellQuote(exitFile)}`,
            'exit "$exit_code"'
        ].join("; ")

        await jobRepository.updateStarting(
            job.id,
            sessionName,
            log.logPath,
            commandDenganLog
        )

        await fs.rm(exitFile, { force: true })

        await tmuxService.createSession(sessionName)

        await tmuxService.sendCommand(
            sessionName,
            commandDenganLog
        )

        await jobRepository.updateRunning(job.id)

        void monitorJob(job.id, sessionName, exitFile).catch(async err => {
            console.error("Gagal memonitor job:", err)

            try {
                await jobRepository.updateFinished(
                    job.id,
                    "failed",
                    err.message
                )
            } catch (updateError) {
                console.error("Gagal memperbarui status job:", updateError)
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
            "failed",
            err.message
        )

        throw err
    }
}


// Menjalankan Group Job menggunakan GNU Parallel.
const startGroupCrawler = async (jobId, concurrency = 10) => {
    const job = await jobRepository.findById(Number(jobId))

    if (!job) {
        throw new Error("Job tidak ada")
    }

    if (job.mode !== "group" || !job.group_id) {
        throw new Error("Job ini bukan Group Job")
    }

    const parsedConcurrency = Number(concurrency)

    if (
        !Number.isInteger(parsedConcurrency) ||
        parsedConcurrency < 1 ||
        parsedConcurrency > 50
    ) {
        throw new Error("Concurrency harus berupa angka 1 sampai 50")
    }

    const sessionName = `crawler-job-${job.id}`
    const sessionExist = await tmuxService.hasSession(sessionName)

    if (sessionExist) {
        throw new Error(`Tmux session ${sessionName} masih aktif`)
    }

    try {
        // Membaca daftar project ID dari file TXT.
        const group = await groupService.readGroupProjects(job.group_id)

        // Membuat log khusus Group Job.
        const log = await logService.createGroupJobLog(
            job.group_id,
            job.id
        )

        // Membentuk satu perintah Docker untuk setiap project ID.
        const commands = group.projectIds.map(projectId => {
            const crawlerCommand = crawlerService.buildCrawlerCommand({
                platform: job.platform,
                projectId,
                since: job.since,
                until: job.until
            })

            return [
                crawlerCommand.command,
                ...crawlerCommand.args
            ]
                .map(crawlerService.shellQuote)
                .join(" ")
        })

        // Menyimpan seluruh perintah ke file khusus job.
        const commandsFile = `${log.logPath}.commands.txt`

        await fs.writeFile(
            commandsFile,
            `${commands.join("\n")}\n`,
            "utf8"
        )

        const exitFile = `${log.logPath}.exit.log`

        // GNU Parallel membaca command dari file.
        const parallelCommand = [
            "/usr/bin/parallel",
            "--line-buffer",
            "-j",
            String(parsedConcurrency),
            "<",
            crawlerService.shellQuote(commandsFile)
        ].join(" ")

        const commandDenganLog = [
            "set -o pipefail",
            `${parallelCommand} 2>&1 | tee -a ${crawlerService.shellQuote(log.logPath)}`,
            "exit_code=$?",
            `printf '%s\\n' "$exit_code" > ${crawlerService.shellQuote(exitFile)}`,
            'exit "$exit_code"'
        ].join("; ")

        await jobRepository.updateStarting(
            job.id,
            sessionName,
            log.logPath,
            commandDenganLog
        )

        await fs.rm(exitFile, { force: true })

        await tmuxService.createSession(sessionName)

        await tmuxService.sendCommand(
            sessionName,
            commandDenganLog
        )

        await jobRepository.updateRunning(job.id)

        // Memantau hasil GNU Parallel.
        void monitorJob(job.id, sessionName, exitFile).catch(async err => {
            console.error("Gagal memonitor Group Job:", err)

            try {
                await jobRepository.updateFinished(
                    job.id,
                    "failed",
                    err.message
                )
            } catch (updateError) {
                console.error(
                    "Gagal memperbarui status Group Job:",
                    updateError
                )
            }
        })

        return {
            jobId: job.id,
            groupId: job.group_id,
            groupName: group.groupName,
            totalProject: group.totalProject,
            concurrency: parsedConcurrency,
            sessionName,
            logPath: log.logPath,
            commandsFile,
            command: commandDenganLog
        }

    } catch (err) {
        await jobRepository.updateFinished(
            job.id,
            "failed",
            err.message
        )

        throw err
    }
}


// Menentukan jenis job berdasarkan mode di database.
const startCrawler = async (jobId, concurrency = 10) => {
    const job = await jobRepository.findById(Number(jobId))

    if (!job) {
        throw new Error("Job tidak ada")
    }

    if (job.mode === "group") {
        return startGroupCrawler(jobId, concurrency)
    }

    // Mempertahankan kompatibilitas Project Job.
    return startProjectCrawler(jobId)
}


export default {
    startProjectCrawler,
    startGroupCrawler,
    startCrawler
}