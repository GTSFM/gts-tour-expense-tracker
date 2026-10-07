import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, NotificationItem } from '../types';

interface AuthContextType {
  currentUser: User | null;
  allUsers: User[];
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  switchUser: (userId: string) => Promise<void>;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load initial data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.users && data.users.length > 0) {
        setAllUsers(data.users);

        // Check if there was a saved user in localStorage
        const savedUserId = localStorage.getItem('gts_active_user_id');
        let matched = data.users.find((u: User) => u.id === savedUserId);
        if (!matched) {
          // If no user saved in localStorage, find first registered employee, or null so LoginModal opens
          const firstEmployee = data.users.find((u: User) => u.role === 'EMPLOYEE');
          matched = firstEmployee || null;
        }
        if (matched) {
          setCurrentUser(matched);
          localStorage.setItem('gts_active_user_id', matched.id);
          fetchNotifications(matched.id);
        } else {
          setCurrentUser(null);
          localStorage.removeItem('gts_active_user_id');
        }
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotifications = async (userId: string) => {
    try {
      const res = await fetch('/api/notifications', {
        headers: { 'x-user-id': userId }
      });
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const switchUser = async (userId: string) => {
    try {
      const res = await fetch('/api/auth/switch-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('gts_active_user_id', data.user.id);
        await fetchNotifications(data.user.id);
      }
    } catch (err) {
      console.error('Failed to switch user:', err);
    }
  };

  const login = async (identifier: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('gts_active_user_id', data.user.id);
        await fetchNotifications(data.user.id);
        return { success: true };
      }
      return { success: false, error: data.error || 'Login failed. Please check credentials.' };
    } catch (err: any) {
      console.error('Login error:', err);
      return { success: false, error: err.message || 'Connection error. Please try again.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('gts_active_user_id');
    setCurrentUser(null);
  };

  const markNotificationRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      if (!currentUser) return;
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: { 'x-user-id': currentUser.id }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        notifications,
        unreadCount,
        isLoading,
        switchUser,
        login,
        logout,
        markNotificationRead,
        markAllNotificationsRead,
        refreshUserData: fetchData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
