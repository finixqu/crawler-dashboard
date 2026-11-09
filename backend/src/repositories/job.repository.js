import db from '../config/database.js'

const createProjectJob = async ({ platformId, projectId, since, until, scheduledAt = null }) => {
    const sql = `
        INSERT INTO crawler_jobs (
            platform_id,
            mode,
            project_id,
            since,
            until,
            scheduled_at
            status,
            
        )
        VALUES (?, 'project', ?, ?, ?, ?, 'pending' )
    `

    const [result] = await db.execute(sql, [
        platformId,
        projectId,
        since,
        until,
        scheduledAt
    ])

    return result.insertId
}


const createGroupJob = async ({ platformId, groupId, since, until, scheduledAt = null, scheduledConcurency = 10 }) => {
    const sql = `
        INSERT INTO crawler_jobs (
            platform_id,
            mode,
            group_id,
            since,
            until,
            scheduled_at,
            scheduled_concurency,
            status
        )
        VALUES (?, 'group', ?, ?, ?, ?, ? 'pending')
    `

    const [result] = await db.execute(sql, [
        platformId,
        groupId,
        since,
        until,
        scheduledAt,
        scheduledConcurency
    ])

    return result.insertId
}


// Mengambil satu job berdasarkan ID.
const findById = async (id) => {
    const sql = `
        SELECT
            cj.id,
            cj.platform_id,
            cj.mode,
            cj.project_id,
            cj.group_id,
            cj.since,
            cj.until,
            cj.scheduled_at,
            cj.scheduled_concurrency,
            cj.status,
            cj.tmux_session,
            cj.log_path,
            cj.error_message,
            cj.started_at,
            cj.finished_at,
            cj.created_at,

            cp.name AS platform,
            cp.display_name AS platform_name,

            cg.name AS group_name,
            cg.display_name AS group_display_name

        FROM crawler_jobs cj

        INNER JOIN crawler_platforms cp
            ON cp.id = cj.platform_id

        LEFT JOIN crawler_groups cg
            ON cg.id = cj.group_id

        WHERE cj.id = ?

        LIMIT 1
    `

    const [rows] = await db.execute(sql, [id])

    return rows[0] || null
}


// Memperbarui job menjadi starting.
const updateStarting = async (id, tmuxSession, logPath, command) => {
    const sql = `
        UPDATE crawler_jobs
        SET
            status = 'starting',
            tmux_session = ?,
            log_path = ?,
            command = ?,
            started_at = NOW()
        WHERE id = ?
    `

    const [result] = await db.execute(sql, [
        tmuxSession,
        logPath,
        command,
        id
    ])

    return result
}


// Memperbarui job menjadi running.
const updateRunning = async (id) => {
    const sql = `
        UPDATE crawler_jobs
        SET status = 'running'
        WHERE id = ?
    `

    const [result] = await db.execute(sql, [id])

    return result
}


// Memperbarui status akhir job.
const updateFinished = async (id, status, errorMessage = null) => {
    const sql = `
        UPDATE crawler_jobs
        SET
            status = ?,
            error_message = ?,
            finished_at = NOW()
        WHERE id = ?
    `

    const [result] = await db.execute(sql, [
        status,
        errorMessage,
        id
    ])

    return result
}


// Mengambil daftar job.
const findAll = async ({
    projectId = null,
    status = null,
    limit = 50,
    offset = 0
} = {}) => {

    let sql = `
        SELECT
            cj.id,
            cj.platform_id,
            cj.mode,
            cj.project_id,
            cj.group_id,
            cj.since,
            cj.until,
            cj.scheduled_at,
            cj.scheduled_concurrency,
            cj.status,
            cj.tmux_session,
            cj.log_path,
            cj.error_message,
            cj.started_at,
            cj.finished_at,
            cj.created_at,

            cp.name AS platform,
            cp.display_name AS platform_name,

            cg.name AS group_name,
            cg.display_name AS group_display_name

        FROM crawler_jobs cj

        INNER JOIN crawler_platforms cp
            ON cp.id = cj.platform_id

        LEFT JOIN crawler_groups cg
            ON cg.id = cj.group_id
    `

    const conditions = []
    const params = []

    if (projectId) {
        conditions.push('cj.project_id = ?')
        params.push(projectId)
    }

    if (status) {
        conditions.push('cj.status = ?')
        params.push(status)
    }

    if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`
    }

    const parsedLimit = Number(limit)
    const parsedOffset = Number(offset)

    const LIMIT =
        Number.isInteger(parsedLimit) && parsedLimit > 0
            ? Math.min(parsedLimit, 50)
            : 50

    const OFFSET =
        Number.isInteger(parsedOffset) && parsedOffset >= 0
            ? parsedOffset
            : 0

    sql += `
        ORDER BY cj.created_at DESC
        LIMIT ${LIMIT} OFFSET ${OFFSET}
    `

    const [rows] = await db.execute(sql, params)

    return rows
}


const findDueScheduledJobs = async () => {
    const sql = `
        SELECT id
        FROM crawler_jobs
        WHERE status = 'pending'
          AND scheduled_at IS NOT NULL
          AND scheduled_at <= NOW()
        ORDER BY scheduled_at ASC
    `

    const [rows] = await db.execute(sql)

    return rows
}


const findActiveJobs = async () => {
    const sql = `
        SELECT
            id,
            mode,
            status,
            tmux_session,
            log_path,
            error_message
        FROM crawler_jobs
        WHERE status IN ('starting', 'running')
        ORDER BY id ASC
    `

    const [rows] = await db.execute(sql)
    return rows
}


// Menandai job yang diminta berhenti.
const updateStopRequested = async (id) => {
    const sql = `
        UPDATE crawler_jobs
        SET error_message = 'Crawler Di Hentikan'
        WHERE id = ?
          AND status IN ('starting', 'running')
    `

    const [result] = await db.execute(sql, [id])

    return result.affectedRows > 0
}


const countAll = async ({ projectId, status}) => {
    let sql = `
        SELECT COUNT(*) AS total
        FROM crawler_jobs cj
    `

    const conditions = []
    const params = []

    if(projectId) {
        conditions.push('cj.project_id = ?')
        params.push(projectId)
    }

    if(status) {
        conditions.push('cj.status = ?')
        params.push(status)
    }

    if (conditions.length > 0){
        sql += `
            WHERE ${conditions.join(' AND ')}
        `
    }

    const [rows] = await db.execute(sql, params)

    return Number(rows[0]?.total || null)
}


export default {
    createProjectJob,
    createGroupJob,
    findById,
    updateStarting,
    updateRunning,
    updateStopRequested,
    updateFinished,
    findAll,
    countAll,
    findActiveJobs,
    findDueScheduledJobs
}