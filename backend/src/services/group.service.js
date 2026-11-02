import groupRepository from '../repositories/group.repository.js';

const getGroups = async () => {
    return groupRepository.findAllACtive();
}


export default {
    getGroups
}