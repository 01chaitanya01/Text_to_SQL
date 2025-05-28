# QueryGen

Generating SQL Queries from Natural
Language Text Using Named Entity Recognition

This project is a full-stack application that allows users to convert natural language queries into SQL commands using a trained Named Entity Recognition (NER) model powered by SpaCy. The backend is built with FastAPI and serves the model, while the frontend is developed using React and Vite.

---

## 📁 Project Structure

```bash
application2.0/
├── dataset/              # (optional) Training and evaluation datasets for NER
├── frontend/             # React + Vite frontend application
├── server/               # FastAPI backend and NER model
└── README.md             # Project documentation
```

---

## 🚀 Features

- Natural Language Processing with SpaCy
- Custom NER model for SQL query parsing
- React-based frontend for user interaction
- MySQL connection support
- Query results displayed in tabular form
- Modular backend structure with model versioning

---

## 🧠 Backend (FastAPI + SpaCy)

### Setup

1. Navigate to the `server` directory:

   ```bash
   cd server
   ```

2. Install dependencies:

   ```bash
   pip install fastapi uvicorn spacy mysql-connector-python
   ```

3. Start the server:

   ```bash
   uvicorn server:app --reload
   ```

> Ensure you have a MySQL server running and accessible with proper credentials.

---

## 💻 Frontend (React + Vite)

### Setup

1. Navigate to the `frontend` directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

---

## 🔍 How It Works

1. The user inputs a natural language question like _“Show me all students from the Computer Science department.”_
2. The backend parses the question using a SpaCy NER model (`model-best-3`) and identifies entities such as table names, columns, conditions, and aggregations.
3. The backend generates a corresponding SQL query and executes it against the connected MySQL database.
4. The results are returned and displayed in a React data table.

---

## 🔐 Model Files

- Two versions of the SpaCy NER model are available: `model-best-2` and `model-best-3`.
- These models are large and not pushed to GitHub. Please ensure to **exclude them using `.gitignore`** or host them externally (e.g., Hugging Face, S3).

---

## 📄 API Endpoints

### `POST /connect`

Connect to the database using credentials.

```json
{
  "host": "localhost",
  "user": "root",
  "password": "yourpassword",
  "database": "yourdatabase"
}
```

### `POST /query`

Send a natural language query.

```json
{
  "user_query": "List all students enrolled in Math."
}
```

Returns:

```json
{
  "query": "SELECT * FROM students WHERE ...",
  "columns": ["student_id", "first_name", ...],
  "results": [...]
}
```

---

## 📦 Dependencies

### Backend

- `fastapi`
- `uvicorn`
- `spacy`
- `mysql-connector-python`

### Frontend

- `react`
- `vite`
- `axios` (in `services/api.js`)
