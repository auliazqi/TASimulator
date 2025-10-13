import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import '../monitoring.css';

const MonitoringApp = () => {
  const [activeTab, setActiveTab] = useState('temperature');
  const [connected, setConnected] = useState(false);
  const [temperatureData, setTemperatureData] = useState({
    current: '--',
    setpoint: '--',
    avgError: '--',
    dataPoints: 0,
    lastUpdate: '--:--:--',
    totalRecords: 0,
    tableData: []
  });
  const [pressureData, setPressureData] = useState({
    current: '--',
    setpoint: '--',
    avgError: '--',
    dataPoints: 0,
    lastUpdate: '--:--:--',
    totalRecords: 0,
    tableData: []
  });

  const temperatureChartRef = useRef(null);
  const pressureChartRef = useRef(null);
  const temperatureChartInstance = useRef(null);
  const pressureChartInstance = useRef(null);

  // Check if running in Electron
  const isElectron = window.api !== undefined;

  useEffect(() => {
    checkDatabaseConnection();
    loadTemperatureData();
    loadPressureData();

    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      loadTemperatureData();
      loadPressureData();
    }, 5000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkDatabaseConnection = async () => {
    try {
      if (isElectron && window.api) {
        const result = await window.api.invoke('check-database-connection');
        setConnected(result.connected);
      } else {
        // Simulate connection for web version
        setConnected(true);
      }
    } catch (error) {
      console.error('Database connection check failed:', error);
      setConnected(false);
    }
  };

  const loadTemperatureData = async () => {
    try {
      if (isElectron && window.api) {
        const data = await window.api.invoke('get-temperature-data', 50);
        if (data && data.length > 0) {
          const latest = data[0];
          const avgError = data.reduce((sum, item) => sum + Math.abs(item.error || 0), 0) / data.length;

          setTemperatureData({
            current: latest.value?.toFixed(1) || '--',
            setpoint: latest.setpoint?.toFixed(1) || '--',
            avgError: avgError.toFixed(1),
            dataPoints: data.length,
            lastUpdate: new Date().toLocaleTimeString(),
            totalRecords: data.length,
            tableData: data.slice(0, 20)
          });

          updateTemperatureChart(data);
        }
      } else {
        // Simulate data for web version
        const simulatedTemp = 25.4 + (Math.random() - 0.5) * 2;
        setTemperatureData({
          current: simulatedTemp.toFixed(1),
          setpoint: '27.5',
          avgError: '2.1',
          dataPoints: 150,
          lastUpdate: new Date().toLocaleTimeString(),
          totalRecords: 150,
          tableData: generateSimulatedData('temperature', 20)
        });
      }
    } catch (error) {
      console.error('Failed to load temperature data:', error);
    }
  };

  const loadPressureData = async () => {
    try {
      if (isElectron && window.api) {
        const data = await window.api.invoke('get-pressure-data', 50);
        if (data && data.length > 0) {
          const latest = data[0];
          const avgError = data.reduce((sum, item) => sum + Math.abs(item.error || 0), 0) / data.length;

          setPressureData({
            current: latest.value?.toFixed(1) || '--',
            setpoint: latest.setpoint?.toFixed(1) || '--',
            avgError: avgError.toFixed(1),
            dataPoints: data.length,
            lastUpdate: new Date().toLocaleTimeString(),
            totalRecords: data.length,
            tableData: data.slice(0, 20)
          });

          updatePressureChart(data);
        }
      } else {
        // Simulate data for web version
        const simulatedPressure = 1.3 + (Math.random() - 0.5) * 0.2;
        setPressureData({
          current: simulatedPressure.toFixed(1),
          setpoint: '1.5',
          avgError: '1.8',
          dataPoints: 200,
          lastUpdate: new Date().toLocaleTimeString(),
          totalRecords: 200,
          tableData: generateSimulatedData('pressure', 20)
        });
      }
    } catch (error) {
      console.error('Failed to load pressure data:', error);
    }
  };

  const generateSimulatedData = (type, count) => {
    const data = [];
    for (let i = 0; i < count; i++) {
      const now = new Date();
      now.setMinutes(now.getMinutes() - i);

      if (type === 'temperature') {
        const value = 25.4 + (Math.random() - 0.5) * 2;
        const setpoint = 27.5;
        const error = ((value - setpoint) / setpoint * 100);
        data.push({
          timestamp: now.toLocaleTimeString(),
          value: value.toFixed(1),
          setpoint: setpoint.toFixed(1),
          error: error.toFixed(1)
        });
      } else {
        const value = 1.3 + (Math.random() - 0.5) * 0.2;
        data.push({
          timestamp: now.toLocaleTimeString(),
          value: value.toFixed(1),
          status: value > 1.8 ? 'HIGH' : value < 0.5 ? 'LOW' : 'NORMAL'
        });
      }
    }
    return data;
  };

  const updateTemperatureChart = (data) => {
    if (temperatureChartRef.current) {
      const ctx = temperatureChartRef.current.getContext('2d');

      if (temperatureChartInstance.current) {
        temperatureChartInstance.current.destroy();
      }

      temperatureChartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.slice(0, 20).reverse().map(item =>
            new Date(item.timestamp).toLocaleTimeString()
          ),
          datasets: [{
            label: 'Temperature (°C)',
            data: data.slice(0, 20).reverse().map(item => item.value),
            borderColor: '#007bff',
            backgroundColor: 'rgba(0, 123, 255, 0.1)',
            tension: 0.4
          }, {
            label: 'Setpoint (°C)',
            data: data.slice(0, 20).reverse().map(item => item.setpoint),
            borderColor: '#28a745',
            backgroundColor: 'rgba(40, 167, 69, 0.1)',
            borderDash: [5, 5],
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: false,
              title: {
                display: true,
                text: 'Temperature (°C)'
              }
            }
          }
        }
      });
    }
  };

  const updatePressureChart = (data) => {
    if (pressureChartRef.current) {
      const ctx = pressureChartRef.current.getContext('2d');

      if (pressureChartInstance.current) {
        pressureChartInstance.current.destroy();
      }

      pressureChartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.slice(0, 20).reverse().map(item =>
            new Date(item.timestamp).toLocaleTimeString()
          ),
          datasets: [{
            label: 'Pressure (Bar)',
            data: data.slice(0, 20).reverse().map(item => item.value),
            borderColor: '#17a2b8',
            backgroundColor: 'rgba(23, 162, 184, 0.1)',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 2,
              title: {
                display: true,
                text: 'Pressure (Bar)'
              }
            }
          }
        }
      });
    }
  };

  const getTankFillHeight = () => {
    const temp = parseFloat(temperatureData.current) || 20;
    const minTemp = 20;
    const maxTemp = 30;
    const fillPercent = Math.max(0, Math.min(100, ((temp - minTemp) / (maxTemp - minTemp)) * 100));
    return `${fillPercent}%`;
  };

  const getTankFillClass = () => {
    const temp = parseFloat(temperatureData.current) || 20;
    return temp > 27 ? 'tank-heating' : '';
  };

  const getPressureNeedleRotation = () => {
    const pressure = parseFloat(pressureData.current) || 0;
    const maxPressure = 2;
    const rotation = (pressure / maxPressure) * 180;
    return `translate(-50%, -100%) rotate(${rotation}deg)`;
  };

  return (
    <div style={{ fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', fontSize: '12px', backgroundColor: '#f0f0f0' }}>
      {/* Connection Status Indicator */}
      <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
        <i className="fas fa-database"></i> Database {connected ? 'Connected' : 'Disconnected'}
      </div>

      <div className="container-fluid">
        {/* Tab Navigation */}
        <ul className="nav nav-tabs" role="tablist">
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === 'temperature' ? 'active' : ''}`}
              onClick={() => setActiveTab('temperature')}
              type="button"
              role="tab"
            >
              <i className="fas fa-thermometer-half"></i> Temperature Control
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === 'pressure' ? 'active' : ''}`}
              onClick={() => setActiveTab('pressure')}
              type="button"
              role="tab"
            >
              <i className="fas fa-tachometer-alt"></i> Pressure Monitoring
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === 'database' ? 'active' : ''}`}
              onClick={() => setActiveTab('database')}
              type="button"
              role="tab"
            >
              <i className="fas fa-database"></i> Database
            </button>
          </li>
        </ul>

        <div className="tab-content">
          {/* Temperature Control Panel */}
          {activeTab === 'temperature' && (
            <div className="tab-pane fade show active" role="tabpanel">
              <div className="main-container">
                <div className="title-bar">
                  <i className="fas fa-cog"></i> CONTROL AND MONITORING TEMPERATURE
                  <div className="data-refresh-indicator">
                    <div className="loading-spinner"></div>
                  </div>
                </div>

                <div className="row">
                  {/* Left: Tank and Controls */}
                  <div className="col-lg-3 col-md-4">
                    <div className="tank-container">
                      <div className="tank">
                        <div
                          className={`tank-fill ${getTankFillClass()}`}
                          style={{ height: getTankFillHeight() }}
                        ></div>
                        <div className="tank-temperature-label">{temperatureData.current}°C</div>
                      </div>
                      <div className="temperature-indicator">
                        <div>HOT</div>
                        <div>30°C</div>
                        <div style={{ margin: '10px 0' }}>|</div>
                        <div style={{ margin: '10px 0' }}>|</div>
                        <div style={{ margin: '10px 0' }}>|</div>
                        <div>COLD</div>
                        <div>20°C</div>
                      </div>
                    </div>
                    <div className="control-buttons">
                      <button className="btn btn-primary btn-sm" onClick={loadTemperatureData}>
                        <i className="fas fa-sync"></i> Refresh Data
                      </button>
                      <button className="btn btn-info btn-sm">
                        <i className="fas fa-pause"></i> Stop Auto
                      </button>
                    </div>
                  </div>

                  {/* Center: Control Parameters */}
                  <div className="col-lg-4 col-md-4">
                    <div className="control-panel">
                      <h6 className="mb-3"><i className="fas fa-sliders-h"></i> Live Readings</h6>
                      <div className="row mb-2">
                        <div className="col-6">
                          <label className="form-label" style={{ fontSize: '11px' }}>Current Temp:</label>
                          <div className="readings-display">{temperatureData.current}°C</div>
                        </div>
                        <div className="col-6">
                          <label className="form-label" style={{ fontSize: '11px' }}>Last Setpoint:</label>
                          <div className="readings-display">{temperatureData.setpoint}°C</div>
                        </div>
                      </div>
                      <div className="row mb-2">
                        <div className="col-6">
                          <label className="form-label" style={{ fontSize: '11px' }}>Avg Error:</label>
                          <div className="readings-display">{temperatureData.avgError}%</div>
                        </div>
                        <div className="col-6">
                          <label className="form-label" style={{ fontSize: '11px' }}>Data Points:</label>
                          <div className="readings-display">{temperatureData.dataPoints}</div>
                        </div>
                      </div>
                      <div className="row mb-2">
                        <div className="col-12">
                          <label className="form-label" style={{ fontSize: '11px' }}>Auto Refresh:</label>
                          <select className="form-select form-select-sm">
                            <option value="5000">5 seconds</option>
                            <option value="10000">10 seconds</option>
                            <option value="30000">30 seconds</option>
                            <option value="60000">1 minute</option>
                            <option value="0">Manual only</option>
                          </select>
                        </div>
                      </div>
                      <button className="btn btn-primary btn-sm w-100 mb-2">
                        <i className="fas fa-download"></i> Export Temperature Data
                      </button>
                    </div>

                    <div className="status-panel">
                      <h6 className="mb-2"><i className="fas fa-info-circle"></i> System Status</h6>
                      <div className="mb-2">
                        <span className="status-indicator status-on"></span>
                        <span>Temperature: Online</span>
                      </div>
                      <div className="mb-2">
                        <span className={`status-indicator ${connected ? 'status-on' : 'status-off'}`}></span>
                        <span>Database: {connected ? 'Connected' : 'Disconnected'}</span>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted">Last Update:</small><br />
                        <span>{temperatureData.lastUpdate}</span>
                      </div>
                      <div>
                        <small className="text-muted">Total Records:</small><br />
                        <span>{temperatureData.totalRecords}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Data Table */}
                  <div className="col-lg-5 col-md-4">
                    <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      <table className="table table-bordered data-table">
                        <thead className="sticky-top">
                          <tr>
                            <th>Time</th>
                            <th>Value (°C)</th>
                            <th>Setpoint (°C)</th>
                            <th>Error (%)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {temperatureData.tableData.map((row, index) => (
                            <tr key={index}>
                              <td>{row.timestamp}</td>
                              <td>{row.value}</td>
                              <td>{row.setpoint}</td>
                              <td>{row.error}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Temperature Chart */}
                <div className="row mt-3">
                  <div className="col-12">
                    <div className="chart-container">
                      <canvas ref={temperatureChartRef}></canvas>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pressure Monitoring Panel */}
          {activeTab === 'pressure' && (
            <div className="tab-pane fade show active" role="tabpanel">
              <div className="main-container">
                <div className="title-bar">
                  <i className="fas fa-tachometer-alt"></i> SAFETY PRESSURE MONITORING SYSTEM
                  <div className="data-refresh-indicator">
                    <div className="loading-spinner"></div>
                  </div>
                </div>

                <div className="row">
                  {/* Left: Pressure Gauge */}
                  <div className="col-lg-4 col-md-6">
                    <div className="gauge-container">
                      <div className="gauge">
                        <div className="gauge-scale"></div>
                        <div
                          className="gauge-needle"
                          style={{ transform: getPressureNeedleRotation() }}
                        ></div>
                        <div className="gauge-center">
                          <div className="gauge-value">{pressureData.current}</div>
                          <div className="gauge-unit">Bar</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-center mt-2">
                      <h6>Current Pressure: <span>{pressureData.current}</span> Bar</h6>
                      <small className="text-muted">Range: 0-2 Bar</small>
                    </div>
                    <div className="control-buttons mt-3">
                      <button className="btn btn-primary btn-sm" onClick={loadPressureData}>
                        <i className="fas fa-sync"></i> Refresh Data
                      </button>
                      <button className="btn btn-info btn-sm">
                        <i className="fas fa-pause"></i> Stop Auto
                      </button>
                    </div>
                  </div>

                  {/* Center: Status Information */}
                  <div className="col-lg-4 col-md-6">
                    <div className="status-panel">
                      <h6 className="mb-3"><i className="fas fa-chart-line"></i> Live Readings</h6>
                      <div className="mb-2">
                        <div className="d-flex justify-content-between">
                          <span>Current Pressure:</span>
                          <span>{pressureData.current} Bar</span>
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="d-flex justify-content-between">
                          <span>Last Setpoint:</span>
                          <span>{pressureData.setpoint} Bar</span>
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="d-flex justify-content-between">
                          <span>Avg Error:</span>
                          <span>{pressureData.avgError}%</span>
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="d-flex justify-content-between">
                          <span>Data Points:</span>
                          <span>{pressureData.dataPoints}</span>
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="d-flex justify-content-between">
                          <span>Last Update:</span>
                          <span>{pressureData.lastUpdate}</span>
                        </div>
                      </div>
                      <div>
                        <div className="d-flex justify-content-between">
                          <span>Total Records:</span>
                          <span>{pressureData.totalRecords}</span>
                        </div>
                      </div>
                    </div>

                    <div className="control-panel mt-3">
                      <h6 className="mb-3"><i className="fas fa-cogs"></i> Export Options</h6>
                      <button className="btn btn-info btn-sm w-100">
                        <i className="fas fa-file-excel"></i> Export Pressure Data
                      </button>
                    </div>
                  </div>

                  {/* Right: Recent Data Table */}
                  <div className="col-lg-4 col-md-12">
                    <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      <table className="table table-bordered data-table">
                        <thead className="sticky-top">
                          <tr>
                            <th>Time</th>
                            <th>Pressure (Bar)</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pressureData.tableData.map((row, index) => (
                            <tr key={index}>
                              <td>{row.timestamp}</td>
                              <td>{row.value}</td>
                              <td>
                                <span style={{
                                  backgroundColor: row.status === 'NORMAL' ? '#28a745' :
                                                 row.status === 'HIGH' ? '#dc3545' : '#ffc107',
                                  color: 'white',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '10px'
                                }}>
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Pressure Chart */}
                <div className="row mt-3">
                  <div className="col-12">
                    <div className="chart-container">
                      <canvas ref={pressureChartRef}></canvas>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Database Panel */}
          {activeTab === 'database' && (
            <div className="tab-pane fade show active" role="tabpanel">
              <div className="main-container">
                <div className="title-bar">
                  <i className="fas fa-database"></i> DATABASE MANAGEMENT
                </div>

                <div className="row">
                  <div className="col-md-4">
                    <div className="control-panel">
                      <h6 className="mb-3"><i className="fas fa-thermometer-half"></i> Temperature Records</h6>
                      <div className="mb-3">
                        <button className="btn btn-success btn-sm w-100 mb-1">
                          <i className="fas fa-sync"></i> Load All Records
                        </button>
                        <button className="btn btn-warning btn-sm w-100 mb-1">
                          <i className="fas fa-clock"></i> Load Recent (100)
                        </button>
                        <button className="btn btn-danger btn-sm w-100 mb-1">
                          <i className="fas fa-trash"></i> Clear All Records
                        </button>
                      </div>
                      <div className="alert alert-info">Records: {temperatureData.totalRecords}</div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="control-panel">
                      <h6 className="mb-3"><i className="fas fa-tachometer-alt"></i> Pressure Records</h6>
                      <div className="mb-3">
                        <button className="btn btn-success btn-sm w-100 mb-1">
                          <i className="fas fa-sync"></i> Load All Records
                        </button>
                        <button className="btn btn-warning btn-sm w-100 mb-1">
                          <i className="fas fa-clock"></i> Load Recent (100)
                        </button>
                        <button className="btn btn-danger btn-sm w-100 mb-1">
                          <i className="fas fa-trash"></i> Clear All Records
                        </button>
                      </div>
                      <div className="alert alert-info">Records: {pressureData.totalRecords}</div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="control-panel">
                      <h6 className="mb-3"><i className="fas fa-filter"></i> Filters</h6>
                      <div className="mb-2">
                        <label className="form-label" style={{ fontSize: '11px' }}>Date Range:</label>
                        <input type="date" className="form-control form-control-sm mb-1" />
                        <input type="date" className="form-control form-control-sm" />
                      </div>
                      <div className="mb-2">
                        <label className="form-label" style={{ fontSize: '11px' }}>Record Type:</label>
                        <select className="form-select form-select-sm">
                          <option value="">All Types</option>
                          <option value="temperature">Temperature</option>
                          <option value="pressure">Pressure</option>
                        </select>
                      </div>
                      <button className="btn btn-primary btn-sm w-100">
                        <i className="fas fa-search"></i> Apply Filters
                      </button>
                    </div>
                  </div>
                </div>

                <div className="row mt-3">
                  <div className="col-12">
                    <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                      <table className="table table-bordered data-table">
                        <thead className="sticky-top">
                          <tr>
                            <th>ID</th>
                            <th>Type</th>
                            <th>Timestamp</th>
                            <th>Value</th>
                            <th>Setpoint</th>
                            <th>Error (%)</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td colSpan="7" className="text-center">
                              <div className="loading-spinner"></div> Loading database records...
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonitoringApp;