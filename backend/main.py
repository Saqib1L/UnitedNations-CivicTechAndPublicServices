import hashlib
import html
import math
import os
import secrets
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, Depends, HTTPException, Request, Response, UploadFile, File, Form
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel, Field
from sqlalchemy import select, delete
from sqlalchemy.orm import Session as DB

from .database import Base, DATA, engine, get_db, SessionLocal
from .models import User, Session, Estate, Membership, Intake, Record, Document, Submission, Invitation, now
from .security import hash_password, verify_password, current_user, profile, role

@asynccontextmanager
async def lifespan(app):
    Base.metadata.create_all(engine)
    from .seed import seed
    with SessionLocal() as db:
        seed(db)
    yield

app = FastAPI(title='Estate Unlock · Demo API', lifespan=lifespan, docs_url='/api/docs', openapi_url='/api/openapi.json')

@app.middleware('http')
async def origin_guard(request: Request, call_next):
    origin = request.headers.get('origin')
    allowed = os.getenv('APP_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000').split(',')
    if request.method not in ('GET', 'HEAD', 'OPTIONS') and origin and origin not in allowed:
        from fastapi.responses import JSONResponse
        return JSONResponse({'detail': 'Origin not allowed.'}, status_code=403)
    return await call_next(request)

def dump(obj):
    return {col.name: getattr(obj, col.name) for col in obj.__table__.columns}

def event(db, estate_id, actor, title, detail='', private=False):
    db.add(Record(estate_id=estate_id, kind='activity', owner_id=actor.id,
        data={'title': title, 'detail': detail, 'actor': actor.name, 'private': private}))
    targets = list(db.scalars(select(Membership.user_id).where(Membership.estate_id == estate_id)))
    estate = db.get(Estate, estate_id)
    if estate:
        targets.append(estate.lawyer_id)
    if not private:
        targets += list(db.scalars(select(Submission.officer_id).where(Submission.estate_id == estate_id)))
    for target in set(targets):
        if target != actor.id and (not private or db.get(User, target).role == 'lawyer'):
            db.add(Record(estate_id=estate_id, kind='notification', owner_id=target,
                data={'title': title, 'detail': detail, 'read': False}))

def estate_access(db, user, estate_id):
    estate = db.get(Estate, estate_id)
    if not estate:
        raise HTTPException(404, 'Estate case not found.')
    if user.role == 'lawyer':
        lawyer = db.get(User, estate.lawyer_id)
        allowed = lawyer.organisation == user.organisation
    elif user.role == 'officer':
        allowed = db.scalar(select(Submission.id).where(Submission.estate_id == estate_id, Submission.officer_id == user.id)) is not None
    else:
        allowed = db.scalar(select(Membership.id).where(Membership.estate_id == estate_id, Membership.user_id == user.id)) is not None
    if not allowed:
        raise HTTPException(403, 'You do not have access to this estate.')
    return estate

def coordinator(db, user, estate_id):
    return user.role == 'lawyer' or bool(db.scalar(select(Membership.coordinator).where(Membership.estate_id == estate_id, Membership.user_id == user.id)))

def submissions_for(db, estate_id, user):
    query = select(Submission).where(Submission.estate_id == estate_id).order_by(Submission.revision.desc())
    if user.role == 'officer':
        query = query.where(Submission.officer_id == user.id)
    return list(db.scalars(query))

def visible_docs(db, user, estate_id):
    docs = list(db.scalars(select(Document).where(Document.estate_id == estate_id).order_by(Document.id.desc())))
    if user.role == 'lawyer':
        return docs
    if user.role == 'family':
        return [d for d in docs if d.visibility == 'shared' or d.owner_id == user.id]
    ids = {i for s in submissions_for(db, estate_id, user) for i in s.snapshot.get('document_ids', [])}
    return [d for d in docs if d.id in ids]

class Credentials(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=8, max_length=200)
    name: str = Field(default='', max_length=150)

def set_session(db, user, response):
    token = secrets.token_urlsafe(40)
    db.add(Session(token=hashlib.sha256(token.encode()).hexdigest(), user_id=user.id,
        expires=(datetime.now(timezone.utc) + timedelta(days=7)).isoformat()))
    db.commit()
    response.set_cookie('estate_session', token, httponly=True, samesite='lax', max_age=604800,
        secure=os.getenv('COOKIE_SECURE') == 'true', path='/')

