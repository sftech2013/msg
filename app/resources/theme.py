# -*- coding: utf-8 -*-
import os
import subprocess
from flask import current_app, json, redirect
from flask.ext.restful import abort, Resource, fields, marshal
from flask.ext.themes2 import get_theme, get_themes_list, static_file_url
from flask.ext.login import current_user
import pymongo
from fabric.api import local
from app import app, db, TW_Client
from app.socketio_ns import ShoutNamespace
from app.resources.fields import theme_info_fields
from app.resources.parsers import parser_theme, parser_theme_options, parser_theme_styles, \
						parser_theme_preview, parser_upload, parser_theme_logo, parser_s3
from app.views import login_required
from app.helpers import slugify
from tweepy import TweepError

from gevent import Greenlet

races = db['races']

def get_all_themes():
	themes = get_themes_list()
	return themes

def write_json_file(info,path):
	local('touch %s/info.json' % path)
	# FIXME
	# Si ensure_ascii=False, ok pour werkzeug et Gunicorn mais plante Foreman (et ptet aussi Supervisor, comme pour les accents du Stream)
	# Si ensure_ascii=True, ok pour Foreman mais évidement encodage dégueu du fichier info.json ...
	# ptet un bug similaire de Fabric: <https://github.com/fabric/fabric/issues/815>
	# local("echo '%s' > %s" % (json.dumps(info, indent=4, ensure_ascii=False), "%s/info.json" % theme.path) )

	with open("%s/info.json" % path, 'w') as f:
		json.dump(info, f, indent=4, ensure_ascii=True)
	f.closed

	return info

def write_less_file(styles,theme):
	# @todo: dissocier l'écriture du fichier variables.less de la compilation des fichiers less
	pathfile = os.path.join(theme.path, 'less/variables.less')
	local('touch %s' % pathfile)
	css_vars = "\n".join(["@%s: %s;" % (k,v) for k,v in styles.items()])
	local('echo "%s" > %s' % (css_vars, pathfile))
	"""
	# Pour Heroku, on évite Grunt ...
	A chacun son taf, on garde Grunt pour le dev et build de l'App, et eventuellement 
	des hooks de post déploiement sur Heroku mais on l'oublie pour la less/minification 
	et la génération de screenshot via l'API
	# local('grunt theme --theme=%s' % theme.identifier)

	# FIXME:
	# less n'est pas trouvé dans un process Supervisor
	# Dans un Greenlet ou sans, le résultat est le meme
	# /bin/sh: 1: lessc: not found
	# pas de pb avec PhantomJs...
	"""
	
	src = os.path.join(theme.path, 'less/styles.less')
	local('touch %s' % src)
	dest = os.path.join(theme.static_path, 'styles.css')
	mindest = os.path.join(theme.static_path, 'styles.min.css')
	r_code = subprocess.call('lessc -l -s %s' % src, shell=True)
	if r_code == 0:
		local('lessc %s > %s' % (src, dest))
		local('lessc -x %s > %s' % (src, mindest))
		return True
	return False

def make_preview(url_param, theme, width, height):
	# on devrait pouvoir builder l'url depuis la resource
	host = app.config['SERVER_CONFIG']['host']
	port = app.config['SERVER_CONFIG']['port']
	hostport = "%s:%s" % (host, port) if port else host
	url = "http://%s/live%s" % (hostport, url_param)
	# Marche dans le contexte de l'install de dev avec Grunt
	# local("grunt snap --url=%s --theme=%s --width=%s --height=%s" % (url, ident, width, height))
	# Là aussi on évite Grunt, on utilise PhantomJs en direct ...
	print url
	dest = os.path.join(theme.static_path, 'img', 'preview.png')
	script = "app/screenshot.js"
	if os.environ.get('HEROKU') and int(os.environ.get('HEROKU')) == 1:
		script = os.path.join('/app', script)

	# FIXME
	# Il y a toujours une erreur (non bloquante normalement) avec Phantom (pas systématique...)
	# quelque soit la méthode choisie, meme résultat : Error: read ECONNRESET
	# la connexion de PhantomJs pouvait poser pb mais normalement désactivée via test sur UA
	# exit 0, parceque sinon Phantom: returned non-zero exit status 8
	phantom_command = "phantomjs %s %s %s %s %s; exit 0;" % (script, url, dest, width, height)

	# test fabric
	# local("phantomjs %s %s %s %s %s" % (script, url, dest, width, height))

	# test subprocess
	# return_call = subprocess.call(phantom_command, shell=True)

	# test Gevent (tient la route avec Supervisor)
	# m = gevent.spawn(local, phantom_command)
	g = Greenlet(local, phantom_command)
	g.start()
	g.get(block=True)
	# g.join()

	return url


def get_img_files(theme):
	files = os.listdir(os.path.join(theme.static_path, 'img'))
	return [{'path': static_file_url(theme, os.path.join('img', f) )} for f in files]


