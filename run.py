#!/usr/bin/env python
# coding: utf-8
'''
Live: lanceur
'''

from app import app
from gevent import monkey
from socketio.server import SocketIOServer
monkey.patch_all()

import logging

if __name__ == "__main__":
    from argparse import ArgumentParser
    parser = ArgumentParser(description='Lanceur pour Live')

    parser.add_argument('-l', '--log-level', default='ERROR',
                        help='Log level : CRITICAL, ERROR, WARNING, INFO, DEBUG')

    parser.add_argument('-b', '--bind', default='127.0.0.1', help='Bind address')
    parser.add_argument('-p', '--port', default=8080, help='Port')

    args = parser.parse_args()
    logging.basicConfig(level=args.log_level.upper())

    app.debug = True
    # @FIXME: toujours besoin ???
    app.server_args = {"host": args.bind, "port": args.port, "log": args.log_level}

    print "Live is running... http://{}:{}".format(args.bind, args.port)
    server = SocketIOServer((args.bind, args.port), app, resource="socket.io")
    server.serve_forever()

