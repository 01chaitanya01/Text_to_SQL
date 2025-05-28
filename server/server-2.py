from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import spacy
import mysql.connector
from mysql.connector import pooling  # ✅ Connection Pooling
from rapidfuzz import process, fuzz
from pydantic import BaseModel

class QueryRequest(BaseModel):
    user_query: str

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load SpaCy NER model
nlp_ner = spacy.load("model-best-2")

# Database Schema
database = {
    "departments": ["department_id", "department_name"],
    "students": ["student_id", "first_name", "last_name", "date_of_birth", "department_id"],
    "instructors": ["instructor_id", "first_name", "department_id"],
    "courses": ["course_id", "course_name", "department_id", "instructor_id", "credits"],
    "enrollments": ["enrollment_id", "student_id", "course_id", "enrollment_date"]
}

# Database config model
class DBConfig(BaseModel):
    host: str
    user: str
    password: str
    database: str

# Global variable for database connection pool
db_pool = None

# Function to initialize connection pool
def connect_to_db(config: DBConfig):
    global db_pool
    try:
        db_pool = mysql.connector.pooling.MySQLConnectionPool(
            pool_name="mypool",
            pool_size=5,  # ✅ Adjust pool size as needed
            host=config.host,
            user=config.user,
            password=config.password,
            database=config.database
        )
        return {"message": "Database connection pool initialized successfully!"}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"Database Connection Error: {e}")

@app.post("/connect")
def connect_db(config: DBConfig):
    return connect_to_db(config)

# Function to get a database connection from the pool
def get_db_connection():
    global db_pool
    if not db_pool:
        raise HTTPException(status_code=500, detail="Database connection pool is not initialized. Call /connect first.")
    return db_pool.get_connection()

# Function to find best match
def get_best_match(word, choices, threshold=60):
    result = process.extractOne(word, choices, scorer=fuzz.ratio)
    return result[0] if result and result[1] >= threshold else None

# Function to get table and column mappings
def get_table_column_mapping(word, detected_table=None):
    word_lower = word.lower()
    if detected_table:
        return detected_table, get_best_match(word_lower, database[detected_table])
    best_table = get_best_match(word_lower, database.keys())
    if not best_table:
        for table, columns in database.items():
            best_column = get_best_match(word_lower, columns)
            if best_column:
                return table, best_column
    return best_table, None

# Function to generate SQL query
def generate_sql(query):
    doc = nlp_ner(query)
    select_cols, conditions = [], []
    table_name = None
    for ent in doc.ents:
        word = ent.text.strip()
        detected_table, detected_column = get_table_column_mapping(word, table_name)
        if ent.label_ == "TABLE" and detected_table:
            table_name = detected_table
        elif ent.label_ == "COLUMN" and detected_column:
            select_cols.append(detected_column)
        elif ent.label_ in ["CONDITION", "VALUE"]:
            conditions.append(word)
    if not table_name and select_cols:
        for table, columns in database.items():
            if any(col in columns for col in select_cols):
                table_name = table
                break
    sql_query = f"SELECT {', '.join(select_cols) if select_cols else '*'} FROM {table_name if table_name else 'table_name'}"
    if conditions:
        sql_query += " WHERE " + " AND ".join(conditions)
    return sql_query + ";"

# API endpoint to generate and execute SQL query
@app.post("/query")
def process_query(request: QueryRequest):
    conn = get_db_connection()  # ✅ Get a new connection from the pool
    cursor = conn.cursor()
    try:
        sql_query = generate_sql(request.user_query)
        cursor.execute(sql_query)
        results = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description]
        return {"query": sql_query, "columns": columns, "results": results}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"MySQL Error: {e}")
    finally:
        cursor.close()
        conn.close()  # ✅ Return connection to pool instead of closing it

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
