# q2s
Simple tool for parsing query strings into complete SQL statements

---

Us this to translate either raw or parsed URL query strings into SQL commands. With q2s you will be able to build complex filters with just one step.


## Installation

```
$ npm install q2s
```


## Quick example

With raw query strings:
```js
const q2s = require('q2s');

const query2sql = new q2s();

const query = '?name=John&lastname=Doe&*select=name,lastname,birthDate,address&*order=name';

const sql = query2sql.parse(query).sql('customers');

console.log(sql);
//=> "SELECT `name`, `lastname`, `birthDate`, `address` FROM customers WHERE `name`='John' AND `lastname`='Doe' ORDER BY `name` ASC"
```


With parsed query strings (e.g. using *req.query* from **express.js**):
```js
// -- idem --

const query = {
  "name": "John",
  "lastname": "Doe",
  "*select": "name,lastname,birthDate,address",
  "*order": "name"
};

const sql = query2sql.parse(query).sql('customers');

console.log(sql);
//=> "SELECT `name`, `lastname`, `birthDate`, `address` FROM customers WHERE `name`='John' AND `lastname`='Doe' ORDER BY `name` ASC"
```


## Documentation

* [Api](#api)
* [Advanced use](#advanced-use)




## API

### .parse(**query**)

Adds/resets the query and parses it

#### Parameters

* **query**

  (*string*|*object*)(Required)

#### Return

(*q2s*) this


### .sql(**table**)

Returns a SQL query or token. If **table** is ommited, returns just the SQL *WHERE* clause.
*\*Warning: if table is ommited and no filter is included, it will throw an error*

#### Parameters

* **table**

  (*string*)(Optional)
  Default value: ''

#### Return

(*string*) SQL query




## Advanced use

*q2s* allows you to build complex SQL queries with almost all the rules included in the language


### WHERE clause

A part from the usual search using the '*equal*' (`=`) operator, SQL includes other operators. Here's a list of them and how to build your query string to use them:
* `=` (*equal*): `'?column=value'`
* `<>` or `!=` (*not equal*): `'?column=!_value'`
* `>` (*greater than*): `'?column=>>_value'` 
* `<` (*less than*): `'?column=<<_value'`
* `>=` (*greater than or equal*): `'?column=>_value'` 
* `<=` (*less than or equal*): `'?column=<_value'`
* `BETWEEN` (*between an inclusive range*): `'?column=minValue<x<maxValue'`
* `LIKE` (*search for a pattern*): `'?column=~_pattern'`

#### Examples

'equal', 'not equal', 'greater than', 'less than', etc:
```js
let sql;

// Equal
sql = query2sql.parse('?lastname=Doe').sql('customers');
console.log(sql);
//=> "SELECT * FROM customers WHERE `lastname`='Doe'"

// Not equal
sql = query2sql.parse('?lastname=!_Doe').sql('customers');
console.log(sql);
//=> "SELECT * FROM customers WHERE `lastname`!='Doe'"

// Greater than
sql = query2sql.parse('?age=>>_35').sql('customers');
console.log(sql);
//=> "SELECT * FROM customers WHERE `age`>35"

// Less than
sql = query2sql.parse('?age=<<_35').sql('customers');
console.log(sql);
//=> "SELECT * FROM customers WHERE `age`<35"

// Greater than or equal
sql = query2sql.parse('?age=>_35').sql('customers');
console.log(sql);
//=> "SELECT * FROM customers WHERE `age`>=35"

// Less than or equal
sql = query2sql.parse('?age=<_35').sql('customers');
console.log(sql);
//=> "SELECT * FROM customers WHERE `age`<=35"
```

Inclusive range:
```js
sql = query2sql.parse('?age=25<x<35').sql('customers');
console.log(sql);
//=> "SELECT * FROM customers WHERE `age` BETWEEN 25 AND 35"
```

Pattern match:
```js
// Accepts any valid SQL pattern
sql = query2sql.parse('?email=~_%gmail.com').sql('customers');
console.log(sql);
//=> "SELECT * FROM customers WHERE `age` LIKE 'gmail.com%'";
```


### ORDER BY clause

To sort de result-set you should include a parameter 'order' in your query string. In case there's a column in your table with the name 'order', use a precceding asterisk ('*\*order*').

#### Examples

Default behavior (ascending sorting):
```js
sql = query2sql.parse('?name=John&lastname=Doe&*order=age,name').sql('customers');
console.log(sql);
//=> "SELECT * FROM customers WHERE `name`='John' AND `lastname`='Doe' ORDER BY `age` ASC, `name` ASC"
```
Specifying sorting direction:
```js
sql = query2sql.parse('?name=John&lastname=Doe&*order=age desc,name asc').sql('customers');
console.log(sql);
//=> "SELECT * FROM customers WHERE `name`='John' AND `lastname`='Doe' ORDER BY `age` DESC, `name` ASC"
```


### SELECT clause

By default, *q2s* will select all columns (`*`) in the table. However, you can change this behavior including a parameter 'select' in your query string. In case there's a column in your table with the name 'select', use a precceding asterisk ('*\*select*').

#### Examples

Include just the filtered columns (use the keyword '*filters*'):
```js
sql = query2sql.parse('?name=John&age=>>25&*select=filters').sql('customers');
console.log(sql);
//=> "SELECT `name`, `age` FROM customers WHERE `name`='John' AND `age`>25"
```

Include given columns:
```js
sql = query2sql.parse('?name=John&age=>>25&*select=name,lastname,age,email,address').sql('customers');
console.log(sql);
//=> "SELECT `name`, `lastname`, `age`, `email`, `address` FROM customers WHERE `name`='John' AND `age`>25"
```
