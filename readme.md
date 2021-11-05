## 基础环境

必须python3.6以上

## 安装

```bash
# 安装依赖库
pip3 install -r requirements.txt
# 启动
python3 main.py
```

## docker构建

dockerfile

```bash
#base image
FROM alpine:latest

#Compiling person
MAINTAINER yangchao

# environment variable 
ENV LANG=C.UTF-8

# Setting Update Source 
RUN echo -e "http://mirrors.aliyun.com/alpine/latest-stable/main/\nhttp://mirrors.aliyun.com/alpine/latest-stable/community/" > /etc/apk/repositories && \
    echo -e "nameserver 114.114.114.114" /etc/resolv.conf && \
    apk --no-cache update && \
    apk add --no-cache openssh-client tzdata python3 python3-dev py3-pip git gcc libffi-dev musl-dev make && \ 
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    git clone http://blog.yangxx.net:30000/yangchao/setup-tools-agent.git && \
    cd setup-tools-agent && \
    pip3 --no-cache-dir install --index-url  https://mirrors.aliyun.com/pypi/simple --upgrade pip && \
    pip3 --no-cache-dir install --index-url  https://mirrors.aliyun.com/pypi/simple install -r requirements.txt 

# port
EXPOSE 80

WORKDIR /setup-tools-agent

# CMD
CMD ["/usr/bin/python3","main.py"]
```





