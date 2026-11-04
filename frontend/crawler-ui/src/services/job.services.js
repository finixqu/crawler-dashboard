import api from "./api";

// ========================================
// PROJECT JOB
// ========================================

const createProjectJob = async (data) => {
    const res = await api.post('/jobs/project', data)

    return res.data
}


// ========================================
// GROUP JOB
// ========================================

// Membuat Group Job.
const createGroupJob = async (data) => {
    const res = await api.post('/jobs/group', data)

    return res.data
}


// Mengambil daftar grup aktif.
const getGroups = async () => {
    const res = await api.get('/groups')

    return res.data
}


// Mengambil daftar project berdasarkan Group ID.
const getGroupProjects = async (groupId) => {
    const res = await api.get(`/groups/${groupId}/projects`)

    return res.data
}


// ========================================
// CRAWLER CONTROL
// ========================================

// Menjalankan Project Job atau Group Job.
// Concurrency hanya dikirim jika diberikan.
const startCrawler = async (jobId, concurrency = undefined) => {
    const payload = { jobId }

    if (concurrency !== undefined) {
        payload.concurrency = concurrency
    }

    const res = await api.post('/crawlers/start', payload)

    return res.data
}


// Menghentikan crawler.
const stopCrawler = async (jobId) => {
    const res = await api.post(`/jobs/${jobId}/stop`)

    return res.data
}


// ========================================
// JOB MONITORING
// ========================================

// Mengambil log job.
const getJobLog = async (jobId) => {
    const res = await api.get(`/jobs/${jobId}/log`)

    return res.data
}

// Mengambil daftar Project ID yang memiliki log individual.
const getGroupProjectLogs = async (jobId) => {
    const res = await api.get(`/jobs/${jobId}/project-logs`)

    return res.data
}


// Mengambil isi log individual berdasarkan Project ID.
const getGroupProjectLog = async (jobId, projectId) => {
    const res = await api.get(
        `/jobs/${jobId}/project-logs/${projectId}`
    )

    return res.data
}


// Mengambil daftar job.
const getJobs = async (params = {}) => {
    const res = await api.get('/jobs', { params })

    return res.data
}



export default {
    // Project Job
    createProjectJob,

    // Group Job
    createGroupJob,
    getGroups,
    getGroupProjects,

    // Crawler Control
    startCrawler,
    stopCrawler,

    // Monitoring
    getJobLog,
    getJobs,
    getGroupProjectLogs,
    getGroupProjectLog
}