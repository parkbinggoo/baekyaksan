(()=>{
'use strict';const IOS_CLOUD_SAFE = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
if(IOS_CLOUD_SAFE) document.getElementById('iosClouds').style.display='block';
if(!window.THREE){document.body.innerHTML='<p style="padding:40px;font-family:sans-serif">3D 엔진을 불러오지 못했습니다. 새로고침해 주세요.</p>';return}
