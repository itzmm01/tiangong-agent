## 基础环境

使用Miniconda3-python

需要磁盘空间600M

由于需要安装python库需要保证能访问互联网

## 安装

```bash
# ./install.sh 安装端口
bash ./install.sh 61234
```

## 服务管理

```bash
# 查看状态
systemctl status tiangong-agent
# 启动
systemctl start tiangong-agent
# 停止
systemctl stop tiangong-agent
# 重启
systemctl restart tiangong-agent
# 开机启动
systemctl enable tiangong-agent
# 查看日志
tail -f nohup.out
```