@app.get('/api/health')
def health():
    return {'status': 'ok', 'mode': 'proof-of-concept'}

@app.post('/api/auth/register')
def register(body: Credentials, response: Response, db: DB = Depends(get_db)):
    email = body.email.strip().lower()
    if '@' not in email or not body.name.strip():
        raise HTTPException(400, 'Enter your name and a valid email address.')
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(409, 'An account with this email already exists. Sign in instead.')
    user = User(email=email, name=body.name.strip(), password=hash_password(body.password), role='family')
    db.add(user); db.flush(); set_session(db, user, response)
    return profile(user)

@app.post('/api/auth/login')
def login(body: Credentials, response: Response, db: DB = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == body.email.strip().lower()))
    if not user or not verify_password(body.password, user.password):
        raise HTTPException(401, 'Email or password is incorrect.')
    set_session(db, user, response)
    return profile(user)

@app.post('/api/auth/logout')
def logout(request: Request, response: Response, db: DB = Depends(get_db)):
    token = hashlib.sha256(request.cookies.get('estate_session', '').encode()).hexdigest()
    db.execute(delete(Session).where(Session.token == token)); db.commit()
    response.delete_cookie('estate_session', path='/')
    return {'ok': True}

@app.get('/api/auth/me')
def me(user: User = Depends(current_user)):
    return profile(user)

@app.get('/api/overview')
def overview(db: DB = Depends(get_db), user: User = Depends(current_user)):
    estates = []
    for estate in db.scalars(select(Estate).order_by(Estate.id)):
        try:
            estate_access(db, user, estate.id)
        except HTTPException:
            continue
        row = dump(estate)
        assets = list(db.scalars(select(Record).where(Record.estate_id == estate.id, Record.kind == 'asset')))
        row['assets_count'] = len(assets)
        row['released_count'] = sum(a.data.get('status') == 'released' for a in assets)
        row['value'] = sum(a.data.get('value', 0) for a in assets)
        if user.role == 'officer':
            published = submissions_for(db, estate.id, user)[0]
            published_assets = [r['data'] for r in published.snapshot['records'] if r['kind'] == 'asset']
            row['assets_count'] = len(published_assets)
            row['released_count'] = sum(a.get('status') == 'released' for a in published_assets)
            row['value'] = sum(a.get('value', 0) for a in published_assets)
            row.pop('details', None)
        row['lawyer'] = db.get(User, estate.lawyer_id).name
        row['tasks_count'] = len([r for r in db.scalars(select(Record).where(Record.estate_id == estate.id, Record.kind == 'task')) if r.data.get('status') != 'completed' and (user.role != 'family' or r.owner_id == user.id)])
        estates.append(row)
    intakes = list(db.scalars(select(Intake).order_by(Intake.id.desc()))) if user.role == 'lawyer' else list(db.scalars(select(Intake).where(Intake.user_id == user.id))) if user.role == 'family' else []
    enquiries = []
    for intake in intakes:
        if user.role == 'lawyer' and intake.status == 'draft':
            continue
        row = dump(intake); row['applicant'] = profile(db.get(User, intake.user_id)); enquiries.append(row)
    notices = [dump(n) for n in db.scalars(select(Record).where(Record.kind == 'notification', Record.owner_id == user.id).order_by(Record.id.desc()).limit(40))]
    return {'estates': estates, 'intakes': enquiries, 'notifications': notices}

