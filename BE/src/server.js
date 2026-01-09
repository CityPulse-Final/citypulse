const { server } = require('./app');
const { initDatabase } = require('./db/connection');
const { initMockData } = require('./db/mockStore');

const PORT = process.env.PORT || 3001;
const USE_MOCK = process.env.USE_MOCK === 'true' || !process.env.DATABASE_URL;

async function start() {
  try {
    if (USE_MOCK) {
      console.log('Running in MOCK mode (no database)');
      initMockData();
    } else {
      await initDatabase();
      console.log('Database connected');
    }
    
    server.listen(PORT, () => {
      console.log(`CityPulse backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
