
class WheelGame {
    constructor() {
        this.canvas = document.getElementById('wheelCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.rotation = 0;
        this.isSpinning = false;
        this.segments = [
            { color: '#FF6B6B', text: '10', gradient: ['#FF6B6B', '#FF8E8E'] },
            { color: '#4ECDC4', text: '20', gradient: ['#4ECDC4', '#6EEFE7'] },
            { color: '#45B7D1', text: '30', gradient: ['#45B7D1', '#67D9F3'] },
            { color: '#96CEB4', text: '40', gradient: ['#96CEB4', '#B8F0D6'] },
            { color: '#FFEEAD', text: '50', gradient: ['#FFEEAD', '#FFF3CF'] },
            { color: '#00f7ff', text: 'JACKPOT', gradient: ['#00f7ff', '#4dffff'] }
        ];
        
        document.getElementById('spinBtn').addEventListener('click', () => this.spin());
        this.draw();
    }
    
    spin() {
        if (this.isSpinning) return;
        
        this.isSpinning = true;
        const spinButton = document.getElementById('spinBtn');
        spinButton.disabled = true;
        
        const rotations = (3 + Math.random() * 2) * Math.PI * 2;
        const duration = 4000;
        const start = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            const eased = 1 - Math.pow(1 - progress, 3);
            this.rotation = eased * rotations;
            
            this.draw();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isSpinning = false;
                spinButton.disabled = false;
                this.checkPrize();
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    draw() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw outer ring
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius + 10, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#00f7ff';
        this.ctx.lineWidth = 5;
        this.ctx.stroke();
        
        // Draw segments with gradients
        const segmentAngle = (Math.PI * 2) / this.segments.length;
        this.segments.forEach((segment, i) => {
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(this.rotation + i * segmentAngle);
            
            // Create gradient
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
            gradient.addColorStop(0, segment.gradient[0]);
            gradient.addColorStop(1, segment.gradient[1]);
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.arc(0, 0, radius, 0, segmentAngle);
            this.ctx.lineTo(0, 0);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            // Add segment border
            this.ctx.strokeStyle = '#00f7ff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Draw text
            this.ctx.rotate(segmentAngle / 2);
            this.ctx.fillStyle = '#000';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.shadowColor = '#fff';
            this.ctx.shadowBlur = 4;
            this.ctx.fillText(segment.text, radius * 0.6, 0);
            
            this.ctx.restore();
        });
        
        // Draw center circle
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
        this.ctx.fillStyle = '#00f7ff';
        this.ctx.fill();
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // Draw pointer
        this.ctx.save();
        this.ctx.translate(centerX, centerY - radius - 15);
        this.ctx.fillStyle = '#00f7ff';
        this.ctx.shadowColor = '#00f7ff';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.moveTo(-15, 0);
        this.ctx.lineTo(15, 0);
        this.ctx.lineTo(0, 25);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
    }
    
    async checkPrize() {
        try {
            const response = await fetch('/api/spin', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'}
            });
            const data = await response.json();
            
            if (response.ok) {
                alert(`You won ${data.prize} ${data.token_type === 'verse' ? 'MetaVerse Tokens!' : 'MetaRush Coins!'}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to process prize');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new WheelGame();
});
