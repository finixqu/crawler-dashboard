import express from 'express';
import cors from 'cors'
import cookieParser from 'cookie-parser'

import platformRoute from './routes/platform.route.js'
import jobRoute from './routes/job.route.js'
import crawlerRoute from './routes/crawler.route.js'
import groupRoute from './routes/group.route.js'

import authRoute from './routes/auth.route.js'
import authMiddleware from './middleware/auth.middleware.js'
import originMiddleware from './middleware/origin.middleware.js'

const app = express()

app.disable('x-powered-by')

app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

// Perlindungan request berbasis cookie.
app.use('/api', originMiddleware)

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Crawler Sedang Berjalan'
    })
})

// Endpoint autentikasi.
app.use('/api/auth', authRoute)

// Seluruh API berikut wajib login.
app.use('/api', authMiddleware)

app.use('/api/platforms', platformRoute)
app.use('/api/jobs', jobRoute)
app.use('/api/crawlers/', crawlerRoute)
app.use('/api/groups', groupRoute)

export default app 
