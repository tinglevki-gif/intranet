import { api } from './api';

export const ticketService = {
  /**
   * Fetch tickets with flexible filtering
   */
  async getTickets({
    status = null,
    prioritaet = null,
    kategorie = null,
    zugewiesen_an_id = null,
    ersteller_id = null,
    query = null,
    only_my_tickets = false,
    skip = 0,
    limit = 100
  } = {}) {
    const params = new URLSearchParams();
    if (status && status !== 'ALL') params.append('status', status);
    if (prioritaet && prioritaet !== 'ALL') params.append('prioritaet', prioritaet);
    if (kategorie && kategorie !== 'ALL') params.append('kategorie', kategorie);
    if (zugewiesen_an_id !== null && zugewiesen_an_id !== undefined) params.append('zugewiesen_an_id', zugewiesen_an_id);
    if (ersteller_id) params.append('ersteller_id', ersteller_id);
    if (query && query.trim()) params.append('query', query.trim());
    if (only_my_tickets) params.append('only_my_tickets', 'true');
    params.append('skip', skip);
    params.append('limit', limit);

    const queryString = params.toString();
    return await api.get(`/tickets${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Fetch ticket KPI statistics summary
   */
  async getTicketStats() {
    return await api.get('/tickets/stats/summary');
  },

  /**
   * Fetch ticket detail by ID including messages
   */
  async getTicketDetail(ticketId) {
    return await api.get(`/tickets/${ticketId}`);
  },

  /**
   * Create a new ticket
   */
  async createTicket(ticketData) {
    return await api.post('/tickets', ticketData);
  },

  /**
   * Add a chat message or internal note to a ticket
   */
  async addTicketMessage(ticketId, messageData) {
    return await api.post(`/tickets/${ticketId}/messages`, messageData);
  },

  /**
   * Update ticket status (with mandatory solution documentation for GELOEST)
   */
  async updateTicketStatus(ticketId, statusData) {
    return await api.patch(`/tickets/${ticketId}/status`, statusData);
  },

  /**
   * Assign ticket to a support user
   */
  async assignTicket(ticketId, zugewiesen_an_id) {
    return await api.patch(`/tickets/${ticketId}/assign`, { zugewiesen_an_id });
  },

  /**
   * Update ticket general metadata
   */
  async updateTicket(ticketId, updateData) {
    return await api.put(`/tickets/${ticketId}`, updateData);
  },

  /**
   * Delete ticket permanently (SuperAdmin / IT-Admin)
   */
  async deleteTicket(ticketId) {
    return await api.delete(`/tickets/${ticketId}`);
  },

  /**
   * Search knowledge base for solved issues
   */
  async searchKnowledgeBase({ q = '', kategorie = null } = {}) {
    const params = new URLSearchParams();
    if (q && q.trim()) params.append('q', q.trim());
    if (kategorie && kategorie !== 'ALL') params.append('kategorie', kategorie);
    const queryString = params.toString();
    return await api.get(`/tickets/knowledge-base/search${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Smart Assist: Real-time solution suggestions while drafting ticket
   */
  async suggestSolutions({ titel = '', kategorie = null, beschreibung = '' } = {}) {
    if (!titel || titel.trim().length < 3) {
      return { has_suggestions: false, suggestions_count: 0, suggestions: [] };
    }
    const params = new URLSearchParams();
    params.append('titel', titel.trim());
    if (kategorie && kategorie !== 'ALL') params.append('kategorie', kategorie);
    if (beschreibung && beschreibung.trim()) params.append('beschreibung', beschreibung.trim());
    return await api.get(`/tickets/suggest-solutions?${params.toString()}`);
  },

  /**
   * Fetch all users for assignment selector
   */
  async getUsers() {
    try {
      const response = await api.get('/users');
      return response.users || response || [];
    } catch (err) {
      console.warn('Could not fetch user directory for ticket assignment:', err);
      return [];
    }
  }
};
