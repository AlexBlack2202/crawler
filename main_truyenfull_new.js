/**
 * Created by tienn2t on 3/31/15.
 */
var Crawler         = require('crawler');
var mysql           = require('mysql');
var slug            = require('slug');
var async           = require('async');
var truyenfull       = require('./truyenfull_new');
var configuration   = require('./configuration');
var http    = require('http');
var fs      = require('fs');
var sys = require('sys')
var exec = require('child_process').exec;
var child;


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
    var query = 'SELECT * from story WHERE is_crawler=0 AND category_id=30 order by id DESC LIMIT 1';
    connection.query(query, function(err, rows) {
        // connected! (unless `err` is set)
        if(err){
            console.error("Get data error: ", err.stack);
            return;
        }
        //console.log(rows);
        if(rows.length==0){
            console.log('Khong co du lieu nao!');
            //xoa toan bo image trong thu muc truyen-moi
            var command = "rm -rf truyen-moi/*";
            child = exec(command, function (error, stdout, stderr) {
                sys.print('stdout: ' + stdout);
                sys.print('stderr: ' + stderr);
                if (error !== null) {
                    console.log('exec error: ' + error);
                }
            });
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
                console.log('tim ',results);
                getStoryInfo(row);
                if(results[0].is_table==0){
                    createTable = "CREATE TABLE IF NOT EXISTS "+'chapter_'+row.story_slug.substr(0,2)+" (id int(11) NOT NULL AUTO_INCREMENT,story_slug TEXT NOT NULL," +
                        "story_id int(11) NOT NULL,chapter_name text NOT NULL, " +
                        "`time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, story_name text NOT NULL,chapter_number int(11) NOT NULL, link text NOT NULL, " +
                        "content longtext NOT NULL, chapter_slug text NOT NULL, PRIMARY KEY (id),UNIQUE KEY `id_box_elements` (`story_id`,`chapter_number`)) ENGINE=InnoDB  DEFAULT CHARSET=utf8";
console.log(createTable);
                    connection.query(createTable,function(err,results){
                        if(err){
                            console.log('Create table ',table, 'failed!');
                        }
                        //get data
                        console.log('Create table ',table, 'successful');
                        getData(row, page, 'chapter_'+row.story_slug.substr(0,2));

                        //dong connection khi ca den phan tu cuoi cung
                        //if(rows.indexOf(row) == (rows.length-1)){
                            connection.end();
                        //}

                    });

                }else{
                    getData(row, page,'chapter_'+row.story_slug.substr(0,2));
                    //if(rows.indexOf(row) == (rows.length-1)){
                        connection.end();
                    //}
                }




            });
            return cb(null);
        }, function(error){
            console.log('FINISHED!!',error);//dong ket noi
        });

    });
}

function getStoryInfo(obj){
    console.log('OBJ:',obj);
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

                var total_page = parseInt($('#total-page').attr('value'));
                var src = infoHolder.find('.info .source').text();
                var cate = infoHolder.find('.info a[itemprop=genre]').eq(0).text();
                cateInfo = getCate(cate);

                if(cateInfo == false){

                    //bo qua neu khong tim thay thong tin
                    return true;
                }

                //copy image to new cate folder
                var command = "mv truyen-moi/"+obj.story_slug+"* "+cateInfo[2];
                child = exec(command, function (error, stdout, stderr) {
                    sys.print('stdout: ' + stdout);
                    sys.print('stderr: ' + stderr);
                    if (error !== null) {
                        console.log('exec error: ' + error);
                    }
                });
                obj.category_slug = cateInfo[2];
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

                var lastestChapter = $(div).find('.l-chapter .l-chapters li').eq(0).text();
                var status = '';
                infoHolder.find('.info div span').each(function(i,span){
                    status = $(span).text();
                });

                var description = $(div).find('.desc-text').html();


                trData = {
                    'source'       : src,
                    'status'       : status,
                    'description'       : description,
                    'category_id':cateInfo[0],
                    'category_slug':cateInfo[2],
                    'category_name':cateInfo[1],
                    'page':total_page,
                    'lastest_chapter':lastestChapter,
                    'is_crawler':1
                };
                //console.log('trData: ',trData);
                updateSQL = 'UPDATE story SET ? WHERE ?';
                connection.query(updateSQL, [trData,{id:obj.id}], function (err, resultInsert) {
                    if (err) {
                        console.log('Update lan 1 ERROR', err);
			trData = {
		            'is_crawler':1
		        };
			connection.query(updateSQL, [trData,{id:obj.id}], function (err, resultInsert) {
		            if (err) {
		                console.log('Update lan 2 table ERROR', err);
				trData = {
				    'is_crawler':1
				};

		            }else{
		                console.log('Update lan 2  success');
				run();
		            }
		        });

                    }else{
                        console.log('Update success insert table');
                    }
                });
            });

        }
    }]);
}

function getCate(cateStr){
    var cate = cateStr.trim().split(',');
    var listCate = ['',
        'Tiên Hiệp','Kiếm Hiệp','Ngôn Tình','Đô Thị','Võng Du','Quan Trường','Khoa Huyễn','Huyền Huyễn','Dị Giới','Dị Năng',
        'Quân Sự','Lịch Sử','Xuyên Không','Trọng Sinh','Trinh Thám','Thám Hiểm','Linh Dị','Sắc','Cung Đấu','Nữ Cường','Gia Đấu',
        'Đông Phương','Đam Mỹ','Bách Hợp','Hài Hước','Điền Văn','Cổ Đại','Mạt Thế','Truyện Teen'
    ];
    var listSlug = ['',
        'tien-hiep','kiem-hiep','ngon-tinh','do-thi','vong-du','quan-truong','khoa-huyen','huyen-huyen','di-gioi','di-nang',
        'quan-su','lich-su','xuyen-khong','trong-sinh','trinh-tham','tham-hiem','linh-di','sac','cung-dau','nu-cuong','gia-dau',
        'dong-phuong','dam-my','bach-hop','hai-huoc','dien-van','co-dai','mat-the','truyen-teen'
    ];

    var key = listCate.indexOf(cate[0]);
    if(key===-1){
        return false;
    }else{
        return [key,listCate[key],listSlug[key]];
    }
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

            //thong tin tung trang
            pageList = [];

            for(var i=1;i<=totalPage;i++){
                var pageInfo  = {
                    'url': row.link+'trang-'+i+'/#list-chapter',
                    'story_id': row.id,
                    'story_name':row.story_name,
                    'story_slug': row.story_slug,
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
