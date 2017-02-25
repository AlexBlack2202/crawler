/**
 * Created by tienn2t on 3/31/15.
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
    var query = 'SELECT * from story WHERE  (is_crawler=0 or (status="Đang ra" AND update_story = 0)) AND id >0 order by id  ASC LIMIT 1';
    console.log(query);
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
            page = row.page;
            title = row.story_slug;
            getData(row, connection,'chapter_phat_giao',cb);
        }, function(){
            console.log('FINISHED CRAWLER STORY!!');//dong ket noi
            connection.end();
            run();
        });

    });
}

function getData(row, connection, table, cb,totalPage){

    var c = new Crawler({
        'maxConnections':10,
        'forceUTF8': true,
        'userAgent': 'Mozilla/5.0 (X11; Linux i686 (x86_64)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36',
        'callback':function(error,result,$){}
    });

    //console.log(row);
    if(totalPage==='undefined'){
        totalPage = 0;
    }
    console.log(row.link);

    c.queue([{
        'uri':row.link,
        'callback':function(error,result,$){
            //lay ra tong so trang
            reg = /[\d]+$/;
            var content = $('.f-detail').html();
            //thong tin tung trang
            var pageInfo  = {
                content: '<h3 class="'+$('.tt-detail').html()+'</h3><div>'+content.replace(/\<a[^>]+\>/g,'<a href="javascript:void(0);">')+'</div>',
                'chapter_number'    : 0,
                'chapter_name'       : row.story_name,
                'chapter_slug'  : row.story_slug,
                'story_id'  : row.id,
                'story_slug': row.story_slug,
                'story_name'    : row.story_name

            };

            var insertSQL = 'INSERT INTO '+table+' SET ?';

            connection.query(insertSQL,pageInfo,function(err,resultInsert){
                if(err){
                    console.log('Error insert chapter table', err);
                    //process.kill(1);
                    //return;
                }

                console.log('Success insert chapter: ');
                var trData = {
                    'is_crawler':1,
                    'update_story':1
                };
                //console.log(trData);
                var updateSQL = 'UPDATE story SET ? WHERE ?';
                connection.query(updateSQL, [trData,{id:row.id}], function (err, resultInsert) {
                    if (err) {
                        console.log('Update lan 1 ERROR', err);
                        trData = {
                            'is_crawler':1
                        };
                        connection.query(updateSQL, [trData,{id:row.id}], function (err, resultInsert) {
                            if (err) {
                                console.log('Update lan 2 table ERROR', err);
                                trData = {
                                    'is_crawler':1
                                };

                            }else{
                                console.log('Update lan 2  success');
                                //run();
                            }

                            cb();
                        });

                    }else{
                        console.log('Update success insert table');

                        cb();
                    }
                });

            });

        }
    }]);
}

const args = process.argv;
console.log(args);
if(args.length<3){
    var sort = 'ASC';
}else{
    var sort = args[2];
}
run();
//getStoryInfo({link:'http://truyenfull.vn/chi-yeu-nuong-tu-tuyet-sac/'})
exports.run = run;
//run();
