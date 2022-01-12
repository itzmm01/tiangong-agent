#!/usr/bin/python 
# -*- coding: utf-8 -*
import json
import logging
import os
import re
import signal
import subprocess
import sys
import threading
from multiprocessing import Process, Pool
from multiprocessing.pool import ThreadPool
from types import FrameType
from typing import cast
import asyncio

import uvicorn
import yaml
from fastapi import BackgroundTasks, FastAPI
from loguru import logger
from pydantic import BaseModel

from tools.scheduler import scheduler
import time


class InterceptHandler(logging.Handler):
    def emit(self, record: logging.LogRecord) -> None:  # pragma: no cover
        # Get corresponding Loguru level if it exists
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = str(record.levelno)

        # Find caller from where originated the logged message
        frame, depth = logging.currentframe(), 2
        while frame.f_code.co_filename == logging.__file__:  # noqa: WPS609
            frame = cast(FrameType, frame.f_back)
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(
            level, record.getMessage(),
        )


base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
log_path = os.path.join(base_dir, 'logs')
if not os.path.exists(log_path):
    os.mkdir(log_path)
if not os.path.exists(log_path):
    os.mkdir(log_path)

debug = True
logging_level = logging.DEBUG if debug else logging.INFO
# loggers = ("uvicorn.asgi", "uvicorn.access")
loggers = "uvicorn.asgi"

logging.getLogger().handlers = [InterceptHandler()]
for logger_name in loggers:
    logging_logger = logging.getLogger(logger_name)
    logging_logger.handlers = [InterceptHandler(level=logging_level)]

log_file_path = os.path.join(log_path, 'info.log')
err_log_file_path = os.path.join(log_path, 'error.log')

loguru_config = {
    "handlers": [
        {"sink": sys.stderr, "level": "INFO",
         "format": "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | <level>{level}</level> | "
                   "<cyan>{module}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"},
        {"sink": log_file_path, "rotation": "00:00", "encoding": 'utf-8'},
        {"sink": err_log_file_path, "serialize": True, "level": 'ERROR', "rotation": "00:00",
         "encoding": 'utf-8'},
    ],
}
# format 参数： {time} {level} {message}、  {time:YYYY-MM-DD at HH:mm:ss} | {level} | {message} 记录参数
# level 日志等级
# rotation 参数：1 week 一周、00:00每天固定时间、 500 MB 固定文件大小
# retention 参数： 10 days 日志最长保存时间
# compression 参数： zip 日志文件压缩格式
# enqueue 参数 True 日志文件异步写入
# serialize 参数： True 序列化json
# encoding 参数： utf-8 字符编码、部分情况会出现中文乱码问题
# logger.info('If you are using Python {}, prefer {feature} of course!', 3.6, feature='f-strings') 格式化输入内容
# 可通过等级不同对日志文件进行分割储存
logger.configure(**loguru_config)
access_log = False
# 正式环境关闭swagger
# app = FastAPI(
#     docs_url=None,
#     redoc_url=None,
#     access_log=False
# )

app = FastAPI(
    access_log=access_log,
)


@app.get("/")
def root():
    return {"message": "Hello World"}


class Jobs(BaseModel):
    id: int
    name: str
    jobs: list
    host: dict
    params: dict


class JobsName(BaseModel):
    id: int
    name: str
    job_name: str
    task_name: str


# 查询日志请求
class JobLog(BaseModel):
    id: int
    start_line: int
    last_line: int
    job_name: str
    task_name: str
    file_name: str


def get_all_status():
    res = []
    for root1, dirs, files in os.walk('./status_file/'):
        res = [re.sub('.json', '', i) for i in files]
    return res


def check_ip(one_str):
    """
     正则匹配方法
     判断一个字符串是否是合法IP地址
    """
    compile_ip = re.compile(r'^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$')
    if compile_ip.match(one_str):
        return True
    else:
        return False


class Status:
    def __init__(self):
        self.status_file = ""

    @staticmethod
    def del_job(name):
        status_file = "./status_file/{}.json".format(name)
        if not os.path.exists(status_file):
            return None
        else:
            os.remove(status_file)
            return True

    @staticmethod
    def init(name, job: Jobs):
        status_file = "./status_file/{}.json".format(name)
        jobs = job.jobs
        job_status = {}
        for job in jobs:
            job_tasks = job['job'].get('tasks')
            job_name = job['job'].get('name')
            for task in job_tasks:
                job_status[job_name + "-" + task.get('name')] = 0
        if not os.path.exists("./status_file/"):
            os.mkdir("./status_file/")
        if not os.path.exists(status_file):
            with open(status_file, "w") as f1:
                f1.write(json.dumps(job_status))
            return job_status
        else:
            with open(status_file, "r") as f1:
                return json.loads(f1.read())

    @staticmethod
    def get_job(name):
        status_file = "./status_file/{}.json".format(name)
        if not os.path.exists(status_file):
            return None
        with open(status_file, "r") as f1:
            return json.loads(f1.read())

    @staticmethod
    def set_status(name, task_name, status):
        status_file = "./status_file/{}.json".format(name)
        with open(status_file, "r") as f1:
            step_status = json.loads(f1.read())
        if task_name == "*":
            for key in step_status:
                step_status[key] = status
        else:
            step_status[task_name] = status
        with open(status_file, "w") as f1:
            f1.write(json.dumps(step_status))

    @staticmethod
    def save_pid(name, job_pid):
        status_file = "./status_file/{}-pid.json".format(name)
        with open(status_file, "w") as f1:
            f1.write(str(job_pid))

    @staticmethod
    def get_pid(name):
        status_file = "./status_file/{}-pid.json".format(name)
        if os.path.exists(status_file):
            with open(status_file, "r") as f1:
                job_pid = f1.read()
        else:
            job_pid = None
        return job_pid


