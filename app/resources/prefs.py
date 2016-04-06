# -*- coding: utf-8 -*-
from flask import current_app
from flask.ext.restful import Resource, fields, reqparse, marshal
import pymongo
from bson.objectid import ObjectId
from app.socketio_ns import ShoutNamespace
from app import db

prefs = db['prefs']

######################################### INPUT

def uni(txt):
    txt = txt.encode('utf-8')
    return txt

def unicoder(txt):
    txt = unicode(txt)
    return txt

prefs_parser = reqparse.RequestParser()
prefs_parser.add_argument('title', type=uni, location = 'json')
prefs_parser.add_argument('desc', type=unicoder, location = 'json')
prefs_parser.add_argument('msg_pause', type=unicoder, location = 'json')
prefs_parser.add_argument('retweet', type=bool, location = 'json')
prefs_parser.add_argument('bubble_timeout', type=int, location = 'json')
prefs_parser.add_argument('embedly_key', type=str, location = 'json')


######################################### OUTPUT

class ObjId(fields.Raw):
    def format(self, value):
        return str( value )

resource_fields = {
	'_id': ObjId(attribute='_id'),
	'title': fields.String(default='Live Message'),
	'desc': fields.String,
	'msg_pause': fields.String,
	'retweet': fields.Boolean(default=True),
	'bubble_timeout': fields.Integer(default=8),
	'embedly_key': fields.String,
	'modal': fields.String(default='large'),
	# 'autostart_stream': fields.Boolean(default=False), 		# mouaich ...
}

def set_get_prefs():
	preferences = prefs.find_one()
	if not preferences:
		app_config = dict(current_app.config['APP_CONFIG'])
		prefid = prefs.insert(app_config)
		preferences = prefs.find_one({'_id': ObjectId(prefid)})
	return preferences

######################################### Resource Prefs

class Preferences(Resource):

	def get(self):
		preferences = set_get_prefs()
		return marshal(preferences, resource_fields)

	def patch(self):
		
		# @FIXME: protéger au moins la méthode PATCH
		preferences = prefs.find_one()
		args = prefs_parser.parse_args()
		for k, v in args.items():
			# On élimine tous les args à 'None' ou identique au model pour ne pas écraser les fields non concernés
			if args[k] == None or args[k] == preferences[k]:
				args.pop(k)

		for k, v in args.items():
			print k
			preferences[k] = v
			# ShoutNamespace.broadcast_room(['dash'], 'prefs_updated', {k: v})
			ShoutNamespace.broadcast('prefs_updated', {k: v})

		prefs.save(preferences)
		return marshal(preferences, resource_fields), 200
		



