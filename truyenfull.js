/**
 * Created by tienn2t on 3/31/15.
 */
var Crawler         = require('crawler');
var mysql           = require('mysql');
var slug            = require('slug');
var async           = require('async');
var truyenfull       = require('./truyenfull');
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
    connection.query('SELECT * from story WHERE ' +
        'link="http://truyenfull.vn/dan-tu/"', function(err, rows) {
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
                if(results[0].is_table==0){
                    getStoryInfo(row);
                    createTable = "CREATE TABLE IF NOT EXISTS "+table+" (id int(11) NOT NULL AUTO_INCREMENT,story_slug TEXT NOT NULL," +
                        "story_id int(11) NOT NULL,chapter_name text NOT NULL, " +
                        "`time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, story_name text NOT NULL,chapter_number int(11) NOT NULL, link text NOT NULL, " +
                        "content long text NOT NULL, chapter_slug text NOT NULL, PRIMARY KEY (id)) ENGINE=InnoDB  DEFAULT CHARSET=utf8";

                    connection.query(createTable,function(err,results){
                        if(err){
                            console.log('Create table ',table, 'failed!');
                        }
                        //get data
                        console.log('Create table ',table+'_full', 'successful');
                        //getData(row, page, table);

                        //dong connection khi ca den phan tu cuoi cung
                        if(rows.indexOf(row) == (rows.length-1)){
                            connection.end();
                        }

                    });

                }else{
                    //getData(row, page,table);
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
                var request = http.get(image, function(res) {
                    var imagedata = '';
                    res.setEncoding('binary');

                    res.on('data', function(chunk){
                        imagedata += chunk
                    });

                    res.on('end', function(){
                        fs.writeFile(obj.category_slug+'/'+obj.story_slug+'-md.jpg', imagedata, 'binary', function(err){
                            if (err) throw err;
                            console.log('File saved.');
                        })
                    });
                });
                var total_page = parseInt($('#total-page').attr('value'));
                var src = infoHolder.find('.info .source').text();;
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
                    'is_crawler':1
                };
                console.log(trData);
                updateSQL = 'UPDATE story SET ? WHERE ?';
                connection.query(updateSQL, [trData,{id:obj.id}], function (err, resultInsert) {
                    if (err) {
                        console.log('Update insert table', err);
                        //process.kill(1);
                        //return;
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
//getStoryInfo({link:'http://truyenfull.vn/chi-yeu-nuong-tu-tuyet-sac/'})
exports.run = run;
//run();
