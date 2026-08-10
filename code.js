/**
 * Backend Google Apps Script
 */

// Menampilkan halaman utama UI HTML
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Aplikasi Web UI')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Fungsi backend yang dipanggil oleh app.js
function prosesBackend(payload) {
  try {
    Logger.log("Menerima data: " + JSON.stringify(payload));
    
    // Logika pemrosesan data backend di sini
    return {
      status: "Berhasil",
      pesanDiterima: payload.pesan,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error("Terjadi kesalahan di backend: " + error.message);
  }
}