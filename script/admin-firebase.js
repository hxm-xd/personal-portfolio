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

  // Include all other methods from the original admin.js
  // (switchTab, renderData, initCalendar, etc.)
  // ... (I'll continue with the rest of the methods)
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
