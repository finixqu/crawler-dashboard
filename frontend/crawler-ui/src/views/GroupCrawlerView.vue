<script setup>
import { computed, onMounted, ref, watch } from 'vue'

import getPlatforms from '../services/platform.service.js'
import jobServices from '@/services/job.services.js'

// ========================================
// STATE
// ========================================

const platforms = ref([])
const groups = ref([])

const loadingPlatforms = ref(false)
const loadingGroups = ref(false)
const loadingProjects = ref(false)

const submitting = ref(false)

const errorMessage = ref('')
const successMessage = ref('')

const form = ref({
    platformId: '',
    groupId: '',
    since: `${new Date().toISOString().slice(0, 10)}T00:00`,
    until: '',
    concurrency: 10,
    scheduledAt: ''
})

const groupProjectInfo = ref(null)


// ========================================
// COMPUTED
// ========================================

const selectedPlatform = computed(() => {
    return platforms.value.find(
        platform => String(platform.id) === String(form.value.platformId)
    )
})

const selectedGroup = computed(() => {
    return groups.value.find(
        group => String(group.id) === String(form.value.groupId)
    )
})


// ========================================
// LOAD DATA
// ========================================

async function loadPlatforms() {
    try {
        loadingPlatforms.value = true

        const response = await getPlatforms()

        if (!response.success) {
            throw new Error(response.message || 'Gagal mengambil platform.')
        }

        platforms.value = response.data || []

    } catch (error) {
        console.error(error)

        errorMessage.value =
            error.response?.data?.message ||
            error.message ||
            'Gagal mengambil daftar platform.'

    } finally {
        loadingPlatforms.value = false
    }
}


async function loadGroups() {
    try {
        loadingGroups.value = true

        const response = await jobServices.getGroups()

        if (!response.success) {
            throw new Error(response.message || 'Gagal mengambil grup.')
        }

        groups.value = response.data || []

    } catch (error) {
        console.error(error)

        errorMessage.value =
            error.response?.data?.message ||
            error.message ||
            'Gagal mengambil daftar grup.'

    } finally {
        loadingGroups.value = false
    }
}


// ========================================
// LOAD PROJECTS
// ========================================

watch(
    () => form.value.groupId,
    async (groupId) => {
        groupProjectInfo.value = null

        if (!groupId) return

        try {
            loadingProjects.value = true
            errorMessage.value = ''

            const response = await jobServices.getGroupProjects(groupId)

            if (!response.success) {
                throw new Error(
                    response.message || 'Gagal mengambil project dalam grup.'
                )
            }

            groupProjectInfo.value = response.data

        } catch (error) {
            console.error(error)

            errorMessage.value =
                error.response?.data?.message ||
                error.message ||
                'Gagal mengambil daftar project.'

        } finally {
            loadingProjects.value = false
        }
    }
)


// ========================================
// SUBMIT GROUP JOB
// ========================================

async function submitJob() {
    errorMessage.value = ''
    successMessage.value = ''

    // Validasi platform
    if (!form.value.platformId) {
        errorMessage.value = 'Silakan pilih platform.'
        return
    }

    // Validasi group
    if (!form.value.groupId) {
        errorMessage.value = 'Silakan pilih grup project.'
        return
    }

    // Validasi tanggal
    if (!form.value.since) {
        errorMessage.value = 'Since wajib diisi.'
        return
    }

    if (!form.value.until) {
        errorMessage.value = 'Until wajib diisi.'
        return
    }

    if (
        new Date(form.value.since) >
        new Date(form.value.until)
    ) {
        errorMessage.value =
            'Since tidak boleh lebih besar dari Until.'
        return
    }

    // Validasi concurrency
    const concurrency = Number(form.value.concurrency)

    if (
        !Number.isInteger(concurrency) ||
        concurrency < 1 ||
        concurrency > 50
    ) {
        errorMessage.value =
            'Concurrency harus berupa angka antara 1 sampai 50.'
        return
    }

    if (loadingProjects.value) {
        errorMessage.value =
            'Tunggu sampai informasi project selesai dimuat.'
        return
    }

    if (!groupProjectInfo.value?.totalProject) {
        errorMessage.value =
            'Grup tidak memiliki project atau informasi project belum tersedia.'
        return
    }

    let createdJobId = null

    try {
        submitting.value = true

        // 1. Buat Group Job.
        const createResponse = await jobServices.createGroupJob({
            platformId: Number(form.value.platformId),
            groupId: Number(form.value.groupId),
            since: form.value.since,
            until: form.value.until,
            scheduledAt: form.value.scheduledAt,
            scheduledConcurrency: form.value.concurrency
        })

        if (!createResponse.success || !createResponse.data?.id) {
            throw new Error(
                createResponse.message || 'Gagal membuat Group Job.'
            )
        }

        createdJobId = createResponse.data.id

        if(!form.value.scheduledAt){
            // 2. Jalankan Group Job.
            const startResponse = await jobServices.startCrawler(
                createdJobId,
                concurrency
            )

            if (!startResponse.success) {
                throw new Error(
                    startResponse.message || 'Gagal memulai Group Job.'
                )
            }

            // 3. Tampilkan hasil.
            successMessage.value =
                `Group Job #${createdJobId} berhasil dibuat dan dijalankan. ` +
                `${groupProjectInfo.value.totalProject} project dengan concurrency ${concurrency}.`

        }else {
            successMessage.value =
            `Job #${createdJobId} berhasil dijadwalkan pada ${form.value.scheduledAt.replace('T', ' ')} dengan concurrency ${concurrency}.`
        }
        
    } catch (error) {
        console.error(error)

        const message =
            error.response?.data?.message ||
            error.message ||
            'Terjadi kesalahan.'

        if (createdJobId !== null) {
            errorMessage.value =
                `Group Job #${createdJobId} sudah dibuat, tetapi crawler gagal dimulai: ${message}`
        } else {
            errorMessage.value = message
        }

    } finally {
        submitting.value = false
    }
}


