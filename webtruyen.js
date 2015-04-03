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

function crawlerPage(pageInfo, done){
    var c = new Crawler({
        'maxConnections':10,
        'forceUTF8': true,
        'callback':function(error,result,$){}
    });

    c.queue([{
        'uri':pageInfo.url,
        'callback':function(error,result,$){

            //lay ra tong so trang
            reg = /[\d]+$/;

            if(pageInfo.page == pageInfo.totalPage){
                totalPage = (pageInfo.totalPage-1)*50+$('div.gridlistchapter tr').length;
            }

            $('div.gridlistchapter tr').each(function(index,tr){

                if(index==0){
                    return;
                }
                //call chapter
                td = $(tr).find('td');

                trData[index] = {
                    'numberPage'    : pageInfo.page,
                    'chapter'       : $(td).eq(2).text(),
                    'chapter_link'  : $(td).find('a').attr('href'),
                    'chapter_name'  : $(td).eq(3).text(),
                    'chapter_number': (pageInfo.page-1)*50+parseInt($(td).eq(0).text()),
                    'story_id'      : pageInfo.story_id,
                    'story_name'    : pageInfo.story_name,
                    'update_time'   : $(td).eq(4).text(),
                    'story_slug'    : pageInfo.story_slug,
                    'table'         : pageInfo.table
                };

            });
            /*fs.writeFile('logs/page_'+pageInfo.page,JSON.stringify(trData),function(err){
                if(err){
                    console.log('GHI FILE LOI');
                }else{
                    console.log('GHI FILE THANH CONG: '+pageInfo.page);
                }
            });*/

            async.each(trData, function(chapterInfo,cbChapter){
                return crawlerChapter(chapterInfo,cbChapter);

            }, function(err){
                //console.log("");
            });

        }
    }]);
}

function crawlerChapter(chapterInfo,cb){
    var c = new Crawler({
        'maxConnections':10,
        'forceUTF8': true,
        'callback':function(error,result,$){}
    });



    c.queue([{
        "uri":chapterInfo.chapter_link,
        "callback":function(error,result_chapter, $) {

            insertData = {
                'story_id'      : chapterInfo.story_id,
                'story_name'    : chapterInfo.story_name,
                'chapter'       : chapterInfo.chapter,
                'chapter_name'  : chapterInfo.chapter_name,
                'chapter_number': chapterInfo.chapter_number,
                'link'          : chapterInfo.chapter_link,
                'update_time'   : chapterInfo.update_time,
                'content'       : $('div#detailcontent').html(),
                'story_slug'    : chapterInfo.story_slug,
                'chapter_slug'  : slug(chapterInfo.chapter_name)
            };

            insertSQL = 'INSERT INTO '+chapterInfo.table+' SET ?';

            connection.query(insertSQL,insertData,function(err,resultInsert){
                if(err){
                    console.log('Error insert chapter table', err);
                    process.kill(1);
                    return;
                }

                console.log('Success insert chapter: ',chapterInfo.chapter,' - ', chapterInfo.chapter_name,
                    'processing index:',chapterInfo.chapter_number,' of:',totalPage);


                if(chapterInfo.chapter_number == (totalPage-1)){
                    console.log('Het rui dong ket noi cuoi cung');
                    //connection.end();

                    //setTimeout(function(){console.log('ket thuc sau 30 giay');},30000);
                    setTimeout(process.run, 30000);

                }
            });
        }
    }]);
    cb(null);
}

exports.crawlerPage = crawlerPage;
exports.crawlerChapter = crawlerChapter;