# -*- coding: utf-8 -*-
from flask.ext.restful import reqparse
from datetime import datetime
import pytz

def uni(txt):
    txt = txt.encode('utf-8')
    return txt

def ctimeFromTS(ts):
    # Transformation d'un timestamp en datetime UTC
    return datetime.fromtimestamp(float( ts ) / 1e3, pytz.utc)

def strToList(str_target):
    return [c for c in str_target] if str_target else ""

def makeProviderUserId(value):
	# @todo: doit dégager pour 2 parsers distincts justement
    # sms: str, twitter: int   <-- en fait c'est un 'long' et ca fout le bazar ...
    if isinstance(value, int):
        return int(value)
    return str(value)


"""
Messages
"""

parser_msg_base = reqparse.RequestParser()
# base required
parser_msg_base.add_argument('message', type=uni)
parser_msg_base.add_argument('provider', type=str)
parser_msg_base.add_argument('provider_user_id', type=makeProviderUserId)

# Races
# PUT de Msg
# ( et au POST de Sms mais doit dégager - les Sms n'ont pas à 'viser' une Race)
parser_msg_base.add_argument('race_id', type=str)
parser_msg_base.add_argument('visible', type=int)
parser_msg_base.add_argument('stared', type=int, default=0)

# filtres (@déplacer dans les méthodes)
parser_msg_base.add_argument('_modified_field', type=str) 		# PUT Msg : ['visible','stared'] et en manuel crado 'links'
parser_msg_base.add_argument('_filter_stared', type=int) 		# GET MsgList
parser_msg_base.add_argument('_last_ctime', type=ctimeFromTS) 	# GET MsgList


# générique mais twitter only pour l'instant
parser_msg_base.add_argument('provider_id', type=str)
parser_msg_base.add_argument('author', type=str)
parser_msg_base.add_argument('avatar', type=str)
parser_msg_base.add_argument('links', type=strToList)
parser_msg_base.add_argument('medias', type=str)


"""
Messages - Sms
"""

parser_sms_post = reqparse.RequestParser()

# POST
parser_sms_post.add_argument('sender', type=str, dest='author')
parser_sms_post.add_argument('text', type=uni, dest='message')       # corps message SMS
parser_sms_post.add_argument('grabber', type=str)
# non stocké
parser_sms_post.add_argument('tag', type=str)


"""
Themes
"""

parser_theme = reqparse.RequestParser()
parser_theme.add_argument('application', type=str, default="Live Message")
parser_theme.add_argument('name', type=uni, default="Nouveau")
parser_theme.add_argument('identifier', type=str)
parser_theme.add_argument('author', type=uni, default="Vous")
parser_theme.add_argument('description', type=uni, default="Ajoutez votre description")
parser_theme.add_argument('doctype', type=str, default="html5")
parser_theme.add_argument('preview', type=str)
parser_theme.add_argument('options', type=dict)
parser_theme.add_argument('version', type=str, default="0.0.1")

parser_theme_options = reqparse.RequestParser()
parser_theme_options.add_argument('styles', type=dict, location=('options',))
parser_theme_options.add_argument('preview', type=dict, location=('options',))
parser_theme_options.add_argument('logo', type=dict, location=('options',))

parser_theme_styles = reqparse.RequestParser()
parser_theme_styles.add_argument('brand-primary', type=str, location=('styles',))
parser_theme_styles.add_argument('brand-success', type=str, location=('styles',))
parser_theme_styles.add_argument('brand-info', type=str, location=('styles',))
parser_theme_styles.add_argument('brand-danger', type=str, location=('styles',))
parser_theme_styles.add_argument('text-color', type=str, location=('styles',))
parser_theme_styles.add_argument('link-color', type=str, location=('styles',))
parser_theme_styles.add_argument('body-bg', type=str, location=('styles',))
parser_theme_styles.add_argument('info-bg', type=str, location=('styles',))
parser_theme_styles.add_argument('msg-bg', type=str, location=('styles',))
parser_theme_styles.add_argument('msg-border', type=str, location=('styles',))
parser_theme_styles.add_argument('msg-radius', type=str, location=('styles',))
parser_theme_styles.add_argument('logo-bg', type=str, location=('styles',))


parser_theme_preview = reqparse.RequestParser()
# moyen, il y a déjà le field 'preview' en route du Theme et dans 'info'
parser_theme_preview.add_argument('width', type=int, default=1024, location=('preview',))
parser_theme_preview.add_argument('height', type=int, default=768, location=('preview',))



parser_theme_logo = reqparse.RequestParser()
parser_theme_logo.add_argument('path', type=str, location=('logo',))

from werkzeug.datastructures import FileStorage

parser_upload = reqparse.RequestParser()
parser_upload.add_argument('image', type=FileStorage, location='files')


parser_s3 = reqparse.RequestParser()
parser_s3.add_argument('download', type=int, default=0)

