import socketio
import deploy
from deploy import Jobs, JobLog, JobsName
import requests
from requests.adapters import HTTPAdapter
from loguru import logger

http_session = requests.Session()

http_session.mount('https://', HTTPAdapter(max_retries=10000))
http_session.mount('http://', HTTPAdapter(max_retries=10000))
sio = socketio.Client(reconnection_delay=5000,
                      reconnection_delay_max=10000,
                      reconnection_attempts=0,
                      reconnection=True,
                      http_session=http_session)

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


def on_disconnect(reason):
    logger.info("disconnect: ", reason)
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
def on_health():
    """
    健康检查
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

        global socket_host, socket_path, socket_token
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

        # p = Process(target=deploy.run_job, args=(status, job, job_status,))
        # p.start()

        file.close()
        sio.start_background_task(target=connect_srv, host=socket_host, code=socket_token, path=socket_path)
        logger.info("web socket start end")

    except Exception as e:
        logger.error("load file err", e)

    pass


if __name__ == '__main__':
    startup()