def scafold_theme(identifier):
	root = app.config['ROOT_PATH']
	path = os.path.join(root, 'themes')
	path_theme = os.path.join(path, identifier)
	if not os.path.exists(path_theme):
		# Création de l'arbo de dossiers static du thème
		for p in [path_theme, os.path.join(path_theme, 'less'), os.path.join(path_theme, 'static'), \
					os.path.join(path_theme, 'static/img'), os.path.join(path_theme, 'templates') ]:
			os.mkdir(p)
	return path_theme


class Themer(Resource):

	def get(self,identifier):
		# le model d'un Theme côté js correspond au field 'info' du Theme() qui correspond à 'info.json'
		# on ne retourne donc que le field 'info' marshalé
		theme = get_theme(identifier)
		# on enrichi la resource avec la liste des fichiers du dossier static/img
		theme.info['options']['files'] = get_img_files(theme)
		return marshal(theme.info, theme_info_fields)

	@login_required
	def put(self, identifier):
		# pas de champs libres pour l'instant
		# if current_user.is_admin():
		args = parser_theme.parse_args()
		theme = get_theme(identifier)

		args['options'] = parser_theme_options.parse_args(req=args)
		args['options']['styles'] = parser_theme_styles.parse_args(req=args['options'])
		preview = args['options']['preview'] = parser_theme_preview.parse_args(req=args['options'])
		logo = args['options']['logo'] = parser_theme_logo.parse_args(req=args['options'])

		if args['options']['styles'] != theme.options['styles']:
			lessok = write_less_file(args['options']['styles'], theme)
			if not lessok:
				return {'error': "Erreur pendant la compilation. Verifiez et modifiez votre thème puis relancez la compilation.", "code": "compil"}, 400
		
		info = write_json_file(args, theme.path)

		app.theme_manager.refresh()

		racelist = races.find({'theme': identifier})
		shout_rooms = ["dash"]

		if preview != theme.options['preview'] or args['options']['styles'] != theme.options['styles'] or logo != theme.options['logo']:
			if racelist.count():
				# preview avec une race ayant le bon thème
				make_preview("/%s" % racelist[0]['_id'], theme, preview['width'], preview['height'])
				shout_rooms.extend([ 'play_%s' % r['_id'] for r in racelist])
			else:
				arace = races.find_one()
				if arace:
					# preview avec passage du thème en param (pas de race avec le thème voulu)
					# on ne propage pas l'event l'event sur les live potentiellement ouvert
					race_param = "/%s?theme=%s" % (arace['_id'], theme.identifier)
					make_preview(race_param, theme, preview['width'], preview['height'])
				else:
					try:
						# FIXME
						# preview de ... la page de login :) 
						# Puisque cette vue est en login_required (et le restera)
						# et que Phantom n'est pas authentifié (et ne devrait pas le devenir)...
						user = TW_Client.api.verify_credentials()
						make_preview("?theme=%s" % theme.identifier, theme, preview['width'], preview['height'])
					except TweepError:
						print "Aucune Race et pas de compte twitter"

		ShoutNamespace.broadcast_room(shout_rooms, 'theme_updated', {'theme': identifier })

		# Liste des fichiers images
		args['options']['files'] = get_img_files(theme)
		
		return marshal(json.loads(json.dumps(args)), theme_info_fields)

	@login_required
	def delete(self, identifier):
		theme = get_theme(identifier)
		local('rm -rf %s' % theme.path)
		app.theme_manager.refresh()
		return [], 200



