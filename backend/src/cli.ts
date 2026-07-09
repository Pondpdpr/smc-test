import { CommandFactory } from 'nest-commander';

import { AppCliModule } from './app/app.module';

async function bootstrap() {
  const app = await CommandFactory.createWithoutRunning(AppCliModule, {
    // if true this will fail silently
    abortOnError: false,
  });
  app.enableShutdownHooks();
  await app.init();

  await CommandFactory.runApplication(app);
  await app.close();
}
bootstrap();
