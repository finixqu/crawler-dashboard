import { spawnProcess } from "./process.service.js";
import { crawlerConfig } from "../config/crawler.config.js";

function buildTiktokCommand ({ projectId, since, until }) {

    function formatCrawlerDate(value) {
        if (value instanceof Date) {
            if (Number.isNaN(value.getTime())) {
                throw new Error('Tanggal tidak valid')
            }

            const year = value.getFullYear()
            const month = String(value.getMonth() + 1).padStart(2, '0')
            const day = String(value.getDate()).padStart(2, '0')
            const hours = String(value.getHours()).padStart(2, '0')
            const minutes = String(value.getMinutes()).padStart(2, '0')

            return `${year}-${month}-${day} ${hours}:${minutes}`
        }

        if (typeof value === 'string') {
            // Sudah dalam format YYYY-MM-DD HH:mm
            const dateTimeMatch = value.match(
                /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})$/
            )

            if (dateTimeMatch) {
                return `${dateTimeMatch[1]} ${dateTimeMatch[2]}`
            }

            // Format tanggal ISO dengan waktu, termasuk akhiran Z atau offset zona waktu.
            const isoMatch = value.match(
                /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/
            )

            if (isoMatch) {
                return `${isoMatch[1]} ${isoMatch[2]}`
            }

            // Jika hanya tanggal yang diberikan, tentukan waktu default.
            const dateOnlyMatch = value.match(/^(\d{4}-\d{2}-\d{2})$/)

            if (dateOnlyMatch) {
                return `${dateOnlyMatch[1]} 00:00`
            }
        }

        throw new Error(`Format tanggal tidak valid: ${value}`)
    }


    const formatedSince = `"${formatCrawlerDate(since)}"`
    const formatedUntil = `"${formatCrawlerDate(until)}"`

    if (!projectId) throw new Error('Wajib Isi ID')


    if (!since) throw new Error('Wajib isi since')

    if (!until) throw new Error('Wajib isi until')

    

    const config = crawlerConfig.tiktok

    const args = [
        'run',
        '--rm',

        '-v',
        `${config.config}:${config.configContainer}`,

        config.image,

        '--config',
        config.configContainer,

        config.command,

        '--since',
        formatedSince,

        '--until',
        formatedUntil,

        '--rapidapi',

        '--limit-comment',
        '0',

        '--no-proxy',

        '--lang=id',

        '--project-id',
        String(projectId)
    ]

    //kita buat outputnya ini
    return {
        command: 'docker',
        args
    }

}


export default {buildTiktokCommand} 