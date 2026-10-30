<script setup>
import { onMounted, onUnmounted, ref, computed } from 'vue'
import getPlatforms from '@/services/platform.service.js'
import jobServices from '@/services/job.services'

const platforms = ref([])
const jobs = ref([])

const loading = ref(false)
const jobsLoading = ref(false)

const error = ref(null)
const jobsError = ref(null)


// untuk memulai/mengulang job yang pending/gagal 
const startingJobIds = ref([])

//untuk stop job
const stoppingJobIds = ref([])


//menyimpan error untuk yang dimulai ulang
const startCrawlerError = ref('')

// untuk filter
const filterProjectId = ref('')
const filterStatus = ref('')


//untuk log
const selectedLog = ref(null)
const logLoading = ref(false)
const logError = ref('')




//menyimpan timer
let refreshTimer = null

//agar data tidak bertumpuk
let JobRequestProgres = ref(false)




//jumlah data job dari backend
const stats = computed(() => {
  const allJobs = jobs.value

  return {
    running: allJobs.filter(
      (job) => ['starting', 'running'].includes(job.status)
    ).length,

    success: allJobs.filter(
      (job) => job.status === 'success'
    ).length,

    failed: allJobs.filter(
      (job) => job.status === 'failed'
    ).length,

    pending: allJobs.filter(
      (job) => job.status === 'pending'
    ).length
  }
})


//jumlah daftar platform
const loadPlatforms = async () => {
  try {
    loading.value = true
    error.value = null

    const response = await getPlatforms()

    platforms.value = response.data

  } catch (err) {
    console.error(err)
    error.value = "gagal memuat platforms"
    throw err

  }finally{
    loading.value = false
  }
}

//ambil daftar jobs
const loadJobs = async (silent = false) => {

  if (JobRequestProgres.value) return

  JobRequestProgres.value = true

  try {

    if (!silent) {
      jobsLoading.value = true
    }

    jobsError.value = ''

    const response = await jobServices.getJobs({
      projectId: filterProjectId.value || undefined,
      status: filterStatus.value || undefined
    })

    if (!response.success) {
      throw new Error(response.message || 'Gagal memuat job.')
    }

    jobs.value = response.data || []
  } catch (err) {
    console.error('Gagal memuat job:', err)
    jobsError.value =
      err.response?.data?.message ||
      err.message ||
      'Gagal memuat job.'
  } finally {
    JobRequestProgres.value = false

    if(!silent) {
      jobsLoading.value = false
    }
  }
}

const canStartCrawler = (job) => {
  return Number(job.platform_id) === 1 &&
    ['pending', 'failed'].includes(job.status)
}

// Memulai crawler untuk job yang dipilih.
const startJobCrawler = async (job) => {
  if (
    !canStartCrawler(job) ||
    startingJobIds.value.includes(job.id)
  ) {
    return
  }

  startingJobIds.value = [
    ...startingJobIds.value,
    job.id
  ]

  startCrawlerError.value = ''

  try {
    const response = await jobServices.startCrawler(job.id)

    if (!response.success) {
      throw new Error(
        response.message || 'Gagal memulai crawler.'
      )
    }

    // Ambil status terbaru setelah permintaan start berhasil.
    await loadJobs()
  } catch (err) {
    console.error('Gagal memulai crawler:', err)

    startCrawlerError.value =
      err.response?.data?.message ||
      err.message ||
      `Gagal memulai crawler untuk job #${job.id}.`
  } finally {

    startingJobIds.value =
      startingJobIds.value.filter(id => id !== job.id)

    // Ambil status terbaru setelah proses start selesai.
    await loadJobs(true)
  }
}


// Hanya job starting/running yang bisa dihentikan.
const canStopCrawler = (job) => {
  return ['starting', 'running'].includes(job.status)
}

