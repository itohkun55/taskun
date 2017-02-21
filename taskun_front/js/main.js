/*global   angular*/


var taskun=angular.module('taskun',['ngResource','mgcrea.ngStrap','ngAnimate','ngRoute']);

taskun.config(['$routeProvider',function($routeProvider){
        
    $routeProvider.when('/field/:id',{
        templateUrl: 'html/directive/scheduleMain.html',
        controller:"scheduleTokenControl"
    })
}]);

var topBase=0;
var yBase=15;
var popoverDir=["top","bottom","left","right"];
var timeNames=["7:00","8:00","9:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00"];
  
taskun.controller('scheduleScale',function($scop){
    //console.log("  IN ANGULAR s ");

    var timeObj={time:"0:00",ypos:0};
    
    this.timeArray=[ ];

    var yCurr=0;
    for(var name of timeNames){
        var thistime=Object.assign({},timeObj);
        thistime.time=name;

        thistime.ypos=yCurr;
        yCurr+=yBase;
        this.timeArray.push(thistime);

    }
});


//taskun.service('LoaderService',function($scope,$resource,$log){
taskun.service('LoaderService',['$resource','$log',function($resource,$log){
    //通信はフィールドとスケジュールをワンセットで送り、
    this.url="";
    
     this.setUrl=function(url){
        this.url=url;
    };
    
    this.loadData=function(callback){
        
        var res=$resource(this.url);
        var data=res.get();
        data.$promise.then(function(){
            
            
            callback(data);
    
        });
    };
}]);


taskun.controller('LocalTestLoader',['LoaderService','$log','$scope','MainDataService',function(LoaderService,$log,$scope,MainDataService){

    $log.log("FFFFFFF");
    
  
    LoaderService.setUrl("./js/services/testdata.json");
    MainDataService.onMove=true;
    MainDataService.onload=true;
    $scope.schList=[];
    LoaderService.loadData(function(result){
        //console.log("DATA llllllllll"+data);
        $scope.showFieldId=-1;
        MainDataService.dataSave(result);
        $scope.fields=MainDataService.showFieldsData([-1]);
        MainDataService.onload=false;
        
    });
}]);


taskun.controller('scheduleTokenControl',['$scope','MainDataService','$interval','$timeout',function($scope,MainDataService,$interval,$timeout){
    
    $scope.timeArray=MakeTimeArray();
    //起動確認が取れていない時、ロード中では非同期処理を実行する
    if(MainDataService.onload||!MainDataService.onMove){
        var timer = $interval(function() {
            if(!MainDataService.onload){
                $interval.cancel(timer);
                 $timeout(function () {
                    $scope.schList=MainDataService.showScheduleDataByFieldId([$scope.showFieldId]);
                });
            }        
        }, 500);
    }else{
        console.log("====  ONLOAD FALSE  ===");
        //$scope.showFieldId=$routeParams.field;
        $scope.schList=MainDataService.showScheduleDataByFieldId([$scope.showFieldId]);
    }
    
    $scope.onFieldClick=function(id){
        $scope.showFieldId=id;
        $scope.schList=[];
        var timer = $timeout(function() {
                
            $scope.schList=MainDataService.showScheduleDataByFieldId([$scope.showFieldId]);
            //console.log("$scope.schList  :"+$scope.schList.length);
        }, 500);
        
    }
    
    //popoverでのフィールド選択によるModal表示
    $scope.onFieldSelectClick=function(id){
        //各Fieldごとのカテゴリの情報を表示する特になければ空白
        
        //情報がタスクなら、報告のボタンが表示される
        
        //
        
    }
    
}]);

taskun.controller('FieldModalControl',['$ui'])

function MakeTimeArray(){
    
    var timeObj={time:"0:00",ypos:0};
    var timeArray=[ ];
    var yCurr=0;
    
    for(var name of timeNames){
        var thistime=Object.assign({},timeObj);
        thistime.time=name;

        thistime.ypos=yCurr;
        yCurr+=yBase;
        timeArray.push(thistime);
    }
    return timeArray;
}

