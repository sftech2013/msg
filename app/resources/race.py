# -*- coding: utf-8 -*-
from flask.ext.restful import reqparse, abort, Resource, fields, marshal
from app.views import login_required
import pymongo
from bson.objectid import ObjectId
from app.socketio_ns import ShoutNamespace
from app import app, db
from datetime import datetime
import re

from app.resources.message import MsgList

race_default = app.config['PUBLIC_CONFIG']

races = db['races']
messages = db['messages']
dumbers = db['dumbers']

def get_race_or_abort(race_id):
    race = races.find_one({'_id': ObjectId(race_id)})
    if not race:
        abort(404, message="Race {} doesn't exist".format(race_id))
    return race


############################### Custom output fields 


class ObjId(fields.Raw):
    def format(self, value):
        return str( value )

class hashtagList(fields.Raw):
    def format(self, steps):
        return steps[-1]['hashtag']

class hashtagString(fields.Raw):
    def format(self, steps):
        last = steps[-1]['hashtag']
        return unicode( ", ".join( last ) )

class countMessages(fields.Integer):
	def format(self, race_id):
		dmbs = list(dumbers.find())
		cnt = messages.find( { 'races._id': race_id, 'provider_user_id': { '$nin': [d['provider_user_id'] for d in dmbs]} } ).count()
		return cnt

class countDevices(fields.Raw):
	def format(self, race_id):
		cpt = 0
		for ws in ShoutNamespace.sockets.values():
			for room in ws.session['rooms']:
				if room == "/shouts_play_%s" % race_id:
					cpt += 1
		return cpt

############################### Resource fields


resource_fields = {
    '_id': ObjId(attribute='_id'),
    'title': fields.String,
    'hashtag_str': hashtagString(attribute='steps'),
    'hashtag_list': hashtagList(attribute='steps'),
    'started': fields.Raw,
    'status': fields.String,			# remplacer 'status' [started|stopped] par 'started' Bool
    'phone_number': fields.String,
    'desc': fields.String,
    'theme': fields.String,
    # 'ctime': fields.Raw,				# intéressant mais à écarter pour socketio
    'visible': fields.Integer,
    'order': fields.Integer,
    '_count': countMessages(attribute='_id'),
    '_devices': countDevices(attribute='_id')
}


############################### Custom Inputs types


def step(hashtag_str):
	""" filtrage des 'tags' vide """
	step = {'hashtag': filter(bool, [ tag.strip() for tag in hashtag_str.split(',') if hashtag_str ]),
			'ctime': datetime.utcnow()}
	return step

def wherestr(clause):
	# Hum...
	return eval(clause,{},{})

def strtolist(strtl):
	return strtl.split(',')

def strtolistid(strtl):
	return [ ObjectId(i) for i in strtl.split(',') ]

# def dt(ctime):
# 	if ctime == None:



############################### Parser

# agaçants ces 2 types custom ...
def uni(txt):
    txt = txt.encode('utf-8')
    return txt

def unicoder(txt):
    txt = unicode(txt)
    return txt

get_parser = reqparse.RequestParser()
get_parser.add_argument('where', type= wherestr, default={}, location="args")
get_parser.add_argument('_filter_status', type=strtolist, default="", location="args")
get_parser.add_argument('_filter_bundle', type=strtolistid, default="", location="args")

ppp_parser = reqparse.RequestParser()
ppp_parser.add_argument('visible', type=int, location = 'json')
# ppp_parser.add_argument('title', type=str, location = 'json')
# ppp_parser.add_argument('title', type=unicoder, location = 'json')
ppp_parser.add_argument('title', type=uni, location = 'json')
ppp_parser.add_argument('hashtag', type=step, dest="steps", location = 'json')
ppp_parser.add_argument('status', type=str, location = 'json')
ppp_parser.add_argument('phone_number', type=str, location = 'json')
ppp_parser.add_argument('theme', type=str, location = 'json')
ppp_parser.add_argument('order', type=int, location = 'json')
# ppp_parser.add_argument('desc', type=str, location = 'json')
ppp_parser.add_argument('desc', type=uni, location = 'json')

############################### Race

class Race(Resource):
	""" Class de base des collections de Messages """
	# decorators = [login_required]

	def get(self, race_id):
	    race = get_race_or_abort(race_id)
	    return marshal(race, resource_fields), 200

	@login_required
	def delete(self, race_id):
	    race = get_race_or_abort(race_id)
	    msglist = MsgList()
	    msgs = msglist.delete(race_id)
	    races.remove({'_id': ObjectId(race_id)})
	    return '', 204

	@login_required
	def patch(self, race_id):
		args = ppp_parser.parse_args()
		# @todo: endpoint dédié pour les steps (à venir: userstream, visible?, status/started, phone_numer/grabber_id)
		if 'steps' in args and args['steps'] != None:
			race = get_race_or_abort(race_id)
			if race['steps'][-1]['hashtag'] != args['steps']['hashtag']:
				race['steps'].append(args['steps'])
				args['steps'] = race['steps']
			else:
				args.pop('steps')

		for k, v in args.items():
			# On élimine tous les args à 'None' pour ne pas écraser les fields non concernés
			if args[k] == None:
				args.pop(k)

		race = races.find_and_modify(query={"_id": ObjectId(race_id)}, update={"$set": args}, new=True)
		
		marshaled = marshal(race, resource_fields)
		shout_rooms = ["dash", str(race_id), 'play_%s' % race_id]
		ShoutNamespace.broadcast_room(shout_rooms, 'race_updated', {'race': marshaled } )
		return marshaled, 200



############################### RaceListApi


class RaceList(Resource):
	""" Class de base des collections de Messages """
	decorators = [login_required]
	
	def __init__(self, **kwargs):
		# parser spécifique POST
		self.reqparse = reqparse.RequestParser()
		self.reqparse.add_argument('title', type = unicoder, required = True, help = race_default['title'], location = 'json')
		self.reqparse.add_argument('desc', type=unicoder, required=True, default=race_default['desc'])
		self.reqparse.add_argument('status', type=str)
		self.reqparse.add_argument('started', type=bool, default = True, location = 'json')
		# au POST on init une liste en faisant un 'append',au PATCH non
		self.reqparse.add_argument('hashtag', type=step, dest="steps", action='append', help='Vous devez ajouter au moins un #hashtag')
		self.reqparse.add_argument('phone_number', type=str)
		self.reqparse.add_argument('visible', type=int, default=1)
		self.reqparse.add_argument('theme', type=str, default='default')
		self.reqparse.add_argument('order', type=int)
		self.reqparse.add_argument('ctime', type=datetime, default=datetime.utcnow())
		super(RaceList, self).__init__()

	def get(self):
		args = get_parser.parse_args()
		where = {}
		if args['where']:
			where = args['where']
		elif args['_filter_status']:
			where['status'] = { '$in': args['_filter_status'] }
		elif args['_filter_bundle']:
			where['_id'] = { '$in': args['_filter_bundle'] }

		list_races = list(races.find(where).sort("status", pymongo.ASCENDING))
							
		return [ marshal(r, resource_fields) for r in list_races]

	def post(self):
		args = self.reqparse.parse_args()
		args['_id'] = str( races.insert(args) )
		race = get_race_or_abort(args['_id'])
		marshaled = marshal(race, resource_fields)
		ShoutNamespace.broadcast_room(["dash"], 'new_race', marshaled )
		return marshaled, 201



