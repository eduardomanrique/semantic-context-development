# Expense Claims Demo

This repository is a Python regeneration of the expense reimbursement demo described in `semantic-context/`.

## Stack

- Python 3 standard library
- WSGI web app with server-rendered HTML and CSS
- SQLite persistence
- `unittest` automated tests

## Run the application

```bash
python3 app.py
```

Then open [http://127.0.0.1:8000](http://127.0.0.1:8000).

## Run the tests

```bash
python3 -m unittest discover -s tests -v
```