taskun.directive("scheduleToken",function($popover,MainDataService){
//taskun.directive("scheduleDetail",function(){
    return{
        restrict:'AE',
        templateUrl:"./html/directive/scheduleToken.html",
        link:function(scope,element){
            //トークンの表示はここで変えるしかない
            
            
                    
            scope.onTokenClick=function(id,$event){
                scope.showid=id;
                
                scope.detailTarget=MainDataService.showScheduleById(id);
                 //ターゲットからフィールドID抽出
                 var fieldsId= scope.detailTarget.fieldId.split(",");
                 //そのフィールドのタスクが終わっている場合はボタンの色を変える
                 scope.targetFields=MainDataService.showFieldsData(fieldsId);
            }     
            //console.log("element "+element);
            //
        }
        
    }
});


taskun.directive("scrollTabs",function($window){
//taskun.directive("scheduleDetail",function(){
    return{
        restrict:'AE',
        link:function(scope,element){
           
        }
        
    }
});



taskun.service('MainDataService',["ListDataSetter", function(ListDataSetter){
    this.onMove=false;
    
    //this.onload=false;
    this.currentSchedule=[];
    this.fieldsData=[];
    this.userData=[];
    this.data=[];
    
    this.dataSave=function(data){
       // this.onload=true;
        //this.data=data;
        if(data["mainschd"]!=undefined){
            
            this.data=data["mainschd"];
            for(var sch of this.data){                  //
                //　実際にロードされるデータはUNIXTIMEだが、今は手入力なのでここで変換しておく。データをロードするようになったら
                //　この処理は削除する
                sch.starttime=new Date(sch.start).getTime();
                sch.endtime=new Date(sch.end).getTime();
                if(sch.starttime>sch.endtime)  throw Error(" End time is invalid -- endtime start before starttime ");
            }
            
            this.currentSchedule=ListDataSetter.setNewScheduleData(this.data);
        } 
        
        if(data["fielddata"]!=undefined) this.fieldsData=data["fielddata"];
        if(data["userdata"]!=undefined) this.userData=data["userdata"];
        
        this.onload=false;
    };
    
    this.showFieldsInGroup=function(groupId){
    //しばらくグループ分けを考慮しないため
        var targetid=groupId===undefined? 0:groupId;
    };
    
    this.showScheduleById=function(id){
        var resultArray=this.currentSchedule.filter(function(obj){
           if(obj.id===id) return true;
            return false;
        });
        if(resultArray.length==0) throw Error("No Schedue in" +id);
        return resultArray[0];
    }
    
    this.showScheduleDataByFieldId=function(idArray){
        //いくつかID決め打ちで特定のスケジュールを取得するようにしておく
        
        if(idArray[0]===-1) return this.currentSchedule;
        
        
        
       var showData= this.data.filter(function(obj){
           console.log(" obj.fieldId "+obj.fieldId);
           var schFieldIds=obj.fieldId.split(",");
           
           for(var id of idArray){
                console.log("schFieldIds:"+schFieldIds+"  id:"+id);
               if(schFieldIds.indexOf(id)>0) return true;
           }
           
            return false;
        });
        
        return ListDataSetter.setNewScheduleData(showData);
        
    };
    
    this.showFieldsData =function(idArray){
    
        if(idArray[0]===-1) return this.fieldsData;
        
       return this.fieldsData.filter(function(obj){
            if(idArray.indexOf(obj.id)>0) return true;
            
            return false;
        });
    }
    
}]);

