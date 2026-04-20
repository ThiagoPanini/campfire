# Campfire example scripts

Tiny `httpx` scripts that exercise the full Campfire flow against a local
backend. Used from [docs/testing/python-scripts.md](../../docs/testing/python-scripts.md).

```bash
python -m venv .venv
. .venv/Scripts/activate   # Windows bash
pip install -r requirements.txt

export CAMPFIRE_BASE_URL=http://localhost:8000
export CAMPFIRE_USER_ID=<alice-or-bob-uuid>

python 01_health.py
python 02_list_users.py
python 03_search_songs.py beatles
python 04_list_instruments.py guitar
python 05_register_repertoire.py
python 06_my_repertoire.py
```
