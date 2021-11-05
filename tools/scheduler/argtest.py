import argparse


def parse():
    parser = argparse.ArgumentParser(description='Optional arguments for scheduler running.')
    parser.add_argument('-c', dest='job_conf', type=str, help='<job file>  job yaml config file')
    parser.add_argument('-i', dest='host_conf', type=str, help='<host file>  host yaml config file')
    parser.add_argument('-p', dest='param_conf', type=str, help='<param file> optional, param yaml config file')
    parser.add_argument('-qi', dest='query_ips', type=str, nargs="*",
                        help='y/n  optional, whether send setup-tools file or not. default is n')
    parser.add_argument('-g', dest='global_param', action=ParseArgs, metavar="KEY=VAL",
                        help='<job file>  job yaml config file')
    parser.add_argument("-sh", action='append', type=str, dest='send_host')
    parser.add_argument("-pr", type=Tools.str2bool, dest='print_result', default=True)
    parser.add_argument("-rc", type=Tools.str2bool, dest='rc', default=True)
    parser.add_argument("-j", type=str, dest='job', default="")
    parser.add_argument('-sm', dest='out_mode', type=str, help='<scp mode> scp file in or out. default is out')
    return parser.parse_args()


class ParseArgs(argparse.Action):
    inner_dict = {}

    def __call__(self, parser, namespace, values, option_string=None):
        k, v = values.split("=")
        ParseArgs.inner_dict.update({k: v})
        setattr(namespace, self.dest, ParseArgs.inner_dict)


class Tools(object):
    @staticmethod
    def str2bool(v1):
        if isinstance(v1, bool):
            return v1
        if v1.upper() in ('YES', 'TRUE', 'T', 'Y', '1'):
            return True
        elif v1.upper() in ('NO', 'FALSE', 'F', 'N', '0'):
            return False
        else:
            raise argparse.ArgumentTypeError('Boolean value expected.')


def load():
    import io
    import yaml
    _path = r"C:\Users\Administrator\Desktop\1.yml"
    with io.open(_path, 'r', encoding='utf-8') as file_name:
        file_data = yaml.load(file_name, Loader=yaml.SafeLoader)
    return file_data or {}


if __name__ == '__main__':
    # print(load())
    args = parse()
    print(args.job_conf)
    print(args.host_conf)
    print(args.param_conf)
    print(args.query_ips)
    print(args.global_param)
    print(args.print_result)
    print(args.rc)
    print(args.job)
    print("ssss: %s" % args.out_mode)
    GLOBAL_PARAM = {"aaa": "kkk"}
    if args.global_param:
        GLOBAL_PARAM.update(args.global_param)
    print(GLOBAL_PARAM)
    print(args.send_host)