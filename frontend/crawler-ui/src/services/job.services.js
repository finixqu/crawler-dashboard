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


const stopCrawler = async (jobId) => {
    const res = await api.post(`/jobs/${jobId}/stop`)

    return res.data
}


const getJobLog = async (jobId) => {
    const res = await api.get(`/jobs/${jobId}/log`)
    return res.data
}

const getJobs = async (params = {}) => {
    const res = await api.get('/jobs', { params })

    return res.data
}

export default {
    createProjectJob,
    startCrawler,
    stopCrawler,
    getJobLog,
    getJobs
}