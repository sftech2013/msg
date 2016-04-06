# -*- coding: utf-8 -*-
from app import db
import pymongo
from bson.objectid import ObjectId
from datetime import datetime
# import bcrypt
from Crypto.Hash import MD5
import urllib

# on garde pymongo, etc pour le futur setRaces() des Sms
races = db['races']

class Message(object):
	""" 
	Class de base pour les messages 
	- pas de `provider_id` natif pour les `SMS`. Setté à None
	"""
	def __init__(self, message, provider, provider_user_id):
		self.message = message
		self.provider = provider
		self.provider_user_id = provider_user_id
		self.ctime = datetime.utcnow()
		self.races = []
		
	def getFormatedMsg(self):
		return "[%s] %s: %s" % (self.provider, self.getAuthor(), self.message)

	def getAuthor(self):
		return "Anonyme"


class SmsMsg(Message):
	""" Sub Class des Messages 'SMS' """
	def __init__(self, src):
		crypted_author = self.cryptPhone(src['author'])
		msg = self.formatMessage(src['message'])
		Message.__init__(self, msg, "SMS", crypted_author)
		self.grabber = src['grabber']
		self.author = self.getAuthor(src['author'])
		self.races = self.setRaces()

	def getAuthor(self, author):
		return "XXXXXXX%s" % self.provider_user_id[-3:]

	def cryptPhone(self, nbr):
		# return bcrypt.hashpw(nbr, bcrypt.gensalt())
		return MD5.new(nbr).hexdigest()

	def setRaces(self):
		where = {'status': 'started'}
		if self.grabber:
			where['phone_number'] = self.grabber
		return [{'_id': ObjectId(r['_id']), 'visible': r['visible'], 'stared':0 } for r in races.find(where)]

	def formatMessage(self, message):
		return urllib.unquote_plus(message).decode('utf8')


