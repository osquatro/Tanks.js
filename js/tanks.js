/*
 * Keyboard controller object for reading keyboard commands
 */
function KeyboardControl() {
    var that = this;

    this.direction = null; // Foward, Back
    this.turnLeft = false;
    this.turnRight = false;
    this.shot = false;

    document.addEventListener('keydown', function (e) {
        var keyCode = e.keyCode;
        console.log(keyCode);
        switch (keyCode) {
            case KeyMap.Down : // Move back
                that.direction = Direction.DOWN;
                break;
            case KeyMap.Up : // move forward
                that.direction = Direction.UP;
                break;
            case KeyMap.Right : // Turn right
                that.turnLeft = false;
                that.turnRight = true;
                break;
            case KeyMap.Left : // Turn left
                that.turnLeft = true;
                that.turnRight = false;
                break;
            case KeyMap.Z : // shot
                that.shot = true;
                break;
        }
        //e.preventDefault();
    }, false);

    /* Stop move */
    document.addEventListener('keyup', function (e) {
        var keyCode = e.keyCode;
        switch (keyCode) {
            case KeyMap.Down : // Move back
                that.direction = null;
                break;
            case KeyMap.Up : // move forward
                that.direction = null;
                break;
            case KeyMap.Right : // Turn right
                that.turnRight = false;
                break;
            case KeyMap.Left : // Turn left
                that.turnLeft = false;
                break;
        }
        //e.preventDefault();
    }, false);
}

KeyboardControl.prototype.getControlUnits = function () {
    var that = this;

    var returnObject = {
        direction: that.direction,
        turnLeft: that.turnLeft,
        turnRight: that.turnRight,
        shot: that.shot
    };

    this.shot = false;

    return returnObject;
};

/* End Of KeyboardControl*/

/* ResourceLoader  responsible for loading sprite images */
function ResourceLoader() {
    this.imagesCount = 0;
    this.resources = [];
}

ResourceLoader.prototype.addImage = function (key, imageUrl) {
    this.imagesCount++;
    var that = this;
    var image = new Image();
    image.onload = function () {
        that.resources.push({"key": key, "image": image});
        image.onload = null; // cleanup
    };

    image.src = imageUrl;
};

ResourceLoader.prototype.getResource = function (key) {
    for (var i = 0; i < this.resources.length; i++) {
        if (this.resources[i].key === key) {
            return this.resources[i].image;
        }
    }

    return null;
};

ResourceLoader.prototype.clean = function () {
    this.imagesCount = 0;
    this.resources = [];
};
/* End of ResourceLoader */

/* TankController Class functions - man game class responsible for Game flow */
function TankController(context) {

    this.context = context;

    this.idCounter = 0;

    this.background = null;
    this.playerTank = null;

    this.aiTanks = [];
    this.walls = [];
    this.shots = [];

    this.resourceLoader = new ResourceLoader();
    this.keyboardControl = new KeyboardControl();

    this.level = null;
}

TankController.prototype.nextId = function () {
    return this.idCounter++;
};

TankController.prototype.loadLevel = function (levelCfg) {
    this.level = levelCfg;
    this.resourceLoader.clean();

    for (var i = 0; i < this.level.resources.length; i++) {
        var resource = this.level.resources[i];
        this.resourceLoader.addImage(resource.key, resource.image);
    }
};

TankController.prototype.gameCreate = function () {
    this.background = new Background(this.context, this.resourceLoader.getResource(this.level.background.key));

    var pt = this.level.playerTank;
    this.createPlayerTank(pt.x, pt.y, pt.resource.width, pt.resource.height,
        this.resourceLoader.getResource(pt.resource.key));

    for (var i = 0; i < this.level.aiTanks.length; i++) {
	var aiTank = this.level.aiTanks[i];
	this.createAiTank(aiTank.x, aiTank.y, aiTank.resource.width, aiTank.resource.height,
		this.resourceLoader.getResource(aiTank.resource.key));
    }

    for (var i = 0; i < this.level.walls.length; i++) {
        var wall = this.level.walls[i];
        this.createWall(wall.x, wall.y, wall.resource.width, wall.resource.height,
            this.resourceLoader.getResource(wall.resource.key));
    }
};

TankController.prototype.isLoadingCompleted = function () {
    return this.resourceLoader.imagesCount === this.resourceLoader.resources.length;
};


