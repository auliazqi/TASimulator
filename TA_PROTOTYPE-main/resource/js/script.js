// Global variables
let temperatureChart, pressureChart;
let tempAutoRefresh = true;
let pressureAutoRefresh = true;
let tempRefreshInterval, pressureRefreshInterval;
let currentRefreshRate = 5000; // 5 seconds default
let databaseConnected = false;

// Check if we're in Electron environment
const isElectron = typeof window.api !== 'undefined';

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
        initCharts();
        initPressureGauge();
        checkDatabaseConnection();
        loadInitialData();
        setupAutoRefresh();
        updateDateTime();
        setInterval(updateDateTime, 1000);

        if (isElectron) {
            setupElectronListeners();
        }
    }, 100);
});

// Electron-specific setup
function setupElectronListeners() {
    // Database success responses
    window.api.receive('database-insert-success', (result) => {
        console.log('Data operation successful:', result);
    });

    // Listen for any database errors
    window.api.receive('database-error', (error) => {
        showAlert('Database Error: ' + error.message, 'danger');
        updateConnectionStatus(false);
    });
}

// Database connection and data loading functions
async function checkDatabaseConnection() {
    if (!isElectron) {
        // If not in Electron, simulate connection for demo
        databaseConnected = false;
        updateConnectionStatus(false);
        loadSimulatedData();
        return;
    }

    try {
        // Test database connection by trying to fetch a small amount of data
        const testData = await window.api.getDataByFilters('sensor_readings', {}, { limit: 1 });
        databaseConnected = true;
        updateConnectionStatus(true);
        console.log('Database connection successful');
    } catch (error) {
        console.error('Database connection failed:', error);
        databaseConnected = false;
        updateConnectionStatus(false);
        showAlert('Database connection failed. Using demo mode.', 'warning', 5000);
        loadSimulatedData();
    }
}

function updateConnectionStatus(connected) {
    const statusEl = document.getElementById('connectionStatus');
    const dbStatusLight = document.getElementById('dbStatusLight');
    const dbStatusText = document.getElementById('dbStatusText');

    if (connected) {
        statusEl.className = 'connection-status connected';
        statusEl.innerHTML = '<i class="fas fa-database"></i> Database Connected';
        dbStatusLight.className = 'status-indicator status-on';
        dbStatusText.textContent = 'Database: Connected';
    } else {
        statusEl.className = 'connection-status disconnected';
        statusEl.innerHTML = '<i class="fas fa-database"></i> Database Disconnected';
        dbStatusLight.className = 'status-indicator status-off';
        dbStatusText.textContent = 'Database: Disconnected';
    }
    databaseConnected = connected;
}

