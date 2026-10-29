<script setup>
import { onMounted, ref, computed } from 'vue'
import getPlatforms from '@/services/platform.service.js'
import jobServices from '@/services/job.services'

const platforms = ref([])
const jobs = ref([])

const loading = ref(false)
const jobsLoading = ref(false)

const error = ref(null)
const jobsError = ref(null)


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
const loadJobs = async () => {
  try {
    jobsLoading.value = true
    jobsError.value = null

    const response = await jobServices.getJobs()

    if(!response.success) {
      throw new Error (response.message || "Gagal Memuat Job")  
    }

    jobs.value = response.data || []

  } catch (err) {
    console.error('Gagal memuat job:', err)
    jobsError.value = err.response?.data?.message || err.message || "gagal memuat job"

  } finally {
    jobsLoading.value = false
  }
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
          @click="loadJobs"
        >
          {{ jobsLoading ? 'Memuat...' : 'Refresh' }}
        </button>
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
</template>
