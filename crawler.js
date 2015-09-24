/**
 * Created by tienn2t on 3/31/15.
 */
var Crawler = require('crawler');
var mysql   = require('mysql');
var slug    = require('slug');

var c = new Crawler({
    'maxConnections':10,
    'forceUTF8': true,
    'callback':function(error,result,$){}
});

var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'root',
    database : 'story',
    'charset': 'utf8_general_ci'
});


connection.connect(function(error){
    if(error){
        console.log('error connecting: ',error.stack);
        return;
    }
    console.log('Connected mysql db');
});


//get status pending to crawler
connection.query('SELECT * from story WHERE category_slug !="truyen-ngan" AND status="pending" LIMIT 2', function(err, rows) {
    // connected! (unless `err` is set)
    if(err){
        console.error("Get data error: ", err.stack);
        return;
    }


    rows.forEach(function(row){
        console.log(row.link);
        page = row.page;
        title = row.story_slug;
        table = title.trim().charAt(0).toUpperCase()+'_story';

        console.log(table);

        connection.query('SELECT COUNT(*) AS is_table FROM information_schema.tables WHERE table_name ="'+table+'"', function(err,results){
            //tao table neu chua ton tai
            if(results[0].is_table==0){
                createTable = "CREATE TABLE IF NOT EXISTS "+table+" (id int(11) NOT NULL AUTO_INCREMENT,story_slug TEXT NOT NULL," +
                    "story_id int(11) NOT NULL,chapter_name text NOT NULL,chapter text NOT NULL, " +
                    "update_time varchar(30) NOT NULL, story_name text NOT NULL,chapter_number int(11), link text NOT NULL, " +
                    "content text NOT NULL, chapter_slug text NOT NULL, PRIMARY KEY (id)) ENGINE=InnoDB  DEFAULT CHARSET=utf8";

                connection.query(createTable,function(err,results){
                    if(err){
                        console.log('Create table ',table, 'failed!');
                        return;
                    }
                    //get data
                    console.log('Create table ',table, 'successful');
                    getData(row, page, table);
                });

            }else{
                getData(row, page, table);
            }
        });
    });
});

function getData(row, page, table, totalPage){
    //console.log(row);
    if(totalPage==='undefined'){
        totalPage = 0;
    }
    if(page==1){
        uri = row.link;
    }else{
        uri = row.link+'2/'
    }

    console.log(uri);
    c.queue([{
        'uri':uri,
        'callback':function(error,result,$){
            if(page==1){
                //lay ra tong so trang
                reg = /[\d]+$/;
                totalPage = parseInt($('.numbpage').text().match(reg)[0]);

                //cap nhat truyen
                author = $('div.contdetail span.author').text();
                source = $('div.contdetail span.type').text();
                status = $('div.contdetail span.status').text();
                short_description = $('.mota').html();
                total_view = parseInt($('div.contdetail span.view').text().match(reg)[0]);

                console.log(total_view);

                updateSql = 'UPDATE story SET ? WHERE ?';

                connection.query(
                    updateSql,
                    [
                        {
                            author:author,
                            source:source,
                            status:status,
                            page:page,
                            short_description:short_description,
                            total_view:short_description
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
                        console.log('Update ok');
                    }
                );

            }else{
                console.log('hehe')
            }

            //content = $('div#detailcontent').html();

            update_unixtime = parseInt(new Date().getTime()/1000);

            $('div.gridlistchapter tr').each(function(index,tr){
                //call chapter
                $(tr).attr('for',page);
                
                c.queue([{
                    "uri":$(tr).find('td a').attr('href'),
                    "callback":function(error,result_chapter, $) {
                        numberPage = $(tr).attr('for');
                        td = $(tr).find('td');
                        //console.log('--',$(td).eq(0).text(),'---',$(td).eq(2).text(), '++',$t('.detailchapter').text());
                        chapter = $(td).eq(2).text();
                        chapter_link = $(td).find('a').attr('href');
                        chapter_name = $(td).eq(3).text();
                        chapter_number = (numberPage-1)*50+parseInt($(td).eq(0).text());
                        //console.log('No:'+$(td).eq(0).text()+' - page:',numberPage);
                        insertData = {
                            'story_id'      : row.id,
                            'story_name'    : row.title,
                            'chapter'       : $(td).eq(2).text(),
                            'chapter_name'  : chapter_name,
                            'chapter_number': chapter_number,
                            'link'       : $(td).find('a').attr('href'),
                            'update_time': $(td).eq(4).text(),
                            'content'    : $('div#detailcontent').html(),
                            'story_slug'    : row.story_slug,
                            'chapter_slug'  : slug(chapter_name)
                        };

                        insertSQL = 'INSERT INTO '+table+' SET ?';

                        connection.query(insertSQL,insertData,function(err,resultInsert){
                            if(err){
                                console.log('Error insert chapter table');
                                return;
                            }
                            console.log('Success insert chapter: ',chapter,' - ',chapter_name);
                        });
                    }
                }]);
                //console.log(data);
            });

            console.log(page,' - ',totalPage);

            if(page!=totalPage){
                page++;
                getData(row,page, table, totalPage);
            }else{
                return;
            }
        }
    }]);
}
