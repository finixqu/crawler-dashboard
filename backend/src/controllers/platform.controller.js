import platformService from "../services/platform.service.js";

const getPlatforms = async (req, res) => {
    try {
        const platforms = await platformService.getPlatforms()

        if(!platforms) throw new Error("Gagal Ambil Data")
        
        return res.json({
            success: true,
            message: "data ditemukan",
            data: platforms
        })
    } catch (err) {
        console.error(err)
        res.json({
            success: false,
            message: "gagal ambil data",
            data: null
        })
    }
}

const getPlatformById = async (req, res) => {
    const id = Number(req.params.id)
    try {
        const platformById = await platformService.platformById(id)

        if(!platformById) throw new Error("id tidak ditemukan")
        
        return res.json({
            success: true,
            message: "id ditemukan",
            data: platformById,
        }) 
    } catch (err) {
        console.error(err)
        res.json({
            success: false,
            message: "id tidak ada",
            data: null
        })
    }
}


export default {
    getPlatforms,
    getPlatformById,
}