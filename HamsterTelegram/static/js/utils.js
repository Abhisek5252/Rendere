const saveHighScore = (game, score) => {
    const currentHigh = localStorage.getItem(`${game}HighScore`) || 0;
    if (score > currentHigh) {
        localStorage.setItem(`${game}HighScore`, score);
        return true;
    }
    return false;
};

const getHighScore = (game) => {
    return parseInt(localStorage.getItem(`${game}HighScore`) || 0);
};

const setupCanvas = (canvas) => {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    
    return ctx;
};
