/**
 * GANTI fungsi doGet() yang lama dengan versi ini.
 * Fungsi lain di Code.gs JANGAN diubah.
 *
 * Lalu di Apps Script:
 * Deploy → Manage deployments → ikon pensil (Edit)
 * → Version: New version → Deploy
 * (URL Web App TETAP SAMA — bukan deployment baru)
 */
function doGet(e) {

  var token =
    e &&
    e.parameter &&
    e.parameter.token
      ? String(e.parameter.token).trim()
      : '';


  // ----------------------------------------------------------
  // Mode bridge dari GitHub Pages scanner (?token=...)
  // ----------------------------------------------------------

  if (token) {

    var html =
      '<!DOCTYPE html>' +
      '<html>' +
      '<head><base target="_top"></head>' +
      '<body style="font-family:Arial,sans-serif;padding:16px;color:#6b7280;">' +
      'Memeriksa check-in...' +
      '<script>' +
      'google.script.run' +
      '.withSuccessHandler(function(result){' +
      '  window.top.postMessage(' +
      '    { type: "CHECKIN_RESULT", result: result },' +
      '    "https://register-qrcode.github.io"' +
      '  );' +
      '})' +
      '.withFailureHandler(function(error){' +
      '  window.top.postMessage(' +
      '    {' +
      '      type: "CHECKIN_RESULT",' +
      '      result: {' +
      '        status: "ERROR",' +
      '        message: (error && error.message) || "Terjadi kesalahan pada server."' +
      '      }' +
      '    },' +
      '    "https://register-qrcode.github.io"' +
      '  );' +
      '})' +
      '.processCameraData(' + JSON.stringify(token) + ');' +
      '</script>' +
      '</body>' +
      '</html>';

    return HtmlService
      .createHtmlOutput(html)
      .setTitle('PoC QR CHECK-IN')
      .setXFrameOptionsMode(
        HtmlService.XFrameOptionsMode.ALLOWALL
      );

  }


  // ----------------------------------------------------------
  // Mode normal: panel WebApp.html (manual check-in)
  // ----------------------------------------------------------

  return HtmlService
    .createHtmlOutputFromFile('WebApp')
    .setTitle('PoC QR CHECK-IN')
    .setXFrameOptionsMode(
      HtmlService.XFrameOptionsMode.ALLOWALL
    );

}
