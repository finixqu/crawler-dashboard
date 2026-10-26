import db from '../config/database.js';

const findAll = async () => {
    const sql = `
        SELECT id, name, display_name, is_active, created_at, updated_at
        FROM crawler_platforms
        WHERE is_active = TRUE
        ORDER BY display_name ASC
    `

    const [rows] = await db.query(sql)

    return rows;
}

const findById = async (id) => {
    const sql = `
        SELECT id, name, display_name, is_active
        FROM crawler_platforms
        WHERE id = ?
        LIMIT 1
    `

    const [rows] = await db.query(sql, [id])

    return rows[0] || null
}

export default {
    findAll,
    findById
}