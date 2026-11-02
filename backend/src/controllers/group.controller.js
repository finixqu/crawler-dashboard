import groupService from "../services/group.service.js";

const getGroups = async (req, res) => {
    try {
        const groups = await groupService.getGroups();
        res.status(200).json({
            success: true,
            message: 'Data Groups ditampilkan',
            data: groups
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Data Gagal Ditampilkan'
        })
    }
       
}


export default {
    getGroups,
}