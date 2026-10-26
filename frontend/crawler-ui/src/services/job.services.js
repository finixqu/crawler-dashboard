import api from "./api";

const createProjectJob = async (data) => {
    const res = await api.post('/jobs/project', data)

    return res.data
}

export default {
    createProjectJob
}