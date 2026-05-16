'use client';

import React, { useState, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import type { AppNotification, NotificationContextType, NotificationType } from '@/types';

export const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeToasts, setActiveToasts] = useState<AppNotification[]>([]);

  const addNotification = (title: string, message: string, type: NotificationType = 'info') => {
    const newNotif: AppNotification = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      message,
      type,
      read: false,
      createdAt: new Date(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
    setActiveToasts((prev) => [...prev, newNotif]);
    setTimeout(() => {
      setActiveToasts((prev) => prev.filter((t) => t.id !== newNotif.id));
    }, 5000);
  };

  const markAsRead = (id: string) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  const markAllAsRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const clearAll = () => setNotifications([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, markAsRead, markAllAsRead, clearAll, unreadCount }}
    >
      {children}
      <div className="fixed bottom-4 end-4 z-[999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {activeToasts.map((toast) => (
            <motion.div
              key={`toast-${toast.id}`}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="pointer-events-auto w-80 bg-white rounded-xl shadow-xl shadow-slate-900/10 border border-slate-200 p-4 flex gap-3 items-start"
            >
              {toast.type === 'success' && <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={20} />}
              {toast.type === 'error' && <XCircle className="text-red-500 shrink-0 mt-0.5" size={20} />}
              {toast.type === 'info' && <Info className="text-blue-500 shrink-0 mt-0.5" size={20} />}
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-900 leading-none mb-1">{toast.title}</h4>
                <p className="text-xs text-slate-500 leading-snug">{toast.message}</p>
              </div>
              <button
                onClick={() => setActiveToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}
