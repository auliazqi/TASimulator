import React from 'react';

const ConnectionStatus = ({ connected }) => {
  return (
    <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
      <i className="fas fa-database"></i>
      {connected ? ' Database Connected' : ' Database Disconnected'}
    </div>
  );
};

export default ConnectionStatus;