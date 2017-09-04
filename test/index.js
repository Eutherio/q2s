
const assert = require('assert');
const should = require('should');
const q2s = require('../index.js');

describe("q2s", function () {

  let query2sql;

  before(function () {
    query2sql = new q2s();
  });
  
  describe("Setup", function () {
    it("should set default property values", function () {
      query2sql.should.have.property('input').which.is.an.Object().and.be.empty();
      query2sql.should.have.property('inputString', '');
      query2sql.should.have.property('filters', []);
      query2sql.should.have.property('selection', 'all');
      query2sql.should.have.property('order', undefined);
    });
    
  });
  
  describe("Empty query object [ query2sql.parse({}) ]", function () {

    it("should keep default property values", function () {
      query2sql.parse({});
      query2sql.should.have.property('input').which.is.an.Object().and.be.empty();
      query2sql.should.have.property('inputString', '');
      query2sql.should.have.property('filters', []);
      query2sql.should.have.property('selection', 'all');
      query2sql.should.have.property('order', undefined);
    });

  });

  describe("Empty query string [ query2sql.parse('') ]", function () {
    
    it("should keep default property values", function () {
      query2sql.parse('');
      query2sql.should.have.property('input').which.is.an.Object().and.be.empty();
      query2sql.should.have.property('inputString', '');
      query2sql.should.have.property('filters', []);
      query2sql.should.have.property('selection', 'all');
      query2sql.should.have.property('order', undefined);
    });

    describe("without 'tableName' specified [ .sql() ]", function() {

      it("should return an Error", function () {
        try{
          query2sql.parse('').sql();
        } catch(err) {
          err.should.have.property('message', "Error: Expected 'tableName' argument -> specify a table to work with.");
        }
      });

    });

    describe("with 'customers' as 'tableName' [ .sql('customers') ]", function() {

      it("should return a SQL statement:\n\r\t( SELECT * FROM customers )", function() {
        should.equal(query2sql.parse('').sql('customers'), "SELECT * FROM customers");
      });

    });
    
  });
  
  
  describe("Query string with just filters [ query2sql.parse('?name=John&lastname=Doe&address=78 High Street, Hampton') ]", function() {

    it("should populate 'input' property", function () {
      query2sql.parse("?name=John&lastname=Doe&address=78 High Street, Hampton");

      should.equal(query2sql.input.name, "John" );
      should.equal(query2sql.input.lastname, "Doe" );
      should.equal(query2sql.input.address, "78 High Street, Hampton" );

    });

    it("should populate 'filters' property", function () {
      const filters = query2sql.parse("?name=John&lastname=Doe&address=78 High Street, Hampton").filters;
      query2sql.should.have.property('filters').which.is.an.Array();
      filters[0].should.have.property('name', 'name');
      filters[0].should.have.property('value', 'John');
      filters[1].should.have.property('name', 'lastname');
      filters[1].should.have.property('value', 'Doe');
      filters[2].should.have.property('name', 'address');
      filters[2].should.have.property('value', '78 High Street, Hampton');

    });

    it("should keep 'selection' and 'order' default property values ('all' and undefined)", function () {
      query2sql.parse("?name=John&lastname=Doe&address=78 High Street, Hampton");
      query2sql.should.have.property('selection', 'all');
      query2sql.should.have.property('order', undefined);
    });

    describe("without 'tableName' specified [ .sql() ]", function() {

      it(
        "should return just a 'where' SQL statement:\n\r\t( WHERE `name`='John' AND `lastname`='Doe' AND `address`='78 High Street, Hampton' )",
        function() {
          const sql = query2sql.parse("?name=John&lastname=Doe&address=78 High Street, Hampton").sql();
          should.equal(sql, "WHERE `name`='John' AND `lastname`='Doe' AND `address`='78 High Street, Hampton'");
        }
      );

    });

    describe("with 'customers' as 'tableName' [ .sql('customers) ]", function() {

      it(
        "should return a complete SQL statement:\n\r\t( SELECT * FROM customers WHERE `name`='John' AND `lastname`='Doe' AND `address`='78 High Street, Hampton' )",
        function() {
          const sql = query2sql.parse("?name=John&lastname=Doe&address=78 High Street, Hampton").sql('customers');
          should.equal(sql, "SELECT * FROM customers WHERE `name`='John' AND `lastname`='Doe' AND `address`='78 High Street, Hampton'");
        }
      );

    });

  });

  describe("Query string with just 'select' setting", function() {

    it("should keep 'filters' and 'order' default property values", function () {
      query2sql.parse("?select=id, locality, country");
      query2sql.should.have.property('filters', []);
      query2sql.should.have.property('order', undefined);
    });
    
    describe("when set to 'filters' [ query2sql.parse('?select=filters') ]", function() {

      it("should return an Error", function () {
        try{
          query2sql.parse("?select=filters");
        } catch(err) {
          err.should.have.property('message', "Error: Expected filters -> at least one filter must be specified.");
        }
      });

    });

    describe("when set to 'id, locality, country' [ query2sql.parse('?select=id, locality, country') ]", function() {

      it("should populate 'input' property", function () {
        query2sql.parse("?select=id, locality, country");
        
        should.equal(query2sql.input.select, "id, locality, country" );
        
      });

      it("should set 'selection' property value (['id', 'locality', 'country'])", function () {
        query2sql.parse("?select=id, locality, country");
        query2sql.should.have.property('selection', ['id', 'locality', 'country']);
        
      });

      describe("without 'tableName' specified [ .sql() ]", function() {
        
        it("should return an Error", function () {
          try{
            query2sql.parse("?orderby=name, birthDate desc").sql();
          } catch(err) {
            err.should.have.property('message', "Error: Expected 'tableName' argument -> specify a table to work with.");
          }
        });
        
      });
      
      describe("with 'customers' as 'tableName' [ .sql('customers) ]", function() {
        
        it("should return a complete SQL statement:\n\r\t( SELECT `id`, `locality`, `country` FROM customers )", function () {
          should.equal(query2sql.parse("?select=id, locality, country").sql('customers'), "SELECT `id`, `locality`, `country` FROM customers");
        });
  
      });

    });

  });

  describe("Query string with just 'orderby' setting [ query2sql.parse('?orderby=name, birthDate desc') ]", function() {

    it("should keep 'filters' and 'selection' default property values", function () {
      query2sql.parse("?orderby=name, birthDate desc");
      query2sql.should.have.property('filters', []);
      query2sql.should.have.property('selection', 'all');
    });
    
    it("should populate 'input' property", function () {
      const order = query2sql.parse("?orderby=name, birthDate desc").order;
      order[0].should.have.property('column', 'name');
      order[0].should.have.property('direction', 'ASC');
      order[1].should.have.property('column', 'birthDate');
      order[1].should.have.property('direction', 'DESC');      
    });

    describe("without 'tableName' specified [ .sql() ]", function() {

      it("should return an Error", function () {
        try{
          query2sql.parse("?orderby=name, birthDate desc").sql();
        } catch(err) {
          err.should.have.property('message', "Error: Expected 'tableName' argument -> specify a table to work with.");
        }
      });
      
    });
    
    describe("with 'customers' as 'tableName' [ .sql('customers) ]", function() {
      
      it("should return a complete SQL statement:\n\r\t( SELECT * FROM customers ORDER BY `name` ASC, `birthDate` DESC )", function () {
        should.equal(query2sql.parse("?orderby=name, birthDate desc").sql('customers'), "SELECT * FROM customers ORDER BY `name` ASC, `birthDate` DESC");
      });

    });

  });

  describe("Query string with 'select' and 'orderby' settings [ query2sql.parse('?select=name, lastname, birthDate&orderby=name, birthDate desc') ]", function() {

    it("should keep 'filters' and default propert values", function () {
      query2sql.parse("?select=name, lastname, birthDate&orderby=name, birthDate desc");
      query2sql.should.have.property('filters', []);
    });
    
    it("should populate 'input' property", function () {
      const order = query2sql.parse("?select=name, lastname, birthDate&orderby=name, birthDate desc").order;
      should.equal(query2sql.input.select, "name, lastname, birthDate" );      
      order[0].should.have.property('column', 'name');
      order[0].should.have.property('direction', 'ASC');
      order[1].should.have.property('column', 'birthDate');
      order[1].should.have.property('direction', 'DESC');      
    });

    describe("without 'tableName' specified [ .sql() ]", function() {

      it("should return an Error", function () {
        try{
          query2sql.parse("?select=name, lastname, birthDate&orderby=name, birthDate desc").sql();
        } catch(err) {
          err.should.have.property('message', "Error: Expected 'tableName' argument -> specify a table to work with.");
        }
      });
      
    });
    
    describe("with 'customers' as 'tableName' [ .sql('customers) ]", function() {
      
      it("should return a complete SQL statement:\n\r\t( SELECT `name`, `lastname`, `birthDate` FROM customers ORDER BY `name` ASC, `birthDate` DESC )", function () {
        should.equal(query2sql.parse("?select=name, lastname, birthDate&orderby=name, birthDate desc")
              .sql('customers'), "SELECT `name`, `lastname`, `birthDate` FROM customers ORDER BY `name` ASC, `birthDate` DESC");
      });

    });

  });
    

});