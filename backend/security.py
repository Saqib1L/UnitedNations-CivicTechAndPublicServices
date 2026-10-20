import hashlib
import hmac
import secrets
from datetime import datetime, timezone
from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session as DB
from .database import get_db
from .models import Session, User

def hash_password(password):
    salt = secrets.token_hex(16)
    digest = hashlib.scrypt(password.encode(), salt=salt.encode(), n=16384, r=8, p=1).hex()
    return f'{salt}:{digest}'

def verify_password(password, encoded):
    salt, expected = encoded.split(':')
    actual = hashlib.scrypt(password.encode(), salt=salt.encode(), n=16384, r=8, p=1).hex()
    return hmac.compare_digest(actual, expected)

def current_user(request: Request, db: DB = Depends(get_db)):
    token = request.cookies.get('estate_session', '')
    session = db.get(Session, hashlib.sha256(token.encode()).hexdigest())
    if not session or datetime.fromisoformat(session.expires) < datetime.now(timezone.utc):
        raise HTTPException(401, 'Please sign in to continue.')
    user = db.get(User, session.user_id)
    if not user:
        raise HTTPException(401, 'Account not found.')
    return user

def role(user, *roles):
    if user.role not in roles:
        raise HTTPException(403, 'This action is not available to your account.')

def profile(user):
    return {k: getattr(user, k) for k in ('id', 'name', 'email', 'role', 'organisation')}
