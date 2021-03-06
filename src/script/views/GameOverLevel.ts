import BaseView from "./BaseView";
import EventMgr from "../mgrCommon/EventMgr";
import PlatformMgr from "../mgrCommon/PlatformMgr";
import ConfigData, { SORTTYPE } from "../models/ConfigData";
import MyUtils from "../tools/MyUtils";

export default class GameOverLevel extends BaseView {
    private btnNext:Laya.Image;
    private btnHome:Laya.Image;
    private btnAgain:Laya.Image;
    private btnFight:Laya.Image;

    private imgFail:Laya.Image;
    private imgPass:Laya.Image;
    private btnAnchor:Laya.Image;

    private levePanel:Laya.Image;
    private scorePanel:Laya.Image;

    private score:Laya.FontClip;
    private passNum:Laya.FontClip;

    private adList:Laya.List;
    private adData:any[];
    private adDataRandom:any[];

    constructor() { super(); }
    
    onAwake(): void {
        super.onAwake();

        let content = this.owner.getChildByName("content") as Laya.Image;
        let btnAnchor = content.getChildByName("btnAnchor") as Laya.Image;
        this.btnAnchor = btnAnchor;

        this.btnNext = btnAnchor.getChildByName("btnNext") as Laya.Image;
        this.btnHome = btnAnchor.getChildByName("btnHome") as Laya.Image;
        this.btnAgain = btnAnchor.getChildByName("btnAgain") as Laya.Image;
        this.btnFight = btnAnchor.getChildByName("btnFight") as Laya.Image;

        let levePanel = content.getChildByName("levelPanel") as Laya.Image;
        this.passNum = levePanel.getChildByName("passNum") as Laya.FontClip;
        this.imgFail = levePanel.getChildByName("imgFail") as Laya.Image;
        this.imgPass = levePanel.getChildByName("imgPass") as Laya.Image;
        this.levePanel = levePanel;
        
        this.imgFail.visible = false;
        this.imgPass.visible = false;
        
        let scorePanel = content.getChildByName("scorePanel") as Laya.Image;
        this.scorePanel = scorePanel;
        this.score = scorePanel.getChildByName("clipScore") as Laya.FontClip;

        this.adList = content.getChildByName("listAd") as Laya.List;
        this.adList.array = [];
        this.adList.renderHandler = new Laya.Handler(this, this.onRender);
        this.adList.mouseHandler = new Laya.Handler(this, this.onClickItem);
        this.adList.vScrollBarSkin = "";
        this.adData = ConfigData.getAdData(1003);
        if(this.adData.length >6){
            this.adDataRandom = this.adData.slice(6,this.adData.length);
            this.adData.length = 6;
        }
    }
    
    goFighting(){
        //再次挑战
        EventMgr.instance.emit("openFighting",this._data);
        this.closeView();
    }

    goHome(){
        EventMgr.instance.emit("goHome");
        this.closeView();
    }

    goShare(){
        let _d = {
            caller:this,
            callback:(res)=>{
                if(!res.success){
                    EventMgr.instance.emit("openTip","分享失败");
                }
            },
            type:0
        };
        PlatformMgr.callAPIMethodByProxy("shareAppMessage",_d);
    }

    addEvent(){
        this.btnNext.on(Laya.Event.CLICK,this,this.nextLevelFunc);
        this.btnHome.on(Laya.Event.CLICK,this,this.goHome);
        this.btnAgain.on(Laya.Event.CLICK,this,this.goFighting);
        this.btnFight.on(Laya.Event.CLICK,this,this.goShare);
        super.addEvent();
    }

    public removeEvent() {
        this.btnNext.off(Laya.Event.CLICK,this,this.nextLevelFunc);
        this.btnHome.off(Laya.Event.CLICK,this,this.goHome);
        this.btnAgain.off(Laya.Event.CLICK,this,this.goFighting);
        this.btnFight.off(Laya.Event.CLICK,this,this.goShare);
        super.removeEvent();
    }

    nextLevelFunc(){
        //下一关
        EventMgr.instance.emit("openFighting",this._data);
    }
    
    onEnable():void{
        super.onEnable();
        PlatformMgr.callAPIMethodByProxy("showBannerAdClassicEnd",true);
    }

    onDisable(): void {
        super.onDisable();
        PlatformMgr.callAPIMethodByProxy("destroyBannerAdClassicEnd");
    }

    openView(data?: any){
        super.openView(data);
        data = data || {
            passNum:10,//当前的关卡数
            isPass:(Math.random() > 0.5),//是否通关
            _type:(Math.random() > 0.5) ? SORTTYPE.ENDLESS : SORTTYPE.LEVEL,//得分模式 闯关模式
        }
        //需要获取广告
        this.adList.array = this.adData;
        this.adList.refresh();
        //得分模式，显示等分
        if(data._type == SORTTYPE.ENDLESS){
            this.scorePanel.visible = true;
            this.levePanel.visible = false;
            this.score = data.score;
            this.btnAgain.visible = true;
            this.btnNext.visible = false;
            //上传分数
            PlatformMgr.callAPIMethodByProxy("uploadRankDate",{score:data.score});
        }else{
            this.scorePanel.visible = false;
            this.levePanel.visible = true;
            this.imgFail.visible = !data.isPass;
            this.imgPass.visible = data.isPass;
            this.btnNext.visible = data.isPass;
            this.btnAgain.visible = !data.isPass;
            this.passNum.value = data.passNum.toString();
            //适配 是数字和“关”字居中
            let length  = data.passNum.toString().length - 1;
            this.passNum.x = -52 + 26 * length;
            //上传分数
            PlatformMgr.callAPIMethodByProxy("uploadRankDate",{level:data.passNum});
        }

        if (ConfigData.ctrlInfo.isWudian) {
            let btnJumpY = 560;
            let randomY = MyUtils.random(btnJumpY, btnJumpY + 30);
            this.btnAnchor.y = randomY;
            Laya.timer.once(ConfigData.ctrlInfo.lateDelay, this, () => {
                PlatformMgr.callAPIMethodByProxy("showBannerAdClassicEndFast");
                Laya.Tween.to(this.btnAnchor, {y: 320 }, 500, Laya.Ease.backOut, null, 500);
            });
        } else {
            this.btnAnchor.y = 320;
            PlatformMgr.callAPIMethodByProxy("showBannerAdClassicEndFast");
        }
    }

    onRender(cell: Laya.Box, index: number): any {
        let img = cell.getChildAt(0) as Laya.Image;
        img.skin = this.adData[index].param;
    }

    onClickItem(e:Laya.Event, index): void {
        if (e.type == Laya.Event.CLICK) {
            if ((e.target) instanceof Laya.Box) {
                let cell:Laya.Box = e.target;
                

                //跳转到其他小游戏 
                let adInfo = this.adData[index];
                var _d: any = {
                    my_uuid: adInfo.position,
                    to_appid: adInfo.appid,
                    appid : adInfo.appid,
                    toLinks : adInfo.toLinks,
                    notShowAd:true,
                };
                if(this.adDataRandom.length > 0){ //点击后主换6个之后的
                    let img = cell.getChildAt(0) as Laya.Image;
                    this.adDataRandom.push(adInfo);
                    this.adData[index] = this.adDataRandom.shift();
                    img.skin = this.adData[index].param;
                }
                PlatformMgr.callAPIMethodByProxy("navigateToMiniProgram",_d);
            }
        }
    }




}