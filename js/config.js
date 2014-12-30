GameSettings = {
    width: 1900,
    height: 900,
    CanvasId: 'canvas1',
    fps: 1000 / 25
};

GameState = {
    LOADING: 1,
    PLAY: 2,
    FINISH: 3
};

Direction = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40
};

KeyMap = {
    Z: 90,
    Esc: 90,
    Left: 37,
    Up: 38,
    Right: 39,
    Down: 40
};

ResourceImage = {
    Tank_KV: {key: 'KV', image: 'images/KV-2.png', width: 127, height: 66},
    Tank_M6: {key: 'M-6', image: 'images/M-6.png', width: 55, height: 135},
    Tank_Pz: {key: 'Pz.Kpfw.IV-G', image: 'images/Pz.Kpfw.IV-G.png', width: 65, height: 127},
    Tank_VK: {key: 'VK.3601h', image: 'images/VK.3601h.png', width: 64, height: 122},
    Shot: {key: 'Shot', image: 'images/shot.png', width: 25, height: 25},
    Wall_Bricks: {key: 'WallBricks', image: 'images/WallBricks.png', width: 160, height: 75},
    Water: {key: 'Water', image: 'images/water.png', width: 120, height: 120},
    Background_Green: {key: 'BackgroundGreen', image: 'images/bgGreen.png', width: 64, height: 64},
    Background_Grey: {key: 'BackgroundGrey', image: 'images/bgGrey.png', width: 512, height: 512}
};

var Level_1 = {
    resources: [
        ResourceImage.Tank_KV,
        ResourceImage.Tank_M6,
        ResourceImage.Tank_Pz,
        ResourceImage.Tank_VK,
        ResourceImage.Wall_Bricks,
        ResourceImage.Water,
        ResourceImage.Shot,
        ResourceImage.Background_Grey
    ],
    background: ResourceImage.Background_Grey,
    playerTank: {resource: ResourceImage.Tank_KV, x: 600, y: 750},
    aiTanks: [
        {resource: ResourceImage.Tank_M6, x: 400, y: 100},
        {resource: ResourceImage.Tank_Pz, x: 800, y: 100},
        {resource: ResourceImage.Tank_VK, x: 1200, y: 100}
    ],
    walls: [
        {resource: ResourceImage.Wall_Bricks, x: 300, y: 300},
        {resource: ResourceImage.Wall_Bricks, x: 460, y: 300},
        {resource: ResourceImage.Wall_Bricks, x: 620, y: 300},

        {resource: ResourceImage.Wall_Bricks, x: 300, y: 600},
        {resource: ResourceImage.Wall_Bricks, x: 460, y: 600},
        {resource: ResourceImage.Wall_Bricks, x: 620, y: 600},


        {resource: ResourceImage.Wall_Bricks, x: 960, y: 600},
        {resource: ResourceImage.Wall_Bricks, x: 1120, y: 600},

        {resource: ResourceImage.Wall_Bricks, x: 1120, y: 600},
        {resource: ResourceImage.Wall_Bricks, x: 1120, y: 675},
        {resource: ResourceImage.Wall_Bricks, x: 1120, y: 750},

        {resource: ResourceImage.Wall_Bricks, x: 1600, y: 300},
        {resource: ResourceImage.Wall_Bricks, x: 1600, y: 375},
        {resource: ResourceImage.Wall_Bricks, x: 1600, y: 450},

        {resource: ResourceImage.Wall_Bricks, x: 1100, y: 300},
        {resource: ResourceImage.Wall_Bricks, x: 1100, y: 375},
        {resource: ResourceImage.Wall_Bricks, x: 1100, y: 450},

        {resource: ResourceImage.Wall_Bricks, x: 800, y: 800},
        {resource: ResourceImage.Wall_Bricks, x: 960, y: 800},
        {resource: ResourceImage.Wall_Bricks, x: 1120, y: 800},

        {resource: ResourceImage.Water, x: 1400, y: 700},
        {resource: ResourceImage.Water, x: 1520, y: 700},
        {resource: ResourceImage.Water, x: 1640, y: 700}
    ]
};
