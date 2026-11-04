import db from '../config/database.js'

const findAllActive = async () => {
    const sql = `
        SELECT
            id,
            name,
            display_name
        FROM crawler_groups
        WHERE is_Active = true
        ORDER BY display_name ASC
    `
    const [rows] = await db.execute(sql)
    
    return rows
}


const findById = async (id) => {
    const sql = `
        SELECT 
            id,
            name,
            display_name,
            file_path,
            is_active
        FROM crawler_groups
        WHERE id = ?
        LIMIT 1
    `

    const [rows] = await db.execute(sql, [id])

    return rows[0] || null
}


export default {
    findAllActive,
    findById
}