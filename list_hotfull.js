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
//var connection = mysql.createConnection(configuration.MYSQL_HOSTGATO_CONFIG);
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

            var totalStory = $('.col-truyen-main div.list-truyen .row').length;

            $('.col-truyen-main div.list-truyen .row').each(function(index,div){

                link = $(div).find('a').eq(0).attr('href');
                name = $(div).find('.truyen-title a').text();
                hot = 0;
                status = 'Đang ra';
                if($(div).find('.label-title').hasClass('label-hot')){
                    hot = 1;
                }
                if($(div).find('.label-title').hasClass('label-full')){
                    status = 'Full';
                }
                trData = {
                    'category_name'    : pageInfo.category_name,
                    'category_id'       : pageInfo.id,
                    'category_slug'  : pageInfo.category_slug,
                    'author':$(div).find('.author').text(),
                    'story_name':  name ,
                    'story_slug': slug(name),
                    'link': $(div).find('.truyen-title a').attr('href'),
                    'hot':hot,
                    'status':status
                };

                updateData = {
                    hot:hot,
                    //sorder:index+(pageInfo.current_page-1)*totalStory+1, //khi nao chay cho hot thi moi update sorder
                    //status:status
                }
                console.log(trData);
                updateSQL = 'INSERT INTO story SET ? ON DUPLICATE KEY UPDATE ?';
                connection.query(updateSQL, [trData,updateData], function (err, resultInsert) {
                    if (err) {
                        console.log('UPDATE story table ERROR', err);
                        //process.kill(1);
                        //return;
                    }else{
                        if(index== (totalStory-1)){
                            setTimeout(function(){
                                console.log('ket thuc sau 30 giay het trang ',pageInfo.current_page);
                                //run(pageInfo.current_page+1);
                            },30000);
                        }
                    }
                });
                trData.img_xs = $(div).find('img.visible-xs-block').attr('src');
                trData.img_sm = $(div).find('img.visible-sm-block').attr('src');
                crawlerImage(trData);
            });

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

function run(current_page){
    try {
        if(current_page == null || current_page == undefined){
            current_page = 1;
        }
        var row = {
            link:'http://truyenfull.vn/danh-sach/truyen-moi/',
            //link:'http://truyenfull.vn/danh-sach/truyen-hot/',
            category_name: 'Truyện Mới',
            category_slug: 'truyen-moi',
            id:30,
            current_page:current_page,
            total_page:105
        };

        var total = row.current_page + configuration.NUMBER_OF_STORY;
        if(total>row.total_page){
            total = row.total_page+1;
        }
        for(var s=row.current_page;s<total;s++){
            row.current_page = s;
            crawlerPage(row);
        }
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