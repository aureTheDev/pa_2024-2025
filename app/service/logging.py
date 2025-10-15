import logging

logging.basicConfig(
    level=logging.DEBUG,  # Niveau minimum à enregistrer
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    filename='log',  # Nom du fichier de log (None pour afficher dans la console)
    filemode='a'  # 'w' pour écraser ou 'a' pour ajouter
)