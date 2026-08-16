// Punto de entrada principal de la aplicación
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Estilos globales
import '@/assets/styles/main.css'

// Crear instancia de la aplicación Vue
const app = createApp(App)

// Registrar plugins
app.use(router)

// Montar la aplicación en el DOM
app.mount('#app')
