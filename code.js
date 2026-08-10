/**
 * CBT Mobile Safe - Google Apps Script Backend Integration
 * Berfungsi menerima payload hasil ujian murid dari GitHub Pages dan mencatatnya ke Google Sheets.
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Pastikan Header Google Sheets:
    // [Waktu Submit, NIS, Nama Murid, ID Paket, Nama Paket, Skor Otomatis, Status Submit]
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Waktu Submit", "NIS", "Nama Murid", "ID Paket", "Nama Paket", "Skor Otomatis", "Status"]);
    }
    
    sheet.appendRow([
      data.submittedAt || new Date().toLocaleString(),
      data.nis || "",
      data.studentName || "",
      data.packageId || "",
      data.packageName || "",
      data.autoScore || 0,
      data.status || "SUBMITTED"
    ]);
    
    return ContentService
      .createTextOutput(JSON.stringify({ "status": "success", "message": "Data berhasil tersimpan di Spreadsheet" }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("CBT Mobile Safe Service Active");
}
