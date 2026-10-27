import { spawnProcess } from "./process.service.js";
import { crawlerConfig } from "../config/crawler.config.js";

function buildTiktokCommand ({ projectId, since, until }) {

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
        since,

        '--until',
        until,

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

export { buildTiktokCommand }