// Menghentikan crawler.
const stopJobCrawler = async (job) => {
  if (
    !canStopCrawler(job) ||
    stoppingJobIds.value.includes(job.id)
  ) {
    return
  }

  const confirmed = window.confirm(
    `Yakin ingin menghentikan crawler job #${job.id}?`
  )

  if (!confirmed) return

  stoppingJobIds.value = [
    ...stoppingJobIds.value,
    job.id
  ]

  startCrawlerError.value = ''

  try {
    const response = await jobServices.stopCrawler(job.id)

    if (!response.success) {
      throw new Error(
        response.message || 'Gagal menghentikan crawler.'
      )
    }

    await loadJobs()
  } catch (err) {
    console.error('Gagal menghentikan crawler:', err)

    startCrawlerError.value =
      err.response?.data?.message ||
      err.message ||
      `Gagal menghentikan job #${job.id}.`
  } finally {
    stoppingJobIds.value =
      stoppingJobIds.value.filter(id => id !== job.id)

    await loadJobs(true)
  }
}

// Mengambil log job.
const viewJobLog = async (job) => {
  selectedLog.value = {
    jobId: job.id,
    projectId: job.project_id,
    status: job.status,
    errorMessage: job.error_message,
    content: ''
  }

  logLoading.value = true
  logError.value = ''

  try {
    const response = await jobServices.getJobLog(job.id)

    if (!response.success) {
      throw new Error(response.message || 'Gagal mengambil log.')
    }

    selectedLog.value = response.data
  } catch (err) {
    console.error('Gagal mengambil log:', err)

    logError.value =
      err.response?.data?.message ||
      err.message ||
      'Gagal mengambil log.'
  } finally {
    logLoading.value = false
  }
}

// Menutup tampilan log.
const closeJobLog = () => {
  selectedLog.value = null
  logError.value = ''
}

// Menerapkan filter.
const applyJobFilters = () => {
  loadJobs()
}

// Menghapus filter.
const resetJobFilters = () => {
  filterProjectId.value = ''
  filterStatus.value = ''

  loadJobs()
}


// Format tanggal agar mudah dibaca.
const formatDate = (value) => {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

// Label status yang ditampilkan di UI.
const statusLabel = (status) => {
  const labels = {
    pending: 'Pending',
    starting: 'Starting',
    running: 'Running',
    success: 'Success',
    failed: 'Failed',
  }

  return labels[status] || status || '-'
}

// Warna label status.
const statusClass = (status) => {
  const classes = {
    pending: 'bg-amber-500/10 text-amber-400',
    starting: 'bg-blue-500/10 text-blue-400',
    running: 'bg-emerald-500/10 text-emerald-400',
    success: 'bg-green-500/10 text-green-400',
    failed: 'bg-red-500/10 text-red-400',
  }

  return classes[status] || 'bg-slate-700 text-slate-300'
}




onMounted(() => {
  loadPlatforms()
  loadJobs()

  refreshTimer = setInterval(() => {
    loadJobs(true)
  }, 5000)
})


onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})

</script>

