# -*- coding: utf-8 -*-
from flask import current_app
from flask.ext.restful import abort, Resource, fields, marshal, marshal_with
from app.views import login_required
from flask.ext.login import current_user
import pymongo
from bson.objectid import ObjectId
from app.socketio_ns import ShoutNamespace
from app import db
from datetime import datetime
import bcrypt

from app.resources.fields import msg_race_flat
from app.resources.parsers import parser_msg_base, parser_sms_post

messages = db['messages']
races = db['races']
dumbers = db['dumbers']


class ObjId(fields.Raw):
    def format(self, value):
        return str( value )

class formatDate(fields.DateTime):
    def format(self, value):
        return value.strftime("%Y-%m-%dT%H:%M:%SZ")

resource_fields = {
    '_id': ObjId(attribute='_id'),
    'provider': fields.String,
    'provider_id': fields.String,
    'provider_user_id': fields.String, # euh, on se fatiguerait pas pour rien avec un format spécial ailleurs ?
    'author': fields.String,
    'message': fields.String,
    # 'ctime': fields.DateTime,
    'ctime': formatDate(),
    'avatar': fields.String,
    'links': fields.Raw,
    'url_entities': fields.Raw,
    'medias': fields.Raw,
    # listes des Races du msg
    'races': fields.Raw,
    # '_src': fields.Raw,
}

def get_msg_or_abort(msg_id):
    msg = messages.find_one({'_id': ObjectId(msg_id)})
    if not msg:
        abort(404, message="Message {} doesn't exist".format(msg_id))
    return msg

def get_race(race_id):
    return races.find_one({'_id': ObjectId(race_id)})


def get_bundle_race(races,race_id):
    return [race for race in races if str(race['_id']) == race_id][0]


class Msg(Resource):
    decorators = [login_required]

    @marshal_with(resource_fields)
    def get(self, msg_id):
        msg = get_msg_or_abort(msg_id)
        return msg

    @login_required
    def delete(self, msg_id):
        msg = get_msg_or_abort(msg_id)
        messages.remove({'_id': ObjectId(msg_id)})
        return '', 204

    @login_required
    @marshal_with(msg_race_flat)
    def put(self, msg_id):
        args = parser_msg_base.parse_args()
        msg = get_msg_or_abort(msg_id)
        # race_id pourrait etre un argument requis du parser
        msg_race_bundle = get_bundle_race(msg['races'], args['race_id'])

        if args['_modified_field']:
            # setting de 'races', cas réellement traités: 'visible' et 'stared'
            msg_race_bundle[ args['_modified_field'] ] = args[ args['_modified_field'] ]
        else:
            # traitement des links embedlyfié côté client (twitter seul actuellement)
            # @todo: passer '_modified_field'='links' dans le PUT client
            args['_modified_field'] = 'links'       # crade, pour l'event socketio
            msg['links'] = args['links']

        messages.save(msg)

        msg['race'] = msg_race_bundle

        shout_rooms = [str(args['race_id']), 'play_%s' % str(args['race_id'])]
        msg_marshaled = marshal(msg, msg_race_flat)
        ShoutNamespace.broadcast_room(shout_rooms, args['_modified_field'], msg_marshaled )
        return msg, 201



class MsgList(Resource):

    # @login_required
    # resource non protégé. mais il faudra obfsuquer le 'field' message en fonction de l'auth
    def get(self, race_id):
        messages.ensure_index([("races._id", pymongo.ASCENDING), ("ctime", pymongo.DESCENDING)])
        dumbers.ensure_index([("provider_user_id", pymongo.ASCENDING)])
        args = parser_msg_base.parse_args()

        dmbs = list(dumbers.find())
        # n° des SMS chiffré avec bcrypt.gensalt() :
        # plus moyen de filtrer les SMS pré-bannissement, ne marche que pour Twitter
        where = {'races._id': ObjectId(race_id), 'provider_user_id': { '$nin': [d['provider_user_id'] for d in dmbs]} }
        if args['_filter_stared'] == 1:
            where['races.stared'] = 1
            
        if args['_last_ctime']:
            where['ctime'] = {"$lt": args['_last_ctime']}

        msgs = list(messages.find(where, {'_src': False}).sort("ctime", pymongo.DESCENDING).limit(20))
        # msgs = list(messages.find(where, {'_src': False}).sort("ctime", pymongo.DESCENDING).limit(50))

        for msg in msgs:
            msg['race'] = [race for race in msg['races'] if str(race['_id']) == race_id][0]

            if msg['provider'] == "SMS" and current_user.is_authenticated() == False:
                msg['provider_user_id'] = "xxx"
                msg['author'] = "SMS"

        return marshal(msgs, msg_race_flat), 200

    @login_required
    def delete(self, race_id):
        """
        Suppression de tous les messages d'une Race
        On ne supprime pas les messages directement mais la référence à la Race en cours dans la liste 'races' des messages
        Si le message ne dépend que de la Race alors il est vraiment supprimé
        """
        msgs = list(messages.find({'races._id': ObjectId(race_id)}))
        for m in msgs:
            if len(m['races']) > 1:
                m['races'] = [r for r in m['races'] if str(r['_id']) != race_id]
                msg = messages.find_and_modify(query={"_id": m['_id']}, update={"$set": {"races": m['races'] }}, new=True)

                for r in m['races']:
                    # On propage la suppression du message dans ses propres Races encore référencées.
                    # Pas de traitement pour les messages de la Race en cours de suppression qui aura son propre event
                    shout_rooms = [race_id, 'play_%s' % race_id]
                    msg_marshaled = marshal(msg, msg_race_flat)
                    ShoutNamespace.broadcast_room(shout_rooms, "races_modified", msg_marshaled )

            else:
                messages.remove({'_id': m['_id']})

        return {'removed': len(msgs)}




def is_dumber(provider_user_id):
    # A surveiller de près, probable que cela ralentisse serieusement l'appli
    # si beaucoup de Sms postés et bcp de Dumbers en base...
    # @todo: toujours sur bcrypt, à tester
    for d in list(dumbers.find({'provider': 'SMS'})):
        if bcrypt.hashpw(provider_user_id, d['provider_user_id']) == d['provider_user_id']:
            return d
    return False


from app.models import SmsMsg

class Sms(Resource):

    def post(self):
        args = parser_sms_post.parse_args()
        # filtrage du 'spam' (sans le tag d'un grabber officiel) et des Dumbers
        if args['tag'] != current_app.config['PHONE_TOKEN'] or is_dumber(args['author']):
            print "SMS filtered"
            return True

        sms = SmsMsg(args)
        if len(sms.races):
            sms_dict = sms.__dict__
            messages.insert(sms_dict)

            for race in iter(sms.races):
                race_id = str(race['_id'])
                sms_dict['race'] = race
                sms_dict['status'] = "new"
                formated_msg = marshal(sms_dict, msg_race_flat)
                ShoutNamespace.broadcast_room(["admin_races", race_id], 'increment_race', {'race_id': race_id} )
                ShoutNamespace.broadcast_room([race_id, 'play_%s' % race_id], 'message_to_race', formated_msg )
        else:
            print "~SMS~ Pas de Race correspondante"
        return True