def json_to_yml(json_data, yml_path):
    yaml_data = yaml.load(json_data, Loader=yaml.FullLoader)
    stream = open(yml_path, 'w')
    yaml.safe_dump(yaml_data, stream, default_flow_style=False)


def run_job(status, jobs, job_status):
    print(threading.currentThread())
    for job in jobs.get('jobs'):
        job_host = job["job"].get('host')
        if check_ip(job_host):
            hosts = []
            for group, host_list in jobs.get('host').items():
                for host in host_list:
                    if host.get("ip") == job_host:
                        hosts = [host]
        else:
            if job_host == "local":
                hosts = ["local"]
            else:
                hosts = jobs.get('host').get(job["job"].get('host'))
        if len(hosts) == 0:
            logger.error("not found host info")
            return
        for task in job['job'].get('tasks'):
            task_name = job['job'].get('name') + "-" + task.get('name')
            start_time = time.time()

            if job_status[task_name] == 200:
                logger.info("job {}: {} is already complete...".format(jobs.get("name"), task_name))
                status.set_status(jobs.get("name"), "err", "")
            elif job_status[task_name] == 1:
                logger.info("job {}: {} is Running...".format(jobs.get("name"), task_name))
                status.set_status(jobs.get("name"), "err", "")
            else:
                status.set_status(jobs.get("name"), task_name, 1)
                if "task_own_log_file" not in task:
                    task["task_own_log_file"] = task_name
                if "time_out" not in task:
                    task["time_out"] = 36000
                if "print_result" not in task:
                    task["print_result"] = True

                res = scheduler.execute_task(hosts, task, jobs.get('params'))

                if res != 0:
                    status.set_status(jobs.get("name"), task_name, 502)
                    logger.error("job {}: {} is Run error...".format(jobs.get("name"), task_name))
                    return
                else:
                    logger.info("job {}: {} is Run success...".format(jobs.get("name"), task_name))
                    status.set_status(jobs.get("name"), task_name, 200)
                status.set_status(jobs.get("name"), "err", "")
            end_time = time.time()
            logger.info("job {} ,task: {} ,duration: {}".format(jobs.get("name"), task_name, end_time - start_time))


def run_job1(status, job, job_status):
    time.sleep(30)
    logger.info(status, job, job_status)


@app.post("/submit_jobs/")
def submit_jobs(job: Jobs, background_tasks: BackgroundTasks):
    status = Status()
    job_status = status.init(job.name, job)
    write_yaml("./log/" + init_log_info(job.dict())["file_name"], init_log_info(job.dict()))
    background_tasks.add_task(run_job, status, job.dict(), job_status)
    # await run_job(status, job.dict(), job_status)
    # loop = asyncio.get_event_loop()
    # await loop.run_in_executor(None, run_job, (status, job.dict(), job_status,))
    # p = Process(target=run_job1, args=(status, job.dict(), job_status,))
    # p.daemon = True
    # p.start()
    # status.save_pid(job.dict().get("name"), p.pid)
    return {"code": 200, "message": "jobs submit success"}


def init_log_info(job_obj):
    log_info = {
        "file_name": str(job_obj["id"]),
        "name": job_obj.get("name"),
        "host": job_obj["host"],
        "INSTALL_DIR": job_obj["params"]["INSTALL_DIR"],
    }
    for i in job_obj.get("jobs"):
        log_info[i["job"]["name"]] = i["job"]["host"]
    return log_info


def write_yaml(file_path, dict_obj):
    with open(file_path, encoding='utf-8', mode='w') as f:
        yaml.dump(data=dict_obj, stream=f, allow_unicode=True)


def check_file_remove(file_path):
    if os.path.exists(file_path):
        os.remove(file_path)
    else:
        pass


@app.post("/stop_job")
def stop_jobs(job: JobsName):
    check_file_remove("./status_file/{}-pid.json".format(job.name))
    check_file_remove("./status_file/{}.json".format(job.name))
    # if job_pid is None:
    #    return {"code": 200, "message": "no such job name %s" % job.name}
    # try:
    #    os.kill(int(job_pid), signal.SIGKILL)
    #    check_file_remove("./status_file/{}-pid.json".format(job.name))
    #    check_file_remove("./status_file/{}.json".format(job.name))
    #    logger.info("stop job %s: %s success" % (job.name, job_pid))
    # except OSError:
    #    logger.info("stop job %s: %s success" % (job.name, job_pid))
    # except Exception as e:
    #    logger.error("stop job %s: %s failed: %s" % (job.name, job_pid, str(e)))
    #    return {"code": 502, "message": str(e)}
    return {"code": 200, "message": "kill success"}