<template>
  <div class="space-y-6">

    <!-- Page Header -->
    <div>
      <h1 class="text-2xl font-semibold text-white">
        Dashboard
      </h1>

      <p class="mt-1 text-sm text-slate-400">
        Monitor dan mengontrol proses crawler.
      </p>
    </div>

    <!-- Available Platforms -->
    <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h2 class="font-medium text-white">
        Available Platforms
      </h2>

      <div
        v-if="loading"
        class="mt-4 text-sm text-slate-400"
      >
        Loading...
      </div>

      <div
        v-else-if="error"
        class="mt-4 text-sm text-red-400"
      >
        {{ error }}
      </div>

      <div
        v-else-if="platforms.length === 0"
        class="mt-4 text-sm text-slate-400"
      >
        Belum ada platform.
      </div>

      <div
        v-else
        class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div
          v-for="platform in platforms"
          :key="platform.id"
          class="rounded-lg border border-slate-800 bg-slate-950 p-4"
        >
          <p class="font-medium text-white">
            {{ platform.display_name }}
          </p>

          <p class="mt-1 text-xs text-slate-500">
            {{ platform.name }}
          </p>
        </div>
      </div>
    </div>

    <!-- Statistics -->
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

      <!-- Running -->
      <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <p class="text-sm text-slate-400">
          Running
        </p>

        <p class="mt-2 text-3xl font-semibold text-white">
          {{ stats.running }}
        </p>

        <p class="mt-1 text-xs text-emerald-400">
          Active jobs
        </p>
      </div>

      <!-- Success -->
      <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <p class="text-sm text-slate-400">
          Success
        </p>

        <p class="mt-2 text-3xl font-semibold text-white">
          {{ stats.success }}
        </p>

        <p class="mt-1 text-xs text-slate-500">
          Completed jobs
        </p>
      </div>

      <!-- Failed -->
      <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <p class="text-sm text-slate-400">
          Failed
        </p>

        <p class="mt-2 text-3xl font-semibold text-white">
          {{ stats.failed }}
        </p>

        <p class="mt-1 text-xs text-red-400">
          Requires attention
        </p>
      </div>

      <!-- pending -->
      <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <p class="text-sm text-slate-400">
          Pending
        </p>

        <p class="mt-2 text-3xl font-semibold text-white">
          {{ stats.pending }}
        </p>

        <p class="mt-1 text-xs text-amber-400">
          Waiting jobs
        </p>
      </div>

    </div>

    <!-- Job Filters -->
    <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h2 class="font-medium text-white">
        Filter Jobs
      </h2>

      <div class="mt-4 grid gap-3 md:grid-cols-3">

        <!-- Filter Project ID -->
        <div>
          <label class="mb-2 block text-xs text-slate-400">
            Project ID
          </label>

          <input
            v-model="filterProjectId"
            type="text"
            placeholder="Masukkan Project ID"
            class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
            @keyup.enter="applyJobFilters"
          />
        </div>

        <!-- Filter Status -->
        <div>
          <label class="mb-2 block text-xs text-slate-400">
            Status
          </label>

          <select
            v-model="filterStatus"
            class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
          >
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="starting">Starting</option>
            <option value="running">Running</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <!-- Filter Buttons -->
        <div class="flex items-end gap-2">
          <button
            type="button"
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
            @click="applyJobFilters"
          >
            Filter
          </button>

          <button
            type="button"
            class="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
            @click="resetJobFilters"
          >
            Reset
          </button>
        </div>

      </div>
    </div>

    <!-- Recent Jobs -->
    <div class="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">

      <div class="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <div>
          <h2 class="font-medium text-white">
            Recent Jobs
          </h2>

          <p class="mt-1 text-xs text-slate-500">
            Aktivitas crawler terbaru.
          </p>
        </div>

        <button
          type="button"
          class="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:bg-slate-800"
          :disabled="jobsLoading"
          @click="loadJobs()"
        >
          {{ jobsLoading ? 'Memuat...' : 'Refresh' }}
        </button>
      </div>

      <div
        v-if="startCrawlerError"
        class="border-b border-red-900/60 bg-red-950/30 px-5 py-3 text-sm text-red-300"
      >
        {{ startCrawlerError }}
      </div>

      <!-- Loading -->
      <div
        v-if="jobsLoading"
        class="flex min-h-40 items-center justify-center text-sm text-slate-400"
      >
        Memuat data job...
      </div>

      <!-- Error -->
      <div
        v-else-if="jobsError"
        class="flex min-h-40 flex-col items-center justify-center px-5 text-center"
      >
        <p class="text-sm text-red-400">
          {{ jobsError }}
        </p>

        <button
          type="button"
          class="mt-3 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
          @click="loadJobs"
        >
          Coba Lagi
        </button>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="jobs.length === 0"
        class="flex min-h-40 items-center justify-center"
      >
        <div class="text-center">
          <p class="text-sm text-slate-400">
            Belum ada job.
          </p>

          <p class="mt-1 text-xs text-slate-500">
            Job crawler akan muncul di sini.
          </p>
        </div>
      </div>

      <!-- Jobs Table -->
      <div
        v-else
        class="overflow-x-auto"
      >
        <table class="w-full text-left text-sm">
          <thead class="border-b border-slate-800 bg-slate-950/50 text-xs uppercase text-slate-500">
            <tr>
              <th class="px-5 py-3 font-medium">
                Job
              </th>

              <th class="px-5 py-3 font-medium">
                Platform
              </th>

              <th class="px-5 py-3 font-medium">
                Project ID
              </th>

              <th class="px-5 py-3 font-medium">
                Since
              </th>

              <th class="px-5 py-3 font-medium">
                Until
              </th>

              <th class="px-5 py-3 font-medium">
                Status
              </th>

              <th class="px-5 py-3 font-medium">
                Dibuat
              </th>

              <th class="px-5 py-3 font-medium">
                Aksi
              </th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-800">
            <tr
              v-for="job in jobs"
              :key="job.id"
              class="transition hover:bg-slate-800/40"
            >
              <td class="whitespace-nowrap px-5 py-4 font-medium text-white">
                #{{ job.id }}
              </td>

              <td class="whitespace-nowrap px-5 py-4 text-slate-300">
                {{ job.platform_name || job.platform || '-' }}
              </td>

              <td class="whitespace-nowrap px-5 py-4 text-slate-300">
                {{ job.project_id || '-' }}
              </td>

              <td class="whitespace-nowrap px-5 py-4 text-slate-400">
                {{ job.since || '-' }}
              </td>

              <td class="whitespace-nowrap px-5 py-4 text-slate-400">
                {{ job.until || '-' }}
              </td>

              <td class="whitespace-nowrap px-5 py-4">
                <span
                  class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
                  :class="statusClass(job.status)"
                >
                  {{ statusLabel(job.status) }}
                </span>
              </td>

              <td class="whitespace-nowrap px-5 py-4 text-slate-400">
                {{ formatDate(job.created_at) }}
              </td>

              <td class="whitespace-nowrap px-5 py-4">
                <button
                  v-if="canStartCrawler(job)"
                  type="button"
                  class="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="startingJobIds.includes(job.id)"
                  @click="startJobCrawler(job)"
                >
                  {{ startingJobIds.includes(job.id) ? 'Memulai...' : 'Start Crawler' }}
                </button>

                <span
                  v-else-if="['pending', 'failed'].includes(job.status) && Number(job.platform_id) !== 1"
                  class="text-xs text-slate-500"
                  title="Runner saat ini hanya mendukung TikTok."
                >
                  Belum didukung
                </span>

                <span
                  v-else
                  class="text-xs text-slate-600"
                >
                  -
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="!jobsLoading && !jobsError && jobs.length > 0"
        class="border-t border-slate-800 px-5 py-3 text-xs text-slate-500"
      >
        Menampilkan {{ jobs.length }} job terbaru.
      </div>

    </div>

  </div>
  <!-- Job Log Modal -->
  <div
    v-if="selectedLog"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    @click.self="closeJobLog"
  >
    <div class="flex max-h-[85vh] w-full max-w-5xl flex-col rounded-xl border border-slate-700 bg-slate-900">

      <!-- Modal Header -->
      <div class="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <div>
          <h2 class="font-semibold text-white">
            Job Log #{{ selectedLog.jobId }}
          </h2>

          <p class="mt-1 text-xs text-slate-400">
            Project ID: {{ selectedLog.projectId }}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
            :disabled="logLoading"
            @click="viewJobLog({
              id: selectedLog.jobId,
              project_id: selectedLog.projectId
            })"
          >
            {{ logLoading ? 'Memuat...' : 'Refresh Log' }}
          </button>

          <button
            type="button"
            class="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
            @click="closeJobLog"
          >
            Tutup
          </button>
        </div>
      </div>

      <!-- Error Message -->
      <div
        v-if="selectedLog.errorMessage"
        class="border-b border-red-900/60 bg-red-950/30 px-5 py-3"
      >
        <p class="text-xs font-medium text-red-400">
          Error:
        </p>

        <p class="mt-1 whitespace-pre-wrap text-sm text-red-300">
          {{ selectedLog.errorMessage }}
        </p>
      </div>

      <!-- Log Content -->
      <div class="min-h-0 flex-1 overflow-auto p-5">

        <div
          v-if="logLoading"
          class="text-sm text-slate-400"
        >
          Memuat log...
        </div>

        <div
          v-else-if="logError"
          class="text-sm text-red-400"
        >
          {{ logError }}
        </div>

        <div
          v-else-if="!selectedLog.content"
          class="text-sm text-slate-400"
        >
          Belum ada isi log.
        </div>

        <pre
          v-else
          class="whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-4 font-mono text-xs leading-5 text-slate-300"
        >{{ selectedLog.content }}</pre>

        <p
          v-if="selectedLog.truncated"
          class="mt-3 text-xs text-amber-400"
        >
          Log terlalu besar. Yang ditampilkan adalah bagian terakhir log (maksimal sekitar 100 KB).
        </p>

      </div>

    </div>
  </div>
</template>
