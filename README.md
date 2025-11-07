# KrishiSakhi

---
This project has a **separate frontend and backend** setup:

* **Frontend**: React app
* **Backend**: Django REST API using Google Earth Engine



## Frontend Setup

1. Open a terminal and navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the React development server:

```bash
npm start
```

The frontend should now be running on [http://localhost:5000](http://localhost:5000).

---

## Backend & Models Setup

1. Open a **new terminal**:

2. Setup the Virtual Environment
```bash
python -m venv venv
.\venv\Scripts\activate.ps1
```
3. Install Python dependencies:

```bash
pip install --upgrade pip setuptools wheel
pip install --only-binary :all: -r backend/requirements.txt
```

4. **Authenticate Google Earth Engine** (one-time setup):

```bash
earthengine authenticatepy
```

Follow the instructions to allow access.

5. Start the Django server:

```bash
cd backend
python manage.py runserver
```

The backend should now be running on [http://localhost:8000](http://localhost:8000).

---

## Notes

* Make sure you have **Node.js** installed for the frontend and **Python 3.8+** for the backend.
* The backend requires a **Google Earth Engine account** & a project to function.