TankController.prototype.createPlayerTank = function (x, y, width, height, resource) {
    var that = this;
    var shotId = this.nextId();

    var shotCallback = function (x, y, direction, angle) {
        var shot = new ShotWidget(that.context, x, y, ResourceImage.Shot.width, ResourceImage.Shot.height,
            that.resourceLoader.getResource(ResourceImage.Shot.key),
            shotId, WidgetTypes.PlayerTank, direction, angle);

        that.shots.push(shot);
    };

    this.playerTank = new PlayerTankWidget(this.context, x, y, width, height, resource, this.nextId(), shotCallback);
};

TankController.prototype.createAiTank = function (x, y, width, height, resource) {
    var that = this;
    var shotId = this.nextId();

    var aiTankShotCallback = function (x, y, direction, angle) {
        var shot = new ShotWidget(that.context, x, y, ResourceImage.Shot.width, ResourceImage.Shot.height,
            that.resourceLoader.getResource(ResourceImage.Shot.key),
            shotId, WidgetTypes.EnemyTank, direction, angle);

        that.shots.push(shot);
    };

    var aiTank = new AITankWidget(this.context, x, y, width, height, resource, this.nextId(), aiTankShotCallback);

    this.aiTanks.push(aiTank);
};

TankController.prototype.createWall = function (x, y, width, height, resource) {
    var wall = new WallWidget(this.context, x, y, width, height, resource, this.nextId());
    this.walls.push(wall);
};

TankController.prototype.doAction1 = function () {
    var animationQueue = [];
    var currentObject = null;
    for (var i = 0; i < this.walls.length; i++) {
        animationQueue.push(this.walls[i]);
    }

    animationQueue.push(this.playerTank);

    for (var i = 0; i < this.aiTanks.length; i++) {
        animationQueue.push(this.aiTanks[i]);
    }
    for (var i = 0; i < this.shots.length; i++) {
        animationQueue.push(this.shots[i]);
    }

    this.background.animate();
    for (var i = 0; i < animationQueue.length; i++) {
        currentObject = animationQueue[i];
        switch (currentObject.type) {
            case WidgetTypes.Wall : // do not check intersection
                currentObject.animate();
                break;
            case WidgetTypes.PlayerTank :
                currentObject.animate(this.keyboardControl.getControlUnits(), animationQueue);
                break;
            case WidgetTypes.Shot :
            case WidgetTypes.EnemyTank :
                currentObject.animate(animationQueue);
                break;
            case WidgetTypes.Unknown :
                break;
            default :
                break;
        }
    }

    this.walls = this.collectDeadObjects(this.walls);
    this.shots = this.collectDeadObjects(this.shots);
    this.aiTanks = this.collectDeadObjects(this.aiTanks);
};

TankController.prototype.collectDeadObjects = function (objects) {
    var clean = [];
    for (var i = 0; i < objects.length; i++) {
        if (!objects[i].isDead) {
            clean.push(objects[i]);
        }
    }
    return clean;
};
/* End of TankController Class functions */

/* Background class resposible for drawing game Background */
function Background(context, bgImage) {
    this.context = context;
    this.pattern = this.context.createPattern(bgImage, 'repeat');
}

Background.prototype.animate = function () {
    this.context.clearRect(0, 0, GameSettings.width, GameSettings.height);
    this.context.save();
    this.context.fillStyle = this.pattern;
    this.context.fillRect(0, 0, GameSettings.width, GameSettings.height); // context.fillRect(x, y, width, height);
    this.context.restore();
};
/* End of Background */

var WidgetTypes = {
    Unknown: 'Unknown',
    Shot: 'Shot',
    EnemyTank: 'EnemyTank',
    PlayerTank: 'PlayerTank',
    Wall: 'Wall'
};

/* BaseWidget Class functions - contains base methods for and properties for drawing */
function BaseWidget(context, x, y, width, height, imageObj, id) {
    this.x = x;
    this.y = y;
    this.context = context;

    this.imageObj = imageObj;

    this.width = width;
    this.height = height;
    this.angle = 0;
    this.id = id;
    this.speed = 3;
    this.damage = 0;
}

BaseWidget.prototype.draw = function () {
    this.context.save();
    this.context.translate(this.x, this.y);
    this.context.rotate(this.angle);
    this.context.drawImage(this.imageObj, -(this.width / 2), -(this.height / 2), this.width, this.height);
    this.context.restore();
};

