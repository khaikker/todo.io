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
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');

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

  // Forgot Password (rec-1)
  const handleForgotPassword = (email) => {
    setError('');
    const validation = validate({ email }, {
      email: ['required', 'email']
    });

    if (!validation.success) {
      setError(Object.values(validation.errors)[0]);
      return;
    }

    const user = db.users.find(u => u.email === email);
    if (!user) {
      setError('Email not found');
      return;
    }

    // Generate 4 digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setRecoveryCode(code);
    setRecoveryEmail(email);
    
    // In a real app, send email here. For now, we'll alert it.
    alert(`Your recovery code is: ${code}`);
    console.log(`Recovery code for ${email}: ${code}`);
    
    setScreen('verifyCode');
  };

  // Verify Code (rec-2)
  const handleVerifyCode = (code) => {
    setError('');
    if (code !== recoveryCode) {
      setError('Invalid code');
      return;
    }
    setScreen('resetPassword');
  };

  // Reset Password (rec-3)
  const handleResetPassword = (password, passwordConfirm) => {
    setError('');
    const validation = validate({ password, password_confirmation: passwordConfirm }, {
      password: ['required', 'minLength:8'],
      password_confirmation: ['required', 'match:password']
    });

    if (!validation.success) {
      setError(Object.values(validation.errors)[0]);
      return;
    }

    setDb(prev => ({
      ...prev,
      users: prev.users.map(u => 
        u.email === recoveryEmail 
          ? { ...u, password }
          : u
      )
    }));

    setSuccess('Password reset successfully. Please login.');
    setScreen('login');
    setRecoveryEmail('');
    setRecoveryCode('');
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-slate-100">
          <div className="text-center mb-8">
            <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Welcome Back</h1>
            <p className="text-slate-500 mt-2">Please sign in to continue</p>
          </div>

          {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-2 border border-red-100"><X className="w-4 h-4" />{error}</div>}
          {success && <div className="bg-green-50 text-green-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-2 border border-green-100"><CheckCircle className="w-4 h-4" />{success}</div>}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                placeholder="name@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                placeholder="••••••••"
              />
            </div>
          
            <button
              onClick={() => handleLogin(email, password)}
              className="w-full bg-indigo-600 text-white p-3.5 rounded-xl font-semibold hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-200 mt-2"
            >
              Sign In
            </button>

            <button
              onClick={() => { setScreen('forgotPassword'); setError(''); setSuccess(''); }}
              className="w-full text-slate-500 text-sm hover:text-indigo-600 transition mt-2"
            >
              Forgot Password?
            </button>
            
            <p className="text-center text-slate-500 text-sm mt-6">
              Don't have an account?{' '}
              <button
                onClick={() => setScreen('register')}
                className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline"
              >
                Create account
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Forgot Password Screen
  const ForgotPasswordScreen = () => {
    const [email, setEmail] = useState('');

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-slate-100">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800">Forgot Password</h1>
            <p className="text-slate-500 mt-2">Enter your email to receive a recovery code</p>
          </div>
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-2 border border-red-100"><X className="w-4 h-4" />{error}</div>}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                placeholder="name@example.com"
              />
            </div>
            
            <button
              onClick={() => handleForgotPassword(email)}
              className="w-full bg-indigo-600 text-white p-3.5 rounded-xl font-semibold hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-200 mt-2"
            >
              Send Code
            </button>
            
            <button
              onClick={() => { setScreen('login'); setError(''); setSuccess(''); }}
              className="w-full text-slate-500 p-2 rounded-lg text-sm hover:text-indigo-600 transition mt-2"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Verify Code Screen
  const VerifyCodeScreen = () => {
    const [code, setCode] = useState('');

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-slate-100">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800">Verify Code</h1>
            <p className="text-slate-500 mt-2">Enter the 4-digit code sent to {recoveryEmail}</p>
          </div>
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-2 border border-red-100"><X className="w-4 h-4" />{error}</div>}
          
          <div className="space-y-4">
            <div>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={4}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-center text-2xl tracking-[1em] font-mono"
                placeholder="0000"
              />
            </div>
            
            <button
              onClick={() => handleVerifyCode(code)}
              className="w-full bg-indigo-600 text-white p-3.5 rounded-xl font-semibold hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-200 mt-2"
            >
              Verify
            </button>
            
            <button
              onClick={() => { setScreen('forgotPassword'); setError(''); }}
              className="w-full text-indigo-600 p-2 rounded-lg text-sm hover:underline transition mt-2"
            >
              Resend Code
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Reset Password Screen
  const ResetPasswordScreen = () => {
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-slate-100">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800">Reset Password</h1>
            <p className="text-slate-500 mt-2">Create a new password for your account</p>
          </div>
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-2 border border-red-100"><X className="w-4 h-4" />{error}</div>}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                placeholder="Min 8 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                placeholder="Repeat password"
              />
            </div>
            
            <button
              onClick={() => handleResetPassword(password, passwordConfirm)}
              className="w-full bg-indigo-600 text-white p-3.5 rounded-xl font-semibold hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-200 mt-2"
            >
              Reset Password
            </button>
          </div>
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-slate-100">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800">Create Account</h1>
            <p className="text-slate-500 mt-2">Start organizing your tasks today</p>
          </div>

          {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-2 border border-red-100"><X className="w-4 h-4" />{error}</div>}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                placeholder="name@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                placeholder="Min 8 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                placeholder="Repeat password"
              />
            </div>
          
            <button
              onClick={() => handleRegister(email, password, passwordConfirm)}
              className="w-full bg-indigo-600 text-white p-3.5 rounded-xl font-semibold hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-200 mt-2"
            >
              Create Account
            </button>
            
            <p className="text-center text-slate-500 text-sm mt-6">
              Already have an account?{' '}
              <button
                onClick={() => { setScreen('login'); setError(''); }}
                className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline"
              >
                Sign in
              </button>
            </p>
          </div>
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
      <div className="min-h-screen bg-slate-50">
        <nav className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" /> Profile
            </h1>
            <button 
              onClick={() => setScreen('list')} 
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Back to Tasks
            </button>
          </div>
        </nav>
        
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-indigo-50 p-8 text-center border-b border-indigo-100">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-indigo-600">
                <User className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">{currentUser.email}</h2>
              <p className="text-slate-500 text-sm">Member since {new Date(currentUser.createdAt).toLocaleDateString()}</p>
            </div>

            <div className="p-8">
              {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-2 border border-red-100"><X className="w-4 h-4" />{error}</div>}
              {success && <div className="bg-green-50 text-green-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-2 border border-green-100"><CheckCircle className="w-4 h-4" />{success}</div>}
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl disabled:opacity-70 disabled:cursor-not-allowed focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                  <input
                    type={isEditing ? "text" : "password"}
                    value={isEditing ? password : "******"}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={!isEditing}
                    placeholder={isEditing ? "Enter new password to change" : ""}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl disabled:opacity-70 disabled:cursor-not-allowed focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  />
                </div>
                
                <div className="pt-4 flex gap-3">
                  {!isEditing ? (
                    <button
                      onClick={() => { setIsEditing(true); setError(''); setSuccess(''); }}
                      className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 w-full sm:w-auto"
                    >
                      <Edit2 className="w-4 h-4" /> Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          handleUpdateProfile(email, password);
                          if (!error) setIsEditing(false);
                        }}
                        className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex-1"
                      >
                        <Save className="w-4 h-4" /> Save Changes
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEmail(currentUser.email);
                          setPassword('');
                          setError('');
                          setSuccess('');
                        }}
                        className="flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 px-6 py-3 rounded-xl font-medium hover:bg-slate-50 transition-all flex-1"
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
      </div>
    );
  };

  // Task List Screen (list-1 + search-1)
  const TaskListScreen = () => {
    const tasks = getTasks();

    return (
      <div className="min-h-screen bg-slate-50">
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-20 bg-opacity-90 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">TEEMO</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setScreen('profile')}
                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                title="Profile"
              >
                <User className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </nav>
        
        <div className="max-w-5xl mx-auto p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1 group">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors w-5 h-5" />
              <input
                type="text"
                placeholder="Search your tasks..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all outline-none"
              />
            </div>
            <button
              onClick={() => setScreen('new')}
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-200 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" /> New Task
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="bg-slate-100 p-6 rounded-full mb-4">
                <CheckCircle className="w-12 h-12 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700">No tasks found</h3>
              <p className="text-slate-500 max-w-xs mx-auto mt-1">
                {searchKeyword ? 'Try adjusting your search terms' : 'Get started by creating your first task'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className={`group bg-white rounded-xl p-5 flex items-start gap-4 border transition-all duration-200 ${
                    task.completed 
                      ? 'border-slate-100 bg-slate-50/50' 
                      : 'border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-100'
                  }`}
                >
                  <button
                    onClick={() => handleCompleteTask(task.id)}
                    className={`mt-0.5 flex-shrink-0 transition-colors ${
                      task.completed ? 'text-green-500' : 'text-slate-300 hover:text-indigo-500'
                    }`}
                  >
                    {task.completed ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Circle className="w-6 h-6" />
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-base font-semibold truncate pr-2 ${
                      task.completed ? 'line-through text-slate-400' : 'text-slate-800'
                    }`}>
                      {task.title}
                    </h3>
                    {task.content && (
                      <p className={`text-sm mt-1 line-clamp-2 ${
                        task.completed ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        {task.content}
                      </p>
                    )}
                    {task.completionTime && (
                      <div className={`flex items-center gap-1.5 mt-2.5 text-xs font-medium ${
                        task.completed ? 'text-slate-400' : 'text-indigo-600 bg-indigo-50 inline-flex px-2 py-1 rounded-md'
                      }`}>
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(task.completionTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Delete task"
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
      <div className="min-h-screen bg-slate-50">
        <nav className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto flex justify-between items-center">
            <h1 className="text-lg font-bold text-slate-800">Create New Task</h1>
            <button 
              onClick={() => { setScreen('list'); setError(''); }} 
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </nav>
        
        <div className="max-w-3xl mx-auto p-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-2 border border-red-100"><X className="w-4 h-4" />{error}</div>}
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  maxLength={50}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-lg"
                  autoFocus
                />
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-slate-400">{title.length}/50</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Add details about this task..."
                  rows={5}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Due Date & Time</label>
                <input
                  type="datetime-local"
                  value={completionTime}
                  onChange={(e) => setCompletionTime(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                />
              </div>
              
              <div className="pt-4">
                <button
                  onClick={() => handleAddTask(title, content, completionTime)}
                  className="w-full bg-indigo-600 text-white p-4 rounded-xl font-semibold hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Create Task
                </button>
              </div>
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
      {screen === 'forgotPassword' && <ForgotPasswordScreen />}
      {screen === 'verifyCode' && <VerifyCodeScreen />}
      {screen === 'resetPassword' && <ResetPasswordScreen />}
      {screen === 'register' && <RegisterScreen />}
      {screen === 'profile' && currentUser && <ProfileScreen />}
      {screen === 'list' && currentUser && <TaskListScreen />}
      {screen === 'new' && currentUser && <NewTaskScreen />}
    </>
  );
};

export default App;
