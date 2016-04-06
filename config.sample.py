# -*- coding: utf-8 -*-

# Configuration globale
SECRET_KEY = 'ChangeThisKey-8RWwQCa#XqWCZTi8X8rQf16k7uRs2xFG'

# Décommenter pour débugger l'application
# DEBUG = True

# Décommenter pour afficher l'édition de thème
# Requiert Node, npm, Less, Grunt, Bower, PhantomJs, voir doc
# DESIGNER = True

# Authentification du grabber
PHONE_TOKEN = "_S0m3thiNg$D1FfiCuLt#T0R3memb3r_"

# MongoDB
MONGODB_URI="mongodb://localhost:27017/live"
# Exemple MongoHQ :
# MONGODB_URI="mongodb://<login>:<password>@oceanic.mongohq.com:10080/bullit"

SERVER_CONFIG = {"host": "127.0.0.1", "port": 8080 }

# Embed.ly: http://embed.ly
# Affichage du contenu riche des messages
EMBEDLY_KEY = "remplacez_par_votre_KEY_Embedly"

# Twitter oAuth 
# Créez votre application en vous connectant sur https://dev.twitter.com/apps
# puis renseignez les informations suivantes
API_KEY=""
API_SECRET=""
ACCESS_TOKEN=""
ACCESS_TOKEN_SECRET=""

# S3
# Synchronisation des statics modifiables par les utilisateurs sur amazon S3 ou compatible

# Le nom de votre bucket doit etre unique
S3_BUCKET_NAME = '' 

# Exemples de DOMAINs en fonction de l'hébergeur
# Amazon S3 - Ireland : s3-eu-west-1.amazonaws.com
# DreamObject chez Dreamhost : objects.dreamhost.com
S3_BUCKET_DOMAIN = ''

AWS_ACCESS_KEY_ID = ''
AWS_SECRET_ACCESS_KEY = ''

