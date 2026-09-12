/**
 * ============================================================
 * PoC QR CHECK-IN — Gemini TTS patch untuk Code.gs
 * ============================================================
 *
 * CARA PASANG:
 * 1. Di Apps Script: Project Settings → Script properties
 *    Tambahkan:
 *      GEMINI_API_KEY = (API key Gemini Anda)
 *      GEMINI_TTS_MODEL = gemini-2.5-flash-preview-tts   (opsional)
 *      GEMINI_TTS_VOICE = Aoede                            (opsional)
 *      GEMINI_TTS_LANGUAGE = id-ID                         (opsional)
 *
 *    Voice alternatif: Aoede | Leda | Achernar | Sulafat
 *
 * 2. Tempel SEMUA fungsi di bawah ini ke Code.gs
 *    (jangan hapus checkInByToken / processCameraData yang sudah ada)
 *
 * 3. GANTI fungsi doGet(e) dengan doGet di file ini.
 *
 * 4. Deploy → Manage deployments → pensil → New version → Deploy
 *    (URL tetap sama)
 *
 * CATATAN:
 * - API key TIDAK pernah dikirim ke browser.
 * - TTS dipanggil SETELAH check-in result dikirim ke UI (async).
 * - Jika TTS gagal, check-in tetap sukses.
 */


// ============================================================
// TTS CONFIG (Script Properties, mudah diganti)
// ============================================================

function getTtsConfig_() {

  var props =
    PropertiesService
      .getScriptProperties();

  return {

    apiKey:
      props.getProperty('GEMINI_API_KEY') || '',

    model:
      props.getProperty('GEMINI_TTS_MODEL') ||
      'gemini-2.5-flash-preview-tts',

    voice:
      props.getProperty('GEMINI_TTS_VOICE') ||
      'Aoede',

    language:
      props.getProperty('GEMINI_TTS_LANGUAGE') ||
      'id-ID'

  };

}


/**
 * Dipanggil dari bridge HTML setelah CHECKIN_RESULT dikirim ke parent.
 * text: kalimat lengkap bahasa Indonesia (nama sudah dinamis).
 * statusKind: 'CHECKED_IN' | 'ALREADY_CHECKED_IN' | ...
 */
function synthesizeCheckInSpeech(text, statusKind) {

  try {

    text =
      String(text || '').trim();

    if (!text) {
      return {
        ok: false,
        error: 'Teks TTS kosong.'
      };
    }


    var config =
      getTtsConfig_();


    if (!config.apiKey) {

      console.error(
        'GEMINI_API_KEY belum di-set di Script Properties.'
      );

      return {
        ok: false,
        error: 'GEMINI_API_KEY missing'
      };

    }


    var toneLine =
      statusKind === 'ALREADY_CHECKED_IN'
        ? 'Ucapkan dengan nada sopan, tegas, jelas, dan ringkas.'
        : 'Ucapkan dengan nada ramah, hangat, percaya diri, dan ringkas.';


    var prompt =
      'Anda adalah petugas registrasi event perempuan profesional. ' +
      'Bahasa Indonesia. Natural, tidak seperti robot. ' +
      'Tanpa musik, tanpa efek, tanpa kalimat tambahan. ' +
      toneLine + ' ' +
      'Ucapkan tepat kalimat berikut saja:\n' +
      text;


    var url =
      'https://generativelanguage.googleapis.com/v1beta/models/' +
      encodeURIComponent(config.model) +
      ':generateContent?key=' +
      encodeURIComponent(config.apiKey);


    var payload = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        responseModalities: [
          'AUDIO'
        ],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: config.voice
            }
          }
        }
      }
    };


    var response =
      UrlFetchApp.fetch(
        url,
        {
          method: 'post',
          contentType: 'application/json',
          payload: JSON.stringify(payload),
          muteHttpExceptions: true
        }
      );


    var code =
      response.getResponseCode();

    var bodyText =
      response.getContentText();


    if (code < 200 || code >= 300) {

      console.error(
        'Gemini TTS HTTP ' +
        code +
        ': ' +
        bodyText
      );

      return {
        ok: false,
        error: 'Gemini TTS HTTP ' + code
      };

    }


    var body =
      JSON.parse(bodyText);


    var part =
      body &&
      body.candidates &&
      body.candidates[0] &&
      body.candidates[0].content &&
      body.candidates[0].content.parts &&
      body.candidates[0].content.parts[0];


    var inline =
      part &&
      (part.inlineData || part.inline_data);


    if (!inline || !inline.data) {

      console.error(
        'Gemini TTS: inline audio kosong',
        bodyText
      );

      return {
        ok: false,
        error: 'No audio in Gemini response'
      };

    }


    var mimeType =
      inline.mimeType ||
      inline.mime_type ||
      'audio/L16;codec=pcm;rate=24000';


    var wavBase64 =
      pcmInlineToWavBase64_(
        inline.data,
        mimeType
      );


    return {
      ok: true,
      wavBase64: wavBase64,
      mimeType: 'audio/wav',
      voice: config.voice,
      model: config.model,
      language: config.language,
      text: text
    };


  } catch (error) {

    console.error(
      'synthesizeCheckInSpeech error:',
      error
    );

    return {
      ok: false,
      error:
        error.message ||
        String(error)
    };

  }

}


