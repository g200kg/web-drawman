"use strict";

let editor;
let objRoot;
let objSel;
let objClipboard;

let pattern = {
    None:{file:"None.png"},
    Checkers:{file:"Checkers.png"},
    Circle:{file:"Circle.jpg"},
    Fabric:{file:"Fabric.bmp"},
    Hairline:{file:"Hairline.bmp"},
    Magma:{file:"Magma.bmp"},
    Mosaic:{file:"Mosaic.bmp"},
    Plasma:{file:"Plasma.bmp"},
    PunchingMetal:{file:"PunchingMetal.png"},
    PunchingSlits:{file:"PunchingSlits.png"},
    Sand:{file:"Sand.bmp"},
    Stripe:{file:"Stripe.png"},
};

class Obj {
    constructor(t, p, x, y, w, h) {
        this.type = t;
        this.name = null;
        this.id = crypto.randomUUID();
        this.parent = p?p.id:null;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.visible = true;
        this.lock = false;
        this.rotate = 0;
        this.list = [];
        switch(t) {
        case "Group":
            break;
        case "Rect":
            this.rxSep = false;
            this.rx1 = 0;
            this.rx2 = 0;
            this.rx3 = 0;
            this.rx4 = 0;
            break;
        case "Text":
            this.text = "Text";
            this.font = "sans-serif";
            this.textBold = false;
            this.textItalic = false;
            this.textAlign = "left";
            this.textFit = true;
            break;
        case "Polygon":
            this.polyVertex = 5;
            this.polyDepth = 100;
            this.polyTopWidth = 0;
            this.polyBottomWidth = 0;
            break;
        case "Shape":
            this.shape = [];
            this.shapeOrgX = 0;
            this.shapeOrgY = 0;
            this.shapeOrgW = 0;
            this.shapeOrgH = 0;
            this.shapeClose = true;
            break;
        case "Image":
            this.img = null;
            this.imageFrames = 1;
            break;
        }
        this.colFill1 = "#8090a0";
        this.colFill1Alpha = 100;
        this.colFill2 = "#202020";
        this.colFill2Alpha = 100;
        this.colStroke = "#000000";
        this.colStrokeAlpha = 100;
        this.colShadow = "#000000";
        this.colGradation = "none";
        this.colGradX1 = 0.1;
        this.colGradY1 = 0.1;
        this.colGradX2 = 0.9;
        this.colGradY2 = 0.9;
        this.fill = true;
        this.stroke = true;
        this.lineWidth = 1;
        this.lineJoin = "round";
        this.lineCap = "round";
        this.blur = 0;
        this.embossWidth = 4;
        this.embossDepth = 0;
        this.embossBlur = 50;
        this.textureType = "None";
        this.textureDepth = 0;
        this.textureZoom = 100;
        this.shadowOffX = 8;
        this.shadowOffY = 8;
        this.shadowDepth = 0;
        this.shadowBlur = 8;
    }
    getId(obj) {
        return obj.id;
    }
    adjust() {
        if(this.type == "Group") {
            let p1 = {x:99999, y:99999}, p2 = {x:-99999, y:-99999};
            for(let o of this.entries(0,0,0)) {
                p1.x = Math.min(p1.x, o.x, o.x + o.w);
                p1.y = Math.min(p1.y, o.y, o.y + o.h);
                p2.x = Math.max(p2.x, o.x, o.x + o.w);
                p2.y = Math.max(p2.y, o.y, o.y + o.h);
            }
            this.x = p1.x, this.y = p1.y;
            this.w = p2.x - p1.x, this.h = p2.y - p1.y;
        }
    }
    clear() {
        this.list = [];
    }
    set(objlist) {
        this.list = objlist;
    }
    add(obj) {
        this.list.unshift(obj);
    }
    append(obj) {
        this.list.push(obj);
    }
    del(obj) {
        const op = objRoot.getObj(obj.parent);
        const idx = op.list.indexOf(obj);
        op.list.splice(idx,1);
    }
    toggle(obj) {
        if(this.isExist(obj))
            this.del(obj);
        else
            this.add(obj);
    }
    len() {
        let cnt = 0;
        for(let o of this.entries(1, 0, 0)) {
            ++cnt;
        }
        return cnt;
    }
    isExist(obj) {
        for(let o of this.entries(1, 0, 0)) {
            if(o == obj)
                return true;
        }
        return false;
    }
    getIndex(obj) {
        let cnt = 0;
        for(let o of this.entries(1, 0, 0)) {
            if(o == obj)
                return cnt;
            ++cnt;
        }
        return -1;
    }
    getObj(id) {
        if(this.id == id)
            return this;
        for(let o of this.entries(1, 0, 0)) {
            if(o.id == id)
                return o;
        }
        return null;
    }
    findEntry(obj) {
        for(let o of this.entries(1, 0, 1)) {
            if(o.o == obj)
                return o;
        }
        return null;
    }
    findNext(obj) {
        let f = false;
        for(let o of this.entries(0, 0, 0)) {
            if(f)
                return o;
            if(o == obj)
                f = true;
        }
    }
    getRoot() {

    }
    findFirst() {
        for(let o of this.entries(0, 0, 0)) {
            return o;
        }
    }
    move(dx, dy) {
        for(let o of this.entries(1, 0, 0)) {
            o.x += dx;
            o.y += dy;
        }
        this.x += dx;
        this.y += dy;
        for(let o = objRoot.getObj(this.parent); o != objRoot; o = objRoot.getObj(o.parent)) {
            o.adjust();
        }
    }
    size(dw, dh) {
        for(let o of this.entries(1, 0, 0)) {
        }
    }
    entries(r, b, e) {
        if(r) {
            if(b) {
                return {
                    [Symbol.iterator]: ()=>{
                        let res, list = this.list, cnt = list.length - 1, st = [];
                        return {
                            next : ()=>{
                                while(list[cnt] && list[cnt].type == "Group") {
                                    st.push([list, cnt]);
                                    list = list[cnt].list;
                                    cnt = list.length - 1;
                                }
                                if(cnt >= list.length || cnt < 0) {
                                    if(st.length == 0)
                                        return {value:undefined, done:true};
                                    [list, cnt] = st.pop();
                                }
                                res = list[cnt];
                                if(e)
                                    res = {l:list, c:cnt, t:st.length, o:list[cnt]};
                                --cnt;
                                return {value:res, done:false};
                            }
                        }
                    }
                }
            }
            else {
                return {
                    [Symbol.iterator]: ()=>{
                        let o, res, list = this.list, cnt = 0, st = [];
                        return {
                            next : ()=>{
                                while(cnt >= list.length || cnt < 0) {
                                    if(st.length == 0)
                                        return {value:undefined, done:true};
                                    [list, cnt] = st.pop();
                                }
                                o = res = list[cnt];
                                if(e)
                                    res = {l:list, c:cnt, t:st.length, o:o};
                                ++cnt;
                                if(o.type == "Group") {
                                    st.push([list, cnt]);
                                    list = o.list;
                                    cnt = 0;
                                }
                                return {value:res, done:false};
                            }
                        }
                    }
                }
            }
        }
        else {
            return {
                [Symbol.iterator]: ()=>{
                    let cnt = 0, dcnt = 1, res;
                    if(b)
                        cnt = this.list.length - 1, dcnt = -1;
                    return {
                        next : ()=>{
                            if(cnt >= this.list.length || cnt < 0)
                                return {value:undefined, done:true};
                            if(e)
                                res = {value:{l:this.list, c:cnt, t:0, o:this.list[cnt]}, done:false};
                            else
                                res = {value:this.list[cnt], done:false};
                            cnt += dcnt;
                            return res;
                        }
                    }
                }
            }
        }
    }
}

