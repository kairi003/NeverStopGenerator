'use strict'; {
  const input = document.getElementById('input');
  const img = document.getElementById('inputImg');

  input.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file.type.match('image.*')) {
      alert('画像を選択してください');
      e.target.value = '';
      return;
    }
    URL.revokeObjectURL(img.src);
    img.src = URL.createObjectURL(file);
  });
}

{
  const img = document.getElementById('inputImg');
  const make = document.getElementById('make');
  const viewMode = document.getElementById('viewMode');

  const editX = document.getElementById('editX');
  const editY = document.getElementById('editY');
  const editScale = document.getElementById('editScale');
  const editTrans = document.getElementById('editTrans');
  const transCheck = document.getElementById('transCheck');
  const bPick = document.getElementById('pick');

  const base = document.getElementById('base');
  const ctx = base.getContext('2d');
  const [cw, ch] = [1280, 720];

  let nw, nh;

  img.addEventListener('load', e => {
    make.disabled = false;
    viewMode.checked = true;

    nw = img.naturalWidth;
    nh = img.naturalHeight;
    editX.value = 655;
    editY.value = 148;
    editScale.value = (nh / nw > 143 / 87) ? 87 / nw : 143 / nh;
    transCheck.checked = false;
    draw();
  });

  function draw() {
    ctx.clearRect(0, 0, cw, ch);

    let [x, y, scale] = [editX, editY, editScale].map(e => +e.value);
    let [dw, dh] = [nw * scale, nh * scale];

    ctx.drawImage(img, x - dw / 2, y - dh / 2, dw, dh);
    if (transCheck.checked) {
      const imageData = ctx.getImageData(0, 0, cw, ch);
      const pixel = imageData.data;
      const code = parseInt(editTrans.value.slice(1), 16);
      for (let i = 0; i < pixel.length; i += 4) {
        if ((pixel[i] << 16 | pixel[i + 1] << 8 | pixel[i + 2]) === code) pixel[i + 3] = 0;
      }
      ctx.putImageData(imageData, 0, 0);
    }
  }

  document.querySelectorAll('.base-edit').forEach(e => {
    e.addEventListener('input', draw);
    e.addEventListener('change', draw);
  });

  bPick.addEventListener('click', e => {
    e.target.disabled = true;
    base.addEventListener('click', pick);
  });

  function pick(e) {
    const cv = parseFloat(getComputedStyle(base, null).getPropertyValue('width')) / cw;
    const [x, y] = [e.offsetX / cv, e.offsetY / cv];
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const color = '#' + (pixel[0] << 16 | pixel[1] << 8 | pixel[2]).toString(16).padStart(6, '0');
    editTrans.value = color;
    bPick.disabled = false;
    e.target.removeEventListener('click', pick);
    transCheck.checked = true;
    draw();
  }

  {
    let dragging = false;
    let lastPos = [0, 0];

    function move(e) {
      const p = pos(e);
      if (dragging) {
        editX.value = (+editX.value + p[0] - lastPos[0]);
        editY.value = (+editY.value + p[1] - lastPos[1]);
        draw();
        lastPos = p;
      }
    }

    function down(e) {
      dragging = true;
      lastPos = pos(e);
    }

    function up(e) {
      if (dragging) move(e);
      dragging = false;
    }

    function pos(e) {
      const rect = e.target.getBoundingClientRect();
      const offsetX = (e.clientX - rect.left);
      const offsetY = (e.clientY - rect.top);
      const v = e.target.width / e.target.clientWidth;
      const x = offsetX * v;
      const y = offsetY * v;
      return [x, y];
    }

    base.addEventListener('mousedown', down);
    base.addEventListener('mouseup', up);
    base.addEventListener('mousemove', move);
    base.addEventListener('touchstart', e => {
      if (e.changedTouches.length == 1) {
        down(e.changedTouches[0]);
      }
    });
    base.addEventListener('touchend', e => {
      if (e.changedTouches.length == 1) {
        up(e.changedTouches[0]);
      }
    });
    base.addEventListener('touchmove', e => {
      if (e.changedTouches.length == 1) {
        move(e.changedTouches[0]);
        e.preventDefault();
      }
    });
  }
}


