var context; // wee need this to apply in debug functions
(function () {
    window.requestAnimFrame = (function (callback) {
        return window.requestAnimationFrame
            || window.webkitRequestAnimationFrame
            || window.mozRequestAnimationFrame
            || window.oRequestAnimationFrame
            || window.msRequestAnimationFrame
            || function (callback) {
                callback();
            };
    })();

    context = document.getElementById(GameSettings.CanvasId).getContext('2d');

    var controller = new TankController(context);

    var processor = new BackgroundProcessor({
        timeout: GameSettings.fps,
        currentGameState: null, // {LOADING, PLAY, FINISH}
        startProcessingCallBack: function () {
            controller.loadLevel(Level_1);
            this.currentGameState = GameState.LOADING;
        },
        stopConditionCallBack: function () {
            return this.currentGameState === GameState.FINISH;
        },
        workerCallBack: function () {
            switch (this.currentGameState) {
                case GameState.LOADING :
                    if (controller.isLoadingCompleted()) {
                        controller.gameCreate();
                        this.currentGameState = GameState.PLAY;
                    }
                    break;
                case GameState.PLAY :
                    requestAnimFrame(function () {
                        controller.doAction1();
                    });
                    break;
                default: // do nothing so far
                    break;
            }
        }
    });

    document.getElementById('btnStart').onclick = function () {
        processor.start();
    };

    document.getElementById('btnPause').onclick = function () {
        processor.interrupt();
    };

    document.getElementById('btnResume').onclick = function () {
        processor.resume();
    };
})();