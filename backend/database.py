import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATA = Path(os.getenv('DATA_DIR', 'data'))
DATA.mkdir(parents=True, exist_ok=True)
URL = os.getenv('DATABASE_URL', f'sqlite:///{DATA}/estate.db')
engine = create_engine(URL, connect_args={'check_same_thread': False} if URL.startswith('sqlite') else {})
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

def get_db():
    with SessionLocal() as session:
        yield session
