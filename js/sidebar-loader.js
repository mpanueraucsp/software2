function loadSidebar(currentPage) {
  // Cargar el HTML del sidebar
  fetch('../components/sidebar.html')
    .then(response => response.text())
    .then(html => {
      document.getElementById('sidebar-container').innerHTML = html;
      
      // Marcar la página activa
      document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.classList.remove('active');
        
        if (item.dataset.page === currentPage) {
          item.classList.add('active');
          
          // Cambiar la estrella a llena
          const icon = item.querySelector('.nav-icon');
          if (icon && icon.textContent === '☆') {
            icon.textContent = '★';
          }
          
          // Poner el label en mayúsculas y bold
          const label = item.querySelector('.nav-label');
          if (label) {
            label.style.textTransform = 'uppercase';
            label.style.fontWeight = '600';
          }

          // Poner la descripción en blanco
          const desc = item.querySelector('.nav-desc');
          if (desc) {
            desc.style.color = 'white';
          }
        }
      });
    });
}