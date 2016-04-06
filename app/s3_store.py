# -*- coding: utf-8 -*-
import boto
import boto.s3.connection
from app import app
import os

def get_connect():
	if 'S3_BUCKET_NAME' not in app.config or app.config['S3_BUCKET_NAME'] == "":
		raise ValueError("S3_BUCKET_NAME n'est pas configuré")

	conn = boto.connect_s3(
	    aws_access_key_id = app.config['AWS_ACCESS_KEY_ID'],
	    aws_secret_access_key = app.config['AWS_SECRET_ACCESS_KEY'],
	    host = app.config['S3_BUCKET_DOMAIN'],
	    calling_format = boto.s3.connection.OrdinaryCallingFormat(),
	    )
	return conn

def get_bucket():
	conn = get_connect()
	return conn.get_bucket( app.config['S3_BUCKET_NAME'] )

# def remove_all_keys():
# 	bucket = get_bucket()
# 	for key in bucket.list():
# 		try:
# 			key.delete()
# 		except:
# 			print "There was an error deleting your file from S3!"
# 	return "done"

def list_bucket():
	bucket = get_bucket()
	s3_themes = list(bucket.list('','/'))
	return [t.name.strip('/') for t in s3_themes]

def list_key(keyname):
	bucket = get_bucket()
	return [k.key for k in bucket.list("%s/" % keyname)]

def upload_handler(filepaths):
	bucket = get_bucket()
	print bucket.name
	key = bucket.new_key( filepaths['remotepath'] )
	# key.set_metadata('Content-Type', instance.mimetype())
	key.set_contents_from_filename( filepaths['localpath'] )
	return "upload done"

def download_handler(keyname, path):
	bucket = get_bucket()
	for keyfile in bucket.list("%s/" % keyname):
		destination = os.path.join(path, str(keyfile.key))
		keyfile.get_contents_to_filename(destination)

	return "download done"

	