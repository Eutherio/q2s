const queryString = require('query-string');

module.exports = function(query, table) {

  this.query = query;
  this.table = table;
  
  let self = this;

  this.translate = function() {

    if ( typeof self.query === 'string' ) {
      self.query = queryString.parse(self.query);
    }

    const querySetup = setup(self.query);

    let whereStmnt = '',
        orderByStmnt = '',
        selectStmnt = '';

    if ( querySetup.filters.length > 0 ) {
      whereStmnt = ' WHERE ';            
      let i = 0,
          action;
      for (let filter of querySetup.filters) {
  
        if ( filter.type === 'comparison') {
          action = '`' + filter.name + '`' + filter.operator + '\'' + filter.value + '\'';
        }
        else if ( filter.type === 'pattern' ) {
          action = '`' + filter.name + '` LIKE \'' + filter.value + '\'';
        }
        else if ( filter.type === 'range' ) {
          action = '`' + filter.name + '` BETWEEN ' + filter.value[0] + ' AND ' + filter.value[1];
        }
  
        whereStmnt += (i === 0 ? '' : filter.junction) + filter.opening + action + filter.closing;
  
        if ( querySetup.selection === 'filters') {
          selectStmnt += (i === 0 ? '' : ', ') + '`' + filter.name + '`';
        }
  
        i++;
      }

    }

    // Set SELECT statement in case a list of columns has been specified
    if ( Array.isArray(querySetup.selection) ) {
      let j = 0;
      for (let column of querySetup.selection) {
        selectStmnt += (j === 0 ? '' : ', ') + '`' + column + '`';
        j++;
      }
    }
    
    // Set ORDER BY statement in case a list of columns has been specified
    if ( querySetup.order ) {
      orderByStmnt = ' ORDER BY';      
      let k = 0;
      for (let item of querySetup.order) {
        orderByStmnt += (k === 0 ? '' : ', ') + '`' + item.column + '` ' + item.direction;
        k++;
      }
      
    }

    return 'SELECT ' + selectStmnt + ' FROM ' + self.table + whereStmnt + orderByStmnt;

  };

  // Creates a setup JS object with:
  // - Lists of filters,
  // - Columns to select
  // - Order of the selection
  function setup (query) {

    let setup = {
      filters: [],
      selection: 'all',
      order: undefined
    };
    
    if ( Object.keys(query).length > 0 ) {
      for (let key in query) {
  
        if ( key === 'selection') {
          setup.selection = parseSelection(query[key]);
          continue;
        }
  
        if ( key === 'orderby' ) {
          setup.order = parseOrder(query[key]);
          continue;
        }
  
        setup.filters.push(parseFilter(key, query[key]));
  
      }
    }

    return setup;

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

    order = order.split(',').map((val) => {
      val = val.trim();
      if ( (/\sasc$/i).test(val) ) {
        return {
          column: val.slice(0, val.length - 4),
          direction: 'ASC'
        }
      }
      else if ( (/\sdesc$/i).test(val) ) {
        return {
          column: val.slice(0, val.length - 5),
          direction: 'DESC'
        }
      }

      return {
        column: val,
        direction: 'ASC'
      }

    });

    return order;

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
      junction: 'AND',
      opening: '',
      closing: ''
    };

    // Setting filter junction ('AND' by default)
    if ( (/^OR_/i).test(value) ) {
      filter.junction = 'OR';
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