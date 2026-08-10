/**
 * Logika Engine Aplikasi Client-Side
 */

function kirimData() {
  const outputDiv = document.getElementById('output');
  outputDiv.innerText = 'Memproses...';

  // Periksa apakah berjalan di lingkungan Google Apps Script
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run
      .withSuccessHandler(onSuccess)
      .withFailureHandler(onFailure)
      .prosesBackend({ pesan: "Halo dari Client!" });
  } else {
    // Mode simulasi jika dijalankan secara lokal di browser
    setTimeout(() => {
      onSuccess({ status: "Sukses (Mode Lokal)", data: "Response simulasi" });
    }, 1000);
  }
}

function onSuccess(response) {
  const outputDiv = document.getElementById('output');
  outputDiv.innerText = `Berhasil: ${JSON.stringify(response)}`;
}

function onFailure(error) {
  const outputDiv = document.getElementById('output');
  outputDiv.innerText = `Gagal: ${error.message}`;
}