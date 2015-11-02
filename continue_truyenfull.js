/**
 * Created by tienn2t on 3/31/15.
 */
var Crawler         = require('crawler');
var mysql           = require('mysql');
var slug            = require('slug');
var async           = require('async');
var truyenfull       = require('./truyenfull_continue');
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
        console.log('Connected mysql db');
    });


    //get status pending to crawler
    //var query = 'SELECT * from story WHERE is_crawler=0 order by id desc LIMIT 1';
    var query = 'SELECT * from story WHERE status !="Full" AND is_crawler=1 order by id desc LIMIT 1';
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
            table = 'chapter_'+row.story_slug.substr(0,2);

            console.log(table+"-"+page);

            connection.query('SELECT COUNT(*) AS is_table FROM information_schema.tables WHERE table_name ="'+table+'"', function(err,results){
                //tao table neu chua ton tai
                console.log('tim ',results);
                getStoryInfo(row);
                if(results[0].is_table==0){
                    createTable = "CREATE TABLE IF NOT EXISTS "+'chapter_'+row.story_slug.substr(0,2)+" (id int(11) NOT NULL AUTO_INCREMENT,story_slug TEXT NOT NULL," +
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
                        getData(row, page, 'chapter_'+row.story_slug.substr(0,2));

                        //dong connection khi ca den phan tu cuoi cung
                        if(rows.indexOf(row) == (rows.length-1)){
                            connection.end();
                        }

                    });

                }else{
                    getData(row, page,'chapter_'+row.story_slug.substr(0,2));
                    if(rows.indexOf(row) == (rows.length-1)){
                        connection.end();
                    }
                }




            });
            return cb(null);
        }, function(error){
            console.log('FINISHED!!',error);//dong ket noi
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
    var c = new Crawler({
        'maxConnections':10,
        'forceUTF8': true,
        'userAgent': 'Mozilla/5.0 (X11; Linux i686 (x86_64)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36',
        'callback':function(error,result,$){}
    });
    c.queue([{
        'uri':obj.link,
        'callback':function(error,result,$){

            //lay ra tong so trang
            reg = /[\d]+$/;

            $('.col-truyen-main').each(function(index,div){
                var infoHolder = $(div).find('.info-holder');
                var image = infoHolder.find('.book img').attr('src');
                var total_page = parseInt($('#total-page').attr('value'));
                var src = infoHolder.find('.info .source').text();
                var lastestChapter = $(div).find('.l-chapter .l-chapters li').eq(0).text();
                var status = '';
                infoHolder.find('.info div span').each(function(i,span){
                    status = $(span).text();
                });

                var description = $(div).find('.desc-text').html();


                trData = {
                    'source'       : src,
                    'status'       : status,
                    'description'       : description,
                    'page':total_page,
                    'lastest_chapter':lastestChapter,
                    'is_crawler':2
                };
                //console.log(trData);
                updateSQL = 'UPDATE story SET ? WHERE ?';
                connection.query(updateSQL, [trData,{id:obj.id}], function (err, resultInsert) {
                    if (err) {
                        console.log('Update lan 1 ERROR', err);
			trData = {
		            'is_crawler':1
		        };
			connection.query(updateSQL, [trData,{id:obj.id}], function (err, resultInsert) {
		            if (err) {
		                console.log('Update lan 2 table ERROR', err);
				trData = {
				    'is_crawler':1
				};

		            }else{
		                console.log('Update lan 2  success');
				run();
		            }
		        });

                    }else{
                        console.log('Update success insert table');
                    }
                });
            });

        }
    }]);
}

function getData(row, page, table, totalPage){
    var conn = mysql.createConnection(configuration.MYSQL_CONFIG);

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
            totalPage = parseInt($('#total-page').attr('value'));

            //thong tin tung trang
            pageList = [];

            for(var i=1;i<=totalPage;i++){
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
                truyenfull.crawlerPage(pageInfo);

            }, function(errPage){
                console.log('Finished page');
            });
        }
    }]);
}
run();
//getStoryInfo({link:'http://truyenfull.vn/chi-yeu-nuong-tu-tuyet-sac/'})
exports.run = run;
//run();