@app.post("/get_job_status/")
def get_job_status(job: JobsName):
    status = Status()
    code = 200
    if status.get_job(job.name):
        res = status.get_job(job.name)
        err = res.get("err")
        if res.get("err") is not None:
            del res["err"]
    else:
        res = "not found job: {}".format(job.name)
        err = res
        code = 404
    return {"code": code, "message": "success", "name": job.name, "data": res, "err": err}


def return_cmd(file_name, flag, install_dir, start_line, last_line):
    if file_name == "":
        cmd = "ls %s/log/%s/" % (install_dir, flag)
    else:
        if last_line == 0:
            cmd = "cat -n %s/log/%s/%s | sed -n '%s,$p' " % (install_dir, flag, file_name, start_line)
        else:
            cmd = "cat -n %s/log/%s/%s | tail -%s " % (install_dir, flag, file_name, last_line)
    return cmd


def run_cmd(task_dict):
    res_data = {"code": 200, "data": ""}
    pwd = re.sub(r"\\", "/", os.path.abspath(os.curdir))
    if task_dict["host"][0] == "local":
        cmd_str = task_dict["cmd"]
    else:
        cmd_str = pwd + "/tools/scheduler/send_cmd.sh -i {} -P {} -u {} -c \"{}\" -p '{}'  -t 600".format(
            task_dict["host"][0]["ip"], task_dict["host"][0]["port"],
            task_dict["host"][0]["user"], task_dict["cmd"],
            task_dict["host"][0]["password"]
        )

    obj = subprocess.run(cmd_str, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, encoding="utf-8")

    res_data["data"] = obj.stdout if obj.returncode == 0 else obj.stderr
    return res_data


def get_log(job_id, job_name, task_name, file_name, start_num, last_line):
    pwd = os.path.abspath(os.curdir)
    job_file = "./log/" + str(job_id)
    if not os.path.exists(job_file):
        return {"code": 502, "message": "no such job %s" % job_id}
    with open(job_file, encoding="utf-8", mode="r") as f1:
        log_info = yaml.load(f1.read(), Loader=yaml.SafeLoader)

    if log_info.get(job_name) is None:
        return {"code": 502, "message": "step: %s no find, please check" % job_name}

    if log_info["host"].get(log_info[job_name]) or log_info[job_name] == "local":
        host = ["local"] if log_info[job_name] == "local" else [log_info["host"].get(log_info[job_name])[0]]
    else:
        return {"code": 502, "message": "step: %s no set host, please check" % job_name}

    task = {
        "title": task_name,
        "name": task_name,
        "cmd": "ls",
        "type": "command",
        "time_out": 3600,
        "checked": True,
        "key": task_name,
        "host": host
    }

    if job_name == "1. prepare material":
        if last_line ==0:
            task["cmd"] = "cat -n %s/nohup.out| sed -n '%s,$p' " % (pwd, start_num)
        else:
            task["cmd"] = "cat -n %s/nohup.out| tail -%s " % (pwd, last_line)
    elif job_name == "2. install":
        if task_name == "2.1 pre init check":
            task["cmd"] = return_cmd(file_name, "pre-init-check", log_info["INSTALL_DIR"], start_num, last_line)
        elif task_name == "2.2. init":
            task["cmd"] = return_cmd(file_name, "init", log_info["INSTALL_DIR"], start_num, last_line)
        elif task_name == "2.3. pre install check":
            task["cmd"] = return_cmd(file_name, "pre-install-check", log_info["INSTALL_DIR"], start_num, last_line)
        elif task_name == "2.4 install":
            task["cmd"] = return_cmd(file_name, "install", log_info["INSTALL_DIR"], start_num, last_line)
        else:
            return {"code": 502, "message": "no support %s" % task_name}

    elif job_name == "3. uninstall":
        if task_name == "3.1. task uninstall":
            task["cmd"] = return_cmd(file_name, "uninstall", log_info["INSTALL_DIR"], start_num)
        else:
            return {"code": 502, "message": "no support %s" % task_name}
    else:
        task["cmd"] = "cat -n %s/nohup.out| sed -n '%s,$p' " % (pwd, start_num)

    return run_cmd(task)


@app.post("/get_job_log")
def get_job_log(log: JobLog):
    return get_log(log.id, log.job_name, log.task_name, log.file_name, log.start_line, log.last_line)


@app.post("/init_job_status/")
def init_job_status(job: JobsName):
    if Status().del_job(job.name) is None:
        return {"code": 200, "message": "no found job {}".format(job.name)}
    else:
        return {"code": 200, "message": "success"}

# if __name__ == "__main__":
#    uvicorn.run("main:app", host="0.0.0.0", port=61234, access_log=access_log)
