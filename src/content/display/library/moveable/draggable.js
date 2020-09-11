/**
 * module: content
 * part: display.moveable
 * function: add draggable function to a specific element
 */

export default class draggable {
    constructor(targetElement, options, handlers) {
        this.targetElement = targetElement;
        this.options = options;
        this.handlers = handlers;

        /* draggable part */
        // flag if the element is dragging
        this.dragging = false;
        // store some drag status value
        this.store = {};
        // store the drag bounds setting
        this.bounds = {};
        this.dragInitiate();
    }

    /**
     * do some initial thing for draggable function
     * 1. generate drag start and drag event handlers by wrapping this.dragStart and this.drag
     * 2. add mouse down event listener to the target draggable element
     */
    dragInitiate() {
        this.dragEnd();
        this.bounds = this.setBounds(this.options.bounds);
        // wrap a drag start event handler
        this.dragStartHandler = function(e) {
            this.dragStart(e);
        }.bind(this);
        // wrap a drag(dragging) event handler
        this.dragHandler = function(e) {
            this.drag(e);
        }.bind(this);
        this.targetElement.addEventListener("mousedown", this.dragStartHandler);
    }

    static parseBounds(boundsOption) {
        let bounds = {};
        boundsOption = boundsOption || {};
        bounds.left =
            boundsOption.left !== undefined ? boundsOption.left : Number.NEGATIVE_INFINITY;
        bounds.top = boundsOption.top !== undefined ? boundsOption.top : Number.NEGATIVE_INFINITY;
        bounds.right =
            boundsOption.right !== undefined ? boundsOption.right : Number.POSITIVE_INFINITY;
        bounds.bottom =
            boundsOption.bottom !== undefined ? boundsOption.bottom : Number.POSITIVE_INFINITY;
        return bounds;
    }

    setBounds(boundsOption) {
        this.bounds = draggable.parseBounds(boundsOption);
    }

    /**
     * the drag start event handler(mouse down event handler)
     * store some status value of drag start event
     * @param {event} e the mouse down event
     */
    dragStart(e) {
        this.dragging = true;
        // store the start css translate value. [x,y]
        this.store.startTranslate = [];
        // store the start mouse absolute position. [x,y]
        this.store.startMouse = [e.pageX, e.pageY];
        // store the start element absolute position. [x,y]
        let offset = [
            this.targetElement.getBoundingClientRect().left + document.documentElement.scrollLeft,
            this.targetElement.getBoundingClientRect().top + document.documentElement.scrollTop
        ];
        this.store.startElement = {
            left: offset[0],
            top: offset[1],
            right: offset[0] + this.targetElement.offsetWidth,
            bottom: offset[1] + this.targetElement.offsetHeight
        };

        this.handlers.dragStart &&
            this.handlers.dragStart({
                inputEvent: e,
                set: position => {
                    this.store.startTranslate = [position[0], position[1]]; // deep copy
                    this.targetElement.style.transform = `translate(${position[0]}px,${position[1]}px)`;
                },
                stop: () => {
                    this.dragging = false;
                },
                clientX: e.clientX,
                clientY: e.clientY,
                pageX: e.pageX,
                pageY: e.pageY
            });
        if (this.dragging) document.documentElement.addEventListener("mousemove", this.dragHandler);
    }

    /**
     * the drag(dragging) event handler(mouse move event handler)
     * calculate the current translate value
     * call the drag event handler given by users
     * @param {event} e the mouse move event
     */
    drag(e) {
        e.preventDefault();
        let delta = [e.pageX - this.store.startMouse[0], e.pageY - this.store.startMouse[1]];
        // calculate the current translate value
        let currentTranslate = [
            delta[0] + this.store.startTranslate[0],
            delta[1] + this.store.startTranslate[1]
        ];
        let currentElement = {
            left: this.bounds.left - (delta[0] + this.store.startElement.left),
            top: this.bounds.top - (delta[1] + this.store.startElement.top),
            right: delta[0] + this.store.startElement.right - this.bounds.right,
            bottom: delta[1] + this.store.startElement.bottom - this.bounds.bottom
        };
        for (let direction in currentElement) {
            if (currentElement[direction] >= 0) {
                this.bound(direction, currentElement[direction]);
                return;
            }
        }
        this.store.currentTranslate = [currentTranslate[0], currentTranslate[1]];

        this.handlers.drag &&
            this.handlers.drag({
                inputEvent: e,
                target: this.targetElement,
                transform: `translate(${this.store.currentTranslate[0]}px,${this.store.currentTranslate[1]}px)`,
                translate: this.store.currentTranslate,
                delta: delta // delta position
            });
    }

    /**
     * add mouse up event listener
     * remove the dragging event listener
     */
    dragEnd() {
        document.documentElement.addEventListener("mouseup", () => {
            if (this.dragging) {
                this.dragging = false;
                document.documentElement.removeEventListener("mousemove", this.dragHandler);
                if (this.handlers.dragEnd)
                    this.handlers.dragEnd({
                        translate: [this.store.currentTranslate[0], this.store.currentTranslate[1]]
                    }); // deep copy
            }
        });
    }

    bound() {
        // TODO
    }

    unBound() {
        // TODO
    }

    /**
     *	drag the target draggable element to the request position
     * @param {Object} draggableParameter {x:absolute x value,y:absolute y value,deltaX: delta x value, deltaY: delta y value}
     * @returns {boolean} if the drag request has been executed successfully
     */
    request(draggableParameter) {
        /* calculate the translate value according to parameters */
        let translate;
        if (draggableParameter.x !== undefined && draggableParameter.y !== undefined)
            translate = [draggableParameter.x, draggableParameter.y];
        else if (
            draggableParameter.deltaX !== undefined &&
            draggableParameter.deltaY !== undefined
        ) {
            translate = [
                this.store.startTranslate[0] + draggableParameter.deltaX,
                this.store.startTranslate[1] + draggableParameter.deltaY
            ];
        } else return false;

        /* drag start */
        this.dragging = true;
        // store the start css translate value. [x,y]
        this.store.startTranslate = [];

        this.handlers.dragStart &&
            this.handlers.dragStart({
                set: position => {
                    this.store.startTranslate = position;
                },
                stop: () => {
                    this.dragging = false;
                }
            });

        /* dragging event */
        this.handlers.drag &&
            this.handlers.drag({
                target: this.targetElement,
                transform: `translate(${translate[0]}px,${translate[1]}px)`,
                translate: translate
            });

        /* dragging end */
        this.dragging = false;
        this.handlers.dragEnd &&
            this.handlers.dragEnd({
                translate: [translate[0], translate[1]] // deep copy
            });
        return true;
    }
}
