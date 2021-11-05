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


# name of script
baseName=$(basename $0)

disable_virbr0() {
    if ! ip a | grep -wq virbr0; then
        print_log "INFO" "virbr0 disabled"
        return 0
    fi
    os_version=`grep '^NAME' /etc/os-release |awk -F '=' '{print $NF}'|sed 's/"//g'`
    if [ "$os_version" == "uos" ]; then 
        print_log "OK" "no support UOS"
        exit 0
    fi
    systemctl start libvirtd
    virsh net-destroy default
    virsh net-undefine default
    systemctl stop libvirtd
    systemctl disable libvirtd
    ifconfig virbr0 down
    ip l del virbr0
    if ! ip a | grep -wq virbr0; then
        print_log "INFO" "virbr0 disabled"
        return 0
    fi
    print_log "ERROR" "failed disable virbr0"
    return 1
}
########################
#     main program     #
########################
disable_virbr0
