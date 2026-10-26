import platformRepository from "../repositories/platform.repository.js";

const getPlatforms = async () => {
    return await platformRepository.findAll()
}

const getPlatformById = async (id) => {
    return await platformRepository.findById(id)
}


export default {
    getPlatforms,
    getPlatformById,
}