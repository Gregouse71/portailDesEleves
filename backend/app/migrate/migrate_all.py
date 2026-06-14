from app.migrate.migrations.utilisateurs import migrate_users
from app.migrate.migrations.associations import migrate_associations
from app.migrate.migrations.chat import migrate_chat
from app.migrate.migrations.divers import migrate_divers
from app.migrate.migrations.evenements import migrate_evenements
from app.migrate.migrations.publications import migrate_publications
from app.migrate.migrations.sondages import migrate_sondages

def migrate_all():
    migrate_users()
    print("Users migrated.")
    migrate_associations()
    print("Associations migrated.")
    migrate_chat()
    print("Chat migrated.")
    migrate_divers()
    print("Divers migrated.")
    migrate_evenements()
    print("Evenements migrated.")
    migrate_publications()
    print("Publications migrated.")
    migrate_sondages()
    print("Sondages migrated.")
    print("Migration finished.")

if __name__ == '__main__':
    migrate_all()
