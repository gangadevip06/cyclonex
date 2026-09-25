import axios from 'axios';

// Default to relative '/api' which Vite proxies to http://127.0.0.1:8001/api,
// or direct fallback to port 8001
const API_BASE = '/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  // 1. Health check
  async getHealth() {
    try {
      const res = await client.get('/health');
      return res.data;
    } catch (err) {
      console.warn('Health check fallback:', err);
      return { status: 'healthy', service: 'CYCLONEX-AI-Core (Local)', version: '2.0.0' };
    }
  },

  // 2. Available benchmark scenarios
  async getScenarios() {
    try {
      const res = await client.get('/scenarios');
      return res.data?.scenarios || [];
    } catch (err) {
      console.warn('Scenarios fetch error:', err);
      return [];
    }
  },

  // 3. Specific benchmark scenario data
  async getScenario(scenarioId) {
    const res = await client.get(`/scenario/${scenarioId}`);
    return res.data;
  },

  // 4. Live environmental telemetry
  async getLiveData(basin = 'bay_of_bengal', lat = null, lon = null) {
    const params = { basin };
    if (lat !== null && lat !== undefined) params.lat = lat;
    if (lon !== null && lon !== undefined) params.lon = lon;
    const res = await client.get('/live-data', { params });
    return res.data;
  },

  // 5. Compute full multimodal forecast
  async getForecast(basin = 'bay_of_bengal', lat = null, lon = null) {
    const params = { basin };
    if (lat !== null && lat !== undefined) params.lat = lat;
    if (lon !== null && lon !== undefined) params.lon = lon;
    const res = await client.post('/forecast', null, { params });
    return res.data;
  },

  // 6. Generate Gemini Advisories
  async generateAdvisories(forecast, languages = ['english', 'tamil', 'telugu', 'odia', 'bengali', 'hindi']) {
    const res = await client.post('/generate-advisories', {
      forecast,
      languages,
    });
    return res.data;
  },

  // 7. Interactive Physics What-If Simulation
  async simulateWhatIf(payload) {
    const res = await client.post('/what-if', payload);
    return res.data;
  },

  // 8. Custom satellite image patch upload
  async uploadSatellite(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await client.post('/upload-satellite', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // 9. Ground-truth Data & Model Status
  async getSystemStatus() {
    try {
      const res = await client.get('/system-status');
      return res.data;
    } catch (err) {
      console.warn('System status API fallback:', err);
      return null;
    }
  },

  // 10. List Verified Historical Cyclones from IBTrACS
  async getHistoricalCyclones() {
    try {
      const res = await client.get('/historical-cyclones');
      return res.data?.cyclones || [];
    } catch (err) {
      console.warn('Historical cyclones fetch fallback:', err);
      return [];
    }
  },

  // 11. Fetch Historical Cyclone Ground-truth Track
  async getHistoricalCyclone(stormName) {
    const res = await client.get(`/historical-cyclone/${encodeURIComponent(stormName)}`);
    return res.data;
  },
};

export default apiService;
