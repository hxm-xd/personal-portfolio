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
    this.setupRealtimeListeners();
    this.showNotification('Welcome to Admin Dashboard!', 'success');
  }

  checkDOM() {
    const required = ['login-form', 'login-screen', 'admin-dashboard', 'email', 'password'];
    return required.every(id => document.getElementById(id));
  }

  setupEvents() {
    // Tab navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        await this.switchTab(e.target.closest('.nav-btn').getAttribute('data-tab'));
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

  setupRealtimeListeners() {
    // Listen for new contact messages in real-time
    if (typeof window.db !== 'undefined') {
      console.log('Setting up real-time listeners...');
      const contactsRef = window.db.collection('public').doc('portfolio').collection('contacts');
      
      contactsRef.onSnapshot((snapshot) => {
        console.log('Real-time update received:', snapshot.docChanges().length, 'changes');
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            // New message received
            console.log('New contact message received:', change.doc.data());
            this.showNotification('New message received!', 'info');
            
            // Refresh contacts if currently on contacts tab
            if (this.currentTab === 'contacts') {
              this.refreshContactsData();
            }
            
            // Update contact count in overview
            this.updateContactCount();
          }
        });
      }, (error) => {
        console.error('Error setting up real-time listener:', error);
        console.error('This might be due to Firebase security rules');
      });
    } else {
      console.log('Firebase not available for real-time listeners');
    }
  }

  // Diagnostic function to check Firebase connection and permissions
  async runDiagnostics() {
    console.log('=== RUNNING FIREBASE DIAGNOSTICS ===');
    
    try {
      // Check if Firebase is available
      if (typeof window.db === 'undefined') {
        console.error('Firebase db is not available');
        this.showNotification('Firebase not initialized', 'error');
        return;
      }
      
      console.log('Firebase db is available');
      
      // Test basic connection
      const testDoc = await window.db.collection('public').doc('portfolio').get();
      console.log('Portfolio document exists:', testDoc.exists);
      
      // Test contacts collection access
      const contactsSnapshot = await window.db.collection('public').doc('portfolio').collection('contacts').get();
      console.log('Contacts collection accessible, found', contactsSnapshot.docs.length, 'documents');
      
      // Test adding a document
      const testContact = {
        name: 'Diagnostic Test',
        email: 'test@diagnostic.com',
        message: 'This is a diagnostic test message',
        timestamp: new Date().toISOString(),
        read: false
      };
      
      const docRef = await window.db.collection('public').doc('portfolio').collection('contacts').add(testContact);
      console.log('Successfully added test contact with ID:', docRef.id);
      
      // Clean up - delete the test document
      await docRef.delete();
      console.log('Test contact cleaned up');
      
      this.showNotification('Firebase diagnostics completed successfully', 'success');
      
    } catch (error) {
      console.error('Firebase diagnostics failed:', error);
      this.showNotification('Firebase diagnostics failed: ' + error.message, 'error');
    }
  }

  updateContactCount() {
    const contactCount = this.data.contacts.filter(contact => !contact.read).length;
    const contactCountElement = document.getElementById('contact-count');
    if (contactCountElement) {
      contactCountElement.textContent = contactCount;
    }
    
    // Update the Messages tab button with badge
    const messagesTabBtn = document.querySelector('[data-tab="contacts"]');
    if (messagesTabBtn) {
      // Remove existing badge
      const existingBadge = messagesTabBtn.querySelector('.tab-badge');
      if (existingBadge) {
        existingBadge.remove();
      }
      
      // Add new badge if there are unread messages
      if (contactCount > 0) {
        const badge = document.createElement('span');
        badge.className = 'tab-badge';
        badge.textContent = contactCount;
        messagesTabBtn.appendChild(badge);
      }
    }
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

      console.log('Loaded contacts:', this.data.contacts);
      console.log('Contacts array length:', this.data.contacts.length);

      this.renderAllData();
      this.loadPortfolioSettings();
      this.updateContactCount();
    } catch (error) {
      console.error('Error loading data:', error);
      this.showNotification('Error loading data: ' + error.message, 'error');
    }
  }

  async refreshContactsData() {
    try {
      console.log('=== REFRESHING CONTACTS DATA ===');
      console.log('Current user:', this.user);
      console.log('Firebase db available:', typeof window.db !== 'undefined');
      
      // Show loading state on refresh button
      const refreshBtn = document.querySelector('#contacts .tab-actions button:first-child');
      const originalText = refreshBtn ? refreshBtn.innerHTML : '';
      if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
      }
      
      // Load fresh contacts data from Firebase
      console.log('Calling loadCollection for contacts...');
      const contacts = await this.loadCollection('contacts');
      console.log('Raw contacts from Firebase:', contacts);
      
      this.data.contacts = contacts;
      
      console.log('Updated data.contacts:', this.data.contacts);
      console.log('Contacts array length:', this.data.contacts.length);
      
      // Render the contacts immediately
      console.log('Rendering contacts data...');
      this.renderData('contacts');
      
      // Update the contact count in overview
      const contactCount = this.data.contacts.filter(contact => !contact.read).length;
      console.log('Unread contact count:', contactCount);
      const contactCountElement = document.getElementById('contact-count');
      if (contactCountElement) {
        contactCountElement.textContent = contactCount;
      }
      
      console.log('Contacts refreshed successfully');
      this.showNotification('Messages refreshed successfully!', 'success');
      
      // Reset refresh button
      if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = originalText;
      }
    } catch (error) {
      console.error('Error refreshing contacts:', error);
      console.error('Error stack:', error.stack);
      this.showNotification('Error refreshing contacts: ' + error.message, 'error');
      
      // Reset refresh button on error
      const refreshBtn = document.querySelector('#contacts .tab-actions button:first-child');
      if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
      }
    }
  }

  async loadCollection(collectionName, maxRetries = 3) {
    console.log(`=== LOADING COLLECTION: ${collectionName} ===`);
    console.log('Max retries:', maxRetries);
    console.log('Firebase db available:', typeof window.db !== 'undefined');
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${maxRetries} for ${collectionName}`);
        
        // Load contacts from public collection, others from user's private collection
        if (collectionName === 'contacts') {
          console.log('Loading contacts from public collection...');
          const contactsRef = window.db.collection('public').doc('portfolio').collection('contacts');
          console.log('Contacts reference:', contactsRef);
          
          const snapshot = await contactsRef.get();
          console.log('Contacts snapshot:', snapshot);
          console.log('Number of contacts found:', snapshot.docs.length);
          
          const contacts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          console.log('Processed contacts:', contacts);
          return contacts;
        } else {
          console.log(`Loading ${collectionName} from user's private collection...`);
          const snapshot = await window.db.collection('users').doc(this.user.uid).collection(collectionName).get();
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      } catch (error) {
        console.error(`Error on attempt ${attempt} for ${collectionName}:`, error);
        if (attempt === maxRetries) {
          console.error(`All ${maxRetries} attempts failed for ${collectionName}`);
          return [];
        }
        console.log(`Waiting ${1000 * attempt}ms before retry...`);
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
      ['tasks', 'academics', 'projects'].forEach(collection => {
        console.log(`Saving ${collection}:`, this.data[collection]);
        this.data[collection].forEach(item => {
          const docRef = window.db.collection('users').doc(userId).collection(collection).doc(item.id);
          batch.set(docRef, cleanData(item));
        });
      });
      
      // Save contacts to public collection (for marking as read)
      console.log('Saving contacts:', this.data.contacts);
      this.data.contacts.forEach(item => {
        const docRef = window.db.collection('public').doc('portfolio').collection('contacts').doc(item.id);
        batch.set(docRef, cleanData(item));
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

  async switchTab(tab) {
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
      await this.loadOverviewData();
    } else if (tab === 'contacts') {
      // Refresh contacts data when opening messages tab
      await this.refreshContactsData();
    } else if (['tasks', 'academics'].includes(tab)) {
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
    console.log(`=== RENDERING DATA FOR: ${type} ===`);
    
    // Map type to correct data key
    let dataKey;
    if (type === 'project') {
      dataKey = 'projects';
    } else if (type === 'contacts') {
      dataKey = 'contacts'; // Don't add 's' for contacts
    } else {
      dataKey = type + 's';
    }
    
    console.log('Rendering data for:', type, 'using dataKey:', dataKey, this.data[dataKey]);
    
    // Special handling for contacts container
    let container;
    if (type === 'contacts') {
      container = document.getElementById('contacts-list');
      console.log('Contacts container found:', container);
      console.log('Contacts data:', this.data.contacts);
    } else {
      container = document.getElementById(dataKey === 'projects' ? 'projects-list' : `${dataKey}-list`);
    }
    
    if (!container) {
      console.error('Container not found for:', type, 'dataKey:', dataKey);
      return;
    }

    // Ensure the array exists
    if (!this.data[dataKey]) {
      this.data[dataKey] = [];
    }

    const items = this.data[dataKey];
    console.log('Items to render:', items);
    console.log('Items length:', items.length);
    
    if (items.length === 0) {
      console.log('No items to render, showing empty state');
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
      const readClass = item.read ? 'read' : 'unread';
      
      // Special handling for contacts
      if (type === 'contacts') {
        return `
          <div class="item-card ${readClass}">
            <div class="item-content">
              <div class="contact-header">
                <h4 class="item-title">${item.name}</h4>
                ${!item.read ? '<span class="status-badge unread">New</span>' : ''}
              </div>
              <p class="item-email">${item.email}</p>
              <div class="message-container">
                <p class="item-description">${item.message}</p>
              </div>
              <span class="timestamp">${new Date(item.timestamp).toLocaleString()}</span>
            </div>
            <div class="item-actions">
              <button onclick="markAsRead('${item.id}')" class="btn-secondary" title="Mark as read">
                <i class="fas fa-check"></i>
              </button>
              <button onclick="deleteItem('${type}', '${item.id}')" class="btn-danger">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `;
      }
      
      // Default handling for other items
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

  async loadOverviewData() {
    // Refresh contacts data to get the latest count
    await this.refreshContactsData();
    
    // Update statistics
    const taskCount = this.data.tasks.filter(task => task.status !== 'completed').length;
    const contactCount = this.data.contacts.filter(contact => !contact.read).length;
    const deadlineCount = this.data.tasks.filter(task => 
      task.deadline && new Date(task.deadline) > new Date() && task.status !== 'completed'
    ).length;
    
    document.getElementById('task-count').textContent = taskCount;
    document.getElementById('contact-count').textContent = contactCount;
    document.getElementById('deadline-count').textContent = deadlineCount;
    
    // Load portfolio settings to update social shortcuts
    this.loadPortfolioSettings();
    
    // Update social shortcuts
    this.updateSocialShortcuts();
    
    // Load upcoming deadlines
    this.loadUpcomingDeadlines();
    
    // Initialize calendar
    this.initCalendar();
  }

  loadUpcomingDeadlines() {
    const deadlinesList = document.getElementById('deadlines-list');
    if (!deadlinesList) return;
    
    const upcoming = [...this.data.tasks, ...this.data.academics]
      .filter(item => item.deadline && new Date(item.deadline) > new Date())
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 5);
    
    if (upcoming.length === 0) {
      deadlinesList.innerHTML = '<p class="no-deadlines">No upcoming deadlines</p>';
      return;
    }
    
    deadlinesList.innerHTML = upcoming.map(item => `
      <div class="deadline-item">
        <div class="deadline-info">
          <h4>${item.title || item.name}</h4>
          <p>${item.description || ''}</p>
        </div>
        <div class="deadline-date">
          <i class="fas fa-calendar"></i>
          ${new Date(item.deadline).toLocaleDateString()}
        </div>
      </div>
    `).join('');
  }

  initCalendar() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;
    
    // Initialize current month/year
    this.currentCalendarDate = new Date();
    
    // Simple calendar implementation without external library
    this.renderSimpleCalendar();
  }

  renderSimpleCalendar() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;
    
    const currentDate = this.currentCalendarDate || new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    let calendarHTML = `
      <div class="calendar-header">
        <button onclick="adminDashboard.previousMonth()" class="calendar-nav">
          <i class="fas fa-chevron-left"></i>
        </button>
        <h3>${monthNames[month]} ${year}</h3>
        <button onclick="adminDashboard.nextMonth()" class="calendar-nav">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
      <div class="calendar-grid">
        <div class="calendar-weekdays">
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div>
          <div>Thu</div><div>Fri</div><div>Sat</div>
        </div>
        <div class="calendar-days">
    `;
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      calendarHTML += '<div class="calendar-day empty"></div>';
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const hasEvents = this.hasEventsOnDate(date);
      const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
      
      calendarHTML += `
        <div class="calendar-day ${hasEvents ? 'has-events' : ''} ${isToday ? 'today' : ''}" 
             onclick="adminDashboard.showDayEvents(${year}, ${month}, ${day})">
          ${day}
          ${hasEvents ? '<div class="event-indicator"></div>' : ''}
        </div>
      `;
    }
    
    calendarHTML += '</div></div>';
    calendarEl.innerHTML = calendarHTML;
  }

  hasEventsOnDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    return [...this.data.tasks, ...this.data.academics].some(item => 
      item.deadline && item.deadline.split('T')[0] === dateStr
    );
  }

  showDayEvents(year, month, day) {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];
    const events = [...this.data.tasks, ...this.data.academics].filter(item => 
      item.deadline && item.deadline.split('T')[0] === dateStr
    );
    
    if (events.length === 0) {
      this.showNotification('No events on this date', 'info');
      return;
    }
    
    const eventList = events.map(event => `
      <div class="event-item">
        <h4>${event.title || event.name}</h4>
        <p>${event.description || ''}</p>
        <span class="event-type">${event.status || 'Deadline'}</span>
      </div>
    `).join('');
    
    // Create a simple modal to show events
    const modal = document.createElement('div');
    modal.className = 'event-modal';
    modal.innerHTML = `
      <div class="event-modal-content">
        <div class="event-modal-header">
          <h3>Events on ${date.toLocaleDateString()}</h3>
          <button onclick="this.closest('.event-modal').remove()" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="event-modal-body">
          ${eventList}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  previousMonth() {
    if (!this.currentCalendarDate) {
      this.currentCalendarDate = new Date();
    }
    this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() - 1);
    this.renderSimpleCalendar();
  }

  nextMonth() {
    if (!this.currentCalendarDate) {
      this.currentCalendarDate = new Date();
    }
    this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + 1);
    this.renderSimpleCalendar();
  }

  searchTasks() {
    const searchTerm = document.getElementById('task-search').value.toLowerCase();
    const tasks = this.data.tasks.filter(task => 
      task.title.toLowerCase().includes(searchTerm) ||
      task.description.toLowerCase().includes(searchTerm)
    );
    
    this.renderFilteredTasks(tasks);
  }

  filterTasks() {
    const filterValue = document.getElementById('task-filter').value;
    let filteredTasks = this.data.tasks;
    
    if (filterValue !== 'all') {
      filteredTasks = this.data.tasks.filter(task => task.status === filterValue);
    }
    
    this.renderFilteredTasks(filteredTasks);
  }

  renderFilteredTasks(tasks) {
    const container = document.getElementById('tasks-list');
    if (!container) return;
    
    if (tasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-tasks"></i>
          <h3>No tasks found</h3>
          <p>Try adjusting your search or filter criteria.</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = tasks.map(task => {
      const statusClass = task.status ? `status-${task.status}` : '';
      const statusText = task.status ? task.status.replace('-', ' ') : '';
      
      return `
        <div class="item-card ${statusClass}">
          <div class="item-content">
            <h4 class="item-title">${task.title}</h4>
            <p class="item-description">${task.description || ''}</p>
            ${task.status ? `<span class="status-badge">${statusText}</span>` : ''}
            ${task.deadline ? `<span class="deadline">Due: ${new Date(task.deadline).toLocaleDateString()}</span>` : ''}
          </div>
          <div class="item-actions">
            <button onclick="editItem('task', '${task.id}')" class="btn-secondary">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteItem('task', '${task.id}')" class="btn-danger">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
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
    let dataKey;
    if (type === 'project') {
      dataKey = 'projects';
    } else if (type === 'contacts') {
      dataKey = 'contacts';
    } else {
      dataKey = type + 's';
    }
    
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
    let dataKey;
    if (type === 'project') {
      dataKey = 'projects';
    } else if (type === 'contacts') {
      dataKey = 'contacts';
    } else {
      dataKey = type + 's';
    }
    
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
    let dataKey;
    if (type === 'project') {
      dataKey = 'projects';
    } else if (type === 'contacts') {
      dataKey = 'contacts';
    } else {
      dataKey = type + 's';
    }
    
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
    let dataKey;
    if (type === 'project') {
      dataKey = 'projects';
    } else if (type === 'contacts') {
      dataKey = 'contacts';
    } else {
      dataKey = type + 's';
    }
    
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
      const countElement = document.getElementById(`${category}-count`);
      
      if (container && portfolio.skills[category]) {
        // Update skill count
        if (countElement) {
          countElement.textContent = portfolio.skills[category].length;
        }
        
        container.innerHTML = portfolio.skills[category].map(skill => {
          const levelClass = skill.level.toLowerCase();
          const descriptionHtml = skill.description ? `<div class="skill-description">${skill.description}</div>` : '';
          
          return `
            <div class="skill-item">
              <div class="skill-info">
                <span class="skill-name">${skill.name}</span>
                <span class="skill-level ${levelClass}">${skill.level}</span>
                ${descriptionHtml}
              </div>
              <button onclick="removeSkill('${category}', '${skill.name}')" class="remove-skill" title="Remove skill">
                <i class="fas fa-times"></i>
              </button>
            </div>
          `;
        }).join('');
      } else if (container) {
        // Show empty state
        container.innerHTML = `
          <div class="skill-item" style="opacity: 0.6; font-style: italic; justify-content: center;">
            <i class="fas fa-plus-circle"></i>
            <span>No skills added yet</span>
          </div>
        `;
        
        // Reset count to 0
        if (countElement) {
          countElement.textContent = '0';
        }
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
async function switchTab(tab) { await adminDashboard.switchTab(tab); }
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
  adminDashboard.updateContactCount();
  adminDashboard.showNotification('All contacts marked as read!', 'success');
}