/**
 * Returns radius of circumscribed circle around rectangle (used to calculate possibility of intersection)
 * @returns {Number}
 */
BaseWidget.prototype.getRadius = function () {
    return MathUtils.getRectangleDiagonal(this.width, this.height) / 2;
};

/**
 *
 * @param x
 * @param y
 * @param angle
 * @returns {Array}
 */
BaseWidget.prototype.getShapeCoordinates = function (x, y, angle) { // base widget is rectangle
    if (typeof x === 'undefined' || typeof y === 'undefined' || typeof angle === 'undefined') {
        x = this.x;
        y = this.y;
        angle = this.angle;
    }

    return MathUtils.getRectByCenterAndAngle(x, y, this.width, this.height, angle);
};

BaseWidget.prototype.getNormals = function (x, y, angle) { // base widget is rectangle
    if (typeof x === 'undefined' || typeof y === 'undefined' || typeof angle === 'undefined') {
        x = this.x;
        y = this.y;
        angle = this.angle;
    }
    var normals = [];
    if (MathUtils.needCustomNormal(angle)) {
        normals.push(new CustomNormal(angle));
        normals.push(new CustomNormal(angle + MathUtils.Angles.angle90));
    } else {
        normals.push(BaseNormal.axisX);
        normals.push(BaseNormal.axisY);
    }

    return {
        normals : normals,
        coordinates : MathUtils.getRectByCenterAndAngle(x, y, this.width, this.height, angle)
    };
};

BaseWidget.prototype.getNextCoordinates = function () {
    return {x: this.x, y: this.y};
    /* implemented in every dynemic object */
};

/* End of BaseWidget*/

/* Static widget (not movable) for drawing walls, water */
function WallWidget(context, x, y, width, height, imageObj, id) {
    BaseWidget.call(this, context, x, y, width, height, imageObj, id);
    this.maxDamage = 3;
}

WallWidget.prototype = Object.create(BaseWidget.prototype);
WallWidget.prototype.constructor = WallWidget;
WallWidget.prototype.type = WidgetTypes.Wall;

WallWidget.prototype.animate = function () {
    if (this.damage < this.maxDamage) {
        this.draw();
    } else {
        this.isDead = true;
    }
};
/* End of WallWidget*/

/* Widget represents shot made by tank */
function ShotWidget(context, x, y, width, height, imageObj, id, owner, direction, angle) {
    BaseWidget.call(this, context, x, y, width, height, imageObj, id);

    this.direction = direction;
    this.angle = angle;
    this.isDead = false;
    this.shotOwner = owner;
    this.speed = 15;
}

ShotWidget.prototype = Object.create(BaseWidget.prototype);
ShotWidget.prototype.constructor = ShotWidget;
ShotWidget.prototype.type = WidgetTypes.Shot;

ShotWidget.prototype.getNextCoordinates = function () {
    var params = {
        x: this.x,
        y: this.y,
        angle: this.angle
    };

    params.x += this.speed * Math.cos(params.angle);
    params.y += this.speed * Math.sin(params.angle);

    return params;
};
ShotWidget.prototype.animate = function (animationQueue) {
    var params = this.getNextCoordinates(),
        radius1 = this.getRadius(),
        obj = null,
        radius2 = null,
        move = true;

    if (params.x < (this.height/2) || params.x > (GameSettings.width - this.height/2)) {
        this.isDead = true;
    } else if (params.y < (this.height/2) || params.y > (GameSettings.height - this.height/2)) {
        this.isDead = true;
    } else {
        for (var i = 0; i < animationQueue.length; i++) {
            if (this.id !== animationQueue[i].id) { // do not check overlap with self
                obj = animationQueue[i];
                radius2 = obj.getRadius();

                if (MathUtils.areObjectsCloseToOverlap(params.x, params.y, radius1, obj.x, obj.y, radius2)) {
                    if (MathUtils.detectCollision(
                            this.getNormals(params.x, params.y, params.angle),
                            obj.getNormals())) {

                        if (this.shotOwner === obj.type) {
                            continue;
                        }
                        if (obj.type === WidgetTypes.Shot) {
                            if (this.shotOwner === obj.shotOwner) {
                                continue;
                            } else {
                                this.isDead = true;
                                obj.isDead = true;
                                move = true;
                            }
                        } else {
                            this.isDead = true;
                            obj.damage++;
                            move = true;
                        }
                    }
                }
            }
        }
    }
    if (move || !this.isDead) {
        this.x = params.x;
        this.y = params.y;
        this.angle = params.angle;

        this.draw();
    }
};
/* End of ShotWidget */

