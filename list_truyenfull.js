/**
 * Created by tienn2t on 4/2/15.
 */
var Crawler = require('crawler');
var mysql   = require('mysql');
var slug    = require('slug');
var fs      = require('fs');
var async   = require('async');
var configuration   = require('./configuration');
var process = require('./crawlerAsyncTest');
var http    = require('http');

/**
 *
 * @param url
 * @param done
 */

var connection = mysql.createConnection(configuration.MYSQL_CONFIG);
var trData = [];
var totalPage = 0;

function crawlerPage(pageInfo){
    var c = new Crawler({
        'maxConnections':10,
        'forceUTF8': true,
        'userAgent': 'Mozilla/5.0 (X11; Linux i686 (x86_64)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36',
        'callback':function(error,result,$){}
    });
    console.log(pageInfo);
    if(pageInfo.current_page!=1){
        pageInfo.link =pageInfo.link+'trang-'+(pageInfo.current_page);
    }
    c.queue([{
        'uri':pageInfo.link,
        'callback':function(error,result,$){

            //lay ra tong so trang
            reg = /[\d]+$/;

            $('.col-truyen-main div.list-truyen .row').each(function(index,div){

                link = $(div).find('a').eq(0).attr('href');
                name = $(div).find('.truyen-title a').text();
                trData = {
                    'category_name'    : pageInfo.category_name,
                    'category_id'       : pageInfo.id,
                    'category_slug'  : pageInfo.category_slug,
                    'author':$(div).find('.author').text(),
                    'story_name':  name ,
                    'story_slug': slug(name),
                    'link': $(div).find('.truyen-title a').attr('href')
                };
                insertSQL = 'INSERT INTO story SET ?';
                connection.query(insertSQL, trData, function (err, resultInsert) {
                    if (err) {
                        console.log('Error insert table', err);
                        //process.kill(1);
                        //return;
                    }
                });
                trData.img_xs = $(div).find('img.visible-xs-block').attr('src');
                trData.img_sm = $(div).find('img.visible-sm-block').attr('src');
                crawlerImage(trData);
            });
            //console.log(trData);
            /*async.each(trData, function(chapterInfo,cbChapter){
                return crawlerChapter(chapterInfo,cbChapter);

            }, function(err){
                //console.log("");
            });*/

        }
    }]);
}

/**
 * download image
 * @param obj
 */
function crawlerImage(obj){
    console.log(obj);
    var request = http.get(obj.img_sm, function(res) {
        var imagedata = '';
        res.setEncoding('binary');

        res.on('data', function(chunk){
            imagedata += chunk
        });

        res.on('end', function(){
            fs.writeFile(obj.category_slug+'/'+obj.story_slug+'-sm.jpg', imagedata, 'binary', function(err){
                if (err) throw err;
                console.log('File saved.');
            })
        });
    });
    request = http.get(obj.img_xs, function(res) {
        //response.pipe(file);
        var imagedata = '';
        res.setEncoding('binary');

        res.on('data', function(chunk){
            imagedata += chunk
        });

        res.on('end', function(){
            fs.writeFile(obj.category_slug+'/'+obj.story_slug+'-xs.jpg', imagedata, 'binary', function(err){
                if (err) throw err;
                console.log('File saved.');
            })
        });
        console.log('DONE');
    });
}

function run(){
    var c = new Crawler({
        'maxConnections': 10,
        'forceUTF8': true,
        'callback': function (error, result, $) {
        }
    });
    try {
        var configuration = require('./configuration');
        var connection = mysql.createConnection(configuration.MYSQL_CONFIG);
        var sql = "SELECT * from category WHERE current_page <= total_page ORDER BY id ASC LIMIT 1";

        connection.query(sql, function (err, rows) {
            // connected! (unless `err` is set)
            if (err) {
                console.error("Get data error: ", err.stack);
                return;
            }
            if (rows) {
                //update crawler page
                var total = 0;
                async.each(rows, function (row, cb) {
                    total = row.current_page + configuration.NUMBER_OF_STORY;
                    if(total>row.total_page){
                        total = row.total_page+1;
                    }
                    sql = "UPDATE category SET ? WHERE ?";
                    connection.query(
                        sql,
                        [
                            {
                                current_page:total
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
                            connection.end();
                            console.log('Da dong ket noi');

                        }
                    );
                    var current = row.current_page;
                    for(var s=current;s<total;s++){
                        row.current_page = s;
                        crawlerPage(row);
                    }
                });


            }
        });
    }catch(e){
        console.log(e);
    }
}

function crawlerChapter(chapterInfo) {
    var c = new Crawler({
        'maxConnections': 10,
        'forceUTF8': true,
        'userAgent': 'Mozilla/5.0 (X11; Linux i686 (x86_64)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36',
        'callback': function (error, result, $) {
        }
    });
    c.queue([{
        'uri': chapterInfo.chapter_link,
        'callback': function (error, result, $) {
            var content = $('div.chapter-content').html();
            insertData = {
                'chapter_number'    : chapterInfo.chapter_number,
                'chapter_name'       : chapterInfo.chapter_name,
                'chapter_slug'  : chapterInfo.chapter_slug,
                'story_id'  : chapterInfo.story_id,
                'story_slug': chapterInfo.story_slug,
                'story_name'    : chapterInfo.story_name,
                'content'       : content,
            };
            insertSQL = 'INSERT INTO '+chapterInfo.table+' SET ?';

            connection.query(insertSQL,insertData,function(err,resultInsert){
                if(err){
                    console.log('Error insert chapter table', err);
                    process.kill(1);
                    return;
                }

                console.log('Success insert chapter: ',chapterInfo.chapter_number,' - ', chapterInfo.chapter_name,
                    'processing index:',chapterInfo.chapter_number);


                /*if(chapterInfo.chapter_number == (totalPage-1)){
                    console.log('Het rui dong ket noi cuoi cung');
                    //connection.end();

                    setTimeout(function(){console.log('ket thuc sau 30 giay');},30000);
                    //setTimeout(process.run, 30000);

                }*/
            });
        }

    }]);
}

/*var category  = [
    {
    'url': 'http://truyenfull.vn/the-loai/tien-hiep/trang-1/',
    'category_name':'Tiên Hiệp',
    'category_slug':'tien-hiep',
    'story_slug': 'tien-hiep',
    'page':1,
    }
];
async.each(category,function(info,cb){
    crawlerPage(info);
});*/
run();
exports.crawlerPage = crawlerPage;
exports.crawlerChapter = crawlerChapter;