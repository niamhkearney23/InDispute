import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
const db = await PGlite.create();            // in memory: gone when this process stops
const server = new PGLiteSocketServer({ db, port: 5544, host: '127.0.0.1', maxConnections: 10 });
await server.start();
console.log('pglite wire server on 127.0.0.1:5544');
process.on('SIGTERM', async () => { await server.stop(); await db.close(); process.exit(0); });
setInterval(() => {}, 1 << 30);
