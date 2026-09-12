/**
 * Jalankan sekali di Apps Script: setupDaftarHadirSheet
 * Membuat sheet "Daftar_Hadir" (otomatis update dari Form_Responses).
 * TIDAK mengubah check-in / email / QR.
 */
function setupDaftarHadirSheet() {

  var ss =
    SpreadsheetApp.openById(
      SPREADSHEET_ID
    );

  var sheet =
    ss.getSheetByName(
      'Daftar_Hadir'
    );

  if (!sheet) {
    sheet =
      ss.insertSheet(
        'Daftar_Hadir'
      );
  }

  sheet.clear();

  sheet
    .getRange(1, 1)
    .setValue(
      'DAFTAR HADIR — PESERTA SUDAH CHECK-IN'
    )
    .setFontWeight('bold')
    .setFontSize(14);

  sheet
    .getRange(2, 1)
    .setValue(
      'Otomatis dari Form_Responses (status CHECKED-IN). Jangan edit manual.'
    )
    .setFontColor('#666666');

  // B Nama, E Instansi, F Reg ID, C Email, D WA, I Check-in Time
  sheet
    .getRange(4, 1)
    .setFormula(
      '=QUERY(Form_Responses!A:K,' +
      '"SELECT B,E,F,C,D,I WHERE H=\'CHECKED-IN\' ORDER BY I ' +
      'LABEL B \'Nama lengkap\', E \'Instansi\', F \'Registration ID\', ' +
      'C \'Email\', D \'Nomor WhatsApp\', I \'Waktu Check-in\'",1)'
    );

  sheet.setColumnWidth(1, 220);
  sheet.setColumnWidth(2, 180);
  sheet.setColumnWidth(3, 150);
  sheet.setColumnWidth(4, 220);
  sheet.setColumnWidth(5, 140);
  sheet.setColumnWidth(6, 160);

  sheet
    .getRange(1, 1, 1, 6)
    .merge();

  sheet
    .getRange(2, 1, 2, 6)
    .merge();

}
