#!/bin/bash

name="tiangong-agent"
home_dir=`pwd`

if [ "$1" == "" ]; then
  port="61234"
else
  port="$1"
fi

[ ! -d "./Miniconda3" ] && bash Miniconda3.sh -b -p ./Miniconda3 

./Miniconda3/bin/pip3 install  --index-url  https://mirrors.aliyun.com/pypi/simple install -r ./requirements.txt

[ $? -ne 0 ] && echo "pip3 install fail, please check network"

find ./ -name "*.sh" |xargs -i chmod +x {}
source ./tools/cli.env

echo """#!/bin/bash

start(){
    cd $home_dir
    nohup ./Miniconda3/bin/uvicorn main:app --host 0.0.0.0 --port $port >> $home_dir/nohup.out 2>&1 &

}

stop(){
    ps -ef | grep $home_dir/main.py | grep -v "grep" | awk '{print \$2}' | xargs -i kill -9 {}

}

case "\$1" in
start)
    start
    ;;
stop)
    stop
    ;;
*)
    echo "unknow args"
    ;;
esac

""" > $home_dir/agent.sh
chmod +x $home_dir/agent.sh
echo """
[Unit]
Description=Media wanager Service
After=network.target
 
[Service]
Type=forking
 
ExecStart=/bin/bash -c '$home_dir/agent.sh start'
ExecStop=$home_dir/agent.sh stop
 
[Install]
WantedBy=multi-user.target

""" > /usr/lib/systemd/system/${name}.service

systemctl daemon-reload 
systemctl restart ${name}
systemctl status ${name}
cat nohup.out
