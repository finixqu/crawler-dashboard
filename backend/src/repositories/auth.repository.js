import db from '../config/database.js'

const findUserByUsername = async (username) => {
    const sql = `
        SELECT id, username, password_hash, is_active
        FROM users
        WHERE username = ?
        LIMIT 1
    `

    const [rows] = await db.execute(sql, [username])

    return rows[0] || null
}

const findUserById = async (id) => {
    const sql = `
        SELECT id, username, is_active
        FROM users
        WHERE id = ?
        LIMIT 1
    `

    const [rows] = await db.execute(sql, [id])

    return rows[0] || null
}

const createSession = async ({
    id,
    userId,
    refreshTokenHash,
    expiresAt
}) => {
    const sql = `
        INSERT INTO auth_sessions (
            id,
            user_id,
            refresh_token_hash,
            expires_at
        )
        VALUES (?, ?, ?, ?)
    `

    const [result] = await db.execute(sql, [
        id,
        userId,
        refreshTokenHash,
        expiresAt
    ])

    return result
}

const findSession = async (id) => {
    const sql = `
        SELECT
            id,
            user_id,
            refresh_token_hash,
            expires_at,
            revoked_at
        FROM auth_sessions
        WHERE id = ?
        LIMIT 1
    `

    const [rows] = await db.execute(sql, [id])

    return rows[0] || null
}

const rotateRefreshToken = async ({
    sessionId,
    oldHash,
    newHash,
    expiresAt
}) => {
    const sql = `
        UPDATE auth_sessions
        SET
            refresh_token_hash = ?,
            expires_at = ?
        WHERE id = ?
            AND refresh_token_hash = ?
            AND revoked_at IS NULL
            AND expires_at > NOW()
    `

    const [result] = await db.execute(sql, [
        newHash,
        expiresAt,
        sessionId,
        oldHash
    ])

    return result.affectedRows === 1
}

const revokeSession = async (sessionId) => {
    const sql = `
        UPDATE auth_sessions
        SET revoked_at = NOW()
        WHERE id = ?
            AND revoked_at IS NULL
    `

    const [result] = await db.execute(sql, [sessionId])

    return result
}

const updateLastLogin = async (userId) => {
    const sql = `
        UPDATE users
        SET last_login_at = NOW()
        WHERE id = ?
    `

    const [result] = await db.execute(sql, [userId])

    return result
}

const isSessionActive = async (sessionId, userId) => {
    const sql = `
        SELECT s.id
        FROM auth_sessions s
        INNER JOIN users u ON u.id = s.user_id
        WHERE s.id = ?
            AND s.user_id = ?
            AND s.revoked_at IS NULL
            AND s.expires_at > NOW()
            AND u.is_active = TRUE
        LIMIT 1
    `

    const [rows] = await db.execute(sql, [
        sessionId,
        userId
    ])

    return rows.length > 0
}

export default {
    findUserByUsername,
    findUserById,
    createSession,
    findSession,
    rotateRefreshToken,
    revokeSession,
    updateLastLogin,
    isSessionActive
}