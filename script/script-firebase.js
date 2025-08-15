// Portfolio Script with Firebase Integration
document.addEventListener("DOMContentLoaded", () => {
  trackPortfolioView();
  loadProjectsFromFirebase();
  loadPortfolioSettingsFromFirebase();
  setupProfileImage();
});

// Track portfolio views
function trackPortfolioView() {
  const views = parseInt(localStorage.getItem('portfolio_views') || '0') + 1;
  localStorage.setItem('portfolio_views', views.toString());
}

// Load projects from Firebase
async function loadProjectsFromFirebase() {
  try {
    const projectsContainer = document.getElementById('projects-container');
    
    // Show loading state
    projectsContainer.innerHTML = `
      <div class="loading-projects">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <p>Loading amazing projects...</p>
      </div>
    `;

    // Get projects from Firestore (public collection)
    const projectsSnapshot = await db.collection('public').doc('portfolio').collection('projects').get();
    const projects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (projects.length === 0) {
      // Show sample projects if none exist
      displayProjects(getSampleProjects());
    } else {
      displayProjects(projects);
    }
  } catch (error) {
    console.error('Error loading projects:', error);
    // Fallback to sample projects
    displayProjects(getSampleProjects());
  }
}

// Load portfolio settings from Firebase
async function loadPortfolioSettingsFromFirebase() {
  try {
    const portfolioDoc = await db.collection('public').doc('portfolio').get();
    const portfolio = portfolioDoc.exists ? portfolioDoc.data() : {};

    // Update profile information
    if (portfolio.profile) {
      if (portfolio.profile.name) {
        document.querySelector('.profile-info h1').textContent = portfolio.profile.name;
      }
      if (portfolio.profile.title) {
        document.querySelector('.profile-info .title').textContent = portfolio.profile.title;
      }
      if (portfolio.profile.subtitle) {
        document.querySelector('.profile-info .subtitle').textContent = portfolio.profile.subtitle;
      }
      if (portfolio.profile.about) {
        const aboutText = document.querySelector('.about-text p:first-child');
        if (aboutText) {
          aboutText.textContent = portfolio.profile.about;
        }
      }
    }

    // Update social links
    if (portfolio.social) {
      const socialLinks = document.querySelectorAll('.social-link');
      if (portfolio.social.github && socialLinks[0]) {
        socialLinks[0].href = portfolio.social.github;
      }
      if (portfolio.social.linkedin && socialLinks[1]) {
        socialLinks[1].href = portfolio.social.linkedin;
      }
      if (portfolio.social.twitter && socialLinks[2]) {
        socialLinks[2].href = portfolio.social.twitter;
      }
      if (portfolio.social.email && socialLinks[3]) {
        socialLinks[3].href = `mailto:${portfolio.social.email}`;
      }
    }

    // Update statistics
    if (portfolio.stats) {
      const statNumbers = document.querySelectorAll('.stat-number');
      if (portfolio.stats.experience && statNumbers[0]) {
        statNumbers[0].textContent = portfolio.stats.experience + '+';
      }
      if (portfolio.stats.projects && statNumbers[1]) {
        statNumbers[1].textContent = portfolio.stats.projects + '+';
      }
      if (portfolio.stats.technologies && statNumbers[2]) {
        statNumbers[2].textContent = portfolio.stats.technologies + '+';
      }
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
      const contactItems = document.querySelectorAll('.contact-item');
      
      // Update email (first contact item)
      if (portfolio.contact.email && contactItems[0]) {
        const emailText = contactItems[0].querySelector('p');
        if (emailText) {
          emailText.textContent = portfolio.contact.email;
        }
      }
      
      // Update location (second contact item)
      if (portfolio.contact.location && contactItems[1]) {
        const locationText = contactItems[1].querySelector('p');
        if (locationText) {
          locationText.textContent = portfolio.contact.location;
        }
      }
      
      // Update education (third contact item)
      if (portfolio.contact.education && contactItems[2]) {
        const educationText = contactItems[2].querySelector('p');
        if (educationText) {
          educationText.textContent = portfolio.contact.education;
        }
      }
    }

    // Update skills
    if (portfolio.skills) {
      updateSkills(portfolio.skills);
    }
  } catch (error) {
    console.error('Error loading portfolio settings:', error);
  }
}