function showAlert(message, type = 'info', duration = 3000) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-custom alert-dismissible fade show`;
    alertDiv.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, duration);
}

// Data loading functions
async function loadInitialData() {
    await loadTemperatureData();
    await loadPressureData();
    updateDataCounts();
}

async function loadTemperatureData() {
    const indicator = document.getElementById('tempRefreshIndicator');
    indicator.classList.add('active');

    try {
        if (!databaseConnected) {
            // loadSimulatedTemperatureData();
            return;
        }

        // Load recent temperature data
        const temperatureData = await window.api.getDataByFilters('sensor_readings',
            { type: 'temperature' },
            { orderBy: 'timestamp DESC', limit: 50 }
        );

        updateTemperatureDisplay(temperatureData);
        updateTemperatureChart(temperatureData);
        updateTemperatureTable(temperatureData);

        document.getElementById('tempStatusLight').className = 'status-indicator status-on';
        document.getElementById('tempStatusText').textContent = `Data Loaded (${temperatureData.length} records)`;

    } catch (error) {
        console.error('Error loading temperature data:', error);
        document.getElementById('tempStatusLight').className = 'status-indicator status-error';
        document.getElementById('tempStatusText').textContent = 'Data Load Failed';
        showAlert('Failed to load temperature data: ' + error.message, 'danger');
    } finally {
        indicator.classList.remove('active');
        document.getElementById('tempLastUpdate').textContent = new Date().toLocaleTimeString();
    }
}

async function loadPressureData() {
    const indicator = document.getElementById('pressureRefreshIndicator');
    indicator.classList.add('active');

    try {
        if (!databaseConnected) {
            // loadSimulatedPressureData();
            return;
        }

        // Load recent pressure data
        const pressureData = await window.api.getDataByFilters('sensor_readings',
            { type: 'pressure' },
            { orderBy: 'timestamp DESC', limit: 50 }
        );

        updatePressureDisplay(pressureData);
        updatePressureChart(pressureData);
        updatePressureTable(pressureData);

    } catch (error) {
        console.error('Error loading pressure data:', error);
        showAlert('Failed to load pressure data: ' + error.message, 'danger');
    } finally {
        indicator.classList.remove('active');
        document.getElementById('pressureLastUpdate').textContent = new Date().toLocaleTimeString();
    }
}

function updateTemperatureDisplay(data) {
    if (!data || data.length === 0) {
        document.getElementById('currentTempDisplay').textContent = '--°C';
        document.getElementById('lastSetpointDisplay').textContent = '--°C';
        document.getElementById('avgErrorDisplay').textContent = '--%';
        document.getElementById('dataPointsDisplay').textContent = '0';
        return;
    }

    const latest = data[0];
    const currentTemp = latest.current_value || 0;
    const lastSetpoint = latest.setpoint || 0;
    const avgError = data.reduce((sum, item) => sum + (item.error_percentage || 0), 0) / data.length;

    document.getElementById('currentTempDisplay').textContent = currentTemp.toFixed(1) + '°C';
    document.getElementById('lastSetpointDisplay').textContent = lastSetpoint.toFixed(1) + '°C';
    document.getElementById('avgErrorDisplay').textContent = avgError.toFixed(1) + '%';
    document.getElementById('dataPointsDisplay').textContent = data.length;

    // Update tank visualization
    updateTemperatureTank(currentTemp, lastSetpoint);
}

function updatePressureDisplay(data) {
    if (!data || data.length === 0) {
        document.getElementById('currentPressureDisplay').textContent = '-- Bar';
        document.getElementById('pressureSetpointDisplay').textContent = '-- Bar';
        document.getElementById('pressureAvgErrorDisplay').textContent = '--%';
        document.getElementById('pressureDataPointsDisplay').textContent = '0';
        return;
    }

    const latest = data[0];
    const currentPressure = latest.current_value || 0;
    const lastSetpoint = latest.setpoint || 0;
    const avgError = data.reduce((sum, item) => sum + (item.error_percentage || 0), 0) / data.length;

    document.getElementById('currentPressureDisplay').textContent = currentPressure.toFixed(2) + ' Bar';
    document.getElementById('pressureSetpointDisplay').textContent = lastSetpoint.toFixed(2) + ' Bar';
    document.getElementById('pressureAvgErrorDisplay').textContent = avgError.toFixed(1) + '%';
    document.getElementById('pressureDataPointsDisplay').textContent = data.length;
    document.getElementById('pressureValue').textContent = currentPressure.toFixed(2);
    document.getElementById('gaugeValue').textContent = currentPressure.toFixed(2);

    // Update gauge visualization
    updatePressureGaugeNeedle(currentPressure);
}

// Chart initialization and updates
function initCharts() {
    initTemperatureChart();
    initPressureChart();
}

function initTemperatureChart() {
    const ctx = document.getElementById('temperatureChart');
    if (!ctx) return;

    temperatureChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Temperature (°C)',
                data: [],
                borderColor: '#d32f2f',
                backgroundColor: 'rgba(211, 47, 47, 0.1)',
                borderWidth: 2,
                tension: 0.1,
                pointRadius: 3
            }, {
                label: 'Setpoint',
                data: [],
                borderColor: '#4a90e2',
                backgroundColor: 'rgba(74, 144, 226, 0.1)',
                borderWidth: 2,
                borderDash: [5, 5],
                tension: 0,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    min: 20,
                    max: 30,
                    title: { display: true, text: 'Temperature (°C)' }
                },
                x: {
                    title: { display: true, text: 'Time' }
                }
            },
            plugins: {
                legend: { display: true, position: 'top' }
            }
        }
    });
}

function initPressureChart() {
    const ctx = document.getElementById('pressureChart');
    if (!ctx) return;

    pressureChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Pressure (Bar)',
                data: [],
                borderColor: '#4a90e2',
                backgroundColor: 'rgba(74, 144, 226, 0.1)',
                borderWidth: 2,
                tension: 0.1,
                pointRadius: 3
            }, {
                label: 'Setpoint',
                data: [],
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                borderWidth: 2,
                borderDash: [5, 5],
                tension: 0,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    min: 0,
                    max: 2,
                    title: { display: true, text: 'Pressure (Bar)' }
                },
                x: {
                    title: { display: true, text: 'Time' }
                }
            },
            plugins: {
                legend: { display: true, position: 'top' }
            }
        }
    });
}

function updateTemperatureChart(data) {
    if (!temperatureChart || !data || data.length === 0) return;

    // Sort data by timestamp
    data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const labels = data.map(item => new Date(item.timestamp).toLocaleTimeString());
    const temperatures = data.map(item => item.current_value || 0);
    const setpoints = data.map(item => item.setpoint || 0);

    temperatureChart.data.labels = labels.slice(-20); // Show last 20 points
    temperatureChart.data.datasets[0].data = temperatures.slice(-20);
    temperatureChart.data.datasets[1].data = setpoints.slice(-20);
    temperatureChart.update('none');
}

function updatePressureChart(data) {
    if (!pressureChart || !data || data.length === 0) return;

    // Sort data by timestamp
    data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const labels = data.map(item => new Date(item.timestamp).toLocaleTimeString());
    const pressures = data.map(item => item.current_value || 0);
    const setpoints = data.map(item => item.setpoint || 0);

    pressureChart.data.labels = labels.slice(-20); // Show last 20 points
    pressureChart.data.datasets[0].data = pressures.slice(-20);
    pressureChart.data.datasets[1].data = setpoints.slice(-20);
    pressureChart.update('none');
}

// Table updates
function updateTemperatureTable(data) {
    const tbody = document.getElementById('tempDataTableBody');
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        const row = tbody.insertRow();
        row.innerHTML = '<td colspan="4" class="text-center">No temperature data available</td>';
        return;
    }

    // Show latest 15 records
    data.slice(0, 15).forEach(item => {
        const row = tbody.insertRow();
        const timestamp = new Date(item.timestamp);
        row.innerHTML = `
                    <td>${timestamp.toLocaleTimeString()}</td>
                    <td>${(item.current_value || 0).toFixed(2)}</td>
                    <td>${(item.setpoint || 0).toFixed(2)}</td>
                    <td>${(item.error_percentage || 0).toFixed(1)}</td>
                `;
    });
}

function updatePressureTable(data) {
    const tbody = document.getElementById('pressureDataTableBody');
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        const row = tbody.insertRow();
        row.innerHTML = '<td colspan="3" class="text-center">No pressure data available</td>';
        return;
    }

    // Show latest 15 records
    data.slice(0, 15).forEach(item => {
        const row = tbody.insertRow();
        const timestamp = new Date(item.timestamp);
        const pressure = item.current_value || 0;
        const status = pressure > 1.5 ? 'High' : pressure < 0.5 ? 'Low' : 'Normal';
        const statusClass = pressure > 1.5 ? 'text-danger' : pressure < 0.5 ? 'text-warning' : 'text-success';

        row.innerHTML = `
                    <td>${timestamp.toLocaleTimeString()}</td>
                    <td>${pressure.toFixed(2)}</td>
                    <td><span class="${statusClass}">${status}</span></td>
                `;
    });
}

// Gauge and tank updates
function initPressureGauge() {
    const gaugeScale = document.querySelector('.gauge-scale');
    if (!gaugeScale) return;

    // Clear any existing content
    gaugeScale.innerHTML = '';

    // Create scale markings
    for (let i = 0; i <= 8; i++) {
        const tick = document.createElement('div');
        const angle = (i / 8) * 360;
        const isMainTick = i % 2 === 0;
        const value = (i / 4).toFixed(1);

        tick.style.position = 'absolute';
        tick.style.top = '10px';
        tick.style.left = '50%';
        tick.style.width = '2px';
        tick.style.height = isMainTick ? '15px' : '8px';
        tick.style.background = '#666';
        tick.style.transformOrigin = 'center 95px';
        tick.style.transform = `translateX(-50%) rotate(${angle}deg)`;

        if (isMainTick) {
            const label = document.createElement('div');
            label.style.position = 'absolute';
            label.style.top = '20px';
            label.style.left = '50%';
            label.style.transform = `translateX(-50%) rotate(${angle}deg)`;
            label.style.transformOrigin = 'center 85px';
            label.style.fontSize = '12px';
            label.style.fontWeight = 'bold';
            label.style.color = '#333';
            label.style.width = '20px';
            label.style.textAlign = 'center';

            // Counter-rotate the text to keep it readable
            const textSpan = document.createElement('span');
            textSpan.textContent = value;
            textSpan.style.display = 'inline-block';
            textSpan.style.transform = `rotate(${-angle}deg)`;
            label.appendChild(textSpan);

            gaugeScale.appendChild(label);
        }

        gaugeScale.appendChild(tick);
    }
}

function updatePressureGaugeNeedle(pressure) {
    const needle = document.getElementById('pressureNeedle');
    if (needle) {
        // Calculate angle (0-2 Bar maps to 0-360 degrees)
        const angle = (pressure / 2) * 360;
        needle.style.transform = `translate(-50%, -100%) rotate(${angle}deg)`;
    }
}

function updateTemperatureTank(currentTemp, setpoint) {
    const tankFill = document.getElementById('tankFill');
    const tankTempLabel = document.getElementById('tankTempLabel');

    if (tankFill && tankTempLabel) {
        // Calculate fill percentage based on temperature range (20-30°C)
        const minTemp = 20;
        const maxTemp = 30;
        const fillPercentage = Math.max(0, Math.min(100,
            ((currentTemp - minTemp) / (maxTemp - minTemp)) * 100
        ));

        tankFill.style.height = fillPercentage + '%';
        tankTempLabel.textContent = currentTemp.toFixed(1) + '°C';

        // Add heating effect when temperature is above setpoint
        if (currentTemp > setpoint - 0.5) {
            tankFill.classList.add('tank-heating');
        } else {
            tankFill.classList.remove('tank-heating');
        }
    }
}

// Auto refresh functionality
function setupAutoRefresh() {
    updateRefreshInterval();
}

function updateRefreshInterval() {
    const interval = parseInt(document.getElementById('refreshInterval').value);
    currentRefreshRate = interval;

    // Clear existing intervals
    if (tempRefreshInterval) clearInterval(tempRefreshInterval);
    if (pressureRefreshInterval) clearInterval(pressureRefreshInterval);

    // Set new intervals if not disabled
    if (interval > 0) {
        if (tempAutoRefresh) {
            tempRefreshInterval = setInterval(loadTemperatureData, interval);
        }
        if (pressureAutoRefresh) {
            pressureRefreshInterval = setInterval(loadPressureData, interval);
        }
    }
}

function toggleAutoRefresh(type) {
    if (type === 'temperature') {
        tempAutoRefresh = !tempAutoRefresh;
        const icon = document.getElementById('tempAutoRefreshIcon');
        const text = document.getElementById('tempAutoRefreshText');

        if (tempAutoRefresh) {
            icon.className = 'fas fa-pause';
            text.textContent = 'Stop Auto';
            if (currentRefreshRate > 0) {
                tempRefreshInterval = setInterval(loadTemperatureData, currentRefreshRate);
            }
        } else {
            icon.className = 'fas fa-play';
            text.textContent = 'Start Auto';
            if (tempRefreshInterval) clearInterval(tempRefreshInterval);
        }
    } else if (type === 'pressure') {
        pressureAutoRefresh = !pressureAutoRefresh;
        const icon = document.getElementById('pressureAutoRefreshIcon');
        const text = document.getElementById('pressureAutoRefreshText');

        if (pressureAutoRefresh) {
            icon.className = 'fas fa-pause';
            text.textContent = 'Stop Auto';
            if (currentRefreshRate > 0) {
                pressureRefreshInterval = setInterval(loadPressureData, currentRefreshRate);
            }
        } else {
            icon.className = 'fas fa-play';
            text.textContent = 'Start Auto';
            if (pressureRefreshInterval) clearInterval(pressureRefreshInterval);
        }
    }
}

// Database management functions
async function loadAllTemperatureRecords() {
    try {
        if (!databaseConnected) {
            showAlert('Database not connected', 'warning');
            return;
        }

        const records = await window.api.getDataByFilters('sensor_readings',
            { type: 'temperature' },
            { orderBy: 'timestamp DESC' }
        );

        document.getElementById('tempRecordCount').textContent = `Records: ${records.length}`;
        populateDatabaseTable(records);
        showAlert(`Loaded ${records.length} temperature records`, 'success');
    } catch (error) {
        showAlert('Failed to load temperature records: ' + error.message, 'danger');
    }
}

async function loadAllPressureRecords() {
    try {
        if (!databaseConnected) {
            showAlert('Database not connected', 'warning');
            return;
        }

        const records = await window.api.getDataByFilters('sensor_readings',
            { type: 'pressure' },
            { orderBy: 'timestamp DESC' }
        );

        document.getElementById('pressureRecordCount').textContent = `Records: ${records.length}`;
        populateDatabaseTable(records);
        showAlert(`Loaded ${records.length} pressure records`, 'success');
    } catch (error) {
        showAlert('Failed to load pressure records: ' + error.message, 'danger');
    }
}

async function loadRecentRecords(type, limit) {
    try {
        if (!databaseConnected) {
            showAlert('Database not connected', 'warning');
            return;
        }

        const records = await window.api.getDataByFilters('sensor_readings',
            { type: type },
            { orderBy: 'timestamp DESC', limit: limit }
        );

        populateDatabaseTable(records);
        showAlert(`Loaded ${records.length} recent ${type} records`, 'success');
    } catch (error) {
        showAlert(`Failed to load recent ${type} records: ` + error.message, 'danger');
    }
}

async function confirmClearRecords(type) {
    if (!confirm(`Are you sure you want to clear all ${type} records? This action cannot be undone.`)) {
        return;
    }

    try {
        if (!databaseConnected) {
            showAlert('Database not connected', 'warning');
            return;
        }

        await window.api.deleteData('sensor_readings', 'type = ?', [type]);

        if (type === 'temperature') {
            document.getElementById('tempRecordCount').textContent = 'Records: 0';
        } else {
            document.getElementById('pressureRecordCount').textContent = 'Records: 0';
        }

        populateDatabaseTable([]);
        showAlert(`${type} records cleared successfully`, 'success');

        // Refresh the current display
        if (type === 'temperature') {
            loadTemperatureData();
        } else {
            loadPressureData();
        }
    } catch (error) {
        showAlert(`Failed to clear ${type} records: ` + error.message, 'danger');
    }
}

async function applyDatabaseFilters() {
    try {
        if (!databaseConnected) {
            showAlert('Database not connected', 'warning');
            return;
        }

        const dateFrom = document.getElementById('filterDateFrom').value;
        const dateTo = document.getElementById('filterDateTo').value;
        const recordType = document.getElementById('filterRecordType').value;

        let filters = {};
        if (recordType) {
            filters.type = recordType;
        }

        // For date filtering, we'd need to use raw queries or modify the backend
        // For now, just filter by type
        const records = await window.api.getDataByFilters('sensor_readings',
            filters,
            { orderBy: 'timestamp DESC', limit: 500 }
        );

        // Client-side date filtering if dates are specified
        let filteredRecords = records;
        if (dateFrom || dateTo) {
            filteredRecords = records.filter(record => {
                const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
                if (dateFrom && recordDate < dateFrom) return false;
                if (dateTo && recordDate > dateTo) return false;
                return true;
            });
        }

        populateDatabaseTable(filteredRecords);
        showAlert(`Found ${filteredRecords.length} records matching filters`, 'success');
    } catch (error) {
        showAlert('Failed to apply filters: ' + error.message, 'danger');
    }
}

function populateDatabaseTable(records) {
    const tbody = document.getElementById('databaseTableBody');
    tbody.innerHTML = '';

    if (!records || records.length === 0) {
        const row = tbody.insertRow();
        row.innerHTML = '<td colspan="7" class="text-center">No records found</td>';
        return;
    }

    records.forEach(record => {
        const row = tbody.insertRow();
        const timestamp = new Date(record.timestamp);
        row.innerHTML = `
                    <td>${record.id}</td>
                    <td><span class="badge bg-${record.type === 'temperature' ? 'danger' : 'primary'}">${record.type}</span></td>
                    <td>${timestamp.toLocaleString()}</td>
                    <td>${(record.current_value || 0).toFixed(2)}</td>
                    <td>${(record.setpoint || 0).toFixed(2)}</td>
                    <td>${(record.error_percentage || 0).toFixed(1)}%</td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteRecord('${record.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
    });
}

