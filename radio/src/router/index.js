import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import PreferitiView from '../views/PreferitiView.vue'
import MappamondoView from '../views/MappamondoView.vue'

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
  },
  {
    path: '/mappamondo',
    name: 'mappamondo',
    component: MappamondoView
  },
  // Aggiungi altre rotte qui, se necessario
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router