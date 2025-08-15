// Admin Dashboard - Enhanced JavaScript with Security
class AdminDashboard {
  constructor() {
    // Enhanced security credentials with hashed passwords
    this.credentials = { 
      username: 'admin', 
      password: this.hashPassword('admin123') // Hash the default password
    };
    this.isAuthenticated = false;
    this.currentTab = 'overview';
    this.editId = null;
    this.calendar = null;
    this.sessionExpiresAt = null;
    this.inactivityTimer = null;
    this.maxLoginAttempts = 5;
    this.loginAttempts = 0;
    this.lockoutUntil = null;
    
    // Load data with validation
    this.data = this.loadDataSecurely();
    
    // Security settings
    this.securitySettings = {
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      inactivityTimeout: 10 * 60 * 1000, // 10 minutes
      maxLoginAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
      requirePasswordChange: false
    };
  }

  // Security Methods
  hashPassword(password) {
    // Simple hash function for demo purposes
    // In production, use bcrypt or similar
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  verifyPassword(inputPassword) {
    return this.hashPassword(inputPassword) === this.credentials.password;
  }

  loadDataSecurely() {
    try {
      return {
        tasks: JSON.parse(localStorage.getItem('admin_tasks') || '[]'),
        academics: JSON.parse(localStorage.getItem('admin_academics') || '[]'),
        contacts: JSON.parse(localStorage.getItem('admin_contacts') || '[]'),
        projects: JSON.parse(localStorage.getItem('admin_projects') || '[]'),
        settings: JSON.parse(localStorage.getItem('admin_settings') || '{}'),
        portfolio: JSON.parse(localStorage.getItem('admin_portfolio') || '{}')
      };
    } catch (error) {
      console.error('Error loading data:', error);
      return {
        tasks: [], academics: [], contacts: [], 
        projects: [], settings: {}, portfolio: {}
      };
    }
  }

  createSession() {
    const sessionToken = this.generateSecureToken();
    const expiresAt = Date.now() + this.securitySettings.sessionTimeout;
    
    this.sessionExpiresAt = expiresAt;
    localStorage.setItem('admin_session_token', sessionToken);
    localStorage.setItem('admin_session_expires', expiresAt.toString());
    
    return sessionToken;
  }

  generateSecureToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  validateSession() {
    const token = localStorage.getItem('admin_session_token');
    const expiresAt = localStorage.getItem('admin_session_expires');
    
    if (!token || !expiresAt) return false;
    
    const now = Date.now();
    const expiration = parseInt(expiresAt);
    
    if (now > expiration) {
      this.clearSession();
      return false;
    }
    
    return true;
  }

  clearSession() {
    localStorage.removeItem('admin_session_token');
    localStorage.removeItem('admin_session_expires');
    this.sessionExpiresAt = null;
    this.isAuthenticated = false;
  }

  startInactivityTimer() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    
    this.inactivityTimer = setTimeout(() => {
      this.logout('Session expired due to inactivity');
    }, this.securitySettings.inactivityTimeout);
  }

  resetInactivityTimer() {
    this.startInactivityTimer();
  }

  isAccountLocked() {
    if (!this.lockoutUntil) return false;
    return Date.now() < this.lockoutUntil;
  }

  lockAccount() {
    this.lockoutUntil = Date.now() + this.securitySettings.lockoutDuration;
    localStorage.setItem('admin_lockout_until', this.lockoutUntil.toString());
  }

