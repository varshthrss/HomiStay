import axiosInstance from '../api/axiosInstance';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8090';

// ── Normalizers ───────────────────────────────────────────────────────────────

export function isRealId(id) {
  if (id === null || id === undefined) return false;
  return !isNaN(Number(id)) && String(id).trim() !== "";
}

export function normalizeProperty(p) {
  return {
    id: String(p.id),
    hostId: String(p.hostId),
    hostName: p.hostName,
    title: p.title,
    description: p.description,
    category: (p.type || '').toLowerCase(),
    type: (p.type || '').toLowerCase(),
    location: { 
      city: p.city, 
      state: p.state || '', 
      country: p.country, 
      address: p.address || '', 
      pincode: p.pincode || '',
      latitude: p.latitude != null ? Number(p.latitude) : null,
      longitude: p.longitude != null ? Number(p.longitude) : null
    },
    price: Number(p.pricePerNight ?? 0),
    effectivePrice: p.effectivePricePerNight != null ? Number(p.effectivePricePerNight) : null,
    seasonName: p.seasonName || null,
    cleaningFee: Number(p.cleaningFee ?? 0),
    rating: p.averageRating ?? 0,
    reviewCount: p.reviewCount ?? 0,
    images: p.imageUrls?.length
      ? p.imageUrls
      : [p.primaryImageUrl].filter(Boolean),
    amenities:
      typeof p.amenities === 'string'
        ? p.amenities.split(',').map((a) => a.trim().replace(/^Custom:\s*/i, "")).filter(Boolean)
        : Array.isArray(p.amenities)
        ? p.amenities.map((a) => a.replace(/^Custom:\s*/i, ""))
        : [],
    bedrooms: p.bedrooms ?? 1,
    bathrooms: p.bathrooms ?? 1,
    maxGuests: p.maxGuests ?? 2,
    status: p.isActive ? 'active' : 'inactive',
    allowsChildren: p.allowsChildren !== false,
    allowsInfants: p.allowsInfants !== false,
    allowsPets: p.allowsPets === true,
    houseRules: p.houseRules || '',
    guestRequirements: p.guestRequirements || '',
    checkInInstructions: p.checkInInstructions || '',
    addons: Array.isArray(p.addons) ? p.addons.map(a => ({
      id: String(a.id),
      name: a.name,
      description: a.description || '',
      price: Number(a.price ?? 0),
      isActive: a.isActive !== false,
    })) : [],
    hostBio: p.hostBio || '',
    hostJoinedAt: p.hostJoinedAt || '',
  };
}

export function normalizeBooking(b) {
  return {
    id: `HMS-${b.id}`,
    propertyId: String(b.propertyId),
    userId: String(b.guestId),
    guestName: b.guestName,
    guestEmail: b.guestEmail || '',
    guestPhone: b.guestPhone || '',
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    guests: b.guestsCount,
    adults: b.adults ?? b.guestsCount,
    children: b.children ?? 0,
    infants: b.infants ?? 0,
    pets: b.pets ?? 0,
    totalPrice: Number(b.totalPrice ?? 0),
    refundAmount: b.refundAmount != null ? Number(b.refundAmount) : null,
    status: (b.status || '').toLowerCase(),
    createdAt: b.createdAt,
    specialRequests: b.specialRequests || '',
    specialRequestStatus: b.specialRequestStatus || 'PENDING',
    hostNotes: b.hostNotes || '',
    checkInInstructions: b.checkInInstructions || '',
    addons: Array.isArray(b.addons) ? b.addons.map(a => ({
      id: String(a.id),
      addonId: String(a.addonId),
      name: a.name,
      description: a.description || '',
      quantity: a.quantity || 1,
      price: Number(a.price ?? 0),
    })) : [],
  };
}

