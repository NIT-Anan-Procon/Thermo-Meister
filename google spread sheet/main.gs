//温度グラフ表示
function temp(){
  view.clear(); //ビューシートのクリア
  destroyGraph(mainpage.getCharts());
  destroyGraph(simulationpage.getCharts());
  destroyGraph(detailpage.getCharts());
  var diff = originrng.offset(7, 6).getValue();
  getdropdowndatedata(mainpage,diff);
  var modulename = originrng.offset(7,1).getValue();
  var start = Moment.moment([2018, originrng.offset(16, 2).getValue()-1, originrng.offset(16, 3).getValue(), 15, 00, 00]);
  var datarange = graphrange(0,modulename,start,diff);
  var viewrange = view.getRange(1,1,diff,5);
  viewrange.setValues(datarange.getValues());
  view.getRange(1,1,diff,1).setNumberFormat('yyyy-mm-dd');
  view.getRange(1,2,diff,3).setNumberFormat('0.0');
  originrng.offset(19,14,1,4).setValues([["赤：最高温度","黄：平均温度","青：最低温度","橙：外気平均温度"]]);
  makeGraph(mainpage,viewrange);
}

//詳細グラフ表示
function detail(){
  view.clear();
  destroyGraph(mainpage.getCharts());
  destroyGraph(simulationpage.getCharts());
  destroyGraph(detailpage.getCharts());
  var diff = detailrng.offset(7, 9).getValue();
  getdropdowndatedata(detailpage,diff);
  var modulename = detailrng.offset(7,1).getValue();
  var start = Moment.moment([2018, detailrng.offset(16, 2).getValue()-1, detailrng.offset(16, 3).getValue(), 15, 00, 00]);
  var interval = 0;
  var checkbox = detailpage.getRange(8,7,4,1).getValues();
  Logger.log(checkbox);
  for(var i=1; i<channel.length; i++){
    if(checkbox[i-1][0]){ 
      var range = graphrange(i,modulename,start,diff);
      var data = range.getValues();
      detailrng.offset(19,14).setValue("赤："+stringchannel[i]);
      var setrng = view.getRange(1,1+interval,1100,2);
      setrng.setValues(data);
      view.getRange(1,1+interval,1100,1).setNumberFormat('yyyy-mm-dd h:mm');
      view.getRange(1,2+interval,1100,1).setNumberFormat('0.0');
      interval+=3;
      makeGraph(detailpage,setrng);
    }
  }
}

//データシートから必要なデータ範囲を取得する
function graphrange(i,modulename,start,diff){
  title = stringchannel[i];
  var dat = datapage[i].getDataRange().getValues();
  if(i==0)rowtargetcol=checktargetcol(modulename,datapage[i],5);
  else rowtargetcol=checktargetcol(modulename,datapage[i],3);
  for(rowlastlow=getLastRows(datapage[i],rowtargetcol+1);rowlastlow>=3;rowlastlow--){
    var target = Moment.moment(dat[rowlastlow-1][rowtargetcol]).zone("+09:00");
    if(target.isBefore(start, 'day')){
      rowlastlow++;
      break;
    }
  }
  if(i==0){
    return datapage[i].getRange(rowlastlow+1,rowtargetcol+1,diff,5);
  }else{
    return datapage[i].getRange(rowlastlow+1,rowtargetcol+1,1100,2);
  }   
}