@app.get('/api/cases/{estate_id}')
def case_detail(estate_id: int, db: DB = Depends(get_db), user: User = Depends(current_user)):
    estate = estate_access(db, user, estate_id)
    records = list(db.scalars(select(Record).where(Record.estate_id == estate_id).order_by(Record.id.desc())))
    groups = {}
    for r in records:
        if r.kind == 'notification' or (r.data.get('private') and user.role != 'lawyer'):
            continue
        if user.role == 'family' and r.kind == 'task' and r.owner_id != user.id:
            continue
        if user.role == 'officer' and r.kind not in ('query', 'hearing', 'decision', 'activity'):
            continue
        if user.role == 'officer' and r.kind == 'activity' and not r.data.get('agency'):
            continue
        groups.setdefault(r.kind, []).append(dump(r))
    members = [{'user': profile(db.get(User, m.user_id)), 'coordinator': m.coordinator} for m in db.scalars(select(Membership).where(Membership.estate_id == estate_id))] if user.role != 'officer' else []
    invs = [dump(i) for i in db.scalars(select(Invitation).where(Invitation.estate_id == estate_id))] if user.role == 'lawyer' else []
    row = dump(estate)
    if user.role == 'officer':
        row.pop('details', None)
    return {'estate': row, 'lawyer': profile(db.get(User, estate.lawyer_id)), 'records': groups,
        'documents': [dict(dump(d), path=None) for d in visible_docs(db, user, estate_id)],
        'submissions': [dump(s) for s in submissions_for(db, estate_id, user)], 'members': members,
        'invitations': invs, 'is_coordinator': coordinator(db, user, estate_id)}

class IntakeInput(BaseModel):
    data: dict
    submit: bool = False

@app.post('/api/intakes')
def create_intake(body: IntakeInput, db: DB = Depends(get_db), user: User = Depends(current_user)):
    role(user, 'family')
    intake = Intake(user_id=user.id)
    db.add(intake); db.flush()
    return save_intake(intake.id, body, db, user)

@app.put('/api/intakes/{intake_id}')
def save_intake(intake_id: int, body: IntakeInput, db: DB = Depends(get_db), user: User = Depends(current_user)):
    role(user, 'family')
    intake = db.get(Intake, intake_id)
    if not intake or intake.user_id != user.id:
        raise HTTPException(403, 'This enquiry does not belong to you.')
    if intake.status not in ('draft', 'information_requested'):
        raise HTTPException(409, 'This enquiry has already been submitted. Respond to a request before editing.')
    if body.submit and (not str(body.data.get('deceased', '')).strip() or not body.data.get('confirmed')):
        raise HTTPException(400, 'Add the deceased’s name and confirm the intake facts.')
    intake.data = body.data
    if body.submit:
        intake.status = 'submitted'
    db.commit()
    return dump(intake)

class Action(BaseModel):
    action: str
    data: dict = Field(default_factory=dict)

@app.post('/api/intakes/{intake_id}/review')
def review_intake(intake_id: int, body: Action, db: DB = Depends(get_db), user: User = Depends(current_user)):
    role(user, 'lawyer')
    intake = db.get(Intake, intake_id)
    if not intake or intake.status not in ('submitted', 'information_requested'):
        raise HTTPException(409, 'This enquiry is not awaiting review.')
    if body.action in ('request', 'decline'):
        reason = str(body.data.get('reason', '')).strip()
        if not reason:
            raise HTTPException(400, 'Include a reason or the information required.')
        intake.status = 'information_requested' if body.action == 'request' else 'declined'
        intake.response = reason
    elif body.action == 'accept':
        estate = Estate(reference=f'EU-2026-{secrets.token_hex(3).upper()}', deceased=intake.data['deceased'],
            jurisdiction=intake.data.get('jurisdiction', 'Kuala Lumpur'), religion=intake.data.get('religion', 'Muslim'), lawyer_id=user.id, details=intake.data)
        db.add(estate); db.flush()
        db.add(Membership(estate_id=estate.id, user_id=intake.user_id, coordinator=True))
        intake.status = 'accepted'; intake.estate_id = estate.id
        event(db, estate.id, user, 'Your enquiry has been accepted', 'Your estate workspace is ready.')
    else:
        raise HTTPException(400, 'Unknown review action.')
    db.commit(); return dump(intake)

class CaseInput(BaseModel):
    deceased: str = Field(min_length=2, max_length=200)
    jurisdiction: str = 'Kuala Lumpur'
    religion: str = 'Muslim'

@app.post('/api/cases')
def create_case(body: CaseInput, db: DB = Depends(get_db), user: User = Depends(current_user)):
    role(user, 'lawyer')
    estate = Estate(**body.model_dump(), reference=f'EU-2026-{secrets.token_hex(3).upper()}', lawyer_id=user.id)
    db.add(estate); db.flush(); event(db, estate.id, user, 'Estate case opened'); db.commit()
    return dump(estate)

