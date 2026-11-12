import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from 'node:crypto'

import authRepository from '../repositories/auth.repository.js'

const ACCESS_EXPIRES = process.env.ACCESS_EXPIRES || '15m'
const REFRESH_EXPIRES = process.env.REFRESH_EXPIRES || '7d'


const ACCESS_SECRET = process.env.AUTH_ACCESS_SECRET
const REFRESH_SECRET = process.env.AUTH_REFRESH_SECRET

//yang menerbitkan token
const ISSUER = 'crawler-dashboard'

//tujuan token
const AUDIENCE = 'crawler-dashboard-client'

//cek scretjwt
const ensureSecrets = () => {
    if (!ACCESS_SECRET || !REFRESH_SECRET) {
        throw new Error('JWT secrets belum dikonfigurasi')
    }

    if (ACCESS_SECRET === REFRESH_SECRET) {
        throw new Error('JWT secrets harus berbeda')
    }
}

//lakukan hashToken dengan bcrypt sha
const hashToken = (token) => {
    return crypto
            .createHash('sha256')
            .update(token)
            .digest('hex')
}

//membuat jwt accesstoken
const createAccessToken = (user, sessionid) => {
    return jwt.sign({
        username: user.username,
        sid: sessionid,
        type: 'access'
    }, ACCESS_SECRET,
    {
        subject: String(user.id),
        expiresIn: ACCESS_EXPIRES,
        issuer: ISSUER,
        audience: AUDIENCE,
        algorithm: 'HS256'
    }
    
  )
}


// gunakan untuk refresh token jwt 
const createRefreshToken = (user, sessionId) => {
    return jwt.sign(
        {
            sid: sessionId,
            type: 'refresh'
        },
        REFRESH_SECRET,
        {
            subject: String(user.id),
            expiresIn: REFRESH_EXPIRES,
            issuer: ISSUER,
            audience: AUDIENCE,
            algorithm: 'HS256'
        }
    )
}


const getRefreshExpiry = () => {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
}

//untuk verifikasi login 
const login = async (username, password) => {

    // cek tokenn
    ensureSecrets()

    //verifikasi untuk username dan password
    if (
        typeof username !== 'string' ||
        typeof password !== 'string' ||
        !username.trim() ||
        !password
    ) {
        throw new Error('Username dan password wajib diisi')
    }

    //cek username apakah terdaftar
    const user = await authRepository.findUserByUsername(
        username.trim()
    )

    //cek apakah active atau tidak
    if (!user || !user.is_active) {
        throw new Error('Username atau password salah')
    }


    //jika ada dan aktif, maka bandingkan passwordid yang di compare dengan password yang disimpan
    const passwordValid = await bcrypt.compare(
        password,
        user.password_hash
    )
    //jika tidak sama maka password salah
    if (!passwordValid) {
        throw new Error('Username atau password salah')
    }

    //untuk mencatat sesilogin, menghasilkan uuid secara acak
    const sessionId = crypto.randomUUID()


    //membuat jwt untuk akun yang login
    const accessToken = createAccessToken(user, sessionId)

    //refresh token
    const refreshToken = createRefreshToken(user, sessionId)

    //simpan sesi Login
    await authRepository.createSession({
        id: sessionId,
        userId: user.id,
        refreshTokenHash: hashToken(refreshToken),
        expiresAt: getRefreshExpiry()
    })

    //update kegiatan login terbaru

    await authRepository.updateLastLogin(user.id)

    //mengembailkan hasil login
    return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            username: user.username
        }
    }
}

const logout = async (sessionId) => {
    if (sessionId) {
        await authRepository.revokeSession(sessionId)
    }
}

//verifikasi token
const verifyAccessToken = (token) => {

    ensureSecrets()
    //cek jwt apakah cocok
    const payload = jwt.verify(token, ACCESS_SECRET, {
        issuer: ISSUER,
        audience: AUDIENCE,
        algorithms: ['HS256']
    })

    if (payload.type !== 'access' || !payload.sid) {
        throw new Error('Access token tidak valid')
    }

    return payload
}


//untuk refresh token 
const refresh = async (token) => {
    ensureSecrets()

    //verifikasi token
    const payload = jwt.verify(token, REFRESH_SECRET, {
        issuer: ISSUER,
        audience: AUDIENCE,
        algorithms: ['HS256']
    })

    //jika belum refrehs dan waktu token habis
    if (payload.type !== 'refresh' || !payload.sid) {
        throw new Error('Refresh token tidak valid')
    }

    const session = await authRepository.findSession(payload.sid)


    //cek sesi token 
    if (!session || session.revoked_at) {
        throw new Error('Session tidak valid')
    }

    if (new Date(session.expires_at) <= new Date()) {
        throw new Error('Session sudah kedaluwarsa')
    }

    const oldHash = hashToken(token)

    if (oldHash !== session.refresh_token_hash) {
        throw new Error('Refresh token sudah tidak berlaku')
    }

    const user = await authRepository.findUserById(payload.sub)

    if (!user || !user.is_active) {
        throw new Error('Akun tidak aktif')
    }

    const newAccessToken = createAccessToken(user, payload.sid)
    const newRefreshToken = createRefreshToken(user, payload.sid)

    const rotated = await authRepository.rotateRefreshToken({
        sessionId: payload.sid,
        oldHash,
        newHash: hashToken(newRefreshToken),
        expiresAt: getRefreshExpiry()
    })

    if (!rotated) {
        throw new Error('Refresh token sudah digunakan')
    }

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: {
            id: user.id,
            username: user.username
        }
    }
}

//digunakan untuk informasi user yang sedang login 
const getCurrentUser = async (userId) => {
    const user = await authRepository.findUserById(userId)

    if (!user || !user.is_active) {
        throw new Error('User tidak ditemukan')
    }

    return {
        id: user.id,
        username: user.username
    }
}


//cek sesi siapayang akti
const isSessionActive = async (sessionId, userId) => {
    return authRepository.isSessionActive(sessionId, userId)
}


//ambil id sesiion dari token yg direfresh
const getSessionIdFromRefreshToken = (token) => {
    const payload = jwt.verify(token, REFRESH_SECRET, {
        issuer: ISSUER,
        audience: AUDIENCE,
        algorithms: ['HS256']
    })

    if (payload.type !== 'refresh') {
        throw new Error('Refresh token tidak valid')
    }

    return payload.sid
}


export default {
    login,
    refresh,
    logout,
    verifyAccessToken,
    getCurrentUser,
    isSessionActive,
    getSessionIdFromRefreshToken
}