ShotWidget.prototype.getRadius = function () {
    return this.width / 2;
};
ShotWidget.prototype.getShapeCoordinates = function (x, y, angle) { // base widget is rectangle
    if (typeof x === 'undefined' || typeof y === 'undefined' || typeof angle === 'undefined') {
        x = this.x;
        y = this.y;
        angle = this.angle;
    }
    return MathUtils.getOctagonByCenterAndAngle(x, y, this.width / 2, angle);
};
/* End of ShotWidget */

/* PlayerTankWidget represents controlable player tank  */
function PlayerTankWidget(context, x, y, width, height, imageObj, id, shotCallback) {
    BaseWidget.call(this, context, x, y, width, height, imageObj, id);
    this.angle = MathUtils.Angles.angle270;
    this.speed = 4;
    this.maxDamage = 10;
    this.shotCallback = shotCallback;
    this.lastShotTime = Date.now();
}

PlayerTankWidget.prototype = Object.create(BaseWidget.prototype);
PlayerTankWidget.prototype.constructor = PlayerTankWidget;
PlayerTankWidget.prototype.type = WidgetTypes.PlayerTank;

PlayerTankWidget.prototype.getNextCoordinates = function (controlUnits) {
    var params = {
        x: this.x,
        y: this.y,
        angle: this.angle
    };

    if (controlUnits.turnLeft) {
        params.angle -= MathUtils.toRadians(controlUnits.direction == null ? 2 : 1);
    } else if (controlUnits.turnRight) {
        params.angle += MathUtils.toRadians(controlUnits.direction == null ? 2 : 1);
    }
    if (controlUnits.direction !== null) {
        if (controlUnits.direction === Direction.UP) {
            params.x += this.speed * Math.cos(params.angle);
            params.y += this.speed * Math.sin(params.angle);
        } else if (controlUnits.direction === Direction.DOWN) {
            params.x -= this.speed * Math.cos(params.angle);
            params.y -= this.speed * Math.sin(params.angle);
        }
    }

    return params;
};

PlayerTankWidget.prototype.animate = function (controlUnits, animationQueue) {
    if (controlUnits.shot) {
        if (((Date.now() - this.lastShotTime) / 1000) >= 0.5) {
            var x1 = this.x + (this.width / 2);
            var y1 = this.y;
            var coordinates = MathUtils.rotateXY(x1, y1, this.x, this.y, this.angle);
            this.shotCallback(coordinates.x, coordinates.y, this.direction, this.angle);
            this.lastShotTime = Date.now();
        }
    }
    var params = this.getNextCoordinates(controlUnits),
        radius1 = this.getRadius(),
        obj = null,
        radius2 = null,
        meetsShot = false,
        move = true;
    var playerTankNormals = this.getNormals(params.x, params.y, params.angle);

    if (this.damage < this.maxDamage) {
        for (var i = 0; i < animationQueue.length; i++) {
            if (this.id !== animationQueue[i].id) { // do not check overlap with self
                obj = animationQueue[i];
                radius2 = obj.getRadius();

                if (MathUtils.areObjectsCloseToOverlap(params.x, params.y, radius1, obj.x, obj.y, radius2)) {
                    if (MathUtils.detectCollision(playerTankNormals, obj.getNormals())) {

                        if (obj.type === WidgetTypes.Shot) {
                            if (obj.shotOwner === WidgetTypes.PlayerTank) {// check shot origin, if this is own shot - continue
                                continue;
                            }
                            if (!obj.isDead) {
                                obj.isDead = true;
                                this.damage++;
                                meetsShot = true;
                            }
                        } else {
                            // meet any other than shot object, no movement
                            move = false;
                        }
                    }
                }
            }
        }
    } else {
        this.isDead = true;
    }

    if (!MathUtils.fitToGameField(playerTankNormals.coordinates)) {
        move = false;
    }
    if (meetsShot || !this.isDead) {
        if (move) {
            this.x = params.x;
            this.y = params.y;
            this.angle = params.angle;
        }
        Debug.tracePoints(this.getShapeCoordinates());
        this.draw();
    }
};
/* End of PlayerTankWidget */

