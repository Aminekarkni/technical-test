import Logger from './core/Logger';
import { port } from './configVars';
import app from './app';

app
  .listen(port, () => {
    Logger.info(`server running on port : ${port} 👌`);
  })
  .on('error', (e) => {
    console.log(e);
    // Logger.error(e);
  });
