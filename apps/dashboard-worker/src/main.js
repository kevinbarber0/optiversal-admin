import express from 'express';
import { getPgBoss, initPgBoss } from '@util/pgboss';
import { CONTROL_QUEUE_NAME, JOB_QUEUE_NAME_MATCH } from '@helpers/workflowMessaging';
import { controlQueueHandler, todoQueueHandler } from './workflow';

export async function startServer() {
  const port = parseInt(process.env.WORKER_PORT) || 3001;

  let pgBossSuccess = false;
  while (!pgBossSuccess) {
    try {
      await initPgBoss();
      pgBossSuccess = true;
    } catch(err) {
      console.error(err);
      await new Promise(resolve => setTimeout(resolve, 5000));
      continue;
    }
  }

  // start the workers
  const boss = await getPgBoss();
  await boss.work(CONTROL_QUEUE_NAME, controlQueueHandler);
  await boss.work(JOB_QUEUE_NAME_MATCH, todoQueueHandler);

  const app = express();
  app.use(express.json());

  app.use((req, _res, next) => {
    console.log(req.method, req.url);
    next();
  });

  app.get('/health', (_req, res) => {
    res.send('OK')
  });

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
}

startServer();
