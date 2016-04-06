# -*- coding: utf-8 -*-
from flask.ext.restful import reqparse, abort, Resource, fields, marshal
from app.views import login_required
from app import app, db, TW_Client
import json

def uni(txt):
    txt = txt.encode('utf-8')
    return txt

resource_state_fields = {
	'status': fields.String,
	'startedtime': fields.DateTime,
	'hashtag': fields.Raw,
	'count_msg': fields.Integer,
	'error': fields.String
}

class State(Resource):
	
	def get(self):
		state = TW_Client.get_stream_state()
		return marshal(state, resource_state_fields), 200

class Grabber(Resource):

	@login_required
	def post(self,action):
		# le hash retourné par get_stream_state() est à récupérer par les clients en asynchrone.
		# ici pour le start on se retrouve avec le startedtime de la session précédente, non mis à jour, et le
		# status encore sur 'stopped' ... Ne sert donc à rien ...
		# @todo: ne retourner que {'error': 'xxx'} avec côté client le listener sur stream:start, ou au besoin,
		# un callback avec un appel sur la resource State en GET
		error = None
		if action:
			if action == "start" and not TW_Client.get_stream_started():
				TW_Client.start_stream()
			elif action == "start" and TW_Client.get_stream_started():
				TW_Client.restart_stream()
			elif action == "stop" and TW_Client.get_stream_started():
				TW_Client.stop_stream()
			else:
				error = u'{}: action non reconnue ou déjà en cours'.format(action)
			resp = TW_Client.get_stream_state()
			resp['error'] = error if error else None				
			return marshal(resp, resource_state_fields), 200
		resp = TW_Client.get_stream_state()
		resp['error'] = 'action undefined'
		return marshal(resp, resource_state_fields), 200


class Me(Resource):

	# @login_required
	# non, à cause des vieux template et views /wall/twitter et /wall/timeline, (à surveiller)
	def get(self):
		me = TW_Client.api.me()
		return me

parse_status = reqparse.RequestParser()
parse_status.add_argument('status', type=str, required=True)

class Status(Resource):

	def post(self):
		args = parse_status.parse_args()
		TW_Client.api.update_status(status=args['status'])
		return "ok"
