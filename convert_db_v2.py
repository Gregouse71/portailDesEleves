import sqlite3
import re
import os
import sys

def convert_mysql_to_sqlite(sql_file_path, db_file_path):
    """
    Parses a MySQL dump file and imports it into a SQLite database,
    handling quote escaping and schema differences.
    """
    if os.path.exists(db_file_path):
        os.remove(db_file_path)
        print(f"Removed old database: {db_file_path}")

    conn = sqlite3.connect(db_file_path)
    cursor = conn.cursor()
    
    # Optimize SQLite for bulk loading
    cursor.execute("PRAGMA synchronous = OFF")
    cursor.execute("PRAGMA journal_mode = MEMORY")
    cursor.execute("PRAGMA foreign_keys = OFF") # Disable FK checks during import

    print(f"Reading {sql_file_path}...")

    # Regex to ignore specific MySQL commands
    remove_patterns = [
        re.compile(r'SET SQL_MODE.*?;', re.IGNORECASE),
        re.compile(r'SET time_zone.*?;', re.IGNORECASE),
        re.compile(r'/\*!.*?\*/;', re.DOTALL),
        re.compile(r'LOCK TABLES.*?;', re.IGNORECASE),
        re.compile(r'UNLOCK TABLES;', re.IGNORECASE),
        re.compile(r'CREATE DATABASE.*?;', re.IGNORECASE),
        re.compile(r'USE .*?;', re.IGNORECASE),
        # We generally want to keep ALTER TABLE if possible, but complex ones fail in SQLite.
        # Simple ADD COLUMN might work, but usually dumps use ALTER for keys. 
        # We'll try to execute them, but catch errors.
    ]

    # Regex for CREATE TABLE cleanup
    create_table_option_pattern = re.compile(r'\) ENGINE=.*?;', re.IGNORECASE)

    statement = ""
    line_count = 0
    
    try:
        with open(sql_file_path, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                line_count += 1
                if line_count % 5000 == 0:
                    print(f"Processing line {line_count}...", end='\r')

                # Skip comments and empty lines
                if line.strip().startswith('--') or not line.strip():
                    continue

                statement += line

                # Check if statement is complete
                if statement.strip().endswith(';'):
                    clean_stmt = statement.strip()
                    
                    # 1. Check patterns to skip
                    skip = False
                    for pattern in remove_patterns:
                        if pattern.match(clean_stmt):
                            skip = True
                            break
                    
                    if not skip:
                        # 2. Syntax Fixes
                        
                        # Fix A: Replace MySQL escaped quotes (\') with SQLite escaped quotes ('')
                        # We perform this global replace to catch data in INSERTs.
                        # Note: We must be careful not to break escaped backslashes (\\).
                        # This simple replace covers 99% of text dump cases.
                        clean_stmt = clean_stmt.replace(r"\'", "''")
                        clean_stmt = clean_stmt.replace(r'\"', '"')
                        
                        if clean_stmt.upper().startswith("CREATE TABLE"):
                            # Remove engine/charset options
                            clean_stmt = create_table_option_pattern.sub(');', clean_stmt)
                            
                            # Replace MySQL types
                            clean_stmt = clean_stmt.replace('int(11)', 'INTEGER')
                            clean_stmt = clean_stmt.replace('int(5)', 'INTEGER')
                            clean_stmt = clean_stmt.replace('tinyint(1)', 'INTEGER')
                            clean_stmt = clean_stmt.replace('bigint(20)', 'INTEGER')
                            clean_stmt = clean_stmt.replace('unsigned', '')
                            clean_stmt = clean_stmt.replace('AUTO_INCREMENT', '')
                            # SQLite typically doesn't like 'COLLATE ...' inside CREATE definition in the same way
                            # But simple dumps might pass. Removing common collations:
                            clean_stmt = re.sub(r'COLLATE \w+', '', clean_stmt)
                            clean_stmt = re.sub(r'CHARACTER SET \w+', '', clean_stmt)

                        # 3. Execute
                        try:
                            cursor.execute(clean_stmt)
                        except sqlite3.Error as e:
                            # We print the error but continue. 
                            # "Table already exists" or "Constraint failed" are common benign errors in conversions.
                            err_msg = str(e)
                            if "syntax error" in err_msg.lower() and "ALTER TABLE" in clean_stmt:
                                pass # Expected failure for complex ALTERs
                            else:
                                print(f"\n[Warning] Error on line {line_count}: {e}")
                                # Uncomment below to debug specific failing SQL (it can be huge)
                                # print(f"SQL: {clean_stmt[:100]}...") 

                    statement = ""

        conn.commit()
        print(f"\nDone! Database saved to: {db_file_path}")
        
        # verification
        print("Verifying chat_message table...")
        try:
            cursor.execute("SELECT count(*) FROM chat_message")
            count = cursor.fetchone()[0]
            print(f"Rows in 'chat_message': {count}")
        except sqlite3.Error:
            print("'chat_message' table does not exist.")

    except FileNotFoundError:
        print(f"Error: File '{sql_file_path}' not found.")
    except Exception as e:
        print(f"\nFatal Error: {e}")
    finally:
        conn.close()

# Run the conversion
convert_mysql_to_sqlite('localhost.sql', 'converted_database.db')