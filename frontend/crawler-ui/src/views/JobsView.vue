<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import jobServices from '@/services/job.services'

const router = useRouter()

const jobs = ref([])
const loading = ref(false)
const error = ref('')

const projectId = ref('')
const status = ref('')

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

const startingJobIds = ref([])
const stoppingJobIds = ref([])
const actionError = ref('')

async function loadJobs() {
  try {
    loading.value = true
    error.value = ''

    const response = await jobServices.getJobs({
      page: currentPage.value,
      limit: pageLimit.value,
      projectId: projectId.value || undefined,
      status: status.value || undefined
    })

    if (!response.success) {
      throw new Error(response.message || 'Gagal mengambil data job.')
    }

    jobs.value = response.data || []
    pagination.value = response.pagination

    currentPage.value = pagination.value.currentPage

  } catch (err) {
    console.error(err)

    error.value =
      err.response?.data?.message ||
      err.message ||
      'Gagal mengambil data job.'

  } finally {
    loading.value = false
  }
}

function applyFilters() {
  currentPage.value = 1
  loadJobs()
}

function resetFilters() {
  projectId.value = ''
  status.value = ''
  currentPage.value = 1

  loadJobs()
}

function changePage(page) {
  if (page < 1 || page > pagination.value.totalPages) return

  currentPage.value = page
  loadJobs()
}

function changePageLimit() {
  currentPage.value = 1
  loadJobs()
}

function viewLogs(job) {
  router.push({
    name: 'logs',
    query: { jobId: job.id }
  })
}

async function startJob(job) {
  if (startingJobIds.value.includes(job.id)) return

  try {
    actionError.value = ''
    startingJobIds.value.push(job.id)

    const response = await jobServices.startCrawler(job.id)

    if (!response.success) {
      throw new Error(response.message || 'Gagal memulai crawler.')
    }

    await loadJobs()

  } catch (err) {
    actionError.value =
      err.response?.data?.message ||
      err.message ||
      'Gagal memulai crawler.'

  } finally {
    startingJobIds.value = startingJobIds.value.filter(
      id => id !== job.id
    )
  }
}

async function stopJob(job) {
  const confirmed = window.confirm(
    `Yakin ingin menghentikan crawler job #${job.id}?`
  )

  if (!confirmed) return

  try {
    actionError.value = ''
    stoppingJobIds.value.push(job.id)

    const response = await jobServices.stopCrawler(job.id)

    if (!response.success) {
      throw new Error(response.message || 'Gagal menghentikan crawler.')
    }

    await loadJobs()

  } catch (err) {
    actionError.value =
      err.response?.data?.message ||
      err.message ||
      'Gagal menghentikan crawler.'

  } finally {
    stoppingJobIds.value = stoppingJobIds.value.filter(
      id => id !== job.id
    )
  }
}

function canStart(job) {
  return Number(job.platform_id) === 1 &&
    ['pending', 'failed'].includes(job.status)
}

function canStop(job) {
  return ['starting', 'running'].includes(job.status)
}

