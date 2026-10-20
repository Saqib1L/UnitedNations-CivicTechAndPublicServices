import argparse
from sqlalchemy import select, text
from .database import Base, DATA, engine, SessionLocal
from .models import User, Estate, Membership, Record, Document, Intake
from .security import hash_password

PASSWORD = 'Demo2026!'

def seed(db):
    if db.scalar(select(User.id)):
        return
    users = [
        User(id=1, name='Sarah Rahman', email='sarah@demo.my', role='lawyer', organisation='Rahman & Partners', password=hash_password(PASSWORD)),
        User(id=2, name='Aina Abdullah', email='aina@demo.my', role='family', password=hash_password(PASSWORD)),
        User(id=3, name='Daniel Azman', email='daniel@demo.my', role='officer', organisation='JKPTG · Demo office', password=hash_password(PASSWORD)),
        User(id=4, name='Farid Abdullah', email='farid@demo.my', role='family', password=hash_password(PASSWORD)),
        User(id=5, name='Mei Tan', email='mei@demo.my', role='family', password=hash_password(PASSWORD)),
    ]
    db.add_all(users); db.flush()
    db.add_all([
        Estate(id=1, reference='EU-2026-0042', deceased='Ahmad bin Abdullah', stage=1, lawyer_id=1, details={'death_date':'2026-09-14', 'route':'Muslim small estate · illustrative', 'note':'One family. One clear path forward.', 'story':'Our father passed away leaving a home, savings, ASNB units and a vehicle. One son lives overseas.', 'confirmed':True}),
        Estate(id=2, reference='EU-2026-0041', deceased='Fatimah binti Hassan', jurisdiction='Selangor', stage=0, lawyer_id=1),
        Estate(id=3, reference='EU-2026-0039', deceased='Lim Wei Ming', religion='Non-Muslim', stage=0, lawyer_id=1),
    ]); db.flush()
    db.add_all([Membership(estate_id=1,user_id=2,coordinator=True),Membership(estate_id=1,user_id=4),Membership(estate_id=3,user_id=5,coordinator=True)])
    def record(kind, data, owner=1, estate=1):
        db.add(Record(estate_id=estate,kind=kind,owner_id=owner,data=data))
    for name, relationship, location in [('Siti Aminah','Spouse','Kuala Lumpur'),('Aina Abdullah','Daughter · coordinator','Kuala Lumpur'),('Farid Abdullah','Son','London, United Kingdom'),('Hakim Abdullah','Son','Kuala Lumpur')]:
        record('person',{'name':name,'relationship':relationship,'location':location})
    for name, typ, value, description in [
        ('Family home','Property',850000,'Taman Melawati · title evidence collected'),
        ('Maybank savings','Bank account',180000,'Account ending 4821 · authority required'),
        ('ASNB investments','Investment',95000,'Unit trust holdings · claim pack required'),
        ('Honda City','Vehicle',75000,'Vehicle registration · transfer pending'),
    ]:
        record('asset',{'name':name,'type':typ,'value':value,'description':description,'status':'identified'})
    record('liability',{'name':'Outstanding home financing','value':120000,'description':'Illustrative lender statement; confirm before distribution'})
    record('fee',{'name':'Professional preparation estimate','value':1800,'status':'estimated','simulated':True,'description':'Illustrative estimate; not a quoted government charge'})
    record('fee',{'name':'Document and search allowance','value':150,'status':'estimated','simulated':True})
    record('note',{'title':'Professional review note','description':'Confirm nomination capacities and the original title before submitting. This note is private to the law firm.','private':True})
    folder=DATA/'uploads'; folder.mkdir(exist_ok=True)
    for name,category,status,owner,visibility,text in [
        ('death-certificate-demo.txt','Death certificate','accepted',2,'shared','DEMO DOCUMENT — FICTIONAL\nDeath record: Ahmad bin Abdullah\nDate of death: 14 September 2026\nNot an official certificate.'),
        ('marriage-certificate-demo.txt','Marriage certificate','correction_requested',2,'shared','DEMO DOCUMENT — FICTIONAL\nMarriage record: Ahmad bin Abdullah and Siti Aminah.\nThis example represents a low-quality scan requiring replacement.'),
        ('asset-schedule-demo.txt','Asset schedule','accepted',2,'shared','DEMO DOCUMENT — FICTIONAL\nHome RM850,000; savings RM180,000; ASNB RM95,000; vehicle RM75,000.\nIllustrative inventory only.'),
        ('farid-identity-demo.txt','Personal identity','uploaded',4,'private','PRIVATE DEMO IDENTITY RECORD\nFarid Abdullah\nOnly Farid and the assigned law firm may view this file.'),
    ]:
        path=folder/name; path.write_text(text)
        db.add(Document(estate_id=1,owner_id=owner,name=name,category=category,visibility=visibility,path=str(path),media_type='text/plain',status=status,comment='Please upload a clearer copy with both names visible.' if status=='correction_requested' else ''))
    db.flush()
    marriage=db.scalar(select(Document).where(Document.category=='Marriage certificate'))
    record('task',{'title':'Upload a clearer marriage certificate','description':'Please make sure both names and the registration date are visible. Upload a revision in Documents, then respond here.','status':'open','document_id':marriage.id,'response':''},2)
    record('task',{'title':'Confirm overseas contact details','description':'Confirm your current postal address and availability for the hearing.','status':'open','response':''},4)
    for title,detail,actor in [
        ('Estate case opened','Sarah created your shared estate workspace.','Sarah Rahman'),
        ('Family information confirmed','Four family members and four assets recorded.','Aina Abdullah'),
        ('Documents reviewed','Death certificate and asset schedule accepted.','Sarah Rahman'),
        ('A clearer document is needed','Marriage certificate: both names should be visible.','Sarah Rahman'),
    ]:
        record('activity',{'title':title,'detail':detail,'actor':actor,'private':False})
    record('notification',{'title':'A clearer document is needed','detail':'Upload a clearer marriage certificate to keep the case moving.','read':False},2)
    record('notification',{'title':'Welcome to your case workspace','detail':'Your documents and next steps are all in one place.','read':False},2)
    record('asset',{'name':'Family residence','type':'Property','value':620000,'status':'identified'},estate=2)
    record('asset',{'name':'Savings account','type':'Bank account','value':90000,'status':'identified'},estate=3)
    db.add(Intake(user_id=5,status='submitted',data={'deceased':'Tan Siew Lan','jurisdiction':'Kuala Lumpur','religion':'Non-Muslim','story':'I need assistance with my mother’s estate and would like a lawyer to review the documents.','assets':'Home and savings','confirmed':True}))
    db.flush()
    if db.bind.dialect.name == 'postgresql':
        # Explicit IDs make the fixture predictable; advance PostgreSQL's
        # sequences so the first registered account/new case cannot collide.
        for table in ('users', 'estates'):
            db.execute(text(f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), (SELECT MAX(id) FROM {table}), true)"))
    db.commit()

if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--reset',action='store_true'); args=parser.parse_args()
    if args.reset:
        Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed(db)
    print('Demo dataset ready. Demo password: '+PASSWORD)
