import os
import tempfile
from pathlib import Path

TEST_DATA = tempfile.mkdtemp(prefix='estate-unlock-tests-')
os.environ['DATABASE_URL'] = f'sqlite:///{TEST_DATA}/test.db'
os.environ['DATA_DIR'] = TEST_DATA

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import Base, engine

@pytest.fixture
def clients():
    Base.metadata.drop_all(engine)
    with TestClient(app) as startup:
        pass
    users = {}
    for role, email in [('lawyer','sarah@demo.my'),('family','aina@demo.my'),('officer','daniel@demo.my'),('farid','farid@demo.my'),('outsider','mei@demo.my')]:
        client = TestClient(app)
        result = client.post('/api/auth/login', json={'email':email,'password':'Demo2026!'})
        assert result.status_code == 200, result.text
        users[role] = client
    yield users
    for client in users.values():
        client.close()

def get_case(client):
    response = client.get('/api/cases/1')
    assert response.status_code == 200, response.text
    return response.json()

def accept_documents(clients):
    family, lawyer = clients['family'], clients['lawyer']
    case = get_case(lawyer)
    doc = next(d for d in case['documents'] if d['category'] == 'Marriage certificate')
    result = family.post('/api/cases/1/documents', data={'category':'Marriage certificate','supersedes_id':doc['id']}, files={'file':('clear.txt',b'Fictional corrected marriage certificate','text/plain')})
    assert result.status_code == 200, result.text
    revision = result.json()
    assert revision['revision'] == 2 and revision['supersedes_id'] == doc['id']
    assert lawyer.post(f"/api/documents/{revision['id']}/review",json={'action':'accepted'}).status_code == 200
    return doc, revision

def submit(clients):
    accept_documents(clients)
    lawyer = clients['lawyer']
    assert lawyer.post('/api/cases/1/actions',json={'action':'ready'}).status_code == 200
    response = lawyer.post('/api/cases/1/actions',json={'action':'submit'})
    assert response.status_code == 200, response.text
    return get_case(lawyer)['submissions'][0]

def issue_order(clients):
    officer = clients['officer']
    hearing=officer.post('/api/cases/1/actions',json={'action':'hearing','data':{'date':'2026-11-20T10:30','location':'Demo hearing room'}})
    assert hearing.status_code == 200, hearing.text
    decision=officer.post('/api/cases/1/actions',json={'action':'decision','data':{'reason':'Simulated hearing recorded and evidence reviewed.'}})
    assert decision.status_code == 200, decision.text

def test_auth_and_case_isolation(clients):
    assert TestClient(app).get('/api/overview').status_code == 401
    assert clients['outsider'].get('/api/cases/1').status_code == 403
    assert clients['officer'].get('/api/cases/1').status_code == 403
    assert clients['family'].post('/api/cases',json={'deceased':'Unauthorised'}).status_code == 403
    assert clients['family'].post('/api/cases/1/actions',json={'action':'decision'}).status_code == 403
    assert clients['lawyer'].post('/api/auth/login',json={'email':'sarah@demo.my','password':'incorrect'}).status_code == 401

def test_private_document_and_note_boundaries(clients):
    full=get_case(clients['lawyer'])
    private=next(d for d in full['documents'] if d['visibility']=='private')
    assert private['id'] not in [d['id'] for d in get_case(clients['family'])['documents']]
    assert 'note' not in get_case(clients['family'])['records']
    assert clients['family'].get(f"/api/documents/{private['id']}/file").status_code == 403
    assert clients['farid'].get(f"/api/documents/{private['id']}/file").status_code == 200

def test_immutable_submission_and_officer_inventory(clients):
    first=submit(clients)
    private=next(d for d in get_case(clients['lawyer'])['documents'] if d['visibility']=='private')
    officer_case=get_case(clients['officer'])
    assert 'note' not in officer_case['records']
    assert 'details' not in officer_case['estate']
    assert private['id'] not in first['snapshot']['document_ids']
    assert clients['officer'].get(f"/api/documents/{private['id']}/file").status_code == 403
    new=clients['family'].post('/api/cases/1/documents',data={'category':'Later evidence'},files={'file':('later.txt',b'Later evidence','text/plain')}).json()
    assert new['id'] not in [d['id'] for d in get_case(clients['officer'])['documents']]
    assert clients['officer'].get(f"/api/documents/{new['id']}/file").status_code==403
    clients['lawyer'].post('/api/cases/1/records',json={'kind':'asset','data':{'name':'Unpublished asset','value':100,'type':'Bank account'}})
    overview=clients['officer'].get('/api/overview').json()
    assert overview['estates'][0]['assets_count']==4
    assert get_case(clients['lawyer'])['submissions'][0]['snapshot']==first['snapshot']

def test_query_resubmission_and_decision_gate(clients):
    submit(clients); officer=clients['officer']; lawyer=clients['lawyer']
    assert officer.post('/api/cases/1/actions',json={'action':'query','data':{'reason':'Confirm overseas contact details.'}}).status_code==200
    query=get_case(officer)['records']['query'][0]
    assert officer.post(f"/api/records/{query['id']}/action",json={'action':'resolve'}).status_code==409
    assert officer.post('/api/cases/1/actions',json={'action':'decision','data':{'reason':'Premature'}}).status_code==409
    task=next(t for t in get_case(lawyer)['records']['task'] if t['data'].get('query_id')==query['id'])
    assert lawyer.post(f"/api/records/{task['id']}/action",json={'action':'respond','data':{'response':'Overseas contact details verified.'}}).status_code==200
    assert lawyer.post(f"/api/records/{task['id']}/action",json={'action':'complete'}).status_code==200
    assert lawyer.post(f"/api/records/{task['id']}/action",json={'action':'complete'}).status_code==200
    assert lawyer.post('/api/cases/1/actions',json={'action':'submit'}).status_code==200
    case=get_case(officer)
    assert [s['revision'] for s in case['submissions']]==[2,1]
    assert case['submissions'][0]['snapshot']['responses'][0]['response']=='Overseas contact details verified.'
    assert not case['submissions'][1]['snapshot'].get('responses')
    assert officer.post(f"/api/records/{query['id']}/action",json={'action':'resolve'}).status_code==200
    issue_order(clients)
    assert get_case(lawyer)['estate']['stage']==4

