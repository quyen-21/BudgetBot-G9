import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src import handlers


def parse_error_code(payload: bytes) -> str:
    try:
        handlers._parse_csv(payload)
    except handlers.CsvValidationError as exc:
        return exc.code
    raise AssertionError("Expected CSV validation to fail")


def test_parse_csv_accepts_valid_statement():
    rows = handlers._parse_csv(
        b"date,description,amount\n2026-05-02,Highlands Coffee,-65000\n"
    )
    assert rows == [
        {
            "date": "2026-05-02",
            "description": "Highlands Coffee",
            "amount": -65000.0,
        }
    ]


def test_parse_csv_rejects_invalid_encoding():
    assert parse_error_code(b"\xff\xfe\x00") == "INVALID_ENCODING"


def test_parse_csv_rejects_malformed_csv():
    assert parse_error_code(b'date,description,amount\n2026-05-02,"Coffee,-65000\n') == "MALFORMED_CSV"


def test_parse_csv_rejects_empty_header_and_duplicate_columns():
    assert parse_error_code(b",,\n") == "EMPTY_HEADER"
    assert parse_error_code(b"date,description,amount,amount\n") == "DUPLICATE_COLUMNS"


def test_parse_csv_rejects_missing_required_columns():
    assert parse_error_code(b"date,memo,total\n2026-05-02,Coffee,-65000\n") == "INVALID_COLUMNS"


def test_parse_csv_rejects_invalid_rows():
    cases = [
        b"date,description,amount\n2026-5-2,Coffee,-65000\n",
        b"date,description,amount\n2026/05/02,Coffee,-65000\n",
        b"date,description,amount\n2026-05-02,,-65000\n",
        b"date,description,amount\n2026-05-02,Coffee,0\n",
        b"date,description,amount\n2026-05-02,Coffee,nan\n",
        b"date,description,amount\n2026-05-02,Coffee,1,2,3\n",
        b"date,description,amount\n2026-05-02,Coffee,12.345\n",
        b"date,description,amount\n2026-05-02,Coffee,1000000000001\n",
        b"date,description,amount\n2026-05-02,Coffee\n",
    ]
    for payload in cases:
        assert parse_error_code(payload) == "INVALID_ROW"


def test_parse_csv_rejects_no_valid_rows_and_too_many_rows():
    assert parse_error_code(b"date,description,amount\n\n") == "NO_VALID_ROWS"
    payload = b"date,description,amount\n" + (
        b"2026-05-02,Coffee,-1\n" * (handlers.MAX_CSV_ROWS + 1)
    )
    assert parse_error_code(payload) == "TOO_MANY_ROWS"


def test_safe_upload_filename_rejects_path_segments():
    assert handlers.safe_upload_filename("../statement.csv") == "statement.csv"
    assert handlers.safe_upload_filename("statement.csv") == "statement.csv"
