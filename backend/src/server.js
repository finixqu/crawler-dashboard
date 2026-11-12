import 'dotenv/config'
import app from './app.js'
import crawlerRunService from './services/crawler-run.service.js'


const startServer = async () => {
    try {

        if (
            !process.env.AUTH_ACCESS_SECRET ||
            !process.env.AUTH_REFRESH_SECRET ||
            !process.env.APP_ORIGIN
        ) {
            throw new Error('Konfigurasi autentikasi belum lengkap')
        }

        if (
            process.env.AUTH_ACCESS_SECRET ===
            process.env.AUTH_REFRESH_SECRET
        ) {
            throw new Error('JWT secrets harus berbeda')
        }

        //jalankan pemantauan sebelum ada req lagi
        await crawlerRunService.recoverActiveJobs()

        const PORT = Number(process.env.PORT) || 3000
        const HOST = '127.0.0.1'

        app.listen(PORT, () => {
            console.log(`Server Berjalan Di Port ${PORT}`)
        })

         // Periksa jadwal langsung saat backend dinyalakan.
        void crawlerRunService.processDueScheduledJobs()

        setInterval(() => {
            void crawlerRunService.processDueScheduledJobs()
        }, 5000);

        console.log('[SCHEDULER] Pemeriksaan jadwal aktif setiap 5 detik.')

    } catch (error) {
        console.error('Gagal menjalankan backend:', error)
        process.exit(1)
    }
}


startServer()