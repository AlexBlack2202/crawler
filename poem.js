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
            if(!window){
                console.log('windown error ',pageInfo.url);
                return cbPage();
            }
            var $ = window.$;
            var data = [];
            $('.elle-category-list li').each(function(index,li){
                var a = $(li).find('a').eq(0);
                var name = $(a).attr('title');
                var link = $(a).attr('href');
                data.push({
                    'slug': slug(name),
                    'name'    : name.replace(/\elle/gi, 'Bí quyết sống'),
                    'link':link,
                });
            });
            //console.log(trData);
            if(connection==null){
                connection = mysql.createConnection(configuration.MYSQL_CONFIG);
            }
            async.each(data, function(chapterInfo,cbPage){
                return insert(chapterInfo,cbPage);

            }, function(err){
                //console.log("");
                cbPage();
            });
        }
    });
}

function insert(data,cb){
    jsdom.env({
        url: data.link,
        src: [jquery],
        done: function (err, window) {
            //console.log("there have been", window.$("a").length - 4, "io.js releases!");
            if(!window){
                console.log('windown error ',data.link);
                return cb();
            }
            var $ = window.$;
            var body = $('.article-details-main-content').eq(0);
            var another =  $(body).find('.another-post');
            if(another){
                for(var i = 0; i<another.length; i++){
                    $(another[i]).html('');
                }
            }
            $(body).find('.article-details-writter').eq(0).html('');
            $(body).find('.page-editor').eq(0).html('');
            //console.log($(body).find('.article-details-writter').eq(0).html());
            var content = $(body).html();
            if(content) {
                content = content.replace(/\<a[^>]+\>/g, '<a href="javascript:void(0);">');
                content = content.replace(/\<img[^>]+\>/g, '<p></p>');
                content = content.replace(/\elle/gi, 'Bí quyết sống');
                data.content = content;
                var insertSQL = 'INSERT INTO life_style SET ? ';

                connection.query(insertSQL,data,function(err,resultInsert){
                    if(err){
                        console.log('Error insert chapter table', err);
                        //process.kill(1);
                        return cb();
                    }
                    console.log('Success insert chapter: ');
                    cb();

                });
            }else{
                cb();
            }

        }
    });
}



var chapters = [];
var i = 1;
function run() {
    chapters = [];
    console.log('RUNN '+i);
    var pageInfo = {
        'url': 'http://www.elle.vn/cong-dong/bi-quyet-song/page/' + i,
        'category_id': 1,
        'category_name': 'Thơ Tình'
    };
    chapters.push(pageInfo);
//}
    async.each(chapters, function (pageInfo, cb) {
        //console.log(pageInfo);
        crawlerPage(pageInfo, cb);
    }, function (error) {
        console.log('done nhe');
        i++;
        run();
    });
}

run();