import os
import json
from os.path import exists, getsize
from urllib.request import Request, urlopen
from urllib.error import HTTPError
import platform

IS_WIN = platform.system().lower() == 'windows'

BUFFER_SIZE = 8 * 1024
BASE_DIR = '/tmp/materials'
if IS_WIN:
    BASE_DIR = 'C://tmp/materials'

if exists(BASE_DIR) is False:
    os.makedirs(BASE_DIR, exist_ok=True)

WORKSPACE = os.getenv('WORKSPACE')
PRODUCT_NAME = os.getenv('PRODUCT_NAME')
FINAL_MATERIAL = "{}/product_materials/".format(WORKSPACE)
print("final material dir: %s" % FINAL_MATERIAL)


def download_file(name: str, url: str, retry=3):
    size = 0
    filename = "{}/{}".format(BASE_DIR, name)
    retry = retry - 1
    if exists(filename):
        size = getsize(filename)
    headers = {'Range': f'bytes={size}-'}
    req = Request(url, headers=headers)
    try:
        with urlopen(req) as fp_web:
            if size > 0:
                print('文件存在但不完整，开始续传.')
            else:
                print("文件不存在，开始下载.")
            with open(filename, 'ab') as fp_local:
                while True:
                    data = fp_web.read(BUFFER_SIZE)
                    if len(data) == 0:
                        break
                    fp_local.write(data)
    except HTTPError as e:
        if e.code == 416:
            print("文件已下载完成")
        else:
            if retry > -1:
                download_file(name, url, --retry)
            else:
                raise e
    return filename


# "[]"
product_materials_json = os.getenv('PRODUCT_MATERIALS')
if product_materials_json is None:
    print("无下载内容..")
else:
    product_materials_json = product_materials_json.lstrip('"')
    product_materials_json = product_materials_json.rstrip('"')
    print("product_materials_json: %s" % product_materials_json)

    product_materials = json.loads(product_materials_json)
    for material in product_materials:
        file = download_file(material.get("name"), material.get("url"), 3)
        if IS_WIN:
            os.system("copy {} {}".format(file, FINAL_MATERIAL))
        else:
            os.system("cp {} {}".format(file, FINAL_MATERIAL))
    print("下载完成.")