def test_tasks_assignment_and_response_ownership(clients):
    lawyer=clients['lawyer']; task=get_case(lawyer)['records']['task'][0]
    assert lawyer.post(f"/api/records/{task['id']}/action",json={'action':'assign','data':{'owner_id':2}}).status_code==200
    assert clients['farid'].post(f"/api/records/{task['id']}/action",json={'action':'respond','data':{'response':'Not my task'}}).status_code==403
    assert clients['family'].post(f"/api/records/{task['id']}/action",json={'action':'respond','data':{'response':'Details confirmed.'}}).status_code==200
    assert lawyer.post(f"/api/records/{task['id']}/action",json={'action':'complete'}).status_code==200

def test_full_asset_release_completion(clients):
    submit(clients); issue_order(clients); lawyer=clients['lawyer']
    assert lawyer.post('/api/cases/1/actions',json={'action':'implement'}).status_code==200
    assert lawyer.post('/api/cases/1/actions',json={'action':'complete'}).status_code==409
    for task in get_case(lawyer)['records']['task']:
        responder=clients['family'] if task['owner_id']==2 else clients['farid']
        assert responder.post(f"/api/records/{task['id']}/action",json={'action':'respond','data':{'response':'Evidence supplied and details confirmed.'}}).status_code==200
        assert lawyer.post(f"/api/records/{task['id']}/action",json={'action':'complete'}).status_code==200
    for asset in get_case(lawyer)['records']['asset']:
        for status in ['evidence_checked','claim_prepared','submitted','approved']:
            response=lawyer.post(f"/api/records/{asset['id']}/action",json={'action':'status','data':{'status':status}})
            assert response.status_code==200,response.text
        assert lawyer.post(f"/api/records/{asset['id']}/action",json={'action':'status','data':{'status':'released'}}).status_code==400
        assert lawyer.post(f"/api/records/{asset['id']}/action",json={'action':'status','data':{'status':'released','evidence':'DEMO receipt 001, beneficiary acknowledgement recorded'}}).status_code==200
    assert lawyer.post('/api/cases/1/actions',json={'action':'complete'}).status_code==200
    assert get_case(lawyer)['estate']['stage']==6
    added=lawyer.post('/api/cases/1/records',json={'kind':'asset','data':{'name':'Newly discovered account','type':'Bank account','value':500}})
    assert added.status_code==200
    assert get_case(lawyer)['estate']['stage']==5
    assert lawyer.post('/api/cases/1/actions',json={'action':'complete'}).status_code==409

def test_intake_draft_request_accept_and_persistence(clients):
    family=clients['family']; lawyer=clients['lawyer']
    data={'deceased':'Demo new estate','jurisdiction':'Kuala Lumpur','religion':'Muslim','confirmed':True,'story':'Family circumstances retained.'}
    draft=family.post('/api/intakes',json={'data':data}).json()
    assert draft['status']=='draft'
    assert family.put(f"/api/intakes/{draft['id']}",json={'data':data,'submit':True}).status_code==200
    assert lawyer.post(f"/api/intakes/{draft['id']}/review",json={'action':'request','data':{'reason':'Confirm family members.'}}).status_code==200
    data['family']='Spouse and adult children'
    assert family.put(f"/api/intakes/{draft['id']}",json={'data':data,'submit':True}).status_code==200
    accepted=lawyer.post(f"/api/intakes/{draft['id']}/review",json={'action':'accept'}).json()
    case=family.get(f"/api/cases/{accepted['estate_id']}").json()
    assert case['estate']['details']['story']==data['story']
    assert case['is_coordinator'] is True
    assert lawyer.post(f"/api/intakes/{draft['id']}/review",json={'action':'accept'}).status_code==409

def test_invitation_identity_and_idempotency(clients):
    inv=clients['lawyer'].post('/api/cases/2/invitations',json={'email':'aina@demo.my','coordinator':True}).json()
    assert clients['outsider'].post(f"/api/invitations/{inv['token']}/accept").status_code==403
    assert clients['family'].post(f"/api/invitations/{inv['token']}/accept").status_code==200
    assert clients['family'].post(f"/api/invitations/{inv['token']}/accept").status_code==200
    case=clients['family'].get('/api/cases/2').json()
    assert len(case['members'])==1 and case['is_coordinator']

def test_file_validation_and_summary_escaping(clients):
    family=clients['family']
    assert family.post('/api/cases/1/documents',files={'file':('bad.html',b'<script>alert(1)</script>','text/html')}).status_code==400
    assert family.post('/api/cases/1/documents',files={'file':('empty.txt',b'','text/plain')}).status_code==400
    case=clients['lawyer'].post('/api/cases',json={'deceased':'<script>alert(1)</script>'}).json()
    summary=clients['lawyer'].get(f"/api/cases/{case['id']}/summary")
    assert '<script>' not in summary.text
    assert '&lt;script&gt;' in summary.text

def test_session_logout_and_origin_guard(clients):
    family=clients['family']
    assert family.post('/api/auth/logout',headers={'Origin':'https://untrusted.example'}).status_code==403
    assert family.get('/api/auth/me').status_code==200
    assert family.post('/api/auth/logout').status_code==200
    assert family.get('/api/auth/me').status_code==401
