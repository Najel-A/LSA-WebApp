import './loadEnv'; // Must run first so process.env is set before app (and auth.service) load
import { createApp } from './app';
import { connectDB } from './db/connection';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

let server: import('http').Server | null = null;

async function main(): Promise<void> {
  await connectDB();

  const app = createApp();

  server = app.listen(PORT, HOST, () => {
    console.log(`Server listening at http://${HOST}:${PORT}`);
  });
}

async function shutdown(signal: string) {
  console.log(`${signal} received. Shutting down...`);

  // Stop accepting new connections
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server!.close((err) => (err ? reject(err) : resolve()));
    });
  }

  // await disconnectDB(); // TODO: add this back in when we have a DB
 

  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
