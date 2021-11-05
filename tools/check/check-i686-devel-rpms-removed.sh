#!/bin/bash
################################################################
# Copyright (C) 1998-2019 Tencent Inc. All Rights Reserved
################################################################

#----------------------------------------------------------
# desc: print log
# parameters: log_level, log_msg
# return: workDir
#----------------------------------------------------------
function print_log()
{
    log_level=$1
    log_msg=$2
    currentTime=`echo $(date +%F%n%T)`
    echo "$currentTime    [$log_level]    $log_msg"
}


main() {
    os_version=`grep '^NAME' /etc/os-release |awk -F '=' '{print $NF}'|sed 's/"//g'`
    if [ "$os_version" == "uos" ] ;then
        dpkg -l |awk '{ print $2}'|grep 'i686\|-dev'
        if [ $? -eq 0 ]; then
            print_log "ERROR" "i686/devel rpms not removed"
            return 1
        fi
    else
        if rpm -qa | grep -E 'i686|-devel'; then
            print_log "ERROR" "i686/devel rpms not removed"
            return 1
        fi
    fi
    print_log "INFO" "i686/devel rpms removed"
    return 0
}


########################
#     main program     #
########################
main
