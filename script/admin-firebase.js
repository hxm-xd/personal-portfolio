// Simplified Admin Dashboard with Firebase Integration
class AdminDashboard {
  constructor() {
    this.currentTab = 'overview';
    this.editId = null;
    this.user = null;
    this.data = {
      tasks: [], academics: [], contacts: [], projects: [],
      settings: {}, portfolio: {}
    };
    
    setTimeout(() => this.init(), 100);
  }

  async init() {
    if (!this.checkDOM()) {
      setTimeout(() => this.init(), 500);
      return;
    }
    
    this.setupEvents();
    await this.checkAuth();
    this.showNotification('Welcome to Admin Dashboard!', 'success');
  }

  checkDOM() {
    const required = ['login-form', 'login-screen', 'admin-dashboard', 'email', 'password'];
    return required.every(id => document.getElementById(id));
  }

  setupEvents() {
    // Tab navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchTab(e.target.closest('.nav-btn').getAttribute('data-tab'));
      });
    });

    // Forms
    document.getElementById('login-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.login();
    });

    document.querySelector('.logout-btn')?.addEventListener('click', () => this.logout());

    // Portfolio forms
    ['profile-form', 'social-form', 'stats-form', 'contact-info-form', 'password-form'].forEach(formId => {
      document.getElementById(formId)?.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit(formId);
      });
    });

    // Profile image upload
    document.getElementById('profile-image-input')?.addEventListener('change', (e) => {
      this.handleProfileImageUpload(e.target.files[0]);
    });

    this.setupNetworkMonitoring();
  }

  setupNetworkMonitoring() {
    this.updateNetworkStatus();
    
    window.addEventListener('online', () => {
      this.updateNetworkStatus();
      this.showNotification('Connection restored!', 'success');
      if (this.user) setTimeout(() => this.loadData(), 2000);
    });
    
    window.addEventListener('offline', () => {
      this.updateNetworkStatus();
      this.showNotification('You are now offline. Some features may be limited.', 'warning');
    });
  }

  updateNetworkStatus() {
    const status = document.getElementById('network-status');
    const text = document.getElementById('network-text');
    const icon = status?.querySelector('i');
    const retryBtn = document.getElementById('retry-connection');
    
    if (!status || !text || !icon) return;
    
    const isOnline = navigator.onLine;
    const newText = isOnline ? 'Online' : 'Offline';
    const newIcon = isOnline ? 'fas fa-wifi' : 'fas fa-wifi-slash';
    const newClass = isOnline ? '' : 'danger';
    
    text.textContent = newText;
    icon.className = newIcon;
    status.className = `network-status ${newClass}`.trim();
    if (retryBtn) retryBtn.style.display = isOnline ? 'none' : 'flex';
  }

  async checkAuth() {
    if (typeof window.auth === 'undefined') {
      await new Promise(resolve => {
        const handleFirebaseReady = () => {
          window.removeEventListener('firebaseReady', handleFirebaseReady);
          resolve();
        };
        
        if (typeof window.auth !== 'undefined') {
          resolve();
          return;
        }
        
        window.addEventListener('firebaseReady', handleFirebaseReady);
        setTimeout(() => {
          window.removeEventListener('firebaseReady', handleFirebaseReady);
          resolve();
        }, 10000);
      });
    }
    
    if (typeof window.auth === 'undefined') {
      this.showNotification('Firebase not initialized properly. Please refresh the page.', 'error');
      return;
    }
    
    window.auth.onAuthStateChanged(async (user) => {
      if (user) {
        this.user = user;
        this.showDashboard();
        await this.loadData();
      } else {
        this.showLogin();
      }
    });
  }

  async login() {
    if (typeof window.auth === 'undefined') {
      this.showNotification('Firebase not ready. Please refresh the page.', 'error');
      return;
    }
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('login-error');
    const button = document.querySelector('#login-form button');

    try {
      button.disabled = true;
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
      await window.auth.signInWithEmailAndPassword(email, password);
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
      await window.auth.signOut();
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
    setTimeout(() => this.setupPortfolioForms(), 100);
    this.switchTab('overview');
  }

  async loadData() {
    try {
      if (typeof window.db === 'undefined') {
        this.showNotification('Firebase not ready. Please refresh the page.', 'error');
        return;
      }
      
      const userId = this.user.uid;
      
      // Load collections
      const [tasks, academics, contacts, projects] = await Promise.allSettled([
        this.loadCollection('tasks'),
        this.loadCollection('academics'),
        this.loadCollection('contacts'),
        this.loadCollection('projects')
      ]);

      // Load documents
      const [settings, portfolio] = await Promise.allSettled([
        this.loadDocument('settings', 'main'),
        this.loadDocument('portfolio', 'main')
      ]);

      // Assign data
      this.data.tasks = tasks.status === 'fulfilled' ? tasks.value : [];
      this.data.academics = academics.status === 'fulfilled' ? academics.value : [];
      this.data.contacts = contacts.status === 'fulfilled' ? contacts.value : [];
      this.data.projects = projects.status === 'fulfilled' ? projects.value : [];
      this.data.settings = settings.status === 'fulfilled' ? settings.value : {};
      this.data.portfolio = portfolio.status === 'fulfilled' ? portfolio.value : {};

      this.renderAllData();
      this.loadPortfolioSettings();
    } catch (error) {
      console.error('Error loading data:', error);
      this.showNotification('Error loading data: ' + error.message, 'error');
    }
  }

  async loadCollection(collectionName, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const snapshot = await window.db.collection('users').doc(this.user.uid).collection(collectionName).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        if (attempt === maxRetries) return [];
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  async loadDocument(collectionName, docName, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const doc = await window.db.collection('users').doc(this.user.uid).collection(collectionName).doc(docName).get();
        return doc.exists ? doc.data() : {};
      } catch (error) {
        if (attempt === maxRetries) return {};
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  async saveData() {
    try {
      console.log('Saving data:', this.data);
      const userId = this.user.uid;
      const batch = window.db.batch();

      // Clean data function
      const cleanData = (obj) => {
        if (!obj) return {};
        const cleaned = {};
        Object.keys(obj).forEach(key => {
          if (obj[key] !== undefined && obj[key] !== null) {
            cleaned[key] = obj[key];
          }
        });
        return cleaned;
      };

      // Save collections
      ['tasks', 'academics', 'contacts', 'projects'].forEach(collection => {
        console.log(`Saving ${collection}:`, this.data[collection]);
        this.data[collection].forEach(item => {
          const docRef = window.db.collection('users').doc(userId).collection(collection).doc(item.id);
          batch.set(docRef, cleanData(item));
        });
      });

      // Save documents with cleaned data
      batch.set(window.db.collection('users').doc(userId).collection('settings').doc('main'), cleanData(this.data.settings));
      batch.set(window.db.collection('users').doc(userId).collection('portfolio').doc('main'), cleanData(this.data.portfolio));

      await batch.commit();
      this.showNotification('Data saved successfully!', 'success');
      
      // Also update public portfolio when data is saved
      await this.saveToPublicPortfolio();
    } catch (error) {
      console.error('Error saving data:', error);
      this.showNotification('Error saving data: ' + error.message, 'error');
    }
  }

  switchTab(tab) {
    console.log('Switching to tab:', tab);
    this.currentTab = tab;
    
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    
    // Show/hide tabs
    document.querySelectorAll('.tab').forEach(t => t.style.display = 'none');
    document.getElementById(tab).style.display = 'block';
    
    // Load specific data
    if (tab === 'overview') {
      this.loadOverviewData();
    } else if (['tasks', 'academics', 'contacts'].includes(tab)) {
      this.renderData(tab);
    } else if (tab === 'portfolio') {
      console.log('Rendering projects for portfolio tab');
      this.renderData('projects');
    } else if (tab === 'portfolio-settings') {
      setTimeout(() => {
        this.setupPortfolioForms();
        this.loadPortfolioSettings();
      }, 100);
    }
  }

  renderData(type) {
    // Map type to correct data key
    const dataKey = type === 'project' ? 'projects' : type;
    
    console.log('Rendering data for:', type, 'using dataKey:', dataKey, this.data[dataKey]);
    
    const container = document.getElementById(dataKey === 'projects' ? 'projects-list' : `${dataKey}-list`);
    if (!container) {
      console.error('Container not found for:', dataKey);
      return;
    }

    // Ensure the array exists
    if (!this.data[dataKey]) {
      this.data[dataKey] = [];
    }

    const items = this.data[dataKey];
    console.log('Items to render:', items);
    
    if (items.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-${type === 'tasks' ? 'tasks' : type === 'academics' ? 'graduation-cap' : type === 'contacts' ? 'envelope' : 'briefcase'}"></i>
          <h3>No ${type} yet</h3>
          <p>Add your first ${type.slice(0, -1)} to get started.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = items.map(item => {
      const statusClass = item.status ? `status-${item.status}` : '';
      const statusText = item.status ? item.status.replace('-', ' ') : '';
      
      return `
        <div class="item-card ${statusClass}">
          <div class="item-content">
            <h4 class="item-title">${item.title || item.name}</h4>
            <p class="item-description">${item.description || item.message || ''}</p>
            ${item.status ? `<span class="status-badge">${statusText}</span>` : ''}
            ${item.deadline ? `<span class="deadline">Due: ${new Date(item.deadline).toLocaleDateString()}</span>` : ''}
          </div>
          <div class="item-actions">
            <button onclick="editItem('${type}', '${item.id}')" class="btn-secondary">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteItem('${type}', '${item.id}')" class="btn-danger">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  renderAllData() {
    ['tasks', 'academics', 'contacts', 'projects'].forEach(type => this.renderData(type));
  }

  loadOverviewData() {
    const stats = {
      tasks: this.data.tasks.length,
      completedTasks: this.data.tasks.filter(t => t.status === 'completed').length,
      academics: this.data.academics.length,
      contacts: this.data.contacts.length,
      projects: this.data.projects.length
    };

    // Update dashboard statistics
    ['task-count', 'contact-count', 'deadline-count', 'view-count'].forEach((id, index) => {
      const element = document.getElementById(id);
      if (element) {
        const values = [stats.tasks, stats.contacts, stats.tasks + stats.academics, '0'];
        element.textContent = values[index];
      }
    });
    
    // Update portfolio statistics if they exist
    if (this.data.portfolio.stats) {
      const portfolioStats = this.data.portfolio.stats;
      ['stats-experience', 'stats-projects', 'stats-technologies'].forEach(id => {
        const element = document.getElementById(id);
        if (element && portfolioStats[id.replace('stats-', '')]) {
          element.value = portfolioStats[id.replace('stats-', '')];
        }
      });
    }
    
    // Update social media shortcuts
    this.updateSocialShortcuts();
    
    // Also refresh the portfolio settings display in the overview tab
    this.loadPortfolioSettings();
  }

  openModal(type) {
    console.log('openModal called with type:', type);
    this.editId = null;
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalFields = document.getElementById('modal-fields');
    
    console.log('Modal elements found:', { modal, modalTitle, modalFields });
    
    modalTitle.textContent = `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    
    const fieldTemplates = {
      task: `
        <div class="form-group">
          <label>Title</label>
          <input type="text" id="modal-title-input" placeholder="Task title" required>
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea id="modal-description-input" placeholder="Task description" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label>Status</label>
          <select id="modal-status-input">
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div class="form-group">
          <label>Deadline</label>
          <input type="date" id="modal-deadline-input">
        </div>
      `,
      academic: `
        <div class="form-group">
          <label>Course/Subject</label>
          <input type="text" id="modal-title-input" placeholder="Course name" required>
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea id="modal-description-input" placeholder="Course description" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label>Deadline</label>
          <input type="date" id="modal-deadline-input">
        </div>
      `,
      project: `
        <div class="form-group">
          <label>Project Name</label>
          <input type="text" id="modal-title-input" placeholder="Project name" required>
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea id="modal-description-input" placeholder="Project description" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label>URL (optional)</label>
          <input type="url" id="modal-url-input" placeholder="https://project-url.com">
        </div>
        <div class="form-group">
          <label>Image URL (optional)</label>
          <input type="url" id="modal-image-input" placeholder="https://image-url.com">
        </div>
      `
    };
    
    modalFields.innerHTML = fieldTemplates[type] || '';
    modal.style.display = 'flex';
    
    document.getElementById('modal-form').onsubmit = (e) => {
      e.preventDefault();
      this.handleModalSubmit(type);
    };
  }

  closeModal() {
    document.getElementById('modal').style.display = 'none';
    this.editId = null;
  }

  async handleModalSubmit(type) {
    const formData = {
      title: document.getElementById('modal-title-input').value,
      description: document.getElementById('modal-description-input').value,
      status: document.getElementById('modal-status-input')?.value,
      deadline: document.getElementById('modal-deadline-input')?.value,
      url: document.getElementById('modal-url-input')?.value,
      image: document.getElementById('modal-image-input')?.value
    };
    
    const item = {
      title: formData.title,
      description: formData.description,
      createdAt: new Date().toISOString()
    };
    
    Object.entries(formData).forEach(([key, value]) => {
      if (value) item[key] = value;
    });
    
    if (this.editId) {
      await this.updateItem(type, this.editId, item);
    } else {
      await this.addItem(type, item);
    }
    
    this.closeModal();
  }

  async addItem(type, item) {
    console.log('Adding item:', type, item);
    
    // Map type to correct data key
    const dataKey = type === 'project' ? 'projects' : type;
    
    // Ensure the array exists
    if (!this.data[dataKey]) {
      this.data[dataKey] = [];
    }
    
    item.id = this.generateId();
    this.data[dataKey].push(item);
    console.log('Item added to data:', this.data[dataKey]);
    
    this.renderData(type);
    await this.saveData();
    
    if (dataKey === 'projects') {
      await this.saveToPublicPortfolio();
    }
    
    this.showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} added successfully!`, 'success');
  }

  editItem(type, id) {
    // Map type to correct data key
    const dataKey = type === 'project' ? 'projects' : type;
    
    // Ensure the array exists
    if (!this.data[dataKey]) {
      this.data[dataKey] = [];
    }
    
    const item = this.data[dataKey].find(item => item.id === id);
    if (!item) return;
    
    this.editId = id;
    this.openModal(type);
    
    setTimeout(() => {
      document.getElementById('modal-title-input').value = item.title || '';
      document.getElementById('modal-description-input').value = item.description || '';
      if (item.status) document.getElementById('modal-status-input').value = item.status;
      if (item.deadline) document.getElementById('modal-deadline-input').value = item.deadline;
      if (item.url) document.getElementById('modal-url-input').value = item.url;
      if (item.image) document.getElementById('modal-image-input').value = item.image;
      
      document.getElementById('modal-title').textContent = `Edit ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    }, 100);
  }

  async updateItem(type, id, updatedItem) {
    // Map type to correct data key
    const dataKey = type === 'project' ? 'projects' : type;
    
    // Ensure the array exists
    if (!this.data[dataKey]) {
      this.data[dataKey] = [];
    }
    
    const index = this.data[dataKey].findIndex(item => item.id === id);
    if (index === -1) return;
    
    this.data[dataKey][index] = { ...this.data[dataKey][index], ...updatedItem };
    this.renderData(type);
    await this.saveData();
    
    if (dataKey === 'projects') {
      await this.saveToPublicPortfolio();
    }
    
    this.showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully!`, 'success');
  }

  async deleteItem(type, id) {
    if (!confirm(`Are you sure you want to delete this ${type.slice(0, -1)}?`)) return;
    
    // Map type to correct data key
    const dataKey = type === 'project' ? 'projects' : type;
    
    // Ensure the array exists
    if (!this.data[dataKey]) {
      this.data[dataKey] = [];
    }
    
    this.data[dataKey] = this.data[dataKey].filter(item => item.id !== id);
    this.renderData(type);
    await this.saveData();
    
    if (dataKey === 'projects') {
      await this.saveToPublicPortfolio();
    }
    
    this.showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`, 'success');
  }

  setupPortfolioForms() {
    // Forms are already set up in setupEvents()
  }

  loadPortfolioSettings() {
    const portfolio = this.data.portfolio;
    
    // Load profile info
    if (portfolio.profile) {
      ['profile-name', 'profile-title', 'profile-subtitle', 'profile-about'].forEach(id => {
        const element = document.getElementById(id);
        if (element && portfolio.profile[id.replace('profile-', '')]) {
          element.value = portfolio.profile[id.replace('profile-', '')];
        }
      });
    }
    
    // Load social links
    if (portfolio.social) {
      ['social-github', 'social-linkedin', 'social-twitter', 'social-email'].forEach(id => {
        const element = document.getElementById(id);
        if (element && portfolio.social[id.replace('social-', '')]) {
          element.value = portfolio.social[id.replace('social-', '')];
        }
      });
    }
    
    // Load statistics
    if (portfolio.stats) {
      ['stats-experience', 'stats-projects', 'stats-technologies'].forEach(id => {
        const element = document.getElementById(id);
        if (element && portfolio.stats[id.replace('stats-', '')]) {
          element.value = portfolio.stats[id.replace('stats-', '')];
        }
      });
    }
    
    // Load contact info
    if (portfolio.contact) {
      ['contact-location', 'contact-email', 'contact-education'].forEach(id => {
        const element = document.getElementById(id);
        if (element && portfolio.contact[id.replace('contact-', '')]) {
          element.value = portfolio.contact[id.replace('contact-', '')];
        }
      });
    }
    
    // Load profile image
    if (portfolio.profileImage) {
      document.getElementById('current-profile-img').src = portfolio.profileImage;
    }
    
    // Load skills
    this.loadSkills();
    
    // Update last update time
    const lastUpdateElement = document.getElementById('last-update-time');
    if (lastUpdateElement) {
      if (portfolio.lastUpdated) {
        lastUpdateElement.textContent = new Date(portfolio.lastUpdated).toLocaleString();
      } else {
        lastUpdateElement.textContent = 'Never';
      }
    }
  }
  
  loadSkills() {
    const portfolio = this.data.portfolio;
    if (!portfolio.skills) return;
    
    const skillCategories = ['programming', 'web', 'mobile', 'database', 'iot'];
    
    skillCategories.forEach(category => {
      const container = document.getElementById(`${category}-skills`);
      if (container && portfolio.skills[category]) {
        container.innerHTML = portfolio.skills[category].map(skill => `
          <div class="skill-item">
            <span class="skill-name">${skill.name}</span>
            <span class="skill-level">${skill.level}</span>
            <button onclick="removeSkill('${category}', '${skill.name}')" class="btn-danger btn-small">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        `).join('');
      }
    });
  }

  updateSocialShortcuts() {
    const portfolio = this.data.portfolio;
    if (!portfolio.social) return;
    
    // Update GitHub shortcut
    const githubShortcut = document.getElementById('github-shortcut');
    if (githubShortcut && portfolio.social.github) {
      githubShortcut.href = portfolio.social.github;
      githubShortcut.style.opacity = '1';
    }
    
    // Update LinkedIn shortcut
    const linkedinShortcut = document.getElementById('linkedin-shortcut');
    if (linkedinShortcut && portfolio.social.linkedin) {
      linkedinShortcut.href = portfolio.social.linkedin;
      linkedinShortcut.style.opacity = '1';
    }
    
    // Update Twitter shortcut
    const twitterShortcut = document.getElementById('twitter-shortcut');
    if (twitterShortcut && portfolio.social.twitter) {
      twitterShortcut.href = portfolio.social.twitter;
      twitterShortcut.style.opacity = '1';
    }
    
    // Update Email shortcut
    const emailShortcut = document.getElementById('email-shortcut');
    if (emailShortcut && portfolio.social.email) {
      emailShortcut.href = `mailto:${portfolio.social.email}`;
      emailShortcut.style.opacity = '1';
    }
  }

  async handleFormSubmit(formId) {
    const formData = {};
    const form = document.getElementById(formId);
    
    // Collect form data - only include non-empty values
    form.querySelectorAll('input, textarea').forEach(input => {
      if (input.value && input.value.trim() !== '') {
        formData[input.id] = input.value.trim();
      }
    });
    
    // Clean data function
    const cleanData = (obj) => {
      if (!obj) return {};
      const cleaned = {};
      Object.keys(obj).forEach(key => {
        if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
          cleaned[key] = obj[key];
        }
      });
      return cleaned;
    };
    
    // Handle different form types
    switch (formId) {
      case 'profile-form':
        this.data.portfolio.profile = cleanData({
          name: formData['profile-name'],
          title: formData['profile-title'],
          subtitle: formData['profile-subtitle'],
          about: formData['profile-about']
        });
        break;
      case 'social-form':
        this.data.portfolio.social = cleanData({
          github: formData['social-github'],
          linkedin: formData['social-linkedin'],
          twitter: formData['social-twitter'],
          email: formData['social-email']
        });
        break;
      case 'stats-form':
        this.data.portfolio.stats = cleanData({
          experience: formData['stats-experience'],
          projects: formData['stats-projects'],
          technologies: formData['stats-technologies']
        });
        break;
      case 'contact-info-form':
        this.data.portfolio.contact = cleanData({
          location: formData['contact-location'],
          email: formData['contact-email'],
          education: formData['contact-education']
        });
        break;
      case 'password-form':
        await this.changePassword(formData);
        return;
    }
    
    await this.saveData();
    await this.saveToPublicPortfolio();
    
    // Refresh dashboard data to show updated information
    this.loadPortfolioSettings();
    this.loadOverviewData();
    
    this.showNotification('Settings saved successfully!', 'success');
  }

  async changePassword(formData) {
    if (formData['new-password'] !== formData['confirm-password']) {
      this.showNotification('New passwords do not match!', 'error');
      return;
    }
    
    try {
      const credential = firebase.auth.EmailAuthProvider.credential(this.user.email, formData['current-password']);
      await this.user.reauthenticateWithCredential(credential);
      await this.user.updatePassword(formData['new-password']);
      
      this.showNotification('Password changed successfully!', 'success');
      document.getElementById('password-form').reset();
    } catch (error) {
      this.showNotification('Error changing password: ' + error.message, 'error');
    }
  }

  async saveToPublicPortfolio() {
    try {
      console.log('Saving to public portfolio...', this.data.portfolio);
      
      // Clean data to remove undefined values
      const cleanData = (obj) => {
        if (!obj) return {};
        const cleaned = {};
        Object.keys(obj).forEach(key => {
          if (obj[key] !== undefined && obj[key] !== null) {
            cleaned[key] = obj[key];
          }
        });
        return cleaned;
      };

      // Save main portfolio data
      const portfolioData = {
        profile: cleanData(this.data.portfolio.profile),
        social: cleanData(this.data.portfolio.social),
        stats: cleanData(this.data.portfolio.stats),
        contact: cleanData(this.data.portfolio.contact),
        skills: cleanData(this.data.portfolio.skills),
        profileImage: this.data.portfolio.profileImage || '',
        lastUpdated: new Date().toISOString()
      };

      console.log('Portfolio data to save:', portfolioData);

      await window.db.collection('public').doc('portfolio').set(portfolioData, { merge: true });
      
      // Save projects to public location
      const projectsRef = window.db.collection('public').doc('portfolio').collection('projects');
      
      // Clear existing projects
      const existingProjects = await projectsRef.get();
      const deletePromises = existingProjects.docs.map(doc => doc.ref.delete());
      await Promise.all(deletePromises);
      
      // Add current projects
      if (this.data.projects && this.data.projects.length > 0) {
        const addPromises = this.data.projects.map(project => projectsRef.add(project));
        await Promise.all(addPromises);
      }
      
      console.log('Public portfolio updated successfully!');
      this.showNotification('Portfolio updated successfully!', 'success');
    } catch (error) {
      console.error('Error saving to public portfolio:', error);
      this.showNotification('Error saving to public portfolio: ' + error.message, 'error');
    }
  }

  async handleProfileImageUpload(file) {
    if (!file) return;
    
    try {
      const userId = this.user.uid;
      const storageRef = window.storage.ref(`profile-images/${userId}/${file.name}`);
      const snapshot = await storageRef.put(file);
      const downloadURL = await snapshot.ref.getDownloadURL();
      
      this.data.portfolio.profileImage = downloadURL;
      document.getElementById('current-profile-img').src = downloadURL;
      await this.saveData();
      await this.saveToPublicPortfolio();
      this.showNotification('Profile image uploaded successfully!', 'success');
    } catch (error) {
      this.showNotification('Error uploading image: ' + error.message, 'error');
    }
  }

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
}

