import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const NewsContext = createContext(null);
const STORAGE_KEY = 'intranet_read_news_ids';

export function NewsProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [readNewsIds, setReadNewsIds] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const loadNews = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const data = await api.getNews({ limit: 50 });
      setNewsList(data || []);
    } catch (err) {
      console.error('Error loading corporate news:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Load news when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadNews();
    } else {
      setNewsList([]);
    }
  }, [isAuthenticated, loadNews]);

  // Periodic check every 45 seconds & on tab visibility
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      loadNews();
    }, 45000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadNews();
      }
    };

    const handleCustomNewsEvent = () => {
      loadNews();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('news_updated', handleCustomNewsEvent);
    window.addEventListener('news_created', handleCustomNewsEvent);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('news_updated', handleCustomNewsEvent);
      window.removeEventListener('news_created', handleCustomNewsEvent);
    };
  }, [isAuthenticated, loadNews]);

  // Calculate unread news
  const unreadNews = newsList.filter((n) => !readNewsIds.includes(n.id));
  const unreadCount = unreadNews.length;

  const markAsRead = useCallback((newsId) => {
    setReadNewsIds((prev) => {
      if (prev.includes(newsId)) return prev;
      const next = [...prev, newsId];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Error saving read news ID:', e);
      }
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    if (newsList.length === 0) return;
    const allIds = Array.from(new Set([...readNewsIds, ...newsList.map((n) => n.id)]));
    setReadNewsIds(allIds);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allIds));
    } catch (e) {
      console.error('Error saving all read news IDs:', e);
    }
  }, [newsList, readNewsIds]);

  return (
    <NewsContext.Provider
      value={{
        newsList,
        unreadNews,
        unreadCount,
        loading,
        refreshNews: loadNews,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NewsContext.Provider>
  );
}

export function useNews() {
  const context = useContext(NewsContext);
  if (!context) {
    throw new Error('useNews must be used within a NewsProvider');
  }
  return context;
}
