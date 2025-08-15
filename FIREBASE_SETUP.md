# Firebase Setup Guide for Portfolio Database

This guide will help you set up Firebase to enable cloud-based data storage for your portfolio, making it accessible from any device.

## Prerequisites

- A Google account
- Basic understanding of web development

## Step 1: Create Firebase Project

1. **Go to [Firebase Console](https://console.firebase.google.com/)**
2. **Click "Create a project"**
3. **Enter project name**: `your-portfolio` (or any name you prefer)
4. **Enable Google Analytics** (optional but recommended)
5. **Click "Create project"**

## Step 2: Enable Authentication

1. **In Firebase Console, go to "Authentication"**
2. **Click "Get started"**
3. **Go to "Sign-in method" tab**
4. **Enable "Email/Password"**
5. **Click "Save"**

## Step 3: Create Admin User

1. **In Authentication, go to "Users" tab**
2. **Click "Add user"**
3. **Enter your email and password** (this will be your admin login)
4. **Click "Add user"**

## Step 4: Enable Firestore Database

1. **Go to "Firestore Database"**
2. **Click "Create database"**
3. **Choose "Start in test mode"** (for development)
4. **Select a location** (choose closest to your users)
5. **Click "Done"**

## Step 5: Enable Storage

1. **Go to "Storage"**
2. **Click "Get started"**
3. **Choose "Start in test mode"**
4. **Select a location** (same as Firestore)
5. **Click "Done"**

## Step 6: Get Firebase Configuration

1. **Go to "Project settings"** (gear icon)
2. **Scroll down to "Your apps"**
3. **Click "Add app"** and select "Web" (</>)
4. **Enter app nickname**: `portfolio-web`
5. **Click "Register app"**
6. **Copy the configuration object**

## Step 7: Update Configuration Files

### Update `firebase-config.js`:

Replace the placeholder config with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
};
```

## Step 8: Update HTML Files

### Update `index.html`:

Add Firebase SDK before your scripts:

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-storage-compat.js"></script>

<!-- Firebase Config -->
<script src="firebase-config.js"></script>

<!-- Your Scripts -->
<script src="script/script-firebase.js" defer></script>
```

### Update `html/admin.html`:

Add Firebase SDK and update script references:

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-storage-compat.js"></script>

<!-- Firebase Config -->
<script src="../firebase-config.js"></script>

<!-- Your Scripts -->
<script src="../script/admin-firebase.js" defer></script>
```

## Step 9: Set Up Firestore Security Rules

In Firebase Console, go to Firestore Database → Rules and update with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Public portfolio data (read-only for everyone)
    match /public/portfolio/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Step 10: Set Up Storage Security Rules

In Firebase Console, go to Storage → Rules and update with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can only access their own files
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Step 11: Test the Setup

1. **Open your portfolio in a browser**
2. **Go to the admin dashboard**
3. **Login with your Firebase credentials**
4. **Try adding some data**
5. **Check if it appears on the public portfolio**

## Database Structure

Your Firebase database will have this structure:

```
users/
  {userId}/
    tasks/
      {taskId}/
        title: string
        description: string
        priority: string
        deadline: timestamp
        status: string
        createdAt: timestamp
        updatedAt: timestamp

    academics/
      {academicId}/
        title: string
        description: string
        deadline: timestamp
        priority: string
        status: string
        createdAt: timestamp
        updatedAt: timestamp

    contacts/
      {contactId}/
        name: string
        email: string
        message: string
        timestamp: timestamp
        read: boolean

    projects/
      {projectId}/
        title: string
        description: string
        technologies: string
        url: string
        image: string
        status: string
        createdAt: timestamp
        updatedAt: timestamp

    settings/
      main/
        // User settings

    portfolio/
      main/
        name: string
        title: string
        subtitle: string
        about: string
        profileImage: string
        social: object
        stats: object
        skills: object
        contact: object

public/
  portfolio/
    // Public portfolio data (same structure as user portfolio)
    contacts/
      {contactId}/
        name: string
        email: string
        message: string
        timestamp: timestamp
        read: boolean
```

## Benefits of This Setup

✅ **Cloud-based**: Access from any device
✅ **Real-time**: Changes sync instantly
✅ **Secure**: Authentication and authorization
✅ **Scalable**: Handles growth easily
✅ **Free tier**: Generous limits for personal use
✅ **Backup**: Automatic data backup
✅ **Performance**: Fast global CDN

## Troubleshooting

### Common Issues:

1. **"Firebase not initialized"**

   - Check if Firebase SDK is loaded before your scripts
   - Verify configuration object is correct

2. **"Permission denied"**

   - Check Firestore security rules
   - Ensure user is authenticated

3. **"Storage permission denied"**

   - Check Storage security rules
   - Verify user authentication

4. **"Network error"**
   - Check internet connection
   - Verify Firebase project is active

### Getting Help:

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Support](https://firebase.google.com/support)

## Next Steps

After setup, you can:

1. **Customize the database structure**
2. **Add more authentication methods**
3. **Implement real-time features**
4. **Add analytics and monitoring**
5. **Set up automated backups**

Your portfolio is now cloud-powered! 🚀
