import fs from "node:fs/promises"

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

            const job = await jobRepository.findById(jobId)

            if (
                job?.mode === "group" &&
                job?.error_message === "Crawler Di Hentikan"
            ) {
                await jobRepository.updateFinished(
                    jobId,
                    "stopped",
                    "Crawler Di Hentikan"
                )
            } else if (exitCode === 0) {
                await jobRepository.updateFinished(
                    jobId,
                    "success"
                )
            } else {
                await jobRepository.updateFinished(
                    jobId,
                    "failed",
                    `Crawler berhenti dengan exit code ${exitCode}`
                )
            }

            await fs.rm(exitFile, { force: true })

            // Tutup session tmux setelah crawler benar-benar selesai.
            if (await tmuxService.hasSession(sessionName)) {
                await tmuxService.killSession(sessionName)
            }

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
                const finalStatus =
                    job.mode === "group" ? "stopped" : "failed"

                await jobRepository.updateFinished(
                    jobId,
                    finalStatus,
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

        const log = await logService.createJobLog(
            job.project_id,
            job.id
        )

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
                console.error(
                    "Gagal memperbarui status job:",
                    updateError
                )
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

        // Membuat folder untuk menyimpan log setiap project.
        const projectLogsDir = `${log.logPath}.projects`

        await fs.mkdir(projectLogsDir, {
            recursive: true
        })

        // Membentuk perintah Docker dan log individual setiap project.
        const commands = await Promise.all(
            group.projectIds.map(async projectId => {
                const crawlerCommand = crawlerService.buildCrawlerCommand({
                    platform: job.platform,
                    projectId,
                    since: job.since,
                    until: job.until
                })

                // Label unik untuk mengidentifikasi container Group Job.
                crawlerCommand.args.splice(
                    2,
                    0,
                    "--label",
                    `crawler-group-job=${job.id}`
                )

                const dockerCommand = [
                    crawlerCommand.command,
                    ...crawlerCommand.args
                ]
                    .map(crawlerService.shellQuote)
                    .join(" ")

                // Lokasi log khusus project.
                const projectLogPath =
                    `${projectLogsDir}/project-${projectId}.log`

                // Membuat file log baru dan memberikan informasi project.
                await fs.writeFile(
                    projectLogPath,
                    [
                        `Project ID: ${projectId}`,
                        `Group Job ID: ${job.id}`,
                        `Platform: ${job.platform}`,
                        `Since: ${job.since}`,
                        `Until: ${job.until}`,
                        `Command: ${dockerCommand}`,
                        "",
                        "========== CRAWLER OUTPUT ==========",
                        ""
                    ].join("\n"),
                    "utf8"
                )

                // Setiap crawler mengirim output ke log individual.
                const commandDenganLog =
                    `bash -o pipefail -c ${
                        crawlerService.shellQuote(
                            `${dockerCommand} 2>&1 | tee -a ${crawlerService.shellQuote(projectLogPath)}`
                        )
                    }`

                return commandDenganLog
            })
        )

        // Menyimpan seluruh perintah ke file khusus job.
        const commandsFile = `${log.logPath}.commands.txt`

        await fs.writeFile(
            commandsFile,
            `${commands.join("\n")}\n`,
            "utf8"
        )


        const exitFile = `${log.logPath}.exit.log`
        const runnerFile = `${log.logPath}.run.sh`

        // Script Bash untuk menjalankan dan menghentikan Group Job.
        const runnerScript = `#!/usr/bin/env bash

set -o pipefail

EXIT_FILE=${crawlerService.shellQuote(exitFile)}
COMMANDS_FILE=${crawlerService.shellQuote(commandsFile)}
LOG_FILE=${crawlerService.shellQuote(log.logPath)}
JOB_ID=${crawlerService.shellQuote(job.id)}

write_exit() {
    printf '%s\\n' "$1" > "$EXIT_FILE"
}

stop_group_containers() {
    echo "Menghentikan container Group Job $JOB_ID..."

    local empty_checks=0

    while [ "$empty_checks" -lt 3 ]; do
        local container_ids
        container_ids=$(docker ps -aq --filter "label=crawler-group-job=$JOB_ID")

        if [ -n "$container_ids" ]; then
            empty_checks=0
            docker stop --time 5 $container_ids || true
        else
            empty_checks=$((empty_checks + 1))
            sleep 1
        fi
    done

    echo "Penghentian container Group Job selesai."
}

handle_signal() {
    local signal="$1"
    local exit_code=130

    if [ "$signal" = "TERM" ]; then
        exit_code=143
    fi

    trap - INT TERM

    stop_group_containers
    write_exit "$exit_code"

    exit "$exit_code"
}

trap 'handle_signal INT' INT
trap 'handle_signal TERM' TERM

/usr/bin/parallel --line-buffer -j ${parsedConcurrency} < "$COMMANDS_FILE" 2>&1 | tee -a "$LOG_FILE"

exit_code=$?

write_exit "$exit_code"

exit "$exit_code"
`

        await fs.writeFile(
            runnerFile,
            runnerScript,
            "utf8"
        )

        const commandDenganLog =
            `bash ${crawlerService.shellQuote(runnerFile)}`

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