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
            var page = row.page;
            var title = row.story_slug;
            var table = 'chapter_'+row.story_slug.substr(0,2);

            console.log(table+"-"+page);

            connection.query('SELECT COUNT(*) AS is_table FROM information_schema.tables WHERE table_name ="'+table+'"', function(err,results){
                //tao table neu chua ton tai
                console.log('tim ',results);
                getStoryInfo(row);
                if(results[0].is_table==0){
                    var createTable = "CREATE TABLE IF NOT EXISTS "+'chapter_'+row.story_slug.substr(0,2)+" (id int(11) NOT NULL AUTO_INCREMENT,story_slug TEXT NOT NULL," +
                        "story_id int(11) NOT NULL,chapter_name text NOT NULL, " +
                        "`time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, story_name text NOT NULL,chapter_number int(11) NOT NULL, link text NOT NULL, " +
                        "content longtext NOT NULL, chapter_slug text NOT NULL, PRIMARY KEY (id),UNIQUE KEY `id_box_elements` (`story_id`,`chapter_number`)) ENGINE=InnoDB  DEFAULT CHARSET=utf8";
console.log(createTable);
                    connection.query(createTable,function(err,results){
                        if(err){
                            console.log('Create table ',table, 'failed!');
                        }
                        //get data
                        console.log('Create table ',table, 'successful');
                        getData(row, page, 'chapter_'+row.story_slug.substr(0,2),cb);

                    });

                }else{
                    getData(row, page,'chapter_'+row.story_slug.substr(0,2),cb);
                }




            });
        }, function(){
            console.log('FINISHED CRAWLER STORY!!');//dong ket noi
            connection.end();
            run();
        });

    });
}

function getStoryInfo(obj){
    var connection = mysql.createConnection(configuration.MYSQL_CONFIG);

    connection.connect(function(error){
        if(error){
            console.log('error connecting: ',error.stack);
            return;
        }
        console.log('Connected mysql db');
    });
    jsdom.env({
        url: obj.link,
        src: [jquery],
        done: function (err, window) {
            //console.log("there have been", window.$("a").length - 4, "io.js releases!");
            var $ = window.$;
            //lay ra tong so trang
            var reg = /[\d]+$/;

            $('.col-truyen-main').each(function (index, div) {
                var infoHolder = $(div).find('.info-holder');
                var image = infoHolder.find('.book img').attr('src');
                var request = http.get(image, function (res) {
                    var imagedata = '';
                    res.setEncoding('binary');

                    res.on('data', function (chunk) {
                        imagedata += chunk
                    });

                    res.on('end', function () {
                        fs.writeFile(obj.category_slug + '/' + obj.story_slug + '-md.jpg', imagedata, 'binary', function (err) {
                            if (err) throw err;
                            console.log('File saved.');
                        })
                    });
                });
                var total_page = parseInt($('#total-page').attr('value'));
                var src = infoHolder.find('.info .source').text();
                var lastestChapter = $(div).find('.l-chapter .l-chapters li').eq(0).text();
                var status = '';
                infoHolder.find('.info div span').each(function (i, span) {
                    status = $(span).text();
                });

                var description = $(div).find('.desc-text').html();


                var trData = {
                    'source': src,
                    'status': status,
                    'description': description,
                    'page': total_page,
                    'lastest_chapter': lastestChapter,
                    'is_crawler': 1,
                    'update_story': 1
                };
                //console.log(trData);
                var updateSQL = 'UPDATE story SET ? WHERE ?';
                connection.query(updateSQL, [trData, {id: obj.id}], function (err, resultInsert) {
                    if (err) {
                        console.log('Update lan 1 ERROR', err);
                        trData = {
                            'is_crawler': 1
                        };
                        connection.query(updateSQL, [trData, {id: obj.id}], function (err, resultInsert) {
                            if (err) {
                                console.log('Update lan 2 table ERROR', err);
                                trData = {
                                    'is_crawler': 1
                                };

                            } else {
                                console.log('Update lan 2  success');
                                //run();
                            }
                            connection.end();
                        });

                    } else {
                        console.log('Update success insert table');
                        connection.end();
                    }
                });
            });
        }
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
            totalPage = parseInt($('#total-page').attr('value'));

			/*
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
			*/
			
			var i = page;
			function _run(){
				if(i<=totalPage){
					var pageList = [];
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
