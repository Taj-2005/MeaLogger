// PM2 Process Manager Configuration
// Simple way to run server in production
// Install PM2: npm install -g pm2
// Start: pm2 start ecosystem.config.js
// Stop: pm2 stop meal-logger-server
// Status: pm2 status

module.exports = {
  apps: [
    {
      name: 'meal-logger-server',
      script: './src/index.js',
      instances: 1, // Run 1 instance (simple for student project)
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 4000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '500M', // Restart if memory exceeds 500MB
      watch: false, // Don't watch files in production
    },
  ],
};