/**
 * Convert Gemini PCM (audio/L16) base64 → WAV base64 for browser <audio>.
 */
function pcmInlineToWavBase64_(pcmBase64, mimeType) {

  var sampleRate =
    24000;

  var match =
    String(mimeType || '')
      .match(/rate=(\d+)/i);

  if (match) {
    sampleRate =
      Number(match[1]) || 24000;
  }


  // Jika sudah WAV, kirim apa adanya.
  if (
    String(mimeType)
      .toLowerCase()
      .indexOf('audio/wav') !== -1 ||
    String(mimeType)
      .toLowerCase()
      .indexOf('audio/x-wav') !== -1
  ) {
    return pcmBase64;
  }


  var pcmBytes =
    Utilities.base64Decode(pcmBase64);


  var numChannels = 1;
  var bitsPerSample = 16;
  var blockAlign =
    numChannels * bitsPerSample / 8;
  var byteRate =
    sampleRate * blockAlign;
  var dataSize =
    pcmBytes.length;
  var fileSize =
    36 + dataSize;


  var header =
    [];

  function pushStr(s) {
    for (var i = 0; i < s.length; i++) {
      header.push(s.charCodeAt(i) & 0xff);
    }
  }

  function pushU32(v) {
    header.push(v & 0xff);
    header.push((v >> 8) & 0xff);
    header.push((v >> 16) & 0xff);
    header.push((v >> 24) & 0xff);
  }

  function pushU16(v) {
    header.push(v & 0xff);
    header.push((v >> 8) & 0xff);
  }


  pushStr('RIFF');
  pushU32(fileSize);
  pushStr('WAVE');
  pushStr('fmt ');
  pushU32(16);
  pushU16(1);
  pushU16(numChannels);
  pushU32(sampleRate);
  pushU32(byteRate);
  pushU16(blockAlign);
  pushU16(bitsPerSample);
  pushStr('data');
  pushU32(dataSize);


  var wavBytes =
    header.concat(pcmBytes);


  return Utilities.base64Encode(wavBytes);

}


/**
 * GANTI seluruh doGet(e) lama dengan versi ini.
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
      '  var name=(result&&result.name)?String(result.name).trim():"";' +
      '  var speak="";' +
      '  var kind="";' +
      '  if(result&&(result.status==="CHECKED_IN"||result.status==="SUCCESS")&&name){' +
      '    speak="Check-in berhasil. "+name+".";' +
      '    kind="CHECKED_IN";' +
      '  } else if(result&&result.status==="ALREADY_CHECKED_IN"&&name){' +
      '    speak="Sudah dipakai check-in oleh "+name+".";' +
      '    kind="ALREADY_CHECKED_IN";' +
      '  }' +
      '  if(!speak){return;}' +
      '  google.script.run' +
      '    .withSuccessHandler(function(audio){' +
      '      if(audio&&audio.ok&&audio.wavBase64){' +
      '        postTop({type:"CHECKIN_AUDIO",audio:audio});' +
      '      } else {' +
      '        postTop({type:"CHECKIN_AUDIO_ERROR",message:(audio&&audio.error)||"TTS failed"});' +
      '      }' +
      '    })' +
      '    .withFailureHandler(function(err){' +
      '      postTop({type:"CHECKIN_AUDIO_ERROR",message:(err&&err.message)||String(err)});' +
      '    })' +
      '    .synthesizeCheckInSpeech(speak, kind);' +
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


  return HtmlService
    .createHtmlOutputFromFile('WebApp')
    .setTitle('PoC QR CHECK-IN')
    .setXFrameOptionsMode(
      HtmlService.XFrameOptionsMode.ALLOWALL
    );

}
