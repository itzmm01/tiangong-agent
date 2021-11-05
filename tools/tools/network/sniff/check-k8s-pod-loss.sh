#!/bin/bash
################################################################
# Copyright (C) 1998-2019 Tencent Inc. All Rights Reserved
# Name: check-k8s-pod-loss.sh
# Description: a script to run sniff and analysis pcap
# exist in current k8s platform
################################################################

#----------------------------------------------------------
# desc: print log
# parameters: log_level, log_msg
# return: workDir
#----------------------------------------------------------
function print_log() {
  log_level=$1
  log_msg=$2
  currentTime=$(echo $(date +%F%n%T))
  echo "$currentTime    [$log_level]    $log_msg"
}

# name of script
baseName=$(basename "$0")

function get_options() {
  ARGUMENT_LIST=(
    "client-ns"
    "client-pod"
    "server-ns"
    "server-pod"
    "protocol"
    "port"
    "pkg-byte-len"
    "pkg-count"
    "mode"
)


# read arguments
opts=$(getopt \
    --longoptions "$(printf "%s:," "${ARGUMENT_LIST[@]}")" \
    --name "$(basename "$0")" \
    --options "" \
    -- "$@"
)

eval set --$opts

while [[ $# -gt 0 ]]; do
    case "$1" in
        --client-ns)
            client_ns=$2
            shift 2
            ;;
        --client-pod)
            client_pod=$2
            shift 2
            ;;
        --server-ns)
            server_ns=$2
            shift 2
            ;;
        --server-pod)
            server_pod=$2
            shift 2
            ;;
        --protocol)
            protocol=$2
            shift 2
            ;;
        --port)
            port=$2
            shift 2
            ;;
        --pkg-byte-len)
            pkg_byte_len=$(($2))
            shift 2
            ;;
        --pkg-count)
            pkg_count=$(($2))
            shift 2
            ;;
        --mode)
            mode=$2
            shift 2
            ;;
        *)
            break
            ;;
    esac
done

}

# desc: print how to use
print_usage() {
  print_log "INFO" "Desc: Run sniff in pod"
  print_log "INFO" "Usage: $baseName --client-ns <client_ns> --client-pod <client_pod> --server-ns <server_ns> --server-pod <server_pod> --port <port> --pkg-byte-len <pkg_byte_len> --pkg-count <pkg_count> --protocol <tcp or udp> --mode <node or pod>"
  print_log "INFO" "Example:"
  print_log "INFO" "  $baseName --client-ns default --client-pod wemeet-state-0 --server-ns default --server-pod wemeet-lapetus-0 --port 9098 --pkg-byte-len 1024 --pkg-count 5 --protocol ud --mode pod"
}