/* Enemy tank with arteficial intelligence */
function AITankWidget(context, x, y, width, height, imageObj, id, shotProcessor) {
    BaseWidget.call(this, context, x, y, width, height, imageObj, id);
    this.direction = Direction.DOWN;
    this.angle = 0;
    this.actionsCounter = 0;
    this.shotProcessor = shotProcessor;
    this.speed = 3;
    this.maxDamage = 10;
}

AITankWidget.prototype = Object.create(BaseWidget.prototype);
AITankWidget.prototype.constructor = AITankWidget;
AITankWidget.prototype.type = WidgetTypes.EnemyTank;

AITankWidget.prototype.shot = function () {
    var x1 = this.x;
    var y1 = this.y + (this.height / 2);

    var coordinates = MathUtils.rotateXY(x1, y1, this.x, this.y, this.angle + MathUtils.Angles.angle180);
    this.shotProcessor(coordinates.x, coordinates.y, this.direction, this.angle + MathUtils.Angles.angle270);
};

AITankWidget.prototype.getNextCoordinates = function (direction, angle) {

    if (typeof direction === 'undefined' || typeof angle === 'undefined') {
        direction = this.direction;
        angle = this.angle;
    }

    var params = {
        x: this.x,
        y: this.y,
        angle: angle
    };

    if (direction === Direction.UP) {
        params.x += this.speed * Math.cos(params.angle);
        params.y += this.speed * Math.sin(params.angle);
    } else if (direction === Direction.DOWN) {
        params.x -= this.speed * Math.cos(params.angle);
        params.y -= this.speed * Math.sin(params.angle);
    }

    return params;
};


/**
 * TODO: implement AI for tank movement
 * @returns {undefined}
 */
AITankWidget.prototype.animate = function () {

    if (this.damage >= this.maxDamage) {
        this.isDead = true;
    }
    this.actionsCounter++;

    if (this.actionsCounter >= 50) {
        //this.direction = this.direction === Direction.DOWN  ? Direction.UP : Direction.DOWN;
        this.actionsCounter = 0;
        this.shot();
    }

    switch (this.direction) {
        case Direction.UP :
            if (this.y > (this.height / 2)) {
                this.y -= 3;
                this.angle = MathUtils.Angles.angle360;
            } else {
                this.direction = Direction.DOWN;
                this.y += 3;
            }

            break;
        case Direction.DOWN:
            if (this.y < (GameSettings.height - this.height / 2)) {
                this.y += 3;
                this.angle = MathUtils.Angles.angle180;
            } else {
                this.direction = Direction.UP;
                this.y -= 3;
            }

            break;
    }

    this.draw();
};
/* End of AITankWidget*/

function MathUtils() {
}


MathUtils.axis = {
    x: 'x',
    y: 'y'
};


MathUtils.getMinMaxByAxis = function (axis, coords) {
    var vertexes = [];

    for (var i = 0; i < coords.length; i++) {
        vertexes.push(coords[i][axis]);
    }

    return {
        min: Math.min.apply(null, vertexes),
        max: Math.max.apply(null, vertexes)
    };
};

/**
 *
 * Separating Axis Theorem (SAT) implementation
 *
 *
 * @param {type} shape1
 * @param {type} shape2
 * @returns {Boolean}
 */