// Initialize the dashboard
let adminDashboard;

document.addEventListener('DOMContentLoaded', () => {
  try {
    adminDashboard = new AdminDashboard();
  } catch (error) {
    console.error('Error initializing Admin Dashboard:', error);
  }
});

// Global functions for HTML onclick handlers
function switchTab(tab) { adminDashboard.switchTab(tab); }
function logout() { adminDashboard.logout(); }
function openModal(type) { 
  console.log('Global openModal called with type:', type);
  if (adminDashboard) {
    adminDashboard.openModal(type);
  } else {
    console.error('adminDashboard not initialized');
  }
}
function closeModal() { adminDashboard.closeModal(); }
function editItem(type, id) { adminDashboard.editItem(type, id); }
function deleteItem(type, id) { adminDashboard.deleteItem(type, id); }

async function resetProfileImage() {
  document.getElementById('current-profile-img').src = '../assets/profile.svg';
  adminDashboard.data.portfolio.profileImage = null;
  await adminDashboard.saveData();
  await adminDashboard.saveToPublicPortfolio();
  adminDashboard.showNotification('Profile image reset to default!', 'success');
}

function markAllRead() {
  adminDashboard.data.contacts.forEach(contact => contact.read = true);
  adminDashboard.renderData('contacts');
  adminDashboard.saveData();
  adminDashboard.showNotification('All contacts marked as read!', 'success');
}

