# Personal Portfolio & Admin Dashboard

A modern, responsive personal portfolio website with an integrated admin dashboard for content management.

## Features

### Public Portfolio

- **Modern Design**: Clean, professional UI with smooth animations
- **Responsive Layout**: Works perfectly on all devices
- **Dynamic Content**: Projects, skills, and information loaded from admin dashboard
- **Contact Form**: Integrated contact system with admin notifications
- **Profile Management**: Editable profile information and social links

### Admin Dashboard

- **Task Management**: Create, edit, and track tasks with deadlines
- **Academic Tracking**: Manage academic deadlines and assignments
- **Contact Management**: View and manage contact form submissions
- **Project Portfolio**: Add, edit, and manage portfolio projects
- **Portfolio Settings**: Update profile info, skills, social links, and statistics
- **Interactive Calendar**: Visual calendar with upcoming deadlines
- **Security Features**: Authentication, session management, and security controls

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Modern CSS with CSS Variables, Flexbox, Grid
- **Icons**: Font Awesome
- **Calendar**: FullCalendar.js
- **Storage**: Local Storage for data persistence
- **Security**: Client-side authentication with session management

## File Structure

```
portfolio/
├── html/
│   ├── index.html          # Public portfolio page
│   └── admin.html          # Admin dashboard
├── css/
│   ├── style.css           # Portfolio styles
│   └── admin.css           # Admin dashboard styles
├── script/
│   ├── script.js           # Portfolio functionality
│   └── admin.js            # Admin dashboard functionality
├── assets/                 # Images and media files
└── SECURITY.md            # Security documentation
```

## Getting Started

1. **Clone or download** this repository
2. **Open** `html/index.html` in your browser to view the portfolio
3. **Open** `html/admin.html` to access the admin dashboard
4. **Default admin credentials**:
   - Username: `admin`
   - Password: `admin123`

## Admin Dashboard Features

### Overview

- Dashboard statistics
- Interactive calendar
- Upcoming deadlines
- Quick actions

### Task Management

- Add, edit, delete tasks
- Set priorities and deadlines
- Mark tasks as complete
- Search and filter tasks

### Academic Management

- Track assignments and deadlines
- Manage academic projects
- Set reminders and priorities

### Contact Management

- View contact form submissions
- Mark messages as read/unread
- Delete old messages

### Portfolio Settings

- Update profile information
- Manage profile picture
- Edit social media links
- Update statistics
- Manage skills by category
- Update contact information

### Security Settings

- Change admin password
- View security status
- Session management
- Security controls

## Security Features

- **Authentication**: Username/password login
- **Session Management**: Secure session tokens with expiration
- **Inactivity Timeout**: Automatic logout after inactivity
- **Login Attempt Limiting**: Account lockout after failed attempts
- **Input Sanitization**: Protection against basic attacks
- **Browser Security**: Prevention of developer tools access

## Customization

### Adding Projects

1. Login to admin dashboard
2. Go to "Portfolio Settings" tab
3. Add new projects with title, description, technologies
4. Optionally add project URL and images
5. Projects automatically appear on the public portfolio

### Updating Profile

1. Login to admin dashboard
2. Go to "Portfolio Settings" tab
3. Update profile information, social links, skills
4. Upload new profile picture
5. Changes are immediately reflected on the public portfolio

### Styling

- Modify `css/style.css` for portfolio appearance
- Modify `css/admin.css` for admin dashboard appearance
- CSS variables are defined at the top of each file for easy customization

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Internet Explorer 11+

## Local Development

To run locally:

```bash
# Using Python (if installed)
python -m http.server 8000

# Using Node.js (if installed)
npx serve .

# Using PHP (if installed)
php -S localhost:8000
```

Then visit `http://localhost:8000/html/`

## Deployment

This is a static website that can be deployed to any web hosting service:

- **GitHub Pages**: Free hosting for static sites
- **Netlify**: Drag and drop deployment
- **Vercel**: Modern deployment platform
- **Firebase Hosting**: Google's hosting service
- **Traditional Web Hosting**: Any web hosting provider

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues or questions, please check the documentation or create an issue in the repository.
