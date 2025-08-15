# Admin Portal Security

## 🔐 Authentication System

Your admin portal now includes a secure authentication system to protect your personal management dashboard.

### Default Credentials

- **Username:** `admin`
- **Password:** `admin123`

### ⚠️ Important Security Steps

1. **Change Default Password Immediately**

   - Open `portfolio/script/admin.js`
   - Find line with `password: 'admin123'`
   - Change `'admin123'` to your desired password
   - Example: `password: 'YourSecurePassword123!'`

2. **Choose a Strong Password**
   - Use at least 8 characters
   - Include uppercase and lowercase letters
   - Include numbers and special characters
   - Avoid common words or patterns

### 🔒 Security Features

#### Session Management

- **Session Duration:** 24 hours (or 30 days with "Remember Me")
- **Auto-logout:** 30 minutes of inactivity
- **Secure Storage:** Session data stored in browser localStorage

#### Access Control

- All dashboard functions require authentication
- Automatic redirect to login if session expires
- Protection against unauthorized access

#### Security Measures

- Password visibility toggle
- Login error handling
- Session token generation
- Inactivity monitoring

### 🛡️ Additional Security Recommendations

1. **Regular Password Changes**

   - Change your password every 3-6 months
   - Use unique passwords for different services

2. **Browser Security**

   - Use a private/incognito window for admin access
   - Clear browser data regularly
   - Don't share your browser session

3. **Network Security**

   - Use HTTPS when hosting online
   - Avoid accessing admin panel on public networks
   - Consider using a VPN for additional security

4. **Backup Security**
   - Keep exported data files secure
   - Don't store credentials in plain text files
   - Use encrypted storage for sensitive data

### 🔧 Customization

#### Change Username

```javascript
// In admin.js, line ~15
this.credentials = {
  username: "your_username", // Change this
  password: "your_password", // Change this
};
```

#### Modify Session Duration

```javascript
// In admin.js, createSession method
const expiresAt = rememberMe
  ? now + 30 * 24 * 60 * 60 * 1000 // 30 days
  : now + 24 * 60 * 60 * 1000; // 1 day
```

#### Adjust Inactivity Timeout

```javascript
// In admin.js, setupEventListeners method
inactivityTimer = setTimeout(() => {
  // Auto-logout logic
}, 30 * 60 * 1000); // 30 minutes - change this value
```

### 🚨 Security Warnings

- **Client-side Security:** This is a client-side authentication system suitable for personal use
- **Not for Production:** For business or public use, implement server-side authentication
- **Data Protection:** Sensitive data is stored in browser localStorage
- **Browser Dependencies:** Security depends on browser security features

### 📞 Support

If you need help with security setup or encounter issues:

1. Check browser console for errors
2. Clear browser data and try again
3. Ensure JavaScript is enabled
4. Verify file paths are correct

---

**Remember:** Security is your responsibility. Keep your credentials safe and change them regularly!
