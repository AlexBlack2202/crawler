/**
 * Created by tienn2t on 4/2/15.
 */
'use strict';
var Crawler = require('crawler');
var jsdom = require("jsdom");
var fs = require('fs');
var jquery = fs.readFileSync("jquery-1.12.1.min.js", "utf-8");
var mysql   = require('mysql');
var slug    = require('slug');
var fs      = require('fs');
var async   = require('async');
var configuration   = require('./configuration');
//var process = require('./main_truyenfull_update');

/**
 *
 * @param url
 * @param done
 */

var connection = mysql.createConnection(configuration.MYSQL_CONFIG);
var trData = [];
var totalPage = 0;

function crawlerPage(pageInfo,cbPage){
	
	jsdom.env({
        url: pageInfo.url,
        src: [jquery],
        done: function (err, window) {
            //console.log("there have been", window.$("a").length - 4, "io.js releases!");
            var $ = window.$;
			var reg = /[\d]+$/;
            var totalTr = $('#dschuong tbody  tr').length - 2;
            if(pageInfo.page == pageInfo.totalPage){
                totalPage = (pageInfo.totalPage-1)*10+totalTr;
            }
            $('#dschuong tbody  tr').each(function(index,li){
                if(index > totalTr-1){
                    return;
                }
                var link = $(li).find('a').eq(0).attr('href');
                var name = $(li).find('a').eq(0).text();
                name = name.trim();
                trData[index] = {
                    'chapter_number'    : (pageInfo.page-1)*10+index+1,
                    'chapter_name'       : name,
                    'chapter_slug'  : slug(name),//link.replace('http://truyenfull.vn',''),
                    'story_id'  : pageInfo.story_id,
                    'story_slug': pageInfo.story_slug,
                    'story_name'    : pageInfo.story_name,
                    'chapter_link': link,
                    'table':pageInfo.table,
                    'totalPage':pageInfo.totalPage,
                    'page':pageInfo.page
                };

            });
            //console.log(trData);
            if(connection==null){
                connection = mysql.createConnection(configuration.MYSQL_CONFIG);
            }
            async.each(trData, function(chapterInfo,cbChapter){
                return crawlerChapter(chapterInfo,cbChapter);

            }, function(err){
                //console.log("");
				window.close();
                cbPage();
            });
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
    //console.log(pageInfo);
    c.queue([{
        'uri':pageInfo.url,
        'callback':function(error,result,$){

            //lay ra tong so trang
            var reg = /[\d]+$/;
            if(pageInfo.page == pageInfo.totalPage){
                totalPage = (pageInfo.totalPage-1)*50+$('#list-chapter .list-chapter li').length;
            }
            $('ul.list-chapter li').each(function(index,li){

                var link = $(li).find('a').eq(0).attr('href');
                var name = $(li).find('a').eq(0).text();
                trData[index] = {
                    'chapter_number'    : (pageInfo.page-1)*50+index+1,
                    'chapter_name'       : name,
                    'chapter_slug'  : slug(name),//link.replace('http://truyenfull.vn',''),
                    'story_id'  : pageInfo.story_id,
                    'story_slug': pageInfo.story_slug,
                    'story_name'    : pageInfo.story_name,
                    'chapter_link': link,
                    'table':pageInfo.table,
                    'totalPage':pageInfo.totalPage,
                    'page':pageInfo.page
                };

            });
            //console.log(trData);
            if(connection==null){
                connection = mysql.createConnection(configuration.MYSQL_CONFIG);
            }
            async.each(trData, function(chapterInfo,cbChapter){
                return crawlerChapter(chapterInfo,cbChapter);

            }, function(err){
                //console.log("");
                cbPage();
            });

        }
    }]);*/
}

function crawlerChapter(chapterInfo,cbChapter) {
    /** crawler by json */

    jsdom.env({
        url:chapterInfo.chapter_link,
        src: [jquery],
        done:function (err, window) {
            //console.log("there have been", window.$("a").length - 4, "io.js releases!");
            if(typeof window == 'undefined'){
                return cbChapter();
            }
            var $ = window.$;
            try{
                var content = $('div.boxview').html();
            }catch (e){
                console.log('ERROR link '.chapterInfo.chapter_link,e.message);
				window.close();
                return cbChapter();
            }


            if(content !=null){
                content.replace(/\<a[^>]+\>/g,'<a href="javascript:void(0);">');
            }
            var insertData = {
                'chapter_number'    : chapterInfo.chapter_number,
                'chapter_name'       : chapterInfo.chapter_name,
                'chapter_slug'  : chapterInfo.chapter_slug,
                'story_id'  : chapterInfo.story_id,
                'story_slug': chapterInfo.story_slug,
                'story_name'    : chapterInfo.story_name,
                'content'       : content,
            };
            var insertSQL = 'INSERT INTO '+chapterInfo.table+' SET ? ON DUPLICATE KEY UPDATE content = ?';

            connection.query(insertSQL,[insertData,content],function(err,resultInsert){
                if(err){
                    console.log('Error insert chapter table', err);
                    //process.kill(1);
                    //return
					window.close();
					cbChapter();
                }else{

					console.log('Success insert chapter: ',chapterInfo.chapter_number,' - ', chapterInfo.chapter_name,
                    'processing index:',chapterInfo.chapter_number);
					window.close();
					cbChapter();
				}
            });
        }
}); 

    /** end crawler jsdowm */

    /*
	var c = new Crawler({
        'maxConnections': 10,
        'forceUTF8': true,
        'userAgent': 'Mozilla/5.0 (X11; Linux i686 (x86_64)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36',
        'callback': function (error, result, $) {
        }
    });
	c.queue([{
        'uri': chapterInfo.chapter_link,
        'callback':function(error,result,$){
			console.log('LINK',chapterInfo.chapter_link);
            var content = $('div.chapter-c').html();
		}
	}]);
	return;
    c.queue([{
        'uri': chapterInfo.chapter_link,
        'callback': function (error, result, $) {
            //try{
				console.log('LINK',chapterInfo.chapter_link);
                var content = $('div.chapter-c').html();
            //}catch (e){
              //  console.log('ERROR link '.chapterInfo,e.message);
               // return cbChapter();
            //}


            if(content !=null){
                content.replace(/\<a[^>]+\>/g,'<a href="javascript:void(0);">');
            }
            var insertData = {
                'chapter_number'    : chapterInfo.chapter_number,
                'chapter_name'       : chapterInfo.chapter_name,
                'chapter_slug'  : chapterInfo.chapter_slug,
                'story_id'  : chapterInfo.story_id,
                'story_slug': chapterInfo.story_slug,
                'story_name'    : chapterInfo.story_name,
                'content'       : content,
            };
            var insertSQL = 'INSERT INTO '+chapterInfo.table+' SET ? ON DUPLICATE KEY UPDATE content = ?';
	    	
            connection.query(insertSQL,[insertData,content],function(err,resultInsert){
                if(err){
                    console.log('Error insert chapter table', err);
                    //process.kill(1);
                   return cbChapter();
                }

                console.log('Success insert chapter: ',chapterInfo.chapter_number,' - ', chapterInfo.chapter_name,
                    'processing index:',chapterInfo.chapter_number);
                cbChapter();

            });
        }

    }]);
	*/
}

/*var chapters = [];
 for(var i=1;i<=54;i++) {
 var pageInfo  = {
 'url': 'http://truyenfull.vn/truyen-than-khong-thien-ha/trang-'+i+'/#list-chapter',
 'story_id': 1,
 'story_name':'Thần khổng thiên hạ',
 'story_slug': 'than-khong-thien-ha',
 'page':i,
 'totalPage':54,
 'table':'th'
 };
 chapters.push(crawlerPage(pageInfo));
 }
 /!*async.each(chapters,function(pageInfo,cb){
 crawlerPage(pageInfo);
 },function(error){});*!/

 async.parallel(chapters,function(){
 console.log('ket thuc');
 });*/

exports.crawlerPage = crawlerPage;
exports.crawlerChapter = crawlerChapter;
