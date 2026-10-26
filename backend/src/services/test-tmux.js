import tmuxService from "./tmux.service.js";

const sessionName = 'crawler-test-1'

try {
    await tmuxService.createSession(sessionName)
    console.log('session berhasil dibuat:', sessionName)

    const exists = await tmuxService.hasSession(sessionName)
    console.log('session aktif:', exists)
} catch (error) {
    console.error('TMUX ERROR', error)
}