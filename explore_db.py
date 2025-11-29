import sqlite3

def explore_database():
    # Connect to the old database
    old_db_conn = sqlite3.connect('instance/old_database.db')
    old_db_cursor = old_db_conn.cursor()

    # Get the list of all tables
    old_db_cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = old_db_cursor.fetchall()

    for table_name_tuple in tables:
        table_name = table_name_tuple[0]
        print(f"==================== TABLE: {table_name} ====================")

        # Print the schema
        print("------ SCHEMA ------")
        old_db_cursor.execute(f'PRAGMA table_info("{table_name}");')
        schema = old_db_cursor.fetchall()
        for column in schema:
            print(column)

        # Print the first 10 rows
        print("------ FIRST 10 ROWS ------")
        try:
            old_db_cursor.execute(f'SELECT * FROM "{table_name}" LIMIT 10;')
            rows = old_db_cursor.fetchall()
            for row in rows:
                print(row)
        except Exception as e:
            print(f"Could not fetch rows from {table_name}: {e}")

        print("\n\n")

    # Close the connection to the old database
    old_db_conn.close()

if __name__ == '__main__':
    explore_database()
