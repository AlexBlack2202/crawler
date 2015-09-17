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

            $('ul.list-chapter li').each(function(index,li){

                link = $(li).find('a').eq(0).attr('href');
                name = $(li).find('a').eq(0).text();
                trData[index] = {
                    'chapter_number'    : (pageInfo.page-1)*50+index+1,
                    'chapter_name'       : name,
                    'chapter_slug'  : slug(name),//link.replace('http://truyenfull.vn',''),
                    'story_id'  : pageInfo.story_id,
                    'story_slug': pageInfo.story_slug,
                    'story_name'    : pageInfo.story_name,
                    'chapter_link': link,
                    'table':pageInfo.table
                };

            });
            //console.log(trData);
            async.each(trData, function(chapterInfo,cbChapter){
                return crawlerChapter(chapterInfo,cbChapter);

            }, function(err){
                //console.log("");
            });

        }
    }]);
}

function crawlerChapter(chapterInfo){
    var c = new Crawler({
        'maxConnections':10,
        'forceUTF8': true,
        'callback':function(error,result,$){}
    });
    console.log(chapterInfo.chapter_link);
    c.queue([{
        "uri":chapterInfo.chapter_link,
        "callback":function(error,result, $) {
            insertData = {
                'chapter_number'    : chapterInfo.chapter_number,
                'chapter_name'       : chapterInfo.chapter_name,
                'chapter_slug'  : chapterInfo.chapter_slug,
                'story_id'  : chapterInfo.story_id,
                'story_slug': chapterInfo.story_slug,
                'story_name'    : chapterInfo.story_name,
                'content'       : $('div.chapter-content').html(),
            };

            insertSQL = 'INSERT INTO '+chapterInfo.table+' SET ?';

            connection.query(insertSQL,insertData,function(err,resultInsert){
                if(err){
                    console.log('Error insert chapter table', err);
                    process.kill(1);
                    return;
                }

                console.log('Success insert chapter: ',chapterInfo.chapter,' - ', chapterInfo.chapter_name,
                    'processing index:',chapterInfo.chapter_number);


                if(chapterInfo.chapter_number == (totalPage-1)){
                    console.log('Het rui dong ket noi cuoi cung');
                    //connection.end();

                    //setTimeout(function(){console.log('ket thuc sau 30 giay');},30000);
                    setTimeout(process.run, 30000);

                }
            });
        }
    }]);
}

var pageInfo  = {
    'url': 'http://truyenfull.vn/vu-cuc-thien-ha/trang-1/#list-chapter',
    'story_id': 1,
    'story_name':'Vũ cực thiên hạ',
    'story_slug': 'vu-cuc-thien-ha',
    'page':1,
    'totalPage':10,
    'table':'kh_story'
};

crawlerPage(pageInfo);

exports.crawlerPage = crawlerPage;
exports.crawlerChapter = crawlerChapter;