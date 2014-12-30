/**
 * BackgroundProcessor is class for background processing tasks without UI freezying.
 * JS is a single task engine, so this class hepls to emulate multithreading.
 */
function BackgroundProcessor(threadObject) {

    /* timeout parameter for setTimeout */
    this.timeout = (threadObject.timeout >= 0 ? threadObject.timeout : 0);

    /* running tag to prevent double start */
    this.running = false;

    /* interrupt tag, if set up - thread can't be run*/
    this.interrupted = false;

    /* object containing functions */
    this.threadObject = threadObject;

    /**
     * Set interrupt flag as true to prevent further processing.
     */
    this.interrupt = function () {
        var that = this;
        that.interrupted = true;
    };

    /**
     * Checks interrupted state
     */
    this.isInterrupted = function () {
        var that = this;
        return that.interrupted;
    };

    /**
     * Resets interrupted and running state to false in case of not running.
     */
    this.reset = function () {
        var that = this;
        if (!that.running) {
            that.running = false;
            that.interrupted = false;
        } else {
            console.log('Worker cant be reset because it is currently running, stop it before.');
        }
    };
    
    /**
     * Resumes worker thread and put interrupted to false and running to true
     */
    this.resume = function () {
        var that = this;
        
        if (that.interrupted) {
            that.interrupted = false;
            that.running = true;
            
            that.workerThread();
        }
    };

    /**
     * Starts background task processingg
     */
    this.start = function () {
        var that = this;
        if (typeof that.threadObject.workerCallBack === 'function'
                && typeof that.threadObject.stopConditionCallBack === 'function') {

            if (typeof that.threadObject.startProcessingCallBack === 'function') {
                that.threadObject.startProcessingCallBack();
            }
            if (!that.interrupted && !that.running) {
                that.running = true;
                setTimeout(function () {
                    that.workerThread();
                }, 0);// start immideatelly
            } else {
                console.log('Cant start.');
            }
        } else {
            console.log('Worker callback or stopCondition callback is not a function.');
        }
    };

    /**
     * Worker thread function, works untill :
     * interruped
     * or stopcondition is true
     */
    this.workerThread = function () {
        var that = this;
        if (that.interrupted) {
            if (typeof that.threadObject.interruptedCallback === 'function') {
                that.threadObject.interruptedCallback();
            }
            that.running = false;
        } else if (that.threadObject.stopConditionCallBack()) {
            if (typeof that.threadObject.finishedCallBack === 'function') {
                that.threadObject.finishedCallBack();
            }
            that.running = false;
        } else {
            that.threadObject.workerCallBack();
            setTimeout(function () {
                that.workerThread();
            }, that.timeout);
        }
    };
};
