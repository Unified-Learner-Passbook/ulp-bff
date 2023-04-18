import { existsSync } from 'fs';
import { resolve } from 'path';

export function getEnvPath(dest: string) {
  const env: string | undefined = process.env.NODE_ENV;
  //console.log('env', env);
  const fallback: string = resolve(`${dest}/prod.env`);
  const filename: string = env === 'dev' ? `dev.env` : 'prod.env';
  let filePath: string = resolve(`${dest}/${filename}`);
  //console.log('filePath', filePath);

  if (!existsSync(filePath)) {
    filePath = fallback;
  }

  return filePath;
}