MathUtils.detectCollision = function (shape1, shape2) {

    this.overlaps = function (min1, max1, min2, max2) {
        return this.isBetweenOrdered(min2, min1, max1) || this.isBetweenOrdered(min1, min2, max2);
    };

    this.isBetweenOrdered = function (val, lowerBound, upperBound) {
        return lowerBound <= val && val <= upperBound;
    };

    this.intersects = function (shape1Coordinates, shape2Coordinates) {

        var shape1MinMax, shape2MinMax, normal;
        for (var i = 0; i < shape1Coordinates.normals.length; i++) {
            normal = shape1Coordinates.normals[i];

            shape1MinMax = normal.getProjectionMinMax( shape1Coordinates.coordinates );
            shape2MinMax = normal.getProjectionMinMax( shape2Coordinates.coordinates );

            if (!this.overlaps(shape1MinMax.min, shape1MinMax.max, shape2MinMax.min, shape2MinMax.max)) {
                return false; // NO INTERSECTION
            }
        }

        for (var i = 0; i < shape2Coordinates.normals.length; i++) {
            normal = shape2Coordinates.normals[i];

            shape1MinMax = normal.getProjectionMinMax( shape1Coordinates.coordinates );
            shape2MinMax = normal.getProjectionMinMax( shape2Coordinates.coordinates );
            if (!this.overlaps(shape1MinMax.min, shape1MinMax.max, shape2MinMax.min, shape2MinMax.max)) {
                return false; // NO INTERSECTION
            }
        }
        //Debug.tracePoints(shape1Coordinates.coordinates);
        //Debug.tracePoints(shape2Coordinates.coordinates);

        return true;
    };

    return this.intersects(shape1, shape2);
};
/**
 * (x1,y1)                (x2, y2)
 * +---------------------+
 * |                     |
 * |          *          |
 * |       (ox,oy)       |
 * +---------------------+
 * (x4,y4)                (x3,y3)
 *
 * Calculates (x1,y1) ... (x4,y4) by given (ox,oy) and rotates to given angle.
 * @param {Number} ox
 * @param {Number} oy
 * @param {Number} width
 * @param {Number} height
 * @param {Number} angle
 * @returns {Array}
 */
MathUtils.getRectByCenterAndAngle = function (ox, oy, width, height, angle) {
    var coordinates = [];

    var mostLeftX = ox - (width / 2);
    var mostLeftY = oy - (height / 2);

    var x = mostLeftX;
    var y = mostLeftY;
    coordinates.push(MathUtils.rotateXY(x, y, ox, oy, angle));

    x = mostLeftX + width;
    y = mostLeftY;
    coordinates.push(MathUtils.rotateXY(x, y, ox, oy, angle));

    x = mostLeftX + width;
    y = mostLeftY + height;
    coordinates.push(MathUtils.rotateXY(x, y, ox, oy, angle));

    x = mostLeftX;
    y = mostLeftY + height;
    coordinates.push(MathUtils.rotateXY(x, y, ox, oy, angle));

    return coordinates;
};

/**
 * Calculates (x1,y1) ... (x8,y8) by given (ox,oy) and rotates to given angle.
 */
MathUtils.getOctagonByCenterAndAngle = function (ox, oy, radius, angle) {
    var r2 = Math.floor(radius / Math.sqrt(2));

    var vertices = [];

    var x = ox;
    var y = oy - radius;
    vertices.push(MathUtils.rotateXY(x, y, ox, oy, angle));

    x = ox + r2;
    y = oy - r2;
    vertices.push(MathUtils.rotateXY(x, y, ox, oy, angle));

    x = ox + radius;
    y = oy;
    vertices.push(MathUtils.rotateXY(x, y, ox, oy, angle));


    x = ox + r2;
    y = oy + r2;
    vertices.push(MathUtils.rotateXY(x, y, ox, oy, angle));

    x = ox;
    y = oy + radius;
    vertices.push(MathUtils.rotateXY(x, y, ox, oy, angle));

    x = ox - r2;
    y = oy + r2;
    vertices.push(MathUtils.rotateXY(x, y, ox, oy, angle));

    x = ox - radius;
    y = oy;
    vertices.push(MathUtils.rotateXY(x, y, ox, oy, angle));

    x = ox - r2;
    y = oy - r2;
    vertices.push(MathUtils.rotateXY(x, y, ox, oy, angle));

    return vertices;
};

MathUtils.rotateXY = function (px, py, ox, oy, theta) {
    return {
        x: (Math.cos(theta) * (px - ox) - Math.sin(theta) * (py - oy) + ox),
        y: (Math.sin(theta) * (px - ox) + Math.cos(theta) * (py - oy) + oy)
    };
};

MathUtils.getDistance = function (x1, y1, x2, y2) {
    return Math.sqrt(
        Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2)
    );
};

MathUtils.getRectangleDiagonal = function (width, height) {
    return Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
};

MathUtils.areObjectsCloseToOverlap = function (x1, y1, radius1, x2, y2, radius2) {
    return (MathUtils.getDistance(x1, y1, x2, y2) <= (radius1 + radius2));
};

MathUtils.fitToGameField = function (shapeCoordinates) {

    var minMaxX = this.getMinMaxByAxis(this.axis.x, shapeCoordinates);
    var minMaxY = this.getMinMaxByAxis(this.axis.y, shapeCoordinates);

    if (minMaxX.min <= 0 || minMaxX.max >= GameSettings.width
        || minMaxY.min <= 0 || minMaxY.max >= GameSettings.height) {
        return false;
    }

    return true;
};

