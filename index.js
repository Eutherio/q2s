const _parseFilter = Symbol('parseFilter');
const _onError = Symbol('onError');

module.exports = function(query) {

  this.filters = [];
  this.selection = 'all';
  this.order = undefined;
  
  let self = this;


  // Populates the lists of filters,
  // sets the columns to be selected and in which order
  function setup () {

    let key;

    for (key in query) {

      if ( key === 'selection') {
        self.selection = parseSelection(query[key]);
        continue;
      }

      if ( key === 'orderby' ) {
        self.order = query[key];
        continue;
      }

      self.filters.push(parseField(key, query[key]));

    }

  }

  // Transforms the selection parameter value into a
  // list of fields to be selected
  function parseSelection (selection) {
    let selectionList;

    if ( selection !== 'all' && selection !== 'filters') {
      selection = selection.split(',').map((val) => {
        return val.trim();
      });
    }

    return selection;

  }

  // Tranform a single field key - value pair into an object
  // to be read when translating to SQL query
  function parseField (fieldname, value) {

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

  };

}