function statusClass(value) {
  const classes = {
    pending: 'bg-amber-500/10 text-amber-400',
    starting: 'bg-blue-500/10 text-blue-400',
    running: 'bg-emerald-500/10 text-emerald-400',
    success: 'bg-green-500/10 text-green-400',
    failed: 'bg-red-500/10 text-red-400',
    stopped: 'bg-slate-700 text-slate-300'
  }

  return classes[value] || 'bg-slate-700 text-slate-300'
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

onMounted(loadJobs)
</script>

<template>
  <div class="space-y-6">

    <!-- Header -->
    <div>
      <h1 class="text-2xl font-semibold text-white">
        Jobs
      </h1>

      <p class="mt-1 text-sm text-slate-400">
        Daftar seluruh job crawler yang tersimpan.
      </p>
    </div>

    <!-- Filters -->
    <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h2 class="font-medium text-white">
        Filter Jobs
      </h2>

      <div class="mt-4 grid gap-3 md:grid-cols-3">

        <input
          v-model="projectId"
          type="text"
          placeholder="Project ID"
          class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
          @keyup.enter="applyFilters"
        />

        <select
          v-model="status"
          class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
        >
          <option value="">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="starting">Starting</option>
          <option value="running">Running</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="stopped">Stopped</option>
        </select>

        <div class="flex gap-2">
          <button
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500"
            @click="applyFilters"
          >
            Filter
          </button>

          <button
            class="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            @click="resetFilters"
          >
            Reset
          </button>
        </div>

      </div>
    </div>

    <!-- Job Table -->
    <div class="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">

      <div class="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <div>
          <h2 class="font-medium text-white">
            All Jobs
          </h2>

          <p class="mt-1 text-xs text-slate-500">
            Total {{ pagination.total }} job.
          </p>
        </div>

        <button
          class="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
          :disabled="loading"
          @click="loadJobs"
        >
          Refresh
        </button>
      </div>

      <div
        v-if="actionError"
        class="border-b border-red-900/60 bg-red-950/30 px-5 py-3 text-sm text-red-300"
      >
        {{ actionError }}
      </div>

      <div
        v-if="loading"
        class="p-10 text-center text-sm text-slate-400"
      >
        Memuat data job...
      </div>

      <div
        v-else-if="error"
        class="p-10 text-center text-sm text-red-400"
      >
        {{ error }}

        <button
          class="ml-2 underline"
          @click="loadJobs"
        >
          Coba lagi
        </button>
      </div>

      <div
        v-else-if="jobs.length === 0"
        class="p-10 text-center text-sm text-slate-400"
      >
        Tidak ada job ditemukan.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">

          <thead class="border-b border-slate-800 bg-slate-950/50 text-xs uppercase text-slate-500">
            <tr>
              <th class="px-5 py-3">Job</th>
              <th class="px-5 py-3">Platform</th>
              <th class="px-5 py-3">Project / Group</th>
              <th class="px-5 py-3">Since</th>
              <th class="px-5 py-3">Until</th>
              <th class="px-5 py-3">Status</th>
              <th class="px-5 py-3">Dibuat</th>
              <th class="px-5 py-3">Aksi</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-800">
            <tr
              v-for="job in jobs"
              :key="job.id"
              class="hover:bg-slate-800/40"
            >
              <td class="whitespace-nowrap px-5 py-4 font-medium text-white">
                #{{ job.id }}
              </td>

              <td class="whitespace-nowrap px-5 py-4 text-slate-300">
                {{ job.platform_name || job.platform || '-' }}
              </td>

              <td class="whitespace-nowrap px-5 py-4 text-slate-300">
                {{
                  job.mode === 'group'
                    ? (job.group_display_name || job.group_name || `Group #${job.group_id}`)
                    : (job.project_id || '-')
                }}
              </td>

              <td class="whitespace-nowrap px-5 py-4 text-slate-400">
                {{ job.since || '-' }}
              </td>

              <td class="whitespace-nowrap px-5 py-4 text-slate-400">
                {{ job.until || '-' }}
              </td>

              <td class="whitespace-nowrap px-5 py-4">
                <span
                  class="rounded-full px-2.5 py-1 text-xs font-medium"
                  :class="statusClass(job.status)"
                >
                  {{ job.status }}
                </span>
              </td>

              <td class="whitespace-nowrap px-5 py-4 text-slate-400">
                {{ formatDate(job.created_at) }}
              </td>

              <td class="whitespace-nowrap px-5 py-4">
                <div class="flex items-center gap-2">

                  <button
                    v-if="canStart(job)"
                    class="rounded-lg bg-emerald-600 px-3 py-2 text-xs text-white hover:bg-emerald-500 disabled:opacity-50"
                    :disabled="startingJobIds.includes(job.id)"
                    @click="startJob(job)"
                  >
                    {{ startingJobIds.includes(job.id) ? 'Memulai...' : 'Start' }}
                  </button>

                  <button
                    v-if="canStop(job)"
                    class="rounded-lg bg-red-600 px-3 py-2 text-xs text-white hover:bg-red-500 disabled:opacity-50"
                    :disabled="stoppingJobIds.includes(job.id)"
                    @click="stopJob(job)"
                  >
                    {{ stoppingJobIds.includes(job.id) ? 'Stopping...' : 'Stop' }}
                  </button>

                  <button
                    class="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700"
                    @click="viewLogs(job)"
                  >
                    Logs
                  </button>

                </div>
              </td>
            </tr>
          </tbody>

        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="!loading && !error && pagination.total > 0"
        class="flex flex-col gap-4 border-t border-slate-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <p class="text-xs text-slate-400">
          Menampilkan
          {{ (currentPage - 1) * pageLimit + 1 }}
          -
          {{ Math.min(currentPage * pageLimit, pagination.total) }}
          dari {{ pagination.total }} job
        </p>

        <div class="flex flex-wrap items-center gap-3">

          <select
            v-model.number="pageLimit"
            class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
            @change="changePageLimit"
          >
            <option :value="10">10 / halaman</option>
            <option :value="20">20 / halaman</option>
            <option :value="50">50 / halaman</option>
          </select>

          <button
            class="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 disabled:opacity-40"
            :disabled="!pagination.hasPreviousPage"
            @click="changePage(currentPage - 1)"
          >
            Previous
          </button>

          <span class="text-xs text-slate-400">
            {{ currentPage }} / {{ pagination.totalPages }}
          </span>

          <button
            class="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 disabled:opacity-40"
            :disabled="!pagination.hasNextPage"
            @click="changePage(currentPage + 1)"
          >
            Next
          </button>

        </div>
      </div>

    </div>
  </div>
</template>