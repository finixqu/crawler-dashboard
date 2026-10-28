import { spawn } from 'node:child_process'

const executeTmux = (args) => {
    return new Promise((resolve, reject) => {
        const childProcess = spawn(
            'tmux', 
            args,
            {
                stdio: [
                    'ignore',
                    'pipe',
                    'pipe'
                ]
            }
        )

        let stdout = ''
        let stderr = ''


        childProcess.stdout.on('data', (data) => {
            stdout += data.toString()
        })

        childProcess.stderr.on('data', (data) => {
            stderr += data.toString()
        })

        childProcess.on('error', (error) => {
            reject(error)
        })

        childProcess.on('close', (code) => {
            if(code === 0) {
                resolve({
                    stdout,
                    stderr
                })
                return
            }

            reject(
                new Error(stderr || `tmux exit code ${code}`)
            )
        })
    })
}

//buat sesi baru
const createSession = async (sessionName) => {
    return executeTmux([
        'new-session',
        '-d',
        '-s',
        sessionName
    ])
}


//cek sesi
const hasSession = async (sessionName) => {
    try {
        await executeTmux([
            'has-session',
            '-t',
            sessionName
        ])

        return true
    } catch (err) {
        return false
    }
}


//untuk menunggu
const waitForsession = async (sessionName, interval = 2000) => {
    while (true) {
        const exist = await hasSession(sessionName)

        if (!exist) {
            return
        }

        await new Promise((resolve) => {
            setTimeout(resolve, interval)
        })
    }
}


//close sesi
const killSession = async (sessionName) => {
    return executeTmux([
        'kill-session',
        '-t',
        sessionName
    ])
}

//penghubung node.js dan terminal
const sendCommand = async (sessionName, command) => {
    return executeTmux([
        'send-keys',
        '-t',
        sessionName,
        command,
        'C-m'
    ])
}


export default {
    createSession,
    hasSession,
    waitForsession,
    killSession,
    sendCommand
}