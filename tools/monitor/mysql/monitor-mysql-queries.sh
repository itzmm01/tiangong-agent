#!/bin/bash
################################################################
# Copyright (C) 1998-2019 Tencent Inc. All Rights Reserved
# Name: monitor-mysql-queries.sh
# Description: a script to monitor mysql queries. 
################################################################
# name of script
baseName=$(basename $0)
#desc: print log
function print_log()
{
    log_level=$1
    log_msg=$2
    currentTime=`echo $(date +%F%n%T)`
    echo "$currentTime    [$log_level]    $log_msg"
}
#desc；print how to use
print_usage() 
{
    print_log "INFO" "Usage: $baseName <model>"
    print_log "INFO" "Example:"
    print_log "INFO" "    $baseName 192.168.1.2 3306 root root123"
}
#dsec: check input
function check_input()
{
    if [ $# -ne 4 ]; then
        print_log "ERROR" "Exactly four argument is required."
        print_usage
        exit 1
    fi
}
#desc:check command exist
function check_command()
{
    if ! [ -x "$(command -v $1)" ]; then
       print_log "ERROR" "$1 could not be found."
       exit 1
    fi
}
#desc: get mysql queries
mysql_queries()
{
    check_command mysql
    check_input "$@"
    queries=$(mysql -h $1 -P $2 -u$3 -p$4 -e "show global status like 'Queries';"|grep "Queries"|awk '{print $2}')
    if [ ! -n  "$queries" ];then
        print_log "ERROR" "could not connect to mysql."
        exit 1
    else 
        echo "$queries"
    fi
}

mysql_queries "$@"