@app.put('/api/cases/{estate_id}/details')
def update_details(estate_id: int, body: IntakeInput, db: DB = Depends(get_db), user: User = Depends(current_user)):
    estate = estate_access(db, user, estate_id)
    if user.role == 'officer' or not coordinator(db, user, estate_id):
        raise HTTPException(403, 'Only the coordinator or law firm can update intake details.')
    allowed = {'story','family','assets','documents','nomination','death_date','confirmed'}
    estate.details = {**estate.details, **{k:v for k,v in body.data.items() if k in allowed}}
    event(db, estate_id, user, 'Family intake details updated')
    db.commit(); return dump(estate)

class InviteInput(BaseModel):
    email: str
    coordinator: bool = False

@app.post('/api/cases/{estate_id}/invitations')
def invite(estate_id: int, body: InviteInput, db: DB = Depends(get_db), user: User = Depends(current_user)):
    role(user, 'lawyer'); estate_access(db, user, estate_id)
    email = body.email.strip().lower()
    if '@' not in email:
        raise HTTPException(400, 'Enter a valid invitation email.')
    inv = Invitation(token=secrets.token_urlsafe(24), estate_id=estate_id, email=email, coordinator=body.coordinator)
    db.add(inv); event(db, estate_id, user, 'Family invitation created', email, private=True); db.commit()
    return dump(inv)

@app.get('/api/invitations/{token}')
def invitation_info(token: str, db: DB = Depends(get_db), user: User = Depends(current_user)):
    inv = db.get(Invitation, token)
    if not inv or inv.email != user.email:
        raise HTTPException(403, 'Sign in with the email address this invitation was sent to.')
    return {'email': inv.email, 'deceased': db.get(Estate, inv.estate_id).deceased, 'accepted': inv.accepted}

@app.post('/api/invitations/{token}/accept')
def accept_invitation(token: str, db: DB = Depends(get_db), user: User = Depends(current_user)):
    role(user, 'family')
    inv = db.get(Invitation, token)
    if not inv or inv.email != user.email:
        raise HTTPException(403, 'This invitation belongs to another email address.')
    if not db.scalar(select(Membership).where(Membership.estate_id == inv.estate_id, Membership.user_id == user.id)):
        db.add(Membership(estate_id=inv.estate_id, user_id=user.id, coordinator=inv.coordinator))
    inv.accepted = True
    event(db, inv.estate_id, user, 'Family invitation accepted', user.name); db.commit()
    return {'estate_id': inv.estate_id}

@app.post('/api/cases/{estate_id}/documents')
async def upload(estate_id: int, file: UploadFile = File(...), category: str = Form('Supporting document'), visibility: str = Form('shared'), supersedes_id: int | None = Form(None), db: DB = Depends(get_db), user: User = Depends(current_user)):
    role(user, 'family', 'lawyer'); estate_access(db, user, estate_id)
    if visibility not in ('shared', 'private'):
        raise HTTPException(400, 'Invalid document visibility.')
    allowed = {'.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.txt': 'text/plain'}
    ext = Path(file.filename or '').suffix.lower()
    if ext not in allowed:
        raise HTTPException(400, 'Upload a PDF, PNG, JPEG or text file.')
    content = await file.read(10 * 1024 * 1024 + 1)
    if not content or len(content) > 10 * 1024 * 1024:
        raise HTTPException(400, 'Choose a non-empty file under 10 MB.')
    previous = db.get(Document, supersedes_id) if supersedes_id else None
    if supersedes_id and (not previous or previous.estate_id != estate_id or (user.role == 'family' and previous.owner_id != user.id)):
        raise HTTPException(403, 'You cannot revise this document.')
    if previous:
        child = db.scalar(select(Document.id).where(Document.supersedes_id == previous.id))
        if child:
            raise HTTPException(409, 'A newer revision already exists. Refresh and revise the latest document.')
        visibility = previous.visibility
        category = previous.category
    folder = DATA / 'uploads'; folder.mkdir(exist_ok=True)
    path = folder / (secrets.token_hex(20) + ext); path.write_bytes(content)
    doc = Document(estate_id=estate_id, owner_id=previous.owner_id if previous else user.id,
        name=Path(file.filename or 'document').name[:200], category=category[:100], visibility=visibility,
        path=str(path), media_type=allowed[ext], revision=previous.revision + 1 if previous else 1, supersedes_id=supersedes_id)
    db.add(doc); event(db, estate_id, user, 'Document uploaded', doc.category, private=visibility=='private'); db.commit()
    return dict(dump(doc), path=None)