{
  const input = document.getElementById('input');
  const make = document.getElementById('make');
  const download = document.getElementById('download');
  const base = document.getElementById('base');
  const mask = document.getElementById('mask');
  const result = document.getElementById('result');
  const bgm = document.getElementById('bgm');
  const work = document.getElementById('work');
  const noneMode = document.getElementById('noneMode');

  document.getElementById('unmute').addEventListener('change', e => {
    bgm.muted = !e.target.checked;
  });

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
      ctx.clearRect(0, 0, cw, ch);
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(base, ...diff[i], cw, ch);
      ctx.globalCompositeOperation = "destination-out";
      ctx.drawImage(mask, ...diff[i], cw, ch);
      ctx.globalCompositeOperation = "destination-over";
      ctx.drawImage(frame[i], 0, 0, cw, ch);
      gif.addFrame(ctx, {
        delay: 1000 / 25,
        copy: true
      });
    }
    gif.on('finished', blob => {
      noneMode.checked = true;
      const blobURL = URL.createObjectURL(blob);
      URL.revokeObjectURL(result.src);
      result.src = blobURL;
      bgm.play();
      input.disabled = false;
      make.textContent = 'make';
      make.disabled = false;
      download.disabled = false;
      dlLink.href = blobURL;
    });
    gif.render();
  });
}

{
  const canvas = document.getElementById('mask');
  const cursor = document.getElementById('cursor');
  const editTrans = document.getElementById('editTrans');
  const maskErase = document.getElementById('maskErase');
  const drawWidth = document.getElementById('drawWidth');
  const ctx = canvas.getContext('2d');
  let dragging = false;
  let lastPos = [0, 0];

  function cursorFollow(e) {
    const v = e.target.width / e.target.clientWidth;
    Object.assign(cursor.style, {
      width: ctx.lineWidth / v + 'px',
      height: ctx.lineWidth / v + 'px',
      left: e.clientX - ctx.lineWidth / v / 2 + 'px',
      top: e.clientY - ctx.lineWidth / v / 2 + 'px',
    });
  }

  function move(e) {
    const p = pos(e);
    cursorFollow(e);
    if (dragging) {
      ctx.moveTo(...lastPos);
      ctx.lineTo(...p);
      ctx.stroke();
      lastPos = p;
    }
  }

  function down(e) {
    dragging = true;
    lastPos = pos(e);
    ctx.beginPath();
    ctx.globalCompositeOperation = (maskErase.checked) ? "destination-out" : "source-over";
    ctx.strokeStyle = editTrans.value;
    ctx.lineWidth = 1.1**parseFloat(drawWidth.value);
    ctx.lineCap = "round";
  }

  function up(e) {
    move(e);
    dragging = false;
    ctx.closePath();
  }

  function pos(e) {
    const rect = e.target.getBoundingClientRect()
    const offsetX = (e.clientX - rect.left)
    const offsetY = (e.clientY - rect.top)
    const v = e.target.width / e.target.clientWidth;
    const x = offsetX * v;
    const y = offsetY * v;
    return [x, y];
  }

  function changeColor(e) {
    const code = parseInt(e.target.value.slice(1), 16);
    const r = (code >> 16) & 0xFF;
    const g = (code >> 8) & 0xFF;
    const b = (code >> 0) & 0xFF;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixel = imageData.data;
    for (let i = 0; i < pixel.length; i += 4) {
      [pixel[i], pixel[i+1], pixel[i+2]] = [r, g, b];
    }
    ctx.putImageData(imageData, 0, 0);
  }

  canvas.addEventListener('mousedown', down);
  canvas.addEventListener('mouseup', up);
  canvas.addEventListener('mousemove', move);
  canvas.addEventListener('touchstart', e => {
    if (e.changedTouches.length == 1) {
      down(e.changedTouches[0]);
    }
  });
  canvas.addEventListener('touchend', e => {
    if (e.changedTouches.length == 1) {
      up(e.changedTouches[0]);
    }
  });
  canvas.addEventListener('touchmove', e => {
    if (e.changedTouches.length == 1) {
      move(e.changedTouches[0]);
      e.preventDefault();
    }
  });
  editTrans.addEventListener('change', changeColor);
}