function addSkill(category) {
  const skillName = prompt('Enter skill name:');
  if (skillName) {
    const skillLevel = prompt('Enter skill level (Beginner/Intermediate/Advanced):');
    if (skillLevel) {
      if (!adminDashboard.data.portfolio.skills) adminDashboard.data.portfolio.skills = {};
      if (!adminDashboard.data.portfolio.skills[category]) adminDashboard.data.portfolio.skills[category] = [];
      
      adminDashboard.data.portfolio.skills[category].push({
        name: skillName,
        level: skillLevel
      });
      
      adminDashboard.saveData();
      adminDashboard.saveToPublicPortfolio();
      adminDashboard.loadSkills();
      adminDashboard.showNotification('Skill added successfully!', 'success');
    }
  }
}

function removeSkill(category, skillName) {
  if (confirm(`Are you sure you want to remove ${skillName}?`)) {
    if (adminDashboard.data.portfolio.skills && adminDashboard.data.portfolio.skills[category]) {
      adminDashboard.data.portfolio.skills[category] = adminDashboard.data.portfolio.skills[category].filter(
        skill => skill.name !== skillName
      );
      
      adminDashboard.saveData();
      adminDashboard.saveToPublicPortfolio();
      adminDashboard.loadSkills();
      adminDashboard.showNotification('Skill removed successfully!', 'success');
    }
  }
}

