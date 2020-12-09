/**
 * General info
 * 
 * The size system is based on units of 1.  You can put in other numbers, but I'd expect things to behave pretty erratically.
 * 
 * An entity's position/rotation/scale is controlled by its parent, not by the entity.
 * 
 * Some params are passed to children, but it's kinda inconsistent which ones.  I'm considering revamping that part of the system.
 */

/* //TODO
Maybe have a css-like system?
    Maybe have standard styling params, and they by default are passed on to children?
Checkbox
Proper radio buttons
Slider
Spinner
Dial
*/

let _ = require('lodash');

window.QuickUI = (function() {
    function loadUi(callback) {
        let uiEl = document.currentScript.parentElement.querySelector(".ui-container");
        if (!uiEl) { // I've seen it work both ways now, where sometimes the `ui`'s init runs before this script, and sometimes after.  A version difference, maybe?
          document.currentScript.parentElement.addEventListener('requestforui', function addUi ({detail:{uiEl}}) {
            let ui = callback({UI:QuickUI});
            uiEl.appendChild(QuickUI.UiRoot(ui));
          });
        } else {
          let ui = callback({UI:QuickUI});
          uiEl.appendChild(QuickUI.UiRoot(ui));
      }
    }

    function maybeReverse(bool, ...children) {
        if (bool) {
            children.reverse();
        }
        return children;
    }

    //TODO How to change text later?
    function UiButton({oncontrollerdown, oncontrollerhold, oncontrollerup, color="#909090", text, textcolor="#000000", materials, size=[1,1]}={}) {
        let plane = UiEntity({type:"a-plane", color:color, materials:materials}); //TODO I don't know how to deal with the maxSize thing
        let s = [...size];
        plane.getSize = function(maxSize) {
            return s; //TODO
        };
        plane.setAttribute('width', size[0]-0.1);
        plane.setAttribute('height', size[1]-0.1);
        if (text) {
            let label = UiEntity({type: "a-text"});
            label.setAttribute("value", text);
            label.setAttribute("align", "center");
            label.setAttribute('position', '0 0 0.01');
            label.setAttribute('color', textcolor);
            //TODO Size, color
            plane.appendChild(label);
        }
        //plane.setAttribute('position', '0 0 0');
        plane.oncontrollerdown = oncontrollerdown;
        // Note that oncontrollerhold is NOT called the first time - it's down, THEN hold (many times), THEN up.
        plane.oncontrollerhold = oncontrollerhold;
        plane.oncontrollerup = oncontrollerup;
        //buttons.appendChild(plane);
        //TODO Material?
        return plane;
    }

    function UiText({text="Text", color="#FFFFFF", textcolor,size=[1,1]}={}) {
        let ui = UiEntity({type: "a-text"});
        ui.setAttribute("value", text);
        ui.setAttribute("align", "center");
        if (textcolor) {
            color = textcolor;
        }
        if (color) {
            ui.setAttribute('color', color);
        }
        // ui.setAttribute('width', size[0]-0.1);
        // ui.setAttribute('height', size[1]-0.1);
        let s = [...size];
        ui.getSize = function(maxSize) {
            return s; //TODO
        };
        return ui;
    }
    
    function UiRoot(layout) {
        let ui = UiEntity();
        ui.setAttribute('rotation', '-90 0 0');
        ui.setAttribute('scale', '0.05 0.05 0.05');
        layout.setAttribute('position', '0 0 0');
        ui.appendChild(layout);
        return ui;
    }
    
    function FoldLayout({degrees=25,diameter=15}={},...children) {
        let layout = UiEntity();
        
        for (let i = 0; i < children.length; i++) {
            let child = children[i];
            //let childSeat = UiEntity();

            let a = (i-((children.length-1)/2))*degrees;
            let xo = Math.sin(2*Math.PI*a/360)*(diameter/2);
            let zo = (1-Math.cos(2*Math.PI*a/360))*(diameter/2);
            child.setAttribute('rotation', '0 '+(-a)+' 0');
            child.setAttribute('position', xo + ' 0 ' + zo);
            layout.appendChild(child);
        }

        return layout;
    }

    function UiTransform({position="0 0 0",rotation="0 0 0",scale="1 1 1",roundSizeUp=true},...children) {
        let container = UiEntity({},...children);
        container.setAttribute('position', position);
        container.setAttribute('rotation', rotation);
        if (typeof scale === 'string' || scale instanceof String) { //TODO Didn't realize until now you could use a map to set positions etc.  Now I'm conflicted on whether to change everything - possibly to arrays, haha.
            scale = scale.split(" ").map(s => Number.parseFloat(s))
        }
        if (Array.isArray(scale)) {
            scale = {x:scale[0], y:scale[1], z:scale[2]};
        }
        container.setAttribute('scale', scale);

        let ui = UiEntity({},container); //TODO We COULD set the above on each child individually
        ui.getSize = function(maxSize) {
            let size = container.getSize();
            if (roundSizeUp) { //TODO This is a bit of a hack; it'd be better for everything to just handle fractional sizes properly...but that's hard
                return [Math.ceil(size[0]*scale.x), Math.ceil(size[1]*scale.y)];
            } else {
                return [size[0]*scale.x, size[1]*scale.y];
            }
        };
        return ui;
    }
    
    //PRIVATE
    function GridInternal({cols, rows}={}) {
        let grid = [];
        grid.placementIndex = 0;

        let size;
        let fixed;
        let first; // first to be traversed - second coord, really
        let second; // opposite
        if (rows == null || rows == undefined) {
            // Many rows
            // fixed cols
            size = cols;
            fixed = "cols";
            first = (s => s[0]);
            second = (s => s[1]);
        } else {
            // Many cols
            // fixed rows
            size = rows;
            fixed = "rows";
            first = (s => s[1]);
            second = (s => s[0]);
        }

        grid.get = function(i) {
            let a = this[i];
            if (a == undefined) {
                a = new Array(size);
                this[i] = a;
            }
            return a;
        }

        /**
         * Returns true if add was successful, false if it went over the maxSecond limit (or something anomalous occurred and it didn't get placed).
         * Note that if an item would not be able to fit in an empty grid, and nothing else is pushing it in the cramped direction, then the item will
         * be placed regardless.  E.g., a 4x4 grid (cols primary, rows secondary), with the left col full of a 1x4, and you try to add a 5x1, fails.
         * But a 4x4 grid, with a 1x3 on the left, and you add a 5x1, will succeed, with the 5x1 placed along the bottom row, sticking 1x1 off the right.
         * 
         * @param {*} item - item to add
         * @param {*} pack - try to pack it in around other things? 
         * @param {*} maxSecond - maximum secondary dimension (the direction that fills up more gradually, like top-to-bottom on a page of English).  Leave undefined for no limit.
         * @param {*} autotrim - whether to run this.trim() on limit-hit (because doing so probably added one or more empty lines)
         */
        grid.add = function(item, pack, maxSecond, autotrim=true) { //TODO Might make more sense to put `maxSecond` on the "constructor"
            //TODO I have reason to suspect that (non-integer) sizes < 1 count as non-existent, kinda.  Also may affect overhang, like the .5 of 2.5
            let isize = item.getSize();

            let start;
            if (pack) {
                start = 0;
            } else {
                start = this.placementIndex; //TODO Test
            }
    
            let placed = false;
            let hitSecondMax = false;
            placeLoop:
            for (let b = start; true; b++) {
                if (this.get(b).length+1-first(isize) <= 0) {
                    // Thing is too large in the primary direction
                    let a = 0;
                    let collision = false;
                    checkCollision:
                    for (let n = 0; n < second(isize); n++) {
                        if (maxSecond != undefined && b+n >= maxSecond && b > 0) { // If b == 0, this is as much room as we get
                            hitSecondMax = true;
                            break placeLoop;
                        }
                        for (let m = 0; m < this.get(b).length; m++) {
                            if (this.get(b+n)[a+m] != undefined) {
                                collision = true;
                                break checkCollision;
                            }
                        }
                    }
                    if (!collision) {
                        for (let n = 0; n < second(isize); n++) {
                            for (let m = 0; m < this.get(b).length; m++) {
                                this.get(b+n)[a+m] = item;
                            }
                        }
                        if (fixed == "cols") {
                            item.setAttribute('position', `${a+((first(isize))/2)} ${-b-((second(isize))/2)} 0`);
                        } else {
                            item.setAttribute('position', `${b+((second(isize))/2)} ${-a-((first(isize))/2)} 0`);
                        }
                        this.placementIndex = b;
                        placed = true;
                        break placeLoop;
                    }
                } else { //TODO It's annoying having two near copies
                    for (let a = 0; a < this.get(b).length+1-first(isize); a++) {
                        let collision = false;
                        checkCollision:
                        for (let n = 0; n < second(isize); n++) {
                            if (maxSecond != undefined && b+n >= maxSecond && b > 0) { // If b == 0, this is as much room as we get
                                hitSecondMax = true;
                                break placeLoop;
                            }    
                            for (let m = 0; m < first(isize); m++) {
                                if (this.get(b+n)[a+m] != undefined) {
                                    collision = true;
                                    break checkCollision;
                                }
                            }
                        }
                        if (!collision) {
                            for (let n = 0; n < second(isize); n++) {
                                for (let m = 0; m < first(isize); m++) {
                                    this.get(b+n)[a+m] = item;
                                }
                            }
                            if (fixed == "cols") {
                                item.setAttribute('position', `${a+((first(isize))/2)} ${-b-((second(isize))/2)} 0`);
                            } else {
                                item.setAttribute('position', `${b+((second(isize))/2)} ${-a-((first(isize))/2)} 0`);
                            }
                            this.placementIndex = b;
                            placed = true;
                            break placeLoop;
                        }
                    }
                }
            }
            if (!placed) {
                if (!hitSecondMax) {
                    console.error("WAT Didn't place grid item?");
                }
                if (autotrim) { //TODO Do on erroneous non-placement?
                    this.trim();
                }
                return false;
            }
            return true;
        }

        /**
         * Trim off trailing empty lines.  Returns number removed, for funsies.
         */
        grid.trim = function() {
            let count = 0;
            while (this.length > 0) {
                let i = this.length-1;
                for (let j = 0; j < this[i].length; j++) {
                    if (this[i][j] != undefined) {
                        return count;
                    }
                }
                this.pop();
                count++;
            }
            return count;
        }

        return grid;
    }

    /**
     * Pick whether you want to constrain rows or cols; leave the other null
     * @param {*} cols 
     * @param {*} rows 
     * @param {*} pack Ignore order in favor of tighter packing
     */
    function GridLayout({cols, rows, pack=true}={},...children) {
        let layout = UiEntity();
        let buttons = UiEntity();
        let size;
        let fixed;
        let grid = GridInternal({cols:cols, rows:rows});
        
        layout.getSize = function(maxSize) {
            if (fixed == "cols") {
                return [size, grid.length]; //TODO May not be quite accurate at the ends - run grid.trim(), I guess?
            } else {
                return [grid.length, size]; //TODO May not be quite accurate at the ends - run grid.trim(), I guess?
            }
        };

        if (rows == null || rows == undefined) {
            // Many rows
            // fixed cols
            size = cols;
            fixed = "cols";
        } else {
            // Many cols
            // fixed rows
            size = rows;
            fixed = "rows";
        }

        let items = [...children];
        items.reverse();
        while (items.length > 0) {
            let item = items.pop();
            grid.add(item, pack);
            buttons.appendChild(item);
        }
        layout.appendChild(buttons);
        grid.trim();
        let finalSize = layout.getSize();
        buttons.setAttribute('position', `${-finalSize[0]/2} ${finalSize[1]/2} 0`);
        return layout;
    }
    
    function RowsLayout() {
        return GridLayout({cols:1}, ...arguments);
    }
    
    function ColsLayout() {
        return GridLayout({rows: 1}, ...arguments);
    }
    
    /**
     * side = "top"|"bottom"|"left"|"right"
     * 
     * nothing OR labels[string] OR tabs[entity]. //TODO `tabs` don't have an easy way of selecting the right page
     * @param {*} param0 
     * @param  {...any} pages 
     */
    function TabsLayout({tabs, labels, side="top"}={}, ...pages) {
        let layout = UiEntity();

        let size = [1,1];
        let rowcol;
        if (side == "top" || side == "bottom") {
            rowcol = "cols";
            for (let i = 0; i < pages.length; i++) {
                let pageSize = pages[i].getSize();
                size[0] = Math.max(size[0], pageSize[0]);
                size[1] = Math.max(size[1], pageSize[1]+1);
            }
        } else {
            rowcol = "rows";
            for (let i = 0; i < pages.length; i++) {
                let pageSize = pages[i].getSize();
                size[0] = Math.max(size[0], pageSize[0]+1);
                size[1] = Math.max(size[1], pageSize[1]);
            }
        }
        layout.getSize = function(maxSize) {
            return size;
        };
        let second;
        if (side == "top" || side == "left") {
            second = false;
        } else {
            second = true;
        }

        let getOverrideMaterial = function() {
            return {
                color: "#88CCAA",
                flatShading: true,
                shader: 'flat',
                transparent: true,
                fog: false,
                src: 'shader:flat'
            };
        };

        let tabButtons;
        let resetTabs = function() { //TODO Should probably keep track of which tab is active, instead
            for (let i = 0; i < pages.length; i++) {
                pages[i].setAttribute("visible",false);
                delete tabButtons[i].materials.override;
                tabButtons[i].resetMaterial = true; //TODO Feels like a growing hack
            }
        }

        if (tabs) {
            tabButtons = tabs;
        } else {
            tabButtons = [];
            for (let i = 0; i < pages.length; i++) {
                tabButtons[i] = UiButton({text:(labels ? labels[i] : undefined), oncontrollerdown:function(){
                    resetTabs();
                    pages[i].setAttribute("visible", true);
                    tabButtons[i].materials.override = getOverrideMaterial();
                }});
            }
        }
        
        resetTabs();

        let gridOuter;
        let gridInner;
        let pagesEntity;
        gridOuter = GridLayout({[rowcol]:pages.length},
            ...maybeReverse(second,
                gridInner = GridLayout({[rowcol]:pages.length},
                    ...tabButtons
                ),
                pagesEntity = UiEntity({},
                    ...pages
                )
            )
        )
        layout.appendChild(gridOuter);
  
        return layout;
    }
    
    /**
     * side = "top"|"bottom"|"left"|"right"
     * 
     * `autodistribute` means that it will create a grid with params `gridparams` - but both cols and rows are specified, as opposed to in GridLayout.
     * `pack` remains the same - it means order is partially ignored in an attempt to fit all the items closely together.
     * Multiple such grids are created as needed, and they are one by one filled with items from `children`.
     * 
     * If not `autodistribute`, then each of `children` is its own page.
     * @param {*} param0 
     */
    function PageLayout({autodistribute=false, side="bottom", gridparams:{cols, rows, pack=true}={}}={},...children) {
        let layout = UiEntity();

        //TODO This is kindof a mishmash, sorry

        let pages;

        let rowcol;
        let fixed; //TODO Specify grid justification separately from button side?
        let secondary;
        if (side == "top" || side == "bottom") {
            rowcol = "cols";
            fixed = cols;
            secondary = rows;
        } else {
            rowcol = "rows";
            fixed = rows;
            secondary = cols;
        }

        if (autodistribute) {
            pages = [];
            let grids = [];
            let grid;
            let gridEmpty;
            let buttons;

            let startGrid = function() {
                grid = GridInternal({[rowcol]:fixed});
                gridEmpty = true;
                grids.push(grid);

                buttons = UiEntity({size:[cols,rows]}); //TODO Should it adjust for under/over size?
                let finalSize = [cols,rows];
                buttons.setAttribute('position', `${-finalSize[0]/2} ${finalSize[1]/2} 0`);        
                pages.push(buttons);
            }

            if (children.length > 0) { //TODO Have single empty page?
                startGrid();
            }
            for (let i = 0; i < children.length; i++) {
                let item = children[i];
                if (!grid.add(item, pack, secondary)) {
                    if (!gridEmpty) { // This should no longer be necessary, but should still technically be correct
                        startGrid();
                    }
                    grid.add(item, pack); // Force add
                }
                gridEmpty = false;
                buttons.appendChild(item);
            }
        } else {
            // Each child is its own page
            pages = children;
        }
        
        let size = [1,1];
        let buttonSpacing;
        if (side == "top" || side == "bottom") {
            for (let i = 0; i < pages.length; i++) {
                let pageSize = pages[i].getSize();
                size[0] = Math.max(size[0], pageSize[0]);
                size[1] = Math.max(size[1], pageSize[1]+1);
            }
            buttonSpacing = size[0]-2;
        } else {
            for (let i = 0; i < pages.length; i++) {
                let pageSize = pages[i].getSize();
                size[0] = Math.max(size[0], pageSize[0]+1);
                size[1] = Math.max(size[1], pageSize[1]);
            }
            buttonSpacing = size[1]-2;
        }
        layout.getSize = function(maxSize) {
            return size;
        };

        let second;
        if (side == "top" || side == "left") {
            second = false;
        } else {
            second = true;
        }

        let selected = 0;
        if (pages.length > 0) {
            pages[0].setAttribute("visible",true);
        }
        for (let i = 1; i < pages.length; i++) {
            pages[i].setAttribute("visible",false);
        }
        selected = 0;

        let prevButton;
        let nextButton;
        let updatePageButtons = function() {
            if (selected > 0) {
                prevButton.setAttribute("visible", true);
            }
            if (selected < pages.length-1) {
                nextButton.setAttribute("visible", true);
            }

            if (selected <= 0) {
                prevButton.setAttribute("visible", false);
            }
            if (selected >= pages.length-1) {
                nextButton.setAttribute("visible", false);
            }
        };

        let tabButtons = [
            prevButton = UiButton({text:"<-", oncontrollerdown:function() {
                if (selected > 0) {
                    pages[selected].setAttribute("visible", false);
                    selected--;
                    pages[selected].setAttribute("visible", true);
                    updatePageButtons();
                }
            }}),
            ...Array.from({length:buttonSpacing},x => UiEntity()), //TODO Kinda wasteful
            (nextButton = UiButton({text:"->", oncontrollerdown:function() { //NOTE Apparently you need to encase an (x = blah) in parens if it follows a ...stuff
                if (selected < pages.length-1) {
                    pages[selected].setAttribute("visible", false);
                    selected++;
                    pages[selected].setAttribute("visible", true);
                    updatePageButtons();
                }
            }}))
        ];
        updatePageButtons();

        let gridOuter;
        let gridInner;
        let pagesEntity;
        gridOuter = GridLayout({[rowcol]:buttonSpacing+2},
            ...maybeReverse(second,
                gridInner = GridLayout({[rowcol]:buttonSpacing+2},
                    ...tabButtons
                ),
                pagesEntity = UiEntity({},
                    ...pages
                )
            )
        );
        layout.appendChild(gridOuter);
        //TODO Center overall element?
    
        return layout;
    }

    /**
     * getSize comes from `size`.
     *   If no `size`, is autocalculated from `children`.
     *   If no `children`, defaults to [1,1].
     * 
     * 
     * @param {*} params 
     * @param  {...any} children 
     */
    function UiEntity(params={}, ...children) { // {type,size,maxSize,color,materials:{normal:{color,flatShading,shader,transparent,fog,src},hover:{...},pressed:{...},selected:{...}}}
        let options = {type:"a-entity", maxSize:[1,1],
            materials:{ //TODO Do these even belong here?  Or are they only really applicable for buttons?
                normal:{ //TODO Might not want to recurse into these, but I don't really have any good methods for that
                    color: "#909090",
                    flatShading: true,
                    shader: 'flat',
                    transparent: true,
                    fog: false,
                    src: 'shader:flat'
                },
                hover:{
                    color: "#FF0000",
                    flatShading: true,
                    shader: 'flat',
                    transparent: true,
                    fog: false,
                    src: 'shader:flat'
                },
                pressed:{
                    color: "#FFDDDD", 
                    flatShading: true,
                    shader: 'flat',
                    transparent: true,
                    fog: false,
                    src: 'shader:flat'
                },
                selected:{
                    color: "#DDAAAA", 
                    flatShading: true,
                    shader: 'flat',
                    transparent: true,
                    fog: false,
                    src: 'shader:flat'
                }
            }
        }; //TODO This does mostly what I want, but it's a bit verbose
        _.merge(options,params);
        let {type,size,maxSize,color,materials} = options;
    
        let entity = document.createElement(type);
        entity.maxSize = maxSize;
    
        //TODO Optionize
        entity.materials = materials;
        if (color) {
            entity.materials.normal.color = color;
        }
        entity.setAttribute("material", entity.materials.normal);
  
        /**
         * Override to return actual size.
         * maxSize is a field on UiEntity.
         * Sizes are in [X,Y]
         */
        entity.getSize = function(maxSize) { //TODO ??
            if (size) {
                return size;
            } else {
                return [1,1];
            }
        };

        if (children) {
            for (let i = 0; i < children.length; i++) {
                entity.appendChild(children[i]);
            }
            if (!size) {
                entity.getSize = function(maxSize) {
                    let maxX = 1;
                    let maxY = 1;
                    for (let i = 0; i < children.length; i++) {
                        let size = children[i].getSize(maxSize); //TODO ??
                        maxX = Math.max(maxX, size[0]);
                        maxY = Math.max(maxY, size[1]);
                    }
                    return [maxX, maxY];
                }
            }
        }

        return entity;
    }

    return {
        loadUi: loadUi,
        UiRoot: UiRoot,
        FoldLayout: FoldLayout,
        GridLayout: GridLayout,
        RowsLayout: RowsLayout,
        ColsLayout: ColsLayout,
        TabsLayout: TabsLayout,
        PageLayout: PageLayout,
        UiEntity: UiEntity,
        UiButton: UiButton,
        UiText: UiText,
        UiTransform: UiTransform
    }
}());