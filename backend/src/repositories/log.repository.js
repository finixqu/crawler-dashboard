import db from '../config/database/js'

const create = async ({jobId, logPath}) => {
    const sql = `
        INSERT INTO crawler_logs (
            job_id,
            log_path
        )
        VALUES (?, ?)
    `
    const [result] = await db.execute(sql, [jobId, logPath])

    return result.insertId
}


const findByJobId = async (jobId) => {
    const sql = `
        SELECT 
            id, job_id, log_path, last_position, created_at, updated_at
        FROM crawler_logs
        WHERE job_id = ?
        ORDER BY id DESC
        LIMIT 1
    `
    const [rows] = await db.execute(sql, [jobId])
    
    return rows[0] || null
}

const updatePosition = async (id, position) => {
    const sql = `
        UPDATE crawler_logs
        SET 
            last_positions = ?
        WHERE id = ?
    `
    const result = await db.execute(sql, [positon])
    return result
}


export default {
    create,
    findByJobId,
    updatePosition,
}