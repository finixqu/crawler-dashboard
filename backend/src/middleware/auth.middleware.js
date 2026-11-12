import authService from '../services/auth.service.js'

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies?.access_token

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Silakan login terlebih dahulu'
            })
        }

        const payload = authService.verifyAccessToken(token)

        const active = await authService.isSessionActive(
            payload.sid,
            payload.sub
        )

        if (!active) {
            return res.status(401).json({
                success: false,
                message: 'Session tidak valid atau sudah berakhir'
            })
        }

        req.user = {
            id: payload.sub,
            username: payload.username,
            sessionId: payload.sid
        }

        next()

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Autentikasi gagal'
        })
    }
}

export default authMiddleware