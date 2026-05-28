"""Transaction store adapters.

Interface:
    add_transaction(user_id, txn) -> None
    list_transactions(user_id, month=None) -> list[dict]
    update_transaction(user_id, txn_id, updates) -> None
    add_rule(user_id, rule) -> None
    list_rules(user_id) -> list[dict]
    summary(user_id, month=None) -> {category: {"total": float, "count": int}}
"""
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
import uuid


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class PostgresUserStore:
    def __init__(self, url: str):
        try:
            import psycopg2
            import psycopg2.extras
        except ImportError:
            raise ImportError("psycopg2 not installed. Run: pip install psycopg2-binary")
        if not url:
            raise ValueError("USERSTORE_POSTGRES_URL must be set")
        self.conn = psycopg2.connect(url)
        self.conn.autocommit = True
        self._init_schema()

    def _init_schema(self):
        with self.conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS transactions (
                    id TEXT PRIMARY KEY,
                    import_id TEXT,
                    user_id TEXT NOT NULL,
                    txn_date DATE NOT NULL,
                    description TEXT,
                    merchant TEXT,
                    amount NUMERIC(14,2),
                    category TEXT,
                    confidence NUMERIC(4,2),
                    status TEXT,
                    recurring BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS txn_user_date_idx ON transactions(user_id, txn_date);

                CREATE TABLE IF NOT EXISTS rules (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    contains TEXT,
                    category TEXT,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS uploaded_files (
                    user_id TEXT NOT NULL,
                    file_hash TEXT NOT NULL,
                    filename TEXT,
                    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
                    PRIMARY KEY (user_id, file_hash)
                );
            """)

    def add_transaction(self, user_id: str, txn: dict) -> None:
        with self.conn.cursor() as cur:
            cur.execute(
                "INSERT INTO transactions (id, import_id, user_id, txn_date, description, merchant, amount, category, confidence, status, recurring) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (txn["id"], txn["importId"], user_id, txn["date"], txn["description"], txn["merchant"], txn["amount"], txn["category"], txn["confidence"], txn["status"], txn.get("recurring", False)),
            )

    def update_transaction(self, user_id: str, txn_id: str, updates: dict) -> None:
        if not updates: return
        set_clause = ", ".join([f"{k} = %s" for k in updates.keys()])
        values = list(updates.values()) + [user_id, txn_id]
        with self.conn.cursor() as cur:
            cur.execute(f"UPDATE transactions SET {set_clause} WHERE user_id = %s AND id = %s", values)

    def list_transactions(self, user_id: str, month: str | None = None) -> list:
        sql = "SELECT id, import_id as \"importId\", to_char(txn_date, 'YYYY-MM-DD') as date, description, merchant, amount, category, confidence, status, recurring FROM transactions WHERE user_id = %s"
        params = [user_id]
        if month:
            sql += " AND to_char(txn_date, 'YYYY-MM') = %s"
            params.append(month)
        sql += " ORDER BY txn_date DESC"
        import psycopg2.extras
        with self.conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute(sql, params)
            res = []
            for r in cur.fetchall():
                d = dict(r)
                if d.get("amount") is not None:
                    d["amount"] = float(d["amount"])
                if d.get("confidence") is not None:
                    d["confidence"] = float(d["confidence"])
                d["classifiedBy"] = "RULE" if d.get("confidence") == 1.0 else "AI"
                res.append(d)
            return res

    def add_rule(self, user_id: str, rule: dict) -> None:
        with self.conn.cursor() as cur:
            cur.execute(
                "INSERT INTO rules (id, user_id, contains, category) VALUES (%s, %s, %s, %s)",
                (rule["id"], user_id, rule["contains"], rule["category"])
            )

    def list_rules(self, user_id: str) -> list:
        with self.conn.cursor() as cur:
            cur.execute("SELECT id, contains, category FROM rules WHERE user_id = %s", (user_id,))
            return [{"id": r[0], "contains": r[1], "category": r[2]} for r in cur.fetchall()]

    def clear_transactions(self, user_id: str) -> None:
        with self.conn.cursor() as cur:
            cur.execute("DELETE FROM transactions WHERE user_id = %s", (user_id,))

    def summary(self, user_id: str, month: str | None = None) -> dict:
        return _aggregate(self.list_transactions(user_id, month))

    def is_file_uploaded(self, user_id: str, file_hash: str) -> bool:
        with self.conn.cursor() as cur:
            cur.execute("SELECT 1 FROM uploaded_files WHERE user_id = %s AND file_hash = %s", (user_id, file_hash))
            return cur.fetchone() is not None

    def register_uploaded_file(self, user_id: str, file_hash: str, filename: str) -> None:
        with self.conn.cursor() as cur:
            cur.execute(
                "INSERT INTO uploaded_files (file_hash, user_id, filename) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING",
                (file_hash, user_id, filename)
            )


class SQLiteUserStore:
    def __init__(self, db_path: str):
        import sqlite3
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self._init_schema()

    def _init_schema(self):
        self.conn.executescript("""
            CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY,
                import_id TEXT,
                user_id TEXT NOT NULL,
                txn_date TEXT NOT NULL,
                description TEXT,
                merchant TEXT,
                amount REAL,
                category TEXT,
                confidence REAL,
                status TEXT,
                recurring INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS txn_user_date_idx ON transactions(user_id, txn_date);

            CREATE TABLE IF NOT EXISTS rules (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                contains TEXT,
                category TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS uploaded_files (
                user_id TEXT NOT NULL,
                file_hash TEXT NOT NULL,
                filename TEXT,
                uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, file_hash)
            );
        """)
        self.conn.commit()

    def add_transaction(self, user_id: str, txn: dict) -> None:
        self.conn.execute(
            "INSERT INTO transactions (id, import_id, user_id, txn_date, description, merchant, amount, category, confidence, status, recurring) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (txn["id"], txn["importId"], user_id, txn["date"], txn["description"], txn["merchant"], float(txn["amount"]), txn["category"], float(txn["confidence"]), txn["status"], 1 if txn.get("recurring") else 0),
        )
        self.conn.commit()

    def update_transaction(self, user_id: str, txn_id: str, updates: dict) -> None:
        if not updates: return
        set_clause = ", ".join([f"{k} = ?" for k in updates.keys()])
        values = list(updates.values()) + [user_id, txn_id]
        self.conn.execute(f"UPDATE transactions SET {set_clause} WHERE user_id = ? AND id = ?", values)
        self.conn.commit()

    def list_transactions(self, user_id: str, month: str | None = None) -> list:
        sql = "SELECT id, import_id as importId, txn_date as date, description, merchant, amount, category, confidence, status, recurring FROM transactions WHERE user_id = ?"
        params = [user_id]
        if month:
            sql += " AND substr(txn_date, 1, 7) = ?"
            params.append(month)
        sql += " ORDER BY txn_date DESC"
        cur = self.conn.execute(sql, params)
        res = []
        for r in cur.fetchall():
            d = dict(r)
            d["recurring"] = bool(d["recurring"])
            d["classifiedBy"] = "RULE" if d.get("confidence") == 1.0 else "AI"
            res.append(d)
        return res

    def add_rule(self, user_id: str, rule: dict) -> None:
        self.conn.execute(
            "INSERT INTO rules (id, user_id, contains, category) VALUES (?, ?, ?, ?)",
            (rule["id"], user_id, rule["contains"], rule["category"])
        )
        self.conn.commit()

    def list_rules(self, user_id: str) -> list:
        cur = self.conn.execute("SELECT id, contains, category FROM rules WHERE user_id = ?", (user_id,))
        return [dict(r) for r in cur.fetchall()]

    def clear_transactions(self, user_id: str) -> None:
        self.conn.execute("DELETE FROM transactions WHERE user_id = ?", (user_id,))
        self.conn.commit()

    def summary(self, user_id: str, month: str | None = None) -> dict:
        return _aggregate(self.list_transactions(user_id, month))

    def is_file_uploaded(self, user_id: str, file_hash: str) -> bool:
        cur = self.conn.execute("SELECT 1 FROM uploaded_files WHERE user_id = ? AND file_hash = ?", (user_id, file_hash))
        return cur.fetchone() is not None

    def register_uploaded_file(self, user_id: str, file_hash: str, filename: str) -> None:
        self.conn.execute(
            "INSERT OR IGNORE INTO uploaded_files (user_id, file_hash, filename) VALUES (?, ?, ?)",
            (user_id, file_hash, filename)
        )
        self.conn.commit()


def _aggregate(rows: list) -> dict:
    agg: dict = defaultdict(lambda: {"total": 0.0, "count": 0})
    for r in rows:
        cat = r.get("category", "Other")
        agg[cat]["total"] += float(r.get("amount", 0))
        agg[cat]["count"] += 1
    return {k: v for k, v in agg.items()}

class MySQLUserStore:
    def __init__(self, url: str):
        try:
            import pymysql
            import pymysql.cursors
        except ImportError:
            raise ImportError("pymysql not installed. Run: pip install pymysql cryptography")
        if not url:
            raise ValueError("USERSTORE_MYSQL_URL must be set")
        
        # Parse URL: mysql+pymysql://user:pass@host:port/db
        import re
        m = re.match(r"mysql\+pymysql://([^:]+):([^@]+)@([^:/]+)(?::(\d+))?/([^?]+)", url)
        if not m:
            raise ValueError("Invalid MySQL URL format")
        user, password, host, port, db = m.groups()
        port = int(port) if port else 3306

        self.conn = pymysql.connect(
            host=host,
            user=user,
            password=password,
            database=db,
            port=port,
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=True
        )
        self._init_schema()

    def _init_schema(self):
        with self.conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS transactions (
                    id VARCHAR(255) PRIMARY KEY,
                    import_id VARCHAR(255),
                    user_id VARCHAR(255) NOT NULL,
                    txn_date DATE NOT NULL,
                    description TEXT,
                    merchant TEXT,
                    amount DECIMAL(14,2),
                    category VARCHAR(255),
                    confidence DECIMAL(4,2),
                    status VARCHAR(50),
                    recurring BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            try:
                cur.execute("CREATE INDEX txn_user_date_idx ON transactions(user_id, txn_date) KEY_BLOCK_SIZE=0;")
            except Exception:
                pass
            cur.execute("""
                CREATE TABLE IF NOT EXISTS rules (
                    id VARCHAR(255) PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL,
                    contains TEXT,
                    category VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS uploaded_files (
                    user_id VARCHAR(255) NOT NULL,
                    file_hash VARCHAR(255) NOT NULL,
                    filename VARCHAR(255),
                    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (user_id, file_hash)
                );
            """)

    def add_transaction(self, user_id: str, txn: dict) -> None:
        with self.conn.cursor() as cur:
            cur.execute(
                "INSERT INTO transactions (id, import_id, user_id, txn_date, description, merchant, amount, category, confidence, status, recurring) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (txn["id"], txn["importId"], user_id, txn["date"], txn["description"], txn["merchant"], float(txn["amount"]), txn["category"], float(txn["confidence"]), txn["status"], 1 if txn.get("recurring") else 0),
            )

    def update_transaction(self, user_id: str, txn_id: str, updates: dict) -> None:
        if not updates: return
        set_clause = ", ".join([f"{k} = %s" for k in updates.keys()])
        values = list(updates.values()) + [user_id, txn_id]
        with self.conn.cursor() as cur:
            cur.execute(f"UPDATE transactions SET {set_clause} WHERE user_id = %s AND id = %s", values)

    def list_transactions(self, user_id: str, month: str | None = None) -> list:
        sql = "SELECT id, import_id as importId, DATE_FORMAT(txn_date, '%Y-%m-%d') as date, description, merchant, amount, category, confidence, status, recurring FROM transactions WHERE user_id = %s"
        params = [user_id]
        if month:
            sql += " AND DATE_FORMAT(txn_date, '%Y-%m') = %s"
            params.append(month)
        sql += " ORDER BY txn_date DESC"
        with self.conn.cursor() as cur:
            cur.execute(sql, params)
            res = []
            for r in cur.fetchall():
                d = dict(r)
                d["amount"] = float(d["amount"]) if d["amount"] is not None else 0.0
                d["confidence"] = float(d["confidence"]) if d["confidence"] is not None else 0.0
                d["recurring"] = bool(d["recurring"])
                res.append(d)
            return res

    def add_rule(self, user_id: str, rule: dict) -> None:
        with self.conn.cursor() as cur:
            cur.execute(
                "INSERT INTO rules (id, user_id, contains, category) VALUES (%s, %s, %s, %s)",
                (rule["id"], user_id, rule["contains"], rule["category"])
            )

    def list_rules(self, user_id: str) -> list:
        with self.conn.cursor() as cur:
            cur.execute("SELECT id, contains, category FROM rules WHERE user_id = %s", (user_id,))
            return list(cur.fetchall())

    def clear_transactions(self, user_id: str) -> None:
        with self.conn.cursor() as cur:
            cur.execute("DELETE FROM transactions WHERE user_id = %s", (user_id,))

    def summary(self, user_id: str, month: str | None = None) -> dict:
        return _aggregate(self.list_transactions(user_id, month))

    def is_file_uploaded(self, user_id: str, file_hash: str) -> bool:
        with self.conn.cursor() as cur:
            cur.execute("SELECT 1 FROM uploaded_files WHERE user_id = %s AND file_hash = %s", (user_id, file_hash))
            return cur.fetchone() is not None

    def register_uploaded_file(self, user_id: str, file_hash: str, filename: str) -> None:
        with self.conn.cursor() as cur:
            cur.execute(
                "INSERT IGNORE INTO uploaded_files (user_id, file_hash, filename) VALUES (%s, %s, %s)",
                (user_id, file_hash, filename)
            )
