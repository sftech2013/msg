# -*- coding: utf-8 -*-
from flask import Flask
# from pymongo import Connection, database
from pymongo import MongoClient
from bson.objectid import ObjectId
from flask.ext.restful import Api
from flask.ext.restful.utils import cors
import os
import ast
from sessions import ItsdangerousSessionInterface
from output_json import output_json
from flask.ext.themes2 import Themes

app = Flask(__name__)

"""
Configuration
"""

app.config.from_object('init_config')
app.config['ROOT_PATH'] = os.path.dirname(os.path.abspath(__file__))

if os.environ.get('HEROKU') and int(os.environ.get('HEROKU')) == 1:
	# si CONF est setté, on est sur Foreman, on charge les vars du path
	if os.environ.get('CONF') and os.path.isfile(os.environ.get('CONF')):
		app.config.from_envvar('CONF')
	else:
		# sinon le host est Heroku, on charge la config depuis l'environnement
		# for i in ['SECRET_KEY', 'DEBUG', 'DESIGNER', 'PHONE_TOKEN', 'MONGOLAB_URI', 'EMBEDLY_KEY',\
		for i in ['SECRET_KEY', 'DESIGNER', 'DEBUG', 'PHONE_TOKEN', 'MONGOLAB_URI', 'EMBEDLY_KEY', \
					'API_KEY', 'API_SECRET', 'ACCESS_TOKEN', 'ACCESS_TOKEN_SECRET', \
					'S3_BUCKET_NAME', 'S3_BUCKET_DOMAIN', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY']:

			app.config[i] = os.environ.get(i)
		# le SERVER_CONFIG doit sortir, pénible partout ou il se trouve ...
		app.config['SERVER_CONFIG'] = ast.literal_eval(os.environ.get('SERVER_CONFIG'))
else:
	app.config.from_object('config')

app.secret_key = app.config['SECRET_KEY']
app.session_interface = ItsdangerousSessionInterface()

"""
MongoDB
"""

# conn = Connection(app.config['MONGODB_URI'] if 'MONGODB_URI' in app.config else app.config['MONGOLAB_URI'])
conn = MongoClient(app.config['MONGODB_URI'] if 'MONGODB_URI' in app.config else app.config['MONGOLAB_URI'])
dbname = os.path.split(app.config['MONGODB_URI'] if 'MONGODB_URI' in app.config else app.config['MONGOLAB_URI'])[1]
# db = database.Database(conn, dbname)
db = conn[dbname]

prefs = db['prefs']

"""
Init préférences App cliente
"""

# surcharge d'APP_CONFIG avec la clé embedly pour sauvegarde dans resource Prefs
# permet l'ajout / modification par l'utilisateur depuis l'UI
# faire de meme avec la config S3 ?
app.config['APP_CONFIG']['embedly_key'] = app.config['EMBEDLY_KEY']

preferences = prefs.find_one()
if not preferences: 
	prefid = prefs.insert( dict(app.config['APP_CONFIG']) )
	preferences = prefs.find_one({'_id': ObjectId(prefid)})


"""
Themes
"""

DEFAULT_THEME = 'default'

Themes(app, app_identifier="Live Message", theme_url_prefix='/themes')


"""
Twitter
"""

from twitter.service import Twitter
TW_Client = Twitter(config=app.config)


"""
Configuration API Flask-Restful
"""

DEFAULT_REPRESENTATIONS = {'application/json': output_json}

api = Api(app)
api.representations = DEFAULT_REPRESENTATIONS
api.decorators=[cors.crossdomain('*')]

from resources.prefs import Preferences
from resources.message import Msg, MsgList, Sms
from resources.race import Race, RaceList
from resources.dumber import Dumber, DumberList
from resources.theme import ThemeList, Themer, ThemeUpload, ThemeS3, ThemeS3List
# from resources.timeline import Timeline

# @FIXME: les endpoints c juste n'importe quoi ...
api.add_resource(Preferences, 	'/admin/prefs/', endpoint = 'prefs')
api.add_resource(MsgList, 		'/messages/<string:race_id>', endpoint='messages')
api.add_resource(Msg, 			'/message/<string:msg_id>', endpoint='message')
api.add_resource(Sms, 			'/messages/sms/')  	# POST
api.add_resource(RaceList, 		'/races/', endpoint = 'races')
api.add_resource(Race, 			'/races/<string:race_id>', endpoint = 'race')
api.add_resource(Dumber, 		'/dumbers/<string:dmb_id>', endpoint = 'dumber')
api.add_resource(DumberList, 	'/dumbers/', endpoint = 'dumbers')
api.add_resource(ThemeList, 	'/themes/')
api.add_resource(Themer, 		'/theme/<string:identifier>')
api.add_resource(ThemeUpload, 	'/theme/<string:identifier>/upload')
# api.add_resource(ThemeS3, 		'/theme/<string:identifier>/s3')
api.add_resource(ThemeS3, 		'/s3/theme/<string:identifier>')
api.add_resource(ThemeS3List, 	'/s3/themes/')
# api.add_resource(Timeline, 		'/timeline/<string:race_id>', endpoint='timeline')


from twitter.resources import State, Grabber, Me, Status
api.add_resource(State, 		'/twitter/stream/state')
api.add_resource(Grabber, 		'/twitter/stream/<string:action>')
api.add_resource(Me, 			'/twitter/me')
api.add_resource(Status, 		'/twitter/status')


"""
Authentification
init du login manager et du callback load_user avant le 
chargement des blueprints concernés par l'auth
"""

from flask.ext.login import LoginManager
import pymongo
from bson.objectid import ObjectId
from user.model import User

users = db['users']

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'user.login'

@login_manager.user_loader
def load_user(id):
    req = users.find_one({'_id': ObjectId(id)})
    user = User(req['_id'], req['username'], req['password'], req['email'], req['admin'])
    return user



"""
Blueprints
"""

from admin.views import mod as adminModule
app.register_blueprint(adminModule)

from user.views import mod as userModule
app.register_blueprint(userModule)



from app import views
