const queryString = require('query-string');

module.exports = function() {

  this.input = {};
  this.inputString = '';
  this.filters = [];
  this.selection = 'all';
  this.order = undefined;
  
  let self = this;
  
  // QUERY PARSING
  this.parse = function(query) {
    
    query = query || '';

    if ( typeof query === 'string' ) {
      self.inputString = query;
      self.input = queryString.parse(query);
    }
    else {
      self.inputString = queryString.stringify(query);
      self.input = query;
    }
    
    self.filters = [];
    self.selection = 'all';
    self.order = undefined;

    parseQuery();
 
    if (self.selection === 'filters' && self.filters.length === 0) {
      throw new Error("Error: Expected filters -> at least one filter must be specified.");
    }

    return self;
    
  };
  
  // TRANSLATION OF PARSED QUERY TO SQL
  this.sql = function(table) {
    
    const WHERE = setWhere();

    if (!table && table !== '') {
      if ( WHERE === '' ) {
        throw new Error("Error: Expected 'tableName' argument -> specify a table to work with.");
      }
      return WHERE.trim();
    }
    
    const FIELDS = setSelect();
    
    const ORDERBY = setOrder();
    
    return 'SELECT ' + FIELDS + ' FROM ' + table + WHERE + ORDERBY;
    
  };

  // Set SELECT statement
  function setSelect () {
    
    // Will select all fields
    if ( self.selection === 'all' )
      return '*';
    
    let selectStmnt = '',
        i = 0;

    // Will select the fields used as filters
    if ( self.selection === 'filters') {
      for (let filter of self.filters) {
        selectStmnt += (i === 0 ? '' : ', ') + '`' + filter.name + '`';
        i++;
      }
    }

    // Will select the list of fields specified
    if ( Array.isArray(self.selection) ) {
      for (let column of self.selection) {
        selectStmnt += (i === 0 ? '' : ', ') + '`' + column + '`';
        i++;
      }
    }
    
    return selectStmnt;
  }

  // Set WHERE statement
  function setWhere () {

    if ( self.filters.length === 0 )
      return '';

    let whereStr = ' WHERE',
        i = 0,
        action;

    for (let filter of self.filters) {

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
  // Set ORDER BY statement in case a list of columns has been specified
  function setOrder () {

    if ( !self.order )
      return '';
    
    let orderByStmnt = ' ORDER BY ',
        i = 0;

    for (let item of self.order) {
      orderByStmnt += (i === 0 ? '' : ', ') + '`' + item.column + '` ' + item.direction;
      i++;
    }
    
    return orderByStmnt;
  }

  // Creates properties:
  // - Lists of filters,
  // - Columns to select
  // - Order of the selection
  function parseQuery () {
    
    if ( Object.keys(self.input).length === 0 )
      return;
    
    let key;

    for (key in self.input) {

      if ( key === 'select' || key === '*select' ) {
        self.selection = parseSelection(self.input[key]);
        continue;
      }

      if ( key === 'orderby' || key === '*orderby' ) {
        self.order = parseOrder(self.input[key]);
        continue;
      }

      if ( self.input[key])
      self.filters.push(parseFilter(key, self.input[key]));

    }

    self.filters.reverse();

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
    } 
    else if( (/^NOT_/i).test(value) ) {
      filter.junction = ' NOT';
      value = value.slice(4);
    }
    else if( (/^AND_/i).test(value) ) {
      value = value.slice(4);
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
    if( (/^(!_)/i).test(value) ) {
      filter.operator = '<>';
      filter.value = value.slice(2);
    }
    else if( (/^(>_|<_)/i).test(value) ) {
      filter.operator = value.slice(0,1) + '=';
      filter.value = value.slice(2);
    }
    else if( (/^(>>_|<<_)/i).test(value) ) {
      filter.operator = value.slice(0,1);
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