function markAsRead(contactId) {
  const contact = adminDashboard.data.contacts.find(c => c.id === contactId);
  if (contact) {
    contact.read = true;
    adminDashboard.renderData('contacts');
    adminDashboard.saveData();
    adminDashboard.updateContactCount();
    adminDashboard.showNotification('Contact marked as read!', 'success');
  }
}

let currentSkillCategory = null;

function openSkillModal(category) {
  currentSkillCategory = category;
  const modal = document.getElementById('skill-modal');
  const modalTitle = document.getElementById('skill-modal-title');
  
  // Set modal title based on category
  const categoryNames = {
    'programming': 'Programming Language',
    'web': 'Web Technology',
    'mobile': 'Mobile Technology',
    'database': 'Database',
    'iot': 'IoT Technology'
  };
  
  modalTitle.textContent = `Add ${categoryNames[category] || 'Skill'}`;
  
  // Reset form
  document.getElementById('skill-modal-form').reset();
  
  // Show modal
  modal.style.display = 'flex';
  
  // Focus on skill name input
  setTimeout(() => {
    document.getElementById('skill-name').focus();
  }, 100);
}

function closeSkillModal() {
  document.getElementById('skill-modal').style.display = 'none';
  currentSkillCategory = null;
}

// Add event listener for skill modal form
document.addEventListener('DOMContentLoaded', () => {
  const skillModalForm = document.getElementById('skill-modal-form');
  if (skillModalForm) {
    skillModalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      addSkillFromModal();
    });
  }
});

