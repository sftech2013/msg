# -*- coding: utf-8 -*-
import pymongo
import json
from tweepy import StreamListener
from app.socketio_ns import ShoutNamespace
from datetime import datetime
from app import db
from app.twitter.models import Tweet

from flask.ext.restful import marshal
from app.resources.fields import msg_race_flat

messages = db['messages']
dumbers = db['dumbers']
prefs = db['prefs']

def get_prefs():
    p = prefs.find_one()
    prefs_dict = {
        'retweet': p['retweet'],
        'bubble_timeout': p['bubble_timeout']
    }
    return prefs_dict


class Grabber(StreamListener):

	def __init__(self, api=None):
		self.totalcount = 0
		self.startedtime = None
		self.api = api
		self.dumbers = list(dumbers.find({'provider': 'TWITTER'}))
		self.prefs = get_prefs()

	def on_connect(self):
		self.prefs = get_prefs()
		self.startedtime = datetime.utcnow()
		print "on_connect du grabber"
		ShoutNamespace.broadcast('stream-start', {'status': 'started'} )
		return True

	def on_disconnect(self):
		# self.startedtime = datetime.utcnow()
		print "on_disconnect du grabber"
		ShoutNamespace.broadcast('stream-stop', {'status': 'stopped'} )
		return True

	def on_data(self, data):
		self.totalcount += 1
		data = json.loads(data)
		# filtrage des Retweets et Dumbers avant traitement
		# if not self.isFiltered(data):
		if self.isFiltered(data):
			return True     # Pour continuer à écouter
		# la Class Tweet fait office de parser
		tweet = Tweet(data)
		if len(tweet.races):
			tw_dict = tweet.__dict__
			messages.insert( tw_dict )

			for race in tweet.races:
				tw_dict['race'] = race
				tw_dict['status'] = "new"
				mshl_tweet_flat = marshal(tw_dict, msg_race_flat)
				rooms = [race['_id'], "play_%s" % race['_id']]
				ShoutNamespace.broadcast_room(rooms, 'message_to_race', mshl_tweet_flat )
				ShoutNamespace.broadcast_room(["admin_races", str(race['_id'])], 'increment_race', {'race_id': str(race['_id'])} )

			try:
				print "[ %s ] %s: %s" % (self.totalcount, tweet.author.encode('utf-8'), tweet.message.encode('utf-8'))
			except UnicodeDecodeError, e:
				print "[ %s ] ### pb encodage dans le shell" % (self.totalcount)
		else:
			print "~TWEET~ Pas de Race correspondante"

		return True     # Pour continuer à écouter

	def on_status(self, status):
		try:
			print json.loads(status)
		except Exception, e:
			print 'Encountered Exception:', e
			pass
		return True     # Pour continuer à écouter

	def on_error(self, status_code):
	    print('Got an error with status code: ' + str(status_code))
	    ShoutNamespace.broadcast('stream-error', {'status_code': status_code} )
	    return True     # Pour continuer à écouter

	def get_totalcount(self):
		return self.totalcount

	# @todo: devrait passer en méthode de la class Message
	def isFiltered(self, data):
		""" filtrage des messages entrant """
		# Dumbers
		if data['user']['id_str'] in [d['provider_user_id'] for d in self.dumbers]:
			try:
				print u"## Filtrage Dumber: @%s : %s" % (data['user']['screen_name'], data['text'].encode('utf-8'))
			except UnicodeDecodeError, e:
				print u"## Filtrage Dumber: affichage impossible, pb encodage"
			return True
		# Retweet
		if self.prefs['retweet'] or (not self.prefs['retweet'] and 'retweeted_status' not in data):
			pass
		else:
			try:
				print u"## Filtrage Retweet: @%s : %s" % (data['user']['screen_name'].encode('utf-8'), data['text'].encode('utf-8'))
			except UnicodeDecodeError, e:
				print u"## Filtrage Retweet: affichage impossible, pb encodage"
			return True
		return False
