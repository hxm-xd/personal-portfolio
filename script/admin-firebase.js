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
    this.init();
  }

  async init() {
    console.log('Initializing admin dashboard...');
    this.setupEventListeners();
    await this.checkAuth();
    this.showNotification('Welcome to Admin Dashboard!', 'success');
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
    } else {
      console.error('Login form not found!');
    }

    // Logout
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.logout();
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
    const container = document.getElementById(type);
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
      return `
        <div class="item-card">
          <div class="item-content">
            <h4 class="item-title">${item.title}</h4>
            <p class="item-description">${item.description}</p>
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
