/**
 * Created by tiennt on 14/02/2016.
 */

var Crawler = require('crawler');
var mysql   = require('mysql');
var slug    = require('slug');
var fs      = require('fs');
var async   = require('async');
var configuration   = require('./configuration');

function detail(info,connection,cb){
    var c = new Crawler({
        'maxConnections':10,
        'forceUTF8': true,
        'userAgent': 'Mozilla/5.0 (X11; Linux i686 (x86_64)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36',
        'callback':function(error,result,$){}
    });
    //console.log(pageInfo);
    c.queue([{
        'uri': info.link,
        'callback': function (error, result, $) {
            var content = $('.post-inner.group').html();
            insertData = {
                'chapter_name'       : info.title,
                'chapter_slug'  :slug(info.title),
                'link':info.link,
                'content'       : content,
            };
            insertSQL = 'INSERT INTO truyen_co_tich  SET ?';
            connection.query(insertSQL,insertData,function(err,resultInsert) {
                if (err) {
                    console.log('Error insert chapter table', err);
                    //process.kill(1);
                    //return;
                }
                cb();
            });
        }
    }]);
}

function page(url,callback){
    var connection = mysql.createConnection(configuration.MYSQL_CONFIG);

    connection.connect(function(error){
        if(error){
            console.log('error connecting: ',error.stack);
            return;
        }
        console.log('Connected mysql db');
    });

    var c = new Crawler({
        'maxConnections':10,
        'forceUTF8': true,
        'userAgent': 'Mozilla/5.0 (X11; Linux i686 (x86_64)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36',
        'callback':function(error,result,$){}
    });
    //console.log(pageInfo);
    var title = '';
    var link = '';
    var data = [];
    c.queue([{
        'uri': url,
        'callback': function (error, result, $) {
            $('.post-row article .post-thumbnail').each(function(index,div){
                title = $(div).find('a').eq(0).attr('title');
                link = $(div).find('a').eq(0).attr('href');
                data.push({title:title,link:link});
            });
            console.log(data);
            if(data.length>0){
                async.each(
                    data,
                    function(info,cb){
                        detail(info,connection,cb);
                    },
                    function(){
                        console.log('DONE');
                        connection.end();
                        callback();
                    }
                );
            }
        }
    }]);
}

var dataPage = ['http://truyencotich.dongthoigian.org/category/truyen-co-tich-viet-nam'];
for(var i=2; i<=20;i++){
    dataPage.push('http://truyencotich.dongthoigian.org/category/truyen-co-tich-viet-nam/page/'+i);
}
async.each(
    dataPage,
    function(link,callback){
        page(link,callback);
    },
    function(){
        console.log('FINISHED');
        process.exit(1);
    }
);

//detail('http://truyencotich.dongthoigian.org/truyen-co-tich-viet-nam/nguon-goc-van-vat/su-tich-chim-da-da.html');