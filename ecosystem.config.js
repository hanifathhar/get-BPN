module.exports = {
  apps: [
    {
      name: "get-bpn-api",
      script: "npm",
      args: "run start",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        HOSTNAME: "0.0.0.0",
        PORT: 3005,
        ORACLE_CLIENT_DIR: "/opt/oracle/instantclient_19_23",
        LD_LIBRARY_PATH: "/opt/oracle/instantclient_19_23",
      },
    },
  ],
};
