<template>
  <aside
    class="hidden w-64 shrink-0 border-r border-slate-800 bg-slate-900 lg:block"
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
