/**
 * Lokal test av school-inquiry-flyten uten ekte Resend/Firebase.
 * Stubber 'resend' og 'firebase-admin' og kompilerer funksjonsfila som
 * CommonJS (den bruker require/exports selv om repoet er "type":"module").
 */
const Module = require('module');
const fs = require('fs');
const path = require('path');

const sentEmails = [];
const firestoreAdds = [];

const fakeFieldValue = { serverTimestamp: () => 'SERVER_TS' };
const fakeAdmin = {
  apps: [{}], // ikke-tom → hopper over init i modulen
  initializeApp: () => {},
  credential: { cert: () => ({}) },
  firestore: Object.assign(
    () => ({
      collection: (name) => ({
        add: async (doc) => {
          firestoreAdds.push({ collection: name, doc });
          return { id: 'TEST_INQUIRY_123' };
        },
      }),
    }),
    { FieldValue: fakeFieldValue }
  ),
};

class FakeResend {
  constructor(key) { this.key = key; }
  get emails() {
    return {
      send: async (opts) => { sentEmails.push(opts); return { id: `email_${sentEmails.length}` }; },
    };
  }
}

const origLoad = Module._load;
Module._load = function (request) {
  if (request === 'firebase-admin') return fakeAdmin;
  if (request === 'resend') return { Resend: FakeResend };
  return origLoad.apply(this, arguments);
};

process.env.FIREBASE_SERVICE_ACCOUNT = '{}';
process.env.RESEND_API_KEY = 'test_key';

// Kompiler funksjonsfila eksplisitt som CommonJS.
const fnPath = path.join(__dirname, '..', 'netlify', 'functions', 'school-inquiry.js');
const src = fs.readFileSync(fnPath, 'utf8');
const m = new Module(fnPath, module);
m.filename = fnPath;
m.paths = Module._nodeModulePaths(path.dirname(fnPath));
m._compile(src, fnPath);
Module._load = origLoad;
const handler = m.exports.handler;

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}`); }
}

const validBody = {
  schoolName: 'Test Ungdomsskole',
  orgNumber: '123 456 789',
  contactPerson: 'Kari Nordmann',
  contactEmail: 'Kari@testskole.no',
  contactPhone: '99887766',
  teacherCount: '12',
  message: 'Vi ønsker tilbud',
};

(async () => {
  console.log('1) OPTIONS (CORS preflight)');
  check('200', (await handler({ httpMethod: 'OPTIONS' })).statusCode === 200);

  console.log('2) GET avvises');
  check('405', (await handler({ httpMethod: 'GET' })).statusCode === 405);

  console.log('3) Manglende felt');
  check('400', (await handler({ httpMethod: 'POST', body: JSON.stringify({ schoolName: 'X' }) })).statusCode === 400);

  console.log('4) Ugyldig e-post');
  check('400', (await handler({ httpMethod: 'POST', body: JSON.stringify({ ...validBody, contactEmail: 'ikke-epost' }) })).statusCode === 400);

  console.log('5) Gyldig forespørsel');
  const r5 = await handler({ httpMethod: 'POST', body: JSON.stringify(validBody) });
  check('200', r5.statusCode === 200);
  check('success=true', JSON.parse(r5.body).success === true);

  console.log('   Firestore-skriving:');
  check('lagret i school_inquiries', firestoreAdds.some((f) => f.collection === 'school_inquiries'));
  const doc = firestoreAdds[0] && firestoreAdds[0].doc;
  check('orgNumber trimmet', doc && doc.orgNumber === '123456789');
  check('e-post lowercased', doc && doc.contactEmail === 'kari@testskole.no');
  check('teacherCount parset til number', doc && doc.teacherCount === 12);
  check('status pending', doc && doc.status === 'pending');

  console.log('   E-poster:');
  check('to e-poster sendt', sentEmails.length === 2);
  const admin = sentEmails[0] || {}, auto = sentEmails[1] || {};
  check('admin: fra kontakt@', admin.from === 'kontakt@glosemester.no');
  check('admin: til kontakt@ (internt varsel)', admin.to === 'kontakt@glosemester.no');
  check('admin: emne nevner skolen', /Test Ungdomsskole/.test(admin.subject || ''));
  check('autosvar: fra kontakt@', auto.from === 'kontakt@glosemester.no');
  check('autosvar: til skolens e-post', auto.to === 'Kari@testskole.no');
  check('autosvar: takk-emne', /Takk for forespørselen/.test(auto.subject || ''));
  check('autosvar: lenker til skoleavtale', /skoleavtale\.html/.test(auto.html || ''));
  check('autosvar: lenker til vilkår', /vilkar\.html/.test(auto.html || ''));
  check('autosvar: hilser kontaktperson', /Kari Nordmann/.test(auto.html || ''));

  console.log(`\n${fail === 0 ? '✅' : '❌'} ${pass} bestått, ${fail} feilet`);
  process.exit(fail === 0 ? 0 : 1);
})();
