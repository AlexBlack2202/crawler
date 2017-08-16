/**
 * Created by tienn2t on 4/2/15.
 */
var Crawler = require('crawler');
var mysql   = require('mysql');
var slug    = require('slug');
var fs = require('fs');
var jquery = fs.readFileSync("jquery-1.12.1.min.js", "utf-8");
var jsdom = require("jsdom");
var async   = require('async');
var configuration   = require('./configuration');
var process = require('./crawlerAsyncTest');
var http    = require('http');

/**
 *
 * @param url
 * @param done
 */

var connection = mysql.createConnection(configuration.MYSQL_CONFIG);
//var connection = mysql.createConnection(configuration.MYSQL_HOSTGATO_CONFIG);
var trData = [];
var totalPage = 0;

function crawlerPage(pageInfo){
    console.log(pageInfo);
    pageInfo.link =pageInfo.link+(pageInfo.current_page);

    jsdom.env({
        url: pageInfo.link,
        src: [jquery],
        done: function (err, window) {
            //console.log("there have been", window.$("a").length - 4, "io.js releases!");
            var $ = window.$;
            reg = /[\d]+$/;

            var totalStory = $('#list_data_return tbody tr').length;
            if(totalStory==0){
                console.log('het du lieu chuyen sang lay du lieu noi dung');
                connection.end();
                die;
            }
            $('#list_data_return tbody tr').each(function(index,div){

                trData = {
                    'isbn'    : $(div).find('td').eq(1).text(),
                    'name'       : $(div).find('td').eq(2).text(),
                    'author'  : $(div).find('td').eq(3).text(),
                    'translator':  $(div).find('td').eq(4).text() ,
                    'total': $(div).find('td').eq(5).text(),
                    'self_publish': $(div).find('td').eq(6).text(),
                    'partner':$(div).find('td').eq(7).text(),
                    'register_number':$(div).find('td').eq(8).text()
                };

                console.log(trData);
                updateSQL = 'INSERT INTO cuc_xuat_ban SET ? ';
                connection.query(updateSQL, [trData], function (err, resultInsert) {
                    if (err) {
                        console.log('UPDATE van_mau table ERROR', err);
                        //process.kill(1);
                        //return;
                    }else{
                        if(index== (totalStory-1)){
                            console.log('ket thuc sau 6 giay het trang ',pageInfo.current_page);
                            setTimeout(function(){
                                run(pageInfo.current_page+1);
                            },5000);
                        }
                    }
                });
                //crawlerImage(trData);
            });

        }
    });
}



 


function run(current_page){
    try {
        if(current_page == null || current_page == undefined){
            current_page = 3;
        }
        var row = {
            link:'xxn?idx_nxb=3&p=',
            //link:'http://truyenfull.vn/danh-sach/truyen-hot/',
            category_name: 'phong tục việt nam',
            category_slug: 'phong-tuc-viet-nam',
            id:8,
            current_page:current_page,
            total_page:10
        };
        crawlerPage(row);
    }catch(e){
        console.log(e);
    }
}

run();