# -*- coding: utf-8 -*-
from app import db
from app.models import Message
import pymongo
from bson.objectid import ObjectId
from datetime import datetime
import time
from time import mktime

races = db['races']

class Tweet(Message):
	""" Sub Class des Messages 'TWITTER' """
	def __init__(self, src):
		Message.__init__(self, src['text'], "TWITTER", src['user']['id_str'] )
		# des setters font référence à self._src, c'est embetant...
		self._src = src
		self.provider_id = src['id_str']
		self.message = self.formatMessage(src)
		self.author = src['user']['screen_name']
		self.avatar = src['user']['profile_image_url']
		self.url_entities = src['entities']['urls'] 	# pourrait etre 'entities' 
		self.links = self.setLinks()
		self.medias = self.setMedias(src['entities'])
		self.races = self.setRaces()
		self.ctime = self.makeDate(src['created_at'])

	def makeDate(self, created_at):
		tst = time.strptime(created_at,'%a %b %d %H:%M:%S +0000 %Y')
		dt = datetime.fromtimestamp(mktime(tst))
		return dt

	def setRaces(self):
		tweet_tag_list = [h['text'].lower() for h in self._src['entities']['hashtags']]
		races_list = list()
		# @todo: se passer de cette requete dans le model
		for race in races.find({'status': 'started'}):
		    itsok = False
		    for tag in race['steps'][-1]['hashtag']:
		        if tag[:1] == '#':
		            if tag[1:].lower() in tweet_tag_list:
		                itsok = True
		        elif tag.lower() in self.message.lower():
		            itsok = True

		    if itsok:
		        races_list.append({'_id': ObjectId(race['_id']), 'visible': race['visible'], 'stared': 0 })
		return races_list

	def formatMessage(self,src):
		# @todo: peut être ici qu'il faudrait traiter l'auto_link twitter (pour remplacer le traitement client)
		message = src['text']
		if 'retweeted_status' in src:
		    message = "RT @%s: %s" % (src['retweeted_status']['user']['screen_name'], src['retweeted_status']['text'])
		return message

	def setLinks(self):
		""" Traitement des liens """
		links = [
			{"type": "link", "url": url['url'], "expanded_url": url['expanded_url']} 
			for url in self.url_entities
		]
		return links

	def setMedias(self, src):
		""" Traitement des médias """
		medias = ""
		# if 'entities' in data and 'media' in data['entities']:
		if 'media' in src:
		    medias = []
		    for media in src['media']:
		        # Récup de la plus petite taille d'image disponible
		        # Ca pique un peu les yeux...
		        sizes = media['sizes']
		        th = 'medium' if 'medium' in sizes else ''
		        th = 'small' if 'small' in sizes else th
		        th = 'thumb' if 'thumb' in sizes else th

		        big = 'medium' if 'medium' in sizes else ''
		        big = 'large' if 'large' in sizes else big
		        big_sizes = {'w': sizes[big]['w'], 'h': sizes[big]['h']}

		        medias.append({"type": media['type'], "url": media['url'], "media_url": media['media_url'], 
		            "thumb_urlparam": th, "big_urlparam": big, "big_sizes": big_sizes})

		return medias

