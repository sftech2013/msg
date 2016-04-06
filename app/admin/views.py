# -*- coding: utf-8 -*-
from flask import Blueprint, session, current_app, render_template, json
from flask.ext.login import login_required, LoginManager, current_user
from app.socketio_ns import ShoutNamespace
import re

import pymongo
from bson.objectid import ObjectId

from app import json_util, db, TW_Client
from app.resources.prefs import Preferences
from app.resources.theme import ThemeList
from app.resources.race import RaceList
from app.twitter.resources import Me

mod = Blueprint('admin', __name__, url_prefix='/admin')

races = db['races']

json_dump = lambda data: json.dumps(data, default=json_util.default)

@mod.context_processor
def inject_twitter_account():
    if 'API_KEY' in current_app.config and current_app.config['API_KEY']:
        twitter_account = Me()
        return dict(twitter_account=json_dump( twitter_account.get() ) )
    return dict()

@mod.context_processor
def inject_themes():
    theme_list = ThemeList()
    return dict(themes=json_dump( theme_list.get() ))

@mod.context_processor
def inject_races():
    race_list = RaceList()
    return dict(races=json_dump( race_list.get() ))

@mod.context_processor
def inject_infos():
    return dict(level='private', is_admin=current_user.is_admin(), 
                server_info=current_app.config['SERVER_CONFIG'],
                bucket=current_app.config['S3_BUCKET_NAME'] )

@mod.route("/")
@login_required
def admin():
    return render_template("admin.html")



# @todo: devrait etre en resources 
@mod.route("/devices")
@login_required
def get_devices():
    # devices en attente
    devices = [ {'id': id(ws), 'room': 'waiting', 'race_id': '', 'race_title': 'En attente'} 
                for ws in ShoutNamespace.sockets.values() 
                if "/shouts_waiting" in ws.session['rooms'] ]
    
    # devices connectés sur un Live public
    for ws in ShoutNamespace.sockets.values():
        for room in ws.session['rooms']:
            reg_play = re.match(r'(/shouts_play_)([a-f0-9]{24})\b', room)
            if reg_play:
                race = races.find_one({'_id': ObjectId(reg_play.group(2)) })
                devices.append({'id': id(ws), 'room': "play_%s" % reg_play.group(2), 'race_id': race['_id'], 'race_title': race['title']})

    return json_dump( devices )



