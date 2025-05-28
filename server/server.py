from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import spacy
import mysql.connector
from mysql.connector import pooling
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
nlp_ner = spacy.load("model-best-3")

# Database Schema
database = {
    "departments": ["department_id", "department_name"],
    "students": ["student_id", "first_name", "last_name", "date_of_birth", "department_id"],
    "instructors": ["instructor_id", "first_name", "last_name", "department_id"],
    "courses": ["course_id", "course_name", "department_id", "instructor_id", "credits"],
    "enrollments": ["enrollment_id", "student_id", "course_id", "enrollment_date"]
}

# Aggregation functions
aggregates = ["COUNT", "SUM", "AVG", "MIN", "MAX"]

# Database config model
class DBConfig(BaseModel):
    host: str
    user: str
    password: str
    database: str

# Global variable for database connection pool
db_pool = None

def connect_to_db(config: DBConfig):
    global db_pool
    try:
        db_pool = mysql.connector.pooling.MySQLConnectionPool(
            pool_name="mypool",
            pool_size=5,
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

def get_db_connection():
    global db_pool
    if not db_pool:
        raise HTTPException(status_code=500, detail="Database connection pool is not initialized. Call /connect first.")
    return db_pool.get_connection()

def get_table_column_mapping(word):
    word_lower = word.lower()
    for table, columns in database.items():
        if word_lower in table.lower():
            return table, None
        for column in columns:
            if word_lower in column.lower():
                return table, column
    return None, None

def generate_sql(query):
    doc = nlp_ner(query)
    select_cols, conditions, aggregate_funcs, order_by_cols, group_by_cols, having_conditions, joins = [], [], [], [], [], [], []
    table_name, limit_value, distinct_flag = None, None, False
    
    for ent in doc.ents:
        word = ent.text.strip()
        detected_table, detected_column = get_table_column_mapping(word)
        
        if ent.label_ == "TABLE" and detected_table:
            table_name = detected_table
        elif ent.label_ == "COLUMN" and detected_column:
            select_cols.append(detected_column)
        elif ent.label_ == "CONDITION" or ent.label_ == "VALUE":
            conditions.append(word)
        elif ent.label_ == "AGGREGATE" and word.upper() in aggregates:
            aggregate_funcs.append(word.upper())
        elif ent.label_ == "ORDER_BY" and detected_column:
            order_by_cols.append(detected_column)
        elif ent.label_ == "GROUP_BY" and detected_column:
            group_by_cols.append(detected_column)
        elif ent.label_ == "HAVING":
            having_conditions.append(word)
        elif ent.label_ == "JOIN" and detected_table:
            joins.append(detected_table)
        elif ent.label_ == "LIMIT":
            try:
                limit_value = int(word)
            except ValueError:
                pass
        elif ent.label_ == "DISTINCT":
            distinct_flag = True
    
    if not table_name and select_cols:
        for table, columns in database.items():
            if any(col in columns for col in select_cols):
                table_name = table
                break
    
    sql_query = "SELECT "
    if distinct_flag:
        sql_query += "DISTINCT "
    if aggregate_funcs:
        sql_query += ", ".join([f"{agg}({col})" for agg, col in zip(aggregate_funcs, select_cols)])
    elif select_cols:
        sql_query += ", ".join(select_cols)
    else:
        sql_query += "*"
    sql_query += f" FROM {table_name}" if table_name else " FROM table_name"
    
    if joins:
        for join_table in joins:
            sql_query += f" JOIN {join_table} ON {table_name}.id = {join_table}.id"
    if conditions:
        sql_query += " WHERE " + " AND ".join(conditions)
    if group_by_cols:
        sql_query += " GROUP BY " + ", ".join(group_by_cols)
    if having_conditions:
        sql_query += " HAVING " + " AND ".join(having_conditions)
    if order_by_cols:
        sql_query += " ORDER BY " + ", ".join(order_by_cols)
    if limit_value:
        sql_query += f" LIMIT {limit_value}"
    
    return sql_query + ";"

@app.post("/query")
def process_query(request: QueryRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        sql_query = generate_sql(request.user_query)
        print(sql_query)
        cursor.execute(sql_query)
        results = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description]
        return {"query": sql_query, "columns": columns, "results": results}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=500, detail=f"MySQL Error: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)