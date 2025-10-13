import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const TemperaturePanel = ({ isElectron }) => {
  const [temperatureData, setTemperatureData] = useState([]);
  const [currentTemp, setCurrentTemp] = useState('--');
  const [lastSetpoint, setLastSetpoint] = useState('--');
  const [avgError, setAvgError] = useState('--');
  const [dataPoints, setDataPoints] = useState(0);
  const [statusText, setStatusText] = useState('Loading...');
  const [lastUpdate, setLastUpdate] = useState('--:--:--');
  const [totalRecords, setTotalRecords] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const refreshIntervalRef = useRef(null);

  useEffect(() => {
    initChart();
    loadTemperatureData();

    if (autoRefresh) {
      setupAutoRefresh();
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      setupAutoRefresh();
    } else {
      clearAutoRefresh();
    }
  }, [autoRefresh, refreshInterval]);

  const initChart = () => {
    const ctx = chartRef.current?.getContext('2d');
    if (!ctx) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Temperature (°C)',
            data: [],
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.1
          },
          {
            label: 'Setpoint (°C)',
            data: [],
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Temperature (°C)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Time'
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Temperature Monitoring Chart'
          }
        }
      }
    });
  };

  const loadTemperatureData = async () => {
    setIsRefreshing(true);
    try {
      let data;

      if (isElectron && window.api) {
        // Use Electron IPC
        data = await window.api.invoke('get-temperature-data');
      } else {
        // Use HTTP API
        const response = await fetch('http://localhost:3001/api/temperature');
        data = await response.json();
      }

      if (data && data.length > 0) {
        setTemperatureData(data);
        updateDisplayValues(data);
        updateChart(data);
        setStatusText('Data loaded successfully');
        setLastUpdate(new Date().toLocaleTimeString());
        setTotalRecords(data.length);
      } else {
        setStatusText('No data available');
      }
    } catch (error) {
      console.error('Error loading temperature data:', error);
      setStatusText('Error loading data');
      if (!isElectron) {
        // Load simulated data for demo
        loadSimulatedData();
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadSimulatedData = () => {
    const now = new Date();
    const simulatedData = [];

    for (let i = 0; i < 20; i++) {
      const time = new Date(now.getTime() - i * 30000); // 30 seconds intervals
      const temp = 25 + Math.random() * 5; // 25-30°C
      const setpoint = 27.5;
      const error = ((temp - setpoint) / setpoint * 100);

      simulatedData.unshift({
        timestamp: time.toISOString(),
        value: temp.toFixed(1),
        setpoint: setpoint,
        error: error.toFixed(1)
      });
    }

    setTemperatureData(simulatedData);
    updateDisplayValues(simulatedData);
    updateChart(simulatedData);
    setStatusText('Simulated data (demo mode)');
    setLastUpdate(new Date().toLocaleTimeString());
    setTotalRecords(simulatedData.length);
  };

  const updateDisplayValues = (data) => {
    if (data && data.length > 0) {
      const latest = data[data.length - 1];
      setCurrentTemp(`${latest.value}°C`);
      setLastSetpoint(`${latest.setpoint}°C`);

      // Calculate average error
      const avgErr = data.reduce((sum, item) => sum + parseFloat(item.error), 0) / data.length;
      setAvgError(`${avgErr.toFixed(1)}%`);
      setDataPoints(data.length);
    }
  };

  const updateChart = (data) => {
    if (!chartInstance.current || !data) return;

    const labels = data.map(item => new Date(item.timestamp).toLocaleTimeString());
    const tempValues = data.map(item => parseFloat(item.value));
    const setpointValues = data.map(item => parseFloat(item.setpoint));

    chartInstance.current.data.labels = labels;
    chartInstance.current.data.datasets[0].data = tempValues;
    chartInstance.current.data.datasets[1].data = setpointValues;
    chartInstance.current.update();
  };

  const setupAutoRefresh = () => {
    clearAutoRefresh();
    if (refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        loadTemperatureData();
      }, refreshInterval);
    }
  };

  const clearAutoRefresh = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  const handleRefreshIntervalChange = (e) => {
    const newInterval = parseInt(e.target.value);
    setRefreshInterval(newInterval);
    if (newInterval === 0) {
      setAutoRefresh(false);
    } else if (!autoRefresh) {
      setAutoRefresh(true);
    }
  };

  const exportTemperatureData = () => {
    if (temperatureData.length === 0) {
      alert('No data to export');
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8," +
      "Time,Temperature(°C),Setpoint(°C),Error(%)\n" +
      temperatureData.map(row =>
        `${new Date(row.timestamp).toLocaleString()},${row.value},${row.setpoint},${row.error}`
      ).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `temperature_data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate tank fill percentage based on temperature
  const getTankFillPercentage = () => {
    if (currentTemp === '--') return 0;
    const temp = parseFloat(currentTemp);
    const minTemp = 20;
    const maxTemp = 30;
    return Math.max(0, Math.min(100, ((temp - minTemp) / (maxTemp - minTemp)) * 100));
  };

  return (
    <div className="tab-pane fade show active" role="tabpanel">
      <div className="main-container">
        <div className="title-bar">
          <i className="fas fa-cog"></i> CONTROL AND MONITORING TEMPERATURE
          <div className="data-refresh-indicator">
            {isRefreshing && <div className="loading-spinner"></div>}
          </div>
        </div>

        <div className="row">
          {/* Left: Tank and Controls */}
          <div className="col-lg-3 col-md-4">
            <div className="tank-container">
              <div className="tank" id="temperatureTank">
                <div
                  className="tank-fill"
                  style={{ height: `${getTankFillPercentage()}%` }}
                ></div>
                <div className="tank-temperature-label">{currentTemp}</div>
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
              <button
                className="btn btn-primary btn-sm"
                onClick={loadTemperatureData}
                disabled={isRefreshing}
              >
                <i className="fas fa-sync"></i> Refresh Data
              </button>
              <button
                className="btn btn-info btn-sm"
                onClick={toggleAutoRefresh}
              >
                <i className={`fas fa-${autoRefresh ? 'pause' : 'play'}`}></i>
                {autoRefresh ? ' Stop Auto' : ' Start Auto'}
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
                  <div className="readings-display">{currentTemp}</div>
                </div>
                <div className="col-6">
                  <label className="form-label" style={{ fontSize: '11px' }}>Last Setpoint:</label>
                  <div className="readings-display">{lastSetpoint}</div>
                </div>
              </div>
              <div className="row mb-2">
                <div className="col-6">
                  <label className="form-label" style={{ fontSize: '11px' }}>Avg Error:</label>
                  <div className="readings-display">{avgError}</div>
                </div>
                <div className="col-6">
                  <label className="form-label" style={{ fontSize: '11px' }}>Data Points:</label>
                  <div className="readings-display">{dataPoints}</div>
                </div>
              </div>
              <div className="row mb-2">
                <div className="col-12">
                  <label className="form-label" style={{ fontSize: '11px' }}>Auto Refresh:</label>
                  <select
                    className="form-select form-select-sm"
                    value={refreshInterval}
                    onChange={handleRefreshIntervalChange}
                  >
                    <option value="5000">5 seconds</option>
                    <option value="10000">10 seconds</option>
                    <option value="30000">30 seconds</option>
                    <option value="60000">1 minute</option>
                    <option value="0">Manual only</option>
                  </select>
                </div>
              </div>
              <button
                className="btn btn-primary btn-sm w-100 mb-2"
                onClick={exportTemperatureData}
              >
                <i className="fas fa-download"></i> Export Temperature Data
              </button>
            </div>

            <div className="status-panel">
              <h6 className="mb-2"><i className="fas fa-info-circle"></i> System Status</h6>
              <div className="mb-2">
                <span className="status-indicator"></span>
                <span>{statusText}</span>
              </div>
              <div className="mb-2">
                <span className="status-indicator"></span>
                <span>Database: {isElectron ? 'Connected' : 'Demo Mode'}</span>
              </div>
              <div className="mb-2">
                <small className="text-muted">Last Update:</small><br />
                <span>{lastUpdate}</span>
              </div>
              <div>
                <small className="text-muted">Total Records:</small><br />
                <span>{totalRecords}</span>
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
                  {temperatureData.length > 0 ? (
                    temperatureData.slice(-10).reverse().map((item, index) => (
                      <tr key={index}>
                        <td>{new Date(item.timestamp).toLocaleTimeString()}</td>
                        <td>{item.value}</td>
                        <td>{item.setpoint}</td>
                        <td>{item.error}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center">
                        {isRefreshing ? (
                          <>
                            <div className="loading-spinner"></div> Loading data...
                          </>
                        ) : (
                          'No data available'
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Temperature Chart */}
        <div className="row mt-3">
          <div className="col-12">
            <div className="chart-container">
              <canvas ref={chartRef} id="temperatureChart"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemperaturePanel;