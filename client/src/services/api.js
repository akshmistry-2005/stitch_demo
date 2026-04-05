const API_BASE = import.meta.env.VITE_API_URL;

class ApiService {
  constructor() {
    this.baseUrl = API_BASE;
  }

  getToken() {
    return localStorage.getItem('gymflow_token');
  }

  setTokens(accessToken, refreshToken) {
    localStorage.setItem('gymflow_token', accessToken);
    localStorage.setItem('gymflow_refresh_token', refreshToken);
  }

  clearTokens() {
    localStorage.removeItem('gymflow_token');
    localStorage.removeItem('gymflow_refresh_token');
    localStorage.removeItem('gymflow_user');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Remove Content-Type for FormData
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    try {
      const response = await fetch(url, { ...options, headers, body: options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          const refreshed = await this.tryRefreshToken();
          if (refreshed) return this.request(endpoint, options);
          this.clearTokens();
          window.location.href = '/login';
        }
        throw { status: response.status, message: data.message || 'Request failed', errors: data.errors };
      }
      return data;
    } catch (err) {
      if (err.status) throw err;
      throw { status: 0, message: 'Network error. Please check your connection.' };
    }
  }

  async tryRefreshToken() {
    const refreshToken = localStorage.getItem('gymflow_refresh_token');
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      if (!res.ok) return false;
      const data = await res.json();
      this.setTokens(data.data.accessToken, data.data.refreshToken);
      return true;
    } catch { return false; }
  }

  // === AUTH ===
  signup(data) { return this.request('/auth/signup', { method: 'POST', body: data }); }
  login(data) { return this.request('/auth/login', { method: 'POST', body: data }); }
  googleAuth(data) { return this.request('/auth/google', { method: 'POST', body: data }); }
  getProfile() { return this.request('/auth/me'); }

  // === DASHBOARD ===
  getDashboardStats() { return this.request('/dashboard/stats'); }
  getTodayEvents() { return this.request('/dashboard/events/today'); }

  // === MEMBERS ===
  getMembers(params = {}) { const q = new URLSearchParams(params).toString(); return this.request(`/members?${q}`); }
  createMember(data) { return this.request('/members', { method: 'POST', body: data }); }
  getMember(id) { return this.request(`/members/${id}`); }
  updateMember(id, data) { return this.request(`/members/${id}`, { method: 'PUT', body: data }); }
  deleteMember(id) { return this.request(`/members/${id}`, { method: 'DELETE' }); }

  // === STAFF ===
  getStaff(params = {}) { const q = new URLSearchParams(params).toString(); return this.request(`/staff?${q}`); }
  createStaff(data) { return this.request('/staff', { method: 'POST', body: data }); }
  updateStaff(id, data) { return this.request(`/staff/${id}`, { method: 'PUT', body: data }); }
  deleteStaff(id) { return this.request(`/staff/${id}`, { method: 'DELETE' }); }

  // === TRAINERS ===
  getTrainers() { return this.request('/trainers'); }
  createTrainer(data) { return this.request('/trainers', { method: 'POST', body: data }); }
  updateTrainer(id, data) { return this.request(`/trainers/${id}`, { method: 'PUT', body: data }); }
  deleteTrainer(id) { return this.request(`/trainers/${id}`, { method: 'DELETE' }); }
  assignTrainer(data) { return this.request('/trainers/assign', { method: 'POST', body: data }); }
  unassignTrainer(memberId) { return this.request(`/trainers/assign/${memberId}`, { method: 'DELETE' }); }
  getTrainerMembers(id) { return this.request(`/trainers/${id}/members`); }

  // === WORKOUTS ===
  getWorkoutCategories() { return this.request('/workouts/categories'); }
  createWorkoutCategory(data) { return this.request('/workouts/categories', { method: 'POST', body: data }); }
  updateWorkoutCategory(id, data) { return this.request(`/workouts/categories/${id}`, { method: 'PUT', body: data }); }
  deleteWorkoutCategory(id) { return this.request(`/workouts/categories/${id}`, { method: 'DELETE' }); }
  getExercises(categoryId) { return this.request(`/workouts/categories/${categoryId}/exercises`); }
  addExercises(categoryId, exercises) { return this.request(`/workouts/categories/${categoryId}/exercises`, { method: 'POST', body: { exercises } }); }
  updateExercise(id, data) { return this.request(`/workouts/exercises/${id}`, { method: 'PUT', body: data }); }
  deleteExercise(id) { return this.request(`/workouts/exercises/${id}`, { method: 'DELETE' }); }

  // === DIET ===
  getDietCategories() { return this.request('/diet/categories'); }
  createDietCategory(data) { return this.request('/diet/categories', { method: 'POST', body: data }); }
  updateDietCategory(id, data) { return this.request(`/diet/categories/${id}`, { method: 'PUT', body: data }); }
  deleteDietCategory(id) { return this.request(`/diet/categories/${id}`, { method: 'DELETE' }); }
  getDietPlans(categoryId) { return this.request(`/diet/categories/${categoryId}/plans`); }
  createDietPlan(data) { return this.request('/diet/plans', { method: 'POST', body: data }); }
  updateDietPlan(id, data) { return this.request(`/diet/plans/${id}`, { method: 'PUT', body: data }); }
  deleteDietPlan(id) { return this.request(`/diet/plans/${id}`, { method: 'DELETE' }); }
  getPlanMeals(planId) { return this.request(`/diet/plans/${planId}/meals`); }
  addMeal(planId, data) { return this.request(`/diet/plans/${planId}/meals`, { method: 'POST', body: data }); }
  updateMeal(id, data) { return this.request(`/diet/meals/${id}`, { method: 'PUT', body: data }); }
  deleteMeal(id) { return this.request(`/diet/meals/${id}`, { method: 'DELETE' }); }

  // === EVENTS ===
  getEvents(params = {}) { return this.request('/events'); }
  getEventsByMonth(year, month) { return this.request(`/events/month/${year}/${month}`); }
  createEvent(data) { return this.request('/events', { method: 'POST', body: data }); }
  updateEvent(id, data) { return this.request(`/events/${id}`, { method: 'PUT', body: data }); }
  deleteEvent(id) { return this.request(`/events/${id}`, { method: 'DELETE' }); }
  toggleCompetition(id) { return this.request(`/events/${id}/competition`, { method: 'PUT' }); }
  uploadEventPhotos(eventId, formData) { return this.request(`/events/${eventId}/photos`, { method: 'POST', body: formData }); }
  getEventPhotos(eventId) { return this.request(`/events/${eventId}/photos`); }
  setEventWinners(eventId, winners) { return this.request(`/events/${eventId}/winners`, { method: 'POST', body: { winners } }); }
  getEventWinners(eventId) { return this.request(`/events/${eventId}/winners`); }

  // === SONGS ===
  getSongQueue() { return this.request('/songs/queue'); }
  submitSongRequest(data) { return this.request('/songs/request', { method: 'POST', body: data }); }
  updateSongStatus(id, status) { return this.request(`/songs/${id}/status`, { method: 'PUT', body: { status } }); }
  clearPlayedSongs() { return this.request('/songs/clear', { method: 'DELETE' }); }
}

const api = new ApiService();
export default api;
