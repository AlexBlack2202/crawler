/**
 * Created by tienn2t on 4/2/15.
 */
var Crawler = require('crawler');
var mysql   = require('mysql');
var slug    = require('slug');
var fs      = require('fs');
var async   = require('async');
var configuration   = require('./configuration');
var BASE_URL = 'http://afamily.vn'

/**
 *
 * @param url
 * @param done
 */

var connection = mysql.createConnection(configuration.MYSQL_CONFIG);
var trData = [];
var totalPage = 0;

function crawlerDetail(url){
    var c = new Crawler({
        'maxConnections':10,
        'forceUTF8': true,
        'userAgent': 'Mozilla/5.0 (X11; Linux i686 (x86_64)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36',
        'callback':function(error,result,$){}
    });
    //console.log(pageInfo);
    c.queue([{
        'uri':url,
        'callback':function(error,result,$){

            //lay ra tong so trang
            var content = $('.detail_content').html();
            console.log(content.replace(/\<a[^>]+\>/g,'<a href="javascript:void(0);">'));
            /*$('ul.list-chapter li').each(function(index,li){

                link = $(li).find('a').eq(0).attr('href');
                name = $(li).find('a').eq(0).text();
                trData[index] = {
                    'chapter_number'    : (pageInfo.page-1)*50+index+1,
                    'chapter_name'       : name,
                    'chapter_slug'  : slug(name),//link.replace('http://truyenfull.vn',''),
                    'story_id'  : pageInfo.story_id,
                    'story_slug': pageInfo.story_slug,
                    'story_name'    : pageInfo.story_name,
                    'chapter_link': link,
                    'table':pageInfo.table,
                    'totalPage':pageInfo.totalPage,
                    'page':pageInfo.page
                };

            });*/
            //console.log(trData);
            if(connection==null){
                connection = mysql.createConnection(configuration.MYSQL_CONFIG);
            }

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
    //console.log(pageInfo);
    c.queue([{
        'uri':pageInfo.link,
        'callback':function(error,result,$){

            var data = [];

            $('.solr-content .bgfff').each(function(index,li){

                link = BASE_URL+$(li).find('a').eq(0).attr('href');
                img = $(li).find('img').eq(0).attr('src');
                data[index] = {
                    'link'    : link,
                    'img'       : img,
                    title: $(li).find('a').eq(0).attr('title'),
                    brief:$(li).find('p').eq(0).text()
                };

            });
            console.log(data);
            if(connection==null){
                connection = mysql.createConnection(configuration.MYSQL_CONFIG);
            }

        }
    }]);
}

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
            console.log(row.link);
            var pageList = [];
            for(var i=page;i<=totalPage;i++){
                row.link = row.link+'/trang-'+i+'.htm';
                var pageInfo  = row;
                pageList.push(pageInfo);
            }

            console.log(pageList);
            async.each(pageList, function(pageInfo, cbPage){
                crawlerPage(pageInfo,cbPage);

            }, function(errPage){
                console.log('Finished page');
                cb();
            });
        }, function(){
            console.log('FINISHED CRAWLER STORY!!');//dong ket noi
            connection.end();
            run();
        });

    });
}

//crawlerDetail('http://afamily.vn/su-nguy-hiem-kho-ngo-cua-mot-san-pham-bo-me-nao-cung-tung-dung-cho-con-20160309030752246.chn');
crawlerPage('http://afamily.vn/me-va-be/day-con-thong-minh.htm');