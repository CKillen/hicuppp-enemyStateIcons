//=============================================================================
// RPG Maker MZ - Spread Enemy State Icons
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Spread Enemy State Icons [Hicupp is cool]
 * @author Hicuppp
 *
 * This plugin Spreads the state icons of enemies in combat
 *
 * It does not provide plugin commands.
 * 
 * @param stateNumberX
 * @type text
 * @desc Determines where state turns left number is in x direction.
 * @default 0
 * 
 * @param stateNumberY
 * @type text
 * @desc Determines where state turns left number is in y direction.
 * @default 0
 *
 * @param stateTurnColor
 * @type string
 * @desc Hex value of a number. (including #)
 * @default #ffffff
 * 
 * @param stateNumberSize
 * @type text
 * @desc Font Size of state turns left number.
 * @default 20
 * 
 * @param stateBoxLocationY
 * @type text
 * @desc The Y position of the state boxes.
 * @default 0
 * 
 * @param maxStates
 * @type number
 * @desc States past number will still be in effect but not show.
 * @default 10
 * 
 * @param stateIconBufferRate
 * @type number
 * @desc The amount of frames between state Icon draws. Higher numbers can boost performance at cost of visual lag
 * @default 48
 * 
 */

/*
* TODO: Break into more functions
* TODO: Add checks for numbers
*/

// My code is a beautiful story that makes no sense but still has a happy ending

(() => {
    //=============================================================================
    // Plugin Params
    //=============================================================================
    const parameters = PluginManager.parameters('Hicuppp_StateIcons');
    const { 
        stateTurnColor = '#ffffff',
        stateNumberSize = 20,
        maxStates = 10,
        stateIconBufferRate = 48,
    } = parameters;

    // Some numbers need finer control. They are divided by 10 so must be declared with let
    let {
        stateNumberX = 0, 
        stateNumberY= 0, 
        stateBoxLocationY = 0,
    } = parameters

    stateNumberX = parseFloat(stateNumberX) / 10;
    stateNumberY = parseFloat(stateNumberY) / 10;
    stateBoxLocationY = parseFloat(stateBoxLocationY) / 10;

    //=============================================================================
    // Original functions (to be called in overriden functions)
    //=============================================================================
    const original = {};
    original.createStateIconSprite = Sprite_Enemy.prototype.createStateIconSprite;
    original.updateIcon = Sprite_StateIcon.prototype.updateIcon;

    //=============================================================================
    // Plugin Values
    //=============================================================================

    const _stateAnchorX = .5;
    const _stateAnchorY = 1.5;
    
    //=============================================================================
    // Sprite Enemy
    //=============================================================================

    Sprite_Enemy.prototype.initialize = function(battler) {
        Sprite_Battler.prototype.initialize.call(this, battler);
        this.currentStateIconFrame = 0;
    };

    
    Sprite_Enemy.prototype.update = function() {
        Sprite_Battler.prototype.update.call(this);
        if (this._enemy) { 
            this.updateEffect();
            this.updateStateSprite();
        }
    };

    Sprite_Enemy.prototype.updateStateSprite = function() {
        const states = this._battler._states;
        if(this.currentStateIconFrame > parseInt(stateIconBufferRate) && this._iconSpriteGroup?.length > 0) {
            for(let i = 0; i < parseInt(maxStates); i++) {
              if(i < states.length) {
                const stateTurns = this._battler?._stateTurns[states[i]];
                const iconIndex = $dataStates[states[i]].iconIndex;
                const position = 32 * i;
                this.drawSpreadStateIcon(this._iconSpriteGroup[i], iconIndex, stateTurns, position, states.length)
              } else {
                this._iconSpriteGroup[i]._iconIndex = 0;  
                this._iconSpriteGroup[i].updateFrame()   
                this._iconSpriteGroup[i].drawTurns(); 
              }
            }
            this.currentStateIconFrame = 0;
        }
        this.currentStateIconFrame++;
    };

    Sprite_Enemy.prototype.drawSpreadStateIcon = function(iconSprite, iconIndex, stateTurns, position, anchorPosition) {
        iconSprite.y = -Math.round((this.bitmap.height + 40) * 0.9)
        iconSprite._iconIndex = iconIndex;
        iconSprite.updateFrame();  
        iconSprite.anchor.x = _stateAnchorX + ((anchorPosition - 1) / 2);
        iconSprite.anchor.y = _stateAnchorY + parseFloat(stateBoxLocationY);
        iconSprite.drawTurns(stateTurns, anchorPosition); 
        iconSprite.x = position;
    }

    Sprite_Enemy.prototype.setBattler = function(battler) {
        Sprite_Battler.prototype.setBattler.call(this, battler);
        this._enemy = battler;
        this.setHome(battler.screenX(), battler.screenY());
        if(this._iconSPriteGroup?.length > 0) {
            for(let i = 0; i < this._iconSpriteGroup.length; i++) {
                this._iconSpriteGroup[i].setup(battler);
            }
        }
    };

    Sprite_Enemy.prototype.createStateIconSprite = function() {
        original.createStateIconSprite.apply(this, arguments);
        this._stateIconSprite = new Sprite_StateIcon();
        this.addChild(this._stateIconSprite);
        this._iconSpriteGroup = new Array(parseInt(maxStates)).fill().map(() => new Sprite_StateIcon())
        for(let i = 0; i < this._iconSpriteGroup.length; i++) {
            this.addChild(this._iconSpriteGroup[i])
        }
    };

    //=============================================================================
    // State Icon
    //=============================================================================

    Sprite_StateIcon.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this.initMembers();
        this.loadBitmap();
        this.createTurns();
    };

    Sprite_StateIcon.prototype.createTurns = function() {
        this.turnsLeft = new Sprite();
        this.addChild(this.turnsLeft)
        this.turnsLeft.anchor.x = _stateAnchorX  + parseFloat(stateNumberX);
        this.turnsLeft.anchor.y = _stateAnchorY + parseFloat(stateNumberY) + parseFloat(stateBoxLocationY);
        this.turnsLeft.bitmap = new Bitmap(32, 32)
        this.turnsLeft.bitmap.textColor = stateTurnColor;
        this.turnsLeft.bitmap.fontFace = $gameSystem.mainFontFace();
        this.turnsLeft.bitmap.fontSize = stateNumberSize;
    }

    Sprite_StateIcon.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this._animationCount++;     
        if (this._animationCount >= this.animationWait()) {
            if(this.parent._enemy) {
                this.updateIcon(true);
                this.updateFrame();
                this._animationCount = 0;
            } else {
                this.updateIcon();
                this.updateFrame();
                this._animationCount = 0;
            }
        }
    };

    Sprite_StateIcon.prototype.updateIcon = function(override) {
        if(override !== true) {
            original.updateIcon.apply(this, arguments)
        }
    };

    Sprite_StateIcon.prototype.updateFrame = function() {
        const pw = ImageManager.iconWidth;
        const ph = ImageManager.iconHeight;
        const sx = (this._iconIndex % 16) * pw;
        const sy = Math.floor(this._iconIndex / 16) * ph;
        this.setFrame(sx, sy, pw, ph);
    };

    Sprite_StateIcon.prototype.drawTurns = function(turns, anchorPosition) {
        if(turns) {
            this.turnsLeft.anchor.x =  _stateAnchorX  + parseFloat(stateNumberX) + ((anchorPosition - 1) / 2);
            this.turnsLeft.bitmap.clear();
            this.turnsLeft.bitmap.drawText(turns, 0, 0, 32, 32, "center")
        } else {
            this.turnsLeft.bitmap.clear();
        }
    }
})()