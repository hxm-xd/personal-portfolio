// Portfolio Script
document.addEventListener("DOMContentLoaded", () => {
  trackPortfolioView();
  loadProjectsFromAdmin();
  loadPortfolioSettings();
  setupProfileImage();
});

// Track portfolio views
function trackPortfolioView() {
  const views = parseInt(localStorage.getItem('portfolio_views') || '0');
  localStorage.setItem('portfolio_views', views + 1);
}

// Load projects from admin dashboard
function loadProjectsFromAdmin() {
  const container = document.getElementById('projects-container');
  const projects = JSON.parse(localStorage.getItem('admin_projects') || '[]');
  
  if (projects.length === 0) {
    // Show empty state - no sample projects
    displayProjects([]);
  } else {
    displayProjects(projects);
  }
}

// Display projects in the container
function displayProjects(projects) {
  const container = document.getElementById('projects-container');
  
  if (projects.length === 0) {
    container.innerHTML = `
      <div class="no-projects">
        <i class="fas fa-briefcase" style="font-size: 3rem; color: var(--text-light); margin-bottom: 1rem;"></i>
        <h3>No projects available</h3>
        <p>Projects will be displayed here once they are added.</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = projects.map(project => `
    <div class="project-card">
      ${project.image ? `
        <div class="project-image">
          <img src="${project.image}" alt="${project.title}" onclick="openMedia('${project.image}')" />
        </div>
      ` : ''}
      <div class="project-content">
        <h3 class="project-title">${project.title}</h3>
        <p class="project-description">${project.description}</p>
        ${project.technologies ? `
          <div class="project-technologies">
            ${project.technologies.split(', ').map(tech => `<span>${tech}</span>`).join('')}
          </div>
        ` : ''}
        ${project.url ? `
          <a href="${project.url}" class="project-link" target="_blank">
            <i class="fas fa-external-link-alt"></i>
            View Project
          </a>
        ` : ''}
      </div>
    </div>
  `).join('');
}

// Load portfolio settings from admin dashboard
function loadPortfolioSettings() {
  const portfolio = JSON.parse(localStorage.getItem('admin_portfolio') || '{}');
  
  // Update profile information
  if (portfolio.name) {
    document.querySelector('.profile-info h1').textContent = portfolio.name;
  }
  
  if (portfolio.title) {
    document.querySelector('.profile-info .title').textContent = portfolio.title;
  }
  
  if (portfolio.subtitle) {
    document.querySelector('.profile-info .subtitle').textContent = portfolio.subtitle;
  }
  
  // Update about section
  if (portfolio.about) {
    const aboutText = document.querySelector('.about-text p:first-child');
    if (aboutText) {
      aboutText.textContent = portfolio.about;
    }
  }
  
  // Update social links
  if (portfolio.social) {
    const socialLinks = document.querySelectorAll('.social-link');
    if (portfolio.social.github) {
      socialLinks[0].href = portfolio.social.github;
    }
    if (portfolio.social.linkedin) {
      socialLinks[1].href = portfolio.social.linkedin;
    }
    if (portfolio.social.twitter) {
      socialLinks[2].href = portfolio.social.twitter;
    }
    if (portfolio.social.email) {
      socialLinks[3].href = `mailto:${portfolio.social.email}`;
    }
  }
  
  // Update statistics
  if (portfolio.stats) {
    const statItems = document.querySelectorAll('.stat-number');
    if (portfolio.stats.experience && statItems[0]) {
      statItems[0].textContent = portfolio.stats.experience + '+';
    }
    if (portfolio.stats.projects && statItems[1]) {
      statItems[1].textContent = portfolio.stats.projects + '+';
    }
    if (portfolio.stats.technologies && statItems[2]) {
      statItems[2].textContent = portfolio.stats.technologies + '+';
    }
  }
  
  // Update skills
  if (portfolio.skills) {
    this.updateSkills(portfolio.skills);
  }
  
  // Update profile image
  if (portfolio.profileImage) {
    const profileImg = document.getElementById('profile-img');
    if (profileImg) {
      profileImg.src = portfolio.profileImage;
    }
  }
  
  // Update contact information
  if (portfolio.contact) {
    console.log('Loading contact info:', portfolio.contact);
    const contactItems = document.querySelectorAll('.contact-item');
    console.log('Found contact items:', contactItems.length);
    
    // Update location (second contact item)
    if (portfolio.contact.location && contactItems[1]) {
      const locationText = contactItems[1].querySelector('p');
      if (locationText) {
        locationText.textContent = portfolio.contact.location;
        console.log('Updated location:', portfolio.contact.location);
      }
    }
    
    // Update email (first contact item)
    if (portfolio.contact.email && contactItems[0]) {
      const emailText = contactItems[0].querySelector('p');
      if (emailText) {
        emailText.textContent = portfolio.contact.email;
        console.log('Updated email:', portfolio.contact.email);
      }
    }
    
    // Update education (third contact item)
    if (portfolio.contact.education && contactItems[2]) {
      const educationText = contactItems[2].querySelector('p');
      if (educationText) {
        educationText.textContent = portfolio.contact.education;
        console.log('Updated education:', portfolio.contact.education);
      }
    }
  }
}

// Update skills on the portfolio page
function updateSkills(skills) {
  // Find all skill categories and update them based on their position
  const skillCategories = document.querySelectorAll('.skill-category');
  
  if (skillCategories.length >= 5) {
    // Programming Languages (first category)
    if (skills.programming) {
      const programmingContainer = skillCategories[0].querySelector('.skill-items');
      if (programmingContainer) {
        programmingContainer.innerHTML = skills.programming.map(skill => `
          <div class="skill-item">
            <span class="skill-name">${skill.name}</span>
            <span class="skill-level">${skill.level}</span>
          </div>
        `).join('');
      }
    }
    
    // Web Technologies (second category)
    if (skills.web) {
      const webContainer = skillCategories[1].querySelector('.skill-items');
      if (webContainer) {
        webContainer.innerHTML = skills.web.map(skill => `
          <div class="skill-item">
            <span class="skill-name">${skill.name}</span>
            <span class="skill-level">${skill.level}</span>
          </div>
        `).join('');
      }
    }
    
    // Mobile Development (third category)
    if (skills.mobile) {
      const mobileContainer = skillCategories[2].querySelector('.skill-items');
      if (mobileContainer) {
        mobileContainer.innerHTML = skills.mobile.map(skill => `
          <div class="skill-item">
            <span class="skill-name">${skill.name}</span>
            <span class="skill-level">${skill.level}</span>
          </div>
        `).join('');
      }
    }
    
    // Databases (fourth category)
    if (skills.database) {
      const databaseContainer = skillCategories[3].querySelector('.skill-items');
      if (databaseContainer) {
        databaseContainer.innerHTML = skills.database.map(skill => `
          <div class="skill-item">
            <span class="skill-name">${skill.name}</span>
            <span class="skill-level">${skill.level}</span>
          </div>
        `).join('');
      }
    }
    
    // IoT & Hardware (fifth category)
    if (skills.iot) {
      const iotContainer = skillCategories[4].querySelector('.skill-items');
      if (iotContainer) {
        iotContainer.innerHTML = skills.iot.map(skill => `
          <div class="skill-item">
            <span class="skill-name">${skill.name}</span>
            <span class="skill-level">${skill.level}</span>
          </div>
        `).join('');
      }
    }
  }
}

// Setup profile image functionality
function setupProfileImage() {
  const profileImg = document.getElementById('profile-img');
  
  // Handle profile image error (fallback to placeholder)
  profileImg.onerror = function() {
    this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjNjM2NmYxIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSIzMCIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTQwIDE2MEM0MCAxNDAgNjAgMTIwIDEwMCAxMjBDMTQwIDEyMCAxNjAgMTQwIDE2MCAxNjBIMTQwQzE0MCAxNTAgMTMwIDE0MCAxMDAgMTQwQzcwIDE0MCA2MCAxNTAgNjAgMTYwSDQwWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+';
  };
  
  // Add click handler for profile image upload (future feature)
  profileImg.addEventListener('click', function() {
    // This could be expanded to allow profile image upload
    console.log('Profile image clicked - upload feature coming soon!');
  });
}

// Send contact message
function sendMessage(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const message = {
    id: Date.now().toString(),
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
    date: new Date().toISOString(),
    read: false
  };
  
  // Save to localStorage
  const contacts = JSON.parse(localStorage.getItem('admin_contacts') || '[]');
  contacts.push(message);
  localStorage.setItem('admin_contacts', JSON.stringify(contacts));
  
  // Show success message
  showNotification('Message sent successfully! I\'ll get back to you soon.', 'success');
  
  // Reset form
  event.target.reset();
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <i class="fas fa-${getNotificationIcon(type)}"></i>
    <span>${message}</span>
    <button onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  // Add styles if not already present
  if (!document.querySelector('#notification-styles')) {
    const styles = document.createElement('style');
    styles.id = 'notification-styles';
    styles.textContent = `
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--bg-primary);
        color: var(--text-primary);
        padding: 1rem 1.5rem;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        border-left: 4px solid var(--primary);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        z-index: 3000;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
      }
      
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      .notification-success { border-left-color: var(--success); }
      .notification-error { border-left-color: var(--danger); }
      .notification-warning { border-left-color: var(--accent); }
      
      .notification i { font-size: 1.25rem; }
      .notification-success i { color: var(--success); }
      .notification-error i { color: var(--danger); }
      .notification-warning i { color: var(--accent); }
      
      .notification button {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 0.25rem;
        border-radius: var(--radius);
        transition: var(--transition);
        margin-left: auto;
      }
      
      .notification button:hover {
        background: rgba(0, 0, 0, 0.1);
        color: var(--text-primary);
      }
    `;
    document.head.appendChild(styles);
  }
  
  document.body.appendChild(notification);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

// Get notification icon
function getNotificationIcon(type) {
  switch (type) {
    case 'success': return 'check-circle';
    case 'error': return 'exclamation-circle';
    case 'warning': return 'exclamation-triangle';
    default: return 'info-circle';
  }
}

// Open media in lightbox
function openMedia(src) {
  const lightbox = document.getElementById('lightbox');
  const content = document.getElementById('lightbox-content');
  
  if (src.endsWith('.mp4')) {
    content.innerHTML = `<video src="${src}" controls autoplay></video>`;
  } else {
    content.innerHTML = `<img src="${src}" alt="Project media" />`;
  }
  
  lightbox.style.display = 'flex';
}

// Close lightbox
function closeMedia() {
  document.getElementById('lightbox').style.display = 'none';
  document.getElementById('lightbox-content').innerHTML = '';
}

// Add lightbox styles if not present
if (!document.querySelector('#lightbox-styles')) {
  const lightboxStyles = document.createElement('style');
  lightboxStyles.id = 'lightbox-styles';
  lightboxStyles.textContent = `
    #lightbox {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      backdrop-filter: blur(5px);
    }
    
    #lightbox-content {
      max-width: 90%;
      max-height: 90%;
      background: transparent;
      border-radius: var(--radius-xl);
      position: relative;
    }
    
    #lightbox-content img,
    #lightbox-content video {
      max-width: 800px;
      max-height: 600px;
      display: block;
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-xl);
    }
  `;
  document.head.appendChild(lightboxStyles);
}

  