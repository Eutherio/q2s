# q2s
Simple tool for parsing query strings into complete SQL statements

---

Us this to translate either raw or parsed URL query strings into SQL commands. With q2s you will be able to build complex filters with just one step.

---

## Installation

```
$ npm install q2s
```

## Usage

With raw query strings:
```js
const q2s = require('q2s');

const query2sql = new q2s();

const query = '?name=John&lastname=Doe&*select=name,lastname,birthDate,address&*order=name';

const sql = query2sql.parse(query).sql('customers');

console.log(sql);
//=> "SELECT `name`, `lastname`, `birthDate`, `address` FROM customers WHERE `name`='John' AND `lastname`='Doe' ORDER BY `name` ASC"
```

With parsed query strings (e.g. using req.query from express.js):
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

## API

### .parse(**query**)

Adds/resets the query and parses it

#### Parameters

* query \<string, object\> 