async function deleteRecord(recordId) {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
        if (!databaseConnected) {
            showAlert('Database not connected', 'warning');
            return;
        }

        await window.api.deleteData('sensor_readings', 'id = ?', [recordId]);
        showAlert('Record deleted successfully', 'success');

        // Refresh the table
        const currentType = document.getElementById('filterRecordType').value;
        if (currentType) {
            loadRecentRecords(currentType, 100);
        } else {
            applyDatabaseFilters();
        }
    } catch (error) {
        showAlert('Failed to delete record: ' + error.message, 'danger');
    }
}

// Data export functions
async function exportTemperatureData() {
    try {
        if (!databaseConnected) {
            showAlert('Database not connected. Cannot export data.', 'warning');
            return;
        }

        const data = await window.api.getDataByFilters('sensor_readings',
            { type: 'temperature' },
            { orderBy: 'timestamp DESC' }
        );

        exportToCSV(data, 'temperature_data');
    } catch (error) {
        showAlert('Failed to export temperature data: ' + error.message, 'danger');
    }
}

async function exportPressureData() {
    try {
        if (!databaseConnected) {
            showAlert('Database not connected. Cannot export data.', 'warning');
            return;
        }

        const data = await window.api.getDataByFilters('sensor_readings',
            { type: 'pressure' },
            { orderBy: 'timestamp DESC' }
        );

        exportToCSV(data, 'pressure_data');
    } catch (error) {
        showAlert('Failed to export pressure data: ' + error.message, 'danger');
    }
}

