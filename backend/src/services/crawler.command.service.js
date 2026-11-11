import { crawlerConfig } from "../config/crawler.config.js";

// Mengamankan setiap argumen agar aman ketika dijalankan melalui shell.
function shellQuote(value) {
    return `'${String(value).replace(/'/g, "'\\''")}'`
}

function formatCrawlerDate(value) {
    if (!value) {
        throw new Error("Masukkan Tanggal")
    }

    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) {
            throw new Error("Tanggal tidak valid")
        }

        const year = value.getFullYear()
        const month = String(value.getMonth() + 1).padStart(2, "0")
        const day = String(value.getDate()).padStart(2, "0")
        const hours = String(value.getHours()).padStart(2, "0")
        const minutes = String(value.getMinutes()).padStart(2, "0")

        return `${year}-${month}-${day} ${hours}:${minutes}`
    }

    if (typeof value === "string") {
        // Format YYYY-MM-DD HH:mm atau YYYY-MM-DDTHH:mm
        const dateTimeMatch = value.match(
            // /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})$/
            /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::\d{2})?$/
        )

        if (dateTimeMatch) {
            return `${dateTimeMatch[1]} ${dateTimeMatch[2]}`
        }

        // Format ISO dengan waktu.
        const isoMatch = value.match(
            /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/
        )

        if (isoMatch) {
            return `${isoMatch[1]} ${isoMatch[2]}`
        }

        // Format YYYY-MM-DD.
        const dateOnlyMatch = value.match(/^(\d{4}-\d{2}-\d{2})$/)

        if (dateOnlyMatch) {
            return `${dateOnlyMatch[1]} 00:00`
        }
    }

    throw new Error(`Format tanggal tidak valid: ${value}`)
}

function buildCrawlerCommand({ platform, projectId, since, until }) {
    if (!projectId) {
        throw new Error("Wajib Isi ID")
    }

    if (!since) {
        throw new Error("Wajib isi since")
    }

    if (!until) {
        throw new Error("Wajib isi until")
    }

    const config = crawlerConfig[platform]

    if (!config) {
        throw new Error(`Platform tidak didukung: ${platform}`)
    }

    const formattedSince = formatCrawlerDate(since)
    const formattedUntil = formatCrawlerDate(until)

    const args = [
        "run",
        "--rm"
    ]

    if (config.networkHost) {
        args.push("--network", "host")
    }

    args.push(
        "-v",
        `${config.config}:${config.configContainer}`,
        config.image,
        "--config",
        config.configContainer,
        // Twitter membutuhkan dua token command.
        ...String(config.command).trim().split(/\s+/)
    )

    switch (platform) {
        case "tiktok":
            args.push(
                "--since", formattedSince,
                "--until", formattedUntil,
                "--rapidapi",
                "--limit-comment", "0",
                "--no-proxy",
                "--lang=id",
                "--project-id", String(projectId)
            )
            break

        case "youtube":
            args.push(
                "--since", formattedSince,
                "--until", formattedUntil,
                "--lang=id",
                "--limit-comment", "100",
                "--no-proxy",
                "--project-id", String(projectId)
            )
            break

        case "news":
            args.push(
                "--since", formattedSince,
                "--until", formattedUntil,
                "-c", "10",
                "--no-proxy",
                "--project-id", String(projectId)
            )
            break

        case "facebook":
            args.push(
                "--limit-comment=100",
                "--since", formattedSince,
                "--until", formattedUntil,
                "--no-proxy",
                "--project-id", String(projectId)
            )
            break

        case "instagram":
            args.push(
                "--since", formattedSince,
                "--until", formattedUntil,
                "--limit-comment", "0",
                "--lang=id",
                "--no-proxy",
                "--rapidapi",
                "--project-id", String(projectId)
            )
            break

        case "threads":
            args.push(
                "--lang=id",
                "--since", formattedSince,
                "--until", formattedUntil,
                "--limit-comment", "0",
                "--no-proxy",
                "--project-id", String(projectId)
            )
            break

        case "twitter":
            args.push(
                "--lang=id",
                "--since", formattedSince,
                "--until", formattedUntil,
                "--project", String(projectId)
            )
            break

        default:
            throw new Error(`Platform tidak didukung: ${platform}`)
    }

    return {
        command: "docker",
        args
    }
}

export default {
    buildCrawlerCommand,
    shellQuote
}