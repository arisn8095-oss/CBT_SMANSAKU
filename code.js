/**
 * ==============================================================================
 * CBT MOBILE SECURE PRO - GOOGLE APPS SCRIPT BACKEND ENGINE (Code.gs)
 * ==============================================================================
 * Target Spreadsheet ID: 1NBsrKtNexqvqT0xSoGFOH6zeF6MQaMp5hlZ603dSDug
 * Scalability Target   : ~1,300 Concurrent HP Devices
 * Protocol             : HTTP REST API via Web App Deployment (doGet & doPost)
 * ==============================================================================
 */

const GOOGLE_SHEET_DB_ID = '1NBsrKtNexqvqT0xSoGFOH6zeF6MQaMp5hlZ603dSDug';

// Sheet Names Configuration
const SHEETS = {
  STUDENTS: 'Students',
  TEACHERS: 'Teachers',
  PACKAGES: 'Packages',
  QUESTIONS: 'Questions',
  EXAMS: 'Exams',
  ANSWERS: 'Answers',
  VIOLATIONS: 'Violations',
  AUDIT_LOGS: 'AuditLogs'
};

/**
 * Handles all HTTP GET Requests from the Frontend CBT Application
 * @param {Object} e - Event parameter containing query parameters
 * @return {TextOutput} JSON response
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'ping';
    let responseData = {};

    switch (action) {
      case 'ping':
        responseData = { status: 'success', message: 'CBT Database Engine API is active and running!', timestamp: new Date() };
        break;

      case 'getInitialData':
        responseData = {
          status: 'success',
          students: readSheetData(SHEETS.STUDENTS),
          teachers: readSheetData(SHEETS.TEACHERS),
          packages: readSheetData(SHEETS.PACKAGES),
          questions: readSheetData(SHEETS.QUESTIONS),
          exams: readSheetData(SHEETS.EXAMS),
          violations: readSheetData(SHEETS.VIOLATIONS),
          auditLogs: readSheetData(SHEETS.AUDIT_LOGS)
        };
        break;

      case 'getStudents':
        responseData = { status: 'success', data: readSheetData(SHEETS.STUDENTS) };
        break;

      case 'getTeachers':
        responseData = { status: 'success', data: readSheetData(SHEETS.TEACHERS) };
        break;

      case 'getQuestions':
        const packageId = e.parameter.packageId;
        let qData = readSheetData(SHEETS.QUESTIONS);
        if (packageId) {
          qData = qData.filter(q => q.packageId === packageId);
        }
        responseData = { status: 'success', data: qData };
        break;

      case 'getExams':
        responseData = { status: 'success', data: readSheetData(SHEETS.EXAMS) };
        break;

      case 'getViolations':
        responseData = { status: 'success', data: readSheetData(SHEETS.VIOLATIONS) };
        break;

      default:
        responseData = { status: 'error', message: 'Action GET tidak dikenali!' };
    }

    return createJsonResponse(responseData);
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

/**
 * Handles all HTTP POST Requests from the Frontend CBT Application
 * @param {Object} e - Event parameter containing POST payload
 * @return {TextOutput} JSON response
 */
function doPost(e) {
  try {
    let payload = {};
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else {
      payload = e.parameter;
    }

    const action = payload.action;
    let responseData = {};

    switch (action) {
      case 'loginStudent':
        responseData = handleStudentLogin(payload.nis, payload.pin, payload.deviceFingerprint);
        break;

      case 'saveAnswer':
        responseData = handleSaveAnswer(payload.studentNis, payload.examId, payload.answers);
        break;

      case 'recordViolation':
        responseData = handleRecordViolation(payload.violation);
        break;

      case 'resetDevice':
        responseData = handleResetDevice(payload.studentNis);
        break;

      case 'importQuestions':
        responseData = handleImportQuestions(payload.questions);
        break;

      case 'saveQuestion':
        responseData = handleSaveSingleQuestion(payload.question);
        break;

      case 'addAuditLog':
        responseData = handleAddAuditLog(payload.user, payload.logAction, payload.detail);
        break;

      case 'setupDatabase':
        responseData = setupDatabase();
        break;

      default:
        responseData = { status: 'error', message: 'Action POST tidak dikenali!' };
    }

    return createJsonResponse(responseData);
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

/**
 * Initializes all required sheets and header columns in Google Sheets
 * Run this function once after deploying or creating the spreadsheet.
 */
function setupDatabase() {
  const ss = SpreadsheetApp.openById(GOOGLE_SHEET_DB_ID);
  
  const headers = {
    [SHEETS.STUDENTS]: ['id', 'nis', 'name', 'class', 'pin', 'status', 'activeDevice'],
    [SHEETS.TEACHERS]: ['id', 'nip', 'name', 'subject', 'password', 'status'],
    [SHEETS.PACKAGES]: ['id', 'teacherId', 'subjectId', 'code', 'title', 'totalQuestions', 'status'],
    [SHEETS.QUESTIONS]: ['id', 'packageId', 'type', 'questionText', 'media', 'options', 'items', 'pairs', 'rubric', 'score'],
    [SHEETS.EXAMS]: ['id', 'packageId', 'subjectName', 'teacherName', 'token', 'tokenExpire', 'durationMinutes', 'maxViolations', 'status', 'startTime', 'endTime'],
    [SHEETS.ANSWERS]: ['id', 'studentNis', 'examId', 'answersJson', 'score', 'status', 'updatedAt'],
    [SHEETS.VIOLATIONS]: ['id', 'timestamp', 'studentNis', 'studentName', 'subjectName', 'type', 'detail', 'device'],
    [SHEETS.AUDIT_LOGS]: ['id', 'timestamp', 'user', 'action', 'detail']
  };

  Object.keys(headers).forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers[sheetName].length).setValues([headers[sheetName]]);
      sheet.getRange(1, 1, 1, headers[sheetName].length).setFontWeight('bold').setBackground('#E2E8F0');
    }
  });

  // Inject Initial Seed Data if empty
  seedInitialData(ss);

  return { status: 'success', message: 'Database CBT Google Sheet berhasil diinisialisasi!' };
}

