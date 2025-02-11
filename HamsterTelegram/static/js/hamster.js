class HamsterGame {
    constructor() {
        this.canvas = document.getElementById('hamsterCanvas');
        this.ctx = setupCanvas(this.canvas);
        this.score = 0;
        this.gameOver = true;
        this.gameId = null;
        this.playerId = null;
        this.otherPlayers = new Map();
        this.hamster = {
            x: this.canvas.width / 4,
            y: this.canvas.height / 2,
            size: 30,
            speed: 5,
            trail: []
        };
        this.items = [];
        this.obstacles = [];
        this.keys = {};
        this.particleEffects = [];

        this.setupEventListeners();
        this.loadHighScore();
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => this.keys[e.key] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key] = false);

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.handleTouch(touch.clientX - rect.left, touch.clientY - rect.top);
        });

        document.getElementById('startHamster').addEventListener('click', () => this.startGame());
    }

    loadHighScore() {
        document.getElementById('hamsterHighScore').textContent = getHighScore('hamster');
    }

    async startGame() {
        if (!this.gameId) {
            try {
                const response = await fetch('/api/game/join', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ game_id: Date.now().toString() })
                });
                const data = await response.json();
                this.gameId = data.game_id;
                this.playerId = data.players[0].id;
            } catch (error) {
                console.error('Failed to join game:', error);
                return;
            }
        }

        this.gameOver = false;
        this.score = 0;
        this.items = [];
        this.obstacles = [];
        this.particleEffects = [];
        this.hamster.x = this.canvas.width / 4;
        this.hamster.y = this.canvas.height / 2;
        this.hamster.trail = [];
        document.getElementById('startHamster').disabled = true;
        this.gameLoop();
        this.startGameStatePolling();
    }

    async updateGameState() {
        try {
            const response = await fetch('/api/game/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    game_id: this.gameId,
                    player_id: this.playerId,
                    score: this.score
                })
            });
            const data = await response.json();

            // Update other players
            data.players.forEach(player => {
                if (player.id !== this.playerId) {
                    this.otherPlayers.set(player.id, {
                        score: player.score,
                        x: player.x || this.canvas.width / 4,
                        y: player.y || this.canvas.height / 2
                    });
                }
            });
        } catch (error) {
            console.error('Failed to update game state:', error);
        }
    }

    startGameStatePolling() {
        this.gameStateInterval = setInterval(async () => {
            if (!this.gameOver) {
                await this.updateGameState();
            } else {
                clearInterval(this.gameStateInterval);
            }
        }, 1000);
    }

    handleTouch(x, y) {
        if (this.gameOver) return;

        const dx = x - this.hamster.x;
        const dy = y - this.hamster.y;

        this.hamster.x += Math.sign(dx) * this.hamster.speed;
        this.hamster.y += Math.sign(dy) * this.hamster.speed;
    }

    createParticleEffect(x, y, color) {
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            this.particleEffects.push({
                x,
                y,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                size: 4,
                color,
                life: 1
            });
        }
    }

    update() {
        if (this.gameOver) return;

        // Handle keyboard movement
        if (this.keys['ArrowUp']) this.hamster.y -= this.hamster.speed;
        if (this.keys['ArrowDown']) this.hamster.y += this.hamster.speed;
        if (this.keys['ArrowLeft']) this.hamster.x -= this.hamster.speed;
        if (this.keys['ArrowRight']) this.hamster.x += this.hamster.speed;

        // Keep hamster in bounds
        this.hamster.x = Math.max(this.hamster.size, Math.min(this.canvas.width - this.hamster.size, this.hamster.x));
        this.hamster.y = Math.max(this.hamster.size, Math.min(this.canvas.height - this.hamster.size, this.hamster.y));

        // Update trail
        this.hamster.trail.unshift({ x: this.hamster.x, y: this.hamster.y });
        if (this.hamster.trail.length > 10) this.hamster.trail.pop();

        // Spawn items and obstacles
        if (Math.random() < 0.02) this.spawnItem();
        if (Math.random() < 0.01) this.spawnObstacle();

        // Update items and obstacles
        this.items = this.items.filter(item => {
            item.x -= 2;
            if (this.checkCollision(item)) {
                this.score += 10;
                document.getElementById('hamsterScore').textContent = this.score;
                this.createParticleEffect(item.x, item.y, '#0ff');
                return false;
            }
            return item.x > -20;
        });

        this.obstacles = this.obstacles.filter(obstacle => {
            obstacle.x -= 3;
            if (this.checkCollision(obstacle)) {
                this.gameOver = true;
                this.createParticleEffect(obstacle.x, obstacle.y, '#f0f');
                if (saveHighScore('hamster', this.score)) {
                    this.loadHighScore();
                }
                document.getElementById('startHamster').disabled = false;
                return false;
            }
            return obstacle.x > -20;
        });

        // Update particle effects
        this.particleEffects = this.particleEffects.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.02;
            return particle.life > 0;
        });
    }

    spawnItem() {
        this.items.push({
            x: this.canvas.width,
            y: Math.random() * (this.canvas.height - 40) + 20,
            size: 15
        });
    }

    spawnObstacle() {
        this.obstacles.push({
            x: this.canvas.width,
            y: Math.random() * (this.canvas.height - 40) + 20,
            size: 20
        });
    }

    checkCollision(object) {
        const dx = this.hamster.x - object.x;
        const dy = this.hamster.y - object.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (this.hamster.size + object.size);
    }

    drawNeonEffect(x, y, radius, color) {
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'transparent');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
        this.ctx.fill();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid background
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.canvas.width; i += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.canvas.height);
            this.ctx.stroke();
        }
        for (let i = 0; i < this.canvas.height; i += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.canvas.width, i);
            this.ctx.stroke();
        }

        // Draw other players
        this.otherPlayers.forEach((player, id) => {
            this.drawNeonEffect(player.x, player.y, this.hamster.size, 'rgba(255, 0, 255, 0.3)');
            this.ctx.fillStyle = '#f0f';
            this.ctx.beginPath();
            this.ctx.arc(player.x, player.y, this.hamster.size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Draw trail
        this.hamster.trail.forEach((pos, i) => {
            const alpha = 1 - (i / this.hamster.trail.length);
            this.ctx.fillStyle = `rgba(0, 255, 255, ${alpha * 0.3})`;
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, this.hamster.size * 0.8, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Draw items with neon effect
        this.items.forEach(item => {
            this.drawNeonEffect(item.x, item.y, item.size, 'rgba(0, 255, 255, 0.3)');
            this.ctx.fillStyle = '#0ff';
            this.ctx.beginPath();
            this.ctx.arc(item.x, item.y, item.size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Draw obstacles with neon effect
        this.obstacles.forEach(obstacle => {
            this.drawNeonEffect(obstacle.x, obstacle.y, obstacle.size, 'rgba(255, 0, 255, 0.3)');
            this.ctx.fillStyle = '#f0f';
            this.ctx.beginPath();
            this.ctx.arc(obstacle.x, obstacle.y, obstacle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Draw hamster with neon effect
        this.drawNeonEffect(this.hamster.x, this.hamster.y, this.hamster.size, 'rgba(0, 255, 255, 0.3)');
        this.ctx.fillStyle = '#0ff';
        this.ctx.beginPath();
        this.ctx.arc(this.hamster.x, this.hamster.y, this.hamster.size, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw particle effects
        this.particleEffects.forEach(particle => {
            this.ctx.fillStyle = `${particle.color}${Math.floor(particle.life * 255).toString(16).padStart(2, '0')}`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Draw scores
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Your Score: ${this.score}`, 10, 30);

        let yOffset = 50;
        this.otherPlayers.forEach((player, id) => {
            this.ctx.fillText(`Player ${id}: ${player.score}`, 10, yOffset);
            yOffset += 20;
        });
    }

    gameLoop() {
        this.update();
        this.draw();
        if (!this.gameOver) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new HamsterGame();
});