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
    c.queue([{
        'uri':pageInfo.url,
        'callback':function(error,result,$){

            //lay ra tong so trang
            reg = /[\d]+$/;

            $('ul.list-truyen .row').each(function(index,div){

                link = $(li).find('a').eq(0).attr('href');
                name = $(li).find('a').eq(0).text();
                trData[index] = {
                    'category_name'    : pageInfo.category_name,
                    'category_id'       : pageInfo.category_id,
                    'category_slug'  : pageInfo.category_slug,
                    'story_name'  : $(div).find('.truyen-title a').text(),
                    'story_slug': pageInfo.story_slug,
                    'img_xs'    : $(div).find('img.visible-xs-block').attr('src'),
                    'img_sm'    : $(div).find('img.visible-sm-block').attr('src'),
                    'chapter_link': $(div).find('.truyen-title a').attr('href')
                };

            });
            console.log(trData);
            /*async.each(trData, function(chapterInfo,cbChapter){
                return crawlerChapter(chapterInfo,cbChapter);

            }, function(err){
                //console.log("");
            });*/

        }
    }]);
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

var category  = [
    {
    'url': 'http://truyenfull.vn/the-loai/tien-hiep/trang-1/',
    'category_name':'Tiên Hiệp',
    'story_slug': 'tien-hiep',
    'page':1
    }
];
async.each(category,function(info,cb){
    crawlerPage(info);
});

exports.crawlerPage = crawlerPage;
exports.crawlerChapter = crawlerChapter;