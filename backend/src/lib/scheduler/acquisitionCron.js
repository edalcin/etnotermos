import cron from 'node-cron';
import { config } from '../../config/index.js';
import { log } from '../logger.js';

let task = null;

export function start(acquisitionService, db) {
  if (task) return;

  task = cron.schedule(config.acquisitionCronSchedule, async () => {
    log.info('Acquisition cron triggered', { schedule: config.acquisitionCronSchedule });
    try {
      await acquisitionService.run(db);
    } catch (err) {
      log.error('Acquisition cron failed', { error: err.message });
    }
  });

  log.info('Acquisition cron scheduled', { schedule: config.acquisitionCronSchedule });
}

export function stop() {
  if (task) {
    task.stop();
    task = null;
  }
}

export default { start, stop };
