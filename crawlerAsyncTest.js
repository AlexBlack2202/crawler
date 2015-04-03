/**
 * Created by tienn2t on 3/31/15.
 */
var Crawler         = require('crawler');
var mysql           = require('mysql');
var slug            = require('slug');
var async           = require('async');
var webtruyen       = require('./webtruyen');
var configuration   = require('./configuration');


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
    connection.query('SELECT * from story WHERE category_slug !="truyen-ngan" AND status="pending" LIMIT '+configuration.NUMBER_OF_STORY, function(err, rows) {
        // connected! (unless `err` is set)
        if(err){
            console.error("Get data error: ", err.stack);
            return;
        }
        console.log(rows);
        async.each(rows, function(row,cb){
            console.log(row.link);
            page = row.page;
            title = row.story_slug;
            table = title.substr(0,2)+'_story';

            console.log(table);

            connection.query('SELECT COUNT(*) AS is_table FROM information_schema.tables WHERE table_name ="'+row.story_slug.substr(0,2)+'_story'+'"', function(err,results){
                //tao table neu chua ton tai
                if(results[0].is_table==0){
                    createTable = "CREATE TABLE IF NOT EXISTS "+row.story_slug.substr(0,2)+'_story'+" (id int(11) NOT NULL AUTO_INCREMENT,story_slug TEXT NOT NULL," +
                        "story_id int(11) NOT NULL,chapter_name text NOT NULL,chapter text NOT NULL, " +
                        "update_time varchar(30) NOT NULL, story_name text NOT NULL,chapter_number int(11), link text NOT NULL, " +
                        "content text NOT NULL, chapter_slug text NOT NULL, PRIMARY KEY (id)) ENGINE=InnoDB  DEFAULT CHARSET=utf8";

                    connection.query(createTable,function(err,results){
                        if(err){
                            console.log('Create table ',row.story_slug.substr(0,2)+'_story', 'failed!');
                        }
                        //get data
                        console.log('Create table ',row.story_slug.substr(0,2)+'_story', 'successful');
                        getData(row, page, row.story_slug.substr(0,2)+'_story');

                        //dong connection khi ca den phan tu cuoi cung
                        if(rows.indexOf(row) == (rows.length-1)){
                            connection.end();
                        }

                    });

                }else{
                    getData(row, page, row.story_slug.substr(0,2)+'_story');
                    if(rows.indexOf(row) == (rows.length-1)){
                        connection.end();
                    }
                }




            });
            return cb(null);
        }, function(error){
            console.log('FINISHED!!');//dong ket noi
        });

    });
}

function getData(row, page, table, totalPage){
    var conn = mysql.createConnection(configuration.MYSQL_CONFIG);

    var c = new Crawler({
        'maxConnections':10,
        'forceUTF8': true,
        'callback':function(error,result,$){}
    });

    //console.log(row);
    if(totalPage==='undefined'){
        totalPage = 0;
    }

    c.queue([{
        'uri':row.link+'/'+page+'/',
        'callback':function(error,result,$){

            //lay ra tong so trang
            reg = /[\d]+$/;
            totalPage = parseInt($('.numbpage').text().match(reg)[0]);

            //cap nhat truyen
            author = $('div.contdetail span.author').text();
            source = $('div.contdetail span.type').eq(1).text();
            status = $('div.contdetail span.status').text();
            short_description = $('.mota').html();
            total_view = parseInt($('div.contdetail span.view').text().match(reg)[0]);

            console.log(total_view);

            updateSql = 'UPDATE story SET ? WHERE ?';

            conn.query(
                updateSql,
                [
                    {
                        author:author,
                        source:source,
                        status:status,
                        page:page,
                        short_description:short_description,
                        total_view:short_description
                    },
                    {
                        id:row.id
                    }

                ],
                function(err,rs){
                    if(err){
                        console.log('Update error', err.stack);
                        return;

                    }

                    //dong ket noi
                    conn.end();
                    console.log('Da dong ket noi');

                }
            );
            //thong tin tung trang
            pageList = [];

            for(var i=1;i<=totalPage;i++){
                pageList[i] = {
                    'totalPage'     :totalPage,
                    'story_id'      : row.id,
                    'story_name'    : row.title,
                    'story_slug'    : row.story_slug,
                    'table'         : table,
                    'page'          : i,
                    'url'           : row.link+i,
                    'update_unixtime' : parseInt(new Date().getTime()/1000)

                };
            }

            console.log(pageList);
            async.each(pageList, function(pageInfo, cbPage){
                webtruyen.crawlerPage(pageInfo);

            }, function(errPage){
                console.log('Finished page');
            });
        }
    }]);
}


exports.run = run;