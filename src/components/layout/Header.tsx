'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Search, Globe, CheckCircle2, XCircle, Info, Trash2, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from './NotificationProvider';
import { useSidebar } from './SidebarContext';

type Props = {
  userName?: string;
  userInitials?: string;
};

export function Header({ userName = 'User', userInitials = 'U' }: Props) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { toggle } = useSidebar();
  const { unreadCount, notifications, markAsRead, markAllAsRead, clearAll } = useNotifications();

  return (
    <header className="h-16 bg-surface-container-lowest border-b border-slate-100 sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg lg:hidden"
        >
          <Menu size={20} />
        </button>

        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg w-64">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search resources..."
            className="bg-transparent border-none text-sm outline-none w-full placeholder:text-slate-400"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 font-mono text-[10px] font-medium text-slate-400 bg-white border border-slate-200 rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg relative transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 end-1 w-4 h-4 text-[9px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {isNotificationsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
                  className="absolute end-0 top-full mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-200 z-50 overflow-hidden"
                >
                  <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      Notifications
                      {unreadCount > 0 && (
                        <span className="bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-3">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                        >
                          Mark all read
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          onClick={clearAll}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                          title="Clear all"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-[60vh] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-500">
                        <Bell className="mx-auto text-slate-300 mb-2" size={24} />
                        <p className="text-sm">No notifications yet</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={cn(
                              'p-4 transition-colors hover:bg-slate-50 flex gap-3 relative group',
                              !notif.read && 'bg-blue-50/30'
                            )}
                          >
                            <div className="shrink-0 mt-0.5">
                              {notif.type === 'success' && <CheckCircle2 className="text-green-500" size={18} />}
                              {notif.type === 'error' && <XCircle className="text-red-500" size={18} />}
                              {notif.type === 'info' && <Info className="text-blue-500" size={18} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-slate-900 leading-snug">{notif.title}</h4>
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
                              <p className="text-[10px] text-slate-400 mt-2 font-medium">
                                {notif.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            {!notif.read && (
                              <button
                                onClick={() => markAsRead(notif.id)}
                                className="absolute end-4 top-4 p-1 text-slate-300 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition-all rounded bg-white shadow-sm border border-slate-200"
                                title="Mark as read"
                              >
                                <CheckCircle2 size={12} />
                              </button>
                            )}
                            {!notif.read && (
                              <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 self-center absolute end-4 group-hover:opacity-0 transition-opacity" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg flex items-center gap-2">
          <Globe size={18} />
          <span className="text-xs font-semibold uppercase">FR</span>
        </button>

        <div className="h-4 w-px bg-slate-200 mx-1" />

        <button className="flex items-center gap-3 p-1 ps-2 hover:bg-slate-50 rounded-lg transition-colors">
          <span className="hidden sm:block text-sm font-medium text-slate-700">{userName}</span>
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
            {userInitials}
          </div>
        </button>
      </div>
    </header>
  );
}
