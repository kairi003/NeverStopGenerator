const input = document.getElementById('input');
const img = document.getElementById('inputImg');
const make = document.getElementById('make');
const download = document.getElementById('download');
const result = document.getElementById('result');
const bgm = document.getElementById('bgm');
const muted = document.getElementById('muted');
const canvas = document.getElementById('canvas');

const cors = [
  [655, 148],
  [639, 143],
  [612, 130],
  [589, 121],
  [586, 134],
  [601, 121],
  [609, 148],
  [649, 121],
  [649, 121],
  [679, 135],
  [657, 152],
]

const frame = document.querySelectorAll('.frame');

input.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file.type.match('image.*')) {
    alert('画像を選択してください');
    input.value = '';
    return;
  }
  URL.revokeObjectURL(img.src);
  img.src = URL.createObjectURL(file);
});

img.addEventListener('load', e => {
  make.disabled = false;
});

muted.addEventListener('change', e => {
  bgm.muted = muted.checked;
});


let encoder;
make.addEventListener('click', e => {
  input.disabled = true;
  make.disabled = true;
  make.textContent = 'making now...'

  setTimeout(() => {
    let nw = img.naturalWidth;
    let nh = img.naturalHeight;
    let v = 1.0;

    v = (nh / nw > 143 / 87) ? 87 / nw : 143 / nh;

    const ctx = canvas.getContext('2d');
    encoder = new GIFEncoder();
    encoder.setRepeat(0);
    encoder.setDelay(1000 / 25);
    encoder.start();
    for (let i = 0; i < 11; i++) {
      ctx.drawImage(frame[i], 0, 0, 1280, 720);
      let [dw, dh] = [nw * v, nh * v];
      let [cx, cy] = cors[i];
      ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
      encoder.addFrame(ctx);
    }
    encoder.finish();

    result.src = 'data:image/gif;base64,' + btoa(encoder.stream().getData());
    bgm.play();

    input.disabled = false;
    make.disabled = false;
    make.textContent = 'make'
    download.disabled = false;
  }, 100);
});

download.addEventListener('click', e => {
  encoder.download('runningXXX.gif');
})