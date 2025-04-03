/* eslint-disable n/no-process-env */
import moduleAlias from 'module-alias';

// Configure moduleAlias
if (__filename.endsWith('js')) {
  moduleAlias.addAlias('@', __dirname + '/dist');
}
