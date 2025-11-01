import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Circle, Trash2, Plus, Search, LogOut, User, Edit2, Save, X } from 'lucide-react';

// Validator (com-1)
const validate = (data, rules) => {
  const errors = {};
  
  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field];
    
    for (const rule of fieldRules) {
      if (rule === 'required' && (!value || value.trim() === '')) {
        errors[field] = 'Required field';
        break;
      }
      if (rule === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors[field] = 'Invalid email format';
        break;
      }
      if (rule.startsWith('minLength:')) {
        const min = parseInt(rule.split(':')[1]);
        if (value && value.length < min) {
          errors[field] = `Must be at least ${min} characters`;
          break;
        }
      }
      if (rule.startsWith('maxLength:')) {
        const max = parseInt(rule.split(':')[1]);
        if (value && value.length > max) {
          errors[field] = `Must be ${max} characters or less`;
          break;
        }
      }
      if (rule.startsWith('match:')) {
        const matchField = rule.split(':')[1];
        if (value !== data[matchField]) {
          errors[field] = 'Passwords do not match';
          break;
        }
      }
    }
  }
  
  return { success: Object.keys(errors).length === 0, errors };
};

// Mock Database
const initDB = () => {
  const stored = localStorage.getItem('teemo_db');
  if (stored) return JSON.parse(stored);
  return { users: [], tasks: [], nextUserId: 1, nextTaskId: 1 };
};

const saveDB = (db) => {
  localStorage.setItem('teemo_db', JSON.stringify(db));
};

