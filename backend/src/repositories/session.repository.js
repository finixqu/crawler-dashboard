import db from '../config/database.js'

const create = async (jobId, sessionName) => {
    const sql = `
        INSERT INTO crawler_sessions (
            job_id, session_name, status
        )
        VALUES (?, ?, 'created')
    `

    const [result] = await db.execute(sql, [jobId, sessionName])

    return result.insertId
}


const findByJobId = async (id) => {
    const sql = `
        SELECT 
            id, job_id, session_name, status, created_at, started_at, finished_at
        FROM crawler_sessions
        WHERE job_id = ?
        ORDER BY id DESC
        LIMIT 1
    `

    const [rows] = await db.execute(sql, [id])

    return rows[0] || null
}

const updateRunning = async (id) => {
    const sql = `
        UPDATE crawler_sessions
        SET
            status = 'running',
            started_at = NOW()
        WHERE id = ?
    `

    const result = await db.execute(sql, [id])

    return result
}

const updateFinished = async (id, status) => {
    const sql = `
        UPDATE crawler_sessions
        SET 
            status = ?,
            finished_at = NOW()
        WHERE id = ?
    `

    const result = await db.execute(sql, [status, id])

    return result
}

export default {
    create,
    findByJobId,
    updateRunning,
    updateFinished,
}