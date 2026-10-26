<script setup>
const emit = defineEmits(['toggle-sidebar'])
</script>

<template>
  <header
    class="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-6"
  >
    <div class="flex items-center">
      <button
        type="button"
        class="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white lg:hidden"
        aria-label="Open sidebar"
        @click="emit('toggle-sidebar')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.8"
          stroke="currentColor"
          class="h-6 w-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
      </button>
      <div>
        <h2 class="text-sm font-medium text-slate-300">
          Backdate Crawler
        </h2>
        <p class="text-xs text-slate-500">
          Manage crawler execution
        </p>
      </div>
    </div>


    <div
      class="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5"
    >

      <span class="h-2 w-2 rounded-full bg-emerald-400"></span>

      <span class="text-xs text-slate-300">
        System Online
      </span>

    </div>

  </header>
</template>
