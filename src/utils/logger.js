const { createLogger, format, transports } = require('winston') ;

// Simple logger using console — swap for winston in production
let logger;
try {
  const winston = require('winston');
  // ...existing code...
  // Example: initialize winston-based logger (preserve your existing config)
  const { createLogger, format, transports } = winston;
  logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(format.timestamp(), format.simple()),
    transports: [new transports.Console()],
  });
} catch (err) {
  // fallback simple console logger if winston isn't installed
  logger = {
    info: (...args) => console.log('[info]', ...args),
    warn: (...args) => console.warn('[warn]', ...args),
    error: (...args) => console.error('[error]', ...args),
    debug: (...args) => console.debug('[debug]', ...args),
  };
}

module.exports = logger;