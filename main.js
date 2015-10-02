/**
 * Created by tiennt on 02/10/2015.
 */
var mp3 = require('./mp3');
var songObj = {
    fileName: 'lyrics/vo-nguoi-ta.lrc',
    link:'http://mp3.zing.vn/bai-hat/V-Ng-i-Ta-Phan-M-nh-Qu-nh/ZW7WBZBI.html',
    xmlLink:'',
    lyricLink:''
}

mp3.getXmlUrl(songObj);