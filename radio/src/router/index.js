import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import PreferitiView from '../views/PreferitiView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/preferiti',
    name: 'Preferiti',
    component: PreferitiView
  }
  // Aggiungi altre rotte qui, se necessario
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router