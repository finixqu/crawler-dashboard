import { createRouter, createWebHistory } from 'vue-router'

import DashboardView from '../views/DashboardView.vue'
import ProjectCrawlerView from '@/views/ProjectCrawlerView.vue'
import GroupCrawlerView from '@/views/GroupCrawlerView.vue'
import LogsView from '@/views/LogsView.vue'
import JobsView from '@/views/JobsView.vue'

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
    },

    {
      path: '/jobs',
      name: 'jobs',
      component: JobsView
    },

    {
      path: '/logs',
      name: 'logs',
      component: LogsView
    }
  ],
})

export default router
