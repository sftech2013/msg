# -*- coding: utf-8 -*-
import pymongo
from tweepy import OAuthHandler, API, Stream, parsers
import gevent
from app.socketio_ns import ShoutNamespace
from stream import Grabber
from app import db
# import time

races = db['races']

class Twitter(object):
	""" Service Twitter, hub pour le reste de l'app """

	config = None

	def __init__(self, type="hashtag", **kwargs):
		self.config = kwargs['config']

		api_key = self.config['API_KEY']
		api_secret = self.config['API_SECRET']
		access_token = self.config['ACCESS_TOKEN']
		access_secret = self.config['ACCESS_TOKEN_SECRET']
		self.auth = OAuthHandler(api_key, api_secret)
		self.auth.set_access_token(access_token, access_secret)
		self.api = API(self.auth, parser=parsers.JSONParser())

		self.stream_type = type
		# @todo: rien à faire là
		self.hashtag = self.get_active_tag()

		# A part pour explorer en shell ca n'a pas l'air d'etre vraiment utile
		self.grabby = Grabber()
		self.streamer = None
		self.stream = None


	def start_stream(self):
		self.hashtag = self.get_active_tag()
		if len(self.hashtag):
			print "start du stream: %s" % self.get_tag_str().encode('utf-8')
			if not self.streamer:
				self.streamer = Stream(self.auth, self.grabby)
			self.stream = gevent.spawn(self.streamer.filter, follow=None, track=self.hashtag)
		else:
			status_code = u"Pas de hashtag"
			print('Got an error with status code: ' + str(status_code))
			ShoutNamespace.broadcast('stream-error', {'status_code': status_code} )
			return
		return self.stream.started
		

	def restart_stream(self):
		# @verif: bon ordre d'execution ? tester kill du Greenlet en 1er, puis déconnexion du Stream() ?
		# normalement suite au disconnect le Stream.filter doit être stoppé en premier,
		# verifier si le socket event est bien géré pour confirmer
		self.streamer.disconnect()
		self.stream.kill()
		return self.start_stream()

	def stop_stream(self):
		if self.get_stream_started():
			self.streamer.disconnect()
			self.stream.kill()
			ShoutNamespace.broadcast('stream-stop', {'status': 'stopped'} )
			return True
		return False


	def get_stream_started(self):
		if self.stream:
			return self.stream.started
		else:
			return False

	def get_stream_state(self):
		status = 'started' if self.get_stream_started() else 'stopped'
		state = {
			"status": status,
			"hashtag": self.get_active_tag(),
			"count_msg": self.grabby.get_totalcount(),
			"startedtime": self.grabby.startedtime
		}
		return state

	def get_active_tag(self):
		hashtag = []
		for race in list( races.find({"status": "started"}) ):
			laststep = race['steps']
			for tag in laststep[-1]['hashtag']:
				hashtag.append(tag)
		return hashtag

	def get_tag_str(self):
		return unicode( ",".join(self.hashtag) )
