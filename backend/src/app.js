import express from 'express';
import cors from 'cors'

import platformRoute from './routes/platform.route.js'
import jobRoute from './routes/job.route.js'
import crawlerRoute from './routes/crawler.route.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Crawler Sedang Berjalan'
    })
})

app.use('/api/platforms', platformRoute)
app.use('/api/jobs', jobRoute)
app.use('/api/crawlers/', crawlerRoute)

export default app 