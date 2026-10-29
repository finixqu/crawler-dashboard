import api from "./api";

const createProjectJob = async (data) => {
    const res = await api.post('/jobs/project', data)

    return res.data
}

const startCrawler = async (jobId) => {
    const res = await api.post('/crawlers/start', {
        jobId
    })

    return res.data
}

const getJobs = async () => {
    const res = await api.get('/jobs')

    return res.data
}

export default {
    createProjectJob,
    startCrawler,
    getJobs
}