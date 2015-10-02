/**
 * Created by tiennt on 02/10/2015.
 */
/**
 * Created by tienn2t on 4/2/15.
 */
var Crawler = require('crawler');
var mysql   = require('mysql');
var slug    = require('slug');
var fs      = require('fs');
var async   = require('async');
var http    = require('http');
var fs      = require('fs');
var configuration   = require('./configuration');

function getXmlUrl(songObj) {
    var c = new Crawler({
        'maxConnections': 10,
        'forceUTF8': true,
        'callback': function (error, result, $) {
        }
    });

    c.queue([{
        'uri': songObj.link,
        'callback': function (error, result, $) {
            $('script').each(function (index, item) {
                //console.log($(item).text());
                var content = $(item).html();
                //var reg = /xmlU/;
                var matches = content.match(/xmlURL=http:[\w\d\.\-_\/]*/g);
                if (matches != null) {
                    songObj.xmlLink = matches[0].substr(7);
                    getLyricLink(songObj);
                    return;
                }
            });
        }
    }]);
}

function getLyricLink(songObj){
    console.log('link:',songObj.xmlLink);
    var c = new Crawler({
        'maxConnections':10,
        'forceUTF8': true,
        'callback':function(error,result,$){}
    });

    c.queue([{
        'uri':songObj.xmlLink,
        'callback':function(error,result,$){
            //console.log($.xml());
            var content = $.xml();
            var matches = content.match(/http:\/\/static\.mp3\.zdn\.vn[\w\d\.\-_\/]*/g);
            if(matches!=null) {
                songObj.lyricLink = matches[0];
                crawlerLyric(songObj);
            }
        }
    }]);
}


function crawlerLyric(songObj){
    var file = fs.createWriteStream(songObj.fileName);
    var request = http.get(songObj.lyricLink, function(response) {
        response.pipe(file);
        console.log('DONE');
    });
}



exports.getXmlUrl = getXmlUrl;