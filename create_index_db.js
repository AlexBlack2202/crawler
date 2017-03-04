/**
 * Created by tiennt on 24/04/2016.
 */
var Crawler         = require('crawler');
var mysql           = require('mysql');
var slug            = require('slug');
var async           = require('async');
var truyenfull       = require('./truyenfull_update');
var configuration   = require('./configuration');
var http    = require('http');
var fs      = require('fs');

function run(){
    var connection = mysql.createConnection(configuration.MYSQL_CONFIG);

    connection.connect(function(error){
        if(error){
            console.log('error connecting: ',error.stack);
            return;
        }
        console.log('Connected mysql db, sort:');
    });


    //get status pending to crawler
    var query = 'select TABLE_NAME from information_schema.tables where TABLE_SCHEMA="nhenhang"';
    connection.query(query, function(err, rows) {
        if(err){
            console.error("Get data error: ", err.stack);
            return;
        }
        //console.log(rows);
        if(rows.length==0){
            console.log('Khong co du lieu nao!');
            connection.end();
            return;
        }

        async.each(rows, function(row,cb) {
            var preg = /^chapter_+/;
            if(preg.test(row.TABLE_NAME)) {
                console.log(row.TABLE_NAME);
                query = "create index chapternumberidx on "+row.TABLE_NAME+"(chapter_number);";
                connection.query(query);
            }
        });
    });
}

run();