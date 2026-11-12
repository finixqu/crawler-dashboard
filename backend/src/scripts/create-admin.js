import 'dotenv/config'

import bcrypt from 'bcryptjs'
import db from '../config/database.js'

const createAdmin = async () => {
    try {
        const username = process.env.ADMIN_USERNAME?.trim()
        const password = process.env.ADMIN_PASSWORD

        if (!username || !password) {
            throw new Error('ADMIN_USERNAME dan ADMIN_PASSWORD wajib diisi')
        }

        if (!/^[a-zA-Z0-9_]{3,50}$/.test(username)) {
            throw new Error('Username harus 3-50 karakter dan hanya boleh berisi huruf, angka, underscore')
        }

        if (password.length < 10) {
            throw new Error('Password minimal 10 karakter')
        }

        const passwordHash = await bcrypt.hash(password, 12)

        await db.execute(
            `INSERT INTO users (username, password_hash)
             VALUES (?, ?)`,
            [username, passwordHash]
        )

        console.log(`Administrator "${username}" berhasil dibuat.`)

    } catch (error) {
        console.error('Gagal membuat administrator:', error.message)
        process.exitCode = 1

    } finally {
        await db.end()
    }
}

createAdmin()



/* 
cd ~/backdate/crawler-dashboard/backend

read -r -p "Username admin: " ADMIN_USERNAME
read -r -s -p "Password admin: " ADMIN_PASSWORD
echo

export ADMIN_USERNAME ADMIN_PASSWORD

node src/scripts/create-admin.js

unset ADMIN_USERNAME ADMIN_PASSWORD 
*/