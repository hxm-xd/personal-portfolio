// Simplified Portfolio Script with Firebase Integration
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
    // Show empty state if no projects exist
    displayProjects([]);
  } else {
    displayProjects(projects);
  }
  } catch (error) {
    console.error('Error loading projects:', error);
    // Fallback to empty state
    displayProjects([]);
  }
}

// Load portfolio settings from Firebase
async function loadPortfolioSettingsFromFirebase() {
  try {
    console.log('Loading portfolio settings from Firebase...');
    const portfolioDoc = await db.collection('public').doc('portfolio').get();
    const portfolio = portfolioDoc.exists ? portfolioDoc.data() : {};
    console.log('Portfolio data loaded:', portfolio);

    // Update profile information
    if (portfolio.profile) {
      if (portfolio.profile.name) {
        document.getElementById('profile-name').textContent = portfolio.profile.name;
        document.getElementById('footer-name').textContent = portfolio.profile.name;
      }
      if (portfolio.profile.title) {
        document.getElementById('profile-title').textContent = portfolio.profile.title;
      }
      if (portfolio.profile.subtitle) {
        document.getElementById('profile-subtitle').textContent = portfolio.profile.subtitle;
      }
      if (portfolio.profile.about) {
        document.getElementById('about-text').textContent = portfolio.profile.about;
      }
    }

    // Update social links
    if (portfolio.social) {
      console.log('Updating social links with:', portfolio.social);
      
      const githubLink = document.getElementById('github-link');
      const linkedinLink = document.getElementById('linkedin-link');
      const twitterLink = document.getElementById('twitter-link');
      const emailLink = document.getElementById('email-link');
      
      if (portfolio.social.github && githubLink) {
        githubLink.href = portfolio.social.github;
        githubLink.style.opacity = '1';
        console.log('Updated GitHub link:', portfolio.social.github);
      }
      if (portfolio.social.linkedin && linkedinLink) {
        linkedinLink.href = portfolio.social.linkedin;
        linkedinLink.style.opacity = '1';
        console.log('Updated LinkedIn link:', portfolio.social.linkedin);
      }
      if (portfolio.social.twitter && twitterLink) {
        twitterLink.href = portfolio.social.twitter;
        twitterLink.style.opacity = '1';
        console.log('Updated Twitter link:', portfolio.social.twitter);
      }
      if (portfolio.social.email && emailLink) {
        emailLink.href = `mailto:${portfolio.social.email}`;
        emailLink.style.opacity = '1';
        console.log('Updated Email link:', portfolio.social.email);
      }
    }

    // Update statistics
    if (portfolio.stats) {
      if (portfolio.stats.experience) {
        document.getElementById('experience-stat').textContent = portfolio.stats.experience + '+';
      }
      if (portfolio.stats.projects) {
        document.getElementById('projects-stat').textContent = portfolio.stats.projects + '+';
      }
      if (portfolio.stats.technologies) {
        document.getElementById('technologies-stat').textContent = portfolio.stats.technologies + '+';
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
      if (portfolio.contact.email) {
        document.getElementById('contact-email').textContent = portfolio.contact.email;
      }
      if (portfolio.contact.location) {
        document.getElementById('contact-location').textContent = portfolio.contact.location;
      }
      if (portfolio.contact.education) {
        document.getElementById('contact-education').textContent = portfolio.contact.education;
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
        <h3>No projects available</h3>
        <p>Projects will be displayed here once they are added.</p>
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

// Get empty projects array - no sample data
function getSampleProjects() {
  return [];
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
    // Find the skill category by looking for the h3 with the specific title
    const skillCategories = document.querySelectorAll('.skill-category');
    let targetCategory = null;
    
    skillCategories.forEach(category => {
      const h3 = category.querySelector('h3');
      if (h3 && h3.textContent === categoryTitle) {
        targetCategory = category;
      }
    });
    
    if (targetCategory && skills[categoryKey]) {
      const container = targetCategory.querySelector('.skill-items');
      if (container) {
        container.innerHTML = skills[categoryKey].map(skill => `
          <div class="skill-item">
            <i class="fas fa-check-circle"></i>
            <span class="skill-name">${skill.name}</span>
            <span class="skill-level">${skill.level}</span>
          </div>
        `).join('');
      }
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