// ========================================
// RESET FORM
// ========================================

function resetForm() {
    form.value = {
        platformId: '',
        groupId: '',
        since: '',
        until: '',
        concurrency: 10,
        scheduledAt: ''
    }

    groupProjectInfo.value = null

    errorMessage.value = ''
    successMessage.value = ''
}


// ========================================
// MOUNTED
// ========================================

onMounted(() => {
    loadPlatforms()
    loadGroups()
})
</script>


<template>
    <div class="mx-auto w-full max-w-5xl space-y-6">

        <!-- Page Header -->
        <div>
            <h1 class="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Group Crawler
            </h1>

            <p class="mt-2 text-sm leading-6 text-slate-400">
                Jalankan crawler berdasarkan kumpulan Project ID dalam satu grup.
            </p>
        </div>


        <!-- Form Card -->
        <div class="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">

            <!-- Card Header -->
            <div class="border-b border-slate-800 px-4 py-5 sm:px-6">

                <h2 class="text-base font-semibold text-white">
                    Create Group Job
                </h2>

                <p class="mt-1 text-sm text-slate-500">
                    Tentukan platform, grup project, rentang waktu, dan concurrency.
                </p>

            </div>


            <!-- Form -->
            <form
                class="space-y-6 p-4 sm:p-6"
                @submit.prevent="submitJob"
            >

                <!-- Platform -->
                <div>

                    <label
                        for="platform"
                        class="mb-2 block text-sm font-medium text-slate-300"
                    >
                        Platform
                    </label>

                    <select
                        id="platform"
                        v-model="form.platformId"
                        :disabled="loadingPlatforms || submitting"
                        class="block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >

                        <option value="">
                            Pilih platform
                        </option>

                        <option
                            v-for="platform in platforms"
                            :key="platform.id"
                            :value="platform.id"
                        >
                            {{ platform.display_name }}
                        </option>

                    </select>

                    <p
                        v-if="selectedPlatform"
                        class="mt-2 text-xs text-slate-500"
                    >
                        Platform: {{ selectedPlatform.name }}
                    </p>

                </div>


                <!-- Group -->
                <div>

                    <label
                        for="group"
                        class="mb-2 block text-sm font-medium text-slate-300"
                    >
                        Project Group
                    </label>

                    <select
                        id="group"
                        v-model="form.groupId"
                        :disabled="loadingGroups || submitting"
                        class="block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >

                        <option value="">
                            Pilih grup project
                        </option>

                        <option
                            v-for="group in groups"
                            :key="group.id"
                            :value="group.id"
                        >
                            {{ group.display_name }}
                        </option>

                    </select>

                    <p
                        v-if="loadingGroups"
                        class="mt-2 text-xs text-slate-500"
                    >
                        Memuat daftar grup...
                    </p>

                </div>


                <!-- Project Information -->
                <div
                    v-if="form.groupId"
                    class="rounded-xl border border-slate-700 bg-slate-950/70 p-4"
                >

                    <div class="flex items-center justify-between gap-4">

                        <div>

                            <p class="text-sm font-medium text-slate-300">
                                Informasi Project
                            </p>

                            <p class="mt-1 text-xs text-slate-500">
                                {{ selectedGroup?.display_name }}
                            </p>

                        </div>

                        <div
                            v-if="loadingProjects"
                            class="text-xs text-slate-400"
                        >
                            Memuat...
                        </div>

                        <div
                            v-else-if="groupProjectInfo"
                            class="text-right"
                        >

                            <p class="text-2xl font-semibold text-white">
                                {{ groupProjectInfo.totalProject }}
                            </p>

                            <p class="text-xs text-slate-500">
                                Total Project
                            </p>

                        </div>

                    </div>

                </div>


                <!-- Date Range -->
                <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">

                    <!-- Since -->
                    <div>

                        <label
                            for="since"
                            class="mb-2 block text-sm font-medium text-slate-300"
                        >
                            Since <span class="text-blue-200 ml-24">AM: 00:00–11:59 dan PM: 12:00–23:59</span>
                        </label>

                        <input
                            id="since"
                            v-model="form.since"
                            type="datetime-local"
                            :disabled="submitting"
                            class="block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        />

                    </div>


                    <!-- Until -->
                    <div>

                        <label
                            for="until"
                            class="mb-2 block text-sm font-medium text-slate-300"
                        >
                            Until <span class="text-blue-200 ml-24">AM: 00:00–11:59 dan PM: 12:00–23:59</span>
                        </label>

                        <input
                            id="until"
                            v-model="form.until"
                            type="datetime-local"
                            :disabled="submitting"
                            class="block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        />

                    </div>

                </div>


                <!-- Concurrency -->
                <div>

                    <label
                        for="concurrency"
                        class="mb-2 block text-sm font-medium text-slate-300"
                    >
                        Concurrency
                    </label>

                    <input
                        id="concurrency"
                        v-model.number="form.concurrency"
                        type="number"
                        min="1"
                        max="50"
                        step="1"
                        :disabled="submitting"
                        class="block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    />

                    <p class="mt-2 text-xs text-slate-500">
                        Jumlah crawler yang berjalan secara bersamaan.
                        Minimal 1 dan maksimal 50. Default: 10.
                    </p>

                </div>

                <!-- Scheduled At -->
                <div>
                    <label
                        for="scheduledAt"
                        class="mb-2 block text-sm font-medium text-slate-300"
                    >
                        Scheduled At
                        <span class="ml-2 text-xs text-slate-500">
                            (Opsional) <span class="text-blue-200 ml-24">AM: 00:00–11:59 dan PM: 12:00–23:59</span>
                        </span>
                    </label>

                    <input
                        id="scheduledAt"
                        v-model="form.scheduledAt"
                        type="datetime-local"
                        :disabled="submitting"
                        class="block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    />

                    <p class="mt-2 text-xs text-slate-500">
                        Kosongkan untuk menjalankan crawler langsung.
                        Isi tanggal dan waktu untuk menjalankan crawler secara otomatis sesuai jadwal.
                    </p>
                </div>


                <!-- Error -->
                <div
                    v-if="errorMessage"
                    class="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3"
                >

                    <p class="text-sm text-red-300">
                        {{ errorMessage }}
                    </p>

                </div>


                <!-- Success -->
                <div
                    v-if="successMessage"
                    class="rounded-xl border border-emerald-900/50 bg-emerald-950/30 px-4 py-3"
                >

                    <p class="text-sm text-emerald-300">
                        {{ successMessage }}
                    </p>

                    <p class="mt-2 text-xs text-emerald-400">
                        Silakan periksa halaman Jobs untuk memantau proses crawling.
                    </p>

                </div>


                <!-- Actions -->
                <div
                    class="flex flex-col-reverse gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:justify-end"
                >

                    <button
                        type="button"
                        :disabled="submitting"
                        class="w-full rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        @click="resetForm"
                    >
                        Reset
                    </button>


                    <button
                        type="submit"
                        :disabled="submitting || loadingPlatforms || loadingGroups || loadingProjects"
                        class="w-full rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >

                        <span v-if="submitting">
                            Preparing...
                        </span>

                        <span v-else>
                            Start Group Crawler
                        </span>

                    </button>

                </div>

            </form>

        </div>


        <!-- Information -->
        <div class="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6">

            <div class="flex gap-3">

                <div class="mt-0.5 shrink-0 text-slate-500">
                    ●
                </div>

                <div>

                    <h3 class="text-sm font-medium text-slate-300">
                        Group Crawler
                    </h3>

                    <p class="mt-1 text-sm leading-6 text-slate-500">
                        Group Crawler menjalankan beberapa Project ID
                        berdasarkan file TXT yang sudah terdaftar di backend.
                        Setiap Group Job mempunyai session tmux dan log sendiri.
                        Concurrency menentukan jumlah crawler yang berjalan
                        secara bersamaan.
                    </p>

                </div>

            </div>

        </div>

    </div>
</template>