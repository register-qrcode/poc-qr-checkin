/**
 * Ganti function doGet(e) di Code.gs dengan ini.
 * - Tanpa token: bridge cepat (iframe tetap hidup)
 * - Dengan ?token=: fallback lama (tetap didukung)
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
      'function postTop(msg){try{window.parent.postMessage(msg,ORIGIN);}catch(e){}}' +
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
    'function postTop(msg){try{window.parent.postMessage(msg,ORIGIN);}catch(e){}}' +
    'function runCheckIn(token){' +
    '  token=String(token||"").trim();' +
    '  if(!token){postTop({type:"CHECKIN_RESULT",result:{status:"INVALID",message:"QR Token kosong."}});return;}' +
    '  google.script.run' +
    '    .withSuccessHandler(function(result){postTop({type:"CHECKIN_RESULT",result:result});})' +
    '    .withFailureHandler(function(error){postTop({type:"CHECKIN_RESULT",result:{status:"ERROR",message:(error&&error.message)||"Terjadi kesalahan pada server."}});})' +
    '    .processCameraData(token);' +
    '}' +
    'window.addEventListener("message",function(ev){' +
    '  if(ev.origin!==ORIGIN)return;' +
    '  if(!ev.data||ev.data.type!=="CHECKIN_REQUEST")return;' +
    '  runCheckIn(ev.data.token);' +
    '});' +
    'postTop({type:"BRIDGE_READY"});' +
    '</script></body></html>';

  return HtmlService
    .createHtmlOutput(bridge)
    .setTitle('PoC QR CHECK-IN Bridge')
    .setXFrameOptionsMode(
      HtmlService.XFrameOptionsMode.ALLOWALL
    );

}
