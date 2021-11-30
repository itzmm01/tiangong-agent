#!/usr/bin/env bash

AGENT_WORKDIR=${HOME}/.coding-cd
AGENT_HOME=$(pwd)
AGENT_DOWNLOAD_URL="https://coding-public-generic.pkg.coding.net/cd/generic/agent/cloud-agent.tar.gz"
#AGENT_DOWNLOAD_URL="https://selinaxeon-generic.pkg.coding.net/testing/generic/cloud-agent.tar.gz"
AGENT_NAME=cloud-agent

SECRET=$1
PROTOCOL="wss"
if [ $# -ge 2 ]; then
    PROTOCOL=$2
fi
SERVER_HOST="coding-public.coding.net"
if [ $# -ge 3 ]; then
    SERVER_HOST=$3
fi
OVERWRITE="--overwrite=false"
if [ $# -ge 4 ]; then
    OVERWRITE=$4
fi

set -eo pipefail

# delete shell history
if [[ -f ~/.zsh_history && "${SHELL}" =~ "zsh" ]]; then
    sed -i '$d' ~/.zsh_history
elif [[ -f ~/.bash_history && "${SHELL}" =~ "bash" ]]; then
    sed -i '$d' ~/.bash_history
fi

if [[ -f ${AGENT_WORKDIR}/config/cloud-agent.yaml && "${OVERWRITE}" != "--overwrite" ]]; then
    PID=$(cat ${AGENT_WORKDIR}/config/cloud-agent.yaml | grep "pid: " | awk -F ' ' '{print $2}')
    if [[ "${PID}" != "-1" && "$(ps ${PID} >/dev/null 2>&1 || echo $?)" != "1" ]]; then
        echo -en "The cloud-agent is running, please execute the command '\033[32mcloud-agent stop\033[0m' to stop it first.\n"
        exit 0
    fi

    echo -en "The cloud-agent has been already installed. You can execute the command '\033[32mcloud-agent up -d\033[0m' to start the cloud-agent.\n"
    echo -en "\n\033[31mOverwriting the installation will result in the unusable of the related CD pipelines!\033[0m\n\n"
    echo "If you want to overwrite the installation, please execute the command: "
    echo -en "\n\033[32mcurl -sL \"https://coding-public-generic.pkg.coding.net/cd/generic/agent/install.sh\" | bash -s ${SECRET} ${PROTOCOL} ${SERVER_HOST} --overwrite\033[0m\n"
    if [[ "${OVERWRITE}" != "--overwrite" ]]; then
        exit 0
    fi
fi

set -u

# download and run agent
mkdir -p ${AGENT_HOME}
curl -L ${AGENT_DOWNLOAD_URL} -o ${AGENT_HOME}/${AGENT_NAME}.tar.gz
tar xzvf ${AGENT_HOME}/${AGENT_NAME}.tar.gz -C ${AGENT_HOME}
rm -rf ${AGENT_HOME}/${AGENT_NAME}.tar.gz
chmod +x ${AGENT_HOME}/${AGENT_NAME}
${AGENT_HOME}/${AGENT_NAME} init --secret ${SECRET} --protocol ${PROTOCOL} --server ${SERVER_HOST}
${AGENT_HOME}/${AGENT_NAME} up -d
