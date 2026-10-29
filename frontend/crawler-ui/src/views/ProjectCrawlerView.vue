<script setup>
import { computed, onMounted, ref } from 'vue'

import getPlatforms from '../services/platform.service.js'
import jobServices from '@/services/job.services.js'



const platforms = ref([])

const loadingPlatforms = ref(false)

const submitting = ref(false)

const errorMessage = ref('')

const successMessage = ref('')


const form = ref({
  platformId: '',
  projectId: '',
  since: '',
  until: ''
})


const selectedPlatform = computed(() => {
  return platforms.value.find(
    platform => String(platform.id) === String(form.value.platformId)
  )
})


async function loadPlatforms() {
  try {
    loadingPlatforms.value = true

    errorMessage.value = ''

    const response = await getPlatforms()

    platforms.value = response.data

  } catch (error) {

    console.error(error)

    errorMessage.value =
      'Gagal mengambil daftar platform.'

  } finally {

    loadingPlatforms.value = false

  }
}


async function submitJob() {
  errorMessage.value = ''
  successMessage.value = ''

  // Validasi form
  if (!form.value.platformId) {
    errorMessage.value = 'Silakan pilih platform.'
    return
  }

  if (!form.value.projectId) {
    errorMessage.value = 'Project ID wajib diisi.'
    return
  }

  if (!form.value.since) {
    errorMessage.value = 'Since wajib diisi.'
    return
  }

  if (!form.value.until) {
    errorMessage.value = 'Until wajib diisi.'
    return
  }

  if (new Date(form.value.since) > new Date(form.value.until)) {
    errorMessage.value = 'Since tidak boleh lebih besar dari Until.'
    return
  }

  // Untuk sementara, runner yang tersedia hanya TikTok (ID 1).
  if (Number(form.value.platformId) !== 1) {
    errorMessage.value =
      'Saat ini crawler yang dapat dijalankan hanya TikTok.'
    return
  }

  let createdJobId = null

  try {
    submitting.value = true

    // 1. Buat job di backend.
    const createResponse = await jobServices.createProjectJob({
      platformId: Number(form.value.platformId),
      projectId: form.value.projectId,
      since: form.value.since,
      until: form.value.until,
    })

    if (!createResponse.success || !createResponse.data?.id) {
      throw new Error(
        createResponse.message || 'Gagal membuat job.'
      )
    }

    createdJobId = createResponse.data.id

    // 2. Jalankan crawler menggunakan ID job yang baru dibuat.
    const startResponse = await jobServices.startCrawler(createdJobId)

    if (!startResponse.success) {
      throw new Error(
        startResponse.message || 'Gagal memulai crawler.'
      )
    }

    // 3. Tampilkan hasil.
    successMessage.value =
      `Job #${createdJobId} berhasil dibuat dan crawler berhasil dimulai.`

  } catch (error) {
    console.error(error)

    const message =
      error.response?.data?.message ||
      error.message ||
      'Terjadi kesalahan.'

    if (createdJobId !== null) {
      errorMessage.value =
        `Job #${createdJobId} sudah dibuat, tetapi crawler gagal dimulai: ${message}`
    } else {
      errorMessage.value = message
    }

  } finally {
    submitting.value = false
  }
}

function resetForm() {
  form.value = {
    platformId: '',
    projectId: '',
    since: '',
    until: ''
  }

  errorMessage.value = ''

  successMessage.value = ''
}


onMounted(() => {
  loadPlatforms()
})
</script>


<template>
  <div class="mx-auto w-full max-w-5xl space-y-6">

    <!-- Page Header -->
    <div>
      <h1 class="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        Project Crawler
      </h1>

      <p class="mt-2 text-sm leading-6 text-slate-400">
        Jalankan crawler berdasarkan satu Project ID.
      </p>
    </div>


    <!-- Form Card -->
    <div class="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">

      <!-- Card Header -->
      <div class="border-b border-slate-800 px-4 py-5 sm:px-6">

        <h2 class="text-base font-semibold text-white">
          Create Project Job
        </h2>

        <p class="mt-1 text-sm text-slate-500">
          Tentukan platform, project ID, dan rentang waktu crawling.
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
            Platform:
            {{ selectedPlatform.name }}
          </p>

        </div>


        <!-- Project ID -->
        <div>

          <label
            for="projectId"
            class="mb-2 block text-sm font-medium text-slate-300"
          >
            Project ID
          </label>


          <input
            id="projectId"
            v-model="form.projectId"
            type="text"
            inputmode="numeric"
            placeholder="Contoh: 10629"
            :disabled="submitting"
            class="block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          />

        </div>


        <!-- Date Range -->
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">

          <!-- Since -->
          <div>

            <label
              for="since"
              class="mb-2 block text-sm font-medium text-slate-300"
            >
              Since
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
              Until
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
            :disabled="submitting"
            class="w-full rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >

            <span v-if="submitting">
              Preparing...
            </span>

            <span v-else>
              Start Crawler
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
            Project Crawler
          </h3>

          <p class="mt-1 text-sm leading-6 text-slate-500">
            Halaman ini digunakan untuk menjalankan crawler berdasarkan
            satu Project ID. Setiap job nantinya akan mempunyai session
            tmux dan log sendiri.
          </p>

        </div>

      </div>

    </div>

  </div>
</template>