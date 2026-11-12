import authService from '../services/auth.service.js'

//	Menentukan konfigurasi berdasarkan environment
const isProduction = process.env.NODE_ENV === 'production'

const accessCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict', //Mengatur pengiriman cookie dalam konteks lintas situs
    path: '/api',
    maxAge: 15 * 60 * 1000
}

const refreshCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000
}

const setAuthCookies = (res, tokens) => {
    res.cookie(
        'access_token',
        tokens.accessToken,
        accessCookieOptions
    )

    res.cookie(
        'refresh_token',
        tokens.refreshToken,
        refreshCookieOptions
    )
}

const clearAuthCookies = (res) => {
    res.clearCookie('access_token', {
        ...accessCookieOptions,
        maxAge: undefined
    })

    res.clearCookie('refresh_token', {
        ...refreshCookieOptions,
        maxAge: undefined
    })
}

const login = async (req, res) => {
    try {
        const { username, password } = req.body

        const result = await authService.login(
            username,
            password
        )

        setAuthCookies(res, result)

        res.json({
            success: true,
            message: 'Login berhasil',
            user: result.user
        })

    } catch (error) {
        console.error('[AUTH LOGIN ERROR]', error)

        const isAuthError = [
            'Username atau password salah',
            'Username dan password wajib diisi'
        ].includes(error.message)

        res.status(isAuthError ? 401 : 500).json({
            success: false,
            message: isAuthError
                ? error.message
                : 'Terjadi kesalahan pada server'
        })
    }
}

const refresh = async (req, res) => {
    try {
        const token = req.cookies?.refresh_token

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token tidak ditemukan'
            })
        }

        const result = await authService.refresh(token)

        setAuthCookies(res, result)

        res.json({
            success: true,
            user: result.user
        })

    } catch (error) {
        clearAuthCookies(res)

        res.status(401).json({
            success: false,
            message: 'Session sudah berakhir. Silakan login kembali.'
        })
    }
}


//representas pengguna yang sedang login,,,
const me = async (req, res) => {
    try {

        // Mengambil informasi pengguna terbaru dari database

        const user = await authService.getCurrentUser(req.user.id)

        res.json({
            success: true,
            user
        })

    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'User tidak ditemukan'
        })
    }
}

const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refresh_token

        if (refreshToken) {
            try {
                const sessionId =
                    authService.getSessionIdFromRefreshToken(refreshToken)

                await authService.logout(sessionId)

            } catch {
                // Token tidak valid atau sudah kedaluwarsa.
                // Cookie tetap akan dibersihkan.
            }
        }

        clearAuthCookies(res)

        res.json({
            success: true,
            message: 'Logout berhasil'
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Gagal melakukan logout'
        })
    }
}

export default {
    login,
    refresh,
    me,
    logout
}