/**
 * Seeds initial demo data if sheets are empty
 */
function seedInitialData(ss) {
  const studentSheet = ss.getSheetByName(SHEETS.STUDENTS);
  if (studentSheet.getLastRow() <= 1) {
    studentSheet.appendRow(['s-1', '20241001', 'Andi Pratama', 'XII MIPA 1', '1234', 'Aktif', '']);
    studentSheet.appendRow(['s-2', '20241002', 'Bella Safira', 'XII MIPA 1', '1234', 'Aktif', '']);
    studentSheet.appendRow(['s-3', '20241003', 'Citra Dewi', 'XII MIPA 2', '1234', 'Aktif', '']);
  }

  const teacherSheet = ss.getSheetByName(SHEETS.TEACHERS);
  if (teacherSheet.getLastRow() <= 1) {
    teacherSheet.appendRow(['t-1', '198501012010011001', 'Drs. Budi Santoso', 'Matematika IPA', 'admin', 'Aktif']);
    teacherSheet.appendRow(['t-2', '198803152012022003', 'Siti Rahma, M.Pd.', 'Bahasa Indonesia', 'admin', 'Aktif']);
  }

  const examSheet = ss.getSheetByName(SHEETS.EXAMS);
  if (examSheet.getLastRow() <= 1) {
    examSheet.appendRow(['exam-101', 'pkg-a', 'Matematika IPA', 'Drs. Budi Santoso', 'MTK88', '2026-12-31T23:59:59', 60, 3, 'Aktif', '08:00', '12:00']);
  }
}

/**
 * Validates Student Login and enforces 1-Device = 1-User policy
 */
function handleStudentLogin(nis, pin, deviceFingerprint) {
  const ss = SpreadsheetApp.openById(GOOGLE_SHEET_DB_ID);
  const sheet = ss.getSheetByName(SHEETS.STUDENTS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const studentNis = String(row[1]);
    const studentPin = String(row[4]);
    const activeDevice = String(row[6] || '');

    if (studentNis === String(nis)) {
      if (pin && studentPin !== String(pin)) {
        return { status: 'error', message: 'PIN / Password Siswa Salah!' };
      }

      // Device Lock Verification
      if (activeDevice && activeDevice !== '' && activeDevice !== String(deviceFingerprint)) {
        return {
          status: 'error',
          message: `Akun NIS ${nis} sudah aktif pada perangkat (${activeDevice}). Hubungi Admin/Pengawas untuk reset!`
        };
      }

      // Lock current device fingerprint to student row
      if (!activeDevice || activeDevice === '') {
        sheet.getRange(i + 1, 7).setValue(deviceFingerprint);
      }

      return {
        status: 'success',
        studentData: {
          id: row[0],
          nis: row[1],
          name: row[2],
          class: row[3],
          status: row[5],
          activeDevice: deviceFingerprint
        }
      };
    }
  }

  return { status: 'error', message: 'NIS Siswa tidak ditemukan dalam database!' };
}

/**
 * Admin device reset handler
 */
function handleResetDevice(studentNis) {
  const ss = SpreadsheetApp.openById(GOOGLE_SHEET_DB_ID);
  const sheet = ss.getSheetByName(SHEETS.STUDENTS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]) === String(studentNis)) {
      sheet.getRange(i + 1, 7).setValue('');
      return { status: 'success', message: `Device fingerprint untuk NIS ${studentNis} berhasil di-reset!` };
    }
  }
  return { status: 'error', message: 'NIS Siswa tidak ditemukan!' };
}

/**
 * Saves or updates student answers in real-time
 */
