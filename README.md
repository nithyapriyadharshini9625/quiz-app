# Quiz App

A full-stack quiz application built with React and Node.js, featuring user authentication, quiz management, and result tracking.

## Features

- 🔐 User authentication (Email/Password and Google Sign-In)
- 👥 Role-based access control (Admin, Manager, User)
- 📝 Quiz management for multiple subjects (HTML, CSS, JavaScript, React, Node.js, MongoDB)
- 📊 Results tracking and history
- 🎯 Detailed mistake analysis
- 📧 Email notifications (OTP, password reset)
- 🎨 Modern and responsive UI

## Tech Stack

### Frontend
- React
- React Router
- Axios
- Context API

### Backend
- Node.js
- Express
- MongoDB
- JWT Authentication
- Nodemailer

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/quiz-app.git
cd quiz-app
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

4. Set up environment variables:

**Backend** (`backend/.env`):
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

**Frontend** (`frontend/.env`):
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

5. Start the backend server:
```bash
cd backend
npm start
```

6. Start the frontend (in a new terminal):
```bash
cd frontend
npm start
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
quiz-app/
├── backend/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Authentication & permissions
│   ├── utils/           # Utility functions
│   └── server.js        # Express server
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── context/     # Context providers
│   │   └── App.js       # Main app component
│   └── public/         # Static files
└── README.md
```

## Usage

### Default Admin Account
After first setup, create an admin account through registration or directly in the database.

### User Roles
- **Admin**: Full access to all features
- **Manager**: Can manage questions and view results
- **User**: Can take quizzes and view own results

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Contact

For questions or support, please open an issue on GitHub.
