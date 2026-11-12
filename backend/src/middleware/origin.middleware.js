//Origin merupakan kombinasi tiga komponen: protocol + host + port


//memriksa dan memvalidasi asal request
const allowedOrigin = process.env.APP_ORIGIN

const originMiddleware = (req, res, next) => {
    const unsafeMethods = ['POST', 'PUT', 'PATCH', 'DELETE']

    //jika http method selain yg diatas
    if (!unsafeMethods.includes(req.method)) {
        return next()
    }

    const origin = req.get('origin')

    if (!allowedOrigin || origin !== allowedOrigin) {
        return res.status(403).json({
            success: false,
            message: 'Origin tidak diizinkan'
        })
    }

    next()
}

export default originMiddleware