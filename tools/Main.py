import yaml
import io

_path = r"D:\work\code\1.3fork\setup-tools\test.yml"
with io.open(_path, 'r', encoding='utf-8') as file_name:
    file_data = yaml.load(file_name, Loader=yaml.SafeLoader)
    print(type(file_data["no-host"]))