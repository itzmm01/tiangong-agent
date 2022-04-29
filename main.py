#!/usr/bin/python 
# -*- coding: utf-8 -*
import json
import os
from multiprocessing import Process

import uvicorn
from fastapi import FastAPI
from loguru import logger
from fastapi.middleware.cors import CORSMiddleware

import socket_client
import deploy
from deploy import Jobs, JobLog, JobsName

debug = True
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
app.add_middleware(
    CORSMiddleware,
    # 允许跨域的源列表，例如 ["http://www.example.org"] 等等，["*"] 表示允许任何源
    allow_origins=["http://localhost:3006", "http://www.tonyandmoney.cn", "https://www.tonyandmoney.cn"],
    # 跨域请求是否支持 cookie 如果为 True，allow_origins 必须为具体的源，不可以是 ["*"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Hello World"}


@app.post("/submit_jobs/")
def submit_jobs(job: Jobs):
    return deploy.submit_jobs(job)


@app.post("/stop_job")
def stop_jobs(job: JobsName):
    return deploy.stop_jobs(job)


@app.post("/get_job_status/")
def get_job_status(job: JobsName):
    return deploy.get_job_status(job)


@app.post("/get_job_log")
def get_job_log(log: JobLog):
    return deploy.get_job_log(log)


@app.post("/init_job_status/")
def init_job_status(job: JobsName):
    return deploy.init_job_status(job)


@app.on_event("startup")
def startup_event():
    socket_client.startup()
    logger.info("socket client startup....")
    for file1 in os.listdir("./status_file/"):
        if ".params" in file1:
            logger.info("Scan to task file: %s" % file1)
            status = deploy.Status()
            with open("./status_file/%s" % file1, "r") as f1:
                job = json.load(f1)
            file_name = file1.split('.params')[0]
            status_file = "./status_file/%s.json" % file_name
            if not os.path.exists(status_file):
                return
            with open(status_file, "r") as f2:
                job_status = json.load(f2)
            status_params_yaml = "./log/" + deploy.init_log_info(job)["file_name"]
            if not os.path.exists(status_params_yaml):
                return
            deploy.write_yaml(status_params_yaml, deploy.init_log_info(job))
            p = Process(target=deploy.run_job, args=(status, job, job_status,))
            p.start()
        else:
            logger.info("skip file %s" % file1)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=61234, access_log=access_log)
