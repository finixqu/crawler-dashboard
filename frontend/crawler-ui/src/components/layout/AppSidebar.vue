<script setup>
defineProps({
  open: {
    type: Boolean,
    default: false
  }
})


const emit = defineEmits(["close"])

</script>

<template>
  

  <aside
    class="
      fixed inset-y-0 left-0 w-64 shrink-0 border-r border-slate-800 bg-slate-900
      transform
      transition-transform
      duration-300
      ease-in-out
      lg:static
      lg:translate-x-0
      
    "
    :class="open ? 'translate-x-0' : '-translate-x-full'"
  >

    <!-- Logo -->
    <div class="flex h-16 items-center border-b border-slate-800 px-6">

      <div>

        <h1 class="text-lg font-semibold text-white">
          Crawler Dashboard
        </h1>

        <p class="text-xs text-slate-500">
          Backdate Control Center
        </p>

      </div>

    </div>

    <button
        type="button"
        class="absolute right-3 top-4 inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white lg:hidden"
        aria-label="Close sidebar"
        @click="emit('close')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.8"
          stroke="currentColor"
          class="h-5 w-5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M6 18 18 6M6 6l12 12"
          />
        </svg>
      </button>


    <!-- Navigation -->
    <nav class="p-4">

      <!-- Monitoring -->
      <div class="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Monitoring
      </div>

      <RouterLink
        to="/"
        class="mb-1 block rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
        active-class="bg-slate-800 text-white"
      >
        Dashboard
      </RouterLink>


      <!-- Crawler -->
      <div class="mb-3 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Crawler
      </div>

      <RouterLink
        to="/group-crawler"
        class="mb-1 block rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
        active-class="bg-slate-800 text-white"
      >
        Group Crawler
      </RouterLink>

      <RouterLink
        to="/project-crawler"
        class="mb-1 block rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
        active-class="bg-slate-800 text-white"
      >
        Project Crawler
      </RouterLink>


      <!-- Jobs -->
      <div class="mb-3 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Jobs
      </div>

      <RouterLink
        to="/jobs"
        class="mb-1 block rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
        active-class="bg-slate-800 text-white"
      >
        Jobs
      </RouterLink>

      <RouterLink
        to="/logs"
        class="mb-1 block rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
        active-class="bg-slate-800 text-white"
      >
        Logs
      </RouterLink>

    </nav>

  </aside>
</template>
