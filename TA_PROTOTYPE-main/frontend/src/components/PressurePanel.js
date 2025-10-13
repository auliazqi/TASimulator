import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const PressurePanel = ({ isElectron }) => {
  const [pressureData, setPressureData] = useState([]);
  const [currentPressure, setCurrentPressure] = useState('--');
  const [pressureSetpoint, setPressureSetpoint] = useState('--');
  const [avgError, setAvgError] = useState('--');
  const [dataPoints, setDataPoints] = useState(0);
  const [lastUpdate, setLastUpdate] = useState('--:--:--');
  const [totalRecords, setTotalRecords] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const refreshIntervalRef = useRef(null);

  useEffect(() => {
    initChart();
    loadPressureData();

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
    if (autoRefresh) {
      setupAutoRefresh();
    } else {
      clearAutoRefresh();
    }
  }, [autoRefresh]);

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
            label: 'Pressure (Bar)',
            data: [],
            borderColor: 'rgb(255, 206, 86)',
            backgroundColor: 'rgba(255, 206, 86, 0.2)',
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
            max: 2,
            title: {
              display: true,
              text: 'Pressure (Bar)'
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
            text: 'Pressure Monitoring Chart'
          }
        }
      }
    });
  };

  const loadPressureData = async () => {
    setIsRefreshing(true);
    try {
      let data;

      if (isElectron && window.api) {
        // Use Electron IPC
        data = await window.api.invoke('get-pressure-data');
      } else {
        // Use HTTP API
        const response = await fetch('http://localhost:3001/api/pressure');
        data = await response.json();
      }

      if (data && data.length > 0) {
        setPressureData(data);
        updateDisplayValues(data);
        updateChart(data);
        setLastUpdate(new Date().toLocaleTimeString());
        setTotalRecords(data.length);
      } else {
        // Load simulated data for demo
        loadSimulatedData();
      }
    } catch (error) {
      console.error('Error loading pressure data:', error);
      // Load simulated data for demo
      loadSimulatedData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadSimulatedData = () => {
    const now = new Date();
    const simulatedData = [];

    for (let i = 0; i < 20; i++) {
      const time = new Date(now.getTime() - i * 30000); // 30 seconds intervals
      const pressure = 1.2 + Math.random() * 0.4; // 1.2-1.6 Bar
      const status = pressure > 1.8 ? 'HIGH' : pressure < 0.5 ? 'LOW' : 'NORMAL';

      simulatedData.unshift({
        timestamp: time.toISOString(),
        value: pressure.toFixed(2),
        status: status
      });
    }

    setPressureData(simulatedData);
    updateDisplayValues(simulatedData);
    updateChart(simulatedData);
    setLastUpdate(new Date().toLocaleTimeString());
    setTotalRecords(simulatedData.length);
  };

  const updateDisplayValues = (data) => {
    if (data && data.length > 0) {
      const latest = data[data.length - 1];
      setCurrentPressure(`${latest.value} Bar`);
      setPressureSetpoint('1.5 Bar'); // Default setpoint

      // Calculate average error (assuming 1.5 Bar setpoint)
      const setpoint = 1.5;
      const avgErr = data.reduce((sum, item) => {
        const error = Math.abs(parseFloat(item.value) - setpoint) / setpoint * 100;
        return sum + error;
      }, 0) / data.length;
      setAvgError(`${avgErr.toFixed(1)}%`);
      setDataPoints(data.length);
    }
  };

  const updateChart = (data) => {
    if (!chartInstance.current || !data) return;

    const labels = data.map(item => new Date(item.timestamp).toLocaleTimeString());
    const pressureValues = data.map(item => parseFloat(item.value));

    chartInstance.current.data.labels = labels;
    chartInstance.current.data.datasets[0].data = pressureValues;
    chartInstance.current.update();
  };

  const setupAutoRefresh = () => {
    clearAutoRefresh();
    refreshIntervalRef.current = setInterval(() => {
      loadPressureData();
    }, 5000); // 5 seconds
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

  const exportPressureData = () => {
    if (pressureData.length === 0) {
      alert('No data to export');
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8," +
      "Time,Pressure(Bar),Status\n" +
      pressureData.map(row =>
        `${new Date(row.timestamp).toLocaleString()},${row.value},${row.status}`
      ).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pressure_data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate gauge needle rotation
  const getNeedleRotation = () => {
    if (currentPressure === '--') return 0;
    const pressure = parseFloat(currentPressure);
    const maxPressure = 2.0;
    const angle = (pressure / maxPressure) * 180; // 0-180 degrees
    return Math.max(0, Math.min(180, angle));
  };

  return (
    <div className="tab-pane fade" role="tabpanel">
      <div className="main-container">
        <div className="title-bar">
          <i className="fas fa-tachometer-alt"></i> SAFETY PRESSURE MONITORING SYSTEM
          <div className="data-refresh-indicator">
            {isRefreshing && <div className="loading-spinner"></div>}
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
                  style={{ transform: `rotate(${getNeedleRotation()}deg)` }}
                ></div>
                <div className="gauge-center">
                  <div className="gauge-value">
                    {currentPressure !== '--' ? parseFloat(currentPressure).toFixed(1) : '--'}
                  </div>
                  <div className="gauge-unit">Bar</div>
                </div>
              </div>
            </div>
            <div className="text-center mt-2">
              <h6>Current Pressure: <span>{currentPressure}</span></h6>
              <small className="text-muted">Range: 0-2 Bar</small>
            </div>
            <div className="control-buttons mt-3">
              <button
                className="btn btn-primary btn-sm"
                onClick={loadPressureData}
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

          {/* Center: Status Information */}
          <div className="col-lg-4 col-md-6">
            <div className="status-panel">
              <h6 className="mb-3"><i className="fas fa-chart-line"></i> Live Readings</h6>
              <div className="mb-2">
                <div className="d-flex justify-content-between">
                  <span>Current Pressure:</span>
                  <span>{currentPressure}</span>
                </div>
              </div>
              <div className="mb-2">
                <div className="d-flex justify-content-between">
                  <span>Last Setpoint:</span>
                  <span>{pressureSetpoint}</span>
                </div>
              </div>
              <div className="mb-2">
                <div className="d-flex justify-content-between">
                  <span>Avg Error:</span>
                  <span>{avgError}</span>
                </div>
              </div>
              <div className="mb-2">
                <div className="d-flex justify-content-between">
                  <span>Data Points:</span>
                  <span>{dataPoints}</span>
                </div>
              </div>
              <div className="mb-2">
                <div className="d-flex justify-content-between">
                  <span>Last Update:</span>
                  <span>{lastUpdate}</span>
                </div>
              </div>
              <div>
                <div className="d-flex justify-content-between">
                  <span>Total Records:</span>
                  <span>{totalRecords}</span>
                </div>
              </div>
            </div>

            <div className="control-panel mt-3">
              <h6 className="mb-3"><i className="fas fa-cogs"></i> Export Options</h6>
              <button
                className="btn btn-info btn-sm w-100"
                onClick={exportPressureData}
              >
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
                  {pressureData.length > 0 ? (
                    pressureData.slice(-10).reverse().map((item, index) => (
                      <tr key={index}>
                        <td>{new Date(item.timestamp).toLocaleTimeString()}</td>
                        <td>{item.value}</td>
                        <td>
                          <span className={`status-badge ${item.status.toLowerCase()}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center">
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

        {/* Pressure Chart */}
        <div className="row mt-3">
          <div className="col-12">
            <div className="chart-container">
              <canvas ref={chartRef} id="pressureChart"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PressurePanel;