import json
import yaml

a = {'id': 1419124095219400704, 'name': 'mongodb_3.6 WiredTiger_0', 'jobs': [{'job': {'title': '1. 准备物料',
                                                                                      'name': '1. prepare material',
                                                                                      'host': 'local', 'tasks': [
        {'title': '1.1. 清理物料包', 'name': '1.1. clear material', 'type': 'command',
         'cmd': 'rm -rf ${WORKSPACE_DIR}/${MATERIAL_NAME}', 'checked': True,
         'key': '1. prepare material-1.1. clear material'},
        {'title': '1.2. 下载物料包', 'name': '1.2. download material', 'type': 'command', 'time_out': 600,
         'cmd': "mkdir -p ${WORKSPACE_DIR} && cd ${WORKSPACE_DIR} && wget '${MATERIAL_URL}' -O ${MATERIAL_NAME}",
         'checked': True, 'key': '1. prepare material-1.2. download material'},
        {'title': '1.3. 解压物料包(zip)', 'name': '1.3. unzip material', 'type': 'command',
         'item_condition': '${MATERIAL_IS_ZIP}',
         'cmd': 'cd ${WORKSPACE_DIR} && unzip -o  ${MATERIAL_NAME} -d ${MATERIAL_FOLDER}', 'checked': True,
         'key': '1. prepare material-1.3. unzip material'},
        {'title': '1.3.1 解压物料包(tar)', 'name': '1.3.1 unzip material', 'type': 'command',
         'item_condition': 'not ${MATERIAL_IS_ZIP}', 'cmd': 'cd ${WORKSPACE_DIR} && tar zxvf ${MATERIAL_NAME}',
         'time_out': 600, 'checked': True, 'key': '1. prepare material-1.3.1 unzip material'},
        {'title': '1.4. 下载配置文件', 'name': '1.4. download config', 'type': 'command',
         'cmd': "cd ${INSTALL_DIR}/conf && wget '${CONFIG_URL}' -O conf.zip", 'checked': True,
         'key': '1. prepare material-1.4. download config'},
        {'title': '1.5. 配置文件解压', 'name': '1.5. unzip conf zip', 'type': 'command',
         'cmd': 'cd ${INSTALL_DIR}/conf && unzip -o conf.zip -d .', 'checked': True,
         'key': '1. prepare material-1.5. unzip conf zip'},
        {'title': '1.6. 下载产品物料', 'name': '1.6. download product material', 'type': 'command',
         'with_items': 'PRODUCT_MATERIALS', 'time_out': 36000,
         'cmd': "cd ${INSTALL_DIR}/material && wget '${PRODUCT_MATERIALS.url}' -O ${PRODUCT_MATERIALS.name}",
         'checked': True, 'key': '1. prepare material-1.6. download product material'},
        {'title': '1.7 下载setup-tools', 'name': '1.7. download setup-tools', 'type': 'command',
         'cmd': "wget '${SETUP_TOOLS_URL}' -O  ${WORKSPACE_DIR}/setup-tools.tar.gz", 'time_out': 600, 'checked': True,
         'key': '1. prepare material-1.7. download setup-tools'},
        {'title': '1.8. 解压setup-tools', 'name': '1.8. unzip setup-tools.tar.gz', 'type': 'command', 'time_out': 600,
         'cmd': 'cd ${WORKSPACE_DIR} && tar -zxvf setup-tools.tar.gz -C ./ && rm -rf ${INSTALL_DIR}/tools/* && mv setup-tools/* ${INSTALL_DIR}/tools',
         'checked': True, 'key': '1. prepare material-1.8. unzip setup-tools.tar.gz'}], 'checked': True}}, {
                                                                                 'job': {'title': '2. 安装',
                                                                                         'name': '2. install',
                                                                                         'host': 'MONGO_MASTER', 'tasks': [
                                                                                         {'title': '2.1 初始化检查',
                                                                                          'name': '2.1 pre init check',
                                                                                          'cmd': 'cd ${INSTALL_DIR} && sh bin/pre-init-check.sh',
                                                                                          'type': 'command',
                                                                                          'time_out': 3600,
                                                                                          'checked': True,
                                                                                          'key': '2. install-2.1 pre init check'},
                                                                                         {'title': '2.2. 初始化',
                                                                                          'name': '2.2. init',
                                                                                          'type': 'command',
                                                                                          'cmd': 'cd ${INSTALL_DIR} && sh bin/init.sh',
                                                                                          'time_out': 3600,
                                                                                          'checked': True,
                                                                                          'key': '2. install-2.2. init'},
                                                                                         {
                                                                                             'name': '2.3. pre install check',
                                                                                             'title': '2.3. 安装检查',
                                                                                             'type': 'command',
                                                                                             'cmd': 'cd ${INSTALL_DIR} && sh bin/pre-install-check.sh',
                                                                                             'time_out': 3600,
                                                                                             'checked': True,
                                                                                             'key': '2. install-2.3. pre install check'},
                                                                                         {'title': '2.4 安装',
                                                                                          'name': '2.4 install',
                                                                                          'type': 'command',
                                                                                          'cmd': 'cd ${INSTALL_DIR} && sh bin/install.sh',
                                                                                          'time_out': 36000,
                                                                                          'checked': True,
                                                                                          'key': '2. install-2.4 install'}],
                                                                                         'checked': True}}],
     'host': {'ALL_HOST': [{'ip': '192.168.0.5', 'port': '22', 'user': 'root', 'password': 'TkWV!jUuNTHOHm!8'}],
              'MONGO_MASTER': [{'ip': '192.168.0.5', 'port': '22', 'user': 'root', 'password': 'TkWV!jUuNTHOHm!8'}]},
     'params': {'WORKSPACE_DIR': '/home', 'MATERIAL_FOLDER': 'mongodb-one-deploy-3.6-WiredTiger',
                'MATERIAL_NAME': 'mongodb-one-deploy-3.6-WiredTiger.zip',
                'MATERIAL_URL': 'https://www.tonyandmoney.cn/api/designer//git/v1/downloadRepo?productId=fc34bc0e1e3e4b839435b8d9dc00d598&sha=master',
                'PRODUCT_MATERIALS': [{'key': 'productMaterial_1',
                                       'url': 'http://static.tonyandmoney.cn/assets/materials/mongodb-org-mongos-3.6.23-1.el7.x86_64.rpm',
                                       'name': 'mongodb-org-mongos-3.6.23-1.el7.x86_64.rpm'},
                                      {'key': 'productMaterial62176',
                                       'url': 'http://static.tonyandmoney.cn/assets/materials/mongodb-org-server-3.6.23-1.el7.x86_64.rpm',
                                       'name': 'mongodb-org-server-3.6.23-1.el7.x86_64.rpm'},
                                      {'key': 'productMaterial79416',
                                       'url': 'http://static.tonyandmoney.cn/assets/materials/mongodb-org-shell-3.6.23-1.el7.x86_64.rpm',
                                       'name': 'mongodb-org-shell-3.6.23-1.el7.x86_64.rpm'},
                                      {'key': 'productMaterial80599',
                                       'url': 'http://static.tonyandmoney.cn/assets/materials/mongodb-org-tools-3.6.23-1.el7.x86_64.rpm',
                                       'name': 'mongodb-org-tools-3.6.23-1.el7.x86_64.rpm'}],
                'CONFIG_URL': 'https://material-1252749592.cos.ap-guangzhou.myqcloud.com/product/5b8704360975409a8cb7c6b3c7f27005/plan/mongo_20211201155822.zip?q-sign-algorithm=sha1&q-ak=AKIDaz60dz5uSkmY3HEuJRIrACxSheKjriIa&q-sign-time=1638345548;1638388748&q-key-time=1638345548;1638388748&q-header-list=host&q-url-param-list=&q-signature=9a6e7a2395b5cf7d9c62a5a937f5436b09da6224',
                'INSTALL_DIR': '/home/mongodb-one-deploy-3.6-WiredTiger', 'MATERIAL_IS_ZIP': True,
                'SETUP_TOOLS_URL': 'https://material-1252749592.cos.ap-guangzhou.myqcloud.com/commons/setup-tools.tar.gz?q-sign-algorithm=sha1&q-ak=AKIDaz60dz5uSkmY3HEuJRIrACxSheKjriIa&q-sign-time=1638345549;1638388749&q-key-time=1638345549;1638388749&q-header-list=host&q-url-param-list=&q-signature=13a571672f3e6f0a70ab2010a61794a7bc4969ed'}}


