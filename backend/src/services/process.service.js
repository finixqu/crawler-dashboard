import { spawn } from 'node:child_process';

export function spawnProcess ( command, args, options = {}) {
    const childProcess = spawn(command, args, {
        ...options,
        stdio: ['ignore', 'pipe', 'pipe']
    })

    return childProcess
}