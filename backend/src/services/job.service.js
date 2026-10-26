import platformRepository from '../repositories/platform.repository.js'
import jobRepository from '../repositories/job.repository.js'

const createProjectJob = async ({ platformId, projectId, since, until}) => {
    //verifikasi platform
    if(!platformId) throw new Error('Platform wajib dipilih')

    //verifikasi project
    if(!projectId) throw new Error('Project harus di isi')
    
    if (!since) throw new Error('Since wajib diisi.')

    if (!until) throw new Error('Until wajib diisi.')


    const startDate = new Date(since)

    const endDate = new Date(until)

    //verifikasi tanggal
    if (
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime())
    ) {
        throw new Error('Format tanggal tidak valid.')
    }


    if (startDate > endDate) throw new Error('Until harus lebih besar dari Since.')

        //cari pilihan platform yg ada
    const platform = await platformRepository.findById(platformId)

    if (!platform) throw new Error('Platform tidak ditemukan.')


    const jobId = await jobRepository.createProjectJob({
            platformId,
            projectId,
            since,
            until
        })

    return jobRepository.findById(jobId)

}

export default {
    createProjectJob
}