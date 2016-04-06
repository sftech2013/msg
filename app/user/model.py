# -*- coding: utf-8 -*-
from datetime import datetime
import bcrypt
from bson import ObjectId

class User(object):

	def __init__(self, _id, username, password, email, admin=0):
		self._id = _id or ObjectId()
		self.username = username
		self.password = bcrypt.hashpw(password, bcrypt.gensalt())
		self.email = email
		self.admin = bool(admin)
		self.registered_on = datetime.utcnow()

	def is_authenticated(self):
		return True

	def is_active(self):
		return True

	def is_anonymous(self):
		return False

	def is_admin(self):
		return self.admin

	def get_id(self):
		return unicode(self._id)

	def __repr__(self):
		return '<User %r>' % (self.username)
		