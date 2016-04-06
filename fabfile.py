# coding: utf-8
from fabric.api import local
from fabric.operations import prompt
import pymongo
from app import db
from app.user.model import User

races = db['races']
users = db['users']

def make_screenshot(source,dest):
	local("phantomjs app/screenshot.js %s %s" % (source, dest))
	return


def list_races():
	""" Liste les races - _id : title """
	for race in list(races.find()):
		print "%s : %s" % (race['_id'], race['title'])
	return

def export_all_messages():
	""" Export de tous les messages en vrac """
	local("mongoexport --db smswall --collection messages --out monexport.json")
	return 

def export_race_messages(race_id):
	""" Export d'une race et de tous ses messages """
	print "Export de la race '%s' et de ses messages" % race_id
	task_race = 	"mongoexport -d smswall -c races -q '{_id: ObjectId(\"%s\")}' --out race-%s.json" % (race_id, race_id)
	task_messages = "mongoexport -d smswall -c messages -q '{\"races._id\": ObjectId(\"%s\")}' --out race-%s-messages.json" % (race_id, race_id)
	local(task_race)
	local(task_messages)
	return

def list_users():
	for u in list(users.find()):
		print "%s - %s" % (u['username'], u['email'])
	return

def register_admin():
    print "------------------------------"
    print "Création d'un' administrateur."
    print "------------------------------"
    username = prompt("Username:")
    password = prompt("Password:")
    email = prompt("Email:")

    registered_user = users.find_one({'username': username})

    if registered_user is None:
        user = User(None, username , password, email, 1)
        users.insert(user.__dict__)
        print "Nouvel administrateur créé, vous pouvez vous connecter avec vos identifiants."
        return 
    else:
        print "Ce username est déjà pris."

    return
