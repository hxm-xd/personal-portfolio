// Admin Dashboard with Firebase Integration
class AdminDashboardFirebase {
  constructor() {
    this.currentTab = 'overview';
    this.editId = null;
    this.calendar = null;
    this.user = null;
    
    // Initialize data structure
    this.data = {
      tasks: [],
      academics: [],
      contacts: [],
      projects: [],
      settings: {},
      portfolio: {}
    };
    
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.checkAuth();
    this.initCalendar();
    this.showNotification('Welcome to Admin Dashboard!', 'success');
  }

  setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = e.target.closest('.nav-btn').getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    // Form submissions
    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.login();
    });

    document.getElementById('modal-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleModalSubmit();
    });

    // Portfolio settings forms
    document.getElementById('profile-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveProfileInfo();
    });

    document.getElementById('social-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveSocialLinks();
    });

    document.getElementById('stats-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveStatistics();
    });

    document.getElementById('contact-info-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveContactInfo();
    });

    document.getElementById('password-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.changePassword();
    });

    // Profile image upload
    document.getElementById('profile-image-input').addEventListener('change', (e) => {
      this.handleProfileImageUpload(e);
    });

    // Skills management
    document.getElementById('add-skill-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.addSkill();
    });

    // Logout
    document.querySelector('.logout-btn').addEventListener('click', () => {
      this.logout();
    });

    // Security: Reset inactivity timer on user interaction
    document.addEventListener('mousemove', () => this.resetInactivityTimer());
    document.addEventListener('keypress', () => this.resetInactivityTimer());
    document.addEventListener('click', () => this.resetInactivityTimer());
    document.addEventListener('scroll', () => this.resetInactivityTimer());
  }

  async checkAuth() {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        this.user = user;
        this.showDashboard();
        await this.loadData();
        this.startInactivityTimer();
      } else {
        this.showLogin();
      }
    });
  }

  async login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('login-error');
    const button = document.querySelector('#login-form button');

    try {
      button.disabled = true;
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

      await auth.signInWithEmailAndPassword(email, password);
      errorEl.style.display = 'none';
      this.showNotification('Login successful!', 'success');
    } catch (error) {
      errorEl.textContent = error.message;
      errorEl.style.display = 'block';
      this.showNotification('Login failed: ' + error.message, 'error');
    } finally {
      button.disabled = false;
      button.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
    }
  }

  async logout() {
    try {
      await auth.signOut();
      this.showNotification('Logged out successfully', 'info');
    } catch (error) {
      this.showNotification('Logout error: ' + error.message, 'error');
    }
  }

  showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('admin-dashboard').style.display = 'none';
  }

  showDashboard() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    this.switchTab('overview');
  }

  async loadData() {
    try {
      const userId = this.user.uid;
      
      // Load all data from Firestore
      const tasksSnapshot = await db.collection('users').doc(userId).collection('tasks').get();
      this.data.tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const academicsSnapshot = await db.collection('users').doc(userId).collection('academics').get();
      this.data.academics = academicsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const contactsSnapshot = await db.collection('users').doc(userId).collection('contacts').get();
      this.data.contacts = contactsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const projectsSnapshot = await db.collection('users').doc(userId).collection('projects').get();
      this.data.projects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const settingsDoc = await db.collection('users').doc(userId).collection('settings').doc('main').get();
      this.data.settings = settingsDoc.exists ? settingsDoc.data() : {};

      const portfolioDoc = await db.collection('users').doc(userId).collection('portfolio').doc('main').get();
      this.data.portfolio = portfolioDoc.exists ? portfolioDoc.data() : {};

      this.renderAllData();
      this.updateCalendar();
      this.loadUpcomingDeadlines();
      this.loadPortfolioSettings();
    } catch (error) {
      this.showNotification('Error loading data: ' + error.message, 'error');
    }
  }

  async saveData() {
    try {
      const userId = this.user.uid;
      
      // Save all data to Firestore
      const batch = db.batch();

      // Save tasks
      this.data.tasks.forEach(task => {
        const docRef = db.collection('users').doc(userId).collection('tasks').doc(task.id);
        batch.set(docRef, task);
      });

      // Save academics
      this.data.academics.forEach(academic => {
        const docRef = db.collection('users').doc(userId).collection('academics').doc(academic.id);
        batch.set(docRef, academic);
      });

      // Save contacts
      this.data.contacts.forEach(contact => {
        const docRef = db.collection('users').doc(userId).collection('contacts').doc(contact.id);
        batch.set(docRef, contact);
      });

      // Save projects
      this.data.projects.forEach(project => {
        const docRef = db.collection('users').doc(userId).collection('projects').doc(project.id);
        batch.set(docRef, project);
      });

      // Save settings
      batch.set(db.collection('users').doc(userId).collection('settings').doc('main'), this.data.settings);

      // Save portfolio
      batch.set(db.collection('users').doc(userId).collection('portfolio').doc('main'), this.data.portfolio);

      await batch.commit();
      this.showNotification('Data saved successfully!', 'success');
    } catch (error) {
      this.showNotification('Error saving data: ' + error.message, 'error');
    }
  }

  async addItem(type) {
    const form = document.getElementById('modal-form');
    const formData = new FormData(form);
    const item = {};

    // Get field configuration
    const fieldConfigs = {
      task: ['title', 'description', 'priority', 'deadline', 'status'],
      academic: ['title', 'description', 'deadline', 'priority', 'status'],
      project: ['title', 'description', 'technologies', 'url', 'image', 'status']
    };

    const fields = fieldConfigs[type];
    fields.forEach(field => {
      item[field] = formData.get(field) || '';
    });

    item.id = this.generateId();
    item.createdAt = new Date().toISOString();
    item.updatedAt = new Date().toISOString();

    this.data[type + 's'].push(item);
    await this.saveData();
    this.renderData(type + 's');
    this.closeModal();

    if (type === 'task' || type === 'academic') {
      this.updateCalendar();
      this.loadUpcomingDeadlines();
    }
  }

  async updateItem(type, id) {
    const form = document.getElementById('modal-form');
    const formData = new FormData(form);
    const item = this.data[type + 's'].find(item => item.id === id);

    if (!item) {
      this.showNotification('Item not found!', 'error');
      return;
    }

    const fieldConfigs = {
      task: ['title', 'description', 'priority', 'deadline', 'status'],
      academic: ['title', 'description', 'deadline', 'priority', 'status'],
      project: ['title', 'description', 'technologies', 'url', 'image', 'status']
    };

    const fields = fieldConfigs[type];
    fields.forEach(field => {
      item[field] = formData.get(field) || '';
    });

    item.updatedAt = new Date().toISOString();

    await this.saveData();
    this.renderData(type + 's');
    this.closeModal();

    if (type === 'task' || type === 'academic') {
      this.updateCalendar();
      this.loadUpcomingDeadlines();
    }
  }

  async deleteItem(type, id) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    const index = this.data[type + 's'].findIndex(item => item.id === id);
    if (index === -1) {
      this.showNotification('Item not found!', 'error');
      return;
    }

    this.data[type + 's'].splice(index, 1);
    await this.saveData();
    this.renderData(type + 's');

    if (type === 'task' || type === 'academic') {
      this.updateCalendar();
      this.loadUpcomingDeadlines();
    }
  }

  async handleProfileImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const userId = this.user.uid;
      const storageRef = storage.ref(`users/${userId}/profile.jpg`);
      await storageRef.put(file);
      const downloadURL = await storageRef.getDownloadURL();
      
      this.data.portfolio.profileImage = downloadURL;
      await this.saveData();
      
      document.getElementById('current-profile-image').src = downloadURL;
      this.showNotification('Profile image updated successfully!', 'success');
    } catch (error) {
      this.showNotification('Error uploading image: ' + error.message, 'error');
    }
  }

  async changePassword() {
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword.length < 8) {
      this.showNotification('New password must be at least 8 characters', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      this.showNotification('New password and confirm password do not match', 'error');
      return;
    }

    try {
      // Re-authenticate user before password change
      const credential = firebase.auth.EmailAuthProvider.credential(this.user.email, currentPassword);
      await this.user.reauthenticateWithCredential(credential);
      
      // Change password
      await this.user.updatePassword(newPassword);
      
      this.showNotification('Password changed successfully!', 'success');
      document.getElementById('password-form').reset();
    } catch (error) {
      this.showNotification('Error changing password: ' + error.message, 'error');
    }
  }

  // Utility methods (same as before)
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  showNotification(message, type = 'info') {
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

  // Tab switching
  switchTab(tab) {
    this.currentTab = tab;
    
    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    
    // Show/hide tabs
    document.querySelectorAll('.tab').forEach(t => {
      t.style.display = 'none';
    });
    document.getElementById(tab).style.display = 'block';
    
    // Load specific data for tab
    if (tab === 'overview') {
      this.loadOverviewData();
    } else if (tab === 'tasks') {
      this.renderData('tasks');
    } else if (tab === 'academics') {
      this.renderData('academics');
    } else if (tab === 'contacts') {
      this.renderData('contacts');
    } else if (tab === 'portfolio') {
      this.renderData('projects');
    } else if (tab === 'portfolio-settings') {
      this.loadPortfolioSettings();
    }
  }

  // Render data for different sections
  renderData(type) {
    const container = document.getElementById(type);
    if (!container) return;

    const items = this.data[type];
    if (items.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-${type === 'tasks' ? 'tasks' : type === 'academics' ? 'graduation-cap' : type === 'contacts' ? 'envelope' : 'briefcase'}"></i>
          <h3>No ${type} yet</h3>
          <p>Add your first ${type.slice(0, -1)} to get started.</p>
          <button onclick="openModal('${type.slice(0, -1)}')" class="btn-primary">
            <i class="fas fa-plus"></i>
            Add ${type.slice(0, -1)}
          </button>
        </div>
      `;
      return;
    }

    const itemsHTML = items.map(item => {
      const statusClass = item.status === 'completed' ? 'completed' : '';
      const priorityClass = item.priority === 'high' ? 'high-priority' : item.priority === 'medium' ? 'medium-priority' : 'low-priority';
      
      return `
        <div class="item-card ${statusClass} ${priorityClass}">
          <div class="item-content">
            <h4 class="item-title">${item.title}</h4>
            <p class="item-description">${item.description}</p>
            <div class="item-meta">
              ${item.deadline ? `<span><i class="fas fa-calendar"></i> ${new Date(item.deadline).toLocaleDateString()}</span>` : ''}
              ${item.priority ? `<span class="priority-${item.priority}"><i class="fas fa-flag"></i> ${item.priority}</span>` : ''}
              ${item.status ? `<span class="status-${item.status}"><i class="fas fa-circle"></i> ${item.status}</span>` : ''}
            </div>
          </div>
          <div class="item-actions">
            ${type === 'tasks' ? `<button onclick="completeTask('${item.id}')" class="btn-success"><i class="fas fa-check"></i></button>` : ''}
            <button onclick="editItem('${type.slice(0, -1)}', '${item.id}')" class="btn-secondary"><i class="fas fa-edit"></i></button>
            <button onclick="deleteItem('${type.slice(0, -1)}', '${item.id}')" class="btn-danger"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = itemsHTML;
  }

  // Render all data
  renderAllData() {
    this.renderData('tasks');
    this.renderData('academics');
    this.renderData('contacts');
    this.renderData('projects');
  }

  // Initialize calendar
  initCalendar() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;

    this.calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      height: 400,
      events: this.getCalendarEvents(),
      eventClick: function(info) {
        alert('Event: ' + info.event.title);
      }
    });

    this.calendar.render();
  }

  // Get calendar events from tasks and academics
  getCalendarEvents() {
    const events = [];
    
    this.data.tasks.forEach(task => {
      if (task.deadline) {
        events.push({
          title: task.title,
          date: task.deadline,
          backgroundColor: task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#10b981',
          borderColor: task.priority === 'high' ? '#dc2626' : task.priority === 'medium' ? '#d97706' : '#059669'
        });
      }
    });

    this.data.academics.forEach(academic => {
      if (academic.deadline) {
        events.push({
          title: academic.title,
          date: academic.deadline,
          backgroundColor: '#3b82f6',
          borderColor: '#2563eb'
        });
      }
    });

    return events;
  }

  // Update calendar
  updateCalendar() {
    if (this.calendar) {
      this.calendar.removeAllEvents();
      this.calendar.addEventSource(this.getCalendarEvents());
    }
  }

  // Load upcoming deadlines
  loadUpcomingDeadlines() {
    const container = document.getElementById('upcoming-deadlines');
    if (!container) return;

    const allDeadlines = [
      ...this.data.tasks.map(task => ({ ...task, type: 'task' })),
      ...this.data.academics.map(academic => ({ ...academic, type: 'academic' }))
    ].filter(item => item.deadline && item.status !== 'completed')
     .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
     .slice(0, 5);

    if (allDeadlines.length === 0) {
      container.innerHTML = '<p>No upcoming deadlines</p>';
      return;
    }

    const deadlinesHTML = allDeadlines.map(item => `
      <div class="deadline-item">
        <div class="deadline-info">
          <h4>${item.title}</h4>
          <p>${new Date(item.deadline).toLocaleDateString()}</p>
        </div>
        <span class="deadline-type ${item.type}">${item.type}</span>
      </div>
    `).join('');

    container.innerHTML = deadlinesHTML;
  }

  // Load overview data
  loadOverviewData() {
    const stats = {
      tasks: this.data.tasks.length,
      completedTasks: this.data.tasks.filter(t => t.status === 'completed').length,
      academics: this.data.academics.length,
      contacts: this.data.contacts.length,
      projects: this.data.projects.length
    };

    document.getElementById('total-tasks').textContent = stats.tasks;
    document.getElementById('completed-tasks').textContent = stats.completedTasks;
    document.getElementById('total-academics').textContent = stats.academics;
    document.getElementById('total-contacts').textContent = stats.contacts;
    document.getElementById('total-projects').textContent = stats.projects;

    this.updateCalendar();
    this.loadUpcomingDeadlines();
  }

  // Load portfolio settings
  loadPortfolioSettings() {
    const portfolio = this.data.portfolio;
    
    // Load profile info
    if (portfolio.name) document.getElementById('profile-name').value = portfolio.name;
    if (portfolio.title) document.getElementById('profile-title').value = portfolio.title;
    if (portfolio.subtitle) document.getElementById('profile-subtitle').value = portfolio.subtitle;
    if (portfolio.about) document.getElementById('profile-about').value = portfolio.about;

    // Load social links
    if (portfolio.social) {
      if (portfolio.social.github) document.getElementById('social-github').value = portfolio.social.github;
      if (portfolio.social.linkedin) document.getElementById('social-linkedin').value = portfolio.social.linkedin;
      if (portfolio.social.twitter) document.getElementById('social-twitter').value = portfolio.social.twitter;
      if (portfolio.social.email) document.getElementById('social-email').value = portfolio.social.email;
    }

    // Load statistics
    if (portfolio.stats) {
      if (portfolio.stats.experience) document.getElementById('stats-experience').value = portfolio.stats.experience;
      if (portfolio.stats.projects) document.getElementById('stats-projects').value = portfolio.stats.projects;
      if (portfolio.stats.technologies) document.getElementById('stats-technologies').value = portfolio.stats.technologies;
    }

    // Load contact info
    if (portfolio.contact) {
      if (portfolio.contact.location) document.getElementById('contact-location').value = portfolio.contact.location;
      if (portfolio.contact.email) document.getElementById('contact-email').value = portfolio.contact.email;
      if (portfolio.contact.education) document.getElementById('contact-education').value = portfolio.contact.education;
    }

    // Load profile image
    if (portfolio.profileImage) {
      document.getElementById('current-profile-image').src = portfolio.profileImage;
    }

    // Load skills
    this.loadSkills();
  }

  // Load skills
  loadSkills() {
    const skills = this.data.portfolio.skills || this.getDefaultSkills();
    
    Object.keys(skills).forEach(category => {
      const container = document.getElementById(`skills-${category}`);
      if (container) {
        this.renderSkillCategory(container, skills[category], category);
      }
    });
  }

  // Render skill category
  renderSkillCategory(container, skills, category) {
    container.innerHTML = skills.map((skill, index) => `
      <div class="skill-item">
        <span class="skill-name">${skill.name}</span>
        <span class="skill-level">${skill.level}</span>
        <button onclick="deleteSkill('${category}', ${index})" class="delete-skill-btn">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `).join('');
  }

  // Get default skills
  getDefaultSkills() {
    return {
      programming: [
        { name: 'Java', level: 'Advanced' },
        { name: 'Python', level: 'Intermediate' },
        { name: 'C#', level: 'Intermediate' }
      ],
      web: [
        { name: 'HTML5', level: 'Advanced' },
        { name: 'CSS3', level: 'Advanced' },
        { name: 'JavaScript', level: 'Intermediate' }
      ],
      mobile: [
        { name: 'Flutter', level: 'Intermediate' },
        { name: 'Firebase', level: 'Intermediate' }
      ],
      database: [
        { name: 'MySQL', level: 'Intermediate' },
        { name: 'Oracle', level: 'Intermediate' }
      ],
      iot: [
        { name: 'Arduino', level: 'Intermediate' },
        { name: 'ESP32', level: 'Intermediate' }
      ]
    };
  }

  // Add skill
  async addSkill() {
    const form = document.getElementById('add-skill-form');
    const formData = new FormData(form);
    const category = formData.get('skill-category');
    const name = formData.get('skill-name');
    const level = formData.get('skill-level');

    if (!name || !level) {
      this.showNotification('Please fill in all skill fields', 'error');
      return;
    }

    if (!this.data.portfolio.skills) {
      this.data.portfolio.skills = this.getDefaultSkills();
    }

    this.data.portfolio.skills[category].push({ name, level });
    await this.saveData();
    
    const container = document.getElementById(`skills-${category}`);
    this.renderSkillCategory(container, this.data.portfolio.skills[category], category);
    
    form.reset();
    this.showNotification('Skill added successfully!', 'success');
  }

  // Delete skill
  async deleteSkill(category, index) {
    this.data.portfolio.skills[category].splice(index, 1);
    await this.saveData();
    
    const container = document.getElementById(`skills-${category}`);
    this.renderSkillCategory(container, this.data.portfolio.skills[category], category);
    
    this.showNotification('Skill deleted successfully!', 'success');
  }

  // Save profile info
  async saveProfileInfo() {
    const form = document.getElementById('profile-form');
    const formData = new FormData(form);
    
    this.data.portfolio.name = formData.get('name');
    this.data.portfolio.title = formData.get('title');
    this.data.portfolio.subtitle = formData.get('subtitle');
    this.data.portfolio.about = formData.get('about');
    
    await this.saveData();
    this.showNotification('Profile information saved!', 'success');
  }

  // Save social links
  async saveSocialLinks() {
    const form = document.getElementById('social-form');
    const formData = new FormData(form);
    
    this.data.portfolio.social = {
      github: formData.get('github'),
      linkedin: formData.get('linkedin'),
      twitter: formData.get('twitter'),
      email: formData.get('email')
    };
    
    await this.saveData();
    this.showNotification('Social links saved!', 'success');
  }

  // Save statistics
  async saveStatistics() {
    const form = document.getElementById('stats-form');
    const formData = new FormData(form);
    
    this.data.portfolio.stats = {
      experience: formData.get('experience'),
      projects: formData.get('projects'),
      technologies: formData.get('technologies')
    };
    
    await this.saveData();
    this.showNotification('Statistics saved!', 'success');
  }

  // Save contact info
  async saveContactInfo() {
    const form = document.getElementById('contact-info-form');
    const formData = new FormData(form);
    
    this.data.portfolio.contact = {
      location: formData.get('location'),
      email: formData.get('email'),
      education: formData.get('education')
    };
    
    await this.saveData();
    this.showNotification('Contact information saved!', 'success');
  }

  // Reset profile image
  async resetProfileImage() {
    this.data.portfolio.profileImage = '';
    await this.saveData();
    document.getElementById('current-profile-image').src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjNjM2NmYxIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSIzMCIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD00MCAxNjBDNDAgMTQwIDYwIDEyMCAxMDAgMTIwQzE0MCAxMjAgMTYwIDE0MCAxNjAgMTYwSDE0MEMxNDAgMTUwIDEzMCAxNDAgMTAwIDE0MEM3MCAxNDAgNjAgMTUwIDYwIDE2MFM0MCAxNjBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=';
    this.showNotification('Profile image reset!', 'success');
  }

  // Modal handling
  openModal(type, id = null) {
    this.editId = id;
    const modal = document.getElementById('modal');
    const title = document.getElementById('modal-title');
    const fields = document.getElementById('modal-fields');
    const form = document.getElementById('modal-form');

    title.textContent = id ? `Edit ${type}` : `Add ${type}`;
    
    const fieldConfigs = {
      task: [
        { name: 'title', type: 'text', placeholder: 'Task Title', required: true },
        { name: 'description', type: 'textarea', placeholder: 'Task Description', required: true },
        { name: 'priority', type: 'select', options: ['low', 'medium', 'high'], required: true },
        { name: 'deadline', type: 'datetime-local', required: false },
        { name: 'status', type: 'select', options: ['pending', 'in-progress', 'completed'], required: true }
      ],
      academic: [
        { name: 'title', type: 'text', placeholder: 'Academic Title', required: true },
        { name: 'description', type: 'textarea', placeholder: 'Academic Description', required: true },
        { name: 'deadline', type: 'datetime-local', required: false },
        { name: 'priority', type: 'select', options: ['low', 'medium', 'high'], required: true },
        { name: 'status', type: 'select', options: ['pending', 'in-progress', 'completed'], required: true }
      ],
      project: [
        { name: 'title', type: 'text', placeholder: 'Project Title', required: true },
        { name: 'description', type: 'textarea', placeholder: 'Project Description', required: true },
        { name: 'technologies', type: 'text', placeholder: 'Technologies (comma-separated)', required: false },
        { name: 'url', type: 'url', placeholder: 'Project URL (optional)', required: false },
        { name: 'image', type: 'url', placeholder: 'Project Image URL (optional)', required: false },
        { name: 'status', type: 'select', options: ['active', 'completed', 'archived'], required: true }
      ]
    };

    const config = fieldConfigs[type];
    fields.innerHTML = config.map(field => {
      if (field.type === 'textarea') {
        return `<textarea name="${field.name}" placeholder="${field.placeholder}" ${field.required ? 'required' : ''}></textarea>`;
      } else if (field.type === 'select') {
        return `
          <select name="${field.name}" ${field.required ? 'required' : ''}>
            <option value="">Select ${field.name}</option>
            ${field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
          </select>
        `;
      } else {
        return `<input type="${field.type}" name="${field.name}" placeholder="${field.placeholder}" ${field.required ? 'required' : ''} />`;
      }
    }).join('');

    // Populate form if editing
    if (id) {
      const item = this.data[type + 's'].find(item => item.id === id);
      if (item) {
        Object.keys(item).forEach(key => {
          const input = form.querySelector(`[name="${key}"]`);
          if (input) {
            input.value = item[key];
          }
        });
      }
    } else {
      form.reset();
    }

    modal.style.display = 'flex';
  }

  closeModal() {
    document.getElementById('modal').style.display = 'none';
    this.editId = null;
  }

  // Handle modal submit
  async handleModalSubmit() {
    const form = document.getElementById('modal-form');
    const formData = new FormData(form);
    
    // Determine item type based on current tab
    let itemType = this.currentTab;
    if (this.currentTab === 'portfolio') {
      itemType = 'project';
    }

    if (this.editId) {
      await this.updateItem(itemType, this.editId);
    } else {
      await this.addItem(itemType);
    }
  }

  // Complete task
  async completeTask(id) {
    const task = this.data.tasks.find(t => t.id === id);
    if (task) {
      task.status = 'completed';
      await this.saveData();
      this.renderData('tasks');
      this.updateCalendar();
      this.loadUpcomingDeadlines();
      this.showNotification('Task completed!', 'success');
    }
  }

  // Start inactivity timer
  startInactivityTimer() {
    // Reset timer on user activity
    this.resetInactivityTimer();
  }

  // Reset inactivity timer
  resetInactivityTimer() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    this.inactivityTimer = setTimeout(() => {
      this.logout('Session expired due to inactivity');
    }, 10 * 60 * 1000); // 10 minutes
  }
}

// Initialize the dashboard
let adminDashboard;

document.addEventListener('DOMContentLoaded', () => {
  adminDashboard = new AdminDashboardFirebase();
});

// Global functions for HTML onclick handlers
function switchTab(tab) {
  adminDashboard.switchTab(tab);
}

function openModal(type, id = null) {
  adminDashboard.openModal(type, id);
}

function closeModal() {
  adminDashboard.closeModal();
}

function addItem(type) {
  adminDashboard.addItem(type);
}

function editItem(type, id) {
  adminDashboard.editItem(type, id);
}

function deleteItem(type, id) {
  adminDashboard.deleteItem(type, id);
}

function completeTask(id) {
  adminDashboard.completeTask(id);
}

function logout() {
  adminDashboard.logout();
}

function changePassword() {
  adminDashboard.changePassword();
}

function addSkill() {
  adminDashboard.addSkill();
}

function deleteSkill(category, index) {
  adminDashboard.deleteSkill(category, index);
}

function resetProfileImage() {
  adminDashboard.resetProfileImage();
}