class ThemeList(Resource):
	# @todo:
	# sortir les options des listes ?
    def get(self):
    	app.theme_manager.refresh() 
    	themes = get_all_themes()
    	for theme in themes:
    		theme.info['options']['files'] = get_img_files(theme)
    	return [ marshal(t.info, theme_info_fields) for t in themes ]

    @login_required
    def post(self):
    	themes = get_all_themes()
    	default_theme = get_theme('default')
    	args = parser_theme.parse_args()
    	
    	if 'identifier' not in args or args['identifier'] is None:
    		args['identifier'] = slugify( args['name'].decode('utf-8'), delim=u'_')

    	req_ident = [th for th in themes if th.identifier == args['identifier']]
    	if not len(req_ident):
    		path_theme = scafold_theme(args['identifier'])

    		args['options'] = parser_theme_options.parse_args(req=args)
    		# args['options']['styles'] = parser_theme_styles.parse_args(req=args['options'])
    		# Pour le hash 'styles' on pioche dans le thème par défaut
    		args['options']['styles'] = default_theme.options['styles']

    		# Liste des fichiers images
    		default_img = get_img_files(default_theme)
    		for img in default_img:
    			f = img['path'].split('/')[-1:][0]
    			src_path = os.path.join(default_theme.path, 'static/img', f)
    			dest_path = os.path.join(path_theme, 'static/img', f)
    			local('cp %s %s' % (src_path, dest_path))

    		preview = args['options']['preview'] = parser_theme_preview.parse_args(req=args['options'])
    		args['options']['logo'] = parser_theme_logo.parse_args(req=args['options'])
    		# nom du logo en dur, où mettre ca ?
    		args['options']['logo']['path'] = os.path.join("/themes", args['identifier'], 'img', 'logo.png')

    		info = write_json_file(args, path_theme)

			# FIXME
    		# Copie du contenu des fichiers less du thème par défaut, VRAIMENT pas terrible
    		# Procéder comme pour les .html plus bas avec des 'templates' less dans les statics de l'app ?
    		less_styles_path = os.path.join(default_theme.path, 'less', 'styles.less')
    		with open(less_styles_path, 'r') as o:
    			content = o.read()
	    		with open(os.path.join(path_theme, 'less', 'styles.less'), 'w') as f:
	    			f.write(content)

	    	# autant styles ca peut encore passer, autant là on a un problème. 
    		less_base_path = os.path.join(default_theme.path, 'less', 'base.less')
    		with open(less_base_path, 'r') as o:
    			content = o.read()
	    		with open(os.path.join(path_theme, 'less', 'base.less'), 'w') as f:
	    			f.write(content)

    		tpl_index_src, tpl_index_src_path, tpl_index_src_func = app.jinja_env.loader.get_source(app.jinja_env,'public/_index.html')
    		with open(os.path.join(path_theme, 'templates', 'index.html'), 'w') as f:
    			f.write(tpl_index_src)

    		tpl_info_src, tpl_info_src_path, tpl_info_src_func = app.jinja_env.loader.get_source(app.jinja_env,'public/_info.html')
    		with open(os.path.join(path_theme, 'templates', 'info.html'), 'w') as f:
    			f.write(tpl_info_src)

    		# refresh de la liste des thèmes
    		app.theme_manager.refresh()

    		# recup du thèmes nouvellement créé
    		theme = get_theme(args['identifier'])

    		# Liste des fichiers images (copiés plus haut)
    		args['options']['files'] = get_img_files(theme)

    		# création du fichier variables.less et compilation des fichiers less
    		lessok = write_less_file(args['options']['styles'], theme)

    		try:
    			# FIXME
    			# preview de ... la page de login :) 
    			# Puisque cette vue est en login_required (et le restera sans doute)
    			# et que Phantom n'est pas authentifié (et ne devrait pas le devenir)...
    			user = TW_Client.api.verify_credentials()
    			return_call = make_preview("?theme=%s" % theme.identifier, theme, preview['width'], preview['height'])
    		except TweepError:
    			print "Aucune Race et pas de compte twitter"

    		# theme.info['options']['files'] = get_img_files(theme)
    		return marshal(theme.info, theme_info_fields)

    	return marshal(args, theme_info_fields)


def allowed_file(filename):
	return '.' in filename and filename.rsplit('.', 1)[1] in app.config['ALLOWED_EXTENSIONS'] 

from werkzeug import secure_filename
from app.s3_store import upload_handler, download_handler, list_key, list_bucket


class ThemeUpload(Resource):

	@login_required
	def post(self, identifier):
		# @todo:
		# en dur juste pour le logo et avec un pb d'attributs très certainement ('url' vs 'path')
		theme = get_theme(identifier)
		args = parser_upload.parse_args()
		file = args['image']
		if file and allowed_file(file.filename):
			filename = secure_filename(file.filename)
			pathfile = os.path.join('img', filename)
			file.save(os.path.join(theme.static_path, pathfile))
			theme.info['options']['logo']['url'] = pathfile

			return redirect(os.path.join("/admin/#themes/edit", identifier)) 
		else:
			return {"error": "pas de fichier ou fichier non autorisé", 'code': "upload"}, 403



def get_theme_files(identifier):
	theme = get_theme(identifier)
	files_list = []
	for root, dirs, files in os.walk(theme.path):
		path = os.path.relpath(root, theme.path).split(os.sep)
		if len(path) == 1 and path[0] == ".":
			path.pop(0)
		for file in files:
			files_list.append({
				'filename': file, 
				'localpath': os.path.join(root, file), 
				'remotepath': os.path.join( identifier, os.path.join(*path), file) if len(path) else os.path.join(identifier, file)
			})
	return files_list

class ThemeS3(Resource):

	@login_required
	def post(self, identifier):
		theme_files = get_theme_files(identifier)
		print "nombre de fichiers: %s\n%s" % (len(theme_files), theme_files)
		for filepaths in theme_files:
			print filepaths
			upload_handler(filepaths)
			print "1 file uploaded"

		return {"result": "done", 'code': "upload s3"}, 200

	@login_required
	def get(self, identifier):
		args = parser_s3.parse_args()
		try:
			theme = get_theme(identifier)
		except KeyError:
			scafold_theme(identifier)

		try:
			if args['download']:
				path = os.path.join(app.config['ROOT_PATH'], 'themes')
				return download_handler(identifier, path)
			else:
				return list_key(identifier)
		except ValueError:
			return {"error": "ValueError", 'code': "pb de configuration"}, 200



class ThemeS3List(Resource):

	@login_required
	def get(self):
		return list_bucket()

