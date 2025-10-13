import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App" style={{ padding: '20px', backgroundColor: 'white' }}>
      <h1 style={{ color: 'blue' }}>🎉 React App is Working!</h1>
      <p>This is a simple test to verify React is loading correctly in Electron.</p>
      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h3>Environment Check:</h3>
        <p>Electron API Available: {window.api ? '✅ Yes' : '❌ No'}</p>
        <p>Current Time: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}

export default App;