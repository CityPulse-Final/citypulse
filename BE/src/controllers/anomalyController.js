const { query } = require('../db/connection');
const mockStore = require('../db/mockStore');

const USE_MOCK = process.env.USE_MOCK === 'true' || !process.env.DATABASE_URL;

exports.getAnomalies = async (req, res) => {
  try {
    if (USE_MOCK) {
      return res.json(mockStore.getAnomalies());
    }
    
    const { hours = 24, limit = 50 } = req.query;
    
    const result = await query(`
      SELECT a.*, n.name, n.sector
      FROM anomalies a
      JOIN nodes n ON a.node_id = n.id
      WHERE a.time > NOW() - INTERVAL '${parseInt(hours)} hours'
      ORDER BY a.time DESC
      LIMIT $1
    `, [parseInt(limit)]);
    
    const anomalies = result.rows.map(row => ({
      id: row.id,
      timestamp: new Date(row.time).getTime(),
      nodeId: row.node_id,
      nodeName: row.name,
      sector: row.sector,
      anomalyScore: parseFloat(row.anomaly_score),
      signals: row.signals,
      explanation: row.explanation,
      stressIndex: row.stress_index
    }));
    
    res.json(anomalies);
  } catch (err) {
    console.error('Anomalies error:', err);
    res.status(500).json({ error: 'Failed to fetch anomalies' });
  }
};

exports.getNodeAnomalies = async (req, res) => {
  try {
    const { nodeId } = req.params;
    
    if (USE_MOCK) {
      const anomalies = mockStore.getAnomalies().filter(a => a.nodeId === nodeId);
      return res.json(anomalies);
    }
    
    const { hours = 24 } = req.query;
    
    const result = await query(`
      SELECT a.*, n.name, n.sector
      FROM anomalies a
      JOIN nodes n ON a.node_id = n.id
      WHERE a.node_id = $1 AND a.time > NOW() - INTERVAL '${parseInt(hours)} hours'
      ORDER BY a.time DESC
      LIMIT 20
    `, [nodeId]);
    
    const anomalies = result.rows.map(row => ({
      id: row.id,
      timestamp: new Date(row.time).getTime(),
      nodeId: row.node_id,
      nodeName: row.name,
      sector: row.sector,
      anomalyScore: parseFloat(row.anomaly_score),
      signals: row.signals,
      explanation: row.explanation,
      stressIndex: row.stress_index
    }));
    
    res.json(anomalies);
  } catch (err) {
    console.error('Node anomalies error:', err);
    res.status(500).json({ error: 'Failed to fetch node anomalies' });
  }
};
