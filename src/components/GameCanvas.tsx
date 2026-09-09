import React, { useEffect, useRef, useState } from "react";
import { GameConfig } from "../types";
import { Play, Pause, RotateCcw, Shield, Zap, Crosshair, Award } from "lucide-react";

interface Props {
  config: GameConfig;
  onStatsUpdate?: (stats: { score: number; kills: number; wave: number; fps: number }) => void;
  activePatchBadge?: string | null;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  type: string;
  damage: number;
  piercing?: boolean;
  bounces?: number;
  angle?: number;
  orbitIndex?: number;
  hitEnemies?: Set<number>;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  size: number;
  speed: number;
  isBoss: boolean;
  isMini?: boolean;
  color: string;
}

interface Gem {
  x: number;
  y: number;
  value: number;
  size: number;
}

export const GameCanvas: React.FC<Props> = ({ config, onStatsUpdate, activePatchBadge }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [kills, setKills] = useState(0);
  const [playerHp, setPlayerHp] = useState(100);
  const [wave, setWave] = useState(1);

  // Keep references for animation loop
  const stateRef = useRef({
    player: {
      x: 300,
      y: 300,
      vx: 0,
      vy: 0,
      angle: 0,
      trail: [] as { x: number; y: number; alpha: number }[],
    },
    keys: {} as Record<string, boolean>,
    touchPos: null as { x: number; y: number } | null,
    mousePos: { x: 300, y: 300 },
    isMouseDown: false,
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    gems: [] as Gem[],
    lastShotTime: 0,
    lastSpawnTime: 0,
    enemyIdCounter: 1,
    orbitAngle: 0,
    shakeDuration: 0,
    shakeOffset: { x: 0, y: 0 },
    score: 0,
    kills: 0,
    playerHp: 100,
    wave: 1,
    fps: 60,
    frameCount: 0,
    lastFpsTime: performance.now(),
  });

  // Handle canvas sizing dynamically
  const [dimensions, setDimensions] = useState({ width: 600, height: 450 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 50 && height > 50) {
          setDimensions({
            width: Math.floor(width),
            height: Math.floor(height),
          });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key.toLowerCase()] = true;
      if (e.key === "p" || e.key === "P") {
        setIsPaused((prev) => !prev);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Mouse & Touch controls
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    stateRef.current.touchPos = { x, y };
    stateRef.current.mousePos = { x, y };
    stateRef.current.isMouseDown = true;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    stateRef.current.mousePos = { x, y };
    if (stateRef.current.isMouseDown) {
      stateRef.current.touchPos = { x, y };
    }
  };

  const handlePointerUp = () => {
    stateRef.current.touchPos = null;
    stateRef.current.isMouseDown = false;
  };

  const resetGame = () => {
    stateRef.current.player.x = dimensions.width / 2;
    stateRef.current.player.y = dimensions.height / 2;
    stateRef.current.bullets = [];
    stateRef.current.enemies = [];
    stateRef.current.particles = [];
    stateRef.current.gems = [];
    stateRef.current.score = 0;
    stateRef.current.kills = 0;
    stateRef.current.playerHp = config.playerMaxHp;
    stateRef.current.wave = 1;
    setScore(0);
    setKills(0);
    setPlayerHp(config.playerMaxHp);
    setGameOver(false);
    setIsPaused(false);
  };

  // Main Canvas Render & Game Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const triggerScreenShake = (intensity: number) => {
      stateRef.current.shakeDuration = Math.min(20, 10 * intensity * config.screenShakeIntensity);
    };

    const addFloatingText = (x: number, y: number, text: string, color: string) => {
      stateRef.current.floatingTexts.push({
        x,
        y,
        text,
        color,
        alpha: 1.0,
        vy: -1.5,
      });
    };

    const spawnParticles = (x: number, y: number, color: string, count = 8, speed = 3) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const v = Math.random() * speed + 1;
        stateRef.current.particles.push({
          x,
          y,
          vx: Math.cos(angle) * v,
          vy: Math.sin(angle) * v,
          color,
          size: Math.random() * 3 + 2,
          alpha: 1.0,
          decay: Math.random() * 0.03 + 0.02,
        });
      }
    };

    const gameLoop = (currentTime: number) => {
      animId = requestAnimationFrame(gameLoop);

      const rawDt = Math.min(50, currentTime - lastTime);
      lastTime = currentTime;
      const dt = (rawDt / 16.67) * config.timeScale;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const state = stateRef.current;
      const { width, height } = dimensions;

      // FPS calculation
      state.frameCount++;
      if (currentTime - state.lastFpsTime >= 500) {
        state.fps = Math.round((state.frameCount * 1000) / (currentTime - state.lastFpsTime));
        state.frameCount = 0;
        state.lastFpsTime = currentTime;
        onStatsUpdate?.({
          score: state.score,
          kills: state.kills,
          wave: state.wave,
          fps: state.fps,
        });
      }

      if (isPaused || gameOver) {
        // Just draw static frame
        return;
      }

      // 1. Player Movement Update
      const p = state.player;
      let moveX = 0;
      let moveY = 0;

      // Keyboard input
      if (state.keys["arrowleft"] || state.keys["a"]) moveX -= 1;
      if (state.keys["arrowright"] || state.keys["d"]) moveX += 1;
      if (state.keys["arrowup"] || state.keys["w"]) moveY -= 1;
      if (state.keys["arrowdown"] || state.keys["s"]) moveY += 1;

      // Touch / Virtual drag input
      if (state.touchPos) {
        const dx = state.touchPos.x - p.x;
        const dy = state.touchPos.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 15) {
          moveX = dx / dist;
          moveY = dy / dist;
        }
      }

      // Normalize diagonal movement
      if (moveX !== 0 && moveY !== 0) {
        const len = Math.sqrt(moveX * moveX + moveY * moveY);
        moveX /= len;
        moveY /= len;
      }

      p.vx = moveX * config.playerSpeed;
      p.vy = moveY * config.playerSpeed;
      p.x = Math.max(config.playerSize, Math.min(width - config.playerSize, p.x + p.vx * dt));
      p.y = Math.max(config.playerSize, Math.min(height - config.playerSize, p.y + p.vy * dt));

      // Aim angle towards mouse or movement
      const aimDx = state.mousePos.x - p.x;
      const aimDy = state.mousePos.y - p.y;
      p.angle = Math.atan2(aimDy, aimDx);

      // Player ghost trail
      if (config.playerGhostTrail && (moveX !== 0 || moveY !== 0)) {
        p.trail.push({ x: p.x, y: p.y, alpha: 0.6 });
      }
      p.trail.forEach((t) => (t.alpha -= 0.05 * dt));
      p.trail = p.trail.filter((t) => t.alpha > 0);

      // 2. Weapon Firing Logic
      const shouldFire = config.autoFire || state.isMouseDown || state.keys[" "];
      if (shouldFire && currentTime - state.lastShotTime >= config.bulletCooldown) {
        state.lastShotTime = currentTime;

        const count = config.bulletCount;
        const baseAngle = p.angle;
        const bType = config.bulletType;

        if (bType === "spread") {
          const totalSpread = config.bulletSpread;
          const step = count > 1 ? totalSpread / (count - 1) : 0;
          const startAngle = baseAngle - totalSpread / 2;

          for (let i = 0; i < count; i++) {
            const angle = count === 1 ? baseAngle : startAngle + i * step;
            state.bullets.push({
              x: p.x + Math.cos(angle) * (config.playerSize + 5),
              y: p.y + Math.sin(angle) * (config.playerSize + 5),
              vx: Math.cos(angle) * config.bulletSpeed,
              vy: Math.sin(angle) * config.bulletSpeed,
              size: config.bulletSize,
              color: config.bulletColor,
              type: "spread",
              damage: config.bulletDamage,
              piercing: config.piercing,
            });
          }
        } else if (bType === "homing") {
          for (let i = 0; i < count; i++) {
            const offsetAngle = (i - (count - 1) / 2) * 0.25;
            const angle = baseAngle + offsetAngle;
            state.bullets.push({
              x: p.x + Math.cos(angle) * (config.playerSize + 4),
              y: p.y + Math.sin(angle) * (config.playerSize + 4),
              vx: Math.cos(angle) * config.bulletSpeed,
              vy: Math.sin(angle) * config.bulletSpeed,
              size: config.bulletSize + 1,
              color: config.bulletColor,
              type: "homing",
              angle: angle,
              damage: config.bulletDamage,
            });
          }
        } else if (bType === "laser") {
          state.bullets.push({
            x: p.x + Math.cos(baseAngle) * (config.playerSize + 8),
            y: p.y + Math.sin(baseAngle) * (config.playerSize + 8),
            vx: Math.cos(baseAngle) * config.bulletSpeed * 1.5,
            vy: Math.sin(baseAngle) * config.bulletSpeed * 1.5,
            size: config.bulletSize * 2.2,
            color: config.bulletColor,
            type: "laser",
            damage: config.bulletDamage * 1.8,
            piercing: true,
            hitEnemies: new Set(),
          });
          triggerScreenShake(0.5);
        } else if (bType === "bouncing") {
          state.bullets.push({
            x: p.x + Math.cos(baseAngle) * (config.playerSize + 5),
            y: p.y + Math.sin(baseAngle) * (config.playerSize + 5),
            vx: Math.cos(baseAngle) * config.bulletSpeed,
            vy: Math.sin(baseAngle) * config.bulletSpeed,
            size: config.bulletSize + 2,
            color: config.bulletColor,
            type: "bouncing",
            bounces: config.bounces || 3,
            damage: config.bulletDamage,
          });
        } else {
          // Normal bullet
          state.bullets.push({
            x: p.x + Math.cos(baseAngle) * (config.playerSize + 5),
            y: p.y + Math.sin(baseAngle) * (config.playerSize + 5),
            vx: Math.cos(baseAngle) * config.bulletSpeed,
            vy: Math.sin(baseAngle) * config.bulletSpeed,
            size: config.bulletSize,
            color: config.bulletColor,
            type: "normal",
            damage: config.bulletDamage,
          });
        }
      }

      // Orbital bullet update
      state.orbitAngle += 0.04 * dt;
      if (config.bulletType === "orbital") {
        // Maintain orbital bullets
        const orbitCount = config.bulletCount || 4;
        state.bullets = state.bullets.filter((b) => b.type !== "orbital");
        for (let i = 0; i < orbitCount; i++) {
          const theta = state.orbitAngle + (i * Math.PI * 2) / orbitCount;
          const dist = 60;
          state.bullets.push({
            x: p.x + Math.cos(theta) * dist,
            y: p.y + Math.sin(theta) * dist,
            vx: 0,
            vy: 0,
            size: config.bulletSize + 3,
            color: config.bulletColor,
            type: "orbital",
            damage: config.bulletDamage,
            orbitIndex: i,
          });
        }
      }

      // 3. Bullet Physics & Homing Tracking
      state.bullets.forEach((b) => {
        if (b.type === "orbital") return;

        if (b.type === "homing") {
          // Find nearest enemy
          let nearest: Enemy | null = null;
          let minDist = 350;
          for (const e of state.enemies) {
            const dx = e.x - b.x;
            const dy = e.y - b.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < minDist) {
              minDist = d;
              nearest = e;
            }
          }
          if (nearest && b.angle !== undefined) {
            const desired = Math.atan2(nearest.y - b.y, nearest.x - b.x);
            let diff = desired - b.angle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            b.angle += Math.sign(diff) * Math.min(Math.abs(diff), 0.12 * dt);
            b.vx = Math.cos(b.angle) * config.bulletSpeed;
            b.vy = Math.sin(b.angle) * config.bulletSpeed;
          }
        }

        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Bouncing logic
        if (b.type === "bouncing") {
          if (b.x <= b.size || b.x >= width - b.size) {
            b.vx *= -1;
            b.bounces = (b.bounces || 1) - 1;
            spawnParticles(b.x, b.y, b.color, 4, 2);
          }
          if (b.y <= b.size || b.y >= height - b.size) {
            b.vy *= -1;
            b.bounces = (b.bounces || 1) - 1;
            spawnParticles(b.x, b.y, b.color, 4, 2);
          }
        }
      });

      // Filter out of bounds bullets
      state.bullets = state.bullets.filter((b) => {
        if (b.type === "orbital") return true;
        if (b.type === "bouncing" && (b.bounces || 0) <= 0) return false;
        return b.x >= -30 && b.x <= width + 30 && b.y >= -30 && b.y <= height + 30;
      });

      // 4. Enemy Spawning
      const spawnInterval = Math.max(350, 1400 / config.enemySpawnRate);
      if (currentTime - state.lastSpawnTime >= spawnInterval) {
        state.lastSpawnTime = currentTime;

        // Spawn edge selection
        const edge = Math.floor(Math.random() * 4);
        let ex = 0;
        let ey = 0;
        if (edge === 0) {
          ex = Math.random() * width;
          ey = -20;
        } else if (edge === 1) {
          ex = width + 20;
          ey = Math.random() * height;
        } else if (edge === 2) {
          ex = Math.random() * width;
          ey = height + 20;
        } else {
          ex = -20;
          ey = Math.random() * height;
        }

        const isBoss = Math.random() < config.bossChance;
        state.enemies.push({
          id: state.enemyIdCounter++,
          x: ex,
          y: ey,
          vx: 0,
          vy: 0,
          hp: isBoss ? config.enemyHp * 4 : config.enemyHp,
          maxHp: isBoss ? config.enemyHp * 4 : config.enemyHp,
          size: isBoss ? 26 : 14,
          speed: isBoss ? config.enemySpeed * 0.75 : config.enemySpeed + (Math.random() * 0.4 - 0.2),
          isBoss,
          color: isBoss ? "#e11d48" : config.enemyColor,
        });
      }

      // 5. Enemy AI & Collisions with Bullets
      const freezeMult = config.enemyFreezeEffect > 0 ? 1 - config.enemyFreezeEffect : 1;

      state.enemies.forEach((e) => {
        const dx = p.x - e.x;
        const dy = p.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 1) {
          e.vx = (dx / dist) * e.speed * freezeMult;
          e.vy = (dy / dist) * e.speed * freezeMult;
        }
        e.x += e.vx * dt;
        e.y += e.vy * dt;

        // Player collision
        if (dist < e.size + config.playerSize) {
          if (config.playerShield) {
            // Shield absorbed hit!
            addFloatingText(p.x, p.y - 20, "SHIELD BLOCKED!", "#38bdf8");
            spawnParticles(p.x, p.y, "#38bdf8", 12, 4);
            triggerScreenShake(0.8);
            // Push enemy back
            e.x -= e.vx * 15;
            e.y -= e.vy * 15;
          } else {
            // Take damage
            const dmg = e.isBoss ? 25 : 12;
            state.playerHp = Math.max(0, state.playerHp - dmg);
            setPlayerHp(state.playerHp);
            addFloatingText(p.x, p.y - 20, `-${dmg} HP`, "#ef4444");
            spawnParticles(p.x, p.y, "#ef4444", 10, 4);
            triggerScreenShake(1.5);
            e.x -= e.vx * 10;
            e.y -= e.vy * 10;

            if (state.playerHp <= 0) {
              setGameOver(true);
            }
          }
        }
      });

      // Check Bullet & Enemy Hit
      for (const b of state.bullets) {
        for (const e of state.enemies) {
          if (b.hitEnemies?.has(e.id)) continue;

          const dx = b.x - e.x;
          const dy = b.y - e.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < b.size + e.size) {
            e.hp -= b.damage;
            spawnParticles(b.x, b.y, b.color, 6, 2.5);

            if (b.piercing) {
              b.hitEnemies?.add(e.id);
            } else if (b.type !== "orbital") {
              b.x = -999; // destroy bullet
            }

            if (e.hp <= 0) {
              // Enemy died!
              state.kills++;
              const pts = Math.round((e.isBoss ? 500 : 50) * config.scoreMultiplier);
              state.score += pts;
              setScore(state.score);
              setKills(state.kills);
              addFloatingText(e.x, e.y, `+${pts}`, e.isBoss ? "#fbbf24" : "#facc15");
              spawnParticles(e.x, e.y, e.color, e.isBoss ? 24 : 12, e.isBoss ? 6 : 3.5);
              triggerScreenShake(e.isBoss ? 2.5 : 0.6);

              // Spawn Crystal/Gem
              state.gems.push({
                x: e.x,
                y: e.y,
                value: e.isBoss ? 250 : 25,
                size: e.isBoss ? 9 : 5,
              });

              // Slime splitting mechanic if recipe enabled
              if (config.enemySplitOnDeath && !e.isMini) {
                for (let s = -1; s <= 1; s += 2) {
                  state.enemies.push({
                    id: state.enemyIdCounter++,
                    x: e.x + s * 14,
                    y: e.y,
                    vx: s * 1.5,
                    vy: (Math.random() - 0.5) * 2,
                    hp: 15,
                    maxHp: 15,
                    size: 8,
                    speed: config.enemySpeed * 1.3,
                    isBoss: false,
                    isMini: true,
                    color: "#a3e635",
                  });
                }
              }
            }
            break;
          }
        }
      }

      // Cleanup dead enemies & bullets
      state.enemies = state.enemies.filter((e) => e.hp > 0);
      state.bullets = state.bullets.filter((b) => b.x > -100);

      // 6. Gem Collection & Magnet System
      const magRadius = config.playerMagnetRadius;
      state.gems.forEach((gem) => {
        const dx = p.x - gem.x;
        const dy = p.y - gem.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < magRadius) {
          const pull = (1 - dist / magRadius) * 8 * dt;
          gem.x += (dx / dist) * pull;
          gem.y += (dy / dist) * pull;
        }

        if (dist < config.playerSize + gem.size) {
          // Collected
          state.score += Math.round(gem.value * config.scoreMultiplier);
          setScore(state.score);
          // Small heal chance
          if (state.playerHp < config.playerMaxHp && Math.random() < 0.2) {
            state.playerHp = Math.min(config.playerMaxHp, state.playerHp + 5);
            setPlayerHp(state.playerHp);
          }
          gem.x = -999;
          spawnParticles(p.x, p.y, "#38bdf8", 4, 2);
        }
      });
      state.gems = state.gems.filter((g) => g.x > -100);

      // Update Screen Shake
      if (state.shakeDuration > 0) {
        state.shakeDuration -= dt;
        state.shakeOffset = {
          x: (Math.random() - 0.5) * state.shakeDuration * 0.8,
          y: (Math.random() - 0.5) * state.shakeDuration * 0.8,
        };
      } else {
        state.shakeOffset = { x: 0, y: 0 };
      }

      // --- RENDERING PHASE ---
      ctx.save();
      ctx.clearRect(0, 0, width, height);
      ctx.translate(state.shakeOffset.x, state.shakeOffset.y);

      // Background theme
      let bgGrad = ctx.createLinearGradient(0, 0, width, height);
      if (config.theme === "matrix") {
        bgGrad.addColorStop(0, "#021207");
        bgGrad.addColorStop(1, "#03200d");
      } else if (config.theme === "synthwave") {
        bgGrad.addColorStop(0, "#19052b");
        bgGrad.addColorStop(1, "#090117");
      } else {
        // Cyberpunk dark
        bgGrad.addColorStop(0, "#090d16");
        bgGrad.addColorStop(1, "#0f172a");
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Cyber Grid
      if (config.showGrid) {
        ctx.strokeStyle = config.theme === "matrix" ? "rgba(34, 197, 94, 0.08)" : "rgba(56, 189, 248, 0.06)";
        ctx.lineWidth = 1;
        const gridSize = 35;
        ctx.beginPath();
        for (let x = 0; x < width; x += gridSize) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
        }
        for (let y = 0; y < height; y += gridSize) {
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
        }
        ctx.stroke();
      }

      // Glow setting
      if (config.neonGlow) {
        ctx.shadowBlur = 12;
      } else {
        ctx.shadowBlur = 0;
      }

      // Render Gems
      state.gems.forEach((gem) => {
        ctx.shadowColor = "#38bdf8";
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(gem.x, gem.y, gem.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Render Player Trails
      p.trail.forEach((t) => {
        ctx.fillStyle = config.playerColor;
        ctx.globalAlpha = t.alpha * 0.4;
        ctx.beginPath();
        ctx.arc(t.x, t.y, config.playerSize * 0.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      // Render Player Shield Bubble
      if (config.playerShield) {
        ctx.strokeStyle = "#38bdf8";
        ctx.fillStyle = "rgba(56, 189, 248, 0.15)";
        ctx.lineWidth = 2.5;
        ctx.shadowColor = "#38bdf8";
        ctx.beginPath();
        ctx.arc(p.x, p.y, config.playerSize + 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Render Player Ship
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.shadowColor = config.playerColor;
      ctx.fillStyle = config.playerColor;

      // Triangle spacecraft design
      ctx.beginPath();
      ctx.moveTo(config.playerSize * 1.4, 0);
      ctx.lineTo(-config.playerSize * 0.9, -config.playerSize * 0.9);
      ctx.lineTo(-config.playerSize * 0.5, 0);
      ctx.lineTo(-config.playerSize * 0.9, config.playerSize * 0.9);
      ctx.closePath();
      ctx.fill();

      // Thruster flame
      if (moveX !== 0 || moveY !== 0) {
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.moveTo(-config.playerSize * 0.6, -config.playerSize * 0.35);
        ctx.lineTo(-config.playerSize * 1.5 - Math.random() * 6, 0);
        ctx.lineTo(-config.playerSize * 0.6, config.playerSize * 0.35);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Render Bullets
      state.bullets.forEach((b) => {
        ctx.shadowColor = b.color;
        ctx.fillStyle = b.color;

        if (b.type === "laser") {
          // Elongated laser ray
          ctx.save();
          ctx.translate(b.x, b.y);
          const ang = Math.atan2(b.vy, b.vx);
          ctx.rotate(ang);
          ctx.fillRect(-25, -b.size / 2, 50, b.size);
          ctx.restore();
        } else if (b.type === "orbital") {
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Render Enemies
      state.enemies.forEach((e) => {
        ctx.shadowColor = e.color;
        ctx.fillStyle = e.color;

        // Frozen tint overlay
        if (config.enemyFreezeEffect > 0) {
          ctx.shadowColor = "#93c5fd";
        }

        ctx.beginPath();
        if (e.isBoss) {
          // Polygon boss
          const sides = 6;
          for (let i = 0; i < sides; i++) {
            const a = (i * Math.PI * 2) / sides;
            const px = e.x + Math.cos(a) * e.size;
            const py = e.y + Math.sin(a) * e.size;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
        } else {
          // Drone circle or diamond
          ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        }
        ctx.fill();

        // Enemy Health Bar (if damaged or boss)
        if (e.hp < e.maxHp || e.isBoss) {
          const barWidth = e.size * 2.2;
          const barHeight = 4;
          const barX = e.x - barWidth / 2;
          const barY = e.y - e.size - 8;

          ctx.shadowBlur = 0;
          ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
          ctx.fillRect(barX, barY, barWidth, barHeight);

          const hpPercent = Math.max(0, e.hp / e.maxHp);
          ctx.fillStyle = e.isBoss ? "#f59e0b" : "#ef4444";
          ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
          if (config.neonGlow) ctx.shadowBlur = 12;
        }
      });

      // Render Particles
      state.particles.forEach((pt) => {
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.alpha -= pt.decay * dt;

        if (pt.alpha > 0) {
          ctx.shadowColor = pt.color;
          ctx.fillStyle = pt.color;
          ctx.globalAlpha = pt.alpha;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
      });
      state.particles = state.particles.filter((pt) => pt.alpha > 0);

      // Render Floating Text
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      state.floatingTexts.forEach((ft) => {
        ft.y += ft.vy * dt;
        ft.alpha -= 0.02 * dt;
        if (ft.alpha > 0) {
          ctx.globalAlpha = ft.alpha;
          ctx.fillStyle = ft.color;
          ctx.shadowColor = ft.color;
          ctx.fillText(ft.text, ft.x, ft.y);
          ctx.globalAlpha = 1.0;
        }
      });
      state.floatingTexts = state.floatingTexts.filter((ft) => ft.alpha > 0);

      ctx.restore();
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [config, isPaused, gameOver, dimensions]);

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 select-none overflow-hidden" ref={containerRef}>
      {/* Top Game HUD bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-300 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">SCORE:</span>
            <span className="font-bold text-amber-300 text-sm">{score.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-1.5 font-mono">
            <Crosshair className="w-4 h-4 text-rose-400" />
            <span className="text-slate-400">KILLS:</span>
            <span className="font-bold text-rose-300 text-sm">{kills}</span>
          </div>
        </div>

        {/* Player HP bar */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {config.playerShield ? (
              <Shield className="w-4 h-4 text-sky-400 animate-pulse" />
            ) : (
              <Zap className="w-4 h-4 text-emerald-400" />
            )}
            <span className="font-mono font-semibold">HP {playerHp}%</span>
          </div>
          <div className="w-20 sm:w-28 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all duration-150 ${
                config.playerShield
                  ? "bg-sky-400"
                  : playerHp > 40
                  ? "bg-emerald-400"
                  : "bg-rose-500 animate-pulse"
              }`}
              style={{ width: `${playerHp}%` }}
            />
          </div>

          <button
            id="btn-pause-toggle"
            onClick={() => setIsPaused((p) => !p)}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title={isPaused ? "再開 (P)" : "一時停止 (P)"}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Active Patch Pill Flash Overlay */}
      {activePatchBadge && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-bounce">
          <div className="px-3 py-1 bg-emerald-500/90 text-white font-mono text-xs font-semibold rounded-full shadow-lg shadow-emerald-500/30 flex items-center gap-1.5 border border-emerald-300">
            <span className="inline-block w-2 h-2 rounded-full bg-white animate-ping" />
            ⚡ {activePatchBadge}
          </div>
        </div>
      )}

      {/* Main Interactive Canvas */}
      <canvas
        id="game-canvas"
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex-1 w-full h-full cursor-crosshair touch-none"
      />

      {/* Game Over Screen */}
      {gameOver && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-30">
          <div className="p-6 bg-slate-900 border border-slate-700 rounded-xl text-center max-w-sm w-full shadow-2xl">
            <h2 className="text-xl font-bold text-rose-400 mb-2 font-mono">MISSION TERMINATED</h2>
            <p className="text-slate-400 text-sm mb-4">
              最終スコア: <span className="font-bold text-amber-300">{score.toLocaleString()}</span> (撃破数: {kills})
            </p>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              「シールド展開」「3連射」「敵凍結」などの指示でゲームコードを改造して再挑戦しましょう！
            </p>
            <button
              id="btn-restart-game"
              onClick={resetGame}
              className="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              改造状態を維持してリスタート
            </button>
          </div>
        </div>
      )}

      {/* Mobile/Galaxy S25 Touch Hint */}
      <div className="sm:hidden absolute bottom-2 left-2 text-[10px] text-slate-500 pointer-events-none bg-slate-900/80 px-2 py-0.5 rounded">
        👆 画面タップ/ドラッグで自機移動＆オート射撃
      </div>
    </div>
  );
};
