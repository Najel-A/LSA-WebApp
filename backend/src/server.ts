import './loadEnv'; // Must run first so process.env is set before app (and auth.service) load
import { createApp } from './app';
import { connectDB } from './db/connection';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

async function main(): Promise<void> {
  await connectDB();

  const app = createApp();

  app.listen(PORT, HOST, () => {
    console.log(`Server listening at http://${HOST}:${PORT}`);
  });
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
