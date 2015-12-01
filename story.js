var Crawler         = require('crawler');
var mysql           = require('mysql');
var slug            = require('slug');
var async           = require('async');
var configuration   = require('./configuration');

function listStory(link){
    var c = new Crawler({
        'maxConnections':10,
        'forceUTF8': true,
        'userAgent': 'Mozilla/5.0 (X11; Linux i686 (x86_64)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36',
        'callback':function(error,result,$){}
    });

    console.log(link);

    c.queue([{
        'uri': link,
        'callback': function (error, result, $) {
            $('#all_sections .story').each(function(i,div){
                console.log($(div).find('h2 a').text());
                getDetail($(div).find('h2 a').attr('href'));
            })
        }
    }]);
}

function getDetail(link){
    var c = new Crawler({
        'maxConnections':10,
        'forceUTF8': true,
        'userAgent': 'Mozilla/5.0 (X11; Linux i686 (x86_64)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36',
        'callback':function(error,result,$){}
    });

    console.log(link);

    c.queue([{
        'uri': link,
        'callback': function (error, result, $) {
            var story = {};

            var content = $('#story .content');
            story.chapter_name = $(content).find('h1').text();
            story.chapter = $(content).find('h2 a').text();
            story.content = $(content).find('p').html();

            console.log(story);
        }
    }]);
}

listStory('http://www.loverofdarkness.net/stories/sort/rated');