@app.get('/api/documents/{document_id}/file')
def document_file(document_id: int, db: DB = Depends(get_db), user: User = Depends(current_user)):
    doc = db.get(Document, document_id)
    if not doc:
        raise HTTPException(404, 'Document not found.')
    estate_access(db, user, doc.estate_id)
    if doc.id not in {d.id for d in visible_docs(db, user, doc.estate_id)}:
        raise HTTPException(403, 'This document is private or has not been submitted to your office.')
    if not Path(doc.path).is_file():
        raise HTTPException(404, 'The original file is unavailable.')
    return FileResponse(doc.path, media_type=doc.media_type, filename=doc.name, content_disposition_type='inline', headers={'X-Content-Type-Options': 'nosniff'})

@app.post('/api/documents/{document_id}/review')
def review_document(document_id: int, body: Action, db: DB = Depends(get_db), user: User = Depends(current_user)):
    role(user, 'lawyer')
    doc = db.get(Document, document_id)
    if not doc:
        raise HTTPException(404, 'Document not found.')
    estate_access(db, user, doc.estate_id)
    if body.action not in ('accepted', 'under_review', 'correction_requested'):
        raise HTTPException(400, 'Invalid document review status.')
    if db.scalar(select(Document.id).where(Document.supersedes_id == doc.id)):
        raise HTTPException(409, 'Review the latest revision.')
    if body.action == 'correction_requested' and not str(body.data.get('comment', '')).strip():
        raise HTTPException(400, 'Explain the correction required.')
    doc.status = body.action; doc.comment = str(body.data.get('comment', ''))
    if body.action == 'correction_requested':
        db.add(Record(estate_id=doc.estate_id, kind='task', owner_id=doc.owner_id,
            data={'title': f'Correct {doc.category.lower()}', 'description': doc.comment, 'status': 'open', 'document_id': doc.id, 'private': doc.visibility == 'private', 'response': ''}))
    event(db, doc.estate_id, user, 'Document review updated', f'{doc.category}: {body.action.replace("_", " ")}', private=doc.visibility=='private'); db.commit()
    return dict(dump(doc), path=None)

class RecordInput(BaseModel):
    kind: Literal['person', 'asset', 'liability', 'task', 'fee', 'note']
    data: dict
    owner_id: int | None = None

@app.post('/api/cases/{estate_id}/records')
def add_record(estate_id: int, body: RecordInput, db: DB = Depends(get_db), user: User = Depends(current_user)):
    estate_access(db, user, estate_id)
    if user.role != 'lawyer' and (user.role != 'family' or not coordinator(db, user, estate_id) or body.kind not in ('person', 'asset', 'liability')):
        raise HTTPException(403, 'You cannot add this type of case record.')
    data = body.data.copy()
    if not str(data.get('name') or data.get('title') or '').strip():
        raise HTTPException(400, 'Add a name or title.')
    if body.kind in ('asset', 'liability', 'fee'):
        try:
            value = float(data.get('value', 0))
            if not math.isfinite(value) or value < 0 or value > 1e12:
                raise ValueError()
        except (TypeError, ValueError):
            raise HTTPException(400, 'Enter a valid non-negative amount.')
        data['value'] = value
    if body.kind == 'asset':
        data['status'] = 'identified'
        estate = db.get(Estate, estate_id)
        if estate.stage == 6:
            estate.stage = 5
            event(db, estate_id, user, 'Case reopened for an additional asset', 'Review whether supplemental authority is needed before progressing the new claim.')
    if body.kind == 'task':
        member_ids = set(db.scalars(select(Membership.user_id).where(Membership.estate_id == estate_id)))
        if body.owner_id not in member_ids | {db.get(Estate, estate_id).lawyer_id}:
            raise HTTPException(400, 'Assign this task to a case member.')
        data['status'] = 'open'
    if body.kind == 'fee':
        data['status'] = 'estimated'; data['simulated'] = True
    if body.kind == 'note':
        data['private'] = True
    rec = Record(estate_id=estate_id, kind=body.kind, owner_id=body.owner_id or user.id, data=data)
    db.add(rec); event(db, estate_id, user, f'{body.kind.capitalize()} added', str(data.get('name') or data.get('title')), private=body.kind=='note'); db.commit()
    return dump(rec)

