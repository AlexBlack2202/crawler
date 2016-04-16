/**
 * Created by tienn2t on 4/2/15.
 */
var Crawler = require('crawler');
var mysql   = require('mysql');
var slug    = require('slug');
var fs      = require('fs');
var async   = require('async');
var configuration   = require('./configuration');
var BASE_URL = 'http://afamily.vn/';

/**
 *
 * @param url
 * @param done
 */

var connection = null;
var trData = [];
var totalPage = 0;

function crawlerDetail(page,cbPage){
    var c = new Crawler({
        'maxConnections':10,
        'forceUTF8': true,
        'userAgent': 'Mozilla/5.0 (X11; Linux i686 (x86_64)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36',
        'callback':function(error,result,$){}
    });
    //console.log(pageInfo);
    c.queue([{
        'uri':page.link,
        'callback':function(error,result,$){

            //lay ra tong so trang
            var content = $('.detail_content').html();
            page.description = content.replace(/\<a[^>]+\>/g,'<a href="javascript:void(0);">');
            /*if(connection==null){
                connection = mysql.createConnection(configuration.MYSQL_CONFIG);
            }*/

            insertSQL = 'INSERT INTO detail SET ?';

            connection.query(insertSQL,page,function(err,resultInsert){
                if(err){
                    console.log('Error insert chapter table', err);
                }else {
                    console.log('Success insert');
                }
                cbPage();
            });

        }
    }]);
}

function crawlerPage(pageInfo,cb){
    var c = new Crawler({
        'maxConnections':10,
        'forceUTF8': true,
        'userAgent': 'Mozilla/5.0 (X11; Linux i686 (x86_64)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36',
        'callback':function(error,result,$){}
    });
    console.log(pageInfo);
    c.queue([{
        'uri':pageInfo.link,
        'callback':function(error,result,$){

            var data = [];

            $('.solr-content .bgfff').each(function(index,li){

                link = BASE_URL+$(li).find('a').eq(0).attr('href');
                img = $(li).find('img').eq(0).attr('src');
                data[index] = {
                    link    : link,
                    img_link : img,
                    title: $(li).find('a').eq(0).attr('title'),
                    brief:$(li).find('p').eq(0).text(),
                    category_name:pageInfo.name,
                    category_id:pageInfo.id
                };

            });
            console.log(data);

            async.each(data, function(pageInfo, cbPage){
                crawlerDetail(pageInfo,cbPage);

            }, function(errPage){
                console.log('xong 1 trang');
                cb();
            });

        }
    }]);
}

function run(){
    connection = mysql.createConnection(configuration.MYSQL_BABY_CONFIG);
    connection.connect(function(error){
        if(error){
            console.log('error connecting: ',error.stack);
            return;
        }
        console.log('Connected mysql db, sort:');
    });


    //get status pending to crawler
    var query = 'SELECT * from category WHERE crawler=0 LIMIT 1';
    connection.query(query, function(err, rows) {
        // connected! (unless `err` is set)
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
        async.each(rows, function(row,cb){
            connection.query('UPDATE category SET crawler = ? WHERE id = ?', [1, row.id]);
            var link =row.link;
            var pageList = [];
            for(var i=1;i<=row.total_page;i++){
                row.link = link+'/trang-'+i+'.htm';
                pageList.push(row.link);
            }

            console.log(pageList);
            async.each(pageList, function(pageInfo, cbPage){
                row.link = pageInfo;
                //console.log(row);
                crawlerPage(row,cbPage);

            }, function(errPage){
                console.log('Finished category');
                cb();
            });
        }, function(){
            console.log('FINISHED CRAWLER CATEGORY!!');//dong ket noi
            connection.end();
            setTimeout(function(){
                //run();
                console.log('STOP 5 second to continue');
            },5000);
        });

    });
}

//crawlerDetail('http://afamily.vn/su-nguy-hiem-kho-ngo-cua-mot-san-pham-bo-me-nao-cung-tung-dung-cho-con-20160309030752246.chn');
run();