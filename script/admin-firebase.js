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
    
    console.log('AdminDashboardFirebase constructor called');
    // Add a small delay to ensure DOM is ready
    setTimeout(() => {
      this.init();
    }, 100);
  }

  async init() {
    console.log('Initializing admin dashboard...');
    
    // Check if DOM elements exist before proceeding
    if (!this.checkDOMElements()) {
      console.error('Required DOM elements not found, retrying in 500ms...');
      setTimeout(() => {
        this.init();
      }, 500);
      return;
    }
    
    this.setupEventListeners();
    await this.checkAuth();
    this.showNotification('Welcome to Admin Dashboard!', 'success');
  }

  checkDOMElements() {
    const requiredElements = [
      'login-form',
      'login-screen',
      'admin-dashboard',
      'email',
      'password'
    ];
    
    for (const elementId of requiredElements) {
      const element = document.getElementById(elementId);
      if (!element) {
        console.error(`Required element not found: ${elementId}`);
        return false;
      }
    }
    
    console.log('All required DOM elements found');
    return true;
  }

  setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Tab navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = e.target.closest('.nav-btn').getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    // Form submissions
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        console.log('Login form submitted');
        this.login();
      });
      console.log('Login form event listener added');
    } else {
      console.error('Login form not found!');
    }

    // Logout
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.logout();
      });
      console.log('Logout button event listener added');
    } else {
      console.log('Logout button not found (normal if not logged in)');
    }

    // Portfolio settings forms
    this.setupPortfolioForms();
  }

  setupPortfolioForms() {
    // Profile form
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveProfileInfo();
      });
    }

    // Social links form
    const socialForm = document.getElementById('social-form');
    if (socialForm) {
      socialForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveSocialLinks();
      });
    }

    // Statistics form
    const statsForm = document.getElementById('stats-form');
    if (statsForm) {
      statsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveStatistics();
      });
    }

    // Contact info form
    const contactInfoForm = document.getElementById('contact-info-form');
    if (contactInfoForm) {
      contactInfoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveContactInfo();
      });
    }

    // Password form
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
      passwordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.changePassword();
      });
    }

    // Profile image upload
    const profileImageInput = document.getElementById('profile-image-input');
    if (profileImageInput) {
      profileImageInput.addEventListener('change', (e) => {
        this.handleProfileImageUpload(e.target.files[0]);
      });
    }
  }

  async checkAuth() {
    console.log('Checking authentication...');
    
    // Check if Firebase auth is available
    if (typeof auth === 'undefined') {
      console.error('Firebase auth is not available!');
      this.showNotification('Firebase not initialized properly', 'error');
      return;
    }
    
    // Check if we're online
    if (!navigator.onLine) {
      console.warn('Browser is offline');
      this.showNotification('You appear to be offline. Please check your internet connection.', 'warning');
    }
    
    auth.onAuthStateChanged(async (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user');
      if (user) {
        this.user = user;
        console.log('User authenticated:', user.email);
        this.showDashboard();
        await this.loadData();
      } else {
        console.log('No user, showing login screen');
        this.showLogin();
      }
    });
  }

  async login() {
    console.log('Login method called');
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('login-error');
    const button = document.querySelector('#login-form button');

    console.log('Attempting login with email:', email);

    try {
      button.disabled = true;
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

      console.log('Calling Firebase auth.signInWithEmailAndPassword...');
      await auth.signInWithEmailAndPassword(email, password);
      console.log('Login successful!');
      
      errorEl.style.display = 'none';
      this.showNotification('Login successful!', 'success');
    } catch (error) {
      console.error('Login error:', error);
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
    console.log('Showing login screen');
    const loginScreen = document.getElementById('login-screen');
    const dashboard = document.getElementById('admin-dashboard');
    
    if (loginScreen) loginScreen.style.display = 'flex';
    if (dashboard) dashboard.style.display = 'none';
  }

  showDashboard() {
    console.log('Showing dashboard');
    const loginScreen = document.getElementById('login-screen');
    const dashboard = document.getElementById('admin-dashboard');
    
    if (loginScreen) loginScreen.style.display = 'none';
    if (dashboard) dashboard.style.display = 'block';
    
    this.switchTab('overview');
  }

  async loadData() {
    try {
      console.log('Loading data from Firestore...');
      const userId = this.user.uid;
      console.log('User ID:', userId);
      
      // Test basic Firestore connection first
      console.log('Testing basic Firestore connection...');
      try {
        await db.collection('test').doc('connection').get();
        console.log('Basic Firestore connection successful');
      } catch (connectionError) {
        console.error('Basic connection failed:', connectionError);
        throw new Error('Cannot connect to Firebase. Please check your internet connection and try again.');
      }
      
      // Test user-specific connection
      console.log('Testing user-specific connection...');
      try {
        await db.collection('users').doc(userId).get();
        console.log('User-specific connection successful');
      } catch (userError) {
        console.error('User connection failed:', userError);
        // This might be normal if user document doesn't exist yet
        console.log('User document might not exist yet, continuing...');
      }
      
      // Load all data from Firestore
      console.log('Loading tasks...');
      const tasksSnapshot = await db.collection('users').doc(userId).collection('tasks').get();
      this.data.tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Tasks loaded:', this.data.tasks.length);

      console.log('Loading academics...');
      const academicsSnapshot = await db.collection('users').doc(userId).collection('academics').get();
      this.data.academics = academicsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Academics loaded:', this.data.academics.length);

      console.log('Loading contacts...');
      const contactsSnapshot = await db.collection('users').doc(userId).collection('contacts').get();
      this.data.contacts = contactsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Contacts loaded:', this.data.contacts.length);

      console.log('Loading projects...');
      const projectsSnapshot = await db.collection('users').doc(userId).collection('projects').get();
      this.data.projects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Projects loaded:', this.data.projects.length);

      console.log('Loading settings...');
      const settingsDoc = await db.collection('users').doc(userId).collection('settings').doc('main').get();
      this.data.settings = settingsDoc.exists ? settingsDoc.data() : {};
      console.log('Settings loaded');

      console.log('Loading portfolio...');
      const portfolioDoc = await db.collection('users').doc(userId).collection('portfolio').doc('main').get();
      this.data.portfolio = portfolioDoc.exists ? portfolioDoc.data() : {};
      console.log('Portfolio loaded');

      this.renderAllData();
      this.loadPortfolioSettings();
      console.log('All data loaded successfully');
    } catch (error) {
      console.error('Error loading data:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // More specific error messages
      if (error.code === 'permission-denied') {
        this.showNotification('Permission denied. Please check Firebase security rules.', 'error');
      } else if (error.code === 'unavailable') {
        this.showNotification('Firebase is unavailable. Please check your internet connection and try refreshing the page.', 'error');
      } else if (error.message.includes('Cannot connect to Firebase')) {
        this.showNotification(error.message, 'error');
      } else {
        this.showNotification('Error loading data: ' + error.message, 'error');
      }
    }
  }

  async saveData() {
    try {
      console.log('Saving data to Firestore...');
      const userId = this.user.uid;
      console.log('User ID:', userId);
      
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

      console.log('Committing batch write...');
      await batch.commit();
      console.log('Data saved successfully');
      this.showNotification('Data saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving data:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      this.showNotification('Error saving data: ' + error.message, 'error');
      
      // If it's a permissions error, show specific message
      if (error.code === 'permission-denied') {
        this.showNotification('Permission denied. Please check Firebase security rules.', 'error');
      } else if (error.code === 'unavailable') {
        this.showNotification('Firebase is unavailable. Please check your internet connection.', 'error');
      }
    }
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
    }
  }

  // Render data for different sections
  renderData(type) {
    const container = document.getElementById(type === 'projects' ? 'projects-list' : `${type}-list`);
    if (!container) return;

    const items = this.data[type];
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

    const itemsHTML = items.map(item => {
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

    container.innerHTML = itemsHTML;
  }

  // Render all data
  renderAllData() {
    this.renderData('tasks');
    this.renderData('academics');
    this.renderData('contacts');
    this.renderData('projects');
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

    // Update stats display
    const taskCount = document.getElementById('task-count');
    const contactCount = document.getElementById('contact-count');
    const deadlineCount = document.getElementById('deadline-count');
    const viewCount = document.getElementById('view-count');

    if (taskCount) taskCount.textContent = stats.tasks;
    if (contactCount) contactCount.textContent = stats.contacts;
    if (deadlineCount) deadlineCount.textContent = stats.tasks + stats.academics;
    if (viewCount) viewCount.textContent = '0'; // Placeholder
  }

  // Modal functions
  openModal(type) {
    this.editId = null;
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalFields = document.getElementById('modal-fields');
    
    modalTitle.textContent = `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    
    let fieldsHTML = '';
    
    if (type === 'task') {
      fieldsHTML = `
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
      `;
    } else if (type === 'academic') {
      fieldsHTML = `
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
      `;
    } else if (type === 'project') {
      fieldsHTML = `
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
      `;
    }
    
    modalFields.innerHTML = fieldsHTML;
    modal.style.display = 'flex';
    
    // Setup modal form submission
    const modalForm = document.getElementById('modal-form');
    modalForm.onsubmit = (e) => {
      e.preventDefault();
      this.handleModalSubmit(type);
    };
  }

  closeModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
    this.editId = null;
  }

  async handleModalSubmit(type) {
    const title = document.getElementById('modal-title-input').value;
    const description = document.getElementById('modal-description-input').value;
    const status = document.getElementById('modal-status-input')?.value;
    const deadline = document.getElementById('modal-deadline-input')?.value;
    const url = document.getElementById('modal-url-input')?.value;
    const image = document.getElementById('modal-image-input')?.value;
    
    const item = {
      title: title,
      description: description,
      createdAt: new Date().toISOString()
    };
    
    if (status) item.status = status;
    if (deadline) item.deadline = deadline;
    if (url) item.url = url;
    if (image) item.image = image;
    
    if (this.editId) {
      await this.updateItem(type, this.editId, item);
    } else {
      await this.addItem(type, item);
    }
    
    this.closeModal();
  }

  async addItem(type, item) {
    item.id = this.generateId();
    this.data[type].push(item);
    this.renderData(type);
    await this.saveData();
    
    // If it's a project, also save to public portfolio
    if (type === 'projects') {
      await this.saveToPublicPortfolio();
    }
    
    this.showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} added successfully!`, 'success');
  }

  editItem(type, id) {
    const item = this.data[type].find(item => item.id === id);
    if (!item) return;
    
    this.editId = id;
    this.openModal(type);
    
    // Populate form fields
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
    const index = this.data[type].findIndex(item => item.id === id);
    if (index === -1) return;
    
    this.data[type][index] = { ...this.data[type][index], ...updatedItem };
    this.renderData(type);
    await this.saveData();
    
    // If it's a project, also save to public portfolio
    if (type === 'projects') {
      await this.saveToPublicPortfolio();
    }
    
    this.showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully!`, 'success');
  }

  async deleteItem(type, id) {
    if (!confirm(`Are you sure you want to delete this ${type.slice(0, -1)}?`)) return;
    
    this.data[type] = this.data[type].filter(item => item.id !== id);
    this.renderData(type);
    await this.saveData();
    
    // If it's a project, also save to public portfolio
    if (type === 'projects') {
      await this.saveToPublicPortfolio();
    }
    
    this.showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`, 'success');
  }

  // Portfolio settings functions
  loadPortfolioSettings() {
    const portfolio = this.data.portfolio;
    
    // Load profile info
    if (portfolio.profile) {
      document.getElementById('profile-name').value = portfolio.profile.name || '';
      document.getElementById('profile-title').value = portfolio.profile.title || '';
      document.getElementById('profile-subtitle').value = portfolio.profile.subtitle || '';
      document.getElementById('profile-about').value = portfolio.profile.about || '';
    }
    
    // Load social links
    if (portfolio.social) {
      document.getElementById('social-github').value = portfolio.social.github || '';
      document.getElementById('social-linkedin').value = portfolio.social.linkedin || '';
      document.getElementById('social-twitter').value = portfolio.social.twitter || '';
      document.getElementById('social-email').value = portfolio.social.email || '';
    }
    
    // Load statistics
    if (portfolio.stats) {
      document.getElementById('stats-experience').value = portfolio.stats.experience || '';
      document.getElementById('stats-projects').value = portfolio.stats.projects || '';
      document.getElementById('stats-technologies').value = portfolio.stats.technologies || '';
    }
    
    // Load contact info
    if (portfolio.contact) {
      document.getElementById('contact-location').value = portfolio.contact.location || '';
      document.getElementById('contact-email').value = portfolio.contact.email || '';
      document.getElementById('contact-education').value = portfolio.contact.education || '';
    }
    
    // Load profile image
    if (portfolio.profileImage) {
      document.getElementById('current-profile-img').src = portfolio.profileImage;
    }
  }

  async saveProfileInfo() {
    const profile = {
      name: document.getElementById('profile-name').value,
      title: document.getElementById('profile-title').value,
      subtitle: document.getElementById('profile-subtitle').value,
      about: document.getElementById('profile-about').value
    };
    
    this.data.portfolio.profile = profile;
    await this.saveData();
    await this.saveToPublicPortfolio();
    this.showNotification('Profile information saved!', 'success');
  }

  async saveSocialLinks() {
    const social = {
      github: document.getElementById('social-github').value,
      linkedin: document.getElementById('social-linkedin').value,
      twitter: document.getElementById('social-twitter').value,
      email: document.getElementById('social-email').value
    };
    
    this.data.portfolio.social = social;
    await this.saveData();
    await this.saveToPublicPortfolio();
    this.showNotification('Social links saved!', 'success');
  }

  async saveStatistics() {
    const stats = {
      experience: document.getElementById('stats-experience').value,
      projects: document.getElementById('stats-projects').value,
      technologies: document.getElementById('stats-technologies').value
    };
    
    this.data.portfolio.stats = stats;
    await this.saveData();
    await this.saveToPublicPortfolio();
    this.showNotification('Statistics saved!', 'success');
  }

  async saveContactInfo() {
    const contact = {
      location: document.getElementById('contact-location').value,
      email: document.getElementById('contact-email').value,
      education: document.getElementById('contact-education').value
    };
    
    this.data.portfolio.contact = contact;
    await this.saveData();
    await this.saveToPublicPortfolio();
    this.showNotification('Contact information saved!', 'success');
  }

  async saveToPublicPortfolio() {
    try {
      // Save portfolio settings to public location
      await db.collection('public').doc('portfolio').set({
        profile: this.data.portfolio.profile || {},
        social: this.data.portfolio.social || {},
        stats: this.data.portfolio.stats || {},
        contact: this.data.portfolio.contact || {},
        profileImage: this.data.portfolio.profileImage || '',
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      
      // Save projects to public location
      const projectsRef = db.collection('public').doc('portfolio').collection('projects');
      
      // Clear existing projects
      const existingProjects = await projectsRef.get();
      const deletePromises = existingProjects.docs.map(doc => doc.ref.delete());
      await Promise.all(deletePromises);
      
      // Add current projects
      const addPromises = this.data.projects.map(project => 
        projectsRef.add(project)
      );
      await Promise.all(addPromises);
      
      console.log('Portfolio data saved to public location');
    } catch (error) {
      console.error('Error saving to public portfolio:', error);
      this.showNotification('Error saving to public portfolio: ' + error.message, 'error');
    }
  }

  async handleProfileImageUpload(file) {
    if (!file) return;
    
    try {
      const userId = this.user.uid;
      const storageRef = storage.ref(`profile-images/${userId}/${file.name}`);
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

  async changePassword() {
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (newPassword !== confirmPassword) {
      this.showNotification('New passwords do not match!', 'error');
      return;
    }
    
    try {
      // Re-authenticate user
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

  // Utility methods
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
  console.log('DOM Content Loaded - Initializing Admin Dashboard');
  try {
    adminDashboard = new AdminDashboardFirebase();
    console.log('Admin Dashboard initialized successfully');
  } catch (error) {
    console.error('Error initializing Admin Dashboard:', error);
  }
});

// Global functions for HTML onclick handlers
function switchTab(tab) {
  adminDashboard.switchTab(tab);
}

function logout() {
  adminDashboard.logout();
}

function openModal(type) {
  adminDashboard.openModal(type);
}

function closeModal() {
  adminDashboard.closeModal();
}

function editItem(type, id) {
  adminDashboard.editItem(type, id);
}

function deleteItem(type, id) {
  adminDashboard.deleteItem(type, id);
}

async function resetProfileImage() {
  document.getElementById('current-profile-img').src = '../assets/profile.jpg';
  adminDashboard.data.portfolio.profileImage = null;
  await adminDashboard.saveData();
  await adminDashboard.saveToPublicPortfolio();
  adminDashboard.showNotification('Profile image reset to default!', 'success');
}
