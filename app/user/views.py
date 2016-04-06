# -*- coding: utf-8 -*-
from flask import Blueprint, request, render_template, redirect, flash, url_for
from flask.ext.login import LoginManager, login_required, login_user, logout_user, current_user
import pymongo
from bson.objectid import ObjectId
from app.user.model import User
import bcrypt
from app import app, db, load_user

mod = Blueprint('user', __name__, url_prefix='/user')

users = db['users']


@mod.route("/login", methods=['GET','POST'])
def login():
    if request.method == 'GET':
        if not users.count():
            return redirect(url_for('.firstregister'))

        return render_template('login.html')

    username = request.form['username']
    password = request.form['password']
    registered_user = users.find_one({'username': username})

    if bcrypt.hashpw(password, registered_user['password']) == registered_user['password']:
        user = load_user(registered_user['_id'])
        login_user(user)
        print current_user
        flash('Vous êtes authentifié')
    else:
        flash('Le login ou le password sont invalides' , 'error')
        return redirect(url_for('.login'))

    return redirect(request.args.get('next') or '/')


@mod.route("/logout")
@login_required
def logout():
    logout_user()
    # session.pop('user')
    return redirect(url_for('.login'))


@mod.route('/register' , methods=['GET','POST'])
@login_required
def register():
    if request.method == 'GET':
        return render_template('register.html')

    registered_user = users.find_one({'username': request.form['username']})

    if registered_user is None:
        user = User(None, request.form['username'] , request.form['password'], request.form['email'], 0)
        users.insert(user.__dict__)
        flash('User successfully registered')
        return redirect(url_for('.login'))
    else:
        flash('Ce username est déjà pris' , 'error')
        return redirect(url_for('.register'))


@mod.route('/welcome' , methods=['GET','POST'])
def firstregister():
    if users.count():
        return redirect(url_for('.login'))

    if request.method == 'GET':
        flash('Enregistrement du compte admin' , 'info')
        return render_template('register.html')

    user = User(None, request.form['username'] , request.form['password'], request.form['email'], 1)
    users.insert(user.__dict__)
    flash('Admin successfully registered')
    return redirect(url_for('.login'))