  checkLockout() {
    const lockoutUntil = localStorage.getItem('admin_lockout_until');
    if (lockoutUntil) {
      this.lockoutUntil = parseInt(lockoutUntil);
    }
  }

  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.replace(/[<>]/g, '').trim();
  }

  validateData(data) {
    // Basic validation for critical data
    if (data && typeof data === 'object') {
      for (let key in data) {
        if (typeof data[key] === 'string') {
          data[key] = this.sanitizeInput(data[key]);
        }
      }
    }
    return data;
  }

  init() {
    this.setupEventListeners();
    this.checkAuth();
    this.initCalendar();
    this.updateSecurityStatus();
    this.showNotification('Welcome to Admin Dashboard!', 'success');
  }

  updateSecurityStatus() {
    const securityStatus = document.getElementById('security-status');
    const securityText = document.getElementById('security-text');
    
    if (!securityStatus || !securityText) return;
    
    if (!this.isAuthenticated) {
      securityStatus.className = 'security-status danger';
      securityText.textContent = 'Not Authenticated';
      return;
    }
    
    if (!this.validateSession()) {
      securityStatus.className = 'security-status danger';
      securityText.textContent = 'Session Expired';
      return;
    }
    
    // Check session time remaining
    const timeRemaining = this.sessionExpiresAt - Date.now();
    const minutesRemaining = Math.ceil(timeRemaining / 1000 / 60);
    
    if (minutesRemaining <= 5) {
      securityStatus.className = 'security-status warning';
      securityText.textContent = `Session expires in ${minutesRemaining}m`;
    } else {
      securityStatus.className = 'security-status';
      securityText.textContent = 'Secure';
    }
  }

  updateSecurityInfo() {
    const sessionTimeout = document.getElementById('session-timeout');
    const inactivityTimeout = document.getElementById('inactivity-timeout');
    const maxAttempts = document.getElementById('max-attempts');
    const lockoutDuration = document.getElementById('lockout-duration');
    
    if (sessionTimeout) {
      sessionTimeout.textContent = `${Math.ceil(this.securitySettings.sessionTimeout / 1000 / 60)} minutes`;
    }
    if (inactivityTimeout) {
      inactivityTimeout.textContent = `${Math.ceil(this.securitySettings.inactivityTimeout / 1000 / 60)} minutes`;
    }
    if (maxAttempts) {
      maxAttempts.textContent = this.securitySettings.maxLoginAttempts;
    }
    if (lockoutDuration) {
      lockoutDuration.textContent = `${Math.ceil(this.securitySettings.lockoutDuration / 1000 / 60)} minutes`;
    }
  }

  forceLogout() {
    if (confirm('Are you sure you want to force logout all sessions? This will immediately log you out.')) {
      this.logout('Forced logout by user');
      this.showNotification('All sessions have been terminated.', 'warning');
    }
  }

  setupEventListeners() {
    // Login form
    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.login();
    });

    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (this.requireAuth()) {
          this.switchTab(e.target.closest('.nav-btn').dataset.tab);
          this.resetInactivityTimer();
        }
      });
    });

    // Modal form
    document.getElementById('modal-form').addEventListener('submit', (e) => {
      e.preventDefault();
      if (this.requireAuth()) {
        this.handleModalSubmit();
        this.resetInactivityTimer();
      }
    });

    // Password form
    document.getElementById('password-form').addEventListener('submit', (e) => {
      e.preventDefault();
      if (this.requireAuth()) {
        this.changePassword();
        this.resetInactivityTimer();
      }
    });

    // Portfolio Settings forms
    document.getElementById('profile-form').addEventListener('submit', (e) => {
      e.preventDefault();
      if (this.requireAuth()) {
        this.saveProfileInfo();
        this.resetInactivityTimer();
      }
    });

    document.getElementById('social-form').addEventListener('submit', (e) => {
      e.preventDefault();
      if (this.requireAuth()) {
        this.saveSocialLinks();
        this.resetInactivityTimer();
      }
    });

    document.getElementById('stats-form').addEventListener('submit', (e) => {
      e.preventDefault();
      if (this.requireAuth()) {
        this.saveStatistics();
        this.resetInactivityTimer();
      }
    });

    document.getElementById('contact-info-form').addEventListener('submit', (e) => {
      e.preventDefault();
      if (this.requireAuth()) {
        this.saveContactInfo();
        this.resetInactivityTimer();
      }
    });

    // Profile image upload
    document.getElementById('profile-image-input').addEventListener('change', (e) => {
      if (this.requireAuth()) {
        this.handleProfileImageUpload(e);
        this.resetInactivityTimer();
      }
    });

    // Close modal on backdrop click
    document.getElementById('modal').addEventListener('click', (e) => {
      if (e.target.id === 'modal') {
        this.closeModal();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
      }
    });

    // Security: Reset inactivity timer on user interaction
    document.addEventListener('mousemove', () => this.resetInactivityTimer());
    document.addEventListener('keypress', () => this.resetInactivityTimer());
    document.addEventListener('click', () => this.resetInactivityTimer());
    document.addEventListener('scroll', () => this.resetInactivityTimer());

    // Security: Prevent right-click context menu
    document.addEventListener('contextmenu', (e) => {
      if (this.isAuthenticated) {
        e.preventDefault();
      }
    });

    // Security: Prevent F12, Ctrl+Shift+I, Ctrl+U
    document.addEventListener('keydown', (e) => {
      if (this.isAuthenticated) {
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.key === 'u')) {
          e.preventDefault();
        }
      }
    });
  }

  checkAuth() {
    this.checkLockout();
    
    if (this.isAccountLocked()) {
      const remainingTime = Math.ceil((this.lockoutUntil - Date.now()) / 1000 / 60);
      this.showNotification(`Account is locked. Try again in ${remainingTime} minutes.`, 'error');
      this.showLogin();
      return;
    }
    
    if (this.validateSession()) {
      this.isAuthenticated = true;
      this.startInactivityTimer();
      this.showDashboard();
    } else {
      this.showLogin();
    }
  }

  requireAuth() {
    if (!this.isAuthenticated || !this.validateSession()) {
      this.logout('Session expired. Please login again.');
      return false;
    }
    return true;
  }

  login() {
    const username = this.sanitizeInput(document.getElementById('username').value);
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('login-error');
    const button = document.querySelector('#login-form button');

    // Check if account is locked
    if (this.isAccountLocked()) {
      const remainingTime = Math.ceil((this.lockoutUntil - Date.now()) / 1000 / 60);
      errorEl.textContent = `Account is locked. Try again in ${remainingTime} minutes.`;
      errorEl.style.display = 'block';
      this.showNotification(`Account locked for ${remainingTime} more minutes.`, 'error');
      return;
    }

    // Show loading state
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    button.disabled = true;

    // Simulate loading delay
    setTimeout(() => {
      if (username === this.credentials.username && this.verifyPassword(password)) {
        // Reset login attempts on successful login
        this.loginAttempts = 0;
        localStorage.removeItem('admin_lockout_until');
        this.lockoutUntil = null;
        
        // Create secure session
        this.createSession();
        this.isAuthenticated = true;
        this.startInactivityTimer();
        
        this.showDashboard();
        errorEl.style.display = 'none';
        this.showNotification('Login successful!', 'success');
        
        // Log successful login
        console.log(`Successful login at ${new Date().toISOString()}`);
      } else {
        // Increment login attempts
        this.loginAttempts++;
        
        if (this.loginAttempts >= this.maxLoginAttempts) {
          this.lockAccount();
          const remainingTime = Math.ceil(this.securitySettings.lockoutDuration / 1000 / 60);
          errorEl.textContent = `Too many failed attempts. Account locked for ${remainingTime} minutes.`;
          this.showNotification(`Account locked for ${remainingTime} minutes due to too many failed attempts.`, 'error');
        } else {
          const remainingAttempts = this.maxLoginAttempts - this.loginAttempts;
          errorEl.textContent = `Invalid credentials. ${remainingAttempts} attempts remaining.`;
          this.showNotification(`Login failed. ${remainingAttempts} attempts remaining.`, 'error');
        }
        
        errorEl.style.display = 'block';
        
        // Log failed login attempt
        console.log(`Failed login attempt at ${new Date().toISOString()} - Username: ${username}`);
      }

      // Reset button
      button.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
      button.disabled = false;
    }, 1000);
  }

  logout(reason = 'Logged out successfully') {
    this.isAuthenticated = false;
    this.clearSession();
    
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    
    this.showLogin();
    this.showNotification(reason, 'info');
    
    // Log logout
    console.log(`Logout at ${new Date().toISOString()} - Reason: ${reason}`);
  }

  showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
  }

  showDashboard() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    this.loadData();
    this.updateSecurityStatus();
    this.updateSecurityInfo();
    
    // Update security status every minute
    setInterval(() => {
      if (this.isAuthenticated) {
        this.updateSecurityStatus();
      }
    }, 60000);
  }

  switchTab(tabName) {
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tabs
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');

    this.currentTab = tabName;
    this.loadData();
  }

  loadData() {
    this.updateStats();
    this.loadTasks();
    this.loadAcademics();
    this.loadContacts();
    this.loadProjects();
    this.loadPortfolioSettings();
    this.updateCalendar();
  }

  updateStats() {
    const tasks = this.data.tasks.filter(t => t.status !== 'completed').length;
    const contacts = this.data.contacts.filter(c => !c.read).length;
    const deadlines = this.getUpcomingDeadlines().length;
    const views = parseInt(localStorage.getItem('portfolio_views') || '0');

    // Animate numbers
    this.animateNumber('task-count', tasks);
    this.animateNumber('contact-count', contacts);
    this.animateNumber('deadline-count', deadlines);
    this.animateNumber('view-count', views);
  }

  animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    const currentValue = parseInt(element.textContent) || 0;
    const increment = (targetValue - currentValue) / 20;
    let current = currentValue;

    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= targetValue) || (increment < 0 && current <= targetValue)) {
        current = targetValue;
        clearInterval(timer);
      }
      element.textContent = Math.floor(current);
    }, 50);
  }

  initCalendar() {
    const calendarEl = document.getElementById('calendar');
    if (calendarEl) {
      this.calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        height: 400,
        events: this.getCalendarEvents(),
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek'
        },
        eventClick: (info) => {
          this.showEventDetails(info.event);
        }
      });
      this.calendar.render();
    }
  }

  getCalendarEvents() {
    const events = [];
    
    // Add tasks
    this.data.tasks.forEach(task => {
      if (task.dueDate) {
        events.push({
          title: task.title,
          date: task.dueDate,
          color: this.getStatusColor(task.status),
          extendedProps: { type: 'task', id: task.id }
        });
      }
    });

    // Add academics
    this.data.academics.forEach(academic => {
      if (academic.dueDate) {
        events.push({
          title: academic.title,
          date: academic.dueDate,
          color: '#e74c3c',
          extendedProps: { type: 'academic', id: academic.id }
        });
      }
    });

    return events;
  }

  getStatusColor(status) {
    switch (status) {
      case 'completed': return '#27ae60';
      case 'in-progress': return '#f39c12';
      default: return '#3498db';
    }
  }

  getUpcomingDeadlines() {
    const now = new Date();
    const deadlines = [];

    // Add tasks
    this.data.tasks.forEach(task => {
      if (task.dueDate && new Date(task.dueDate) > now) {
        deadlines.push({
          title: task.title,
          date: task.dueDate,
          type: 'task',
          status: task.status
        });
      }
    });

    // Add academics
    this.data.academics.forEach(academic => {
      if (academic.dueDate && new Date(academic.dueDate) > now) {
        deadlines.push({
          title: academic.title,
          date: academic.dueDate,
          type: 'academic',
          status: academic.type
        });
      }
    });

    return deadlines.sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5);
  }

  updateCalendar() {
    if (this.calendar) {
      this.calendar.removeAllEvents();
      this.calendar.addEventSource(this.getCalendarEvents());
    }

    // Update deadlines list
    const deadlinesList = document.getElementById('deadlines-list');
    if (deadlinesList) {
      const deadlines = this.getUpcomingDeadlines();
      deadlinesList.innerHTML = deadlines.map(deadline => `
        <div class="item-card">
          <div class="item-title">${deadline.title}</div>
          <div class="item-meta">
            <span><i class="fas fa-calendar"></i> ${new Date(deadline.date).toLocaleDateString()}</span>
            <span><i class="fas fa-tag"></i> ${deadline.type}</span>
          </div>
        </div>
      `).join('');
    }
  }

  // Task Management
  loadTasks() {
    const container = document.getElementById('tasks-list');
    if (!container) return;

    const tasks = this.data.tasks;
    if (tasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-tasks"></i>
          <h3>No tasks yet</h3>
          <p>Create your first task to get started</p>
          <button onclick="openModal('task')" class="btn-primary">
            <i class="fas fa-plus"></i> Add Task
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = tasks.map(task => `
      <div class="item-card ${task.status === 'completed' ? 'completed' : ''}">
        <div class="item-header">
          <div class="item-title">
            ${task.status === 'completed' ? '<i class="fas fa-check-circle"></i>' : ''}
            ${task.title}
          </div>
          <div class="item-actions">
            <button onclick="adminDashboard.changeTaskStatus('${task.id}')" class="complete">
              <i class="fas fa-${task.status === 'completed' ? 'undo' : 'check'}"></i>
              ${task.status === 'completed' ? 'Undo' : 'Complete'}
            </button>
            <button onclick="adminDashboard.editItem('task', '${task.id}')" class="edit">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button onclick="adminDashboard.deleteItem('task', '${task.id}')" class="delete">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
        <div class="item-meta">
          <span class="priority ${task.priority}">
            <i class="fas fa-flag"></i> ${task.priority}
          </span>
          <span class="category">
            <i class="fas fa-tag"></i> ${task.category}
          </span>
          ${task.dueDate ? `<span class="due-date">
            <i class="fas fa-calendar"></i> ${new Date(task.dueDate).toLocaleDateString()}
          </span>` : ''}
        </div>
        ${task.description ? `<div class="item-description">${task.description}</div>` : ''}
      </div>
    `).join('');
  }

  // Academic Management
  loadAcademics() {
    const container = document.getElementById('academics-list');
    if (!container) return;

    const academics = this.data.academics;
    if (academics.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-graduation-cap"></i>
          <h3>No academic items yet</h3>
          <p>Add your first academic item to get started</p>
          <button onclick="openModal('academic')" class="btn-primary">
            <i class="fas fa-plus"></i> Add Academic
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = academics.map(academic => `
      <div class="item-card">
        <div class="item-header">
          <div class="item-title">
            <i class="fas fa-${this.getAcademicIcon(academic.type)}"></i>
            ${academic.title}
          </div>
          <div class="item-actions">
            <button onclick="adminDashboard.editItem('academic', '${academic.id}')" class="edit">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button onclick="adminDashboard.deleteItem('academic', '${academic.id}')" class="delete">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
        <div class="item-meta">
          <span class="type">
            <i class="fas fa-tag"></i> ${academic.type}
          </span>
          ${academic.dueDate ? `<span class="due-date">
            <i class="fas fa-calendar"></i> ${new Date(academic.dueDate).toLocaleDateString()}
          </span>` : ''}
          ${academic.grade ? `<span class="grade">
            <i class="fas fa-star"></i> Grade: ${academic.grade}
          </span>` : ''}
        </div>
        ${academic.description ? `<div class="item-description">${academic.description}</div>` : ''}
      </div>
    `).join('');
  }

  getAcademicIcon(type) {
    switch (type) {
      case 'course': return 'book';
      case 'assignment': return 'file-alt';
      case 'exam': return 'clipboard-check';
      default: return 'graduation-cap';
    }
  }

  // Contact Management
  loadContacts() {
    const container = document.getElementById('contacts-list');
    if (!container) return;

    const contacts = this.data.contacts;
    if (contacts.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-envelope"></i>
          <h3>No contact requests yet</h3>
          <p>Contact requests from your portfolio will appear here</p>
        </div>
      `;
      return;
    }

    container.innerHTML = contacts.map(contact => `
      <div class="item-card ${!contact.read ? 'unread' : ''}">
        <div class="item-header">
          <div class="item-title">
            <i class="fas fa-user"></i>
            ${contact.name}
          </div>
          <div class="item-actions">
            <button onclick="adminDashboard.markContactRead('${contact.id}')" class="edit">
              <i class="fas fa-${contact.read ? 'envelope' : 'envelope-open'}"></i>
              ${contact.read ? 'Mark Unread' : 'Mark Read'}
            </button>
            <button onclick="adminDashboard.deleteItem('contact', '${contact.id}')" class="delete">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
        <div class="item-meta">
          <span class="email">
            <i class="fas fa-envelope"></i> ${contact.email}
          </span>
          <span class="date">
            <i class="fas fa-clock"></i> ${new Date(contact.date).toLocaleDateString()}
          </span>
        </div>
        <div class="item-description">${contact.message}</div>
      </div>
    `).join('');
  }

  // Project Management
  loadProjects() {
    const container = document.getElementById('projects-list');
    if (!container) return;

    const projects = this.data.projects;
    if (projects.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-briefcase"></i>
          <h3>No projects yet</h3>
          <p>Add your first project to showcase your work</p>
          <button onclick="openModal('project')" class="btn-primary">
            <i class="fas fa-plus"></i> Add Project
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = projects.map(project => `
      <div class="item-card">
        <div class="item-header">
          <div class="item-title">
            <i class="fas fa-code"></i>
            ${project.title}
          </div>
          <div class="item-actions">
            <button onclick="adminDashboard.editItem('project', '${project.id}')" class="edit">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button onclick="adminDashboard.deleteItem('project', '${project.id}')" class="delete">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
                 <div class="item-meta">
           ${project.technologies ? `<span class="technologies">
             <i class="fas fa-tools"></i> ${project.technologies}
           </span>` : ''}
           ${project.url ? `<span class="url">
             <i class="fas fa-external-link-alt"></i> 
             <a href="${project.url}" target="_blank">View Project</a>
           </span>` : '<span class="no-url"><i class="fas fa-info-circle"></i> No URL provided</span>'}
           ${project.image ? `<span class="has-image">
             <i class="fas fa-image"></i> Has Image
           </span>` : '<span class="no-image"><i class="fas fa-info-circle"></i> No Image</span>'}
         </div>
        <div class="item-description">${project.description}</div>
      </div>
    `).join('');
  }

  // Modal Management
  openModal(type) {
    const modal = document.getElementById('modal');
    const title = document.getElementById('modal-title');
    const fields = document.getElementById('modal-fields');

    // Only reset editId and title if not editing
    if (!this.editId) {
      title.innerHTML = `<i class="fas fa-${this.getModalIcon(type)}"></i> Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    }
    
    // Clear any existing form data
    document.getElementById('modal-form').reset();

    const fieldConfigs = {
      task: [
        { name: 'title', type: 'text', placeholder: 'Task Title', required: true },
        { name: 'description', type: 'textarea', placeholder: 'Description' },
        { name: 'priority', type: 'select', options: ['low', 'medium', 'high'], required: true },
        { name: 'category', type: 'select', options: ['work', 'personal', 'academic'], required: true },
        { name: 'dueDate', type: 'datetime-local' }
      ],
      academic: [
        { name: 'title', type: 'text', placeholder: 'Academic Title', required: true },
        { name: 'type', type: 'select', options: ['course', 'assignment', 'exam'], required: true },
        { name: 'description', type: 'textarea', placeholder: 'Description' },
        { name: 'dueDate', type: 'datetime-local' },
        { name: 'grade', type: 'text', placeholder: 'Grade (optional)' }
      ],
             project: [
         { name: 'title', type: 'text', placeholder: 'Project Title', required: true },
         { name: 'description', type: 'textarea', placeholder: 'Description', required: true },
         { name: 'technologies', type: 'text', placeholder: 'Technologies used (optional)' },
         { name: 'url', type: 'url', placeholder: 'Project URL (optional)' },
         { name: 'image', type: 'url', placeholder: 'Image URL (optional)' }
       ]
    };

    const config = fieldConfigs[type];
    fields.innerHTML = config.map(field => {
      if (field.type === 'select') {
        return `
          <select name="${field.name}" ${field.required ? 'required' : ''}>
            <option value="">Select ${field.name}</option>
            ${field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
          </select>
        `;
      } else if (field.type === 'textarea') {
        return `<textarea name="${field.name}" placeholder="${field.placeholder}" ${field.required ? 'required' : ''}></textarea>`;
      } else {
        return `<input type="${field.type}" name="${field.name}" placeholder="${field.placeholder}" ${field.required ? 'required' : ''}>`;
      }
    }).join('');

    modal.style.display = 'flex';
  }

  getModalIcon(type) {
    switch (type) {
      case 'task': return 'tasks';
      case 'academic': return 'graduation-cap';
      case 'project': return 'code';
      default: return 'plus';
    }
  }

  closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('modal-form').reset();
    this.editId = null; // Reset editId when closing modal
  }

  handleModalSubmit() {
    const formData = new FormData(document.getElementById('modal-form'));
    const data = Object.fromEntries(formData.entries());
    
    if (this.editId) {
      // For projects, we need to handle the 'project' type correctly
      const itemType = this.currentTab === 'portfolio' ? 'project' : this.currentTab.slice(0, -1);
      this.updateItem(itemType, this.editId, data);
      this.showNotification('Item updated successfully!', 'success');
    } else {
      // For projects, we need to handle the 'project' type correctly
      const itemType = this.currentTab === 'portfolio' ? 'project' : this.currentTab.slice(0, -1);
      this.addItem(itemType, data);
      this.showNotification('Item added successfully!', 'success');
    }
    
    this.closeModal();
  }

  editItem(type, id) {
    this.editId = id;
    const item = this.data[type + 's'].find(item => item.id === id);
    if (!item) return;

    this.openModal(type);
    
    // Update modal title for editing
    const title = document.getElementById('modal-title');
    title.innerHTML = `<i class="fas fa-${this.getModalIcon(type)}"></i> Edit ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    
    // Populate form
    const form = document.getElementById('modal-form');
    Object.keys(item).forEach(key => {
      const input = form.querySelector(`[name="${key}"]`);
      if (input) {
        // Handle different input types
        if (input.type === 'datetime-local' && item[key]) {
          // Convert ISO string to datetime-local format
          const date = new Date(item[key]);
          const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
          input.value = localDateTime;
        } else {
          input.value = item[key];
        }
      }
    });
  }

  addItem(type, data) {
    const item = {
      id: Date.now().toString(),
      ...data,
      date: new Date().toISOString()
    };

    // Ensure the array exists
    if (!this.data[type + 's']) {
      this.data[type + 's'] = [];
    }

    this.data[type + 's'].push(item);
    this.saveData();
    this.loadData();
  }

  updateItem(type, id, data) {
    const index = this.data[type + 's'].findIndex(item => item.id === id);
    if (index !== -1) {
      this.data[type + 's'][index] = { ...this.data[type + 's'][index], ...data };
      this.saveData();
      this.loadData();
    } else {
      this.showNotification('Item not found!', 'error');
    }
  }

  deleteItem(type, id) {
    if (confirm('Are you sure you want to delete this item?')) {
      const initialLength = this.data[type + 's'].length;
      this.data[type + 's'] = this.data[type + 's'].filter(item => item.id !== id);
      
      if (this.data[type + 's'].length < initialLength) {
        this.saveData();
        this.loadData();
        this.showNotification('Item deleted successfully!', 'success');
      } else {
        this.showNotification('Item not found!', 'error');
      }
    }
  }

  changeTaskStatus(id) {
    const task = this.data.tasks.find(t => t.id === id);
    if (task) {
      task.status = task.status === 'completed' ? 'pending' : 'completed';
      this.saveData();
      this.loadData();
      this.showNotification(`Task marked as ${task.status}!`, 'success');
    }
  }

  markContactRead(id) {
    const contact = this.data.contacts.find(c => c.id === id);
    if (contact) {
      contact.read = !contact.read;
      this.saveData();
      this.loadData();
      this.showNotification(`Contact marked as ${contact.read ? 'read' : 'unread'}!`, 'success');
    }
  }

  markAllRead() {
    this.data.contacts.forEach(contact => contact.read = true);
    this.saveData();
    this.loadData();
    this.showNotification('All contacts marked as read!', 'success');
  }

  searchTasks() {
    const searchTerm = document.getElementById('task-search').value.toLowerCase();
    const filteredTasks = this.data.tasks.filter(task => 
      task.title.toLowerCase().includes(searchTerm) || 
      task.description.toLowerCase().includes(searchTerm)
    );
    
    const container = document.getElementById('tasks-list');
    if (filteredTasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-search"></i>
          <h3>No tasks found</h3>
          <p>Try adjusting your search terms</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filteredTasks.map(task => `
      <div class="item-card ${task.status === 'completed' ? 'completed' : ''}">
        <div class="item-header">
          <div class="item-title">
            ${task.status === 'completed' ? '<i class="fas fa-check-circle"></i>' : ''}
            ${task.title}
          </div>
          <div class="item-actions">
            <button onclick="adminDashboard.changeTaskStatus('${task.id}')" class="complete">
              <i class="fas fa-${task.status === 'completed' ? 'undo' : 'check'}"></i>
              ${task.status === 'completed' ? 'Undo' : 'Complete'}
            </button>
            <button onclick="adminDashboard.editItem('task', '${task.id}')" class="edit">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button onclick="adminDashboard.deleteItem('task', '${task.id}')" class="delete">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
        <div class="item-meta">
          <span class="priority ${task.priority}">
            <i class="fas fa-flag"></i> ${task.priority}
          </span>
          <span class="category">
            <i class="fas fa-tag"></i> ${task.category}
          </span>
          ${task.dueDate ? `<span class="due-date">
            <i class="fas fa-calendar"></i> ${new Date(task.dueDate).toLocaleDateString()}
          </span>` : ''}
        </div>
        ${task.description ? `<div class="item-description">${task.description}</div>` : ''}
      </div>
    `).join('');
  }

  filterTasks() {
    const filter = document.getElementById('task-filter').value;
    const filteredTasks = filter === 'all' 
      ? this.data.tasks 
      : this.data.tasks.filter(task => task.status === filter);
    
    const container = document.getElementById('tasks-list');
    if (filteredTasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-filter"></i>
          <h3>No ${filter} tasks</h3>
          <p>Try a different filter or add new tasks</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filteredTasks.map(task => `
      <div class="item-card ${task.status === 'completed' ? 'completed' : ''}">
        <div class="item-header">
          <div class="item-title">
            ${task.status === 'completed' ? '<i class="fas fa-check-circle"></i>' : ''}
            ${task.title}
          </div>
          <div class="item-actions">
            <button onclick="adminDashboard.changeTaskStatus('${task.id}')" class="complete">
              <i class="fas fa-${task.status === 'completed' ? 'undo' : 'check'}"></i>
              ${task.status === 'completed' ? 'Undo' : 'Complete'}
            </button>
            <button onclick="adminDashboard.editItem('task', '${task.id}')" class="edit">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button onclick="adminDashboard.deleteItem('task', '${task.id}')" class="delete">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
        <div class="item-meta">
          <span class="priority ${task.priority}">
            <i class="fas fa-flag"></i> ${task.priority}
          </span>
          <span class="category">
            <i class="fas fa-tag"></i> ${task.category}
          </span>
          ${task.dueDate ? `<span class="due-date">
            <i class="fas fa-calendar"></i> ${new Date(task.dueDate).toLocaleDateString()}
          </span>` : ''}
        </div>
        ${task.description ? `<div class="item-description">${task.description}</div>` : ''}
      </div>
    `).join('');
  }

  changePassword() {
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (!this.verifyPassword(currentPassword)) {
      this.showNotification('Current password is incorrect', 'error');
      return;
    }

    if (newPassword.length < 8) {
      this.showNotification('New password must be at least 8 characters', 'error');
      return;
    }

    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      this.showNotification('Password must contain uppercase, lowercase, number, and special character', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      this.showNotification('Passwords do not match', 'error');
      return;
    }

    // Hash the new password
    this.credentials.password = this.hashPassword(newPassword);
    
    // Force re-login for security
    this.logout('Password changed successfully. Please login again with your new password.');
    document.getElementById('password-form').reset();
    
    // Log password change
    console.log(`Password changed at ${new Date().toISOString()}`);
  }

  exportData() {
    const dataStr = JSON.stringify(this.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'admin-dashboard-data.json';
    link.click();
    this.showNotification('Data exported successfully!', 'success');
  }

  importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          this.data = { ...this.data, ...data };
          this.saveData();
          this.loadData();
          this.showNotification('Data imported successfully!', 'success');
        } catch (error) {
          this.showNotification('Invalid file format', 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  clearData() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      this.data = { tasks: [], academics: [], contacts: [], projects: [], settings: {} };
      this.saveData();
      this.loadData();
      this.showNotification('All data cleared!', 'success');
    }
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <i class="fas fa-${this.getNotificationIcon(type)}"></i>
      <span>${message}</span>
      <button onclick="this.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  getNotificationIcon(type) {
    switch (type) {
      case 'success': return 'check-circle';
      case 'error': return 'exclamation-circle';
      case 'warning': return 'exclamation-triangle';
      default: return 'info-circle';
    }
  }

  showEventDetails(event) {
    const type = event.extendedProps.type;
    const id = event.extendedProps.id;
    const item = this.data[type + 's'].find(item => item.id === id);
    
    if (item) {
      alert(`${item.title}\n\n${item.description || 'No description'}\n\nDue: ${new Date(item.dueDate).toLocaleDateString()}`);
    }
  }

  saveData() {
    try {
      // Validate and sanitize data before saving
      const validatedData = {
        tasks: this.validateData(this.data.tasks),
        academics: this.validateData(this.data.academics),
        contacts: this.validateData(this.data.contacts),
        projects: this.validateData(this.data.projects),
        settings: this.validateData(this.data.settings),
        portfolio: this.validateData(this.data.portfolio)
      };

      localStorage.setItem('admin_tasks', JSON.stringify(validatedData.tasks));
      localStorage.setItem('admin_academics', JSON.stringify(validatedData.academics));
      localStorage.setItem('admin_contacts', JSON.stringify(validatedData.contacts));
      localStorage.setItem('admin_projects', JSON.stringify(validatedData.projects));
      localStorage.setItem('admin_settings', JSON.stringify(validatedData.settings));
      localStorage.setItem('admin_portfolio', JSON.stringify(validatedData.portfolio));
      
      // Log data save
      console.log(`Data saved at ${new Date().toISOString()}`);
    } catch (error) {
      console.error('Error saving data:', error);
      this.showNotification('Error saving data. Please try again.', 'error');
    }
  }

  // Portfolio Settings Methods
  loadPortfolioSettings() {
    const portfolio = this.data.portfolio;
    
    // Load profile info
    document.getElementById('profile-name').value = portfolio.name || 'Hamood Thariq';
    document.getElementById('profile-title').value = portfolio.title || 'Software Engineering Student';
    document.getElementById('profile-subtitle').value = portfolio.subtitle || 'IoT & Robotics Enthusiast';
    document.getElementById('profile-about').value = portfolio.about || 'I\'m a passionate software engineering student at NIBM, focused on solving real-world problems through creative digital solutions. My interests span across mobile app development, IoT systems, and AI-driven robotics. I thrive on teamwork, continuous learning, and innovation.';
    
    // Load social links
    document.getElementById('social-github').value = portfolio.social?.github || '';
    document.getElementById('social-linkedin').value = portfolio.social?.linkedin || '';
    document.getElementById('social-twitter').value = portfolio.social?.twitter || '';
    document.getElementById('social-email').value = portfolio.social?.email || '';
    
    // Load statistics
    document.getElementById('stats-experience').value = portfolio.stats?.experience || 3;
    document.getElementById('stats-projects').value = portfolio.stats?.projects || 15;
    document.getElementById('stats-technologies').value = portfolio.stats?.technologies || 5;
    
    // Load contact information
    document.getElementById('contact-location').value = portfolio.contact?.location || '';
    document.getElementById('contact-email').value = portfolio.contact?.email || '';
    document.getElementById('contact-education').value = portfolio.contact?.education || '';
    
    // Load profile image
    const currentImg = document.getElementById('current-profile-img');
    if (portfolio.profileImage) {
      currentImg.src = portfolio.profileImage;
    } else {
      currentImg.src = '../assets/profile.jpg';
    }
    
    // Load skills
    this.loadSkills();
  }

  saveProfileInfo() {
    const profileData = {
      name: document.getElementById('profile-name').value,
      title: document.getElementById('profile-title').value,
      subtitle: document.getElementById('profile-subtitle').value,
      about: document.getElementById('profile-about').value
    };
    
    this.data.portfolio = { ...this.data.portfolio, ...profileData };
    this.saveData();
    this.showNotification('Profile information saved successfully!', 'success');
  }

  saveSocialLinks() {
    const socialData = {
      social: {
        github: document.getElementById('social-github').value,
        linkedin: document.getElementById('social-linkedin').value,
        twitter: document.getElementById('social-twitter').value,
        email: document.getElementById('social-email').value
      }
    };
    
    this.data.portfolio = { ...this.data.portfolio, ...socialData };
    this.saveData();
    this.showNotification('Social links saved successfully!', 'success');
  }

  saveStatistics() {
    const statsData = {
      stats: {
        experience: parseInt(document.getElementById('stats-experience').value) || 0,
        projects: parseInt(document.getElementById('stats-projects').value) || 0,
        technologies: parseInt(document.getElementById('stats-technologies').value) || 0
      }
    };
    
    this.data.portfolio = { ...this.data.portfolio, ...statsData };
    this.saveData();
    this.showNotification('Statistics saved successfully!', 'success');
  }

  saveContactInfo() {
    const contactData = {
      contact: {
        location: document.getElementById('contact-location').value,
        email: document.getElementById('contact-email').value,
        education: document.getElementById('contact-education').value
      }
    };
    
    this.data.portfolio = { ...this.data.portfolio, ...contactData };
    this.saveData();
    
    // Debug: Log the saved data
    console.log('Contact info saved:', this.data.portfolio.contact);
    
    this.showNotification('Contact information saved successfully!', 'success');
  }

  handleProfileImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      this.showNotification('Please select a valid image file.', 'error');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target.result;
      this.data.portfolio.profileImage = imageData;
      this.saveData();
      
      // Update both admin and portfolio images
      document.getElementById('current-profile-img').src = imageData;
      
      this.showNotification('Profile image updated successfully!', 'success');
    };
    
    reader.readAsDataURL(file);
  }

  resetProfileImage() {
    this.data.portfolio.profileImage = null;
    this.saveData();
    
    document.getElementById('current-profile-img').src = '../assets/profile.jpg';
    this.showNotification('Profile image reset to default!', 'success');
  }

  // Skills Management Methods
  loadSkills() {
    const skills = this.data.portfolio.skills || this.getDefaultSkills();
    
    // Load each category
    this.renderSkillCategory('programming', skills.programming || []);
    this.renderSkillCategory('web', skills.web || []);
    this.renderSkillCategory('mobile', skills.mobile || []);
    this.renderSkillCategory('database', skills.database || []);
    this.renderSkillCategory('iot', skills.iot || []);
  }

  getDefaultSkills() {
    return {
      programming: [
        { name: 'Python', level: 'Advanced' },
        { name: 'JavaScript', level: 'Intermediate' },
        { name: 'Java', level: 'Intermediate' },
        { name: 'C++', level: 'Beginner' }
      ],
      web: [
        { name: 'HTML/CSS', level: 'Advanced' },
        { name: 'React', level: 'Intermediate' },
        { name: 'Node.js', level: 'Intermediate' },
        { name: 'PHP', level: 'Beginner' }
      ],
      mobile: [
        { name: 'Flutter', level: 'Intermediate' },
        { name: 'React Native', level: 'Beginner' },
        { name: 'Android Development', level: 'Beginner' }
      ],
      database: [
        { name: 'MySQL', level: 'Intermediate' },
        { name: 'MongoDB', level: 'Beginner' },
        { name: 'Firebase', level: 'Intermediate' }
      ],
      iot: [
        { name: 'Arduino', level: 'Intermediate' },
        { name: 'ESP32', level: 'Intermediate' },
        { name: 'Raspberry Pi', level: 'Beginner' }
      ]
    };
  }

  renderSkillCategory(category, skills) {
    const container = document.getElementById(`${category}-skills`);
    if (!container) return;

    if (skills.length === 0) {
      container.innerHTML = '<div class="empty-skills">No skills added yet</div>';
      return;
    }

    container.innerHTML = skills.map((skill, index) => `
      <div class="skill-item" data-category="${category}" data-index="${index}">
        <span class="skill-name">${skill.name}</span>
        <span class="skill-level">${skill.level}</span>
        <button class="remove-skill" onclick="adminDashboard.removeSkill('${category}', ${index})">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `).join('');
  }

  addSkill(category) {
    const container = document.getElementById(`${category}-skills`);
    if (!container) return;

    // Remove empty state if present
    const emptyState = container.querySelector('.empty-skills');
    if (emptyState) {
      emptyState.remove();
    }

    // Create new skill item in edit mode
    const skillItem = document.createElement('div');
    skillItem.className = 'skill-item editing';
    skillItem.innerHTML = `
      <input type="text" placeholder="Skill name" class="skill-name-input" />
      <select class="skill-level-select">
        <option value="Beginner">Beginner</option>
        <option value="Intermediate">Intermediate</option>
        <option value="Advanced">Advanced</option>
        <option value="Expert">Expert</option>
      </select>
      <button class="save-skill" onclick="adminDashboard.saveSkill('${category}')">
        <i class="fas fa-check"></i>
      </button>
      <button class="cancel-skill" onclick="adminDashboard.cancelSkill('${category}')">
        <i class="fas fa-times"></i>
      </button>
    `;

    container.appendChild(skillItem);
    
    // Focus on the input
    const input = skillItem.querySelector('.skill-name-input');
    input.focus();
  }

  saveSkill(category) {
    const container = document.getElementById(`${category}-skills`);
    const editingItem = container.querySelector('.skill-item.editing');
    
    if (!editingItem) return;

    const nameInput = editingItem.querySelector('.skill-name-input');
    const levelSelect = editingItem.querySelector('.skill-level-select');
    
    const skillName = nameInput.value.trim();
    const skillLevel = levelSelect.value;

    if (!skillName) {
      this.showNotification('Please enter a skill name', 'error');
      return;
    }

    // Initialize skills if not exists
    if (!this.data.portfolio.skills) {
      this.data.portfolio.skills = {};
    }
    if (!this.data.portfolio.skills[category]) {
      this.data.portfolio.skills[category] = [];
    }

    // Add new skill
    this.data.portfolio.skills[category].push({
      name: skillName,
      level: skillLevel
    });

    this.saveData();
    this.loadSkills();
    this.showNotification('Skill added successfully!', 'success');
  }

  cancelSkill(category) {
    const container = document.getElementById(`${category}-skills`);
    const editingItem = container.querySelector('.skill-item.editing');
    
    if (editingItem) {
      editingItem.remove();
    }

    // Show empty state if no skills
    if (container.children.length === 0) {
      container.innerHTML = '<div class="empty-skills">No skills added yet</div>';
    }
  }

  removeSkill(category, index) {
    if (confirm('Are you sure you want to remove this skill?')) {
      this.data.portfolio.skills[category].splice(index, 1);
      this.saveData();
      this.loadSkills();
      this.showNotification('Skill removed successfully!', 'success');
    }
  }
}

// Global functions for HTML onclick handlers
function logout() {
  adminDashboard.logout();
}

function openModal(type) {
  adminDashboard.openModal(type);
}

function closeModal() {
  adminDashboard.closeModal();
}

function searchTasks() {
  adminDashboard.searchTasks();
}

function filterTasks() {
  adminDashboard.filterTasks();
}

function markAllRead() {
  adminDashboard.markAllRead();
}

function exportData() {
  adminDashboard.exportData();
}

function importData() {
  adminDashboard.importData();
}

function clearData() {
  adminDashboard.clearData();
}

function resetProfileImage() {
  adminDashboard.resetProfileImage();
}

function addSkill(category) {
  adminDashboard.addSkill(category);
}

// Initialize dashboard
let adminDashboard;
document.addEventListener('DOMContentLoaded', () => {
  adminDashboard = new AdminDashboard();
  adminDashboard.init();
});
