#!/bin/sh
SERVICE="node main_truyenfull_update_jsdom.js"
SCRIPT=`readlink -f $0`
SCRIPTPATH=`dirname $SCRIPT`

count=`ps axu | grep "$SERVICE" | grep -v "grep" |wc -l`
if [ $count -ge 3  ] ; then
	echo "Service is running"
	exit 1
fi
/usr/bin/node /home/waka/common/node/push_notification/notification.js
#nodejs /var/www/waka/common/node/push_notification/notification.js