const App = () => {
  const [db, setDb] = useState(initDB());
  const [currentUser, setCurrentUser] = useState(null);
  const [screen, setScreen] = useState('login');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    saveDB(db);
  }, [db]);

  // Login (log-1)
  const handleLogin = (email, password) => {
    setError('');
    const validation = validate({ email, password }, {
      email: ['required', 'email'],
      password: ['required']
    });
    
    if (!validation.success) {
      setError(Object.values(validation.errors)[0]);
      return;
    }

    const user = db.users.find(u => u.email === email && u.password === password);
    if (!user) {
      setError('Email or password incorrect');
      return;
    }

    setCurrentUser(user);
    setScreen('list');
  };

  // Register (reg-1)
  const handleRegister = (email, password, passwordConfirm) => {
    setError('');
    const validation = validate({ email, password, password_confirmation: passwordConfirm }, {
      email: ['required', 'email'],
      password: ['required', 'minLength:8'],
      password_confirmation: ['required', 'match:password']
    });

    if (!validation.success) {
      setError(Object.values(validation.errors)[0]);
      return;
    }

    if (db.users.find(u => u.email === email)) {
      setError('This email is already in use');
      return;
    }

    const newUser = {
      id: db.nextUserId,
      email,
      password,
      createdAt: new Date().toISOString()
    };

    setDb(prev => ({
      ...prev,
      users: [...prev.users, newUser],
      nextUserId: prev.nextUserId + 1
    }));

    setCurrentUser(newUser);
    setScreen('list');
  };

  // Update Profile (pro2)
  const handleUpdateProfile = (email, password) => {
    setError('');
    setSuccess('');
    const validation = validate({ email, password }, {
      email: ['required', 'email'],
      password: ['minLength:8']
    });

    if (!validation.success) {
      setError(Object.values(validation.errors)[0]);
      return;
    }

    if (db.users.find(u => u.email === email && u.id !== currentUser.id)) {
      setError('Email already in use');
      return;
    }

    setDb(prev => ({
      ...prev,
      users: prev.users.map(u => 
        u.id === currentUser.id 
          ? { ...u, email, password: password || u.password }
          : u
      )
    }));

    setCurrentUser(prev => ({ ...prev, email, password: password || prev.password }));
    setSuccess('Profile updated successfully');
  };

  // Add Task (new-1)
  const handleAddTask = (title, content, completionTime) => {
    setError('');
    const validation = validate({ title }, {
      title: ['required', 'maxLength:50']
    });

    if (!validation.success) {
      setError(Object.values(validation.errors)[0]);
      return;
    }

    const newTask = {
      id: db.nextTaskId,
      userId: currentUser.id,
      title,
      content,
      completionTime,
      completed: false,
      createdAt: new Date().toISOString()
    };

    setDb(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask],
      nextTaskId: prev.nextTaskId + 1
    }));

    setScreen('list');
  };

  // Complete Task (list-2)
  const handleCompleteTask = (taskId) => {
    setDb(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => 
        t.id === taskId && t.userId === currentUser.id
          ? { ...t, completed: !t.completed }
          : t
      )
    }));
  };

  // Delete Task (list-3)
  const handleDeleteTask = (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    setDb(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => !(t.id === taskId && t.userId === currentUser.id))
    }));
  };

  // Logout (com-2)
  const handleLogout = () => {
    setCurrentUser(null);
    setScreen('login');
    setSearchKeyword('');
    setError('');
    setSuccess('');
  };

  // Get filtered tasks (list-1 + search-1)
  const getTasks = () => {
    let tasks = db.tasks.filter(t => t.userId === currentUser?.id);
    
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      tasks = tasks.filter(t => 
        t.title.toLowerCase().includes(keyword) || 
        t.content?.toLowerCase().includes(keyword)
      );
    }
    
    return tasks.sort((a, b) => 
      new Date(a.completionTime || a.createdAt) - new Date(b.completionTime || b.createdAt)
    );
  };

  // Login Screen
  const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">TEEMO Login</h1>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
          
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <button
            onClick={() => handleLogin(email, password)}
            className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition mb-3"
          >
            Login
          </button>
          
          <button
            onClick={() => setScreen('register')}
            className="w-full text-blue-600 p-3 rounded-lg font-semibold hover:bg-blue-50 transition"
          >
            Create New Account
          </button>
        </div>
      </div>
    );
  };

  // Register Screen
  const RegisterScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Create Account</h1>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
          
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <input
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          
          <button
            onClick={() => handleRegister(email, password, passwordConfirm)}
            className="w-full bg-green-600 text-white p-3 rounded-lg font-semibold hover:bg-green-700 transition mb-3"
          >
            Register
          </button>
          
          <button
            onClick={() => { setScreen('login'); setError(''); }}
            className="w-full text-green-600 p-3 rounded-lg font-semibold hover:bg-green-50 transition"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  };

  // Profile Screen (pro1 + pro2)
  const ProfileScreen = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [email, setEmail] = useState(currentUser.email);
    const [password, setPassword] = useState('');

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Profile</h1>
          <button onClick={() => setScreen('list')} className="text-blue-600 hover:text-blue-800">
            Back to Tasks
          </button>
        </nav>
        
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
            {success && <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm">{success}</div>}
            
            <div className="flex items-center gap-3 mb-6">
              <User className="w-12 h-12 text-gray-400" />
              <div>
                <h2 className="text-2xl font-bold text-gray-800">User Information</h2>
                <p className="text-sm text-gray-500">Manage your account details</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isEditing}
                  className="w-full p-3 border border-gray-300 rounded-lg disabled:bg-gray-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type={isEditing ? "text" : "password"}
                  value={isEditing ? password : "******"}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!isEditing}
                  placeholder={isEditing ? "Enter new password" : ""}
                  className="w-full p-3 border border-gray-300 rounded-lg disabled:bg-gray-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                {!isEditing ? (
                  <button
                    onClick={() => { setIsEditing(true); setError(''); setSuccess(''); }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        handleUpdateProfile(email, password);
                        if (!error) setIsEditing(false);
                      }}
                      className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
                    >
                      <Save className="w-4 h-4" /> Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEmail(currentUser.email);
                        setPassword('');
                        setError('');
                        setSuccess('');
                      }}
                      className="flex items-center gap-2 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Task List Screen (list-1 + search-1)
  const TaskListScreen = () => {
    const tasks = getTasks();

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm p-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">TEEMO Tasks</h1>
            <div className="flex gap-3">
              <button
                onClick={() => setScreen('profile')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100"
              >
                <User className="w-5 h-5" /> Profile
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-600 hover:text-red-800 px-4 py-2 rounded-lg hover:bg-red-50"
              >
                <LogOut className="w-5 h-5" /> Logout
              </button>
            </div>
          </div>
        </nav>
        
        <div className="max-w-6xl mx-auto p-6">
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => setScreen('new')}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
              >
                <Plus className="w-5 h-5" /> New Task
              </button>
            </div>
          </div>

          {tasks.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <p className="text-gray-400 text-lg">
                {searchKeyword ? 'No matching tasks found' : 'No tasks yet...'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className="bg-white rounded-xl shadow-md p-5 flex items-start gap-4 hover:shadow-lg transition"
                >
                  <button
                    onClick={() => handleCompleteTask(task.id)}
                    className="mt-1 flex-shrink-0"
                  >
                    {task.completed ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-300 hover:text-blue-500" />
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {task.title}
                    </h3>
                    {task.content && (
                      <p className={`text-sm mt-1 ${task.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                        {task.content}
                      </p>
                    )}
                    {task.completionTime && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {new Date(task.completionTime).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition flex-shrink-0"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // New Task Screen (new-1)
  const NewTaskScreen = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [completionTime, setCompletionTime] = useState('');

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm p-4">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">New Task</h1>
            <button onClick={() => { setScreen('list'); setError(''); }} className="text-blue-600 hover:text-blue-800">
              Back to List
            </button>
          </div>
        </nav>
        
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter task title (max 50 characters)"
                  maxLength={50}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">{title.length}/50 characters</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter task details (optional)"
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Completion Time</label>
                <input
                  type="datetime-local"
                  value={completionTime}
                  onChange={(e) => setCompletionTime(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <button
                onClick={() => handleAddTask(title, content, completionTime)}
                className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render current screen
  return (
    <>
      {screen === 'login' && <LoginScreen />}
      {screen === 'register' && <RegisterScreen />}
      {screen === 'profile' && currentUser && <ProfileScreen />}
      {screen === 'list' && currentUser && <TaskListScreen />}
      {screen === 'new' && currentUser && <NewTaskScreen />}
    </>
  );
};

export default App;