var Crawler         = require('crawler');
var mysql           = require('mysql');
var slug            = require('slug');
var async           = require('async');
var configuration   = require('./configuration');

function listStory(link){
    var connection = mysql.createConnection(configuration.MYSQL_CONFIG);
    var c = new Crawler({
        'maxConnections':10,
        'forceUTF8': true,
        'userAgent': 'Mozilla/5.0 (X11; Linux i686 (x86_64)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36',
        'callback':function(error,result,$){}
    });

    console.log(link);
    var lists = [];
    c.queue([{
        'uri': link,
        'callback': function (error, result, $) {
            $('.innerquiz').each(function(i,div){
                //getDetail($(div).find('h2 a').attr('href'));
                story = {
                    'story_name':$(div).find('h1 a').text(),
                    'link':$(div).find('h1 a').attr('href'),
                    'description':$(div).find('div.descr').text()
                };
                insertSQL = 'INSERT INTO quotev_story SET ?';

                connection.query(insertSQL,story,function(err,resultInsert) {
                    if (err) {
                        console.log('Error insert chapter table', err);
                        //process.kill(1);
                        //return;
                    }
                });
            });
            /*console.log(lists);
            if(lists.length>0) {
                async.each(lists, function (info, cbPage) {
                    getDetail(info);
                }, function (errPage) {
                    console.log('Finished page');
                });
            }*/
        }
    }]);
}


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
    var query = 'SELECT id,story_name, link from quotev_story WHERE status=1 order by id desc LIMIT 1';
    connection.query(query, function(err, rows) {
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
            console.log(row);
            var c = new Crawler({
                'maxConnections':10,
                'forceUTF8': true,
                'userAgent': 'Mozilla/5.0 (X11; Linux i686 (x86_64)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36',
                'callback':function(error,result,$){}
            });

            c.queue([{
                'uri': row.link,
                'callback': function (error, result, $) {
                    var chapters = [];
                    $('#rselect div a').each(function(i,a){
                        var chapter = {
                            story_id:row.id,
                            story_name:row.story_name,
                            chapter_number: (i + 1),
                            chapter_name : $(a).text(),
                            chapter_link : $(a).attr('href'),
                        }
                        chapters.push(chapter);
                    });
                    console.log(chapters);
                }
            }]);

            return cb(null);
        }, function(error){
            console.log('FINISHED!!');//dong ket noi
        });

    });
}

function getDetail(info){
    var c = new Crawler({
        'maxConnections':10,
        'forceUTF8': true,
        'userAgent': 'Mozilla/5.0 (X11; Linux i686 (x86_64)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36',
        'callback':function(error,result,$){}
    });

    c.queue([{
        'uri': info.link,
        'callback': function (error, result, $) {
            var story = {};

            var content = $('#story .content');
            story.chapter_name = $(content).find('h1').text();
            story.chapter = $(content).find('h2 a').text();
            story.content = $(content).find('p').html();

            console.log(story);
            insertSQL = 'INSERT INTO chapter SET ?';

            connection.query(insertSQL,story,function(err,resultInsert) {
                if (err) {
                    console.log('Error insert chapter table', err);
                    //process.kill(1);
                    //return;
                }
            });
        }
    }]);
}
/**
 * lay ra danh sach truyen
 */
//listStory('http://www.quotev.com/stories/c/Romance?v=users&page=1');

/**
 * lay ra cac chuong cua truyen
 */
run();