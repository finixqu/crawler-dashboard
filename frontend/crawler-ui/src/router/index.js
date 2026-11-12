import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/stores/auth.store.js'

import AppLayout from '@/components/layout/AppLayout.vue'

import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import ProjectCrawlerView from '@/views/ProjectCrawlerView.vue'
import GroupCrawlerView from '@/views/GroupCrawlerView.vue'
import LogsView from '@/views/LogsView.vue'
import JobsView from '@/views/JobsView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),

    routes: [
        {
            path: '/login',
            name: 'login',
            component: LoginView,
            meta: {
                guestOnly: true
            }
        },

        {
            path: '/',
            component: AppLayout,
            meta: {
                requiresAuth: true
            },

            children: [
                {
                    path: '',
                    name: 'dashboard',
                    component: DashboardView
                },

                {
                    path: 'project-crawler',
                    name: 'project-crawler',
                    component: ProjectCrawlerView
                },

                {
                    path: 'group-crawler',
                    name: 'group-crawler',
                    component: GroupCrawlerView
                },

                {
                    path: 'jobs',
                    name: 'jobs',
                    component: JobsView
                },

                {
                    path: 'logs',
                    name: 'logs',
                    component: LogsView
                }
            ]
        },

        {
            path: '/:pathMatch(.*)*',
            redirect: '/'
        }
    ]
})

router.beforeEach(async (to) => {
    const authStore = useAuthStore()

    const requiresAuth = to.matched.some(
        route => route.meta.requiresAuth
    )

    if (requiresAuth || to.meta.guestOnly) {
        await authStore.initialize()
    }

    if (requiresAuth && !authStore.isAuthenticated) {
        return {
            name: 'login',
            query: {
                redirect: to.fullPath
            }
        }
    }

    if (to.meta.guestOnly && authStore.isAuthenticated) {
        return {
            name: 'dashboard'
        }
    }

    return true
})

export default router