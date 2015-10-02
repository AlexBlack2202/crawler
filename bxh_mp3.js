/**
 * Created by tiennt on 02/10/2015.
 */
var Crawler = require('crawler');
var mysql   = require('mysql');
var slug    = require('slug');
var fs      = require('fs');
var async   = require('async');
var http    = require('http');
var mp3     = require('./mp3');
var fs      = require('fs');
var configuration   = require('./configuration');

function getMp3Link(link) {
    var c = new Crawler({
        'maxConnections': 10,
        'forceUTF8': true,
        'callback': function (error, result, $) {
        }
    });

    c.queue([{
        'uri': link,
        'callback': function (error, result, $) {
            var data = [];
            $('.table-body ul li .e-item').each(function (index, item) {
                //console.log($(item).text());
                var a = $(item).find('a').eq(0);
                //console.log(a.attr('href')+'--'+ a.attr('title'));
                data.push({
                    fileName: 'lyrics/'+slug(a.attr('title')),
                    link:a.attr('href'),
                    xmlLink:'',
                    lyricLink:''
                })
            });
            console.log(data);
            if(data.length>0){
                async.each(data, function(songObj, cbPage){
                    mp3.getXmlUrl(songObj);

                }, function(errPage){
                    console.log('Finished page');
                });
            }
        }
    }]);
}

exports.getMp3Link = getMp3Link;