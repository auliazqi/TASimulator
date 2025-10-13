import React, { useState, useEffect } from 'react';

const DatabasePanel = ({ isElectron }) => {
  const [databaseRecords, setDatabaseRecords] = useState([]);
  const [tempRecordCount, setTempRecordCount] = useState('Loading...');
  const [pressureRecordCount, setPressureRecordCount] = useState('Loading...');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterRecordType, setFilterRecordType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadRecordCounts();
    loadRecentRecords();
  }, []);

  const loadRecordCounts = async () => {
    try {
      if (isElectron && window.api) {
        const tempCount = await window.api.invoke('get-record-count', 'temperature');
        const pressureCount = await window.api.invoke('get-record-count', 'pressure');
        setTempRecordCount(`Records: ${tempCount}`);
        setPressureRecordCount(`Records: ${pressureCount}`);
      } else {
        // Simulate record counts for demo
        setTempRecordCount('Records: 150 (Demo)');
        setPressureRecordCount('Records: 200 (Demo)');
      }
    } catch (error) {
      console.error('Error loading record counts:', error);
      setTempRecordCount('Records: Error');
      setPressureRecordCount('Records: Error');
    }
  };

  const loadRecentRecords = async (type = '', limit = 50) => {
    setIsLoading(true);
    try {
      let records;

      if (isElectron && window.api) {
        records = await window.api.invoke('get-database-records', { type, limit });
      } else {
        // Load simulated records for demo
        records = generateSimulatedRecords(limit);
      }

      setDatabaseRecords(records);
    } catch (error) {
      console.error('Error loading database records:', error);
      setDatabaseRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSimulatedRecords = (limit) => {
    const records = [];
    const now = new Date();

    for (let i = 0; i < limit; i++) {
      const timestamp = new Date(now.getTime() - i * 60000); // 1 minute intervals
      const isTemp = Math.random() > 0.5;

      if (isTemp) {
        const temp = 25 + Math.random() * 5;
        const setpoint = 27.5;
        const error = ((temp - setpoint) / setpoint * 100);

        records.push({
          id: i + 1,
          type: 'temperature',
          timestamp: timestamp.toISOString(),
          value: temp.toFixed(1),
          setpoint: setpoint,
          error: error.toFixed(1)
        });
      } else {
        const pressure = 1.2 + Math.random() * 0.4;
        records.push({
          id: i + 1,
          type: 'pressure',
          timestamp: timestamp.toISOString(),
          value: pressure.toFixed(2),
          setpoint: 1.5,
          error: (Math.abs(pressure - 1.5) / 1.5 * 100).toFixed(1)
        });
      }
    }

    return records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const loadAllTemperatureRecords = () => {
    loadRecentRecords('temperature', 1000);
  };

  const loadAllPressureRecords = () => {
    loadRecentRecords('pressure', 1000);
  };

  const confirmClearRecords = (type) => {
    if (window.confirm(`Are you sure you want to clear all ${type} records? This action cannot be undone.`)) {
      clearRecords(type);
    }
  };

  const clearRecords = async (type) => {
    try {
      if (isElectron && window.api) {
        await window.api.invoke('clear-records', type);
        alert(`${type} records cleared successfully`);
        loadRecordCounts();
        loadRecentRecords();
      } else {
        alert(`Clear ${type} records (Demo mode - not implemented)`);
      }
    } catch (error) {
      console.error('Error clearing records:', error);
      alert('Error clearing records');
    }
  };

  const applyDatabaseFilters = () => {
    const filters = {
      dateFrom: filterDateFrom,
      dateTo: filterDateTo,
      type: filterRecordType
    };

    loadFilteredRecords(filters);
  };

  const loadFilteredRecords = async (filters) => {
    setIsLoading(true);
    try {
      let records;

      if (isElectron && window.api) {
        records = await window.api.invoke('get-filtered-records', filters);
      } else {
        // Apply filters to simulated data
        records = generateSimulatedRecords(100);

        if (filters.type) {
          records = records.filter(record => record.type === filters.type);
        }

        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom);
          records = records.filter(record => new Date(record.timestamp) >= fromDate);
        }

        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          toDate.setHours(23, 59, 59, 999); // End of day
          records = records.filter(record => new Date(record.timestamp) <= toDate);
        }
      }

      setDatabaseRecords(records);
    } catch (error) {
      console.error('Error loading filtered records:', error);
      setDatabaseRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRecord = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;

    try {
      if (isElectron && window.api) {
        await window.api.invoke('delete-record', id);
        setDatabaseRecords(records => records.filter(record => record.id !== id));
        alert('Record deleted successfully');
      } else {
        setDatabaseRecords(records => records.filter(record => record.id !== id));
        alert('Record deleted (Demo mode)');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('Error deleting record');
    }
  };

  const exportAllData = () => {
    if (databaseRecords.length === 0) {
      alert('No data to export');
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8," +
      "ID,Type,Timestamp,Value,Setpoint,Error\n" +
      databaseRecords.map(row =>
        `${row.id},${row.type},${new Date(row.timestamp).toLocaleString()},${row.value},${row.setpoint || ''},${row.error || ''}`
      ).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `database_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="tab-pane fade" role="tabpanel">
      <div className="main-container">
        <div className="title-bar">
          <i className="fas fa-database"></i> DATABASE MANAGEMENT
        </div>

        <div className="row">
          <div className="col-md-4">
            <div className="control-panel">
              <h6 className="mb-3"><i className="fas fa-thermometer-half"></i> Temperature Records</h6>
              <div className="mb-3">
                <button
                  className="btn btn-success btn-sm w-100 mb-1"
                  onClick={loadAllTemperatureRecords}
                  disabled={isLoading}
                >
                  <i className="fas fa-sync"></i> Load All Records
                </button>
                <button
                  className="btn btn-warning btn-sm w-100 mb-1"
                  onClick={() => loadRecentRecords('temperature', 100)}
                  disabled={isLoading}
                >
                  <i className="fas fa-clock"></i> Load Recent (100)
                </button>
                <button
                  className="btn btn-danger btn-sm w-100 mb-1"
                  onClick={() => confirmClearRecords('temperature')}
                  disabled={isLoading}
                >
                  <i className="fas fa-trash"></i> Clear All Records
                </button>
              </div>
              <div className="alert alert-info">{tempRecordCount}</div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="control-panel">
              <h6 className="mb-3"><i className="fas fa-tachometer-alt"></i> Pressure Records</h6>
              <div className="mb-3">
                <button
                  className="btn btn-success btn-sm w-100 mb-1"
                  onClick={loadAllPressureRecords}
                  disabled={isLoading}
                >
                  <i className="fas fa-sync"></i> Load All Records
                </button>
                <button
                  className="btn btn-warning btn-sm w-100 mb-1"
                  onClick={() => loadRecentRecords('pressure', 100)}
                  disabled={isLoading}
                >
                  <i className="fas fa-clock"></i> Load Recent (100)
                </button>
                <button
                  className="btn btn-danger btn-sm w-100 mb-1"
                  onClick={() => confirmClearRecords('pressure')}
                  disabled={isLoading}
                >
                  <i className="fas fa-trash"></i> Clear All Records
                </button>
              </div>
              <div className="alert alert-info">{pressureRecordCount}</div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="control-panel">
              <h6 className="mb-3"><i className="fas fa-filter"></i> Filters</h6>
              <div className="mb-2">
                <label className="form-label" style={{ fontSize: '11px' }}>Date Range:</label>
                <input
                  type="date"
                  className="form-control form-control-sm mb-1"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                />
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                />
              </div>
              <div className="mb-2">
                <label className="form-label" style={{ fontSize: '11px' }}>Record Type:</label>
                <select
                  className="form-select form-select-sm"
                  value={filterRecordType}
                  onChange={(e) => setFilterRecordType(e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="temperature">Temperature</option>
                  <option value="pressure">Pressure</option>
                </select>
              </div>
              <button
                className="btn btn-primary btn-sm w-100 mb-2"
                onClick={applyDatabaseFilters}
                disabled={isLoading}
              >
                <i className="fas fa-search"></i> Apply Filters
              </button>
              <button
                className="btn btn-info btn-sm w-100"
                onClick={exportAllData}
                disabled={isLoading || databaseRecords.length === 0}
              >
                <i className="fas fa-download"></i> Export All Data
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
                  {isLoading ? (
                    <tr>
                      <td colSpan="7" className="text-center">
                        <div className="loading-spinner"></div> Loading database records...
                      </td>
                    </tr>
                  ) : databaseRecords.length > 0 ? (
                    databaseRecords.map((record) => (
                      <tr key={record.id}>
                        <td>{record.id}</td>
                        <td>
                          <span className={`badge bg-${record.type === 'temperature' ? 'primary' : 'warning'}`}>
                            {record.type}
                          </span>
                        </td>
                        <td>{new Date(record.timestamp).toLocaleString()}</td>
                        <td>
                          {record.value} {record.type === 'temperature' ? '°C' : 'Bar'}
                        </td>
                        <td>
                          {record.setpoint ? `${record.setpoint} ${record.type === 'temperature' ? '°C' : 'Bar'}` : '--'}
                        </td>
                        <td>{record.error ? `${record.error}%` : '--'}</td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => deleteRecord(record.id)}
                            title="Delete Record"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center">
                        No records found. Use the controls above to load data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabasePanel;