
const q2s = require('../index.js');

const queryObj = {
  param1: '~_value1%',
  param2: 'or_(_value2',
  param3: 'minVal<x<maxVal_)'
}

const queryStr = '?param1=value1,param2=value2,param3=value3';

const query = new q2s(queryObj, 'clientes');

const SQL = query.translate();

console.log(SQL);