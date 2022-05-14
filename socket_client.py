import time

import socketio
import deploy
from deploy import Jobs, JobLog, JobsName
import requests
from requests.adapters import HTTPAdapter
from loguru import logger
from multiprocessing import Process

http_session = requests.Session()

http_session.mount('https://', HTTPAdapter(max_retries=2))
http_session.mount('http://', HTTPAdapter(max_retries=2))

sio = socketio.Client(reconnection_delay=5,
                      reconnection_delay_max=20,
                      reconnection_attempts=0,
                      reconnection=True,
                      http_session=http_session)

MAX_DELAY_IN_SECONDS = 30
DELAY_IN_SECONDS = 5
MAX_RETRIES = 100000
retry_times = 0

socket_host = ''
socket_path = ''
socket_token = ''


@sio.on('connect')
def on_connect():
    """
    连接回调
    :return:
    """
    logger.info("on_connect ")
    pass


@sio.on('disconnect')
def on_disconnect():
    logger.info("ws disconnect!")
    pass


@sio.on('error')
def on_error(reason):
    logger.warning("ws on error: {}", reason)
    pass


@sio.on('submit_jobs')
def on_submit_jobs(data: dict):
    """
    提交任务
    :param data:
    :return:
    """
    print("on_submit_jobs: ")
    job = Jobs(id=data.get("id"),
               host=data.get("host"),
               name=data.get("name"),
               jobs=data.get("jobs"),
               params=data.get("params")
               )
    return deploy.submit_jobs(job)
    pass


@sio.on('stop_job')
def on_stop_job(data: dict):
    """
    停止job
    :return:
    """
    job = JobsName(
        id=data.get("id"),
        name=data.get("name"),
        task_name=data.get("task_name"),
        job_name=data.get("job_name"),
    )
    return deploy.stop_jobs(job)
    pass


@sio.on('get_job_status')
def on_get_status(data: dict):
    """
    获取job执行状态
    :param data:
    :return:
    """
    job = JobsName(
        id=data.get("id"),
        name=data.get("name"),
        task_name=data.get("task_name"),
        job_name=data.get("job_name"),
    )
    return deploy.get_job_status(job)
    pass


@sio.on('get_log')
def on_get_log(params: dict):
    """
    获取日志信息
    :return:
    """
    log = JobLog(
        id=params.get("id"),
        start_line=params.get("start_line"),
        end_line=params.get("end_line"),
        last_line=params.get("last_line"),
        job_name=params.get("job_name"),
        task_name=params.get("task_name"),
        file_name=params.get("file_name"),
    )

    return deploy.get_job_log(log)
    pass


@sio.on('health')
def on_health(data):
    """
    健康检查
    :params:data 参数必须要，不然会报错
    :return: 200 表示 ok了
    """
    return 200
    pass


def connect_srv(host, code, path):
    """连接服务器
    :param host: 服务器主机
    :param code: 代理服务的agent
    :param path:
    :return:
    """
    sio.reconnection_attempts = 0
    headers = {
        'token': code
    }
    sio.connect(host, headers=headers, socketio_path=path, wait_timeout=10000, )
    sio.wait()


def startup():
    logger.info("web socket startup")
    try:
        file = open('./server.info')

        global socket_host, socket_path, socket_token, MAX_RETRIES, MAX_DELAY_IN_SECONDS, DELAY_IN_SECONDS, retry_times
        line = file.readline()

        while line:
            line = line.replace('\n', '').replace('\t', '')
            logger.info("line: {}".format(line))
            if line.startswith('host:'):
                socket_host = line[5:len(line)]
            elif line.startswith("path:"):
                socket_path = line[5:len(line)]
            elif line.startswith("token:"):
                socket_token = line[6:len(line)]

            line = file.readline()

        file.close()

        while True:
            try:
                if retry_times > 0:
                    delay = DELAY_IN_SECONDS + retry_times
                    if delay > MAX_DELAY_IN_SECONDS:
                        delay = MAX_DELAY_IN_SECONDS
                    logger.info("reconnect times: {}, delay : {}", retry_times, delay)
                    time.sleep(delay)
                connect_srv(host=socket_host, code=socket_token, path=socket_path)
            except KeyboardInterrupt:
                break
            except Exception as e:
                logger.error("connect_srv fail!  {}", e)
                if retry_times + 1 > MAX_RETRIES:
                    break
                retry_times = retry_times + 1

        logger.info("ws finish !, total retry times: {}", retry_times)

    except Exception as e:
        logger.error("ws startup fail: {}", e)

    pass


def append_startup():
    p = Process(target=startup)
    # p.daemon = True
    p.start()


if __name__ == '__main__':
    startup()
