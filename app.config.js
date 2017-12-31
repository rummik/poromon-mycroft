module.exports = {
  apps: [
    {
      name: 'WEB',
      script: 'app.js',
      env_production : {
        NODE_ENV: 'production',
        PORT: 80,
      },
    },
  ],

  deploy: {
    testing: {
      user: 'rummik',
      host: '2001:db8::d00:dad',
      ref: 'pi/master',
      repo: '/home/pi/pi-poromon-furby.git',
      path: '/home/pi/pi-poromon-furby',
      'post-deploy': [
        'export PATH=$PATH:/opt/nodejs/bin',
        'npm install',
        'authbind --deep pm2 startOrRestart app.config.js --env production',
      ].join(' && '),
    },
  },
};
