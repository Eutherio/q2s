const queryString = require('query-string');

module.exports = function(query, table) {

  this.query = query;
  this.table = table;
  this.queryString = '';
  this.queryStack = {
    filters: [],
    selection: 'all',
    order: undefined
  };
  
  let self = this;

  this.translate = function() {

    if ( typeof self.query === 'string' ) {
      self.queryString = self.query;
      self.query = queryString.parse(self.query);
    }

    readyQuery(self.query);

    const SELECTION = readySelection();

    const TABLE = self.table;

    const WHERE = self.where();

    const ORDERBY = readyOrder();
  
    return 'SELECT ' + SELECTION + ' FROM ' + TABLE + WHERE + ORDERBY;

  };

  // Set WHERE statement
  this.where = function () {

    if ( typeof self.query === 'string' ) {
      self.queryString = self.query;      
      self.query = queryString.parse(self.query);
    }

    if ( self.queryStack.filters.length === 0 )
      return '';

    let whereStr = ' WHERE',
        i = 0,
        action;

    for (let filter of self.queryStack.filters) {

      if ( filter.type === 'comparison') {
        action = '`' + filter.name + '`' + filter.operator + '\'' + filter.value + '\'';
      }
      else if ( filter.type === 'pattern' ) {
        action = '`' + filter.name + '` LIKE \'' + filter.value + '\'';
      }
      else if ( filter.type === 'range' ) {
        action = '`' + filter.name + '` BETWEEN ' + filter.value[0] + ' AND ' + filter.value[1];
      }

      whereStr += (i === 0 ? '' : filter.junction) + ' ' + filter.opening + action + filter.closing;

      i++;
    }

    self.whereStmnt = whereStr;
    return whereStr;

  };

  // Set SELECT statement
  function readySelection () {

    // Will select all fields
    if ( self.queryStack.selection === 'all' )
      return '*';
    
    let selectStmnt = '',
        i = 0;

    // Will select the fields used as filters
    if ( self.queryStack.selection === 'filters') {
      for (let filter of self.queryStack.filters) {
        selectStmnt += (i === 0 ? '' : ', ') + '`' + filter.name + '`';
        i++;
      }
    }

    // Will select the list of fields specified
    if ( Array.isArray(self.queryStack.selection) ) {
      for (let column of self.queryStack.selection) {
        selectStmnt += (i === 0 ? '' : ', ') + '`' + column + '`';
        i++;
      }
    }
    
    return selectStmnt;
  }

  // Set ORDER BY statement in case a list of columns has been specified
  function readyOrder () {

    if ( !self.queryStack.order )
      return '';
    
    let orderByStmnt = ' ORDER BY ',
        i = 0;

    for (let item of self.queryStack.order) {
      orderByStmnt += (i === 0 ? '' : ', ') + '`' + item.column + '` ' + item.direction;
      i++;
    }
    
    return orderByStmnt;
  }

  // Populatos queryStack object with:
  // - Lists of filters,
  // - Columns to select
  // - Order of the selection
  function readyQuery () {
    
    if ( Object.keys(self.query).length === 0 )
      return;

    for (let key in self.query) {

      if ( key === 'select' || key === '*select' ) {
        self.queryStack.selection = parseSelection(self.query[key]);
        continue;
      }

      if ( key === 'orderby' || key === '*orderby' ) {
        self.queryStack.order = parseOrder(self.query[key]);
        continue;
      }

      self.queryStack.filters.push(parseFilter(key, self.query[key]));

    }

  }

  // Transforms the selection parameter value into a
  // list of fields to be selected
  function parseSelection (selection) {

    if ( selection !== 'all' && selection !== 'filters') {
      selection = selection.split(',').map((val) => {
        return val.trim();
      });
    }
    return selection;

  }

  // Transforms the orderby parameter value into a
  // list of fields from which order will be stablished
  function parseOrder (order) {

    order = order.split(',');
    if ( order.length === 1 && order[0] === '' )
      return undefined;

    return order.map((val) => {
      val = val.trim();
      if ( (/\sasc$/i).test(val) ) {
        return {
          column: val.slice(0, val.length - 4),
          direction: 'ASC'
        };
      }
      else if ( (/\sdesc$/i).test(val) ) {
        return {
          column: val.slice(0, val.length - 5),
          direction: 'DESC'
        };
      }
      
      return {
        column: val,
        direction: 'ASC'
      };
      
    });

  }

  // Tranform a single field key - value pair into an object
  // to be read when translating to SQL query
  function parseFilter (fieldname, value) {

    // Default filter object
    let filter = {
      name: fieldname,
      value: '',
      type: 'comparison',
      operator: '=',
      junction: ' AND',
      opening: '',
      closing: ''
    };

    // Setting filter junction ('AND' by default)
    if ( (/^OR_/i).test(value) ) {
      filter.junction = ' OR';
      value = value.slice(3);
    } else if( (/^AND_/i).test(value) ) {
      value = value.slice(3);
    }

    // Setting filter opening (without any by default)
    while( (/^\(_/i).test(value) ) {
      filter.opening += '( ';
      value = value.slice(2);
    }

    // Setting filter closing (without any by default)
    while( (/_\)$/i).test(value) ) {
      filter.closing += ' )';
      value = value.slice(0, value.length - 2);
    }
    
    // Default filter value
    filter.value = value;

    // Setting filter type and operator ('comparison' and '=' by default)

    // Filters of type COMPARISON
    if( (/^(=_|>_|<_)/i).test(value) ) {
      filter.operator = value.slice(0,1);
      filter.value = value.slice(2);
    }
    else if( (/^(!=_|>=_|<=_)/i).test(value) ) {
      filter.operator = value.slice(0,2);
      filter.value = value.slice(3);
    }

    // Filters of type PATTERN
    else if( (/^~_/i).test(value) ) {
      filter.type = 'pattern'   ;
      filter.value = value.slice(2);
    }
    
    // Filters of type RANGE
    else if( (/<X</i).test(value) ) {
      filter.type = 'range'   ;
      filter.value = value.split(/<X</i);
    }

    return filter;

  }

};