import React, { useState } from 'react';

const MonitoringApp = () => {
  const [activeTab, setActiveTab] = useState('temperature');

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      {/* Connection Status */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        padding: '8px 12px',
        backgroundColor: '#28a745',
        color: 'white',
        borderRadius: '4px',
        zIndex: 1000
      }}>
        ✅ Database Connected
      </div>

      {/* Tab Navigation */}
      <div style={{ marginBottom: '20px' }}>
        <nav style={{ borderBottom: '2px solid #dee2e6' }}>
          <div style={{ display: 'flex', gap: '0' }}>
            <button
              onClick={() => setActiveTab('temperature')}
              style={{
                padding: '12px 20px',
                border: 'none',
                backgroundColor: activeTab === 'temperature' ? '#007bff' : 'transparent',
                color: activeTab === 'temperature' ? 'white' : '#495057',
                fontWeight: 'bold',
                cursor: 'pointer',
                borderRadius: '0'
              }}
            >
              🌡️ Temperature Control
            </button>
            <button
              onClick={() => setActiveTab('pressure')}
              style={{
                padding: '12px 20px',
                border: 'none',
                backgroundColor: activeTab === 'pressure' ? '#007bff' : 'transparent',
                color: activeTab === 'pressure' ? 'white' : '#495057',
                fontWeight: 'bold',
                cursor: 'pointer',
                borderRadius: '0'
              }}
            >
              📊 Pressure Monitoring
            </button>
            <button
              onClick={() => setActiveTab('database')}
              style={{
                padding: '12px 20px',
                border: 'none',
                backgroundColor: activeTab === 'database' ? '#007bff' : 'transparent',
                color: activeTab === 'database' ? 'white' : '#495057',
                fontWeight: 'bold',
                cursor: 'pointer',
                borderRadius: '0'
              }}
            >
              💾 Database
            </button>
          </div>
        </nav>
      </div>

      {/* Tab Content */}
      <div style={{ backgroundColor: 'white', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        {activeTab === 'temperature' && (
          <div>
            <h2>🔥 CONTROL AND MONITORING TEMPERATURE</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
              <div>
                <h4>Tank Visualization</h4>
                <div style={{
                  width: '80px',
                  height: '160px',
                  border: '3px solid #333',
                  backgroundColor: '#f0f0f0',
                  margin: '0 auto',
                  position: 'relative',
                  borderRadius: '0 0 10px 10px'
                }}>
                  <div style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '0',
                    width: '100%',
                    height: '60%',
                    background: 'linear-gradient(to top, #ff6b6b, #ffa500)',
                    borderRadius: '0 0 7px 7px'
                  }}></div>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontWeight: 'bold',
                    color: '#333'
                  }}>
                    25.4°C
                  </div>
                </div>
              </div>
              <div>
                <h4>Live Readings</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Current Temp:</label>
                    <div style={{
                      backgroundColor: '#343a40',
                      color: '#00ff00',
                      padding: '6px',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      textAlign: 'center'
                    }}>
                      25.4°C
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Setpoint:</label>
                    <div style={{
                      backgroundColor: '#343a40',
                      color: '#00ff00',
                      padding: '6px',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      textAlign: 'center'
                    }}>
                      27.5°C
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '15px' }}>
                  <button style={{
                    padding: '8px 16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    marginRight: '10px',
                    cursor: 'pointer'
                  }}>
                    🔄 Refresh Data
                  </button>
                  <button style={{
                    padding: '8px 16px',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}>
                    ⏸️ Stop Auto
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pressure' && (
          <div>
            <h2>📊 SAFETY PRESSURE MONITORING SYSTEM</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
              <div>
                <h4>Pressure Gauge</h4>
                <div style={{
                  width: '150px',
                  height: '75px',
                  border: '4px solid #333',
                  borderBottom: 'none',
                  borderRadius: '75px 75px 0 0',
                  background: 'linear-gradient(90deg, #ff0000 0%, #ffff00 50%, #00ff00 100%)',
                  margin: '0 auto',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    bottom: '-20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'white',
                    border: '2px solid #333',
                    borderRadius: '50%',
                    width: '50px',
                    height: '50px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>1.3</div>
                    <div style={{ fontSize: '10px', color: '#666' }}>Bar</div>
                  </div>
                </div>
                <div style={{ textAlign: 'center', marginTop: '30px' }}>
                  <h6>Current Pressure: <span>1.3 Bar</span></h6>
                  <small>Range: 0-2 Bar</small>
                </div>
              </div>
              <div>
                <h4>Live Readings</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Current Pressure:</span>
                    <span>1.3 Bar</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Last Setpoint:</span>
                    <span>1.5 Bar</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Status:</span>
                    <span style={{
                      backgroundColor: '#28a745',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '10px'
                    }}>
                      NORMAL
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'database' && (
          <div>
            <h2>💾 DATABASE MANAGEMENT</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '20px' }}>
              <div>
                <h4>Temperature Records</h4>
                <div style={{ padding: '10px', backgroundColor: '#d1ecf1', borderRadius: '4px' }}>
                  Records: 150
                </div>
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <button style={{
                    padding: '6px 12px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}>
                    🔄 Load All Records
                  </button>
                  <button style={{
                    padding: '6px 12px',
                    backgroundColor: '#ffc107',
                    color: '#212529',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}>
                    ⏱️ Load Recent (100)
                  </button>
                  <button style={{
                    padding: '6px 12px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}>
                    🗑️ Clear All Records
                  </button>
                </div>
              </div>
              <div>
                <h4>Pressure Records</h4>
                <div style={{ padding: '10px', backgroundColor: '#d1ecf1', borderRadius: '4px' }}>
                  Records: 200
                </div>
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <button style={{
                    padding: '6px 12px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}>
                    🔄 Load All Records
                  </button>
                  <button style={{
                    padding: '6px 12px',
                    backgroundColor: '#ffc107',
                    color: '#212529',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}>
                    ⏱️ Load Recent (100)
                  </button>
                  <button style={{
                    padding: '6px 12px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}>
                    🗑️ Clear All Records
                  </button>
                </div>
              </div>
              <div>
                <h4>Export Data</h4>
                <button style={{
                  padding: '10px 20px',
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  width: '100%'
                }}>
                  💾 Export All Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonitoringApp;