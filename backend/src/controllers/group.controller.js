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


const readGroupProjects = async (req, res) => {
    const { groupId } = req.params;

    try {
        const projects = await groupService.readGroupProjects(groupId);
        res.status(200).json({
            success: true,
            message: 'Data Projects ditampilkan',
            data: projects
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
    readGroupProjects
}

