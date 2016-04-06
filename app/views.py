# -*- coding: utf-8 -*-
from flask import render_template, Response, request, json, flash
from flask.ext.login import login_required
from app import app, db, TW_Client
import pymongo
from bson.objectid import ObjectId
from socketio_ns import ShoutNamespace
from socketio import socketio_manage
import json_util
from flask.ext.themes2 import render_theme_template, get_theme

from helpers import nocache, get_now_ts

from app.resources.prefs import Preferences
from app.twitter.resources import Me
from tweepy import TweepError

messages = db['messages']
races = db['races']
users = db['users']
prefs = db['prefs']

json_dump = lambda data: json.dumps(data, default=json_util.default)

@app.context_processor
def inject_settings():
    preferences = Preferences()
    settings = dict( preferences.get() )
    # settings pour marionette, app_title et app_desc pour Jinja
    return dict(settings=json_dump(settings), app_title=settings['title'], app_desc=settings['desc'])

@app.context_processor
def inject_stream_status():
    return dict(stream_status= json_dump( TW_Client.get_stream_state() ) )

@app.context_processor
def inject_info():
    # si le user-agent est Phantom on bloque l'init socketio du client
    ua = request.headers.get('User-Agent')
    return dict(level='public', ts=get_now_ts(), screenshot='PhantomJS' in ua)


@app.route("/")
def home():
    return render_template("home.html")


@app.route("/wall/<id>/")
@nocache
def main_wall(id):
    race = races.find_one({'_id': ObjectId(id) })
    theme = request.args.get('theme', race['theme'])
    try:
        t = get_theme(theme)
    except KeyError:
        flash(u"Thème introuvable: %s" % theme, "error")
        theme = "default"

    return render_theme_template(theme, "index.html", race_id=str(id), home_timeline=[])


# FIXME
# La view est protégée alors qu'elle est appellée par phantom pour les screenshot -> plante
# De plus, devrait etre une ressource, on rapatrie tout là !!!
# avec ses propres endpoint, et avoir un traitement séparé côté client dans l'AdminController. Ca dérape là...
# Déjà un gros hack dans le controller JS pour jouer avec un race_id='twitter' improbable ...
# Pour faire simple, vrai ressources twitter home_timeline, list, friends, etc d'un coté
# et gestion de race par défaut de l'autre ... avec eventuellement un fallback twitter dans ce cadre là,
# mais pas comme ca en tout cas ... Surtout avec Phantom dans la boucle ! (est ce bien raisonnable d'ailleurs ?)
from app.twitter.models import Tweet
from flask.ext.restful import marshal
from app.resources.fields import msg_race_flat

@app.route("/wall")
# @login_required
@nocache
def wall_default():
    theme = request.args.get('theme', 'default')
    try:
        home_timeline = TW_Client.api.home_timeline()
    except TweepError:
        flash("Twitter: authentification impossible", "error")
        home_timeline = {}

    races_list = [{'_id': 'twitter', 'visible': 1, 'stared': 0 }]
    tw_list = []
    for tw in home_timeline:
        tweet = Tweet(tw)
        tw_dict = marshal(tweet.__dict__, msg_race_flat)
        # classe...
        tw_dict['visible'] = 1
        tw_dict['stared'] = 0
        tw_dict['status'] = ""
        tw_list.append(tw_dict)

    return render_theme_template(theme, "index.html", race_id='twitter', home_timeline=json_dump(tw_list))


""" Socket.io """

@app.route('/socket.io/<path:rest>')
def push_stream(rest):
    try:
        socketio_manage(request.environ, {'/shouts': ShoutNamespace}, request)
    except:
        app.logger.error("Exception lors de la connexion socketio",
                         exc_info=True)
    return Response()