//このサービスの役目はデータの加工のみ　自分でデータを保存はしない方針
taskun.service("ListDataSetter", function (){

    this.setNewScheduleData=function(listData){
        this.schList=new ScheduleList(); 
        for( var schData of listData)  this.schList.putScheduleInLane(schData);
        
        return this.schList.getLanes();
    }
    
    this.loadScheduleData=function(){
        return this.schList;
    }
    
    
    this.getSchedule=function(id){
        var schTarget=this.schList.filter(function(obj){
            if(obj.id===id) return true;
            
            return false;
        });
        
        if(schTarget.length===0) return null;
        var detailTarget=schTarget[0] 
        
        return detailTarget ;
        
    }
    
    function ScheduleList(){
    //スケジュールのレーンの配列
        var scheduleTimeLanes=[];
        
        this.getLanes=function(){
            var resultLanes=[];
            var laneNum=0;
            for(var lane of scheduleTimeLanes ){
                for(var  sch of lane.laneTask){
                    sch.lane=laneNum;
                    resultLanes.push(sch);
                   // console.log("メッセージ追加");
                }
                laneNum++;
                //    console.log("レーン追加");
            }
            return resultLanes;
        }
    
        this.getLane =function(num){
            if(scheduleTimeLanes.length<=num)return [];
            return scheduleTimeLanes[num];
        };
        
        
        this.getMaxLane=function(){
            return scheduleTimeLanes.length;
        }
    
        //提出されたスケジュールをレーンに仕分けして挿入していく
        //  挿入する先がなければ新規にレーンを作成していく
        this.putScheduleInLane=function(schedule){
            var curlaneId=0;
            for(var lane of scheduleTimeLanes){
                if(lane.canSetSchedule(schedule)){
                    lane.setScheduleInLane(schedule);
                    return;
                }
                curlaneId++;
            }
            //時間がどこもかぶっていた→新規でレーンを作る
            var newLane=new timelane(scheduleTimeLanes.length);
            newLane.setScheduleInLane(schedule);
           // newLane.laneID=curlaneId;
            scheduleTimeLanes.push(newLane);

        };

        function timelane(num){
            //自分が何番目のレーンか
            this.laneID=num;
    
            //自分のレーンに所属するスケジュールの配列（ソートして利用）
            this.laneTask=[];
            
            var formatDate=function(dateNum){
                var date=new Date(dateNum);
                
                var min=date.getMinutes();
                var minStr=min.toString();
                if(min<10) minStr="0"+minStr;
                
                return date.getHours()+":"+minStr;
            }
                
            
            this.setScheduleInLane=function(sch){
                //時間とレーンに合わせてレイアウト情報を設置
                
                sch.start=formatDate(sch.starttime);
                
                sch.end=formatDate(sch.endtime);
                
                sch.height=(sch.endtime-sch.starttime)/1000/60/60*yBase;     //6*100;
                
                //TODO: 開始時間を変数で取得
                var scaleStart=7;
                var sdate=new Date(sch.starttime);
                sch.top=(sdate.getHours()-scaleStart + sdate.getMinutes()/60)/(100/yBase) *100 ;
                sch.left=(this.laneID*30)+10;
        
                sch.laneId=this.laneID;
                
                if(this.laneID%3===0) sch.popoverDir="right";  
                if(this.laneID%3===1) sch.popoverDir="bottom";
                if(this.laneID%3===2) sch.popoverDir="left";  
                
                this.laneTask.push(sch);
            };
            
            this.getScheduleInLane=function(num){
                return this.laneTask[num];
            };
            
            this.canSetSchedule=function(schedule){
                this.checkScheduleFormat(schedule);
                
                if(this.laneTask.length===0) return true;
                var idleTimeArray=[];
                var idleStartTime=0;
                
                var lastSc={start:0,end:0};
                //現時点の空き時間配列を作成
                
                for(var s=0;s<this.laneTask.length;s++){
                    var testSc=this.laneTask[s];
                    idleTimeArray.push({start:lastSc.endtime,end:testSc.starttime});
                    lastSc=testSc;
                }
                
                
                
                idleTimeArray.push({start:lastSc.endtime,end:3000*365*24*60*60*1000})
               // console.log("----空き場所"+idleTimeArray.length+"---"+this.laneID);
               var lastidle;
              
                for(var idle of idleTimeArray){
                    lastidle=idle;
              // console.log("idle.start:"+  formatDate(idle.start)+"  schedule.starttime:"+formatDate(schedule.starttime)+"  idle.end:"+formatDate(idle.end) +"  schedule.endtime:"+ formatDate(schedule.endtime));
          
                    if(idle.start>schedule.endtime) {
                     //   console.log("空き時間前に開始時間が入っている "+idle.);
                        continue;
                    }
                    
                    if(idle.start<=schedule.starttime&& idle.end>=schedule.endtime) {
                       // console.log("  TRUE  ");
                        
                        //console.log("idle.start<=schedule.starttime "+ idle.start+":"+schedule.starttime);
                        //console.log("idle.end>=schedule.endtime "+ idle.end+":"+schedule.endtime);
                        
                        
                        return true;
                    }
    
                    if(idle.end>schedule.starttime) break;
                }
                console.log("  FALSE  ");
                return false;
            };
    
            this.checkScheduleFormat=function(schedule){
                if(schedule===undefined) throw Error("Schedule undefined");
    
                if(schedule.starttime===undefined) throw Error("start time undefined");
                if(schedule.endtime===undefined) throw Error("end time undefined");
                
                return;
            };
        }
    }
    
    this.loadFieldData=function () {
        // body...
    }
    

});