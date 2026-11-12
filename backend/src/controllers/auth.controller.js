import authService from '../services/auth.service.js'

const isProduction = process.env.NODE_ENV === 'production'

const accessCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
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
        res.status(401).json({
            success: false,
            message: error.message
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

const me = async (req, res) => {
    try {
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
        await authService.logout(req.user.sessionId)

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