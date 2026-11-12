import { defineStore } from 'pinia'

import authService from '@/services/auth.service.js'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        initialized: false
    }),

    getters: {
        isAuthenticated: (state) => !!state.user
    },

    actions: {
        async login(credentials) {
            const response = await authService.login(credentials)

            this.user = response.user
            this.initialized = true

            return response
        },

        async fetchMe() {
            //ambil data user yg sedang login
            const response = await authService.getMe()

            this.user = response.user

            return response.user
        },

        async initialize() {
            if (this.initialized) {
                return this.isAuthenticated
            }

            try {
                await this.fetchMe()

            } catch {
                try {
                    await authService.refresh()
                    await this.fetchMe()

                } catch {
                    this.user = null
                }
            }

            this.initialized = true

            return this.isAuthenticated
        },

        async logout() {
            try {
                await authService.logout()

            } finally {
                this.user = null
                this.initialized = true
            }
        }
    }
})