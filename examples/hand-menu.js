/**
 * These are mostly my tests as I built the code.  They should provide a fairly comprehensive set of examples.
 * The code I use to generate random UI here gets a bit dense, but is largely unnecessary, so try not to get intimidated.
 */
let UI = HandMenu;

let rInt = function(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

if (false) {
    let handUi = UI.UiRoot(
    UI.FoldLayout(
        UI.GridLayout({cols:4},
        UI.UiButton({oncontrollerdown:(function(){this.setAttribute('color', '#88CCAA');}),size:[3,3]}),
        UI.UiButton({oncontrollerdown:(function(){this.setAttribute('visible', false);}),size:[1,2]}),
        UI.UiButton()
        ),
        UI.RowsLayout(),
        UI.TabsLayout( //TODO Icons, labels
        UI.GridLayout({rows:4}),
        UI.UiButton()
        )
    )
    );

    uiEl.appendChild(handUi);
}

if (false) {
    let grid;
    let text;
    let handUi = UI.UiRoot(
      grid = UI.GridLayout({cols:4},
        UI.UiButton({oncontrollerdown:(function(){
          setTimeout(() => {
            this.materials.normal.color = "#88CCAA";
          }, 1000);
        }),text:"Color",color:"#0000FF",size:[3,3]}),
        UI.UiButton({oncontrollerdown:(function(){
          this.setAttribute('visible', false);
        }),text:"Visible",color:"#FF0000",size:[1,2]}),
        text = UI.UiText({text:"Blah",textcolor:"#55FF55"}),
        UI.UiButton({oncontrollerdown:(function(){
          text.setAttribute("value",`${grid.getSize()}`);
        }),text:"Grid size"}),
        UI.UiButton(),
        ...Array.from({length: 7}, x => UI.UiButton({size:[rInt(3)+1,rInt(3)+1]}))
      )
    );
    handUi.setAttribute('position', '0 0.01 0');

    uiEl.appendChild(handUi);
}

if (false) {
    let tabs = [];
    let hideTabs = function() { //TODO Should probably keep track of which tab is active
      for (let i = 0; i < tabs.length; i++) {
        tabs[i].setAttribute("visible",false);
      }
    }

    let gridInner;
    let gridOuter;
    let tabsEntity;

    let tabsUi = UI.UiRoot(
      gridOuter = UI.GridLayout({rows:6},
        gridInner = UI.GridLayout({rows:6},
          UI.UiButton({text:"A",oncontrollerdown:(function() {hideTabs(); tabs[0].setAttribute("visible", true); console.log(0, tabs[0].getSize());})}),
          UI.UiButton({text:"B",oncontrollerdown:(function() {hideTabs(); tabs[1].setAttribute("visible", true); console.log(1, tabs[1].getSize());})}),
          UI.UiButton({text:"C",oncontrollerdown:(function() {hideTabs(); tabs[2].setAttribute("visible", true); console.log(2, tabs[2].getSize());})}),
          UI.UiButton({text:"D",oncontrollerdown:(function() {hideTabs(); tabs[3].setAttribute("visible", true); console.log(3, tabs[3].getSize());})}),
          UI.UiButton({text:"E",oncontrollerdown:(function() {hideTabs(); tabs[4].setAttribute("visible", true); console.log(4, tabs[4].getSize());})}),
          UI.UiButton({text:"F",oncontrollerdown:(function() {hideTabs(); tabs[5].setAttribute("visible", true); console.log(5, tabs[5].getSize());})})
        ),
        tabsEntity = UI.UiEntity({},
          ...Array.from({length: 6}, x => {
            return tabs[tabs.length] = UI.GridLayout({rows:6},
              ...Array.from({length: 7}, x => UI.UiButton({size:[rInt(3)+1,rInt(3)+1]}))
            )
          })
          //...Array.from({length: 6}, x => tabs[tabs.length] = UI.UiButton({size:[rInt(3)+1,rInt(3)+1]}))
        )
      )
    );

    console.log("outer",gridOuter.getSize());
    console.log("inner",gridInner.getSize());
    console.log("tabs",tabsEntity.getSize());

    tabsUi.setAttribute('position', '0 0.01 0');
    uiEl.appendChild(tabsUi);
}

if (false) {
    let ba;
    let bb;
    let bc;
    let bd;
    let be;

    let ui = UI.UiRoot(
      UI.UiEntity({},
        ba = UI.GridLayout({cols:5},
          ...Array.from({length: 5*5}, x => UI.UiButton({size:[1,1], color:rInt(0x1000000)}))
        ),
        bb = UI.GridLayout({rows:5},
          ...Array.from({length: 5*5}, x => UI.UiButton({size:[1,1], color:rInt(0x1000000)}))
        ),
        bc = UI.UiButton({size:[3,3], color:rInt(0x1000000)}),
        bd = UI.UiButton({size:[2,2], color:rInt(0x1000000)}),
        be = UI.UiButton({size:[1,1], color:rInt(0x1000000)})
      )
    );
    ba.setAttribute("position", "0 0 0.0");
    bb.setAttribute("position", "0 0 0.1");
    bc.setAttribute("position", "0 0 0.2");
    bd.setAttribute("position", "0 0 0.3");
    be.setAttribute("position", "0 0 0.4");

    ui.setAttribute('position', '0 0.01 0');
    uiEl.appendChild(ui);
}

if (false) {
    let tabsUi = UI.UiRoot(
        UI.TabsLayout({labels:["top","right","bottom","left"]},
          UI.TabsLayout({side:"top",labels:["A","B","C","D","E","F"]},
            ...Array.from({length: 6}, x => {
              return UI.GridLayout({cols:6}, // You'll likely want to use cols for top/bottom and rows for left/right, or the alignment is weirder than usual
                ...Array.from({length: 7}, x => UI.UiButton({size:[rInt(3)+1,rInt(3)+1]}))
              )
            })
            //...Array.from({length: 6}, x => UI.UiButton({size:[rInt(3)+1,rInt(3)+1]}))
          ),
          UI.TabsLayout({side:"right",labels:["A","B","C","D","E","F"]},
            ...Array.from({length: 6}, x => {
              return UI.GridLayout({rows:6},
                ...Array.from({length: 7}, x => UI.UiButton({size:[rInt(3)+1,rInt(3)+1]}))
              )
            })
            //...Array.from({length: 6}, x => UI.UiButton({size:[rInt(3)+1,rInt(3)+1]}))
          ),
          UI.TabsLayout({side:"bottom",labels:["A","B","C","D","E","F"]},
            ...Array.from({length: 6}, x => {
              return UI.GridLayout({cols:6},
                ...Array.from({length: 7}, x => UI.UiButton({size:[rInt(3)+1,rInt(3)+1]}))
              )
            })
            //...Array.from({length: 6}, x => UI.UiButton({size:[rInt(3)+1,rInt(3)+1]}))
          ),
          UI.TabsLayout({side:"left",labels:["A","B","C","D","E","F"]},
            ...Array.from({length: 6}, x => {
              return UI.GridLayout({rows:6},
                ...Array.from({length: 7}, x => UI.UiButton({size:[rInt(3)+1,rInt(3)+1]}))
              )
            })
            //...Array.from({length: 6}, x => UI.UiButton({size:[rInt(3)+1,rInt(3)+1]}))
          )
        )
      );

      tabsUi.setAttribute('position', '0 0.01 0');
      uiEl.appendChild(tabsUi);
}

if (false) {
    let foldUi = UI.UiRoot(
        UI.FoldLayout({},
          ...Array.from({length: 7}, x => 
            UI.UiEntity({},
              UI.GridLayout({rows:6},
                ...Array.from({length: 7}, x => UI.UiButton({size:[rInt(2)+1,rInt(2)+1]}))
                //...Array.from({length: 18}, x => UI.UiButton({size:[1,1]}))
              ),
              UI.UiTransform({position:"0 0 0.1", scale:"0.1 0.1 0.1"},UI.UiButton({color:"#FF0000"})) // Center marker
            )
          )
          //,UI.UiText({text:"BLAAAAH"})
        )
      );

      uiEl.appendChild(foldUi);
}

if (false) {
    let pagesUi = UI.UiRoot(
        UI.UiEntity({},
          UI.PageLayout({side:"left"},
            ...Array.from({length: 7}, x => 
                UI.GridLayout({rows:6},
                  ...Array.from({length: 7}, x => UI.UiButton({size:[rInt(2)+1,rInt(2)+1]}))
                  //...Array.from({length: 18}, x => UI.UiButton({size:[1,1]}))
                )
            )
            //,UI.UiText({text:"BLAAAAH"})
          ),
          UI.UiTransform({position:"0 0 0.2", scale:"0.1 0.1 0.1"},UI.UiButton({color:"#0000FF"}))
        )
      );

      uiEl.appendChild(pagesUi);
}

if (false) {
    let pagesUi = UI.UiRoot(
        UI.UiEntity({},
          UI.PageLayout({side:"left",autodistribute:true,gridparams:{cols:6,rows:10}},
            //...Array.from({length: 7}, x => UI.UiButton({size:[rInt(2)+1,rInt(2)+1]}))
            ...Array.from({length: 100}, x => UI.UiButton({size:[1,1]}))
          ),
          UI.UiTransform({position:"0 0 0.2", scale:"0.1 0.1 0.1"},UI.UiButton({color:"#0000FF"}))
        )
      );

      uiEl.appendChild(pagesUi);
}

if (false) {
    let pagesUi = UI.UiRoot(
        UI.UiEntity({},
          UI.PageLayout({side:"left",autodistribute:true,gridparams:{cols:4,rows:6}},
            ...Array.from({length: 200}, x => UI.UiButton({size:[rInt(5)+1,rInt(5)+1]}))
            //...Array.from({length: 60}, x => UI.UiButton({size:[1,1]}))
            //...Array.from({length: 10}, x => UI.UiButton({size:[8,1]}))
          )//,
          //UI.UiTransform({position:"0 0 0.2", scale:"0.1 0.1 0.1"},UI.UiButton({color:"#0000FF"}))
        )
      );

      uiEl.appendChild(pagesUi);
}

if (false) {
    let gridsUi = UI.UiRoot(
        UI.GridLayout({cols:10},
          //...Array.from({length: 100}, x => UI.UiButton({size:[rInt(3)+1,rInt(3)+1]}))
          ...Array.from({length: 100}, x => UI.UiButton({size:[Math.random()*3,Math.random()*3]})) // Non-integer sizes are kinda buggy
        )
      );

      uiEl.appendChild(gridsUi);
}

if (false) {

}

if (false) {

}

if (false) {

}

if (false) {

}

if (false) {

}

if (false) {

}

if (false) {

}