function handleSaveAnswer(studentNis, examId, answers) {
  const ss = SpreadsheetApp.openById(GOOGLE_SHEET_DB_ID);
  const sheet = ss.getSheetByName(SHEETS.ANSWERS);
  const data = sheet.getDataRange().getValues();
  const timestamp = new Date().toISOString();
  const answersJsonStr = JSON.stringify(answers);

  // Update existing session row if found
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]) === String(studentNis) && String(data[i][2]) === String(examId)) {
      sheet.getRange(i + 1, 4).setValue(answersJsonStr);
      sheet.getRange(i + 1, 7).setValue(timestamp);
      return { status: 'success', message: 'Jawaban berhasil diperbarui ke server!' };
    }
  }

  // Insert new session row
  const newId = 'ans-' + Date.now();
  sheet.appendRow([newId, studentNis, examId, answersJsonStr, 0, 'Sedang Mengerjakan', timestamp]);
  return { status: 'success', message: 'Jawaban baru tersimpan ke server!' };
}

/**
 * Records an anti-cheat violation to the Violations Sheet
 */
function handleRecordViolation(v) {
  const ss = SpreadsheetApp.openById(GOOGLE_SHEET_DB_ID);
  const sheet = ss.getSheetByName(SHEETS.VIOLATIONS);
  const vId = 'viol-' + Date.now();

  sheet.appendRow([
    vId,
    v.timestamp || new Date().toLocaleTimeString('id-ID'),
    v.studentNis,
    v.studentName,
    v.subjectName,
    v.type,
    v.detail,
    v.device
  ]);

  return { status: 'success', message: 'Pelanggaran keamanan telah dicatat ke server log.' };
}

/**
 * Batch imports questions into the Questions Sheet
 */
function handleImportQuestions(questionsList) {
  if (!Array.isArray(questionsList) || questionsList.length === 0) {
    return { status: 'error', message: 'Daftar soal impor kosong!' };
  }

  const ss = SpreadsheetApp.openById(GOOGLE_SHEET_DB_ID);
  const sheet = ss.getSheetByName(SHEETS.QUESTIONS);

  questionsList.forEach(q => {
    sheet.appendRow([
      q.id || ('q-imp-' + Date.now() + '-' + Math.floor(Math.random() * 1000)),
      q.packageId || 'pkg-a',
      q.type || 'pg',
      q.questionText || '',
      JSON.stringify(q.media || { type: 'none', url: '' }),
      JSON.stringify(q.options || []),
      JSON.stringify(q.items || []),
      JSON.stringify(q.pairs || []),
      q.rubric || '',
      q.score || 20
    ]);
  });

  return { status: 'success', count: questionsList.length, message: `${questionsList.length} soal berhasil diimpor ke spreadsheet!` };
}

/**
 * Saves a single question (Create / Update)
 */
function handleSaveSingleQuestion(q) {
  const ss = SpreadsheetApp.openById(GOOGLE_SHEET_DB_ID);
  const sheet = ss.getSheetByName(SHEETS.QUESTIONS);
  const data = sheet.getDataRange().getValues();

  const mediaStr = JSON.stringify(q.media || { type: 'none', url: '' });
  const optionsStr = JSON.stringify(q.options || []);
  const itemsStr = JSON.stringify(q.items || []);
  const pairsStr = JSON.stringify(q.pairs || []);

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(q.id)) {
      sheet.getRange(i + 1, 2, 1, 9).setValues([[
        q.packageId, q.type, q.questionText, mediaStr, optionsStr, itemsStr, pairsStr, q.rubric || '', q.score || 20
      ]]);
      return { status: 'success', message: 'Soal berhasil diperbarui di server!' };
    }
  }

  // If new
  sheet.appendRow([q.id, q.packageId, q.type, q.questionText, mediaStr, optionsStr, itemsStr, pairsStr, q.rubric || '', q.score || 20]);
  return { status: 'success', message: 'Soal baru berhasil ditambahkan!' };
}

/**
 * Records system audit logs
 */
function handleAddAuditLog(user, action, detail) {
  const ss = SpreadsheetApp.openById(GOOGLE_SHEET_DB_ID);
  const sheet = ss.getSheetByName(SHEETS.AUDIT_LOGS);
  const timestamp = new Date().toLocaleTimeString('id-ID', { hour12: false });
  const logId = 'log-' + Date.now();

  sheet.appendRow([logId, timestamp, user, action, detail]);
  return { status: 'success', message: 'Audit log tersimpan.' };
}

/**
 * Generic helper to convert sheet rows into array of objects
 */
function readSheetData(sheetName) {
  const ss = SpreadsheetApp.openById(GOOGLE_SHEET_DB_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const result = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const obj = {};
    headers.forEach((header, index) => {
      let val = row[index];
      // Try parsing JSON strings for complex nested properties
      if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
        try {
          val = JSON.parse(val);
        } catch (e) {
          // Keep original string if JSON parse fails
        }
      }
      obj[header] = val;
    });
    result.push(obj);
  }

  return result;
}

/**
 * Creates standardized JSON output for Google Apps Script Web App
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
