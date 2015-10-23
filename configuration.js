/**
 * Created by tienn2t on 4/2/15.
 */

var MYSQL_CONFIG = {
    host     : 'localhost',
    user     : 'root',
    password : 'root',
    database : 'nhenhang',
    'charset': 'utf8_general_ci'
};
/*var MYSQL_HOST_CONFIG = {
    host     : '192.254.186.185',
    user     : 'tienn2t_story',
    password : 'Tienn2t',
    database : 'tienn2t_story',
    'charset': 'utf8_general_ci'
};*/

var NUMBER_OF_PAGE = 10;

exports.MYSQL_CONFIG = MYSQL_CONFIG;
//exports.MYSQL_CONFIG = MYSQL_HOST_CONFIG;
exports.NUMBER_OF_STORY = NUMBER_OF_PAGE;