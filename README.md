# campfire
🔥 A web app that helps groups of friends organize and enjoy their music jam sessions.

## Project Structure

```
campfire/
├── backend/          # Python + FastAPI REST API
│   ├── app/
│   │   ├── __init__.py
│   │   └── main.py   # FastAPI application
│   └── requirements.txt
└── frontend/         # React + TypeScript + Vite SPA
    ├── public/
    ├── src/
    │   ├── App.tsx
    │   ├── App.css
    │   ├── main.tsx
    │   └── index.css
    ├── index.html
    ├── package.json
    └── vite.config.ts
```

## Getting Started

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.
