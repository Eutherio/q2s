
const q2s = require('../index.js');

const queryObj = {
  name: 'John',
  lastname: 'Doe',
  address: '78 High Street, Hampton',
  birth_date: '1912-06-23',
  select: 'filters',
  orderby: 'birth_date asc, name desc'
};

const queryStr = '?param1=value1,param2=value2,param3=value3';

const query = new q2s(queryObj, 'clientes');

const SQL = query.translate();

console.log(SQL);

// Check if 'orderby' field is empty
// Check if 'selection' field is empty