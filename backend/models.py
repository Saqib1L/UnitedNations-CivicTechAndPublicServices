from datetime import datetime, timezone
from sqlalchemy import String, Text, JSON, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base

def now():
    return datetime.now(timezone.utc).isoformat()

class User(Base):
    __tablename__ = 'users'
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    name: Mapped[str] = mapped_column(String(200))
    password: Mapped[str] = mapped_column(Text)
    role: Mapped[str] = mapped_column(String(30), default='family')
    organisation: Mapped[str] = mapped_column(String(200), default='')

class Session(Base):
    __tablename__ = 'sessions'
    token: Mapped[str] = mapped_column(String(128), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    expires: Mapped[str] = mapped_column(String(50))

class Estate(Base):
    __tablename__ = 'estates'
    id: Mapped[int] = mapped_column(primary_key=True)
    reference: Mapped[str] = mapped_column(String(40), unique=True)
    deceased: Mapped[str] = mapped_column(String(200))
    jurisdiction: Mapped[str] = mapped_column(String(100), default='Kuala Lumpur')
    religion: Mapped[str] = mapped_column(String(30), default='Muslim')
    stage: Mapped[int] = mapped_column(Integer, default=0)
    lawyer_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    details: Mapped[dict] = mapped_column(JSON, default=dict)
    created: Mapped[str] = mapped_column(String(50), default=now)

class Membership(Base):
    __tablename__ = 'memberships'
    __table_args__ = (UniqueConstraint('estate_id', 'user_id'),)
    id: Mapped[int] = mapped_column(primary_key=True)
    estate_id: Mapped[int] = mapped_column(ForeignKey('estates.id'))
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    coordinator: Mapped[bool] = mapped_column(default=False)

class Intake(Base):
    __tablename__ = 'intakes'
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    status: Mapped[str] = mapped_column(String(40), default='draft')
    data: Mapped[dict] = mapped_column(JSON, default=dict)
    response: Mapped[str] = mapped_column(Text, default='')
    estate_id: Mapped[int | None] = mapped_column(ForeignKey('estates.id'), nullable=True)
    created: Mapped[str] = mapped_column(String(50), default=now)

class Record(Base):
    """Typed case records; JSON payloads are validated by each command handler."""
    __tablename__ = 'records'
    id: Mapped[int] = mapped_column(primary_key=True)
    estate_id: Mapped[int] = mapped_column(ForeignKey('estates.id'))
    kind: Mapped[str] = mapped_column(String(40), index=True)
    owner_id: Mapped[int | None] = mapped_column(ForeignKey('users.id'), nullable=True)
    data: Mapped[dict] = mapped_column(JSON, default=dict)
    created: Mapped[str] = mapped_column(String(50), default=now)

class Document(Base):
    __tablename__ = 'documents'
    id: Mapped[int] = mapped_column(primary_key=True)
    estate_id: Mapped[int] = mapped_column(ForeignKey('estates.id'))
    owner_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    name: Mapped[str] = mapped_column(String(200))
    category: Mapped[str] = mapped_column(String(100))
    visibility: Mapped[str] = mapped_column(String(30), default='shared')
    revision: Mapped[int] = mapped_column(default=1)
    supersedes_id: Mapped[int | None] = mapped_column(ForeignKey('documents.id'), nullable=True)
    path: Mapped[str] = mapped_column(Text)
    media_type: Mapped[str] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(40), default='uploaded')
    comment: Mapped[str] = mapped_column(Text, default='')
    created: Mapped[str] = mapped_column(String(50), default=now)

class Submission(Base):
    __tablename__ = 'submissions'
    id: Mapped[int] = mapped_column(primary_key=True)
    estate_id: Mapped[int] = mapped_column(ForeignKey('estates.id'))
    officer_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    revision: Mapped[int] = mapped_column(Integer)
    snapshot: Mapped[dict] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(50), default='submitted')
    created: Mapped[str] = mapped_column(String(50), default=now)

class Invitation(Base):
    __tablename__ = 'invitations'
    token: Mapped[str] = mapped_column(String(128), primary_key=True)
    estate_id: Mapped[int] = mapped_column(ForeignKey('estates.id'))
    email: Mapped[str] = mapped_column(String(255))
    coordinator: Mapped[bool] = mapped_column(default=False)
    accepted: Mapped[bool] = mapped_column(default=False)
