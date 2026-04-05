from pathlib import Path
from wsgiref.simple_server import make_server

from expense_claims.web import create_app


def main() -> None:
    host = "127.0.0.1"
    port = 8000
    app = create_app(Path("expense_claims.db"))
    with make_server(host, port, app) as server:
        print(f"Serving on http://{host}:{port}")
        server.serve_forever()


if __name__ == "__main__":
    main()
