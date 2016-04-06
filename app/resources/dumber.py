# -*- coding: utf-8 -*-
from flask import json
from flask.ext.restful import reqparse, abort, Resource, fields, marshal, marshal_with
from app.views import login_required
import pymongo
from bson.objectid import ObjectId
from app.socketio_ns import ShoutNamespace
from app import app, db, TW_Client
from app import json_util
from datetime import datetime
# from app.resources.message import is_dumber

dumbers = db['dumbers']

json_dump = lambda data: json.dumps(data, default=json_util.default)

parser = reqparse.RequestParser()
parser.add_argument('provider', type=str, choices=['SMS','TWITTER'], required=True)
parser.add_argument('provider_user_id', type=str, required=True)


class ObjId(fields.Raw):
    def format(self, value):
        return str( value )

class FakePhone(fields.String):
	def format(self, value):
		return "XXXXXX%s" % value[-4:]

resource_fields_twitter = {
	'_id': ObjId(attribute='_id'),
	'provider': fields.String(default='TWITTER'),
	# 'provider_id': fields.Integer,
	'provider_user_id': fields.String,
	'author': fields.String(attribute='provider_src.screen_name'),
	'avatar': fields.String(attribute='provider_src.profile_image_url'),
	'provider_src': fields.Raw
}

resource_fields_sms = {
	'_id': ObjId(attribute='_id'),
	'provider': fields.String(default='SMS'),
	'provider_user_id': fields.String,
	# 'author': FakePhone(attribute='provider_user_id'),
	'author': fields.String(attribute='provider_user_id'),
	# le path, en config ? theme du live ?
	'avatar': fields.String(default='/static/img/avatar_default_sms.png'),
}


def get_dumber_or_abort(dmb_id):
	dmb = dumbers.find_one({'_id': ObjectId(dmb_id)})
	if not dmb:
		abort(404, message="Dumber {} doesn't exist".format(dmb_id))
	return dmb

def get_dumber_by_provider_id(provider_user_id, provider):
	if provider == 'SMS':
		# il n'y a qu'au post du SMS que l'on peut tester si dumber ou pas (provider_user_id est hashé après l'enregistrement)
		# dmb = is_dumber(provider_user_id)
		dmb = None
	else:
		dmb = dumbers.find_one({'provider_user_id': provider_user_id, 'provider': 'TWITTER'})
	if dmb:
		return dmb
	return False

class Dumber(Resource):
	decorators = [login_required]

	def get(self, dmb_id):
		dmb = get_dumber_or_abort(dmb_id)
		dumb = json.loads(json_dump(dmb))
		if dmb['provider'] == 'TWITTER':
			return marshal(dumb, resource_fields_twitter), 200
		elif dmb['provider'] == 'SMS':
			return marshal(dumb, resource_fields_sms), 200

	def delete(self, dmb_id):
		dmb = get_dumber_or_abort(dmb_id)
		# coté client, on refetch les races, le provider_user_id pas utilisé (tant mieux...)
		ShoutNamespace.broadcast('dumber_removed', {'provider_user_id': dmb['provider_user_id']} )
		dumbers.remove({'_id': ObjectId(dmb_id)})
		return {}, 204


class DumberList(Resource):
	decorators = [login_required]
	
	def get(self):
		dmbs = list(dumbers.find())
		dumbs = json.loads(json_dump( dmbs ))
		ret_dmbs = []
		for d in dumbs:
			if d['provider'] == 'TWITTER':
				ret_dmbs.append( marshal(d, resource_fields_twitter) )
			elif d['provider'] == 'SMS':
				ret_dmbs.append( marshal(d, resource_fields_sms) )
		return ret_dmbs

	def post(self):
		args = parser.parse_args()
		# FIXME ou pas
		# Lorsqu'on bann un auteur de SMS, le provider_user_id dans les args est fatalement déjà hashé
		# donc ce test ne peut pas marcher ...
		# conséquence: pas de masquage des messages postés avant le bannissement, il n'y a qu'au post du SMS
		# que l'on peut tester si dumber ou pas
		isindb = get_dumber_by_provider_id(args['provider_user_id'], args['provider'])
		if not isindb:
			if args['provider'] == 'TWITTER':
				twuser = TW_Client.api.get_user(args['provider_user_id'], include_entities=1)
				args['provider_src'] = twuser
				args['provider_user_id'] = twuser['id_str']
			# elif args['provider'] == 'SMS':
				# args['author'] = 'SMS'
				# args['provider_id'] = args['id']

			dmb_id = dumbers.insert(args)

			ShoutNamespace.broadcast('dumber_added', {'provider_user_id': args['provider_user_id']} )
			

			if args['provider'] == 'TWITTER':
				return marshal(args, resource_fields_twitter), 200
			elif args['provider'] == 'SMS':
				return marshal(args, resource_fields_sms), 200

		return
