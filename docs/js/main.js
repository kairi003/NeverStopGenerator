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


make.addEventListener('click', e => {
  input.disabled = true;
  make.disabled = true;
  make.textContent = 'making now...'

  let nw = img.naturalWidth;
  let nh = img.naturalHeight;
  let v = 1.0;

  v = (nh / nw > 143 / 87) ? 87 / nw : 143 / nh;

  const ctx = canvas.getContext('2d');

  const gif = new GIF({
    quality: 10,
    workers: 4,
    workerScript: './js/gif.worker.js',
    width: canvas.width,
    height: canvas.height,
  });
  for (let i = 0; i < 11; i++) {
    ctx.drawImage(frame[i], 0, 0, canvas.width, canvas.height);
    let [dw, dh] = [nw * v, nh * v];
    let [cx, cy] = cors[i];
    ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
    gif.addFrame(ctx, {
      delay: 1000 / 25,
      copy: true
    });
  }
  gif.on('finished', blob => {
    const blobURL = URL.createObjectURL(blob);
    URL.revokeObjectURL(result.src);
    result.src = blobURL;
    bgm.play();
    input.disabled = false;
    make.textContent = 'make'
    download.disabled = false;
    dlLink.href = blobURL;
  });
  gif.render();
});