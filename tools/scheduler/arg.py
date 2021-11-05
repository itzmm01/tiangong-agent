import argparse
import sys
parser = argparse.ArgumentParser(description='parse key pairs into a dictionary')

class StoreDictKeyPair(argparse.Action):
     def __call__(self, parser, namespace, values, option_string=None):
         my_dict = {}
         for kv in values.split(","):
             k,v = kv.split("=")
             my_dict[k] = v
         setattr(namespace, self.dest, my_dict)

parser.add_argument("--key_pairs", dest="my_dict", action=StoreDictKeyPair, metavar="KEY1=VAL1,KEY2=VAL2...")

args = parser.parse_args(sys.argv[1:])
print args