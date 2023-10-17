import PgBoss from 'pg-boss';

let boss;

export async function initPgBoss() {
  if (boss) {
    throw Error('pgboss already initialized');
  }

  console.log(`connecting to pgboss`)
  boss = new PgBoss(process.env.PG_BOSS_DB_URL);
  boss.on('error', error => console.error(error));
  await boss.start();
  return boss;
}

export async function getPgBoss() {
  return boss || await initPgBoss();
}
