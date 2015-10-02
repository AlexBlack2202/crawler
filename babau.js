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

function crawlerPage(info,link, done){
    console.log(link);
    var c = new Crawler({
        'maxConnections':10,
        'forceUTF8': true,
        'callback':function(error,result,$){}
    });

    c.queue([{
        'uri':link,
        'callback':function(error,result,$){

            //lay ra tong so trang
            reg = /[\d]+$/;

            $('div.sktd-item').each(function(index,tr){

                //call chapter
                span = $(tr).find('span');

                trData[index] = {
                    'title'       : $(span).eq(1).text().trim(),
                    'short'  : $(tr).find('.news-sapo').eq(0).text().trim(),
                    'link': 'http://eva.vn'+$(span).find('a').eq(0).attr('href'),
                    'cate_id':info.cate_id,
                    'cate_name':info.cate_name
                };

            });
            /*fs.writeFile('logs/page_'+pageInfo.page,JSON.stringify(trData),function(err){
                if(err){
                    console.log('GHI FILE LOI');
                }else{
                    console.log('GHI FILE THANH CONG: '+pageInfo.page);
                }
            });*/
	    //console.log(trData);

            async.each(trData, function(chapterInfo,cbChapter){
                return crawlerChapter(chapterInfo,cbChapter);

            }, function(err){
                console.log('ER:',err);
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
    console.log(chapterInfo);


    c.queue([{
        "uri":chapterInfo.link,
        "callback":function(error,result_chapter, $) {
            var content = $('div#baiviet-container').html();
            insertData = null;
            if(content!=null) {
                insertData = {
                    'title': chapterInfo.title,
                    'short': chapterInfo.short,
                    'content': content.trim(),
                    'cate_id': chapterInfo.cate_id,
                    'cate_name': chapterInfo.cate_name
                };
            }


            insertSQL = 'INSERT INTO babau SET ?';
            if(insertData!=null) {
                connection.query(insertSQL, insertData, function (err, resultInsert) {
                    if (err) {
                        console.log('Error insert chapter table', err);
                        //process.kill(1);
                        //return;
                    }

                });
            }
        }
    }]);
    cb(null);
}

//crawlerPage('http://eva.vn/meo-hay-khi-mang-thai-c85e1127.html',null);
//crawlerPage('http://eva.vn/ajax/box_bai_viet_trang_su_kien/index/85/1127/Array/1/12/0?page=2',null);
var a = [
    {
        'link':'http://eva.vn/ajax/box_bai_viet_trang_su_kien/index/85/1127/Array/1/12/0?page=',
        'page':6,
        'cate_name':'Mẹo hay khi mang thai',
        'cate_id':1
    },
    {
        'link':'http://eva.vn/ajax/box_bai_viet_trang_su_kien/index/66/368/Array/1/12/0?page=',
        'page':15,
        'cate_name':'Bà bầu cần biết',
        'cate_id':3
    },
    {
        'link':'http://eva.vn/ajax/box_bai_viet_trang_su_kien/index/85/935/Array/1/12/0?page=',
        'page':15,
        'cate_name':'Chuẩn bị mang thai',
        'cate_id':9
    },
    {
        'link':'http://eva.vn/ajax/box_bai_viet_trang_su_kien/index/85/1344/Array/1/12/0?page=',
        'page':18,
        'cate_name':'Sự phát triển thai nhi',
        'cate_id':8
    },
    {
        'link':'http://eva.vn/ajax/box_bai_viet_trang_su_kien/index/66/377/Array/1/12/0?page=',
        'page':15,
        'cate_name':'Dinh dưỡng cho bà bầu',
        'cate_id':4
    },
    {
        'link':'http://eva.vn/ajax/box_bai_viet_trang_su_kien/index/85/1458/Array/1/12/0?page=',
        'page':15,
        'cate_name':'Dấu hiệu có thai',
        'cate_id':2
    },
    {
        'link':'http://eva.vn/ajax/box_bai_viet_trang_su_kien/index/85/1165/Array/1/12/0?page=',
        'page':15,
        'cate_name':'Sau sinh',
        'cate_id':10
    },
    {
        'link':'http://eva.vn/ajax/box_bai_viet_trang_su_kien/index/85/927/Array/1/12/0?page=',
        'page':15,
        'cate_name':'Bà bầu tập thể dục',
        'cate_id':11
    },
    {
        'link':'http://eva.vn/ajax/box_bai_viet_trang_su_kien/index/85/1537/Array/1/12/0?page=',
        'page':15,
        'cate_name':'Giảm cân sau sinh',
        'cate_id':5
    },
    {
        'link':'http://eva.vn/ajax/box_bai_viet_trang_su_kien/index/85/1710/Array/1/12/0?page=',
        'page':15,
        'cate_name':'Bí quyết làm đẹp sau sinh',
        'cate_id':7
    },
    {
        'link':'http://eva.vn/ajax/box_bai_viet_trang_su_kien/index/85/1663/Array/1/12/0?page=',
        'page':15,
        'cate_name':'Bà bầu làm đẹp',
        'cate_id':12
    },
    {
        'link':'http://eva.vn/ajax/box_bai_viet_trang_su_kien/index/85/1127/Array/1/12/0?page=',
        'page':15,
        'cate_name':'Bà bầu làm đẹp',
        'cate_id':12
    }
];
//for(var k=0;k< a.length;k++) {
    var k = 4;
    for (var i = 1; i <= a[k].page; i++) {
        crawlerPage(a[k],a[k].link + i, null);
    }
//}

exports.crawlerPage = crawlerPage;
exports.crawlerChapter = crawlerChapter;
