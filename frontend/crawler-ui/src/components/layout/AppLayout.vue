<script setup>
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'

import { ref } from 'vue'
import { RouterView } from 'vue-router'


const sidebarOpen = ref(false)


const toggleSidebar = () =>  sidebarOpen.value = !sidebarOpen.value


const closeSidebar = () => sidebarOpen.value = false
</script>



<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">

    <div class="flex min-h-screen">

      <AppSidebar 
        :open="sidebarOpen"
        @close="closeSidebar"  
      />

      <div class="flex min-w-0 flex-1 flex-col">

        <AppHeader @toggle-sidebar="toggleSidebar" />

        <main class="flex-1 p-6">
          <RouterView />
        </main>

      </div>

    </div>

  </div>
</template>