class ObjSel extends Obj {
    constructor() {
        super("Group", null, 0, 0, 100, 100);
        this.name = "objSel";
        this.pt1 = {x:99999, y:99999};
        this.pt2 = {x:-99999, y:-99999};
        console.log("objSel",this.list)
    }
    getSelBox() {
        this.pt1.x = this.pt1.y = this.pt2.x = this.pt2.y = 99999;
        for(let i in this.list) {
            const o = this.list[i];
            const rot = new ptRot(o);
            if(i == 0) {
                this.pt1.x = rot.pt1.x;
                this.pt1.y = rot.pt1.y;
                this.pt2.x = rot.pt2.x;
                this.pt2.y = rot.pt2.y;
            }
            else {
                this.pt1.x = Math.min(this.pt1.x, rot.pt1.x);
                this.pt1.y = Math.min(this.pt1.y, rot.pt1.y);
                this.pt2.x = Math.max(this.pt2.x, rot.pt2.x);
                this.pt2.y = Math.max(this.pt2.y, rot.pt2.y);
            }
        }
    }
    sel(obj) {
       this.clear();
       this.add(obj);
       editor.curObj = obj;
       editor.propView.sel(obj);
    }
    isSel(obj) {
        return this.isExist(obj);
    }
    areaSel(pt1, pt2) {
        const p1 = {x:Math.min(pt1.x, pt2.x), y:Math.min(pt1.y, pt2.y)};
        const p2 = {x:Math.max(pt1.x, pt2.x), y:Math.max(pt1.y, pt2.y)};
        this.clear();
        for(let o of objRoot.entries(0, 0, 1)) {
            const ob = o.o;
            if(ob.visible && p1.x <= ob.x && p1.y <= ob.y && p2.x >= ob.x + ob.w && p2.y >= ob.y + ob.h)
                this.add(ob);
        }
        this.getSelBox();
        editor.objView.build();
    }
    moveSel(dx, dy) {
        for(let o of this.entries(0, 0, 0)) {
            o.move(dx, dy);
        }
    }
    delGroup() {
        for(let i in this.list) {
            const g = this.list[i];
            if(g.type == "Group") {
                const pid = g.parent;
                const p = objRoot.getObj(pid);
                objRoot.del(g);
                objSel.del(g);
                let o;
                for(let j = g.list.length -1; j >= 0; --j) {
                    o = g.list[j];
                    o.parent = pid;
                    p.list.unshift(o);
                }
                objSel.sel(o);
            }
        }
//        editor.objView.build();
        editor.redraw();
    }
    makeGroup() {
        const g = new Obj("Group", objRoot, 0, 0, 100, 100);
        for(let o of this.entries(0, 0, 0)) {
            const oldp = objRoot.getObj(o.parent);
            oldp.del(o);
            o.parent = g.id;
            g.add(o);
        }
        g.adjust();
        objRoot.add(g);
        this.clear();
        this.add(g);
        editor.curObj = g;
        editor.objView.build();
    }
    vupdate() {
        for(let o of this.entries(1, 0, 0)) {
            delete o.temp;
        }
    }
    vmove(pt1, pt2, ptO1, ptO2) {
        let pv;
        let o = this.list[0];

        if(this.list.length == 1 && o.rotate == 0 && this.list[0].type != "Group") {
            pv = editor.propView;
            pv.xElm.value = o.x = pt1.x;
            pv.yElm.value = o.y = pt1.y;
            pv.wElm.value = o.w = pt2.x - pt1.x;
            pv.hElm.value = o.h = pt2.y - pt1.y;
            return;
        }

        for(let o of this.entries(1, 0, 0)) {
            if(!o.temp) {
                o.temp = {};
                o.temp.x = o.x;
                o.temp.y = o.y;
                o.temp.w = o.w;
                o.temp.h = o.h;
            }
            let xx1 = pt1.x, yy1 = pt1.y, xx2 = pt2.x, yy2 = pt2.y;
            if(ptO2.x != ptO1.x) {
                xx1 = pt1.x + (o.temp.x - ptO1.x) * (pt2.x - pt1.x) / (ptO2.x - ptO1.x);
                xx2 = pt1.x + (o.temp.x + o.temp.w - ptO1.x) * (pt2.x - pt1.x) / (ptO2.x - ptO1.x);
            }
            if(ptO2.y != ptO1.y) {
                yy1 = pt1.y + (o.temp.y - ptO1.y) * (pt2.y - pt1.y) / (ptO2.y - ptO1.y);
                yy2 = pt1.y + (o.temp.y + o.temp.h - ptO1.y) * (pt2.y - pt1.y) / (ptO2.y - ptO1.y);
            }
            o.x = xx1;
            o.y = yy1;
            o.w = xx2 - xx1;
            o.h = yy2 - yy1;
            if(o == editor.curObj) {
                pv = editor.propView;
                pv.xElm.value = o.x;
                pv.yElm.value = o.y;
                pv.wElm.value = o.w;
                pv.hElm.value = o.h;
            }
        }
        this.getSelBox();
    }
}
/*
class ObjSel2 {
    constructor() {
        this.list = [];
        this.pt1 = {x:99999, y:99999};
        this.pt2 = {x:-99999, y:-99999};
    }
    clear() {
        this.list = [];
        editor.curObj = null;
        this.vupdate();
        this.getSelBox();
        editor.objView.build();
    }
    len() {
        return this.list.length;
    }
    set(obj) {
        if(obj == null)
            this.clear();
        else {
            this.list = [obj];
            editor.curObj = obj;
            this.vupdate();
        }
        this.getSelBox();
        editor.objView.build();
    }
    add(obj) {
        if(obj != null) {
            if(editor.curObj == null)
                editor.curObj = obj;
            this.list.push(obj);
            this.getSelBox();
            editor.objView.build();
            this.vupdate();
        }
    }
    del(obj) {
        const i = this.list.indexOf(obj);
        if(i >= 0) {
            this.list.splice(i,1);
            editor.curObj = this.list[0];
            this.getSelBox();
            editor.objView.build();
            this.vupdate();
        }
    }
    delSel() {
        for(let i = 0; i < this.list.length; ++i) {
            const o = this.list[i];
            objRoot.del(o);
        }
    }
    isSel(obj) {
        return this.list.includes(obj);
    }
    delGroup() {
        for(let i in this.list) {
            const g = this.list[i];
            const pid = g.parent;
            const p = objRoot.getObj(pid);
            objRoot.del(g);
            for(let j = g.list.length -1; j >= 0; --j) {
                const o = g.list[j];
                o.parent = pid;
//                console.log(o);
                p.list.unshift(o);
            }

        }
        editor.objView.build();
    }
    makeGroup() {
        let o;
        const g = new Obj("Group", objRoot, 0, 0, 100, 100);

        for(let i in this.list) {
            o = this.list[i];
            const oldp = objRoot.getObj(o.parent);
            oldp.del(o);
            o.parent = g.id;
            g.append(o);
        }
        g.adjust();
        objRoot.add(g);
        this.set(g);
        editor.objView.build();
    }
    getSelBox() {
        this.pt1.x = this.pt1.y = this.pt2.x = this.pt2.y = 99999;
        for(let i in this.list) {
            const o = this.list[i];
            const rot = new ptRot(o);
            if(i == 0) {
                this.pt1.x = rot.pt1.x;
                this.pt1.y = rot.pt1.y;
                this.pt2.x = rot.pt2.x;
                this.pt2.y = rot.pt2.y;
            }
            else {
                this.pt1.x = Math.min(this.pt1.x, rot.pt1.x);
                this.pt1.y = Math.min(this.pt1.y, rot.pt1.y);
                this.pt2.x = Math.max(this.pt2.x, rot.pt2.x);
                this.pt2.y = Math.max(this.pt2.y, rot.pt2.y);
            }
        }
    }
    areaSel(pt1, pt2) {
        const p1 = {x:Math.min(pt1.x, pt2.x), y:Math.min(pt1.y, pt2.y)};
        const p2 = {x:Math.max(pt1.x, pt2.x), y:Math.max(pt1.y, pt2.y)};
        this.clear();
        for(let o of objRoot.entries(0, 0, 1)) {
            const ob = o.o;
            if(ob.visible && p1.x <= ob.x && p1.y <= ob.y && p2.x >= ob.x + ob.w && p2.y >= ob.y + ob.h)
                this.add(ob);
        }
        this.getSelBox();
        editor.objView.build();
    }
    move(dx, dy) {
        const pv = editor.propView;
        for(let i in this.list) {
            const o = this.list[i];
            o.move(dx, dy);
            if(o == editor.curObj) {
                pv.xElm.value = o.x;
                pv.yElm.value = o.y;
            }
        }
        this.getSelBox();
    }
    vmove(pt1, pt2, ptO1, ptO2) {
        let pv;
        let o = this.list[0];
        if(this.list.length == 1 && o.rotate == 0) {
            pv = editor.propView;
            pv.xElm.value = o.x = pt1.x;
            pv.yElm.value = o.y = pt1.y;
            pv.wElm.value = o.w = pt2.x - pt1.x;
            pv.hElm.value = o.h = pt2.y - pt1.y;
            return;
        }
        for(let i in this.list) {
            o = this.list[i];

            if(!o.temp) {
                o.temp = {};
                o.temp.x = o.x;
                o.temp.y = o.y;
                o.temp.w = o.w;
                o.temp.h = o.h;
            }
            let xx1 = pt1.x, yy1 = pt1.y, xx2 = pt2.x, yy2 = pt2.y;
            if(ptO2.x != ptO1.x) {
                xx1 = pt1.x + (o.temp.x - ptO1.x) * (pt2.x - pt1.x) / (ptO2.x - ptO1.x);
                xx2 = pt1.x + (o.temp.x + o.temp.w - ptO1.x) * (pt2.x - pt1.x) / (ptO2.x - ptO1.x);
            }
            if(ptO2.y != ptO1.y) {
                yy1 = pt1.y + (o.temp.y - ptO1.y) * (pt2.y - pt1.y) / (ptO2.y - ptO1.y);
                yy2 = pt1.y + (o.temp.y + o.temp.h - ptO1.y) * (pt2.y - pt1.y) / (ptO2.y - ptO1.y);
            }
            o.x = xx1;
            o.y = yy1;
            o.w = xx2 - xx1;
            o.h = yy2 - yy1;
            if(o == editor.curObj) {
                pv = editor.propView;
                pv.xElm.value = o.x;
                pv.yElm.value = o.y;
                pv.wElm.value = o.w;
                pv.hElm.value = o.h;
            }
        }
        this.getSelBox();
    }
    vupdate() {
        for(let i in this.list) {
            const o = this.list[i];
            delete o.temp;
        }
    }
    isPtInSel(pt) {
        if(isHit(pt, this.pt1))
            return "v1";
        if(isHit(pt, {x:this.pt2.x, y:this.pt1.y}))
            return "v2";
        if(isHit(pt, this.pt2))
            return "v3";
        if(isHit(pt, {x:this.pt1.x, y:this.pt2.y}))
            return "v4";
        if(pt.x >= this.pt1.x && pt.x <= this.pt2.x && pt.y >= this.pt1.y && pt.y <= this.pt2.y)
            return "p";
        return false;
    }
}
*/

