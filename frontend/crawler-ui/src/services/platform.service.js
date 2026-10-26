import api from "./api";

const getPlatforms = async () => {
    const res = await api.get('/platforms')

    return res.data
}

export default getPlatforms
