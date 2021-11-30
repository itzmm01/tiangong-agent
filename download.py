import os
import json
from os.path import exists, getsize
from urllib.request import Request, urlopen
from urllib.error import HTTPError

BUFFER_SIZE = 8 * 1024


def download_file(name: str, url: str, retry=3):
    size = 0
    filename = "/tmp/materials/%s" % name
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
                    fp_local.write(data)
    except HTTPError as e:
        if e.code == 416:
            print("文件已下载完成")
        else:
            download_file(name, url, --retry)

# "[]"
product_materials_json = os.getenv('PRODUCT_MATERIALS')
if product_materials_json is None:
    print("无下载内容..")
else:
    product_materials_json = product_materials_json.lstrip("\"")
    product_materials_json = product_materials_json.rstrip("\"")
    print("product_materials_json: %s" % product_materials_json)

    product_materials = json.loads(product_materials_json)
    for material in product_materials:
        download_file(material.get("url"), material.get("name"), 3)
    print("下载完成.")
