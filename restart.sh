echo "stop service..."
ps -ef | grep main.py | grep -v "grep" | awk '{print $2}' | xargs -i kill -9 {}
echo "start service"
nohup python3 main.py &
echo "check service status"
pid=$(ps -ef | grep main.py | grep -v "grep" | awk '{print $2}')
if [[ -n $pid ]]; then
    echo "pid:"$pid
    echo "all done"
    exit 0
fi
echo "restart service failed. please restart it manunally!"
