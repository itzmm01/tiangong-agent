# coding=utf-8
import base64
from Crypto.Cipher import AES
from Crypto import Random

ROOT_KEY = "tencentcloud GDC"
ROOT_IV = "tencentcloud  IV"


def generate_key():
    """
    生成秘钥，加密解密时需要传入
    :return:
    """
    random = Random.new().read(AES.block_size)
    return base64.encodestring(__encrypt(random))


def encrypt(plaintext, instance_key):
    """
    加密
    :param plaintext: 需要加密的内容
    :param instance_key: 秘钥键
    :return:
    """
    decrypt_key = __parse_key(instance_key)
    return AES.new(decrypt_key, AES.MODE_CFB, ROOT_IV).encrypt(plaintext)


def decrypt(ciphertext, instance_key):
    """
    解密
    :param ciphertext: 需要加密的内容
    :param instance_key: 秘钥键
    :return:
    """
    decrypt_key = __parse_key(instance_key)
    return AES.new(decrypt_key, AES.MODE_CFB, ROOT_IV).decrypt(ciphertext)


def __encrypt(plaintext):
    """
    根据私钥加密，内部方法，请勿调用
    :param plaintext: 需要加密的内容
    :return:
    """
    return AES.new(ROOT_KEY, AES.MODE_CFB, ROOT_IV).encrypt(plaintext)


def __decrypt(ciphertext):
    """
    根据私钥解密，内部方法，请勿调用
    :param ciphertext: 需要加密的内容
    :return:
    """
    return AES.new(ROOT_KEY, AES.MODE_CFB, ROOT_IV).decrypt(ciphertext)


def __parse_key(instance_key):
    decode_key = base64.decodestring(instance_key)
    return __decrypt(decode_key)


if __name__ == '__main__':
    PASS_WD = "bk@123456"
    INSTANCE_KEY = generate_key()
    ENCRYPT_TXT = encrypt(PASS_WD, INSTANCE_KEY)
    DECRYPT_TXT = decrypt(ENCRYPT_TXT, INSTANCE_KEY)
    print DECRYPT_TXT
