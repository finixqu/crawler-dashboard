import 'dotenv/config'
import app from './app.js'
import crawlerRunService from './services/crawler-run.service.js'


const startServer = async () => {
    try {

        //jalankan pemantauan sebelum ada req lagi
        await crawlerRunService.recoverActiveJobs()

        const PORT = process.env.PORT || 3000

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
        console.error('gagal melakukan recovery', error)
    }
}


startServer()