import fs from 'fs/promises';
import groupRepository from '../repositories/group.repository.js';


const readGroupProjects = async (grupId) => {
    const id = Number(grupId)

    if(Number.isNaN(id) || id <= 0) throw new Error('Group ID tidak valid')

    const group = await groupRepository.findById(id)

    if(!group) throw new Error('Group tidak ditemukan')

    const content = await fs.readFile(group.file_path, 'utf-8')

    const projectIds = content.split(/\r?\n/).map(line => line.trim()).filter(line => line !== '')

    if(projectIds.length === 0) throw new Error('File group kosong')
    
    const invalidIds = projectIds.filter(projectId => !/\d+$/.test(projectId))

    if(invalidIds.length > 0 ) throw new Error(`File group mengandung ID project tidak valid: ${invalidIds.join(', ')}`)

    return {
        groupId: group.id,
        groupName: group.display_name,
        filepath: group.file_path,
        totalProject: projectIds.length,
        projectIds 
    }

}


const getGroups = async () => {
    return groupRepository.findAllActive();
}


export default {
    getGroups,
    readGroupProjects
}