function loadPattern(ctx) {
    const sel = document.getElementById("prop.textureType");
    for(let t in pattern) {
//        console.log("load pattern : " + t);
        pattern[t].img = new Image();
        pattern[t].img.src = `./images/Texture/${pattern[t].file}`;
        pattern[t].img.id = "pat." + t;
        const opt = document.createElement("option");
        opt.innerHTML = t;
        sel.appendChild(opt);
        pattern[t].img.onload = e => {
            const t = e.target.id.substring(4);
            pattern[t].pat = ctx.createPattern(pattern[t].img, "repeat");
        }
    }

}
class Rot {
    constructor(th) {
        this.cs = Math.cos(th);
        this.sn = Math.sin(th);
    }
    rotate(x, y) {
        return {x:x * this.cs - y * this.sn, y:x * this.sn + y * this.cs};
    }
}
class ptRot {
    constructor(obj) {
        this.th = obj.rotate * Math.PI / 180;
        this.sn = Math.sin(this.th);
        this.cs = Math.cos(this.th);
        this.cx = obj.x + obj.w * 0.5;
        this.cy = obj.y + obj.h * 0.5;
        this.p1 = this.rotate({x:obj.x, y:obj.y});
        this.p2 = this.rotate({x:obj.x + obj.w, y:obj.y});
        this.p3 = this.rotate({x:obj.x + obj.w, y:obj.y + obj.h});
        this.p4 = this.rotate({x:obj.x, y:obj.y + obj.h});
        this.pt1 = {x:Math.min(Math.min(this.p1.x, this.p2.x), Math.min(this.p3.x, this.p4.x)), y:Math.min(Math.min(this.p1.y, this.p2.y), Math.min(this.p3.y, this.p4.y))};
        this.pt2 = {x:Math.max(Math.max(this.p1.x, this.p2.x), Math.max(this.p3.x, this.p4.x)), y:Math.max(Math.max(this.p1.y, this.p2.y), Math.max(this.p3.y, this.p4.y))};
    }
    rotate(pt) {
        let px = pt.x - this.cx;
        let py = pt.y - this.cy;
        return {x:px * this.cs - py * this.sn + this.cx, y:px * this.sn + py * this.cs + this.cy};
    }
}
class ObjView {
    constructor(elm) {
        this.elm = elm;
        this.elm.innerHTML = "<ul></ul>";
        this.elm.addEventListener("pointerdown", e=>{
            switch(e.target.tagName) {
            case "LI":
                const oid = e.target.id;
                if(e.ctrlKey) {
                    objSel.toggle(objRoot.getObj(oid));
                }
                else {
//                    editor.focus(oid);
//                    objSel.clear();
                    objSel.sel(objRoot.getObj(oid));
                }
                editor.redraw();
                break;
            }
        })
        this.elm.addEventListener("click", e=>{
//            console.log("click")
            let p;
            switch(e.target.className){
            case "objv":
                p = objRoot.getObj(e.target.parentNode.id);
                p.visible = e.target.checked;
                editor.redraw();
                break;
            }
        })
        this.elm.addEventListener("dragstart", e=>{
            e.dataTransfer.setData("text/plain", e.target.id);
            e.dataTransfer.dropEffect = "move";
        })
        this.elm.addEventListener("dragenter", e=>{
            e.target.classList.add("dragto");
            e.preventDefault();
        })
        this.elm.addEventListener("dragleave", e=>{
            e.target.classList.remove("dragto");
        })
        this.elm.addEventListener("dragover", e=>{
            e.preventDefault();
        })
        this.elm.addEventListener("drop", e=>{
            const data = e.dataTransfer.getData("text/plain");
            editor.objView.move(data, e.target.id);
            editor.redraw();
            e.preventDefault();
        })
    }
    build() {
        let h = "<ul>", st = [];
        let t, ts;
        for(let e of objRoot.entries(1, 0, 1)) {
            let f = "class='obj'";
            const obj = e.o;
            if(editor && editor.curObj) {
                if(objSel.isSel(obj))
                    f = "class='obj mark'";
                if(editor.curObj == obj)
                    f = "class='obj mark focus'";
            }
            t = e.t;
            ts = "";
            while(t > 1)
                ts += "<img src='./images/Icon/LineI.png' width='16'>", --t;
            if(t)
                ts += "<img src='./images/Icon/LineT.png' width='16'>";
            st.push({f:f, t:e.t, o:obj});
        }
        let t2 = "";
        for(let i = st.length - 1; i >= 0; --i) {
            let l = st[i];
            let t = new Array(l.t + 1);
            t.fill("N");
            t[t.length -1] = "L";
            for(let j = 0; j < t.length; ++j) {
                if(t2[j] == "L" || t2[j] == "T" || t2[j] == "I")
                    if(j == t.length -1)
                        t[j] = "T";
                    else
                        t[j] = "I";
            }
            st[i].tabc = t;
            t2 = t;
        }
        for(let i = 0; i < st.length; ++i) {
            const obj = st[i].o;
            const f = st[i].f;
            const name = (obj.name == null)?obj.type:obj.name;
            let tab = st[i].tabc.join("");
            tab = tab.replaceAll("I","<img src='./images/Icon/lineI.png' width='16'>");
//            tab = tab.replaceAll("T", "┃");
            tab = tab.replaceAll("N","<img src='./images/Icon/lineN.png' width='16'>");
//            tab = tab.replaceAll("N", " ");
            tab = tab.replace("T","<img src='./images/Icon/lineT.png' width='16'>");
//            tab = tab.replace("T", "┣");
            tab = tab.replace("L","<img src='./images/Icon/lineL.png' width='16'>");
//            tab = tab.replace("L","┗");
            h += `<li id="${obj.id}" draggable="true" ${f}><input class="objv" type="checkbox" ${obj.visible?"checked":""}/><input class="objl" type="checkbox" ${obj.lock?"checked":""}/>${tab}${name}</li>`;
        }
        this.elm.innerHTML = h+"<li id='objEnd'><br></li></ul>";
    }
    move(idFrom, idTo) {
        let oTo, opTo, idxTo;
        console.log(idFrom, idTo);
        const oFrom = objRoot.getObj(idFrom);
        if(!oFrom)
            return;
        const opFrom = objRoot.getObj(oFrom.parent);
        opFrom.del(oFrom);
        if(idTo == "objEnd")
            opTo = objRoot, idxTo = opTo.list.length;
        else {
            oTo = objRoot.getObj(idTo); 
            opTo = objRoot.getObj(oTo.parent);
            idxTo = opTo.list.indexOf(oTo);
        }
        opTo.list.splice(idxTo,0, oFrom);
    }
}
class PropView {
    constructor(elm) {
        this.elm = elm;
        this.propPosElm = document.getElementById("propPos");
        this.propCornerElm = document.getElementById("propCorner");
        this.propImageElm = document.getElementById("propImage");
        this.propPolyElm = document.getElementById("propPoly");
        this.propTextElm = document.getElementById("propText");
        this.propShapeElm = document.getElementById("propShape");
        this.propColorElm = document.getElementById("propColor");
        this.propFillElm = document.getElementById("propFill");
        this.propEmbossElm = document.getElementById("propEmboss");
        this.propTextureElm = document.getElementById("propTexture");
        this.propShadowElm = document.getElementById("propShadow");
        this.xElm = document.getElementById("prop.x");
        this.yElm = document.getElementById("prop.y");
        this.wElm = document.getElementById("prop.w");
        this.hElm = document.getElementById("prop.h");
        this.rotateElm = document.getElementById("prop.rotate");
        this.rxSepElm = document.getElementById("prop.rxSep");
        this.rx1Elm = document.getElementById("prop.rx1");
        this.rx2Elm = document.getElementById("prop.rx2");
        this.rx3Elm = document.getElementById("prop.rx3");
        this.rx4Elm = document.getElementById("prop.rx4");
        this.imageFramesElm = document.getElementById("prop.imageFrames");
        this.polyVertexElm = document.getElementById("prop.polyVertex");
        this.polyDepthElm = document.getElementById("prop.polyDepth");
        this.polyTopWidthElm = document.getElementById("prop.polyTopWidth");
        this.polyBottomWidthElm = document.getElementById("prop.polyBottomWidth");
        this.textElm = document.getElementById("prop.text");
        this.fontElm = document.getElementById("prop.font");
        this.textBoldElm = document.getElementById("prop.textBold");
        this.textItalicElm = document.getElementById("prop.textItalic");
        this.textAlignElm = document.getElementById("prop.textAlign");
        this.textFitElm = document.getElementById("prop.textFit");
        this.shapeCloseElm = document.getElementById("prop.shapeClose");
        this.colFill1Elm = document.getElementById("prop.colFill1");
        this.colFill1AlphaElm = document.getElementById("prop.colFill1Alpha");
        this.colFill2Elm = document.getElementById("prop.colFill2");
        this.colFill2AlphaElm = document.getElementById("prop.colFill2Alpha");
        this.colStrokeElm = document.getElementById("prop.colStroke");
        this.colStrokeAlphaElm = document.getElementById("prop.colStrokeAlpha");
        this.colShadowElm = document.getElementById("prop.colShadow");
        this.colGradationElm = document.getElementById("prop.colGradation");
        this.fillElm = document.getElementById("prop.fill");
        this.strokeElm = document.getElementById("prop.stroke");
        this.lineWidthElm = document.getElementById("prop.lineWidth");
        this.lineJoinElm = document.getElementById("prop.lineJoin");
        this.lineCapElm = document.getElementById("prop.lineCap");
        this.blurElm = document.getElementById("prop.blur");
        this.embossWidthElm = document.getElementById("prop.embossWidth");
        this.embossDepthElm = document.getElementById("prop.embossDepth");
        this.embossBlurElm = document.getElementById("prop.embossBlur");
        this.textureTypeElm = document.getElementById("prop.textureType");
        this.textureDepthElm = document.getElementById("prop.textureDepth");
        this.textureZoomElm = document.getElementById("prop.textureZoom");
        this.shadowOffXElm = document.getElementById("prop.shadowOffX");
        this.shadowOffYElm = document.getElementById("prop.shadowOffY");
        this.shadowDepthElm = document.getElementById("prop.shadowDepth");
        this.shadowBlurElm = document.getElementById("prop.shadowBlur");
        this.drag = null;

        this.elm.addEventListener("dragstart", e=>{
            e.dataTransfer.setData("text/plain", e.target.value);
            e.dataTransfer.dropEffect = "move";
        })

        for(let e of document.getElementsByClassName("proppal")) {
//            console.log(e)
            e.addEventListener("dragenter", e=>{
                e.preventDefault();
            })
            e.addEventListener("dragleave", e=>{
                e.preventDefault();
            })
            e.addEventListener("dragover", e=>{
                e.preventDefault();
            })
            e.addEventListener("drop", e=>{
                const data = e.dataTransfer.getData("text/plain");
                e.target.style.background = data;
                e.preventDefault();
            })
        }
        this.elm.addEventListener("pointerdown", e=>{
            if(e.target.id.substring(0,5)=="vval.") {
                const elm = document.getElementById(e.target.id.substring(5));
                this.drag = {e:elm, v:elm.value|0, y:e.y};
                e.target.setPointerCapture(e.pointerId);
            }
        })
        this.elm.addEventListener("pointermove", e=>{
            if(this.drag) {
                const mn = this.drag.e.dataset.min;
                let st = this.drag.e.dataset.step;
                if(st == undefined)
                    st = 1;
                let v = (this.drag.v + (this.drag.y - e.y) * st);
                if(mn != undefined && v < mn)
                    v = mn;
                const mx = this.drag.e.dataset.max;
                if(mx != undefined && v > mx)
                    v = mx;
                v = String(v);
                if(v.indexOf(".") >= 0)
                    v += "0";
                else
                    v += ".0";
                v = v.substring(0, v.indexOf(".")+2);
                this.drag.e.value = v;
                this.drag.e.dispatchEvent(new Event("change",{bubbles:true}));
            }
        })
        this.elm.addEventListener("pointerup", e=>{
            this.drag = null;
            e.target.releasePointerCapture(e.pointerId);
        })
        this.elm.addEventListener("wheel", e=>{
            return false;
        })
        this.elm.addEventListener("change", e=>{
            switch(e.target.dataset.type) {
            case "num":
                this.prop[e.target.id.substring(5)] = parseFloat(e.target.value);
                editor.redraw();
                break;
            case "check":
                this.prop[e.target.id.substring(5)] = e.target.checked;
                editor.redraw();
                break;
            case "sel":
                this.prop[e.target.id.substring(5)] = e.target.value;
                editor.redraw();
                break;
            }
        })
        this.elm.addEventListener("click", e=>{
            if(e.target.className == "colfocus") {
                let s = "rprop"+e.target.id.substring(5);
                s = s.replace("Alpha","");
                document.getElementById(s).checked = true;
            }
            if(e.target.className == "proppal") {
                if(document.getElementById("rpropcolFill1").checked) {
                    this.colFill1Elm.value = rgbToHex(e.target.style.background);
                    this.colFill1Elm.dispatchEvent(new Event("input",{bubbles:true}));
                }
                else if(document.getElementById("rpropcolFill2").checked) {
                    this.colFill2Elm.value = rgbToHex(e.target.style.background);
                    this.colFill2Elm.dispatchEvent(new Event("input",{bubbles:true}));
                }
                else if(document.getElementById("rpropcolStroke").checked) {
                    this.colStrokeElm.value = rgbToHex(e.target.style.background);
                    this.colStrokeElm.dispatchEvent(new Event("input",{bubbles:true}));
                }
                else if(document.getElementById("rpropcolShadow").checked) {
                    this.colShadowElm.value = rgbToHex(e.target.style.background);
                    this.colShadowElm.dispatchEvent(new Event("input",{bubbles:true}));
                }
            }
            switch(e.target.id) {
            case "shapeEdit":
                editor.shapeEdit = !editor.shapeEdit;
//                console.log("shapeEdit", editor.curObj);
                editor.redraw();
                break;
            case "gradEdit":
                editor.gradEdit = !editor.gradEdit;
//                console.log("gradEdit", editor.curObj);
                editor.redraw();
                break;
            }
        })

        this.rxSepElm.addEventListener("change", e=>{
            if(!this.prop.rxSep) {
                this.rx2Elm.disabled = false;
                this.rx3Elm.disabled = false;
                this.rx4Elm.disabled = false;
            }
            else {
                this.rx2Elm.disabled = true;
                this.rx3Elm.disabled = true;
                this.rx4Elm.disabled = true;
            }
        })
        this.textElm.addEventListener("input", e=>{
            this.prop.text = e.target.value;
            editor.redraw();
        })
        this.colFill1Elm.addEventListener("input", e=>{
            this.prop.colFill1 = e.target.value;
            editor.redraw();
        })
        this.colFill2Elm.addEventListener("input", e=>{
            this.prop.colFill2 = e.target.value;
            editor.redraw();
        })
        this.colStrokeElm.addEventListener("input", e=>{
            this.prop.colStroke = e.target.value;
            editor.redraw();
        })
        this.colShadowElm.addEventListener("input", e=>{
            this.prop.colShadow = e.target.value;
            editor.redraw();
        })
    }
    sel(obj) {
        if(!obj) {
            this.propPosElm.style = "";
            this.propCornerElm.style = "display:none";
            this.propFillElm.style = "";
            this.propColorElm.style = "";
            this.propImageElm.style = "display:none";
            this.propPolyElm.style = "display:none";
            this.propTextElm.style = "display:none";
            this.propShapeElm.style = "display:none";
            this.propEmbossElm.style = "display:none";
            this.propTextureElm.style = "";
            this.propShadowElm.style = "";
            return;
        }
        else {
            this.propPosElm.style = "";
            this.propFillElm.style = "";
            this.propColorElm.style = "";
            this.propEmbossElm.style = "";
            this.propTextureElm.style = "";
            this.propShadowElm.style = "";
        }
        switch(obj.type) {
        case "Rect":
            this.propCornerElm.style = "";
            this.propColorElm.style = "";
            this.propFillElm.style = "";
            this.propEmbossElm.style = "";
            this.propPolyElm.style = "display:none";
            this.propTextElm.style = "display:none";
            this.propShapeElm.style = "display:none";
            this.propImageElm.style = "display:none";
            break;
        case "Circle":
            this.propColorElm.style = "";
            this.propFillElm.style = "";
            this.propEmbossElm.style = "";
            this.propCornerElm.style = "display:none";
            this.propPolyElm.style = "display:none";
            this.propTextElm.style = "display:none";
            this.propShapeElm.style = "display:none";
            this.propImageElm.style = "display:none";
            break;
        case "Text":
            this.propColorElm.style = "";
            this.propFillElm.style = "";
            this.propEmbossElm.style = "";
            this.propImageElm.style = "display:none";
            this.propCornerElm.style = "display:none";
            this.propPolyElm.style = "display:none";
            this.propTextElm.style = "";
            this.propShapeElm.style = "display:none";
            break;
        case "Polygon":
            this.propColorElm.style = "";
            this.propFillElm.style = "";
            this.propEmbossElm.style = "";
            this.propCornerElm.style = "display:none";
            this.propImageElm.style = "display:none";
            this.propPolyElm.style = "";
            this.propTextElm.style = "display:none";
            this.propShapeElm.style = "display:none";
            break;
        case "Shape":
            this.propImageElm.style = "display:none";
            this.propColorElm.style = "";
            this.propFillElm.style = "";
            this.propEmbossElm.style = "";
            this.propCornerElm.style = "display:none";
            this.propPolyElm.style = "display:none";
            this.propTextElm.style = "display:none";
            this.propShapeElm.style = "";
            break;
        case "Image":
            this.propImageElm.style = "";
            this.propEmbossElm.style = "display:none";
            this.propFillElm.style = "display:none";
            this.propColorElm.style = "display:none";
            this.propCornerElm.style = "display:none";
            this.propPolyElm.style = "display:none";
            this.propTextElm.style = "display:none";
            this.propShapeElm.style = "display:none";
            break;
        }
        this.prop = obj;
        this.xElm.value = obj.x;
        this.yElm.value = obj.y;
        this.wElm.value = obj.w;
        this.hElm.value = obj.h;
        this.rxSepElm.checked = obj.rxSep;
        if(obj.rxSep) {
            this.rx2Elm.disabled = false;
            this.rx3Elm.disabled = false;
            this.rx4Elm.disabled = false;
        }
        else {
            this.rx2Elm.disabled = true;
            this.rx3Elm.disabled = true;
            this.rx4Elm.disabled = true;
        }
        this.rotateElm.value = obj.rotate;
        this.rx1Elm.value = obj.rx1;
        this.rx2Elm.value = obj.rx2;
        this.rx3Elm.value = obj.rx3;
        this.rx4Elm.value = obj.rx4;
        this.imageFramesElm.value = obj.imageFrames;
        this.polyVertexElm.value = obj.polyVertex;
        this.polyDepthElm.value = obj.polyDepth;
        this.polyTopWidthElm.value = obj.polyTopWidth;
        this.polyBottomWidthElm.value = obj.polyBottomWidth;
        this.textElm.value = obj.text;
        this.fontElm.value = obj.font;
        this.textBoldElm.checked = obj.textBold;
        this.textItalicElm.checked = obj.textItalic;
        this.textAlignElm.value = obj.textAlign;
        this.textFitElm.checked = obj.textFit;
        this.shapeCloseElm.checked = obj.shapeClose;
        this.colFill1Elm.value = obj.colFill1;
        this.colFill1AlphaElm.value = obj.colFill1Alpha;
        this.colFill2Elm.value = obj.colFill2;
        this.colFill2AlphaElm.value = obj.colFill2Alpha;
        this.colStrokeElm.value = obj.colStroke;
        this.colStrokeAlphaElm.value = obj.colStrokeAlpha;
        this.colShadowElm.value = obj.colShadow;
        this.colGradationElm.value = obj.colGradation;
        this.fillElm.checked = obj.fill;
        this.strokeElm.checked = obj.stroke;
        this.lineWidthElm.value = obj.lineWidth;
        this.lineJoinElm.value = obj.lineJoin;
        this.lineCapElm.value = obj.lineCap;
        this.blurElm.value = obj.blur;
        this.embossWidthElm.value = obj.embossWidth;
        this.embossDepthElm.value = obj.embossDepth;
        this.embossBlurElm.value = obj.embossBlur;
        this.textureTypeElm.value = obj.textureType;
        this.textureDepthElm.value = obj.textureDepth;
        this.textureZoomElm.value = obj.textureZoom;
        this.shadowOffXElm.value = obj.shadowOffX;
        this.shadowOffYElm.value = obj.shadowOffY;
        this.shadowDepthElm.value = obj.shadowDepth;
        this.shadowBlurElm.value = obj.shadowBlur;
    }
}
class Menu {
    constructor(elmid) {
//        console.log("Menu constructor");
        this.menuElm = document.getElementById("menubase");
        this.menubarElm = document.getElementById("menubar");
        this.menuElm.addEventListener("click", e=>{
            const px = editor.rzoomX(editor.winw * 0.5);
            const py = editor.rzoomY(editor.winh * 0.5);
            switch(e.target.id.split("#")[0]) {
            case "file":
                this.setModal("modalFile");
                break;
            case "edit":
                this.setModal("modalEdit");
                break;
            case "modalSettings":
                document.getElementById("modalImageSizeX").value = editor.docw;
                document.getElementById("modalImageSizeY").value = editor.doch;
                this.setModal("modalImageSize");
                break;
            case "modalPalLoad":
                editor.loadPalette();
                this.setModal(null);
                break;
            case "modalPalSave":
                editor.savePalette();
                this.setModal(null);
                break;
            case "modalFileLoad":
                editor.loadJson();
                this.setModal(null);
                break;
            case "modalFileSave":
                editor.saveJson();
                this.setModal(null);
                break;
            case "modalFileExport":
                editor.export();
                this.setModal(null);
                break;
            case "modalEditRename":
                this.setModal(null);
                editor.editRename();
                break;
            case "modalEditDelete":
                this.setModal(null);
                editor.editDel();
                break;
            case "modalEditDuplicate":
                this.setModal(null);
                editor.editDup();
                break;
            case "modalEditCopy":
                editor.editCopy();
                this.setModal(null);
                break;
            case "modalEditPaste":
                editor.editPaste();
                this.setModal(null);
                break;
            case "modalImageSizeOK":
                editor.setImageSize(document.getElementById("modalImageSizeX").value|0, document.getElementById("modalImageSizeY").value|0);
                this.setModal(null);
                editor.redraw();
                break;
            case "modalConfirmOK":
                e.target.parentNode.parentNode.style.display = "none";
                e.target.parentNode.parentNode.parentNode.style.display = "none";
                if(this.confirmCallback)
                    this.confirmCallback(true);
                break;
            case "modalGridOK":
                editor.setGrid(document.getElementById("modalGridX").value|0, document.getElementById("modalGridY").value|0);
                this.setModal(null);
                editor.redraw();
                break;
            case "modalRenameOK":
                editor.rename(document.getElementById("modalRenameInput").value);
                this.setModal(null);
                editor.redraw();
                break;
            case "modalFileCancel":
            case "modalEditCancel":
            case "modalRenameCancel":
            case "modalConfirmCancel":
            case "modalImageSizeCancel":
            case "modalGridCancel":
                this.setModal(null);
                if(this.confirmCallback)
                    this.confirmCallback(false);
                break;
            case "objUp":
                if(objSel.list.length > 0) {
                    editor.editMoveToTop();
                    editor.redraw();
                }
                break;
            case "objDown":
                if(objSel.list.length > 0) {
                    editor.editMoveToBottom();
                    editor.redraw();
                }
                break;
            case "objDup":
                editor.editDup();
                break;
            case "objDel":
                editor.editDel();
                editor.contextMenu(null);
                break;
            case "objGroup":
                editor.editGroup();
                editor.contextMenu(null);
                break;
            case "objUngroup":
                editor.editUngroup();
                editor.contextMenu(null);
                break;
            case "zoomIn":
                editor.setZoomAt(editor.zoomidx += 100, px, py);
                editor.redraw();
                break;
            case "zoomOut":
                editor.setZoomAt(editor.zoomidx -= 100, px, py);
                editor.redraw();
                break;
            case "zoom1":
                editor.setZoomAt(0, editor.rzoomX(editor.winw * 0.5), editor.rzoomY(editor.winh * 0.5));
                editor.redraw();
                break;
            case "toolImage":
                console.log("toolImage");
                editor.addImage();
                break;
            case "grid":
                document.getElementById("modalGridX").value = editor.gridX;
                document.getElementById("modalGridY").value = editor.gridY;
                this.setModal("modalGrid");
                break;
            }
        })
        this.menubarElm.addEventListener("change", e=>{
            if(e.target.name == "tool") {
                editor.setTools(e.target.id.substring(4));
            }
            switch(e.target.id) {
            case "gridShow":
                editor.grid.show = e.target.checked;
                editor.redraw();
                break;
            case "gridEnable":
            case "gridEnableIcon":
                editor.grid.enable = e.target.checked;
                break;
            }
        })
        this.menuElm.addEventListener("click", e=>{
            switch(e.target.className) {
            case "dmenutopitem":
                e.target.children[0].classList.toggle("visible");
                break;
            case "dmenuitem":
                e.target.parentNode.classList.remove("visible");
                switch(e.target.id) {
                case "menu-Tools-Select":
                    editor.setTools("Select");
                    e.target.children[0].checked = true;
                    break;
                case "menu-Tools-Rect":
                    editor.setTools("Rect");
                    e.target.children[0].checked = true;
                    break;
                case "menu-Tools-Circle":
                    editor.setTools("Circle");
                    e.target.children[0].checked = true;
                    break;
                case "menu-View-Grid":
                }
                break;
            }
        })
    }
    setModal(name) {
//        console.log("setModal",name)
        if(!name)
            document.getElementById("modal").style.display = "none";
        else {
            document.getElementById("modalFile").style.display = (name=="modalFile")?"block":"none";
            document.getElementById("modalEdit").style.display = (name=="modalEdit")?"block":"none";
            document.getElementById("modalImageSize").style.display = (name=="modalImageSize")?"block":"none";
            document.getElementById("modalGrid").style.display = (name=="modalGrid")?"block":"none";
            document.getElementById("modalConfirm").style.display = (name=="modalConfirm")?"block":"none";
            document.getElementById("modalRename").style.display = (name=="modalRename")?"block":"none";
            document.getElementById("modal").style.display = "block";
        }
    }
    confirm(txt, callback) {
//        console.log(editor.menu)
        const btn = document.getElementById("modalConfirmOK");
        document.getElementById("modalConfirmText").innerText = txt;
        this.setModal("modalConfirm");
        this.confirmCallback = callback;
    }
}
function sp2px(pt, obj) {
    if(obj == editor.newObj)
        return pt;
    return {x:(pt.x - obj.shapeOrgX) * obj.w / obj.shapeOrgW + obj.x, y:(pt.y - obj.shapeOrgY) * obj.h / obj.shapeOrgH + obj.y};
}
function px2sp(pt, obj) {
    return {x:(pt.x - obj.x) * obj.shapeOrgW / obj.w + obj.shapeOrgX, y:(pt.y - obj.y) * obj.shapeOrgH / obj.h + obj.shapeOrgY};
}
function eqPt(pt1, pt2) {
    if(pt1.x == pt2.x && pt1.y == pt2.y)
        return true;
    return false;
}
function addPt(pt1, pt2) {
    return {x:pt1.x + pt2.x, y:pt1.y + pt2.y};
}
function subPt(pt1, pt2) {
    return {x:pt1.x - pt2.x, y:pt1.y - pt2.y};
}
function isInRange(x, r1, r2) {
    if(x >= r1 && x < r2)
        return true;
    if(x >= r2 && x < r1)
        return true;
    return false;
}
function isInObj(pt, obj) {
    if(obj && isInRange(pt.x, obj.x, obj.x + obj.w) && isInRange(pt.y, obj.y, obj.y + obj.h)) {
        return true;
    }
    return false;
}
function isHit(pt1, pt2) {
    if(Math.abs(pt1.x - pt2.x) * editor.zoom <= 6 && Math.abs(pt1.y - pt2.y) * editor.zoom <= 6)
        return true;
    return false;
}
function rgbToHex(rgb){
    function hex(x) {
        return ("00"+(x.toString(16))).slice(-2);
    }
    const h = rgb.replace("rgb(","").replace(")","").split(",");
    return "#"+hex(h[0]|0)+hex(h[1]|0)+hex(h[2]|0);
}
function hexToRGBA(x, alpha) {
    x = x.replace("#","");
    if(x.length == 3)
        x = x[0]+x[0]+x[1]+x[1]+x[2]+x[2];
    const r = parseInt(x.substring(0,2), 16);
    const g = parseInt(x.substring(2,4), 16);
    const b = parseInt(x.substring(4,6), 16);
    return `rgba(${r},${g},${b},${alpha*0.01})`
}
function createPal() {
    const p = document.getElementsByClassName("proppal");
    const pal = [];
    for(let col of p)
        pal.push(rgbToHex(col.style.background));
    return pal;
}
function embossEdge(ctxs, ctxd, obj) {
//    console.log(obj.x, obj.y);
    ctxd.clearRect(0, 0, editor.docw, editor.doch);
    const imgDats = ctxs.getImageData(0, 0, editor.docw, editor.doch);
    const imgDatd = ctxd.getImageData(0, 0, editor.docw, editor.doch);
    const destw = imgDats.width
    const desth = imgDats.height;
    const dats = imgDats.data;
    const datd = imgDatd.data;
    const ew = obj.embossWidth | 0;
    for(let y = 0; y < desth; ++y) {
        for(let x = 0; x < destw; ++x) {
            const p = (y * destw + x) * 4;
            if(dats[p + 3] > 0) {
                if(dats[(y * destw + x - ew) * 4 + 3] == 0 || dats[((y - ew) * destw + x) * 4 + 3] == 0)
                    datd[p + 3] = 255, datd[p] = datd[p + 1] = datd[p + 2] = 255;
                if(dats[((y + ew) * destw + x) * 4 + 3] == 0 || dats[(y * destw + (x + ew)) * 4 + 3] == 0) {
                    if(datd[p] == 255) {
                        let d;
                        for(d = 1; d < ew; ++d) {
                            const d1 = dats[((y - d) * destw + x) * 4 + 3];
                            const d2 = dats[(y * destw + (x + d)) * 4 + 3];
                            if(d1 > d2) {
                                datd[p] = datd[p + 1] = datd[p + 2] = 0;
                                break;
                            }
                            if(d1 < d2) {
                                datd[p] = datd[p + 1] = datd[p + 2] = 255;
                                break;
                            }
                        }
                        if(d == ew)
                            datd[p] = datd[p + 1] = datd[p + 2] = 128;
                    }
                    else
                        datd[p + 3] = 255;
                }
            }
        }
    }
    ctxd.putImageData(imgDatd, 0, 0);
}
class Editor {
    constructor() {
        this.menu = new Menu("dmenu");
        this.canvasWork1 = document.getElementById("canvasWork1");
        this.canvasWork2 = document.getElementById("canvasWork2");
        this.canvasWork3 = document.getElementById("canvasWork3");
        this.canvasWork4 = document.getElementById("canvasWork4");
        this.canvasWork5 = document.getElementById("canvasWork5");
        this.objView = new ObjView(document.getElementById("objview"));
        this.propView = new PropView(document.getElementById("propview"));
        this.statusbarElm = document.getElementById("statusbar");
        this.propView.sel(objRoot.getObj(0));
        this.contextMenuElm = document.getElementById("contextmenu");
        this.canvas1Elm = document.getElementById("canvas1");   // UI screen
        this.canvas2Elm = document.getElementById("canvas2");   // Grid screen
        this.canvas3Elm = document.getElementById("canvas3");   // Image bitmap
        this.canvas4Elm = document.getElementById("canvas4");   // Work bitmap
        this.canvas5Elm = document.getElementById("canvas5");   // Work bitmap
        this.canvas6Elm = document.getElementById("canvas6");
        this.canvasPat = new OffscreenCanvas(256, 256);
        this.ctx1 = this.canvas1Elm.getContext("2d", {alpha:false});
        this.ctx2 = this.canvas2Elm.getContext("2d");
        this.ctx3 = this.canvas3Elm.getContext("2d");
        this.ctx4 = this.canvas4Elm.getContext("2d");
        this.ctx5 = this.canvas5Elm.getContext("2d");
        this.ctx6 = this.canvas6Elm.getContext("2d");
        this.ctxPat = this.canvasPat.getContext("2d");
        this.ctx1.imageSmoothingEnabled = false;
        this.ctx2.imageSmoothingEnabled = false;
        this.ctx3.imageSmoothingEnabled = false;
        this.ctx4.imageSmoothingEnabled = false;
        this.ctx5.imageSmoothingEnabled = false;
        this.ctx6.imageSmoothingEnabled = false;
        this.ctxPat.imageSmoothingEnabled = false;
        this.docw = 1024;
        this.doch = 768;
        this.winw = 1024;
        this.winh = 768;
        this.resize();
        this.zoomidx = 0;
        this.zoom = 1;
        this.offX = 250;
        this.offY = 70;
        this.gridX = 8;
        this.gridY = 8;
        this.curObj = null;
        this.tools = "Select";
        this.drag = 0;
        this.downX = 0;
        this.downY = 0;
        this.curPt = {x:0, y:0};
        this.curPtGrid = {x:0, y:0};
        this.hitDrag = {t:null};
        this.shapeEdit = false;
        this.gradEdit = false;
        this.shapeVtx = -1;
        this.canvasRc = this.canvas1Elm.getBoundingClientRect();
        this.newObj = null;
        this.contextMenuElm.addEventListener("click", e=>{
            let n, pt, p0, p1, p2;
            switch(e.target.id) {
            case "ctxShapeVtxDel":
//                console.log("vtx del", this.shapeVtx);
                n = this.shapeVtx - (this.shapeVtx % 3);
                this.curObj.shape.splice(n, 3);
                if(this.shapeVtx >= this.curObj.shape.length)
                    this.shapeVtx -= 3;
                this.contextMenu(null);
                this.redraw();
                break;
            case "ctxShapeVtxAdd":
//                console.log("vtx add", this.shapeVtx);
                n = this.shapeVtx - (this.shapeVtx % 3) + 1;
                p0 = this.curObj.shape[n];
                p1 = this.curObj.shape[n + 3];
                if(n + 3 >= this.curObj.shape.length)
                    p1 = this.curObj.shape[1];
                pt = {x: (p0.x + p1.x) * 0.5, y:(p0.y + p1.y) * 0.5};
                this.curObj.shape.splice(n + 2, 0, pt, pt, pt);
                this.contextMenu(null);
                this.redraw();
                break;
            case "ctxShapeVtxSmooth":
                n = this.shapeVtx - (this.shapeVtx % 3);
                p0 = this.curObj.shape[n];
                p1 = this.curObj.shape[n + 1];
                p2 = this.curObj.shape[n + 2];
                if(eqPt(p0, p1) && eqPt(p0, p2)) {
                    this.curObj.shape[n] = {x:p1.x + 16, y:p1.y};
                    this.curObj.shape[n + 2] = {x:p1.x - 16, y:p1.y};
                }
                this.contextMenu(null);
                this.redraw();
                break;
            }
        })
        this.canvas2Elm.addEventListener("contextmenu", e=>{
            const ht = this.hitTest(this.curPt, "c");
            console.log("contextmenu",ht);
            switch(ht.t) {
            case "s":
                this.contextMenu(this.curPtScr, [
                    {id:"ctxShapeVtxDel", txt:"Delete Point"},
                    {id:"ctxShapeVtxAdd", txt:"Add Point"},
                    {id:"ctxShapeVtxSmooth", txt:"Smooth Point"}
                ]);
                break;
            case "p":
                this.contextMenu(this.curPtScr, [
                    {id:"objDel", txt:"Delete"},
                    {id:"objGroup", txt:"Group"},
                    {id:"objUngroup", txt:"Ungroup"}
                ]);
                break;
            }
            e.preventDefault();
        })
        this.canvas2Elm.addEventListener("pointerdown", e=>{
            this.pmove = false;
            this.getPt(e);
            this.hitDrag = this.hitTest(this.curPt, "d");
            this.contextMenu(null);
            this.downPt = this.curPt;
            if(e.buttons == 2)
                return;
            switch(this.tools) {
            case "Hand":
                this.hitDrag = {t:"h", x:this.curPt.x, y:this.curPt.y, ox:this.offX, oy:this.offY};
                break;
            case "Select":
                switch(this.hitDrag.t) {
                case "n":
                    this.hitDrag = {t:"n", pt:this.curPt};
                    break;
                case "g":
                    this.hitDrag = {t:"g", v:this.hitDrag.v, o:this.curObj, pt:this.curPtGrid};
                    break;
                case "p":
                    this.hitDrag = {t:"p", pt:this.curPtGrid};
                    break;
                case "s":
                    this.shapeVtx = this.hitDrag.v;
                    this.redraw();
                    break;
                case "v":
                    objSel.vupdate();
                    switch(this.hitDrag.v) {
                    case 1:
                        this.hitDrag = {t:"v", v:1, pt1:{x:this.curPtGrid.x, y:this.curPtGrid.y}, pt2:{x:objSel.pt2.x, y:objSel.pt2.y}};
                        e.target.setPointerCapture(e.pointerId);
                        return;
                    case 2:
                        this.hitDrag = {t:"v", v:2, pt1:{x:objSel.pt1.x, y:this.curPtGrid.y}, pt2:{x:this.curPtGrid.x, y:objSel.pt2.y}};
                        e.target.setPointerCapture(e.pointerId);
                        return;
                    case 3:
                        this.hitDrag = {t:"v", v:3, pt1:{x:objSel.pt1.x, y:objSel.pt1.y}, pt2:{x:this.curPtGrid.x, y:this.curPtGrid.y}};
                        e.target.setPointerCapture(e.pointerId);
                        return;
                    case 4:
                        this.hitDrag = {t:"v", v:4, pt1:{x:this.curPtGrid.x, y:objSel.pt1.y}, pt2:{x:objSel.pt2.x, y:this.curPtGrid.y}};
                        e.target.setPointerCapture(e.pointerId);
                        return;
                    }
                    break;
                }
                break;
            case "Rect":
                this.curObj = this.newObj = new Obj("Rect", objRoot, this.curPtGrid.x, this.curPtGrid.y, 0, 0);
                this.propView.sel(this.newObj);
                this.hitDrag = {t:"o", pt:this.curPtGrid};
                this.redraw();
                break;
            case "Circle":
                this.curObj = this.newObj = new Obj("Circle", objRoot, this.curPtGrid.x, this.curPtGrid.y, 0, 0);
                this.propView.sel(this.newObj);
                this.hitDrag = {t:"o", pt:this.curPtGrid};
                this.redraw();
                break;
            case "Text":
                this.curObj = this.newObj = new Obj("Text", objRoot, this.curPtGrid.x, this.curPtGrid.y, 0, 0);
                this.propView.sel(this.newObj);
                this.hitDrag = {t:"o", pt:this.curPtGrid};
                this.redraw();
                break;
            case "Polygon":
                this.curObj = this.newObj = new Obj("Polygon", objRoot, this.curPtGrid.x, this.curPtGrid.y, 0, 0);
                this.propView.sel(this.newObj);
                this.hitDrag = {t:"o", pt:this.curPtGrid};
                this.redraw();
                break;
            case "Shape":
                this.hitDrag = {t:"o", pt:this.curPtGrid};
                this.drag = {t:"s1"};
                if(this.newObj == null) {
                    this.curObj = this.newObj = new Obj("Shape", objRoot, this.curPtGrid.x, this.curPtGrid.y, 0, 0);
                    this.newObj.x = this.newObj.shapeOrgX = this.curPtGrid.x;
                    this.newObj.y = this.newObj.shapeOrgY = this.curPtGrid.y;
                    this.newObj.w = this.newObj.h = this.newObj.shapeOrgW = this.newObj.shapeOrgH = 0;

                    this.newObj.shape.push(this.curPtGrid);
                    this.newObj.shape.push(this.curPtGrid);
                    this.newObj.shape.push(this.curPtGrid);
                    this.shapeVtx = 2;
                }
                else {
                    if(this.newObj.shape.length > 0 && isHit(this.curPt, this.newObj)) {
                        const rc = this.getShapeBoundingBox(this.newObj);
                        this.newObj.x = this.newObj.shapeOrgX = rc.x1;
                        this.newObj.y = this.newObj.shapeOrgY = rc.y1;
                        this.newObj.w = this.newObj.shapeOrgW = rc.x2 - rc.x1;
                        this.newObj.h = this.newObj.shapeOrgH = rc.y2 - rc.y1;

                        this.drag = null;
                    }
                    else {
                        this.newObj.shape.push(this.curPtGrid);
                        this.newObj.shape.push(this.curPtGrid);
                        this.newObj.shape.push(this.curPtGrid);
                        this.shapeVtx = this.newObj.shape.length -1;
                    }
                }
                this.propView.sel(this.newObj);
                this.redraw();
                break;
            case "Image":
//                this.addImage();
                break;
            }
            e.target.setPointerCapture(e.pointerId);
        })
        this.canvas2Elm.addEventListener("pointerup", e=>{
            if(e.button == 2)
                return;
            this.getPt(e);
            const ht = this.hitTest(this.curPt, "u");
            if(this.newObj) {
                if(this.newObj.type == "Shape" && this.drag) {
                    this.drag = null;
                    return;
                }
                if(this.newObj.w !=0 || this.newObj.h != 0) {
                    objRoot.add(this.curObj = this.newObj);
                    objSel.clear();
                    objSel.add(this.curObj);
                }
                this.newObj = null;
                this.setTools("Select");
            }
            else if(this.tools == "Select") {
                if(ht.t == "q" && !this.pmove){
                    if(e.ctrlKey)
                        objSel.toggle(ht.o);
                    else {
                        objSel.sel(ht.o);
                    }
                    this.hitDrag = {t:null};
                    this.propView.sel(this.curObj);
                    this.redraw();
                    return;
                }
                switch(this.hitDrag.t) {
                case "n":
                    objSel.areaSel(this.hitDrag.pt, this.curPt);
                    break;
                case "s":
                    this.hitDrag = {t:null};
                    return;
                }
            }
            this.drag = null;
            this.hitDrag = {t:null};
            this.shapeEdit = false;
            this.redraw();
        })
        this.canvas2Elm.addEventListener("pointermove", e=>{
//            console.log(this.hitDrag)
            this.pmove = true;
            this.getPt(e);
            this.statusbarElm.innerText=`X:${this.curPtGrid.x} Y:${this.curPtGrid.y}`;
            const ht = this.hitTest(this.curPt, "m");
            if(!this.hitDrag.t) {
                switch(ht.t) {
                case "v":
                    switch(ht.v) {
                    case 1: case 3:
                        this.setCursor("nwse-resize");
                        break;
                    case 2: case 4:
                        this.setCursor("nesw-resize");
                        break;
                    }
                    break;
                case "s":
                case "g":
                case "p":
                    this.setCursor("move");
                    break;
                default:
                    this.setCursor("default");
                    break;
                }
            }
            if(this.newObj) {
                const s = this.newObj.shape;
                if(this.newObj.type == "Shape") {
                    if(this.drag) {
                        const len = s.length;
                        s[len - 1] = this.curPtGrid;
                        s[len - 3] = {x:s[len - 2].x * 2 - this.curPtGrid.x, y:s[len -2].y * 2 - this.curPtGrid.y};
                    }
                }
                else {
                    this.newObj.w = this.curPtGrid.x - this.newObj.x;
                    this.newObj.h = this.curPtGrid.y - this.newObj.y;
                }
                this.propView.sel(this.newObj);
                this.redraw();
            }
            if(this.hitDrag) {
                switch(this.hitDrag.t) {
                case "s":
                    const n = this.hitDrag.v;
                    const s = this.curObj.shape;
                    let p0, p1;
                    const nn = n - (n % 3);
                    if(n != undefined && eqPt(s[nn], s[nn + 1]) && eqPt(s[nn], s[nn + 2])) {
                        s[n + 1] = s[n + 2] = s[n] = px2sp(this.curPtGrid, this.curObj);
                        this.redraw();
                        return;
                    }
                    switch(n % 3) {
                    case 1:
                        const d = subPt(px2sp(this.curPtGrid, this.curObj), s[n]);
                        s[n + 1] = addPt(s[n + 1], d);
                        s[n - 1] = addPt(s[n - 1], d);
                        s[n] = px2sp(this.curPtGrid, this.curObj);
                        break;
                    case 0:
                        p0 = px2sp(this.curPtGrid, this.curObj);
                        p1 = s[n + 1];
                        s[n + 2] = {x:p1.x * 2 - p0.x, y:p1.y * 2 - p0.y};
                        s[n] = px2sp(this.curPtGrid, this.curObj);
                        break;
                    case 2:
                        p0 = px2sp(this.curPtGrid, this.curObj);
                        p1 = s[n - 1];
                        s[n - 2] = {x:p1.x * 2 - p0.x, y:p1.y * 2 - p0.y};
                        s[n] = px2sp(this.curPtGrid, this.curObj);
                        break;
                    }
                    this.adjustShapeBox(this.curObj);
                    this.redraw();
                    return;
                case "g":
                    const o = this.curObj;
                    if(o.w == 0)
                        o.colGradX1 = o.colGradX2 = 0;
                    else {
                        if(this.hitDrag.v == 1)
                            o.colGradX1 = (this.curPtGrid.x - o.x) / o.w;
                        else
                            o.colGradX2 = (this.curPtGrid.x - o.x) / o.w;
                    }
                    if(o.h == 0)
                        o.colGradY1 = o.colGradY2 = 0;
                    else {
                        if(this.hitDrag.v == 1)
                            o.colGradY1 = (this.curPtGrid.y - o.y) / o.h;
                        else
                            o.colGradY2 = (this.curPtGrid.y - o.y) / o.h;
                    }
                    this.redraw();
                    return;
                case "v":
                    switch(this.hitDrag.v) {
                    case 1:
                        objSel.vmove(this.curPtGrid, this.hitDrag.pt2, this.hitDrag.pt1, this.hitDrag.pt2);
                        break;
                    case 2:
                        objSel.vmove({x:this.hitDrag.pt1.x, y:this.curPtGrid.y}, {x:this.curPtGrid.x, y:this.hitDrag.pt2.y}, this.hitDrag.pt1, this.hitDrag.pt2);
                        break;
                    case 3:
                        objSel.vmove(this.hitDrag.pt1, this.curPtGrid, this.hitDrag.pt1, this.hitDrag.pt2);
                        break;
                    case 4:
                        objSel.vmove({x:this.curPtGrid.x, y:this.hitDrag.pt1.y}, {x:this.hitDrag.pt2.x, y:this.curPtGrid.y}, this.hitDrag.pt1, this.hitDrag.pt2);
                        break;
                    }
                    this.redraw();
                    return;
                case "p":
                    if(this.hitDrag.pt) {
                        const dPt = subPt(this.curPtGrid, this.hitDrag.pt);
                        this.hitDrag.pt = addPt(this.hitDrag.pt, dPt);
                        objSel.moveSel(dPt.x, dPt.y);
                        this.propView.sel(this.curObj);
                        this.redraw();
                    }
                    return;
                case "h":
                    const dx = this.curPt.x - this.hitDrag.x;
                    const dy = this.curPt.y - this.hitDrag.y;
                    this.offX += dx * this.zoom;
                    this.offY += dy * this.zoom;
                    this.redraw();
                    return;
                case "n":
                    this.redraw();
                    return;
                }
            }
        })
        this.canvas2Elm.addEventListener("wheel", e=>{
            if(e.ctrlKey) {
                const r = this.canvas1Elm.getBoundingClientRect();
                const x = this.rzoomX(e.x - r.left);
                const y = this.rzoomY(e.y - r.top);
                this.setZoomAt(this.zoomidx -= e.deltaY, x, y);
                e.stopPropagation();
                e.preventDefault();
            }
            else if(e.shiftKey) {
                this.offX -= e.deltaY*.5;
                this.redraw();
            }
            else {
                this.offY -= e.deltaY*.5;
                this.redraw();
            }
            this.redraw();
        })
        document.addEventListener("keydown", e=>{
            if(e.repeat == false) {
                if(e.code == "Escape")
                    editor.menu.setModal(null);
                if(e.target.tagName == "BODY") {
                        switch(e.code) {
                    case "Space":
                        this.setTools("Hand");
                        break;
                    case "Delete":
                        editor.editDel();
                        break;
                    case "F2":
                        editor.editRename();
                        break;
                    case "F9":
                        if(document.getElementById("canvas4").style.display == "block")
                            document.getElementById("canvas4").style.display = "none";
                        else
                            document.getElementById("canvas4").style.display = "block";
                        break;
                    }
                    if(e.target.tagName == "BODY" && e.ctrlKey) {
                        switch(e.code) {
                        case "KeyC":
                            editor.editCopy();
                            break;
                        case "KeyV":
                            editor.editPaste();
                            break;
                        }
                    }
                }
            }
        })
        document.addEventListener("keyup", e=>{
//            console.log("keyup:"+e.code);
            if(e.target.tagName == "BODY") {
                switch(e.code) {
                case "Space":
                    this.setTools("Restore");
                    break;
                }
            }
        })
        loadPattern(this.ctx3);
        this.grid = {show:true, enable:true};
        this.ready = true;
        this.redraw();
    }
    moveObj() {

    }
    editDup() {
//        console.log("editDup");
        objClipboard = [];
        for(let i = 0; i < objSel.list.length; ++i) {
            const o = objSel.list[i];
            objClipboard.push(this.cloneObj(o));
        }
        objSel.clear();
        for(let i = objClipboard.length -1; i >= 0; --i) {
            const o = this.cloneObj(objClipboard[i]);
            o.id = crypto.randomUUID();
            objSel.add(o);
            objRoot.add(o);
        }
        this.redraw();
    }
    editRename() {
//        console.log("editRename");
        document.getElementById("modalRenameInput").value = (editor.curObj.name != null)?editor.curObj.name:editor.curObj.type;
        this.menu.setModal("modalRename");
    }
    cloneObj(obj) {
        if(obj.type == "Image") {
            const o = JSON.parse(JSON.stringify(obj));
            this.prepareImage(o);
            return o;
        }
        else
            return structuredClone(obj);
    }
    editCopy() {
        console.log("editCopy");
        objClipboard = [];
        for(let i = 0; i < objSel.list.length; ++i) {
            const o = objSel.list[i];
            objClipboard.push(this.cloneObj(o));
        }
    }
    editPaste() {
//        console.log("editPaste");
        objSel.clear();
        for(let i = objClipboard.length -1; i >= 0; --i) {
            const o = this.cloneObj(objClipboard[i]);
            o.id = crypto.randomUUID();
            objSel.add(o);
            objRoot.add(o);
        }
        this.redraw();
    }
    editDel() {
//        console.log("editDel");
        this.menu.confirm("Delete", (r)=>{
            if(r) {
                for(let i = 0; i < objSel.list.length; ++i) {
                    const o = objSel.list[i];
                    objRoot.del(o);
                }
                this.menu.setModal(null);
                objSel.clear();
                this.redraw();
            }
        })
    }
    editMoveToTop() {
        const s = [];
        for(let o of objRoot.entries(1, 1, 0)) {
            if(objSel.isSel(o)){
                const e = objRoot.findEntry(o);
                e.l.splice(e.c, 1);
                s.push(o);
            }
        }
        for(let i = 0; i < s.length; ++i) {
            objRoot.add(s[i]);
        }
    }
    editMoveToBottom() {
        const s = [];
        for(let o of objRoot.entries(1, 1, 0)) {
            if(objSel.isSel(o)){
                const e = objRoot.findEntry(o);
                e.l.splice(e.c, 1);
                s.unshift(o);
            }
        }
        for(let i = 0; i < s.length; ++i) {
            objRoot.append(s[i]);
        }
    }
    editGroup() {
        objSel.makeGroup();
    }
    editUngroup() {
        objSel.delGroup();
    }
    hitTest(pt, mode) {
        const o = editor.curObj;
        if(this.shapeEdit && o.type == "Shape" && objSel.list.length == 1) {
            const n = this.shapeVtx - (this.shapeVtx % 3);
            for(let i = 0; i < o.shape.length; i += 3) {
                if(i == n) {
                    if(isHit(pt, sp2px(o.shape[i], o)))
                        return {t:"s", v:i};
                    if(isHit(pt, sp2px(o.shape[i + 2], o)))
                        return {t:"s", v:i + 2};
                }
                if(isHit(pt, sp2px(o.shape[i + 1], o)))
                    return {t:"s", v:i + 1};
            }
            return {t:null, v:null};
        }
        if(this.gradEdit && objSel.list.length == 1) {
            const p1 = {x:o.x + o.w * o.colGradX1, y:o.y + o.h * o.colGradY1};
            const p2 = {x:o.x + o.w * o.colGradX2, y:o.y + o.h * o.colGradY2};
            if(isHit(pt, p1))
                return {t:"g", v:1};
            if(isHit(pt,p2))
                return {t:"g", v:2};
            return {t:"n", v:null, pt:pt};
        }
        if(mode == "u") {
            let o = editor.curObj;
            for(let i = objRoot.len(); i; --i) {
                if(!(o = objRoot.findNext(o)))
                    o = objRoot.findFirst();
                if(o && o.visible && isInObj(pt, o)) {
                    return {t:"q", o:o};
                }
            }
        }
        const os = objSel;
        if(os.len() > 0) {
            if(isHit(pt, os.pt1))
                return {t:"v", v:1};
            if(isHit(pt, {x:os.pt2.x, y:os.pt1.y}))
                return {t:"v", v:2};
            if(isHit(pt, os.pt2))
                return {t:"v", v:3};
            if(isHit(pt, {x:os.pt1.x, y:os.pt2.y}))
                return {t:"v", v:4};
            if(pt.x >= os.pt1.x && pt.x <= os.pt2.x && pt.y >= os.pt1.y && pt.y <= os.pt2.y)
                return {t:"p", v:null};
        }
        return {t:"n", v:null};
    }
    prepareImage(obj) {
        obj._img = new Image();
        obj._img.onload = e=>{
            obj.w = obj._img.width;
            obj.h = obj._img.height;
            const f = obj.h / obj.w;
            if(obj.h >= obj.w * 10 && Number.isInteger(f)) {
                obj.h = obj.h / f;
                obj.imageFrames = f;
            }
            obj.x -= obj.w*0.5;
            obj.y -= obj.h*0.5;
            editor.redraw();
        }
    obj._img.src = obj.img;
    }
    addImage() {
        console.log("addImage");
        const elm = document.createElement("input");
        elm.type = "file";
        elm.addEventListener("change", e=>{
            const reader = new FileReader();
            reader.readAsDataURL(e.target.files[0]);
            reader.onload = ()=> {
//                const o = new Obj("Image", objRoot, this.curPtGrid.x, this.curPtGrid.y, 0, 0);
                const o = new Obj("Image", objRoot, this.docw*0.5, this.doch*0.5, 0, 0);
                o.img = reader.result;
                this.prepareImage(o);
                objRoot.add(o);
                this.propView.sel(this.newObj);
                this.redraw();
            }
        });
        elm.click();
        this.setTools("Select");
    }
    setCursor(c) {
        this.canvas2Elm.style.cursor = c;
    }
    makePath(ctx, obj, cx, cy) {
        let x, y, bx, by, px, py, qx, qy, rx, ry, dx, dy, th, dth, wth, vth;
        let rotP, rotM, rotP2, rotM2, mpt, ppt, mpt2, ppt2, dth2;
        ctx.beginPath();
        switch(obj.type) {
        case "Rect":
            if(obj.rxSep) {
                ctx.roundRect(obj.x, obj.y, obj.w, obj.h, [obj.rx1, obj.rx2, obj.rx3, obj.rx4]);
            }
            else {
                ctx.roundRect(obj.x, obj.y, obj.w, obj.h, obj.rx1);
            }
            break;
        case "Circle":
            rx = obj.w * 0.5;
            ry = obj.h * 0.5;
            ctx.ellipse(obj.x + rx, obj.y + ry, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2);
            break;
        case "Text":
            break;
        case "Polygon":
            rx = obj.w * 0.5;
            ry = obj.h * 0.5;
            cx = obj.x + rx;
            cy = obj.y + ry;
            th = 0;
            dx = 0;
            dy = 1;
            dth = (Math.PI * 2) / obj.polyVertex;
            wth = dth * obj.polyTopWidth * 0.01;
            rotP = new Rot(wth);
            rotM = new Rot(-wth);
            vth = dth * obj.polyBottomWidth * 0.01;
            rotP2 = new Rot(vth);
            rotM2 = new Rot(-vth);
            dth2 = Math.PI / obj.polyVertex;
            const p1 = rotM.rotate(0, 1);
            ctx.moveTo(cx + p1.x * rx, cy - p1.y * ry);
            for(let i = 0; i < obj.polyVertex; ++i) {
                th += dth;
                x = Math.sin(th);
                y = Math.cos(th);
                bx = (x + dx) * obj.polyDepth * 0.005;
                by = (y + dy) * obj.polyDepth * 0.005;
                ppt2 = rotP2.rotate(bx, by);
                mpt2 = rotM2.rotate(bx, by);
                ctx.lineTo(cx + ppt2.x * rx, cy - ppt2.y * ry);
                ctx.lineTo(cx + mpt2.x * rx, cy - mpt2.y * ry);
                ppt = rotP.rotate(x, y);
                mpt = rotM.rotate(x, y);
                ctx.lineTo(cx + ppt.x * rx, cy - ppt.y * ry);
                ctx.lineTo(cx + mpt.x * rx, cy - mpt.y * ry);
                dx = x;
                dy = y;
            }
            ctx.closePath();
            break;
        case "Shape":
            const p = sp2px(obj.shape[1], obj);
            ctx.moveTo(p.x, p.y);
            for(let i = 3; i < obj.shape.length; i += 3) {
                const p0 = sp2px(obj.shape[i], obj);
                const p1 = sp2px(obj.shape[i + 1], obj);
                const pp1 = sp2px(obj.shape[i - 1], obj);
                ctx.bezierCurveTo(pp1.x, pp1.y, p0.x, p0.y, p1.x, p1.y);
            }
            if(obj.shapeClose) {
                const l = obj.shape.length;
                const pp1 = sp2px(obj.shape[l - 1], obj);
                const p0 = sp2px(obj.shape[0], obj);
                const p1 = sp2px(obj.shape[1], obj);
                ctx.bezierCurveTo(pp1.x, pp1.y, p0.x, p0.y, p1.x, p1.y);
            }
            break;
        case "Image":
            break;
        }
    }
    drawPlainObj(ctx, obj, fill, stroke) {
        const cx = obj.x + obj.w * 0.5;
        const cy = obj.y + obj.h * 0.5;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(obj.rotate * Math.PI / 180);
        ctx.translate(-cx, -cy);

        if(obj.type == "Text") {
            ctx.font = `${obj.textBold?"bold ":""}${obj.textItalic?"italic ":""}${Math.abs(obj.h)}px ${obj.font}`;
            if(obj.textFit) {
                const met = ctx.measureText(obj.text);
                const tw = met.width;
                if(tw) {
                    const fitRatioX = obj.w / tw;
                    const fitRatioY = (obj.h >= 0) ? 1 : -1;
                    if(fitRatioX) {
                        ctx.textAlign = "left";
                        ctx.scale(fitRatioX, fitRatioY);
                        if(fill)
                            ctx.fillText(obj.text, obj.x / fitRatioX, (obj.y + obj.h) * fitRatioY);
                        if(stroke)
                            ctx.strokeText(obj.text, obj.x / fitRatioX, (obj.y + obj.h) * fitRatioY);
                        ctx.scale(1 / fitRatioX, fitRatioY);
                    }
                }
            }            
            else {
                ctx.textAlign = obj.textAlign;
                const tx1 = Math.min(obj.x, obj.x + obj.w);
                const tx2 = Math.max(obj.x, obj.x + obj.w);
                const ty = Math.max(obj.y, obj.y + obj.h);
                switch(obj.textAlign) {
                case "left":
                    if(fill)
                        ctx.fillText(obj.text, tx1, ty);
                    if(stroke)
                        ctx.strokeText(obj.text, tx1, ty);
                    break;
                case "center":
                    if(fill)
                        ctx.fillText(obj.text, (tx1 + tx2)  * 0.5, ty);
                    if(stroke)
                        ctx.strokeText(obj.text, (tx1 + tx2) * 0.5, ty);
                    break;
                case "right":
                    if(fill)
                        ctx.fillText(obj.text, tx2, ty);
                    if(stroke)
                        ctx.strokeText(obj.text, tx2, ty);
                    break;
                }
            }
        }
        else if(obj.type == "Image") {
            let sx = 0, sy = 0, sw = obj._img.width, sh = obj._img.height;
            let dx = Math.min(obj.x, obj.x + obj.w), dy = Math.min(obj.y, obj.y + obj.h);
            let dw = Math.abs(obj.w), dh = Math.abs(obj.h);
            let scx = 1, scy = 1;
            sh = sh / obj.imageFrames;
            ctx.save();
            if(obj.h < 0) {
                scy = -1;
                dy = -dy - dh;
            }
            if(obj.w < 0) {
                scx = -1;
                dx = -dx - dw;
            }
            ctx.scale(scx, scy);
            ctx.drawImage(obj._img, sx, sy, sw, sh, dx, dy, dw, dh);
            ctx.restore();
        }
        else {
            this.makePath(ctx, obj, cx, cy);
            if(fill)
                ctx.fill();
            if(stroke) {
                ctx.stroke();
            }
        }
        ctx.restore();

    }
    convolution(canvasIn, canvasOut, x1, y1, x2, y2, r) {
        const sw = canvasIn.width;
        const sh = canvasIn.height;
        const ctxIn = canvasIn.getContext("2d");
        const ctxOut = canvasOut.getContext("2d");
        const dataIn = ctxIn.getImageData(0, 0, sw, sh);
        const dataOut = ctxOut.getImageData(0, 0, sw, sh);
        let d2;
        for(let y = y1; y < y2 - 1; ++y) {
            for(let x = x1; x < x2 - 1; ++x) {
                const sp = (y * sw + x) * 4;
                let d3 = 128;
                let dx, dy, n=0;
                if(dataIn.data[sp]) {
                    d2 = 0;
                    for(dy = -r; dy <= r; ++dy) {
                        const sp2 = sp + (dy * sw * 4);
                        for(dx = -r, n=0; dx <= r; ++dx, ++n) {
                            if(dataIn.data[sp2 + (dx * 4)] == 0) {
                                if(dx < -dy)
                                    d2 += 1;
                                else if(dx > -dy)
                                    d2 -= 1;
                            }
                        }
                    }
                    if(d2 > 0)
                        d3 = 255;
                    else if(d2 < 0)
                        d3 = 0;
                    else
                        d3 = 128;
                    dataOut.data[sp] = dataOut.data[sp+1] = dataOut.data[sp+2] = d3;
                    dataOut.data[sp+3] = 255;
                }
            }
        }
        ctxOut.putImageData(dataOut, 0, 0);
    }
    drawObj(ctx, obj) {
        let fitRatioX,fitRatioY;
        let tx1, tx2, ty, tw;
        let px0, py0, px1, py1, px2, py2;
        let g, r;
        if(!ctx)
            return;
        if(!obj)
            return;
        if(obj == null)
            return;
        ctx.save();
        if(obj.fill) {
            switch(obj.type) {
            case "Rect":
            case "Circle":
            case "Polygon":
            case "Shape":
            case "Text":
            case "Image":
                ctx.globalCompositeOperation = "source-over";
                switch(obj.colGradation) {
                case "none":
                    ctx.fillStyle = hexToRGBA(obj.colFill1, obj.colFill1Alpha);
                    break;
                case "linear":
                    px1 = obj.x + obj.w * obj.colGradX1;
                    py1 = obj.y + obj.h * obj.colGradY1;
                    px2 = obj.x + obj.w * obj.colGradX2;
                    py2 = obj.y + obj.h * obj.colGradY2;
                    g = ctx.createLinearGradient(px1, py1, px2, py2);
                    g.addColorStop(0, hexToRGBA(obj.colFill1, obj.colFill1Alpha));
                    g.addColorStop(1, hexToRGBA(obj.colFill2, obj.colFill2Alpha));
                    ctx.fillStyle = g;
                    break;
                case "symmetric":
                    px1 = obj.x + obj.w * obj.colGradX1;
                    py1 = obj.y + obj.h * obj.colGradY1;
                    px2 = obj.x + obj.w * obj.colGradX2;
                    py2 = obj.y + obj.h * obj.colGradY2;
                    px0 = px1 * 2 - px2;
                    py0 = py1 * 2 - py2;
                    g = ctx.createLinearGradient(px0, py0, px2, py2);
                    g.addColorStop(0, hexToRGBA(obj.colFill2, obj.colFill2Alpha));
                    g.addColorStop(0.5, hexToRGBA(obj.colFill1, obj.colFill1Alpha));
                    g.addColorStop(1, hexToRGBA(obj.colFill2, obj.colFill2Alpha));
                    ctx.fillStyle = g;
                    break;
                case "radial":
                    px1 = obj.x + obj.w * obj.colGradX1;
                    py1 = obj.y + obj.h * obj.colGradY1;
                    px2 = obj.x + obj.w * obj.colGradX2;
                    py2 = obj.y + obj.h * obj.colGradY2;
                    const x3 = px2 - px1;
                    const y3 = py2 - py1;
                    r = Math.sqrt(x3 * x3 + y3 * y3);
                    g = ctx.createRadialGradient(px1, py1, 0, px1, py1, r);
                    g.addColorStop(0, hexToRGBA(obj.colFill1, obj.colFill1Alpha));
                    g.addColorStop(1, hexToRGBA(obj.colFill2, obj.colFill2Alpha));
                    ctx.fillStyle = g;
                    break;
                }
                ctx.filter = `blur(${obj.blur}px) drop-shadow(${obj.shadowOffX}px ${obj.shadowOffY}px ${obj.shadowBlur}px ${hexToRGBA(obj.colShadow,obj.shadowDepth)})`;
                this.drawPlainObj(ctx, obj, true, false);
                break;
            }

            if(obj.textureType && obj.textureDepth > 0) {
                ctx.save();
                const pz = obj.textureZoom * 0.01;
                let rpz = 1.0;
                if(pz > 0) {
                    console.log(pz)
                    rpz = 1.0 / pz;
                    const pw = pattern[obj.textureType].img.width * pz;
                    const ph = pattern[obj.textureType].img.height * pz;
                    this.canvasPat.width = pw;
                    this.canvasPat.height = ph;
                    this.ctxPat.translate(obj.x, obj.y);
                    this.ctxPat.scale(pz, pz);
                    this.ctxPat.fillStyle = ctx.fillStyle = pattern[obj.textureType].pat;
                    this.ctxPat.fillRect(-obj.x * rpz, -obj.y * rpz, pw * rpz, ph * rpz);
                    const pp = ctx.createPattern(this.canvasPat, "repeat");          
                    ctx.fillStyle = pp;
                    ctx.filter = "none";
                    ctx.globalAlpha = obj.textureDepth / 100;
//                    ctx.globalCompositeOperation = "hard-light";
                    ctx.globalCompositeOperation = "light";
                    this.drawPlainObj(ctx, obj, true, false);
                }
                ctx.restore();
            }

            if(obj.embossWidth != 0 && obj.embossDepth != 0) {
/*
                this.ctx6.clearRect(0, 0, this.docw, this.doch);
                this.drawPlainObj(this.ctx6, obj, true, false);
                embossEdge(this.ctx6, this.ctx4, obj);
                ctx.globalAlpha = obj.embossDepth * 0.01;
                ctx.filter = `blur(${obj.embossWidth * obj.embossBlur * 0.01}px)`
                ctx.globalCompositeOperation = "hard-light";
                ctx.drawImage(this.canvas4Elm, 0, 0);
*/

                this.ctx4.save();
                this.ctx5.save();
                const bw = obj.embossWidth * obj.embossBlur * 0.01;

                this.ctx4.fillStyle = "#ffffff";
                this.ctx4.fillRect(0, 0, this.docw, this.doch);
                this.ctx4.globalCompositeOperation = "destination-out";
                this.ctx4.globalAlpha = 1;
                this.ctx4.translate(obj.embossWidth, obj.embossWidth);
                this.ctx4.filter = `blur(${bw}px)`;
                this.drawPlainObj(this.ctx4, obj, true, false);
                this.ctx4.globalCompositeOperation = "destination-in";
                this.ctx4.translate(-obj.embossWidth, -obj.embossWidth);
                this.ctx4.filter = "none";
                this.drawPlainObj(this.ctx4, obj, true, false);

                this.ctx5.fillStyle = "#000000";
                this.ctx5.fillRect(0, 0, this.docw, this.doch);
                this.ctx5.globalCompositeOperation = "destination-out";
                this.ctx5.globalAlpha = 1;
                this.ctx5.translate(-obj.embossWidth, -obj.embossWidth);
                this.ctx5.filter = `blur(${bw}px)`;
                this.drawPlainObj(this.ctx5, obj, true, false);
                this.ctx5.globalCompositeOperation = "destination-in";
                this.ctx5.translate(obj.embossWidth, obj.embossWidth);
                this.ctx5.filter = "none";
                this.drawPlainObj(this.ctx5, obj, true, false);

                this.ctx6.clearRect(0, 0, this.docw, this.doch);
                this.ctx6.globalAlpha = 0.5;
                this.ctx6.drawImage(this.canvas4Elm, 0, 0);
                this.ctx6.globalAlpha = 0.33;
                this.ctx6.drawImage(this.canvas5Elm, 0, 0);

                let a = obj.embossDepth * 0.02;
                ctx.globalCompositeOperation = "hard-light";
                if(a > 1.0) {
                    ctx.globalAlpha = 1.0;
                    a -= 1.0;
                    ctx.drawImage(this.canvas6Elm, 0, 0);
                }
                ctx.globalAlpha = a;
                ctx.drawImage(this.canvas6Elm, 0, 0);

                this.ctx4.restore();
                this.ctx5.restore();
            }
        }
        if(obj.stroke) {
            ctx.globalCompositeOperation = "source-over";
            ctx.globalAlpha = obj.colStrokeAlpha * 0.01;
            ctx.strokeStyle = obj.colStroke;
            ctx.filter = `blur(${obj.blur}px)`;
            ctx.lineWidth = obj.lineWidth;
            ctx.lineCap = obj.lineCap;
            ctx.lineJoin = obj.lineJoin;
            ctx.lineCap = obj.lineCap;
            this.drawPlainObj(ctx, obj, false, true);
        }
        ctx.restore();
    }
    contextMenu(pt, items) {
        const style = this.contextMenuElm.style;
        let s = "";
        for(let i in items)
            s += `<div id="${items[i].id}" class="contextmenuitem">${items[i].txt}</div>`;
        this.contextMenuElm.innerHTML = s;
        if(pt == null) {
            style.display = "none";
            return;
        }
        style.left = pt.x + "px";
        style.top = pt.y + "px";
        style.display = "block";
    }
    setTools(t) {
//        console.log("setTools", t)
        if(t == "Restore") {
            t = this.tools2;
        }
        this.tools2 = this.tools;
        this.tools = t;
        document.getElementById("tool"+t).checked = true;
    }
    rename(name) {
//        console.log("rename:"+name);
        editor.curObj.name = name;
    }
    setGrid(x, y) {
        editor.gridX = x;
        editor.gridY = y;
        editor.redraw();
    }
    setImageSize(w, h) {
        editor.docw = editor.canvas3Elm.width = editor.canvas4Elm.width = editor.canvas5Elm.width = editor.canvas6Elm.width = w;
        editor.doch = editor.canvas3Elm.height = editor.canvas4Elm.height = editor.canvas5Elm.height = editor.canvas6Elm.height = h;
        editor.canvas3Elm.style.width = editor.docw+"px";
        editor.canvas3Elm.style.height = editor.doch+"px";
    }
    setZoomAt(z, x, y) {
        const z1 = this.zoom;
        this.zoomidx = z;
        this.zoom = Math.pow(1.5, this.zoomidx/100);
        this.offX = this.offX  + (z1 - this.zoom) * x;
        this.offY = this.offY  + (z1 - this.zoom) * y;
    }
    gridize(pt) {
        if(editor.grid.enable) {
            return {x:(((pt.x + this.gridX * 0.5)/this.gridX)|0)*this.gridX, y:(((pt.y + this.gridY * 0.5)/this.gridY)|0)*this.gridY};
        }
        return {x:pt.x, y:pt.y};
    }
    convShapePos(obj) {
        if(!obj.shapeOrgX)
            return obj.shapePos;
        const s = obj.shapePos;
        const p = [];
        const rcOrg = {x:obj.shapeOrgX, y:obj.shapeOrgY, w:obj.shapeOrgW, h:obj.shapeOrgH};
        const rcProj = {x:obj.x, y:obj.y, w:obj.w, h:obj.h};
        for(let i = 0; i < s.length; ++i) {
            p.push(this.projPt(s[i], rcOrg, rcProj));
        }
        return p;
    }
    getPt(e) {
        this.curPtScr = {x:e.x, y:e.y};
        this.curPtCanvas = {x:e.x - this.canvasRc.left, y:e.y - this.canvasRc.top};
        this.curPt = this.rzoomPt(this.curPtCanvas);
        this.curPtGrid = this.gridize(this.curPt);
    }
    getShapeBoundingBox(obj) {
        let x1 = obj.shape[0].x;
        let y1 = obj.shape[0].y;
        let x2 = obj.shape[0].x;
        let y2 = obj.shape[0].y;
        for(let i in obj.shape) {
            const pt = obj.shape[i];
            if(pt.x < x1) x1 = pt.x;
            if(pt.y < y1) y1 = pt.y;
            if(pt.x > x2) x2 = pt.x;
            if(pt.y > y2) y2 = pt.y;
        }
        return {x1:x1, y1:y1, x2:x2, y2:y2};
    }
    adjustShapeBox(obj) {
        const rc = this.getShapeBoundingBox(obj);
        const p1 = sp2px({x:rc.x1, y:rc.y1}, obj);
        const p2 = sp2px({x:rc.x2, y:rc.y2}, obj);
        obj.shapeOrgX = rc.x1;
        obj.shapeOrgY = rc.y1;
        obj.shapeOrgW = rc.x2 - rc.x1;
        obj.shapeOrgH = rc.y2 - rc.y1;
        obj.x = p1.x;
        obj.y = p1.y;
        obj.w = p2.x - p1.x;
        obj.h = p2.y - p1.y;
    }
    zoomX(x) {
        return x * this.zoom + this.offX;
    }
    zoomY(y) {
        return y * this.zoom + this.offY;
    }
    rzoomX(x) {
        return (x - this.offX) / this.zoom;
    }
    rzoomY(y) {
        return (y - this.offY) / this.zoom;
    }
    projPt(pt, rcOrg, rcProj) {
        const rw = rcProj.w / rcOrg.w;
        const rh = rcProj.h / rcOrg.h;
        return {x:(pt.x - rcOrg.x) * rw + rcProj.x, y:(pt.y - rcOrg.y) * rh + rcProj.y};
    }
    zoomPt(pt) {
        return {x:this.zoomX(pt.x)|0, y:this.zoomY(pt.y)|0};
    }
    rzoomPt(pt) {
        return {x:this.rzoomX(pt.x), y:this.rzoomY(pt.y)};
    }
    resize() {
//        console.log("resize");
        const height = document.documentElement.clientHeight - 70;
        const width = document.documentElement.clientWidth;
        this.winw = this.canvas1Elm.width = this.canvas2Elm.width = width;
        this.winh = this.canvas1Elm.height = this.canvas2Elm.height = height;
        this.canvas1Elm.style.width = this.canvas2Elm.style.width = width+"px";
        this.canvas1Elm.style.height = this.canvas2Elm.style.height = height+"px";
        document.getElementById("objpane").style.height = (height)+"px";
        document.getElementById("proppane").style.height = (height)+"px";
        this.canvasRc = this.canvas1Elm.getBoundingClientRect();
        if(this.ready)
            this.redraw();
    }
    markPt(type, col, pt) {
        switch(type) {
        case "R":
            this.ctx2.fillStyle = "#000";
            this.ctx2.fillRect(pt.x - 4, pt.y - 4, 8, 8);
            this.ctx2.fillStyle = col;
            this.ctx2.fillRect(pt.x - 3, pt.y - 3, 6, 6);
            break;
        case "C":
            this.ctx2.beginPath();
            this.ctx2.arc(pt.x, pt.y, 4, 0, Math.PI*2);
            this.ctx2.fillStyle = "#000";
            this.ctx2.fill();
            this.ctx2.beginPath();
            this.ctx2.arc(pt.x, pt.y, 3, 0, Math.PI*2);
            this.ctx2.fillStyle = col;
            this.ctx2.fill();
            break;
        }
    }
    export() {
        let link = document.createElement("a");
        link.href = this.canvas3Elm.toDataURL("image/png");
        link.download = "untitled.png";
        link.click();
    }
    loadPalette() {
        let link = document.createElement("input");
        link.setAttribute("type", "file");
        link.onchange = e=>{
            const f = e.target.files[0];
            const reader = new FileReader();
            reader.onload = e=>{
                const json = JSON.parse(e.target.result);
                for(let i in json.palette) {
                    document.getElementById(`prop.colPal${i}`).style.background = json.palette[i];
                }
                editor.redraw();
            }
            reader.readAsText(f);
        }
        link.click();        
    }
    savePalette() {
        const pal = createPal();
        let data = {
            palette:pal
        }
        const json = JSON.stringify(data, null, " ");
        const blob = new Blob([json], {type:"application/json"});
        let link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = "untitled.pal.json";
        link.click();
    }
    loadJson() {
        let link = document.createElement("input");
        link.setAttribute("type", "file");
        link.onchange = e=>{
            const f = e.target.files[0];
            const reader = new FileReader();
            reader.onload = e=>{
                const json = JSON.parse(e.target.result);
                editor.setImageSize(json.document.width, json.document.height);
                if(json.document.grid)
                    editor.setGrid(json.document.grid.x, json.document.grid.y);
                objRoot.list = json.root.list;
                editor.redraw();
            }
            reader.readAsText(f);
        }
        link.click();
    }
    saveJson() {
        for(let o of objRoot.entries(1, 0, 0)) {
            delete o.temp;
        }
        const pal = createPal();
        let data = {
            document:{
                width:this.docw,
                height:this.doch,
                grid:{x:this.gridX, y:this.gridY}
            },
            palette:pal,
            root:objRoot
        }
        const json = JSON.stringify(data, null, " ");
        const blob = new Blob([json], {type:"application/json"});
        let link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = "untitled.skin.json";
        link.click();
    }
    drawGradEdit(ctx, obj) {
        const p0 = this.zoomPt({x:obj.x + obj.w * obj.colGradX1, y:obj.y + obj.h * obj.colGradY1}, obj);
        const p1 = this.zoomPt({x:obj.x + obj.w * obj.colGradX2, y:obj.y + obj.h * obj.colGradY2}, obj);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.setLineDash([1]);
        ctx.stroke();
        this.markPt("C", "#0f0", p0, obj);
        this.markPt("C", "#f00", p1, obj);
    }
    drawShapeEdit(ctx, obj) {
        ctx.setLineDash([1]);
        ctx.beginPath();
        for(let i = 0; i < obj.shape.length; i += 3) {
            const p0 = this.zoomPt(sp2px(obj.shape[i], obj), obj);
            const p1 = this.zoomPt(sp2px(obj.shape[i + 1], obj), obj);
            const p2 = this.zoomPt(sp2px(obj.shape[i + 2], obj), obj);
            if(i >= 2) {
                const pp2 = this.zoomPt(sp2px(obj.shape[i - 2], obj), obj);
                const pp1 = this.zoomPt(sp2px(obj.shape[i - 1], obj), obj);
                ctx.moveTo(pp2.x, pp2.y);
                ctx.bezierCurveTo(pp1.x, pp1.y, p0.x, p0.y, p1.x, p1.y);
            }
            if(i == (this.shapeVtx - this.shapeVtx % 3)) {
                ctx.moveTo(p0.x, p0.y);
                ctx.lineTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
                this.markPt("C", "#fff", p0, obj);
                this.markPt("C", "#fff", p2, obj);
            }
            if(i == 0)
                this.markPt("R", "#0f0", p1, obj);
            else
                this.markPt("R", "#fff", p1, obj);
        }
    }
    redraw() {
//        console.log("redraw");
        this.objView.build();
        this.ctx1.globalCompositeOperation="source-over";
        this.ctx2.fillStyle = "#000";
        this.ctx2.clearRect(0, 0, this.winw, this.winh);
        this.ctx3.clearRect(0, 0, this.docw, this.doch);

        if(objSel)
            objSel.getSelBox();

        for(let o of objRoot.entries(1, 1, 0)) {
            if(o.visible)
                this.drawObj(this.ctx3, o);
        }
        if(this.newObj) {
            if(this.newObj.type == "Shape")
                this.drawShapeEdit(this.ctx2, this.newObj);
            else
                this.drawObj(this.ctx3, this.newObj);
        }
        this.ctx1.fillStyle="#666";
        this.ctx1.fillRect(0, 0, this.winw, this.winh);
        this.ctx1.fillStyle="#fff";
        this.ctx1.imageSmoothingEnabled = false;
        this.ctx1.fillRect(this.zoomX(0), this.zoomY(0), this.docw*this.zoom, this.doch*this.zoom);
        this.ctx1.drawImage(this.canvas3Elm, 0, 0, this.docw, this.doch, this.zoomX(0)|0, this.zoomY(0)|0, this.docw*this.zoom|0, this.doch*this.zoom|0);

        if(this.curObj && this.curObj.type == "Shape" && this.shapeEdit) {
            this.drawShapeEdit(this.ctx2, this.curObj);
        }
        this.ctx2.fillStyle = "#000";
        if(this.grid.show && this.gridX * this.zoom >= 8 && this.gridY * this.zoom >= 8) {
            for(let y = 0; y < this.doch; y += this.gridY) {
                for(let x = 0; x < this.docw; x  += this.gridX) {
                    this.ctx2.fillStyle = "#000";
                    this.ctx2.fillRect(this.zoomX(x)|0, this.zoomY(y)|0, 1, 1);
                }
            }
        }
        if(this.hitDrag.t == "n") {
//            console.log("hitDrag", this.hitDrag)
            if(this.hitDrag.pt) {
                const pt1 = this.zoomPt(this.hitDrag.pt);
                this.ctx2.beginPath();
                this.ctx2.rect(pt1.x, pt1.y, this.zoomX(this.curPt.x) - pt1.x, this.zoomY(this.curPt.y) - pt1.y);
                this.ctx2.setLineDash([1,3]);
                this.ctx2.stroke();
            }
        }
        else if(objSel.list.length >= 2 || (this.curObj && (!this.gradEdit || !(this.curObj.type == "Shape" && this.shapeEdit)))) {
            const pt1 = this.zoomPt(objSel.pt1);
            const pt2 = this.zoomPt(objSel.pt2);

            this.ctx2.beginPath();
            this.ctx2.moveTo(pt1.x, 0);
            this.ctx2.lineTo(pt1.x, this.winh);
            this.ctx2.moveTo(pt2.x, 0);
            this.ctx2.lineTo(pt2.x, this.winh);
            this.ctx2.moveTo(0, pt1.y);
            this.ctx2.lineTo(this.winw, pt1.y);
            this.ctx2.moveTo(0, pt2.y);
            this.ctx2.lineTo(this.winw, pt2.y);
            this.ctx2.setLineDash([1,3]);
            this.ctx2.stroke();
            if(!this.gradEdit && !this.shapeEdit) {
                this.markPt("R", "#fff", pt1);
                this.markPt("R", "#fff", {x:pt1.x, y:pt2.y});
                this.markPt("R", "#fff", pt2);
                this.markPt("R", "#fff", {x:pt2.x, y:pt1.y});
            }
        }
        if(this.curObj && this.gradEdit) {
            this.drawGradEdit(this.ctx2, this.curObj);
        }

    }
}

function init() {
    console.log("init"); 
    objRoot = new Obj("Group", null, 0, 0, 1024, 768);
    objSel = new ObjSel();
    objRoot.name = "root";
    objClipboard = null;
    editor = new Editor();
    window.addEventListener("resize", e=>{
        editor.resize();
    });
    document.addEventListener("wheel", e=>{
        if(e.target.id=="canvas2") {
            e.preventDefault();
            e.stopPropagation();
        }
    }, {passive:false})
    document.addEventListener("beforeunload", e=>{
        console.log("beforeunload")
        if(confirm("Are you sure??")) {
            e.preventDefault();
            return "Are you sure?";
        }
    })
}
/*
const testGroup = [
    {type:"Group",
        list:[{type:"Rect"}]
    },
    {type:"Rect"},
    {type:"Circle"},
    {type:"Text"},
    {type:"Group",
        list:[
                    {type:"Shape"}
        ],
    },
    {type:"Shape"}
];

function test() {
    let og = new Obj();
    og.set(testGroup);

    console.log(og)
    for(let o of og.entries(1,0,0)) {
        console.log(o)
//        console.log(o.o);
    }
    console.log("len", og.len())
*/
//    og.adjust();
//}

window.onload = () => {
//    test();
    init();
}
