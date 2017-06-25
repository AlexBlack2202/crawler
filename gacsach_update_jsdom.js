/**
 * Created by tienn2t on 3/31/15.
 */
'use strict';
var Crawler         = require('crawler');
var fs = require('fs');
var jquery = fs.readFileSync("jquery-1.12.1.min.js", "utf-8");
var jsdom = require("jsdom");
var mysql           = require('mysql');
var slug            = require('slug');
var async           = require('async');
var truyenfull       = require('./gacsach_detail');
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
    var query = 'SELECT * from gacsach_story WHERE  (is_crawler=0 or (status="Đang ra" AND update_story = 0)) AND id >0 order by id  ASC LIMIT 1';
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
            var page = row.page;
            var title = row.story_slug;
            var updateSQL = 'UPDATE gacsach_story SET ? WHERE ?';
            var trData = {
                'is_crawler': 1
            };
            connection.query(updateSQL, [trData, {id: row.id}], function (err, resultInsert) {
                if (err) {
                    console.log('Update lan 1 ERROR', err);

                    connection.query(updateSQL, [trData, {id: obj.id}], function (err, resultInsert) {
                        if (err) {
                            console.log('Update lan 2 table ERROR', err);
                            trData = {
                                'is_crawler': 1
                            };

                        } else {
                            console.log('Update lan 2  success');
                            getData(row, page,'gacsach_chapter',cb);
                        }
                    });

                } else {
                    console.log('Update success insert table');
                    getData(row, page,'gacsach_chapter',cb);
                }
            });
        }, function(){
            console.log('FINISHED CRAWLER STORY!!');//dong ket noi
            connection.end();
            run();
        });

    });
}


function getData(row, page, table, cb,totalPage){
	jsdom.env({
        url: row.link,
        src: [jquery],
        done: function (err, window) {
            //console.log("there have been", window.$("a").length - 4, "io.js releases!");
            var $ = window.$;
			var reg = /[\d]+$/;
            //totalPage = parseInt($('#total-page').attr('value'));
            totalPage = 1;

			
			var i = page;
			function _run(){
				if(i<=totalPage){
					var pageList = [];
					var pageInfo  = {
						'url': row.link,
						'story_id': row.id,
						'story_name':row.story_name,
						'story_slug': row.story_slug,
						'page':i,
						'totalPage':totalPage,
						'table':table
					};
					pageList.push(pageInfo);
					console.log(pageInfo);
					async.each(pageList, function(pageInfo, cbPage){
						truyenfull.crawlerPage(pageInfo,cbPage);

					}, function(errPage){
						console.log('Finished page ',i);
						i++;
						_run();
					});
				}else{
					cb();
				}
			}
			
			_run();
		}
	});
	/** end jsdom */
	
	

	/*
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
            var reg = /[\d]+$/;
            totalPage = parseInt($('#total-page').attr('value'));

            //thong tin tung trang
            var pageList = [];

            for(var i=page;i<=totalPage;i++){
                var pageInfo  = {
                    'url': row.link+'trang-'+i+'/#list-chapter',
                    'story_id': row.id,
                    'story_name':row.story_name,
                    'story_slug': row.story_slug,
                    'page':i,
                    'totalPage':totalPage,
                    'table':table
                };
                pageList.push(pageInfo);
            }

            console.log(pageList);
            async.each(pageList, function(pageInfo, cbPage){
                truyenfull.crawlerPage(pageInfo,cbPage);

            }, function(errPage){
                console.log('Finished page');
                cb();
            });
        }
    }]);
	*/
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
