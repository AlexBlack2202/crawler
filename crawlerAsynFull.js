/**
 * Created by tienn2t on 3/31/15.
 */
var Crawler         = require('crawler');
var mysql           = require('mysql');
var slug            = require('slug');
var async           = require('async');
var truyenfull       = require('./truyenfullold');
var configuration   = require('./configuration');


function run(){
    var connection = mysql.createConnection(configuration.MYSQL_STORY_CONFIG);

    connection.connect(function(error){
        if(error){
            console.log('error connecting: ',error.stack);
            return;
        }
        console.log('Connected mysql db');
    });


    //get status pending to crawler
    connection.query('SELECT * from story WHERE category_slug !="truyen-ngan" AND ' +
        'link="http://truyenfull.vn/gap-em-noi-tan-cung-the-gioi/"', function(err, rows) {
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
            table = row.story_slug.substr(0,2)+'_story';

            console.log(table+"-"+page);

            connection.query('SELECT COUNT(*) AS is_table FROM information_schema.tables WHERE table_name ="'+table+'"', function(err,results){
                //tao table neu chua ton tai
                if(results[0].is_table==0){
                    createTable = "CREATE TABLE IF NOT EXISTS "+table+" (id int(11) NOT NULL AUTO_INCREMENT,story_slug TEXT NOT NULL," +
                        "story_id int(11) NOT NULL,chapter_name text NOT NULL, " +
                        "`time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, story_name text NOT NULL,chapter_number int(11) NOT NULL, link text NOT NULL, " +
                        "content text NOT NULL, chapter_slug text NOT NULL, PRIMARY KEY (id)) ENGINE=InnoDB  DEFAULT CHARSET=utf8";

                    connection.query(createTable,function(err,results){
                        if(err){
                            console.log('Create table ',table, 'failed!');
                        }
                        //get data
                        console.log('Create table ',table+'_full', 'successful');
                        getData(row, page, table);

                        //dong connection khi ca den phan tu cuoi cung
                        if(rows.indexOf(row) == (rows.length-1)){
                            connection.end();
                        }

                    });

                }else{
                    getData(row, page,table);
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

function getData(row, page, table, totalPage){
    var conn = mysql.createConnection(configuration.MYSQL_HOST_CONFIG);

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

            //cap nhat truyen
            author = 'aa';//$('div.contdetail span.author').text();
            source ='aa';// $('div.contdetail span.type').text();
            status ='aa';//$('div.contdetail span.status').text();
            short_description = 'aa';//$('.mota').html();
            total_view = 100;//parseInt($('div.contdetail span.view').text().match(reg)[0]);

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
                var pageInfo  = {
                    'url': row.link+'trang-'+i+'/#list-chapter',
                    'story_id': row.id,
                    'story_name':'Thần khổng thiên hạ',
                    'story_slug': 'than-khong-thien-ha',
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
exports.run = run;
//run();
