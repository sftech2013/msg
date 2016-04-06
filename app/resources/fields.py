# -*- coding: utf-8 -*-
from flask.ext.restful import fields
import os

class ObjId(fields.Raw):
    def format(self, value):
        return str( value )

class formatDate(fields.DateTime):
    def format(self, value):
        return value.strftime("%Y-%m-%dT%H:%M:%SZ")

# @info: sert aussi à marshaller les datas des events socket.io
msg_race_flat = {
	'_id': ObjId(attribute='_id'),
    'provider': fields.String,
    'provider_id': fields.String,
    'provider_user_id': fields.String,
    'author': fields.String,
    'message': fields.String,
    'ctime': formatDate(),
    'avatar': fields.String,
    'links': fields.Raw,
    'url_entities': fields.Raw,
    'medias': fields.Raw,
    # pas de races, c le hash de la race concernée qui est applati
    'race_id': ObjId(attribute='race._id'),
    'visible': fields.Integer(attribute='race.visible'),
    'stared': fields.Integer(attribute='race.stared'),
    'status': fields.String
}

"""
Thèmes
"""

class make_url_preview(fields.String):
    def format(self, identifier):
        path = './app/themes/%s/static/img/preview.png' % identifier
        if os.path.isfile(path):
            return '/themes/%s/img/preview.png' % identifier
        return "/static/img/default_scr.png"

class logo_path(fields.String):
    def format(self, actual):
        return actual if actual['path'] else { "path": "/static/img/logo-b_120.png" }


preview_fields = {
    'width': fields.Integer,
    'height': fields.Integer
}

options_fields = {
    'styles': fields.Raw,
    'preview': fields.Nested(preview_fields),
    # 'logo': fields.Raw,
    'logo': logo_path(attribute='logo'),
    'files': fields.Raw
}

theme_info_fields = {
    'application': fields.String,
    'identifier': fields.String,
    'name': fields.String,
    'author': fields.String,
    'description': fields.String,
    'doctype': fields.String,
    'preview': make_url_preview(attribute='identifier'),
    # 'preview': fields.Url('/Users/{id}/Friends'),
    'options': fields.Nested(options_fields),
    'version': fields.String, 
}