@app.post('/api/records/{record_id}/action')
def record_action(record_id: int, body: Action, db: DB = Depends(get_db), user: User = Depends(current_user)):
    rec = db.get(Record, record_id)
    if not rec:
        raise HTTPException(404, 'Record not found.')
    estate = estate_access(db, user, rec.estate_id)
    data = rec.data.copy()
    if rec.kind == 'task' and body.action == 'assign':
        role(user, 'lawyer')
        owner = body.data.get('owner_id')
        if owner != estate.lawyer_id and not db.scalar(select(Membership.id).where(Membership.estate_id == rec.estate_id, Membership.user_id == owner)):
            raise HTTPException(400, 'Assign the task to a case member.')
        if data.get('status') == 'completed':
            raise HTTPException(409, 'Completed tasks cannot be reassigned.')
        rec.owner_id = owner
    elif rec.kind == 'task' and body.action == 'respond':
        if rec.owner_id != user.id:
            raise HTTPException(403, 'Only the assigned person can respond.')
        if not str(body.data.get('response', '')).strip():
            raise HTTPException(400, 'Include a response.')
        if data.get('status') == 'completed':
            raise HTTPException(409, 'This task is already completed.')
        data.update(response=body.data['response'], status='responded')
    elif rec.kind == 'task' and body.action == 'complete':
        role(user, 'lawyer')
        if data.get('status') == 'completed':
            return dump(rec)
        if data.get('status') != 'responded':
            raise HTTPException(409, 'Review the assigned person’s response before completing the task.')
        data['status'] = 'completed'
    elif rec.kind == 'asset' and body.action == 'status':
        role(user, 'lawyer')
        order = ['identified', 'evidence_checked', 'claim_prepared', 'submitted', 'query', 'approved', 'released']
        status = body.data.get('status')
        if status not in order:
            raise HTTPException(400, 'Invalid asset status.')
        current = data.get('status', 'identified')
        allowed = {'identified':['evidence_checked'], 'evidence_checked':['claim_prepared'], 'claim_prepared':['submitted'], 'submitted':['query','approved'], 'query':['submitted'], 'approved':['released'], 'released':[]}
        if status not in allowed.get(current, []):
            raise HTTPException(409, 'Follow the asset-claim stages in order.')
        if status in ('claim_prepared', 'submitted', 'approved', 'released') and estate.stage < 4:
            raise HTTPException(409, 'The simulated order must be issued before estate asset implementation.')
        if status == 'released' and not str(body.data.get('evidence', '')).strip():
            raise HTTPException(400, 'Record release or registration evidence.')
        data['status'] = status
        if body.data.get('evidence'):
            data['evidence'] = body.data['evidence']
    elif rec.kind == 'fee' and body.action == 'paid':
        role(user, 'lawyer'); data.update(status='paid', simulated=True)
    elif rec.kind == 'query' and body.action == 'resolve':
        role(user, 'officer')
        if not submissions_for(db, rec.estate_id, user) or submissions_for(db, rec.estate_id, user)[0].revision <= data.get('submission_revision', 0):
            raise HTTPException(409, 'Review a new resubmission before resolving this query.')
        data['status'] = 'resolved'
    elif rec.kind == 'notification' and body.action == 'read':
        if rec.owner_id != user.id:
            raise HTTPException(403, 'This notification belongs to another user.')
        data['read'] = True
    else:
        raise HTTPException(400, 'Unsupported record action.')
    rec.data = data
    if rec.kind != 'notification':
        event(db, rec.estate_id, user, f'{rec.kind.capitalize()} updated', str(data.get('title') or data.get('name') or ''), private=bool(data.get('private')))
    db.commit(); return dump(rec)

