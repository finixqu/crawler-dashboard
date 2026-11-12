<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const emit = defineEmits(['toggle-sidebar'])

const router = useRouter()
const authStore = useAuthStore()

const handleLogout = async () => {
    const confirmed = window.confirm(
        'Apakah Anda yakin ingin logout?'
    )

    if (!confirmed) return

    await authStore.logout()

    router.replace('/login')
}
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


    <div class="flex items-center gap-3">

    <div class="hidden items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 sm:flex">

        <span class="h-2 w-2 rounded-full bg-emerald-400"></span>

        <span class="text-xs text-slate-300">
            System Online
        </span>

    </div>

    <div class="hidden text-right sm:block">
        <p class="text-xs font-medium text-white">
            {{ authStore.user?.username }}
        </p>

        <p class="text-xs text-slate-500">
            Administrator
        </p>
    </div>

    <button
        type="button"
        class="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
        @click="handleLogout"
    >
        Logout
    </button>

</div>

  </header>
</template>
