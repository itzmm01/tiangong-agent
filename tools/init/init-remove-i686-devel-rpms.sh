#!/bin/bash
################################################################
# Copyright (C) 1998-2021 Tencent Inc. All Rights Reserved
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
    currentTime=$(date '+%F %T')
    echo "$currentTime    [$log_level]    $log_msg"
}


# desc: disable firewalld
# input: none
# output: none
main() {
    os_version=`grep '^NAME' /etc/os-release |awk -F '=' '{print $NF}'|sed 's/"//g'`
    if [ "$os_version" == "uos" ]; then
        print_log "INFO" "remove i686 and devel rpms success."
        return 0
    fi
    if yum -y remove '*i686' '*-devel'; then
        print_log "INFO" "remove i686 and devel rpms success."
        return 0
    fi
    print_log "ERROR" "remove i686 and devel rpms failed."
    return 1
}


########################
#     main program     #
########################
main