MathUtils.toRadians = function(angle) {
    return  (Math.PI / 180) * angle;
}

MathUtils.Angles = {
    angle90: MathUtils.toRadians(90),
    angle180: MathUtils.toRadians(180),
    angle270: MathUtils.toRadians(270),
    angle360: MathUtils.toRadians(360)
};

MathUtils.needCustomNormal = function (angle) {
    return !(
            angle === 0
    || angle === MathUtils.Angles.angle90
    || angle === MathUtils.Angles.angle180
    || angle === MathUtils.Angles.angle270
    || angle === MathUtils.Angles.angle360
    );
};


/**
 *
 * @param axis
 * @constructor
 */
function BaseNormal(axis) {
    this.axis = axis;
}

BaseNormal.axisX = new BaseNormal(MathUtils.axis.x);
BaseNormal.axisY = new BaseNormal(MathUtils.axis.y);

BaseNormal.prototype.getProjectionMinMax = function(shape) {
    var vertexes = [];

    for (var i = 0; i < shape.length; i++) {
        vertexes.push(shape[i][this.axis]);
    }

    return {
        min: Math.min.apply(null, vertexes),
        max: Math.max.apply(null, vertexes)
    };
};

/**
 *
 * @param angle
 * @constructor
 */
function CustomNormal(angle) {
    if ((angle > MathUtils.Angles.angle180 && angle < MathUtils.Angles.angle360)) {
        angle = Math.abs(angle - MathUtils.Angles.angle180);
    }
    var halfX = (GameSettings.width / 2 ),
        halfY = (GameSettings.height / 2 );

    var length = halfX / Math.cos(angle);
    var x1, y1, x2, y2;

    x1 = halfX - length * Math.cos(angle);
    y1 = halfY - length * Math.sin(angle);
    x2 = halfX + length * Math.cos(angle);
    y2 = halfY + length * Math.sin(angle);

    this.p1 = {x: x1, y: y1};
    this.p2 = {x: x2, y: y2};

    //Debug.traceLine([this.p1, this.p2]);
}

CustomNormal.prototype.getProjectionPoint = function (point) {

    var fDenominator = Math.pow((this.p2.x - this.p1.x), 2)
        + Math.pow((this.p2.y - this.p1.y), 2);

    if (fDenominator == 0) // p1 and p2 are the same
        return this.p1;

    var t = (point.x * (this.p2.x - this.p1.x) - (this.p2.x - this.p1.x) * this.p1.x
        + point.y * (this.p2.y - this.p1.y) - (this.p2.y - this.p1.y) * this.p1.y) / fDenominator;

    return {
        x: this.p1.x + (this.p2.x - this.p1.x) * t,
        y: this.p1.y + (this.p2.y - this.p1.y) * t
    };
};

/**
 *
 * @param shape
 */
CustomNormal.prototype.getProjectionMinMax = function(shape) {
    var vertexes = [];
    var point;

    for (var i = 0; i < shape.length; i++) {
        point = this.getProjectionPoint(shape[i]);
        vertexes.push(MathUtils.getDistance(this.p1.x, this.p1.y, point.x, point.y));
    }

    return {
        min: Math.min.apply(null, vertexes),
        max: Math.max.apply(null, vertexes)
    };
};
/* DEBUG */

Debug = function () {
};

Debug.tracePoints = function (points) {
    context.save();
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);

    for (var i = 1; i < points.length; i++) {
        context.lineTo(points[i].x, points[i].y);
    }
    context.lineTo(points[0].x, points[0].y);
    context.lineWidth = 1;

    // set line color
    context.strokeStyle = '#ff0000';
    context.stroke();
    context.restore();
};

Debug.traceLine  = function(points) {
    context.save();
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);

    context.lineTo(points[1].x, points[1].y);
    context.lineWidth = 1;

    // set line color
    context.strokeStyle = '#ffff00';
    context.stroke();
    context.restore();
};

Debug.tracePoint  = function(point, color) {
    context.beginPath();
    context.arc(point.x, point.y, 3, 0, 2 * Math.PI, false);
    context.fillStyle = color;
    context.fill();
    context.lineWidth = 1;
    context.strokeStyle = 'black';
    context.stroke();
};