// Display projects on the portfolio
function displayProjects(projects) {
  const projectsContainer = document.getElementById('projects-container');
  
  if (projects.length === 0) {
    projectsContainer.innerHTML = `
      <div class="no-projects">
        <i class="fas fa-folder-open"></i>
        <h3>No projects yet</h3>
        <p>Projects will appear here once they're added to the portfolio.</p>
      </div>
    `;
    return;
  }

  const projectsHTML = projects.map(project => `
    <div class="project-card">
      ${project.image ? `
        <div class="project-image">
          <img src="${project.image}" alt="${project.title}" onclick="openMedia('${project.image}', 'image')" />
        </div>
      ` : ''}
      <div class="project-content">
        <h3 class="project-title">${project.title}</h3>
        <p class="project-description">${project.description}</p>
        <div class="project-technologies">
          ${project.technologies ? project.technologies.split(',').map(tech => 
            `<span class="tech-tag">${tech.trim()}</span>`
          ).join('') : ''}
        </div>
        ${project.url ? `
          <a href="${project.url}" target="_blank" class="project-link">
            <i class="fas fa-external-link-alt"></i>
            View Project
          </a>
        ` : ''}
      </div>
    </div>
  `).join('');

  projectsContainer.innerHTML = projectsHTML;
}

// Get sample projects for fallback
function getSampleProjects() {
  return [
    {
      title: "Smart Home IoT System",
      description: "A comprehensive IoT solution for home automation using ESP32 and mobile app control.",
      technologies: "ESP32, Flutter, Firebase, IoT",
      image: "assets/robot1.jpg",
      url: "#"
    },
    {
      title: "E-Commerce Mobile App",
      description: "Cross-platform mobile application for online shopping with payment integration.",
      technologies: "Flutter, Dart, Firebase, Stripe",
      image: "assets/robot2.jpg",
      url: "#"
    },
    {
      title: "Portfolio Website",
      description: "Modern responsive portfolio website with admin dashboard and dynamic content management.",
      technologies: "HTML5, CSS3, JavaScript, Firebase",
      image: "assets/robot3.jpg",
      url: "#"
    }
  ];
}

// Update skills on the portfolio page
function updateSkills(skills) {
  const skillCategoryMap = {
    'programming': 'Programming Languages',
    'web': 'Web Technologies',
    'mobile': 'Mobile Development',
    'database': 'Databases',
    'iot': 'IoT & Hardware'
  };

  Object.keys(skillCategoryMap).forEach(categoryKey => {
    const categoryTitle = skillCategoryMap[categoryKey];
    const container = document.querySelector(`.skill-category:has(h3:contains("${categoryTitle}")) .skill-items`);
    if (container && skills[categoryKey]) {
      container.innerHTML = skills[categoryKey].map(skill => `
        <div class="skill-item">
          <span class="skill-name">${skill.name}</span>
          <span class="skill-level">${skill.level}</span>
        </div>
      `).join('');
    }
  });
}

// Setup profile image functionality
function setupProfileImage() {
  const profileImg = document.getElementById('profile-img');
  
  // Handle profile image error (fallback to placeholder)
  profileImg.onerror = function() {
    this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjNjM2NmYxIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSIzMCIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD00MCAxNjBDNDAgMTQwIDYwIDEyMCAxMDAgMTIwQzE0MCAxMjAgMTYwIDE0MCAxNjAgMTYwSDE0MEMxNDAgMTUwIDEzMCAxNDAgMTAwIDE0MEM3MCAxNDAgNjAgMTUwIDYwIDE2MFM0MCAxNjBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=';
  };
  
  // Add click handler for profile image upload (future feature)
  profileImg.addEventListener('click', function() {
    console.log('Profile image clicked - upload feature coming soon!');
  });
}

// Send contact message
async function sendMessage(event) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  const message = {
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
    timestamp: new Date().toISOString(),
    read: false
  };

  try {
    // Save to Firebase
    await db.collection('public').doc('portfolio').collection('contacts').add(message);
    
    // Show success notification
    showNotification('Message sent successfully! Thank you for reaching out.', 'success');
    
    // Reset form
    form.reset();
  } catch (error) {
    console.error('Error sending message:', error);
    showNotification('Error sending message. Please try again.', 'error');
  }
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
    <span>${message}</span>
    <button onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

// Lightbox functionality
function openMedia(src, type) {
  const lightbox = document.getElementById('lightbox');
  const content = document.getElementById('lightbox-content');
  
  if (type === 'image') {
    content.innerHTML = `<img src="${src}" alt="Project Image" />`;
  } else if (type === 'video') {
    content.innerHTML = `<video src="${src}" controls autoplay></video>`;
  }
  
  lightbox.style.display = 'flex';
}

function closeMedia() {
  document.getElementById('lightbox').style.display = 'none';
}

// Add lightbox styles if not present
if (!document.getElementById('lightbox-styles')) {
  const style = document.createElement('style');
  style.id = 'lightbox-styles';
  style.textContent = `
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
    }
    
    #lightbox-content {
      max-width: 90%;
      max-height: 90%;
    }
    
    #lightbox-content img,
    #lightbox-content video {
      width: 100%;
      height: auto;
      border-radius: 8px;
    }
  `;
  document.head.appendChild(style);
}