function addSkillFromModal() {
  const skillName = document.getElementById('skill-name').value.trim();
  const skillLevel = document.getElementById('skill-level').value;
  const skillDescription = document.getElementById('skill-description').value.trim();
  
  if (!skillName || !skillLevel) {
    adminDashboard.showNotification('Please fill in all required fields!', 'error');
    return;
  }
  
  if (!adminDashboard.data.portfolio.skills) adminDashboard.data.portfolio.skills = {};
  if (!adminDashboard.data.portfolio.skills[currentSkillCategory]) adminDashboard.data.portfolio.skills[currentSkillCategory] = [];
  
  const newSkill = {
    name: skillName,
    level: skillLevel
  };
  
  if (skillDescription) {
    newSkill.description = skillDescription;
  }
  
  adminDashboard.data.portfolio.skills[currentSkillCategory].push(newSkill);
  
  adminDashboard.saveData();
  adminDashboard.saveToPublicPortfolio();
  adminDashboard.loadSkills();
  adminDashboard.showNotification('Skill added successfully!', 'success');
  
  closeSkillModal();
}

function addSkill(category) {
  // Legacy function - redirect to new modal
  openSkillModal(category);
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

// Global functions for search and filter
function searchTasks() {
  if (adminDashboard) {
    adminDashboard.searchTasks();
  }
}

function filterTasks() {
  if (adminDashboard) {
    adminDashboard.filterTasks();
  }
}

// Test function to add a sample contact message
async function addTestContact() {
  try {
    console.log('Adding test contact message...');
    
    const testMessage = {
      name: 'Test User',
      email: 'test@example.com',
      message: 'This is a test message to verify the contact system is working.',
      timestamp: new Date().toISOString(),
      read: false
    };
    
    // Add to Firebase
    const docRef = await window.db.collection('public').doc('portfolio').collection('contacts').add(testMessage);
    console.log('Test contact added with ID:', docRef.id);
    
    // Refresh the contacts data
    await adminDashboard.refreshContactsData();
    
    adminDashboard.showNotification('Test contact added successfully!', 'success');
  } catch (error) {
    console.error('Error adding test contact:', error);
    adminDashboard.showNotification('Error adding test contact: ' + error.message, 'error');
  }
}