function exportData() {
  const dataStr = JSON.stringify(adminDashboard.data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'portfolio-data.json';
  link.click();
  URL.revokeObjectURL(url);
  adminDashboard.showNotification('Data exported successfully!', 'success');
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        adminDashboard.data = { ...adminDashboard.data, ...data };
        await adminDashboard.saveData();
        adminDashboard.renderAllData();
        adminDashboard.showNotification('Data imported successfully!', 'success');
      } catch (error) {
        adminDashboard.showNotification('Error importing data: ' + error.message, 'error');
      }
    }
  };
  input.click();
}

function clearData() {
  if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
    adminDashboard.data = {
      tasks: [], academics: [], contacts: [], projects: [],
      settings: {}, portfolio: {}
    };
    adminDashboard.saveData();
    adminDashboard.renderAllData();
    adminDashboard.showNotification('All data cleared!', 'success');
  }
}

async function forceUpdatePortfolio() {
  try {
    const button = event.target.closest('button');
    const originalText = button.innerHTML;
    
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    
    await adminDashboard.saveToPublicPortfolio();
    
    // Update the last update time
    const lastUpdateElement = document.getElementById('last-update-time');
    if (lastUpdateElement) {
      lastUpdateElement.textContent = new Date().toLocaleString();
    }
    
    button.innerHTML = '<i class="fas fa-check"></i> Updated Successfully!';
    setTimeout(() => {
      button.disabled = false;
      button.innerHTML = originalText;
    }, 2000);
    
  } catch (error) {
    const button = event.target.closest('button');
    button.disabled = false;
    button.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Update Failed';
    setTimeout(() => {
      button.innerHTML = '<i class="fas fa-sync-alt"></i> Force Update Portfolio';
    }, 3000);
    
    adminDashboard.showNotification('Failed to update portfolio: ' + error.message, 'error');
  }
}