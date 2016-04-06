# -*- coding: utf-8 -*-
from app import app, db, json_util
from flask import json
from socketio.mixins import RoomsMixin, BroadcastMixin
from socketio.namespace import BaseNamespace
import re

from bson.objectid import ObjectId
races = db['races']

class ShoutNamespace(BaseNamespace, RoomsMixin, BroadcastMixin):
    sockets = {}
    rooms = []

    def initialize(self):
        self.logger = app.logger
        # self.log("Socketio session started")

    # Pas de numéro de ligne exploitable, si utilisé message unique pour s'y retrouver
    def log(self, message):
        self.logger.info("[sessid: {0} | id: {1}] {2}".format(self.socket.sessid, id(self), message))

    def recv_connect(self):
        self.log("Got a socket connection")
        self.sockets[id(self)] = self

    def disconnect(self, *args, **kwargs):
        if id(self) in self.sockets:
            self.log("Got a socket disconnection")
            self.broadcast_room(['admin_devices', 'dash'], 'device_disconnected', id(self))
            # FIXME:
            # onunload est très mal interpreté suivant les browsers et on
            # passe à côté de pas mal de leave, donc on déclenche manuellement les events leave
            # if '/shouts_waiting' in self.socket.session['rooms']:
            #     self.broadcast_room(['admin_devices','dash'], 'device_waiting_dec', id(self))

            self.on_leave_all()

            del self.sockets[id(self)]
        super(ShoutNamespace, self).disconnect(*args, **kwargs)

    def on_join(self, room):
        # @INFO: Pour mémoire, il n'y a pas de shouts sur le join. Seul les walls
        # public sont propagés via socketio (join_only)
        self.join(room)
        if room not in self.rooms:
            self.rooms.append(room)


    def on_join_only(self, room):
        if 'rooms' in self.socket.session:
            self.on_leave_all()

        self.join(room)
        if room not in self.rooms:
            self.rooms.append(room)

        # Si room wall public on prévient admin_devices
        reg_play = re.match(r'(play_)([a-f0-9]{24})\b', room)
        if reg_play:
            race = races.find_one({'_id': ObjectId(reg_play.group(2)) })
            ret_obj = {'id': id(self), 'room': room, 'race_id': str(race['_id']), 'race_title': race['title']}
            self.broadcast_room(['admin_devices','dash'], 'join_a_wall', ret_obj )


    def _publish_leave(self, room):
        # Si room wall public on prévient admin_devices
        reg_play = re.match(r'(play_)([a-f0-9]{24})\b', room)
        if reg_play:
            race = races.find_one({'_id': ObjectId(reg_play.group(2)) })
            ret_obj = {'id': id(self), 'room': room, 'race_id': str(race['_id']), 'race_title': race['title']}
            self.broadcast_room(['admin_devices','dash'], 'leave_a_wall', ret_obj )
        elif room == 'waiting':
            ret_obj = {'id': id(self), 'room': room}
            self.broadcast_room(['admin_devices','dash'], 'device_waiting_dec', ret_obj )
        return

    def _test_and_leave(self, room):
        if "/shouts_%s" % room in self.socket.session['rooms']:
            try:
                self.leave(room)
            except Exception, e:
                self.log("Exception lors du leave: %s" % e)
            else:
                # print "leave ok, -> publish"
                self._publish_leave(room)
        return


    def on_leave(self, room):
        if 'rooms' in self.socket.session:
            self._test_and_leave(room)


    def on_leave_all(self):
        """ Leave de toutes les rooms du socket en cours (fermeture du browser par ex) """
        if 'rooms' in self.socket.session:
            groom = self.socket.session['rooms']
            for r in groom.copy():
                self._test_and_leave(r.split('/shouts_')[1])


    # broadcast to all sockets on this channel!
    @classmethod
    def broadcast(cls, event, message):
        for ws in cls.sockets.values():
            ws.emit(event, message)


    # @todo: essayer de faire sans les classmethod
    # https://sourcegraph.com/github.com/abourget/gevent-socketio/symbols/python/examples/flask_chat/chat/ChatNamespace
    @classmethod
    def broadcast_room(cls, rooms, event, message):
        """ Pour chaque socket ouvert, on boucle sur les rooms passées en param
        et si le socket en cours est inscrit à cette room on émet le message """
        
        for ws in cls.sockets.values():
            for room in rooms:
                if "/shouts_%s" % room in ws.session['rooms']:
                    ws.emit(event, message)
                    # print "%s :: %s" % (room, event)
        return True


    def on_bubble_send_open(self, msg):
        rooms = [msg['race_id'], 'play_%s' % msg['race_id']]
        self.broadcast_room(rooms, 'openbubble', msg)
        return True

    def on_bubble_send_destroy(self, race_id):
        rooms = [race_id, 'play_%s' % race_id]
        self.broadcast_room(rooms, 'destroybubble', race_id)
        return True

    def on_waiting(self, msg):
        # print "message on_waiting: %s" % msg
        respObj = {'id': id(self), 'room': 'waiting', 'race_id': '', 'race_title': 'En attente...'}
        self.broadcast_room(['admin_devices','dash'], 'device_waiting_inc', respObj)
        return True

    def on_ping_screen(self, sessid):
        for ws in self.sockets.values():
            # besoin de tester la room ? ptet protéger les admins
            # if "/shouts_waiting" in ws.session['rooms'] and id(ws) == sessid:
            if id(ws) == sessid:
                ws.emit("ping", sessid)
        return True

    def on_send_device_to(self, sessid, url):
        for ws in self.sockets.values():
            # idem que pour ping_screen
            # if "/shouts_waiting" in ws.session['rooms'] and id(ws) == sessid:
            if id(ws) == sessid:
                ws.emit("gotourl", url)
        return True

                