import { createRouter, createWebHistory } from 'vue-router'

import DashboardView from '../views/DashboardView.vue'
import ProjectCrawlerView from '@/views/ProjectCrawlerView.vue'
import GroupCrawlerView from '@/views/GroupCrawlerView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
    },

    {
      path: '/project-crawler',
      name: 'project-crawler',
      component: ProjectCrawlerView
    },

    {
      path: '/group-crawler',
      name: 'group-crawler',
      component: GroupCrawlerView
    }
  ],
})

export default router
