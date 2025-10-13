import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import TemperaturePanel from './TemperaturePanel';
import PressurePanel from './PressurePanel';
import DatabasePanel from './DatabasePanel';
import ConnectionStatus from './ConnectionStatus';
import './MonitoringApp.css';

const TabNavigation = () => {
  const location = useLocation();

  return (
    <ul className="nav nav-tabs" id="mainTabs" role="tablist">
      <li className="nav-item" role="presentation">
        <Link
          className={`nav-link ${location.pathname === '/' || location.pathname === '/temperature' ? 'active' : ''}`}
          to="/temperature"
        >
          <i className="fas fa-thermometer-half"></i> Temperature Control
        </Link>
      </li>
      <li className="nav-item" role="presentation">
        <Link
          className={`nav-link ${location.pathname === '/pressure' ? 'active' : ''}`}
          to="/pressure"
        >
          <i className="fas fa-tachometer-alt"></i> Pressure Monitoring
        </Link>
      </li>
      <li className="nav-item" role="presentation">
        <Link
          className={`nav-link ${location.pathname === '/database' ? 'active' : ''}`}
          to="/database"
        >
          <i className="fas fa-database"></i> Database
        </Link>
      </li>
    </ul>
  );
};

function MonitoringApp() {
  const [databaseConnected, setDatabaseConnected] = useState(false);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    // Check if running in Electron
    setIsElectron(window.api !== undefined);

    // Check database connection
    checkDatabaseConnection();

    // Set up Electron listeners if in Electron environment
    if (window.api) {
      setupElectronListeners();
    }
  }, []);

  const checkDatabaseConnection = async () => {
    try {
      if (isElectron && window.api) {
        // Use Electron IPC for database check
        const connected = await window.api.invoke('check-database-connection');
        setDatabaseConnected(connected);
      } else {
        // Use HTTP API for web version
        const response = await fetch('http://localhost:3001/api/health');
        setDatabaseConnected(response.ok);
      }
    } catch (error) {
      console.error('Database connection check failed:', error);
      setDatabaseConnected(false);
    }
  };

  const setupElectronListeners = () => {
    if (window.api && window.api.receive) {
      window.api.receive('database-connection-changed', (connected) => {
        setDatabaseConnected(connected);
      });

      window.api.receive('database-error', (error) => {
        console.error('Database error:', error);
        setDatabaseConnected(false);
      });
    }
  };

  return (
    <Router>
      <div className="monitoring-app">
        <ConnectionStatus connected={databaseConnected} />

        <div className="container-fluid">
          <TabNavigation />

          <div className="tab-content" id="mainTabContent">
            <Routes>
              <Route path="/" element={<TemperaturePanel isElectron={isElectron} />} />
              <Route path="/temperature" element={<TemperaturePanel isElectron={isElectron} />} />
              <Route path="/pressure" element={<PressurePanel isElectron={isElectron} />} />
              <Route path="/database" element={<DatabasePanel isElectron={isElectron} />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default MonitoringApp;