import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CheckCheck, Clock, FileText,
  AlertCircle, CheckCircle2, XCircle, Info,
  BellOff, ChevronRight
} from 'lucide-react';
import api from '../lib/api';

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('read_notif_ids') || '[]');
    } catch {
      return [];
    }
  });

  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/notifikasi');
      setNotifications(data.data || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const unreadList = notifications.filter((n) => !readIds.includes(n.id));
  const unreadCount = unreadList.length;

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    const updated = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(updated);
    localStorage.setItem('read_notif_ids', JSON.stringify(updated));
  };

  const handleItemClick = (item) => {
    if (!readIds.includes(item.id)) {
      const updated = [...readIds, item.id];
      setReadIds(updated);
      localStorage.setItem('read_notif_ids', JSON.stringify(updated));
    }
    setOpen(false);
    if (item.link) {
      navigate(item.link);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'danger':
        return <AlertCircle size={16} className="notif-cat-icon text-danger" />;
      case 'warning':
        return <Clock size={16} className="notif-cat-icon text-warning" />;
      case 'success':
        return <CheckCircle2 size={16} className="notif-cat-icon text-success" />;
      case 'info':
      default:
        return <Info size={16} className="notif-cat-icon text-info" />;
    }
  };

  return (
    <div className="notif-dropdown-wrapper" ref={dropdownRef}>
      <button
        className={`topbar-icon-btn notif-btn ${open ? 'active' : ''}`}
        onClick={() => {
          setOpen(!open);
          if (!open) fetchNotifications();
        }}
        aria-label="Notifikasi"
        title="Notifikasi"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notif-badge-count">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notif-panel">
          {/* Header */}
          <div className="notif-panel-header">
            <div className="notif-header-title">
              <span className="notif-title-text">Notifikasi</span>
              {unreadCount > 0 && (
                <span className="notif-pill-badge">{unreadCount} Baru</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                className="notif-mark-read-btn"
                onClick={markAllAsRead}
                title="Tandai semua sudah dibaca"
              >
                <CheckCheck size={14} /> Tandai dibaca
              </button>
            )}
          </div>

          {/* List */}
          <div className="notif-panel-body">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <div className="notif-empty-icon">
                  <BellOff size={28} />
                </div>
                <p className="notif-empty-title">Tidak ada notifikasi baru</p>
                <p className="notif-empty-desc">Semua aktivitas dan informasi terbaru Anda sudah terpantau.</p>
              </div>
            ) : (
              <div className="notif-list">
                {notifications.map((item) => {
                  const isUnread = !readIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`notif-item notif-${item.category || 'info'} ${isUnread ? 'is-unread' : ''}`}
                      onClick={() => handleItemClick(item)}
                    >
                      <div className={`notif-item-icon notif-icon-${item.category || 'info'}`}>
                        {getCategoryIcon(item.category)}
                      </div>
                      <div className="notif-item-content">
                        <div className="notif-item-header">
                          <span className="notif-item-title">{item.title}</span>
                          <span className="notif-item-time">{item.time}</span>
                        </div>
                        <p className="notif-item-msg">{item.message}</p>
                      </div>
                      {isUnread && <span className="notif-unread-dot" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="notif-panel-footer">
              <span className="text-muted text-xs">Pembaruan otomatis realtime</span>
              <button
                type="button"
                className="notif-refresh-btn"
                onClick={fetchNotifications}
                disabled={loading}
              >
                {loading ? 'Memuat...' : 'Segarkan'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
