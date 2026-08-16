<!--
  AppFooter.vue - Pie de página de la aplicación.

  Muestra los créditos de la Universidad de Costa Rica (UCR) y el
  programa de Trabajo Comunal Universitario (TCU) asociado al proyecto.
-->
<script setup>
// Año actual para el copyright
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="app-footer">
    <div class="footer-container">
      <!-- Créditos institucionales -->
      <div class="footer-credits">
        <p class="footer-title">Proyecto de Trabajo Comunal Universitario (TCU)</p>
        <p class="footer-institution">Universidad de Costa Rica - Sede Guanacaste</p>
      </div>

      <!-- Información adicional -->
      <div class="footer-info">
        <p class="footer-description">
          Directorio digital para la visibilización y contacto de MIPYMES
          productoras de alimentos en la provincia de Guanacaste.
        </p>
      </div>

      <!-- Línea de copyright -->
      <div class="footer-bottom">
        <p>&copy; {{ currentYear }} TCU - UCR. Todos los derechos reservados.</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  background-color: var(--color-surface-dark);
  color: var(--color-text-light);
  padding: 2rem 1.5rem 1rem;
  margin-top: 3rem;
}

.footer-container {
  max-width: 1280px;
  margin: 0 auto;
  text-align: center;
}

.footer-title {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.footer-institution {
  font-size: 0.9rem;
  opacity: 0.9;
}

.footer-info {
  margin-top: 1rem;
}

.footer-description {
  font-size: 0.85rem;
  opacity: 0.75;
  max-width: 500px;
  margin: 0 auto;
  line-height: 1.5;
}

.footer-bottom {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.8rem;
  opacity: 0.6;
}
</style>
