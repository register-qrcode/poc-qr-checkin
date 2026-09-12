/**
 * Ganti HANYA function doGet(e) di Code.gs dengan ini.
 * Lalu: Deploy → Manage deployments → pensil → New version → Deploy
 * (URL Web App tetap sama)
 *
 * FIX: wajib window.top.postMessage — bukan window.parent.
 * HtmlService bersarang di googleusercontent; parent+ORIGIN github.io
 * membuat pesan dibuang browser → scanner timeout / "tidak berhasil".
 *
 * JANGAN ubah checkInByToken / processCameraData / onFormSubmit.
 */
function doGet(e) {

  var token =
    e &&
    e.parameter &&
    e.parameter.token
      ? String(e.parameter.token).trim()
      : '';

  if (token) {

    var html =
      '<!DOCTYPE html><html><head><base target="_top"></head>' +
      '<body style="font-family:Arial,sans-serif;padding:16px;color:#6b7280;">' +
      'Memeriksa check-in...' +
      '<script>' +
      'var ORIGIN="https://register-qrcode.github.io";' +
      'function postTop(msg){try{window.top.postMessage(msg,ORIGIN);}catch(e){}}' +
      'google.script.run' +
      '.withSuccessHandler(function(result){' +
      '  postTop({type:"CHECKIN_RESULT",result:result});' +
      '})' +
      '.withFailureHandler(function(error){' +
      '  postTop({type:"CHECKIN_RESULT",result:{status:"ERROR",message:(error&&error.message)||"Terjadi kesalahan pada server."}});' +
      '})' +
      '.processCameraData(' + JSON.stringify(token) + ');' +
      '</script></body></html>';

    return HtmlService
      .createHtmlOutput(html)
      .setTitle('PoC QR CHECK-IN')
      .setXFrameOptionsMode(
        HtmlService.XFrameOptionsMode.ALLOWALL
      );

  }

  var bridge =
    '<!DOCTYPE html><html><head><base target="_top"></head><body>' +
    '<script>' +
    'var ORIGIN="https://register-qrcode.github.io";' +
    'function postTop(msg){try{window.top.postMessage(msg,ORIGIN);}catch(e){}}' +
    'postTop({type:"BRIDGE_READY"});' +
    '</script></body></html>';

  return HtmlService
    .createHtmlOutput(bridge)
    .setTitle('PoC QR CHECK-IN Bridge')
    .setXFrameOptionsMode(
      HtmlService.XFrameOptionsMode.ALLOWALL
    );

}
