<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store.js'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')

const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
    if (loading.value) return

    errorMessage.value = ''

    if (!username.value.trim() || !password.value) {
        errorMessage.value = 'Username dan password wajib diisi.'
        return
    }

    loading.value = true

    try {
        await authStore.login({
            username: username.value.trim(),
            password: password.value
        })

        const redirect = route.query.redirect

        const destination =
            typeof redirect === 'string' &&
            redirect.startsWith('/') &&
            !redirect.startsWith('//')
                ? redirect
                : '/'

        await router.replace(destination)

    } catch (error) {
        errorMessage.value =
            error.response?.data?.message ||
            'Login gagal. Silakan coba kembali.'

    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">

        <!-- Background Decoration -->
        <div class="pointer-events-none absolute inset-0">
            <div class="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl"></div>
            <div class="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl"></div>
        </div>

        <!-- Login Card -->
        <div class="relative w-full max-w-md">

            <!-- Brand -->
            <div class="mb-8 text-center">

                <div class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10">

                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="h-9 w-9 text-blue-400"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M3 3v18h18M7 14l4-4 4 4 6-7"
                        />
                    </svg>

                </div>

                <h1 class="text-2xl font-semibold tracking-tight text-white">
                    Crawler Dashboard
                </h1>

                <p class="mt-2 text-sm text-slate-400">
                    Backdate Control Center
                </p>

            </div>

            <!-- Form -->
            <div class="rounded-2xl border border-slate-800 bg-slate-900/90 p-7 shadow-2xl shadow-black/20">

                <div class="mb-7">
                    <h2 class="text-xl font-semibold text-white">
                        Welcome Back
                    </h2>

                    <p class="mt-1 text-sm text-slate-400">
                        Login untuk mengakses dashboard.
                    </p>
                </div>

                <form
                    class="space-y-5"
                    @submit.prevent="handleLogin"
                >

                    <!-- Username -->
                    <div>
                        <label class="mb-2 block text-sm font-medium text-slate-300">
                            Username
                        </label>

                        <div class="relative">
                            <input
                                v-model="username"
                                type="text"
                                autocomplete="username"
                                placeholder="Masukkan username"
                                required
                                :disabled="loading"
                                class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                            />
                        </div>
                    </div>

                    <!-- Password -->
                    <div>
                        <label class="mb-2 block text-sm font-medium text-slate-300">
                            Password
                        </label>

                        <div class="relative">

                            <input
                                v-model="password"
                                :type="showPassword ? 'text' : 'password'"
                                autocomplete="current-password"
                                placeholder="Masukkan password"
                                required
                                :disabled="loading"
                                class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                            />

                            <button
                                type="button"
                                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white"
                                :disabled="loading"
                                @click="showPassword = !showPassword"
                            >
                                <span class="text-xs">
                                    {{ showPassword ? 'Hide' : 'Show' }}
                                </span>
                            </button>

                        </div>
                    </div>

                    <!-- Error -->
                    <div
                        v-if="errorMessage"
                        class="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                    >
                        {{ errorMessage }}
                    </div>

                    <!-- Submit -->
                    <button
                        type="submit"
                        :disabled="loading"
                        class="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >

                        <svg
                            v-if="loading"
                            class="h-5 w-5 animate-spin"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                class="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                stroke-width="4"
                            />

                            <path
                                class="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            />
                        </svg>

                        {{ loading ? 'Memproses...' : 'Login' }}

                    </button>

                </form>

            </div>

            <!-- Footer -->
            <p class="mt-6 text-center text-xs text-slate-600">
                Crawler Dashboard · Secure Access
            </p>

        </div>

    </div>
</template>