export function normalizeUser(u) {
  const name = u.fullName?.trim() || '';
  let avatar = u.avatarUrl?.trim();
  if (avatar && avatar.startsWith('/uploads/')) {
    avatar = API_BASE + avatar;
  }
  return {
    id: String(u.id),
    name: name || null,
    email: u.email,
    phone: u.phone?.trim() || null,
    bio: u.bio?.trim() || null,
    dob: u.dob || null,
    gender: u.gender?.trim() || null,
    role: (u.role || '').toLowerCase(),
    avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || u.email)}&background=random`,
  };
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  async login(email, password) {
    const { data } = await axiosInstance.post('/api/auth/login', { email, password });
    return data; // { accessToken, refreshToken, user: UserResponse }
  },
  async register(fullName, email, password, role = 'GUEST') {
    const { data } = await axiosInstance.post('/api/auth/register', {
      fullName,
      email,
      password,
      role,
    });
    return data;
  },
  async me() {
    const { data } = await axiosInstance.get('/api/auth/me');
    return data;
  },
  async refresh(refreshToken) {
    const { data } = await axiosInstance.post('/api/auth/refresh', { refreshToken });
    return data;
  },
  async updateProfile(payload) {
    const isFormData = payload instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': undefined } } : {};
    const { data } = await axiosInstance.put('/api/auth/profile', payload, config);
    return data;
  },
  async changePassword(payload) {
    const { data } = await axiosInstance.put('/api/auth/password', payload);
    return data;
  },
  async upgradeToHost() {
    const { data } = await axiosInstance.put('/api/auth/upgrade');
    return data;
  },
};

// ── Properties ────────────────────────────────────────────────────────────────

export const propertiesApi = {
  async search(params = {}) {
    const { data } = await axiosInstance.get('/api/properties', { params });
    return data; // PageResponse<PropertyResponse>
  },
  async getById(id) {
    const { data } = await axiosInstance.get(`/api/properties/${id}`);
    return data;
  },
  async create(payload) {
    const { data } = await axiosInstance.post('/api/properties', payload);
    return data;
  },
  async update(id, payload) {
    const { data } = await axiosInstance.put(`/api/properties/${id}`, payload);
    return data;
  },
  async delete(id) {
    await axiosInstance.delete(`/api/properties/${id}`);
  },
  async getBlockedDates(id) {
    const { data } = await axiosInstance.get(`/api/properties/${id}/blocked-dates`);
    return data;
  },
};

// ── Bookings ──────────────────────────────────────────────────────────────────

export const bookingsApi = {
  async create(payload) {
    const { data } = await axiosInstance.post('/api/bookings', payload);
    return data;
  },
  async getById(id) {
    const { data } = await axiosInstance.get(`/api/bookings/${id}`);
    return data;
  },
  async cancel(id) {
    const { data } = await axiosInstance.patch(`/api/bookings/${id}/cancel`);
    return data;
  },
  async myBookings(page = 0, size = 10) {
    const { data } = await axiosInstance.get('/api/bookings/my', { params: { page, size } });
    return data;
  },
  // Feature 6: Guest modification requests
  async requestModification(bookingId, payload) {
    const { data } = await axiosInstance.post(`/api/bookings/${bookingId}/modification`, payload);
    return data;
  },
  async getModifications(bookingId) {
    const { data } = await axiosInstance.get(`/api/bookings/${bookingId}/modifications`);
    return data;
  },
  // Booking Messages
  async sendMessage(bookingId, message) {
    const { data } = await axiosInstance.post(`/api/bookings/${bookingId}/messages`, { message });
    return data;
  },
  async getMessages(bookingId) {
    const { data } = await axiosInstance.get(`/api/bookings/${bookingId}/messages`);
    return data;
  },
};

// ── Host ──────────────────────────────────────────────────────────────────────

export const hostApi = {
  async dashboard() {
    const { data } = await axiosInstance.get('/api/host/dashboard');
    return data;
  },
  async monthlyEarnings() {
    const { data } = await axiosInstance.get('/api/host/earnings/monthly');
    return data;
  },
  async myProperties(page = 0, size = 12) {
    const { data } = await axiosInstance.get('/api/host/properties', {
      params: { page, size },
    });
    return data;
  },
  async myBookings(status, page = 0, size = 10) {
    const params = { page, size };
    if (status && status !== 'all') params.status = status.toUpperCase();
    const { data } = await axiosInstance.get('/api/host/bookings', { params });
    return data;
  },
  async toggleAvailability(propertyId, startDate, endDate, block) {
    await axiosInstance.post(`/api/host/properties/${propertyId}/availability`, {
      startDate,
      endDate,
      block,
    });
  },
  // Feature 2: Host Notes
  async updateHostNotes(bookingId, hostNotes) {
    const { data } = await axiosInstance.patch(`/api/host/bookings/${bookingId}/notes`, { hostNotes });
    return data;
  },
  // Feature 3: Special Request Status
  async updateSpecialRequestStatus(bookingId, status) {
    const { data } = await axiosInstance.patch(`/api/host/bookings/${bookingId}/special-request-status`, { status });
    return data;
  },
  // Feature 4: Addon CRUD
  async listAddons(propertyId) {
    const { data } = await axiosInstance.get(`/api/host/properties/${propertyId}/addons`);
    return data;
  },
  async createAddon(propertyId, payload) {
    const { data } = await axiosInstance.post(`/api/host/properties/${propertyId}/addons`, payload);
    return data;
  },
  async deleteAddon(propertyId, addonId) {
    await axiosInstance.delete(`/api/host/properties/${propertyId}/addons/${addonId}`);
  },
  // Feature 6: Modification approve/deny
  async getModifications(bookingId) {
    const { data } = await axiosInstance.get(`/api/host/bookings/${bookingId}/modifications`);
    return data;
  },
  async respondToModification(bookingId, modId, status, hostResponse) {
    const { data } = await axiosInstance.patch(`/api/host/bookings/${bookingId}/modifications/${modId}`, { status, hostResponse });
    return data;
  },
};

// ── Reviews ───────────────────────────────────────────────────────────────────

export const reviewsApi = {
  async getPropertyReviews(propertyId, page = 0, size = 10) {
    const { data } = await axiosInstance.get(
      `/api/reviews/property/${propertyId}`,
      { params: { page, size } }
    );
    return data;
  },
  async create(payload) {
    const { data } = await axiosInstance.post('/api/reviews', payload);
    return data;
  },
};

// ── Experiences ───────────────────────────────────────────────────────────────

export const experiencesApi = {
  async list(city, page = 0, size = 12) {
    const { data } = await axiosInstance.get('/api/experiences', {
      params: { city, page, size },
    });
    return data;
  },
  async getById(id) {
    const { data } = await axiosInstance.get(`/api/experiences/${id}`);
    return data;
  },
  async book(payload) {
    await axiosInstance.post('/api/experiences/book', payload);
  },
};

// ── Wishlists ───────────────────────────────────────────────────────────────

export const wishlistApi = {
  async get() {
    const { data } = await axiosInstance.get('/api/wishlists');
    return data;
  },
  async add(propertyId) {
    const { data } = await axiosInstance.post(`/api/wishlists/${propertyId}`);
    return data;
  },
  async remove(propertyId) {
    const { data } = await axiosInstance.delete(`/api/wishlists/${propertyId}`);
    return data;
  },
};

// ── Pricing (Dynamic) ────────────────────────────────────────────────────────

export const pricingApi = {
  async getBreakdown(propertyId, checkIn, checkOut) {
    const { data } = await axiosInstance.get(`/api/properties/${propertyId}/pricing`, {
      params: { checkIn, checkOut },
    });
    return data;
  },
  async getSeasonalRates(propertyId) {
    const { data } = await axiosInstance.get(`/api/host/pricing/seasons`, {
      params: { propertyId },
    });
    return data;
  },
  async createSeasonalRate(payload) {
    const { data } = await axiosInstance.post('/api/host/pricing/seasons', payload);
    return data;
  },
  async updateSeasonalRate(id, payload) {
    const { data } = await axiosInstance.put(`/api/host/pricing/seasons/${id}`, payload);
    return data;
  },
  async deleteSeasonalRate(id) {
    await axiosInstance.delete(`/api/host/pricing/seasons/${id}`);
  },
  async getConfig(propertyId) {
    const { data } = await axiosInstance.get(`/api/host/pricing/config/${propertyId}`);
    return data;
  },
  async saveConfig(payload) {
    const { data } = await axiosInstance.put('/api/host/pricing/config', payload);
    return data;
  },
};

// ── Support / Chatbot ────────────────────────────────────────────────────

export const supportApi = {
  async askChatbot(question) {
    const { data } = await axiosInstance.post('/api/chatbot/ask', { question });
    return data;
  },
  async dashboard() {
    const { data } = await axiosInstance.get('/api/support/dashboard');
    return data;
  },
  async getQueries(params = {}) {
    const { data } = await axiosInstance.get('/api/support/queries', { params });
    return data;
  },
  async getTickets(params = {}) {
    const { data } = await axiosInstance.get('/api/support/tickets', { params });
    return data;
  },
  async getTicketById(id) {
    const { data } = await axiosInstance.get(`/api/support/tickets/${id}`);
    return data;
  },
  async updateTicketStatus(id, payload) {
    const { data } = await axiosInstance.patch(`/api/support/tickets/${id}/status`, payload);
    return data;
  },
  async createTicket(payload) {
    const { data } = await axiosInstance.post('/api/tickets', payload);
    return data;
  },
};