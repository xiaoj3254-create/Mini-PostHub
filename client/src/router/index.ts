import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/Home.vue'),
    },
    {
      path: '/posts/:id',
      name: 'post-detail',
      component: () => import('../views/PostDetail.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/auth/Login.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/auth/Register.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/profile/Profile.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/me/posts',
      name: 'my-posts',
      component: () => import('../views/profile/MyPosts.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/me/collects',
      name: 'my-collects',
      component: () => import('../views/profile/MyCollects.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/posts/:id/edit',
      name: 'post-edit',
      component: () => import('../views/PostEditor.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/publish',
      name: 'post-publish',
      component: () => import('../views/PostEditor.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin',
      component: () => import('../components/layout/AdminLayout.vue'),
      meta: { requiresAdmin: true },
      children: [
        {
          path: '',
          name: 'admin-dashboard',
          component: () => import('../views/admin/AdminDashboard.vue'),
        },
        {
          path: 'posts',
          name: 'admin-posts',
          component: () => import('../views/admin/AdminPosts.vue'),
        },
        {
          path: 'categories',
          name: 'admin-categories',
          component: () => import('../views/admin/AdminCategories.vue'),
        },
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('../views/admin/AdminUsers.vue'),
        },
        {
          path: 'comments',
          name: 'admin-comments',
          component: () => import('../views/admin/AdminComments.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return { name: 'home' }
  }
  if (to.meta.guestOnly && auth.isLoggedIn) {
    return { name: 'home' }
  }
  return true
})

export default router