@app.post('/api/cases/{estate_id}/actions')
def case_action(estate_id: int, body: Action, db: DB = Depends(get_db), user: User = Depends(current_user)):
    estate = estate_access(db, user, estate_id)
    role(user, 'lawyer', 'officer')
    latest = submissions_for(db, estate_id, user)
    if body.action == 'ready':
        role(user, 'lawyer')
        docs = list(db.scalars(select(Document).where(Document.estate_id == estate_id, Document.visibility == 'shared')))
        superseded = {d.supersedes_id for d in docs}
        current = [d for d in docs if d.id not in superseded]
        if not current or any(d.status != 'accepted' for d in current):
            raise HTTPException(409, 'Accept all current shared document revisions before completing legal review.')
        if not db.scalar(select(Record.id).where(Record.estate_id == estate_id, Record.kind == 'asset')):
            raise HTTPException(409, 'Add at least one estate asset.')
        if estate.stage > 2:
            raise HTTPException(409, 'The application has already been submitted.')
        estate.stage = 2
        title = 'Legal review completed'
    elif body.action == 'submit':
        role(user, 'lawyer')
        if estate.stage not in (2,3):
            raise HTTPException(409, 'Complete legal review before submitting.')
        docs = list(db.scalars(select(Document).where(Document.estate_id == estate_id, Document.visibility == 'shared')))
        superseded = {d.supersedes_id for d in docs}; docs = [d for d in docs if d.id not in superseded]
        if not docs or any(d.status != 'accepted' for d in docs):
            raise HTTPException(409, 'Accept the latest shared documents before submitting.')
        if latest and latest[0].status != 'correction_requested':
            raise HTTPException(409, 'The office has not requested a resubmission.')
        officer = db.scalar(select(User).where(User.role == 'officer'))
        snapshot = {'document_ids': [d.id for d in docs], 'deceased': estate.deceased, 'jurisdiction': estate.jurisdiction,
            'religion': estate.religion, 'records': [dump(r) for r in db.scalars(select(Record).where(Record.estate_id == estate_id, Record.kind.in_(['asset','liability','person'])))]}
        snapshot['responses'] = [
            {'query_id': r.data['query_id'], 'title': r.data.get('title'), 'response': r.data.get('response', '')}
            for r in db.scalars(select(Record).where(Record.estate_id == estate_id, Record.kind == 'task'))
            if r.data.get('query_id') and r.data.get('status') == 'completed' and not r.data.get('private')
        ]
        sub = Submission(estate_id=estate_id, officer_id=officer.id, revision=latest[0].revision+1 if latest else 1, snapshot=snapshot)
        db.add(sub); estate.stage=3; title='Application resubmitted' if latest else 'Application submitted'
    elif body.action == 'query':
        role(user, 'officer')
        if not latest or estate.stage != 3:
            raise HTTPException(409, 'No application awaiting review.')
        text = str(body.data.get('reason', '')).strip()
        if not text:
            raise HTTPException(400, 'Describe the correction required.')
        owner = int(body.data.get('owner_id') or estate.lawyer_id)
        if owner != estate.lawyer_id and not db.scalar(select(Membership.id).where(Membership.estate_id == estate_id, Membership.user_id == owner)):
            raise HTTPException(400, 'Assign the request to a case member.')
        query = Record(estate_id=estate_id, kind='query', owner_id=user.id, data={'title':'Application correction', 'description':text, 'status':'open', 'submission_revision':latest[0].revision})
        db.add(query); db.flush()
        db.add(Record(estate_id=estate_id, kind='task', owner_id=owner, data={'title':'Respond to agency query', 'description':text, 'query_id':query.id, 'status':'open', 'response':''}))
        latest[0].status='correction_requested'; title='Agency requested a correction'
    elif body.action == 'hearing':
        role(user, 'officer')
        if estate.stage != 3 or not latest:
            raise HTTPException(409, 'The application must be under agency review.')
        date = str(body.data.get('date', ''))
        location = str(body.data.get('location', '')).strip()
        try:
            datetime.fromisoformat(date)
        except ValueError:
            raise HTTPException(400, 'Choose a valid hearing date and time.')
        if not location:
            raise HTTPException(400, 'Enter the hearing location.')
        db.add(Record(estate_id=estate_id, kind='hearing', owner_id=user.id, data={'date':date, 'location':location, 'status':'scheduled', 'simulated':True}))
        title='Simulated hearing scheduled'
    elif body.action == 'decision':
        role(user, 'officer')
        if estate.stage != 3 or not latest:
            raise HTTPException(409, 'No application awaiting a decision.')
        queries = list(db.scalars(select(Record).where(Record.estate_id == estate_id, Record.kind == 'query')))
        if any(q.data.get('status') != 'resolved' for q in queries):
            raise HTTPException(409, 'Resolve outstanding queries before issuing a decision.')
        if not db.scalar(select(Record.id).where(Record.estate_id == estate_id, Record.kind == 'hearing')):
            raise HTTPException(409, 'Record a simulated hearing before issuing the order.')
        if not str(body.data.get('reason', '')).strip():
            raise HTTPException(400, 'Record the decision notes.')
        db.add(Record(estate_id=estate_id, kind='decision', owner_id=user.id, data={'title':'Simulated distribution order', 'description':body.data['reason'], 'reference':f'DEMO-ORDER-{estate.reference}', 'simulated':True}))
        latest[0].status='order_issued'; estate.stage=4; title='Simulated order issued'
    elif body.action == 'implement':
        role(user, 'lawyer')
        if estate.stage != 4:
            raise HTTPException(409, 'An issued order is required.')
        estate.stage=5; title='Asset implementation started'
    elif body.action == 'complete':
        role(user, 'lawyer')
        assets = list(db.scalars(select(Record).where(Record.estate_id == estate_id, Record.kind == 'asset')))
        if estate.stage != 5 or not assets or any(a.data.get('status') != 'released' or not a.data.get('evidence') for a in assets):
            raise HTTPException(409, 'Release every asset with evidence before completing the case.')
        tasks = list(db.scalars(select(Record).where(Record.estate_id == estate_id, Record.kind == 'task')))
        if any(t.data.get('status') != 'completed' for t in tasks):
            raise HTTPException(409, 'Review and complete outstanding tasks before closing the estate.')
        estate.stage=6; title='Estate case completed'
    else:
        raise HTTPException(400, 'Unknown case action.')
    event(db, estate_id, user, title, str(body.data.get('reason', '')))
    db.flush()
    activity = db.scalars(select(Record).where(Record.estate_id == estate_id, Record.kind == 'activity').order_by(Record.id.desc())).first()
    if activity:
        activity.data = {**activity.data, 'agency': True}
    db.commit(); return {'stage': estate.stage, 'message': title}

