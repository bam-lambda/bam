const createDbTable = require('../src/aws/createDbTable');
const deleteTable = require('../src/aws/deleteDbTable');
const { doesTableExist } = require('../src/aws/doesResourceExist');
const bamBam = require('../src/util/bamBam');
const delay = require('../src/util/delay');

const testTable = 'testBamTable';
const partitionKey = {
  name: 'music',
  dataType: 'S',
};
const sortKey = {
  name: 'artist',
  dataType: 'S',
};

describe('bam dbtable', async () => {
  beforeEach(() => {
    jest.setTimeout(300000);
  });

  afterEach(async () => {
    await bamBam(deleteTable, {
      asyncFuncParams: [testTable],
      retryError: 'ResourceInUseException',
      interval: 30000,
    });

    let tableStatus = true;
    while (tableStatus) {
      tableStatus = await doesTableExist(testTable);
      await delay(30000);
    }
  });

  test('table creation is successfully initiated on AWS', async () => {
    await createDbTable(testTable, partitionKey, sortKey);
    const tableStatus = await doesTableExist(testTable);
    expect(tableStatus).toBeTruthy();
  });

  test('table creation is successfully initiated on AWS without sort key', async () => {
    await createDbTable(testTable, partitionKey);
    const tableStatus = await doesTableExist(testTable);
    expect(tableStatus).toBeTruthy();
  });
});
