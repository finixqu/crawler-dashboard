<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import jobServices from '@/services/job.services'

const route = useRoute()

const jobs = ref([])
const loadingJobs = ref(false)
const jobsError = ref('')

const currentPage = ref(1)
const pageLimit = ref(10)

const pagination = ref({
  currentPage: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false
})

const selectedJob = ref(null)
const selectedLog = ref(null)

const loadingLog = ref(false)
const logError = ref('')

const projectIds = ref([])
const selectedProjectId = ref('')

async function loadJobs() {
  try {
    loadingJobs.value = true
    jobsError.value = ''

    const response = await jobServices.getJobs({
      page: currentPage.value,
      limit: pageLimit.value
    })

    if (!response.success) {
      throw new Error(response.message || 'Gagal mengambil daftar job.')
    }

    jobs.value = response.data || []
    pagination.value = response.pagination
    currentPage.value = pagination.value.currentPage

  } catch (err) {
    console.error(err)

    jobsError.value =
      err.response?.data?.message ||
      err.message ||
      'Gagal mengambil daftar job.'

  } finally {
    loadingJobs.value = false
  }
}

async function selectJob(job) {
  selectedJob.value = job
  selectedLog.value = null

  projectIds.value = []
  selectedProjectId.value = ''

  loadingLog.value = true
  logError.value = ''

  try {
    // Ambil log utama.
    const response = await jobServices.getJobLog(job.id)

    if (!response.success) {
      throw new Error(response.message || 'Gagal mengambil log.')
    }

    selectedLog.value = response.data

    // Jika Group Job, ambil daftar Project ID yang memiliki log.
    if (job.mode === 'group') {
      try {
        const projectResponse =
          await jobServices.getGroupProjectLogs(job.id)

        if (projectResponse.success) {
          projectIds.value =
            projectResponse.data?.projectIds || []
        }
      } catch (err) {
        console.warn('Daftar project log belum tersedia:', err)
      }
    }

  } catch (err) {
    console.error(err)

    logError.value =
      err.response?.data?.message ||
      err.message ||
      'Gagal mengambil log.'

  } finally {
    loadingLog.value = false
  }
}

async function selectProjectLog() {
  if (!selectedJob.value || !selectedProjectId.value) return

  try {
    loadingLog.value = true
    logError.value = ''

    const response = await jobServices.getGroupProjectLog(
      selectedJob.value.id,
      selectedProjectId.value
    )

    if (!response.success) {
      throw new Error(response.message || 'Gagal mengambil log project.')
    }

    selectedLog.value = response.data

  } catch (err) {
    console.error(err)

    logError.value =
      err.response?.data?.message ||
      err.message ||
      'Gagal mengambil log project.'

  } finally {
    loadingLog.value = false
  }
}

function changePage(page) {
  if (page < 1 || page > pagination.value.totalPages) return

  currentPage.value = page
  selectedJob.value = null
  selectedLog.value = null

  loadJobs()
}

function changePageLimit() {
  currentPage.value = 1
  selectedJob.value = null
  selectedLog.value = null

  loadJobs()
}

function formatDate(value) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

onMounted(async () => {
  await loadJobs()

  // Jika halaman dibuka dari tombol Logs di halaman Jobs.
  const jobId = Number(route.query.jobId)

  if (jobId) {
    const job = jobs.value.find(item => Number(item.id) === jobId)

    if (job) {
      await selectJob(job)
    }
  }
})
</script>