function check_input() {
  if [ $# -ne 18 ]; then
    print_log "ERROR" "Exactly nine arguments are required."
    print_usage
    exit 1
  fi
}

#desc:check command exist
function check_pod_command() {
  if ! kubectl exec -it "$1" -n "$2" -- which "$3" >/dev/null 2>&1; then
    print_log "ERROR" "command $3 could not be found in pod $1, namespace is $2."
    return 1
  fi
  return 0
}

function check_pod_exists() {
  if ! kubectl get pods -n "$2" | grep "Running" | grep -q "^$1[[:space:]]\+" >/dev/null 2>&1; then
    print_log "ERROR" "Cannot find pod $1 in namespace $2."
    exit 1
  fi
}

function check_ns_exists() {
  if ! kubectl get ns | grep -q "^$1[[:space:]]\+" >/dev/null 2>&1; then
    print_log "ERROR" "Cannot find namespace $1."
    exit 1
  fi
}

#desc:check command exist
function check_command() {
  if ! which "$1" >/dev/null 2>&1; then
    print_log "ERROR" "command $1 could not be found."
    exit 1
  fi
}

function start_sniff() {
  ns=$1
  pod=$2
  filter_port=$3
  tcpdump_path=$4
  pcap_out_file=$5
  protocol=$6
  /bin/rm -rf "$pcap_out_file"
  kubectl cp "$tcpdump_path" -n "$ns" "$pod":/tmp/
  if [[ ! $? ]]; then
    print_log "ERROR" "Copy $tcpdump_path to pod $pod in namespace $ns failed."
    return 1
  fi

  # run sniff process
  kubectl sniff "$pod" -n "$ns" -i any -f "$protocol && dst port $filter_port" -o "$pcap_out_file" >/dev/null 2>&1 &
  until [[ -f $pcap_out_file ]]; do
    print_log "INFO" "Waiting for sniff to start..."
    sleep 5
  done
  return 0
}

function analysis_cap_file() {
  server_pcap_out_file=$1
  client_pcap_out_file=$2
  filter_port=$3
  protocol=$4
  if [[ -f $server_pcap_out_file && -f $client_pcap_out_file ]]; then
    server_cap_info=$(tcpdump -tttt -r "$server_pcap_out_file")
    client_cap_info=$(tcpdump -tttt -r "$client_pcap_out_file")
    if [[ $protocol = udp ]]; then
      server_bad_length=$(echo "$server_cap_info" | grep "\.$filter_port: UDP, bad length" | awk '{print $(NF-2)}' | awk '{sum+=$1} END {print sum}')
      server_normal_length=$(echo "$server_cap_info" | grep "\.$filter_port: UDP, length" | awk '{print $NF}' | awk '{sum+=$1} END {print sum}')
      server_total_length=$((server_bad_length + server_normal_length))
      client_bad_length=$(echo "$client_cap_info" | grep "\.$filter_port: UDP, bad length" | awk '{print $(NF-2)}' | awk '{sum+=$1} END {print sum}')
      client_normal_length=$(echo "$client_cap_info" | grep "\.$filter_port: UDP, length" | awk '{print $NF}' | awk '{sum+=$1} END {print sum}')
      client_total_length=$((client_bad_length + client_normal_length))
    else
      server_total_length=$(echo "$server_cap_info" | grep "\.$filter_port:" | awk '{print $NF}' | awk '{sum+=$1} END {print sum}')
      client_total_length=$(echo "$client_cap_info" | grep "\.$filter_port:" | awk '{print $NF}' | awk '{sum+=$1} END {print sum}')
    fi

    /bin/rm -rf "$server_pcap_out_file"
    /bin/rm -rf "$client_pcap_out_file"

    if [[ $server_total_length -eq $client_total_length ]]; then
      print_log "INFO" "Analysis pcap file, sent $client_total_length, received $server_total_length. Ok"
      print_log "INFO" "Loss rate is 0%"
    else
      loss=$((client_total_length-server_total_length))
      print_log "ERROR" "Analysis pcap file, sent $client_total_length, received $server_total_length. Nok"
      loss_rate=$(awk 'BEGIN{printf "%.1f%%\n",('$loss'/'$client_total_length')*100}')
      print_log "ERROR" "Loss rate is $loss_rate"
      return 1
    fi
    return 0
  else
    print_log "ERROR" "Cannot found pcap file $server_pcap_out_file or $client_pcap_out_file."
    return 1
  fi
}

function get_data_length() {
  server_pcap_out_file=$1
  client_pcap_out_file=$2
  protocol=$3

  server_cap_info=$(tcpdump -tttt -r "$server_pcap_out_file")
  client_cap_info=$(tcpdump -tttt -r "$client_pcap_out_file")
  if [[ $protocol = udp ]]; then
    server_bad_length=$(echo "$server_cap_info" | grep "\.$filter_port: UDP, bad length" | awk '{print $(NF-2)}' | awk '{sum+=$1} END {print sum}')
    server_normal_length=$(echo "$server_cap_info" | grep "\.$filter_port: UDP, length" | awk '{print $NF}' | awk '{sum+=$1} END {print sum}')
    server_total_length=$((server_bad_length + server_normal_length))
    client_bad_length=$(echo "$client_cap_info" | grep "\.$filter_port: UDP, bad length" | awk '{print $(NF-2)}' | awk '{sum+=$1} END {print sum}')
    client_normal_length=$(echo "$client_cap_info" | grep "\.$filter_port: UDP, length" | awk '{print $NF}' | awk '{sum+=$1} END {print sum}')
    client_total_length=$((client_bad_length + client_normal_length))
  else
    server_normal_length=$(echo "$server_cap_info" | grep "\.$filter_port:" | awk '{print $NF}' | awk '{sum+=$1} END {print sum}')
    client_normal_length=$(echo "$client_cap_info" | grep "\.$filter_port:" | awk '{print $NF}' | awk '{sum+=$1} END {print sum}')
  fi
}


function run_sniff() {
  server_ns=$1
  server_pod=$2
  client_ns=$3
  client_pod=$4
  port=$5
  pkg_byte_len=$6
  pkg_count=$7
  protocol=$8
  # get ip of server pod
  pod_ip=$(kubectl get pods -n "$server_ns" -o wide | grep "^${server_pod}[[:space:]]\+" | awk '{print $6}')
  if [[ -z $pod_ip ]]; then
    print_log "ERROR" "Cannot find internal ip for pod ${server_pod}, namespace is $server_ns."
    return 1
  fi

  random_str=$(strings /dev/urandom | tr -dc A-Za-z0-9 | head -c20)
  # cap file for server pod
  pcap_out_file_server=ksniff-"$server_pod"-"$client_pod"-$random_str-server.cap
  # cap file for client pod
  pcap_out_file_client=ksniff-"$server_pod"-"$client_pod"-$random_str-client.cap
  static_tcpdump_path=$(which static-tcpdump)

  # run nc listening program
  if [[ $protocol = tcp ]]; then
#    kubectl exec -it "$server_pod" -n "$server_ns" -- nohup nc "-lup $port" &
#  else
    kubectl exec -it "$server_pod" -n "$server_ns" -- nohup nc "-lkp $port" &
  fi

  if [[ ! $? ]]; then
    print_log "ERROR" "Start nc server listening failed."
    return 1
  fi

  print_log "INFO" "Waiting for server sniff to start..."
  start_sniff "$server_ns" "$server_pod" "$port" "$static_tcpdump_path" "$pcap_out_file_server" "$protocol"
  if [[ ! $? ]]; then
    print_log "ERROR" "Start server sniff failed."
    return 1
  fi

  print_log "INFO" "Waiting for client sniff to start..."
  start_sniff "$client_ns" "$client_pod" "$port" "$static_tcpdump_path" "$pcap_out_file_client" "$protocol"
  if [[ ! $? ]]; then
    print_log "ERROR" "Start client sniff failed."
    return 1
  fi

  # create empty file which will used as test packets
  temp_file=ksniff_file_"$random_str".log
  /bin/rm -rf "$temp_file"
  dd if=/dev/zero of="$temp_file" bs="$pkg_byte_len" count=1 >/dev/null 2>&1
  if [[ ! $? ]]; then
    print_log "ERROR" "Generate udp test file failed."
    return 1
  fi
  # send udp packets to server pod many times
  send_sum=0
  print_log "INFO" "Start send file for $pkg_count times."
  until [ $send_sum -ge "$pkg_count" ]; do
    send_sum=$((send_sum + 1))
    if [[ $protocol = udp ]]; then
      kubectl exec -it "$client_pod" -n "$client_ns" -- nc "$pod_ip" "$port" -n -u <"$temp_file" >/dev/null 2>&1
    else
      kubectl exec -it "$client_pod" -n "$client_ns" -- nc "$pod_ip" "$port" -n <"$temp_file" >/dev/null 2>&1
    fi
    sleep 1
  done

  print_log "INFO" "Finished sent file."
  /bin/rm -rf "$temp_file"

  # kill sniff process
  pgrep -f "$pcap_out_file_server" | xargs -i kill {}
  if [[ ! $? ]]; then
    print_log "WARN" "Kill sniff server process failed"
  else
    print_log "INFO" "Kill sniff server process success"
  fi

  pgrep -f "$pcap_out_file_client" | xargs -i kill {}
  if [[ ! $? ]]; then
    print_log "WARN" "Kill sniff client process failed"
  else
    print_log "INFO" "Kill sniff client process success"
  fi

  # kill tcpdump process started by sniff
  server_tcpdump_pid=$(kubectl exec -it "$server_pod" -n "$server_ns" -- ps -ef | grep "/tmp/static-tcpdump" | grep -v "grep" | awk '{print $2}')
  if [[ $? && -n $server_tcpdump_pid ]]; then
    kubectl exec -it "$server_pod" -n "$server_ns" -- kill -9 "$server_tcpdump_pid" >/dev/null 2>&1
    if [[ ! $? ]]; then
      print_log "WARN" "Kill tcpdump process started by sniff failed, pod: $server_pod($server_ns)"
    else
      print_log "INFO" "Kill tcpdump process started by sniff success, pod: $server_pod($server_ns)"
    fi
  fi

  client_tcpdump_pid=$(kubectl exec -it "$client_pod" -n "$client_ns" -- ps -ef | grep "/tmp/static-tcpdump" | grep -v "grep" | awk '{print $2}')
  if [[ $? && -n $client_tcpdump_pid ]]; then
    kubectl exec -it "$client_pod" -n "$client_ns" -- kill -9 "$client_tcpdump_pid" >/dev/null 2>&1
    if [[ ! $? ]]; then
      print_log "WARN" "Kill tcpdump process started by sniff failed, pod: $client_pod($client_ns)"
    else
      print_log "INFO" "Kill tcpdump process started by sniff success, pod: $client_pod($client_ns)"
    fi
  fi

  # kill nc listening process
  if [[ $protocol = tcp ]]; then
##    nc_listening_pid=$(kubectl exec -it "$server_pod" -n "$server_ns" -- pgrep -f "lup $port")
#    nc_listening_pid=$(kubectl exec -it "$server_pod" -n "$server_ns" -- ps -ef | grep "lup $port" | grep -v "grep" | awk '{print $2}')
#  else
#    nc_listening_pid=$(kubectl exec -it "$server_pod" -n "$server_ns" -- pgrep -f "lkp $port")
    nc_listening_pid=$(kubectl exec -it "$server_pod" -n "$server_ns" -- ps -ef | grep "lkp $port" | grep -v "grep" | awk '{print $2}')
    if [[ $? && -n $nc_listening_pid ]]; then
      kubectl exec -it "$server_pod" -n "$server_ns" -- kill -9 "$nc_listening_pid" >/dev/null 2>&1
      if [[ ! $? ]]; then
        print_log "WARN" "Kill nc server listening failed, pod: $server_pod($server_ns)"
      else
        print_log "INFO" "Kill nc server listening success, pod: $server_pod($server_ns)"
      fi
    fi
  fi

  analysis_cap_file "$pcap_out_file_server" "$pcap_out_file_client" "$port" "$protocol"

  if [[ ! $? ]]; then
    print_log "ERROR" "Analysis pcap file failed."
    return 1
  fi

  return 0
}

function main() {
  if [[ ! $protocol = udp && ! $protocol = tcp ]]; then
    print_log "ERROR" "Only support udp and tcp protocol."
    return 1
  fi
  if [[ ! $mode = pod && ! $mode = node ]]; then
    print_log "ERROR" "Only support pod and node mode."
    return 1
  fi
  check_command static-tcpdump
  check_command tcpdump
  if [[ $mode = pod ]]; then
    if command -v kubectl >/dev/null 2>&1; then
      check_ns_exists "$client_ns"
      check_ns_exists "$server_ns"
      check_pod_exists "$client_pod" "$client_ns"
      check_pod_command "$client_pod" "$client_ns" "nc"
      if [[ ! $? ]]; then
        return 1
      fi
      if kubectl -v=3 plugin list 2>/dev/null | grep -q kubectl-sniff >/dev/null 2>&1; then
        server_pod_list=$(kubectl get pods -n "$server_ns" | grep "$server_pod" | grep "Running" | awk '{print $1}')
        if [[ -z $server_pod_list ]]; then
          print_log "ERROR" "No pod can be found. Nok"
          exit 1
        fi
        return_code=0
        for pod in $server_pod_list; do
          check_pod_command "$pod" "$server_ns" "nc"
          if [[ ! $? ]]; then
            return_code=1
          fi
          print_log "INFO" "Start run sniff for $protocol, packets from pod: $client_pod($client_ns) to pod: $pod($server_ns)"
          run_sniff "$server_ns" "$pod" "$client_ns" "$client_pod" "$port" "$pkg_byte_len" "$pkg_count" "$protocol"
          if [[ ! $? ]]; then
            print_log "ERROR" "Finished run sniff, Nok."
            return_code=1
          fi
        done
        if [[ $return_code -eq 0 ]]; then
          print_log "INFO" "Finished all sniff, Ok."
          exit 0
        else
          print_log "ERROR" "Finished all sniff, Nok."
          exit 1
        fi
      else
        print_log "ERROR" "kubectl plugin sniff is not found in system env. Nok"
        exit 1
      fi
    else
      print_log "ERROR" "kubectl command is not found in system env. Nok"
      exit 1
    fi
  else
    print_log "INFO" "Node mode is coming soon."
    exit 0
  fi
}


########################
#     main program     #
########################
check_input "$@"
get_options "$@"
main "$@"
