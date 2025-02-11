class CoinGame {
    constructor() {
        this.canvas = document.getElementById('coinCanvas');
        this.ctx = setupCanvas(this.canvas);
        this.isFlipping = false;
        this.rotationAngle = 0;
        this.flipSpeed = 0.2;
        this.wins = parseInt(localStorage.getItem('coinWins') || 0);
        this.currentChoice = null;
        
        document.getElementById('coinWins').textContent = this.wins;
        
        this.setupEventListeners();
        this.draw();
    }

    setupEventListeners() {
        document.getElementById('chooseTails').addEventListener('click', () => this.flip('tails'));
        document.getElementById('chooseHeads').addEventListener('click', () => this.flip('heads'));
    }

    flip(choice) {
        if (this.isFlipping) return;
        
        this.isFlipping = true;
        this.currentChoice = choice;
        this.rotationAngle = 0;
        
        const flips = 5 + Math.floor(Math.random() * 3); // Random number of flips
        const targetAngle = Math.PI * flips;
        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        
        this.animate(targetAngle, result);
    }

    animate(targetAngle, result) {
        this.rotationAngle += this.flipSpeed;
        this.draw();
        
        if (this.rotationAngle < targetAngle) {
            requestAnimationFrame(() => this.animate(targetAngle, result));
        } else {
            this.isFlipping = false;
            if (this.currentChoice === result) {
                this.wins++;
                localStorage.setItem('coinWins', this.wins);
                document.getElementById('coinWins').textContent = this.wins;
            }
            this.currentChoice = null;
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw coin
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = 80;
        
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(this.rotationAngle);
        
        // Draw coin circle
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fill();
        this.ctx.strokeStyle = '#DAA520';
        this.ctx.lineWidth = 5;
        this.ctx.stroke();
        
        // Draw face
        const scaleX = Math.cos(this.rotationAngle % (Math.PI * 2));
        this.ctx.scale(scaleX, 1);
        
        this.ctx.fillStyle = '#DAA520';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(scaleX > 0 ? 'H' : 'T', 0, 0);
        
        this.ctx.restore();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CoinGame();
});
