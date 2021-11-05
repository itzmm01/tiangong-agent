#!/bin/bash

###########################################################
# Copyright (C) 1998-2019 Tencent Inc. All Rights Reserved
# Name: functions.sh
# Description: All common functions are defined here
###########################################################


###########################################################
#                          Log                            #
###########################################################

#----------------------------------------------------------
# desc: print log
# parameters: log_level, log_msg
# return: workDir
#----------------------------------------------------------
export PATH=/usr/local/bin:/usr/bin:/usr/local/sbin:/usr/sbin:$PATH
export LANG=en_US.utf8

function print_log()
{
    log_level=$1
    log_msg=$2
    currentTime=`echo $(date +%F%n%T)`
    echo "$currentTime    [$log_level]    $log_msg"
}



###########################################################
#                       Filesystem                        #
###########################################################

#----------------------------------------------------------
# desc: get script's parent path
# parameters: any
# return: workDir
#----------------------------------------------------------
function get_workdir()
{
    workDir=$(cd $(dirname $0); pwd)
    echo "$workDir"
}


#----------------------------------------------------------
# desc: convert a file to unix format
# parameters: filename
# return: 0 or 1
#----------------------------------------------------------
function dos_to_unix()
{
    filename=$1
    print_log "INFO" "Convert file to unix format: dos2unix $filename"
    dos2unix $filename
    if [ $? -ne 0 ]; then
        print_log "ERROR" "Failed to convert file $filename to unix format."
        return 1
    else
        print_log "INFO" "Ok."
        return 0
    fi
}


#----------------------------------------------------------
# desc: create a soft link file
# parameters: src, tgc
# return: 0 or 1
#----------------------------------------------------------
function create_link()
{
    src=$1
    tgt=$2
    print_log "INFO" "Create soft link file: ln -sf $src $tgt"
    sudo ln -sf $src $tgt
    if [ $? -ne 0 ]; then
        print_log "ERROR" "Failed."
        return 1
    else
        print_log "INFO" "Ok."
        return 0
    fi
}

#----------------------------------------------------------
# desc: check if a given file exist or not
# parameters: $file
# exit: 1/0
#----------------------------------------------------------
function check_file()
{
    file="$1"
    print_log "INFO" "Check if file $file exist."

    if [ ! -f "$file" ]; then
        print_log "WARNING" "File $file does not exist."
        return 1
    else
        print_log "INFO" "Ok."
        return 0
    fi
}

#----------------------------------------------------------
# desc: copy conf file
# parameters: $src, $tgt
# return: 1/0
#----------------------------------------------------------
function copy_file()
{
    src=$1
    tgt=$2
    print_log "INFO" "Copy file: \cp $src $tgt"
    \cp $src $tgt
    if [ $? -ne 0 ]; then
        print_log "ERROR" "Failed to copy file $src to $tgt."
        return 1
    else
        print_log "INFO" "Ok."
        return 0
    fi
}

#----------------------------------------------------------
# desc: check if a given directory exist or not
# parameters: $dir
# exit: 1/0
#----------------------------------------------------------
function check_dir()
{
    dir="$1"
    print_log "INFO" "Check if directory $dir exist."

    if [ ! -d "$dir" ]; then
        print_log "WARNING" "Directory $dir does not exist."
        return 1
    else
        print_log "INFO" "Ok."
        return 0
    fi
}

###########################################################
#                         String                          #
###########################################################

#----------------------------------------------------------
# desc: transform a given string to its lower case
# parameters: string
# return: string_in_lower_case
#----------------------------------------------------------
function to_lower()
{
    str=`echo "$1" | tr '[A-Z]' '[a-z]'`
    echo $str
}

#----------------------------------------------------------
# desc: transform a given string to its upper case
# parameters: string
# return: string_in_upper_case
#----------------------------------------------------------
function to_upper()
{
    str=`echo $1 | tr '[a-z]' '[A-Z]'`

}

###########################################################
#                   validation check                      #
###########################################################

#----------------------------------------------------------
# desc: check if a given string is valid positive integer
# parameters: string
# return: 1/0
#----------------------------------------------------------
function is_int()
{
    str=$1

    if [ "$str" == "" ]; then
        print_log "ERROR" "Input is empty."
        return 1
    fi

    print_log "INFO" "Check if $str is a valid positive integer."
    if [[ $str =~ ^[+-]?[0-9]+$  ]]; then
        print_log "INFO" "Ok."
        return 0
    else
        print_log "ERROR" "Nok."
        return 1
    fi
}


# desc: check if a given string is valid ipv4 address
# parameters: string
# return: 1/0
is_ipv4() {
    local ip=$1
    local stat=1
    if [[ $ip =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
        OIFS=$IFS
        IFS='.'
        ip=($ip)
        IFS=$OIFS
        [[ ${ip[0]} -le 255 && ${ip[1]} -le 255 \
            && ${ip[2]} -le 255 && ${ip[3]} -le 255 ]]
        stat=$?
    fi
    return $stat
}

#----------------------------------------------------------
# desc: check if a given string is valid decimal number
# parameters: string
# return: 1/0
function is_decimal()
{
    str=$1

    if [ "$str" == "" ]; then
        print_log "ERROR" "Input is empty."
        return 1
    fi

    print_log "INFO" "Check if $str is a valid decimal number."

    if [[ $str =~ ^[+-]?[0-9]+\.?[0-9]*$ ]]; then
        print_log "INFO" "Ok."
        return 0
    else
        print_log "ERROR" "Nok."
        return 1
    fi
}

#----------------------------------------------------------
# desc: replace content in file $tgt line by line, with
# content in file $src. Seperator is required, i.e. if
# provided, line in $src will be seperated into a key
# example:
#   content in /tmp/a.txt
#     key2=123
#     key3=456
#   content in /tmp/b.txt
#     key1=abc
#     key2=def
#     key3=ghi
#     key4=jkl
# use: replace_file_content("/tmp/a.txt", "/tmp/b.txt", "="),
# then after replacing, the content in tgt will be like:
#    content in /tmp/b.txt
#     key1=abc
#     key2=123
#     key3=456
#     key4=jkl
# parameters: $src, $tgt, $seperator
#
# return: 1/0
function replace_file_content()
{
    if [ $# -ne 3 ]; then
        print_log "ERROR" "Usage: replace_file_content $src_file $tgt_file $seperator"
    fi

    src=$1
    tgt=$2
    seperator=$3

    check_file $1
    if [ $? -ne 0 ];then
        return 1
    fi

    check_file $2
    if [ $? -ne 0 ];then
        return 1
    fi

    print_log "INFO" "Replace file content: source: $src, target: $tgt, seperator: $seperator"


    while read line
    do
        echo $line
        key=$(echo $line | awk -F":" {'print $1'})
        sed -i "s/^$key.*/$line/g" "$tgt"
        if [ $? -ne 0 ]; then
            print_log "ERROR" "Failed at replacing $key with content $line."
            print_log "ERROR" "Replace file content: failed"
            return 1
        fi
    done < "$src"

    print_log "INFO" "Replace file content: ok"
}