<template>
  <div class="space-y-6">

    <!-- Header -->
    <div>
      <h1 class="text-2xl font-semibold text-white">
        Logs
      </h1>

      <p class="mt-1 text-sm text-slate-400">
        Lihat log proses crawler dan log masing-masing project.
      </p>
    </div>

    <div class="grid gap-6 xl:grid-cols-3">

      <!-- Job List -->
      <div class="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">

        <div class="border-b border-slate-800 px-5 py-4">
          <h2 class="font-medium text-white">
            Daftar Jobs
          </h2>

          <p class="mt-1 text-xs text-slate-500">
            Pilih job untuk melihat log.
          </p>
        </div>

        <div
          v-if="loadingJobs"
          class="p-6 text-center text-sm text-slate-400"
        >
          Memuat daftar job...
        </div>

        <div
          v-else-if="jobsError"
          class="p-6 text-sm text-red-400"
        >
          {{ jobsError }}
        </div>

        <div
          v-else-if="jobs.length === 0"
          class="p-6 text-center text-sm text-slate-400"
        >
          Belum ada job.
        </div>

        <div v-else class="divide-y divide-slate-800">
          <button
            v-for="job in jobs"
            :key="job.id"
            type="button"
            class="block w-full px-5 py-4 text-left transition hover:bg-slate-800"
            :class="selectedJob?.id === job.id ? 'bg-slate-800' : ''"
            @click="selectJob(job)"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-medium text-white">
                Job #{{ job.id }}
              </span>

              <span class="text-xs text-slate-400">
                {{ job.status }}
              </span>
            </div>

            <p class="mt-1 text-xs text-slate-400">
              {{
                job.mode === 'group'
                  ? (job.group_display_name || job.group_name || `Group #${job.group_id}`)
                  : `Project ID: ${job.project_id}`
              }}
            </p>

            <p class="mt-1 text-xs text-slate-500">
              {{ formatDate(job.created_at) }}
            </p>
          </button>
        </div>

        <!-- Pagination -->
        <div
          v-if="!loadingJobs && pagination.total > 0"
          class="space-y-3 border-t border-slate-800 p-4"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs text-slate-400">
              Halaman {{ currentPage }} / {{ pagination.totalPages }}
            </span>

            <select
              v-model.number="pageLimit"
              class="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-white"
              @change="changePageLimit"
            >
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
            </select>
          </div>

          <div class="flex gap-2">
            <button
              class="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 disabled:opacity-40"
              :disabled="!pagination.hasPreviousPage"
              @click="changePage(currentPage - 1)"
            >
              Previous
            </button>

            <button
              class="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 disabled:opacity-40"
              :disabled="!pagination.hasNextPage"
              @click="changePage(currentPage + 1)"
            >
              Next
            </button>
          </div>
        </div>

      </div>

      <!-- Log Viewer -->
      <div class="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 xl:col-span-2">

        <div class="border-b border-slate-800 px-5 py-4">
          <h2 class="font-medium text-white">
            {{ selectedJob ? `Log Job #${selectedJob.id}` : 'Log Viewer' }}
          </h2>

          <p class="mt-1 text-xs text-slate-500">
            {{
              selectedJob
                ? `Status: ${selectedJob.status}`
                : 'Pilih salah satu job untuk menampilkan log.'
            }}
          </p>
        </div>

        <!-- Project Log Selector -->
        <div
          v-if="selectedJob?.mode === 'group' && projectIds.length > 0"
          class="border-b border-slate-800 p-4"
        >
          <label class="mb-2 block text-xs text-slate-400">
            Log Project ID
          </label>

          <select
            v-model="selectedProjectId"
            class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
            @change="selectProjectLog"
          >
            <option value="">
              Log utama Group Job
            </option>

            <option
              v-for="id in projectIds"
              :key="id"
              :value="id"
            >
              Project ID {{ id }}
            </option>
          </select>

          <p class="mt-2 text-xs text-slate-500">
            Tersedia {{ projectIds.length }} log project.
          </p>
        </div>

        <div class="min-h-[400px] p-5">

          <div
            v-if="!selectedJob"
            class="flex min-h-[350px] items-center justify-center text-sm text-slate-500"
          >
            Pilih job dari daftar untuk melihat log.
          </div>

          <div
            v-else-if="loadingLog"
            class="flex min-h-[350px] items-center justify-center text-sm text-slate-400"
          >
            Memuat log...
          </div>

          <div
            v-else-if="logError"
            class="whitespace-pre-wrap text-sm text-red-400"
          >
            {{ logError }}
          </div>

          <div
            v-else-if="!selectedLog?.content"
            class="flex min-h-[350px] items-center justify-center text-sm text-slate-500"
          >
            Belum ada isi log.
          </div>

          <template v-else>
            <div
              v-if="selectedLog.errorMessage"
              class="mb-4 rounded-lg border border-red-900/60 bg-red-950/30 p-4"
            >
              <p class="text-xs font-medium text-red-400">
                Error
              </p>

              <p class="mt-1 whitespace-pre-wrap text-sm text-red-300">
                {{ selectedLog.errorMessage }}
              </p>
            </div>

            <div class="mb-3 text-xs text-slate-500">
              <span v-if="selectedLog.projectId">
                Project ID: {{ selectedLog.projectId }}
              </span>

              <span v-else>
                Log utama
              </span>
            </div>

            <pre class="max-h-[65vh] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-4 font-mono text-xs leading-5 text-slate-300">{{ selectedLog.content }}</pre>

            <p
              v-if="selectedLog.truncated"
              class="mt-3 text-xs text-amber-400"
            >
              Log terlalu besar. Yang ditampilkan adalah bagian terakhir log.
            </p>
          </template>

        </div>
      </div>

    </div>
  </div>
</template>