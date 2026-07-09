import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/registrati',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('../layouts/AppLayout.vue'),
      children: [
        { path: '', name: 'dashboard', component: () => import('../views/DashboardView.vue') },
        {
          path: 'privato',
          name: 'privato',
          component: () => import('../views/PrivateSpaceView.vue'),
        },
        {
          path: 'bacheca',
          name: 'bacheca',
          component: () => import('../views/FamilyBoardView.vue'),
        },
        {
          path: 'carica',
          name: 'upload',
          component: () => import('../views/UploadView.vue'),
        },
        {
          path: 'documenti/:id',
          name: 'documento',
          component: () => import('../views/DocumentDetailView.vue'),
        },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.ready) await auth.restore()
  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.public && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
})

export default router