function exportToCSV(data, filename) {
    if (!data || data.length === 0) {
        showAlert('No data to export', 'warning');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Type,Timestamp,Value,Setpoint,Error (%),Rise Time,Overshoot\n";

    data.forEach(row => {
        const timestamp = new Date(row.timestamp).toISOString();
        csvContent += `${row.id},${row.type},${timestamp},${row.current_value || 0},${row.setpoint || 0},${row.error_percentage || 0},${row.rise_time || ''},${row.overshoot || ''}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showAlert(`${data.length} records exported to CSV`, 'success');
}

// Utility functions
function updateDateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();

    // Update all time displays if they haven't been updated recently
    const elements = ['tempLastUpdate', 'pressureLastUpdate'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element && (element.textContent === '--:--:--' ||
            (Date.now() - new Date(`1970-01-01T${element.textContent}`).getTime()) > 60000)) {
            // Don't update if recently updated by data load
        }
    });
}

async function updateDataCounts() {
    if (!databaseConnected) return;

    try {
        const tempCount = await window.api.getDataByFilters('sensor_readings', { type: 'temperature' });
        const pressureCount = await window.api.getDataByFilters('sensor_readings', { type: 'pressure' });

        document.getElementById('tempTotalRecords').textContent = tempCount.length;
        document.getElementById('pressureTotalRecords').textContent = pressureCount.length;
        document.getElementById('tempRecordCount').textContent = `Records: ${tempCount.length}`;
        document.getElementById('pressureRecordCount').textContent = `Records: ${pressureCount.length}`;
    } catch (error) {
        console.error('Error updating data counts:', error);
    }
}

// Simulated data functions (for demo when database is not connected)
function loadSimulatedData() {
    loadSimulatedTemperatureData();
    loadSimulatedPressureData();
}

function loadSimulatedTemperatureData() {
    const simulatedData = [];
    const now = new Date();

    for (let i = 49; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 60000); // 1 minute intervals
        const baseTemp = 25;
        const variation = (Math.sin(i * 0.1) * 2) + (Math.random() - 0.5) * 1;
        const currentValue = baseTemp + variation;
        const setpoint = 25 + Math.sin(i * 0.05) * 0.5;
        const errorPercentage = Math.abs((currentValue - setpoint) / setpoint) * 100;

        simulatedData.push({
            id: `temp_${i}`,
            type: 'temperature',
            timestamp: timestamp.toISOString(),
            current_value: currentValue,
            setpoint: setpoint,
            error_percentage: errorPercentage,
            rise_time: 2 + Math.random(),
            overshoot: Math.random() * 2
        });
    }

    updateTemperatureDisplay(simulatedData);
    updateTemperatureChart(simulatedData);
    updateTemperatureTable(simulatedData);

    document.getElementById('tempStatusLight').className = 'status-indicator status-warning';
    document.getElementById('tempStatusText').textContent = `Demo Data (${simulatedData.length} records)`;
    document.getElementById('tempTotalRecords').textContent = simulatedData.length;
}

function loadSimulatedPressureData() {
    const simulatedData = [];
    const now = new Date();

    for (let i = 49; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 60000); // 1 minute intervals
        const basePressure = 1.0;
        const variation = (Math.sin(i * 0.08) * 0.3) + (Math.random() - 0.5) * 0.1;
        const currentValue = Math.max(0, basePressure + variation);
        const setpoint = 1.0 + Math.sin(i * 0.03) * 0.2;
        const errorPercentage = Math.abs((currentValue - setpoint) / setpoint) * 100;

        simulatedData.push({
            id: `pressure_${i}`,
            type: 'pressure',
            timestamp: timestamp.toISOString(),
            current_value: currentValue,
            setpoint: setpoint,
            error_percentage: errorPercentage
        });
    }

    updatePressureDisplay(simulatedData);
    updatePressureChart(simulatedData);
    updatePressureTable(simulatedData);

    document.getElementById('pressureTotalRecords').textContent = simulatedData.length;
}

// Initialize for non-Electron environments
if (!isElectron) {
    console.log('Running in browser mode - simulated data will be used');
    updateConnectionStatus(false);
}