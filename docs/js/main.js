const input = document.getElementById('input');
const img = document.getElementById('inputImg');
const make = document.getElementById('make');
const download = document.getElementById('download');
const sample = document.getElementById('sample');
const result = document.getElementById('result');
const bgm = document.getElementById('bgm');
const muted = document.getElementById('muted');
const work = document.getElementById('work');
const edit = document.getElementById('edit');

const diff = [
  [0, 0],
  [-16, -5],
  [-43, -18],
  [-66, -27],
  [-69, -14],
  [-54, -7],
  [-46, 0],
  [-6, -27],
  [-6, -27],
  [24, -13],
  [2, 4],
];

const cw = 1280;
const ch = 720;

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

{
  const eX = document.getElementById('eX');
  const eY = document.getElementById('eY');
  const eScale = document.getElementById('eScale');
  const eTrans = document.getElementById('eTrans');
  const cTrans = document.getElementById('cTrans');
  const bPick = document.getElementById('pick');

  const canvas = sample;
  const ctx = canvas.getContext('2d');

  let nw, nh;

  img.addEventListener('load', e => {
    make.disabled = false;
    sample.style.display = 'block';
    edit.disabled = false;
    const canvas = sample;
    const ctx = canvas.getContext('2d');
    nw = img.naturalWidth;
    nh = img.naturalHeight;
    eX.value = 655;
    eY.value = 148;
    eScale.value = (nh / nw > 143 / 87) ? 87 / nw : 143 / nh;
    cTrans.checked = false;
    draw();
  });

  function draw() {
    ctx.clearRect(0, 0, cw, ch);

    let [x, y, scale] = [eX, eY, eScale].map(e => +e.value);
    let [dw, dh] = [nw * scale, nh * scale];

    ctx.drawImage(img, x - dw / 2, y - dh / 2, dw, dh);
    if (cTrans.checked) {
      const imageData = ctx.getImageData(0, 0, cw, ch);
      const pixel = imageData.data;
      const code = parseInt(eTrans.value.slice(1), 16);
      console.log(code);
      for (let i = 0; i < pixel.length; i += 4) {
        if ((pixel[i] << 16 | pixel[i + 1] << 8 | pixel[i + 2]) === code) pixel[i + 3] = 0;
      }
      ctx.putImageData(imageData, 0, 0);
    }
  }

  document.querySelectorAll('.edit-panel input').forEach(e => {
    e.addEventListener('input', draw, false);
    e.addEventListener('change', draw, false);
  });

  bPick.addEventListener('click', e => {
    e.target.disabled = true;
    canvas.addEventListener('click', pick);
  });

  function pick(e) {
    const cv = parseFloat(getComputedStyle(canvas, null).getPropertyValue('width')) / cw;
    const [x, y] = [e.offsetX / cv, e.offsetY / cv];
    console.log(x, y);
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const color = '#' + (pixel[0] << 16 | pixel[1] << 8 | pixel[2]).toString(16).padStart(6, '0');
    eTrans.value = color;
    bPick.disabled = false;
    e.target.removeEventListener('click', pick);
    cTrans.checked = true;
    draw();
  }
}


muted.addEventListener('change', e => {
  bgm.muted = muted.checked;
});


make.addEventListener('click', e => {
  input.disabled = true;
  make.disabled = true;
  make.textContent = 'making now...'

  const canvas = work;
  const ctx = canvas.getContext('2d');

  const gif = new GIF({
    quality: 10,
    workers: 4,
    workerScript: './js/gif.worker.js',
    width: cw,
    height: ch,
  });

  for (let i = 0; i < 11; i++) {
    ctx.drawImage(frame[i], 0, 0, cw, ch);
    ctx.drawImage(sample, ...diff[i]);
    gif.addFrame(ctx, {
      delay: 1000 / 25,
      copy: true
    });
  }
  gif.on('finished', blob => {
    sample.style.display = 'none';
    edit.disabled = true;
    edit.checked = false;
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