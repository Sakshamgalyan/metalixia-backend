module.exports = {
  apps: [
    {
      name: 'metalixia-backend',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};

//pm2 start ecosystem.config.js

//pm2 save
// pm2 startup