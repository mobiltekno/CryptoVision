'use client';
import { useEffect, useRef, useState } from 'react';
import { useWriteContract } from 'wagmi';
import { STORE_ABI, STORE_ADDR } from '@/lib/contract';

type Bullet = { x:number; y:number };
type EnemyBullet = { x:number; y:number; vx:number; vy:number };
type Particle = { x:number; y:number; vx:number; vy:number; life:number; max:number; color:string };

type Foe = {
  baseX:number; baseY:number; x:number; y:number;
  alive:boolean; attacking:boolean; vx:number; vy:number; spriteIdx:number;
};
type Foe2 = { x:number; y:number; alive:boolean; fireCd:number; spriteIdx:number };

export default function GameCanvas({
  shipTier,
  onScored,
  onGameOver,
}: {
  shipTier: 1 | 2 | 3;
  onScored?: () => void;
  onGameOver?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const { writeContractAsync } = useWriteContract();

  const shipSrcMap: Record<1|2|3, string> = {
    1: '/ship_t1.png', 2: '/ship_t2.png', 3: '/ship_t3.png',
  };
  const W1_SPRITES = ['/w1_a.png', '/w1_b.png'];
  const W2_SPRITES = ['/w2_a.png', '/w2_b.png'];

  const loadImage = (src:string) => new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image(); i.src = src; i.onload = () => res(i); i.onerror = rej;
  });

  useEffect(() => {
    const cvs = canvasRef.current!; const ctx = cvs.getContext('2d')!;
    cvs.width = 360; cvs.height = 480;
    (ctx as any).imageSmoothingEnabled = false;

    // Canvas odak + klavye
    cvs.tabIndex = 0;
    try { cvs.focus({ preventScroll: true }); } catch {}

    // HP
    const MAX_HP = shipTier === 1 ? 100 : shipTier === 2 ? 150 : 200;
    let hp = MAX_HP;

    // Ship
    const SHIP_DRAW = 64;
    const SHIP_HIT  = 42;
    const EDGE_M = 6;
    const ship = { x: cvs.width/2, y: cvs.height-70, w: SHIP_HIT, h: SHIP_HIT, speed: 3.2 };

    const bullets: Bullet[] = [];
    const enemyBullets: EnemyBullet[] = [];
    const particles: Particle[] = [];

    // Waves
    const foes: Foe[] = [];
    for (let r=0;r<4;r++) for (let c=0;c<8;c++) {
      const bx=30+c*38, by=30+r*28;
      foes.push({ baseX:bx, baseY:by, x:bx, y:by, alive:true, attacking:false, vx:0, vy:0, spriteIdx:(r+c)%W1_SPRITES.length });
    }
    let wave2: Foe2[] = [];
    let inWave2 = false;

    // Param
    let last=0, fireCd=0;
    const fireRate = shipTier===1?320 : shipTier===2?220 : 140;
    const mult = shipTier===1?1 : shipTier===2?2 : 3;

    // W1
    let attackTimer=0, w1ShootTimer=0;
    const ATTACK_INTERVAL=1200, ATTACK_SPEED_Y=2.2, ATTACK_HOMING=0.03;
    const W1_SHOOT_INTERVAL=1500, W1_BULLET_V=1.2;

    // W2
    const W2_ROWS=3, W2_COLS=6, W2_STARTY=60, W2_GAPX=46;
    const W2_FIRE_MS=10000, W2_BULLET_V=0.9;

    // Damage
    const DMG_W1_COLLIDE=25, DMG_W2_COLLIDE=20, DMG_BULLET=12;

    // Helpers
    const rectHit = (ax:number,ay:number,aw:number,ah:number,bx:number,by:number,bw:number,bh:number) =>
      ax < bx+bw && ax+aw > bx && ay < by+bh && ay+ah > by;

    const damage = (d:number) => { if (state!=='play') return; hp -= d; if (hp<=0) explode(); };

    // Klavye (ok tuşları)
    const keys:Record<string,boolean> = {};
    const onKey=(e:KeyboardEvent)=>{ 
      keys[e.key] = e.type==='keydown';
      if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key)) e.preventDefault();
    };
    cvs.addEventListener('keydown', onKey);
    cvs.addEventListener('keyup', onKey);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);

    const clampPos = () => {
      const half = SHIP_HIT/2;
      const barSpace = 8 + 8 + 4;
      ship.x = Math.max(half+EDGE_M, Math.min(cvs.width - half - EDGE_M, ship.x));
      ship.y = Math.max(half+EDGE_M, Math.min(cvs.height - half - EDGE_M - barSpace, ship.y));
    };

    const toLocal=(cx:number,cy:number)=>{
      const r=cvs.getBoundingClientRect();
      const x=((cx-r.left)/r.width)*cvs.width;
      const y=((cy-r.top)/r.height)*cvs.height;
      return { x, y };
    };

    // ---------- TOUCH/MOBILE: Pointer Events ile tek parmak sürükle ----------
    let dragging = false;
    let activeId: number | null = null;

    const onPointerDown = (e:PointerEvent) => {
      // sadece primary touch/mouse
      if (activeId!==null) return;
      dragging = true; activeId = e.pointerId;
      cvs.setPointerCapture?.(e.pointerId);
      const p=toLocal(e.clientX,e.clientY);
      ship.x=p.x; ship.y=p.y; clampPos();
      e.preventDefault();
      cvs.focus();
    };
    const onPointerMove = (e:PointerEvent) => {
      if (!dragging || e.pointerId!==activeId) return;
      const p=toLocal(e.clientX,e.clientY);
      ship.x=p.x; ship.y=p.y; clampPos();
      e.preventDefault();
    };
    const endPointer = (e:PointerEvent) => {
      if (e.pointerId!==activeId) return;
      dragging=false; activeId=null;
      cvs.releasePointerCapture?.(e.pointerId);
      e.preventDefault();
    };

    cvs.addEventListener('pointerdown', onPointerDown, { passive:false });
    window.addEventListener('pointermove', onPointerMove, { passive:false });
    window.addEventListener('pointerup',   endPointer,     { passive:false });
    window.addEventListener('pointercancel', endPointer,   { passive:false });

    // -------------------------------------------------------------------------

    // Asset preload
    let shipImg:HTMLImageElement, w1Imgs:HTMLImageElement[]=[], w2Imgs:HTMLImageElement[]=[];
    let assetsReady=false;
    Promise.all([
      loadImage(shipSrcMap[shipTier]),
      ...W1_SPRITES.map(loadImage),
      ...W2_SPRITES.map(loadImage),
    ]).then((imgs)=>{
      shipImg = imgs[0]; w1Imgs = imgs.slice(1,1+W1_SPRITES.length); w2Imgs = imgs.slice(1+W1_SPRITES.length);
      assetsReady=true; requestAnimationFrame(tick);
    }).catch(()=>{ assetsReady=true; requestAnimationFrame(tick); });

    // State
    type State = 'play' | 'explode' | 'done';
    let state: State = 'play';
    let explodeTimer = 0;
    let scoreSubmitted = false;

    function spawnWave2(){
      const totalW=(W2_COLS-1)*W2_GAPX, startX=cvs.width/2-totalW/2;
      wave2=[];
      for(let r=0;r<W2_ROWS;r++) for(let c=0;c<W2_COLS;c++){
        const x=startX+c*W2_GAPX, y=W2_STARTY+r*34;
        wave2.push({ x, y, alive:true, fireCd: Math.floor(Math.random()*W2_FIRE_MS), spriteIdx:(r+c)%W2_SPRITES.length });
      }
      inWave2=true;
    }
    function chooseAttacker(){
      const pool=foes.filter(f=>f.alive && !f.attacking); if(!pool.length) return;
      const f=pool[Math.floor(Math.random()*pool.length)];
      f.attacking=true; f.vx=0; f.vy=ATTACK_SPEED_Y;
    }
    function resetFoe(f:Foe){ f.x=f.baseX; f.y=f.baseY; f.vx=0; f.vy=0; f.attacking=false; }

    function explode(){
      state = 'explode';
      explodeTimer = 0;
      for (let i=0;i<60;i++){
        const a = Math.random()*Math.PI*2;
        const sp = 1.2 + Math.random()*2.2;
        particles.push({ x: ship.x, y: ship.y, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp, life: 0, max: 50 + Math.random()*30,
          color: i%3===0 ? '#ffd166' : i%3===1 ? '#ef4444' : '#f97316' });
      }
      if (!scoreSubmitted && score>0) {
        scoreSubmitted = true;
        (async ()=>{ try {
          await writeContractAsync({ address: STORE_ADDR, abi: STORE_ABI, functionName: 'submitScore', args: [BigInt(score)] });
          onScored?.();
        } catch {} })();
      }
    }

    function tick(ts:number){
      if (!assetsReady) { drawLoading(); requestAnimationFrame(tick); return; }

      const dt = last ? ts-last : 16; last = ts;

      if (state === 'play') {
        fireCd -= dt; attackTimer += dt; w1ShootTimer += dt;

        // Klavye ile 4 yön
        if (keys['ArrowLeft'])  ship.x -= ship.speed;
        if (keys['ArrowRight']) ship.x += ship.speed;
        if (keys['ArrowUp'])    ship.y -= ship.speed;
        if (keys['ArrowDown'])  ship.y += ship.speed;
        clampPos();

        // Ateş
        if (fireCd<=0){ bullets.push({x:ship.x, y:ship.y-(SHIP_HIT/2)}); fireCd=fireRate; }
        bullets.forEach(b=> b.y -= 5);

        // Wave1
        if (!inWave2 && attackTimer>=ATTACK_INTERVAL){ attackTimer=0; chooseAttacker(); }
        if (!inWave2 && w1ShootTimer>=W1_SHOOT_INTERVAL){
          w1ShootTimer=0;
          const shooters=foes.filter(f=>f.alive);
          if (shooters.length){
            const s=shooters[Math.floor(Math.random()*shooters.length)];
            const dx=ship.x-s.x, dy=ship.y-s.y, m=Math.hypot(dx,dy)||1;
            enemyBullets.push({ x:s.x, y:s.y, vx:(dx/m)*W1_BULLET_V, vy:(dy/m)*W1_BULLET_V });
          }
        }
        for (const f of foes){
          if (!f.alive) continue;
          if (f.attacking){
            const dx=ship.x-f.x; f.vx += dx*ATTACK_HOMING;
            if (f.vx>3) f.vx=3; if (f.vx<-3) f.vx=-3;
            f.x += f.vx; f.y += f.vy;
            if (rectHit(f.x-10,f.y-10,20,20, ship.x-ship.w/2, ship.y-ship.h/2, ship.w, ship.h)){
              damage(DMG_W1_COLLIDE);
              resetFoe(f);
            }
            if (f.y>cvs.height+10) resetFoe(f);
          } else { f.x=f.baseX; f.y=f.baseY; }
        }
        for (const f of foes){
          if (!f.alive) continue;
          for (const b of bullets){
            if (rectHit(b.x-1,b.y-6,2,6, f.x-10,f.y-10,20,20)){
              f.alive=false; b.y=-9999; setScore(s=>s+10*mult);
            }
          }
        }

        if (!inWave2 && !foes.some(f=>f.alive)) spawnWave2();

        // Wave2
        if (inWave2){
          for (const e of wave2){
            if (!e.alive) continue;
            e.fireCd -= dt;
            if (e.fireCd<=0){
              const dx=ship.x-e.x, dy=ship.y-e.y, m=Math.hypot(dx,dy)||1;
              enemyBullets.push({ x:e.x, y:e.y, vx:(dx/m)*W2_BULLET_V, vy:(dy/m)*W2_BULLET_V });
              e.fireCd = W2_FIRE_MS + Math.floor(Math.random()*1500) - 750;
            }
            if (rectHit(e.x-12,e.y-12,24,24, ship.x-ship.w/2, ship.y-ship.h/2, ship.w, ship.h)){
              damage(DMG_W2_COLLIDE);
            }
          }
        }

        // Düşman mermileri
        for (const eb of enemyBullets){ eb.x+=eb.vx; eb.y+=eb.vy; }
        for (let i=enemyBullets.length-1;i>=0;i--){
          const eb=enemyBullets[i];
          if (rectHit(eb.x-2,eb.y-4,4,8, ship.x-ship.w/2, ship.y-ship.h/2, ship.w, ship.h)){
            damage(DMG_BULLET); enemyBullets.splice(i,1);
          } else if (eb.y<-30||eb.y>cvs.height+50||eb.x<-50||eb.x>cvs.width+50){
            enemyBullets.splice(i,1);
          }
        }

        // Temizlik
        for (let i=bullets.length-1;i>=0;i--) if (bullets[i].y<-50) bullets.splice(i,1);
      }
      else if (state === 'explode') {
        explodeTimer += dt;
        for (const p of particles){ p.x += p.vx; p.y += p.vy; p.life += 1; p.vy += 0.02; }
        if (explodeTimer > 1200) { state = 'done'; onGameOver?.(); }
      }

      draw();
      requestAnimationFrame(tick);
    }

    function drawLoading(){
      ctx.fillStyle='#000'; ctx.fillRect(0,0,cvs.width,cvs.height);
      ctx.fillStyle='#fff'; ctx.fillText('sprite’lar yükleniyor…', 90, cvs.height/2);
    }

    function draw(){
      ctx.fillStyle='#000'; ctx.fillRect(0,0,cvs.width,cvs.height);

      // Ship / patlama
      if (state !== 'explode') {
        if (shipImg && shipImg.complete)
          ctx.drawImage(shipImg, ship.x - SHIP_DRAW/2, ship.y - SHIP_DRAW/2, SHIP_DRAW, SHIP_DRAW);
        else {
          ctx.fillStyle='#22c55e';
          ctx.fillRect(ship.x-SHIP_HIT/2, ship.y-SHIP_HIT/2, SHIP_HIT, SHIP_HIT);
        }
      } else {
        for (const p of particles){
          const alpha = 1 - p.life / p.max;
          if (alpha <= 0) continue;
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, alpha);
          ctx.fillRect(p.x, p.y, 3, 3);
          ctx.globalAlpha = 1;
        }
      }

      // Player bullets
      ctx.fillStyle='#fff';
      bullets.forEach(b=> ctx.fillRect(b.x-1, b.y-6, 2, 6));

      // Enemies
      foes.forEach(f=>{
        if (!f.alive) return;
        ctx.drawImage(
          (w1Imgs?.[f.spriteIdx % (w1Imgs.length||1)]) ?? ({} as HTMLImageElement),
          f.x-18, f.y-18, 36, 36
        );
      });
      if (inWave2){
        wave2.forEach(e=>{
          if (!e.alive) return;
          ctx.drawImage(
            (w2Imgs?.[e.spriteIdx % (w2Imgs.length||1)]) ?? ({} as HTMLImageElement),
            e.x-20, e.y-20, 40, 40
          );
        });
      }

      // Enemy bullets
      ctx.fillStyle='#f33';
      enemyBullets.forEach(eb => ctx.fillRect(eb.x-2, eb.y-4, 4, 8));

      // Skor
      ctx.fillStyle='#fff';
      ctx.fillText(`Skor: ${score}`, 10, 16);

      // HP bar (altta)
      if (state === 'play') {
        const ratio = Math.max(0, Math.min(1, hp / MAX_HP));
        const lerp=(a:number,b:number,t:number)=>Math.round(a+(b-a)*t);
        const rr=lerp(34,239,1-ratio), gg=lerp(197,68,1-ratio), bb=lerp(94,68,1-ratio);
        const bw=90, bh=8; let bx=ship.x-bw/2; let by=ship.y+SHIP_HIT/2+8;
        if (by+bh > cvs.height-EDGE_M) by = cvs.height-EDGE_M-bh;
        ctx.fillStyle='rgba(255,255,255,.15)'; ctx.fillRect(bx,by,bw,bh);
        ctx.fillStyle=`rgb(${rr},${gg},${bb})`; ctx.fillRect(bx,by,bw*ratio,bh);
        ctx.strokeStyle='rgba(255,255,255,.35)'; ctx.strokeRect(bx,by,bw,bh);
      }
    }

    // İlk çizim
    drawLoading();

    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
      cvs.removeEventListener('keydown', onKey);
      cvs.removeEventListener('keyup', onKey);

      cvs.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup',   endPointer);
      window.removeEventListener('pointercancel', endPointer);
    };
  }, [shipTier, writeContractAsync]);

  return (
    <canvas
      ref={canvasRef}
      className="rounded-xl border border-white/10"
      // mobile’de sayfa scroll/zoom olmasın
      style={{
        position:'absolute', inset:0, width:'100%', height:'100%', display:'block',
        touchAction:'none', WebkitUserSelect:'none', userSelect:'none'
      }}
    />
  );
}