def init_log_info(job_obj):
    log_info = {
        "file_name": str(job_obj["id"]),
        "name": job_obj.get("name"),
        "host": job_obj["host"],
        "INSTALL_DIR": job_obj["params"]["INSTALL_DIR"],
        "1. prepare material": "",
        "2. install": "",
        "3. uninstall": ""
    }

    for i in job_obj.get("jobs"):
        log_info[i["job"]["name"]] = i["job"]["host"]
    return log_info


def write_yaml(file_path, dict_obj):
    with open(file_path, encoding='utf-8',mode='w') as f:
        yaml.dump(data=dict_obj, stream=f, allow_unicode=True)


write_yaml(init_log_info(a)["file_name"], init_log_info(a))


def get_log(id, step):
    with open(id, encoding="utf-8", mode="r") as f1:
        log_info = yaml.load(f1.read(), Loader=yaml.SafeLoader)

    if step == "1. prepare material":
        print("cat nohup")
    else:
        if log_info[step] == "local":
            print("cat %s" % log_info["INSTALL_DIR"])
        else:
            print("ssh %s cat %s" % (log_info["host"][log_info[step]], log_info["INSTALL_DIR"]))


job_id = "1419124095219400704"
start_id = 0
step = "1. prepare material"
step2 = "2. install"

get_log(job_id, step)
get_log(job_id, step2)