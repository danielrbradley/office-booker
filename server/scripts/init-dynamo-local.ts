import { createLocalTables } from './create-dynamo-tables';

createLocalTables(
  { deleteTablesFirst: true },
  {
    region: 'eu-west-1',
    endpoint: 'http://dynamodb:8000',
  }
).catch((e) => {
  console.error(e);
  process.exit(1);
});