@app.get('/api/cases/{estate_id}/summary')
def summary(estate_id: int, db: DB = Depends(get_db), user: User = Depends(current_user)):
    estate = estate_access(db, user, estate_id)
    e = html.escape
    assets = list(db.scalars(select(Record).where(Record.estate_id == estate_id, Record.kind == 'asset'))) if user.role != 'officer' else []
    sub = submissions_for(db, estate_id, user)
    asset_data = [a.data for a in assets] if user.role != 'officer' else [r['data'] for r in sub[0].snapshot['records'] if r['kind']=='asset']
    rows=''.join(f'<tr><td>{e(str(a.get("name", "")))}</td><td>RM {float(a.get("value",0)):,.2f}</td><td>{e(str(a.get("status", "identified")))}</td></tr>' for a in asset_data)
    content=f'''<!doctype html><html lang="en"><meta charset="utf-8"><title>Estate preparation summary</title><style>body{{font:16px/1.6 system-ui;max-width:850px;margin:60px auto;padding:24px;color:#142c40}}table{{width:100%;border-collapse:collapse}}td,th{{text-align:left;padding:12px;border-bottom:1px solid #ddd}}small{{color:#64748b}}</style><h1>Estate Unlock</h1><p><strong>SIMULATED DEMO · NOT AN OFFICIAL ORDER</strong></p><h2>{e(estate.deceased)}</h2><p>{e(estate.reference)} · {e(estate.jurisdiction)} · {e(estate.religion)}</p><h3>Asset inventory</h3><table><tr><th>Asset</th><th>Estimated value</th><th>Status</th></tr>{rows}</table><p>Prepared {e(now())}. All figures are illustrative and require professional review. This preparation summary is not a grant, legal advice or executed consent.</p><small>Use your browser’s print command to print or save this summary.</small></html>'''
    return HTMLResponse(content, headers={'Content-Disposition': f'attachment; filename="{estate.reference}-summary.html"'})
