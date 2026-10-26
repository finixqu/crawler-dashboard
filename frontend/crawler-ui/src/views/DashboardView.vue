<script setup>
import { onMounted, ref } from 'vue'
import getPlatforms from '@/services/platform.service.js'

const platforms = ref([])
const loading = ref(false)

const error = ref(null)


const loadPlatforms = async () => {
  try {
    loading.value = true

    const response = await getPlatforms()

    platforms.value = response.data
  } catch (err) {
    console.error(err)
    error.value = "gagal memuat data"
  }finally{
    loading.value = false
  }
}

onMounted(() => {
  loadPlatforms()
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

    <!-- platforms -->
    <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">

      <h2 class="font-medium text-white">
        Available Platforms
      </h2>

      <div v-if="loading" class="mt-4 text-sm text-slate-400">
        Loading...
      </div>

      <div
        v-else-if="error"
        class="mt-4 text-sm text-red-400"
      >
        {{ error }}
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
          0
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
          0
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
          0
        </p>

        <p class="mt-1 text-xs text-red-400">
          Requires attention
        </p>
      </div>


      <!-- Queue -->
      <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <p class="text-sm text-slate-400">
          Queue
        </p>

        <p class="mt-2 text-3xl font-semibold text-white">
          0
        </p>

        <p class="mt-1 text-xs text-amber-400">
          Waiting jobs
        </p>
      </div>

    </div>


    <!-- Recent Jobs -->
    <div class="rounded-xl border border-slate-800 bg-slate-900">

      <div class="border-b border-slate-800 px-5 py-4">

        <h2 class="font-medium text-white">
          Recent Jobs
        </h2>

        <p class="mt-1 text-xs text-slate-500">
          Aktivitas crawler terbaru.
        </p>

      </div>


      <div class="flex min-h-64 items-center justify-center">

        <div class="text-center">

          <p class="text-sm text-slate-400">
            Belum ada job.
          </p>

          <p class="mt-1 text-xs text-slate-500">
            Job crawler akan muncul di sini.
          </p>

        </div>

      </div>

    </div>

  </div>
</template>
