const API_BASE_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? '/api/v1' : 'http://127.0.0.1:8000/api/v1');

export function getAssetUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  if (url.startsWith('/uploads/')) {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return url;
    }
    return `http://127.0.0.1:8000${url}`;
  }
  return url;
}

export const getAvatarUrl = getAssetUrl;
export const getNewsCoverUrl = getAssetUrl;

class ApiService {
  getToken() {
    return localStorage.getItem('intranet_token');
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('intranet_token', token);
    } else {
      localStorage.removeItem('intranet_token');
    }
  }

  getHeaders(customHeaders = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = this.getHeaders(options.headers);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        this.setToken(null);
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        throw new Error('Sitzung abgelaufen oder nicht autorisiert');
      }

      if (response.status === 204) {
        return null;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Fehler bei der Anfrage' }));
        throw new Error(errorData.detail || `HTTP-Fehler ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, error);
      throw error;
    }
  }

  // Auth
  login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  getMe() {
    return this.request('/auth/me');
  }

  // Navigation
  getMenu() {
    return this.request('/navigation/menu');
  }

  // Dashboard
  getDashboardOverview() {
    return this.request('/dashboard/overview');
  }

  getAnnouncements(category = null) {
    const q = category ? `?category=${category}` : '';
    return this.request(`/dashboard/announcements${q}`);
  }

  // News / Mitteilungszentrale
  getNews(category = null, search = '', limit = 50, offset = 0) {
    const params = new URLSearchParams();
    if (category && category !== 'ALL' && category !== 'ALLE') {
      params.append('category', category);
    }
    if (search && search.trim()) {
      params.append('q', search.trim());
    }
    if (limit) params.append('limit', limit);
    if (offset) params.append('offset', offset);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/news${queryString}`);
  }

  getNewsCategories() {
    return this.request('/news/categories');
  }

  getNewsById(newsId) {
    return this.request(`/news/${newsId}`);
  }

  createNews(newsData) {
    return this.request('/news', {
      method: 'POST',
      body: JSON.stringify(newsData),
    });
  }

  updateNews(newsId, newsData) {
    return this.request(`/news/${newsId}`, {
      method: 'PUT',
      body: JSON.stringify(newsData),
    });
  }

  deleteNews(newsId) {
    return this.request(`/news/${newsId}`, {
      method: 'DELETE',
    });
  }

  async uploadNewsCover(file) {
    const token = this.getToken();
    const formData = new FormData();
    formData.append('file', file);

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/news/upload-cover`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Upload fehlgeschlagen' }));
      throw new Error(errorData.detail || 'Fehler beim Hochladen des Titelbildes');
    }

    return await response.json();
  }

  // System Languages (i18n)
  getActiveLanguages() {
    return this.request('/languages/active');
  }

  getAdminLanguages() {
    return this.request('/admin/languages');
  }

  toggleLanguage(code, isActive) {
    return this.request(`/admin/languages/${code}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    });
  }

  setDefaultLanguage(code) {
    return this.request(`/admin/languages/${code}/set-default`, {
      method: 'POST',
    });
  }

  // System Settings & Integrations (OneDrive, etc.)
  getSetting(key) {
    return this.request(`/settings/${key}`);
  }

  getAdminSettings() {
    return this.request('/admin/settings');
  }

  updateSetting(key, value) {
    return this.request(`/admin/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  }

  resetSetting(key) {
    return this.request(`/admin/settings/${key}/reset`, {
      method: 'POST',
    });
  }

  getQuickTools() {
    return this.request('/dashboard/quick-tools');
  }

  getEvents() {
    return this.request('/dashboard/events');
  }

  // Users & Phone Directory
  getDirectory(query = '', department = '', location = '') {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (department && department !== 'ALL' && department !== 'Todos') params.append('department', department);
    if (location && location !== 'ALL') params.append('location', location);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/users/directory${queryString}`);
  }

  // Org Chart Tree
  getOrgChart() {
    return this.request('/users/org-chart');
  }

  // SuperAdmin User Management (CRUD)
  getAdminUsers(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.query) queryParams.append('query', params.query);
    if (params.department && params.department !== 'ALL') queryParams.append('department', params.department);
    if (params.role && params.role !== 'ALL') queryParams.append('role', params.role);
    if (params.is_active !== undefined && params.is_active !== 'ALL') {
      queryParams.append('is_active', params.is_active);
    }
    if (params.skip) queryParams.append('skip', params.skip);
    if (params.limit) queryParams.append('limit', params.limit);
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request(`/admin/users${queryString}`);
  }

  getAdminUserById(userId) {
    return this.request(`/admin/users/${userId}`);
  }

  createAdminUser(userData) {
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  updateAdminUser(userId, userData) {
    return this.request(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  deleteAdminUser(userId) {
    return this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Granular Permissions Matrix
  getUserPermissions(userId) {
    return this.request(`/admin/users/${userId}/permissions`);
  }

  updateUserPermissions(userId, modules) {
    return this.request(`/admin/users/${userId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ modules }),
    });
  }

  // Avatar Management
  async uploadUserAvatar(userId, file) {
    const token = this.getToken();
    const formData = new FormData();
    formData.append('file', file);

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/avatar`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Upload fehlgeschlagen' }));
      throw new Error(errorData.detail || 'Fehler beim Hochladen des Profilbildes');
    }

    return await response.json();
  }

  async uploadTempAvatar(file) {
    const token = this.getToken();
    const formData = new FormData();
    formData.append('file', file);

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/admin/users/upload-avatar-temp`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Upload fehlgeschlagen' }));
      throw new Error(errorData.detail || 'Fehler beim Hochladen des Profilbildes');
    }

    return await response.json();
  }

  deleteUserAvatar(userId) {
    return this.request(`/admin/users/${userId}/avatar`, {
      method: 'DELETE',
    });
  }

  // SuperAdmin Navigation & Menu Management (Reorder, Toggle, Visibility)
  getAdminMenuItems() {
    return this.request('/admin/menu');
  }

  toggleMenuItemActive(itemId, isActive = null) {
    const payload = isActive !== null ? { is_active: isActive } : null;
    return this.request(`/admin/menu/${itemId}/toggle-active`, {
      method: 'PATCH',
      body: payload ? JSON.stringify(payload) : JSON.stringify({}),
    });
  }

  reorderMenuItems(items) {
    return this.request('/admin/menu/reorder', {
      method: 'PUT',
      body: JSON.stringify({ items }),
    });
  }

  updateMenuItem(itemId, data) {
    return this.request(`/admin/menu/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  resetDefaultMenus() {
    return this.request('/admin/menu/reset-defaults', {
      method: 'POST',
    });
  }

  // Calendar Module
  getCalendarEvents(category = 'ALL', department = 'ALL', start = null, end = null) {
    const params = new URLSearchParams();
    if (category && category !== 'ALL') params.append('category', category);
    if (department && department !== 'ALL') params.append('department', department);
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/calendar/events${queryString}`);
  }

  createCalendarEvent(eventData) {
    return this.request('/calendar/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  deleteCalendarEvent(eventId) {
    return this.request(`/calendar/events/${eventId}`, {
      method: 'DELETE',
    });
  }

  getIcsFeedUrl() {
    return `${API_BASE_URL}/calendar/feed.ics`;
  }

  // External Outlook / iCal Calendar Sources
  getCalendarSources() {
    return this.request('/calendar/sources');
  }

  getAdminCalendarSources() {
    return this.request('/admin/calendar-sources');
  }

  createCalendarSource(sourceData) {
    return this.request('/admin/calendar-sources', {
      method: 'POST',
      body: JSON.stringify(sourceData),
    });
  }

  updateCalendarSource(sourceId, sourceData) {
    return this.request(`/admin/calendar-sources/${sourceId}`, {
      method: 'PUT',
      body: JSON.stringify(sourceData),
    });
  }

  deleteCalendarSource(sourceId) {
    return this.request(`/admin/calendar-sources/${sourceId}`, {
      method: 'DELETE',
    });
  }

  syncCalendarSource(sourceId) {
    return this.request(`/admin/calendar-sources/${sourceId}/sync`, {
      method: 'POST',
    });
  }

  // Documents & AI Search Module
  getDocuments(category = 'ALL', department = 'ALL', search = '') {
    const params = new URLSearchParams();
    if (category && category !== 'ALL') params.append('category', category);
    if (department && department !== 'ALL') params.append('department', department);
    if (search) params.append('search', search);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/documents${queryString}`);
  }

  async uploadDocument(file, category = 'GENERAL', department = null) {
    const token = this.getToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (department && department !== 'ALL') {
      formData.append('allowed_department', department);
    }

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Upload fehlgeschlagen' }));
      throw new Error(errorData.detail || 'Fehler beim Hochladen des Dokuments');
    }

    return await response.json();
  }

  getDownloadUrl(documentId) {
    const token = this.getToken();
    return `${API_BASE_URL}/documents/${documentId}/download?token=${encodeURIComponent(token || '')}`;
  }

  searchDocumentsAI(query, top_k = 4, category = null) {
    return this.request('/documents/search-ai', {
      method: 'POST',
      body: JSON.stringify({ query, top_k, category }),
    });
  }

  deleteDocument(documentId) {
    return this.request(`/documents/${documentId}`, {
      method: 'DELETE',
    });
  }

  // Schulungen (Training Manuals & RAG AI Chatbot)
  getSchulungen(query = '', category = 'ALL') {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (category && category !== 'ALL') params.append('category', category);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/schulungen${queryString}`);
  }

  async uploadSchulungDocument(formData) {
    const token = this.getToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/schulungen/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Upload fehlgeschlagen' }));
      throw new Error(errorData.detail || 'Fehler beim Hochladen des Schulungshandbuchs');
    }

    return await response.json();
  }

  deleteSchulungDocument(docId) {
    return this.request(`/schulungen/${docId}`, {
      method: 'DELETE',
    });
  }

  getSchulungDownloadUrl(docId) {
    const token = this.getToken();
    return `${API_BASE_URL}/schulungen/${docId}/download?token=${encodeURIComponent(token || '')}`;
  }

  chatSchulungen(message, categoryFilter = null, history = []) {
    return this.request('/schulungen/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        category_filter: categoryFilter,
        history,
      }),
    });
  }

  // Dynamic Role Management & RBAC Matrix
  getRoles() {
    return this.request('/admin/roles');
  }

  getRole(roleId) {
    return this.request(`/admin/roles/${roleId}`);
  }

  createRole(roleData) {
    return this.request('/admin/roles', {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
  }

  updateRole(roleId, roleData) {
    return this.request(`/admin/roles/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    });
  }

  deleteRole(roleId) {
    return this.request(`/admin/roles/${roleId}`, {
      method: 'DELETE',
    });
  }

  getPermissionsCatalog() {
    return this.request('/admin/roles/permissions-catalog');
  }

  // Legacy/Simple Users
  getUsers(query = '', department = '') {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (department && department !== 'Todos' && department !== 'ALL') params.append('department', department);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/users${queryString}`);
  }
}

export const api = new ApiService();
